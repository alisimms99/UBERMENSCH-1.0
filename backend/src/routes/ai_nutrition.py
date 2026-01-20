from flask import Blueprint, request, jsonify
from openai import OpenAI
from datetime import datetime, timedelta
from ..models.models import db, DailyMetrics, NutritionCoachSession, MealLog
import json
import os
import logging

ai_nutrition_bp = Blueprint('ai_nutrition', __name__)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize OpenAI client
client = None
if os.getenv('OPENAI_API_KEY'):
    client = OpenAI()
    logger.info("OpenAI client initialized for Nutrition Coach")
else:
    logger.warning("OPENAI_API_KEY not found - Nutrition Coach unavailable")

# User profile (hardcoded for MVP)
USER_PROFILE = {
    'age': 56,
    'gender': 'male',
    'on_trt': True,
    'goals': [
        'Lose body fat',
        'Preserve muscle mass',
        'Improve energy levels'
    ],
    'diet_preferences': 'No specific restrictions, prefers whole foods, protein-focused',
    'eating_window': 'Can do intermittent fasting if beneficial',
    'protein_target': '180-200g per day',  # ~1g per lb lean mass
    'considerations': [
        'TRT allows better protein utilization',
        'Benefits from healthy fats for hormone support',
        'Previously had digestive issues (now resolved)',
        'Non-chef - needs simple recipes'
    ]
}

def get_recent_metrics(user_id, days=7):
    """Get recent daily metrics for nutrition context"""
    start_date = datetime.utcnow().date() - timedelta(days=days)
    
    metrics = DailyMetrics.query.filter(
        DailyMetrics.user_id == user_id,
        DailyMetrics.date >= start_date
    ).order_by(DailyMetrics.date.desc()).all()
    
    if not metrics:
        return "No recent metrics logged"
    
    summary = []
    for m in metrics:
        date_str = m.date.strftime('%Y-%m-%d')
        parts = [f"{date_str}:"]
        
        if m.morning_energy_level:
            parts.append(f"Energy {m.morning_energy_level}/5")
        if m.evening_digestion:
            parts.append(f"Digestion {m.evening_digestion}/5")
        if m.evening_stamina:
            parts.append(f"Stamina {m.evening_stamina}/5")
        
        summary.append(" ".join(parts))
    
    return "\n".join(summary)

def get_recent_meals(user_id, days=3):
    """Get recent meal logs for context"""
    start_date = datetime.utcnow() - timedelta(days=days)
    
    meals = MealLog.query.filter(
        MealLog.user_id == user_id,
        MealLog.logged_at >= start_date
    ).order_by(MealLog.logged_at.desc()).limit(10).all()
    
    if not meals:
        return "No recent meals logged"
    
    summary = []
    for meal in meals:
        date_str = meal.logged_at.strftime('%Y-%m-%d')
        summary.append(f"- {date_str} {meal.meal_type}: {meal.description}")
    
    return "\n".join(summary)

def build_meal_suggestion_prompt(meal_type, time_to_cook, ingredients, goal_focus, recent_metrics):
    """Build prompt for meal suggestion"""
    
    ingredients_text = ""
    if ingredients:
        ingredients_text = f"\nAVAILABLE INGREDIENTS: {', '.join(ingredients)}"
    
    time_text = ""
    if time_to_cook:
        time_text = f"\nTIME AVAILABLE: {time_to_cook} minutes"
    
    goal_text = ""
    if goal_focus:
        goal_text = f"\nGOAL FOCUS: {goal_focus}"
    
    prompt = f"""You are an expert nutrition coach specializing in body recomposition for men on TRT.

USER PROFILE:
- Age: {USER_PROFILE['age']}, {USER_PROFILE['gender']}
- On TRT (testosterone replacement therapy)
- Goals: {', '.join(USER_PROFILE['goals'])}
- Protein target: {USER_PROFILE['protein_target']}
- Diet preferences: {USER_PROFILE['diet_preferences']}

RECENT METRICS (Last 7 days):
{recent_metrics}

MEAL REQUEST:
- Meal type: {meal_type}
{time_text}
{ingredients_text}
{goal_text}

NUTRITION PRINCIPLES:
- High protein priority (30-50g per meal for muscle preservation)
- Moderate healthy fats (supports TRT and hormones)
- Carbs around workouts, lower otherwise for fat loss
- Simple, whole food recipes that a non-chef can make
- Consider digestive health (user had past issues)

TASK:
Suggest a meal that fits the request and user's goals.

Return ONLY valid JSON in this format:
{{
  "meal": {{
    "name": "Meal name",
    "description": "Brief description",
    "ingredients": ["ingredient 1", "ingredient 2", ...],
    "instructions": ["step 1", "step 2", ...],
    "macros": {{
      "calories": 500,
      "protein": 40,
      "carbs": 30,
      "fat": 20
    }},
    "prep_time": 15,
    "cook_time": 20
  }},
  "reasoning": "Why this meal fits the user's goals and request",
  "alternatives": [
    {{
      "name": "Alternative meal name",
      "description": "Brief description"
    }}
  ]
}}"""
    
    return prompt

def build_daily_plan_prompt(calorie_target, meals_per_day, fasting_window, recent_metrics):
    """Build prompt for daily meal plan"""
    
    calorie_text = f"Calorie target: {calorie_target}" if calorie_target else "Calorie target: ~2000-2200 (moderate deficit for fat loss)"
    meals_text = f"Meals per day: {meals_per_day}" if meals_per_day else "Meals per day: 3-4"
    fasting_text = ""
    if fasting_window:
        fasting_text = f"\nFasting window: {fasting_window.get('start')} to {fasting_window.get('end')}"
    
    prompt = f"""You are an expert nutrition coach. Create a daily meal plan for body recomposition.

USER PROFILE:
- Age: {USER_PROFILE['age']}, male, on TRT
- Goals: {', '.join(USER_PROFILE['goals'])}
- Protein target: {USER_PROFILE['protein_target']}

RECENT METRICS:
{recent_metrics}

PLAN PARAMETERS:
- {calorie_text}
- {meals_text}
{fasting_text}

REQUIREMENTS:
- Protein: 180-200g total
- Simple, whole food meals
- Distribute protein across meals
- Higher carbs if workout day, lower if rest day

Return ONLY valid JSON:
{{
  "plan": {{
    "meals": [
      {{
        "time": "12:00",
        "meal_type": "lunch",
        "suggestion": "Grilled chicken with rice and vegetables",
        "macros": {{"calories": 600, "protein": 50, "carbs": 60, "fat": 15}}
      }}
    ],
    "total_macros": {{
      "calories": 2000,
      "protein": 180,
      "carbs": 150,
      "fat": 70
    }},
    "notes": "Additional guidance or tips"
  }}
}}"""
    
    return prompt

def build_analyze_meal_prompt(description):
    """Build prompt for meal analysis"""
    
    prompt = f"""You are an expert nutrition coach. Analyze this meal and provide feedback.

USER PROFILE:
- Age: {USER_PROFILE['age']}, male, on TRT
- Goals: {', '.join(USER_PROFILE['goals'])}
- Protein target: {USER_PROFILE['protein_target']}

MEAL DESCRIPTION:
{description}

TASK:
1. Estimate macros (calories, protein, carbs, fat)
2. Provide feedback on how well it aligns with goals
3. Suggest improvements if needed

Return ONLY valid JSON:
{{
  "estimated_macros": {{
    "calories": 500,
    "protein": 40,
    "carbs": 30,
    "fat": 25
  }},
  "feedback": "Overall assessment of the meal",
  "suggestions": [
    "Suggestion 1",
    "Suggestion 2"
  ]
}}"""
    
    return prompt

@ai_nutrition_bp.route('/coach/meal-suggestion', methods=['POST'])
def suggest_meal():
    """Suggest a meal based on constraints and goals"""
    
    if not client:
        return jsonify({
            'error': 'Nutrition Coach requires OpenAI API key',
            'available': False
        }), 503
    
    try:
        data = request.json or {}
        user_id = data.get('user_id', 1)
        meal_type = data.get('meal_type', 'lunch')
        time_to_cook = data.get('time_to_cook')
        ingredients = data.get('ingredients_available', [])
        goal_focus = data.get('goal_focus')
        
        # Get recent metrics
        recent_metrics = get_recent_metrics(user_id)
        
        # Build prompt
        system_prompt = build_meal_suggestion_prompt(
            meal_type, time_to_cook, ingredients, goal_focus, recent_metrics
        )
        
        logger.info(f"Generating meal suggestion for user {user_id}: {meal_type}")
        
        # Call OpenAI
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Suggest a {meal_type} for me."}
            ],
            temperature=0.8,
            max_tokens=1200
        )
        
        ai_response = response.choices[0].message.content.strip()
        
        # Parse JSON
        try:
            result = json.loads(ai_response)
        except json.JSONDecodeError:
            if '```json' in ai_response:
                json_str = ai_response.split('```json')[1].split('```')[0].strip()
                result = json.loads(json_str)
            elif '```' in ai_response:
                json_str = ai_response.split('```')[1].split('```')[0].strip()
                result = json.loads(json_str)
            else:
                raise
        
        # Save session
        session = NutritionCoachSession(
            user_id=user_id,
            query_type='meal',
            input_json=json.dumps({
                'meal_type': meal_type,
                'time_to_cook': time_to_cook,
                'ingredients': ingredients,
                'goal_focus': goal_focus
            }),
            response_json=json.dumps(result)
        )
        db.session.add(session)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'session_id': session.id,
            **result
        })
        
    except Exception as e:
        logger.error(f"Error generating meal suggestion: {e}")
        return jsonify({
            'error': 'Failed to generate meal suggestion',
            'details': str(e)
        }), 500

@ai_nutrition_bp.route('/coach/daily-plan', methods=['POST'])
def generate_daily_plan():
    """Generate a full day meal plan"""
    
    if not client:
        return jsonify({
            'error': 'Nutrition Coach requires OpenAI API key',
            'available': False
        }), 503
    
    try:
        data = request.json or {}
        user_id = data.get('user_id', 1)
        calorie_target = data.get('calorie_target')
        meals_per_day = data.get('meals_per_day')
        fasting_window = data.get('fasting_window')
        
        # Get recent metrics
        recent_metrics = get_recent_metrics(user_id)
        
        # Build prompt
        system_prompt = build_daily_plan_prompt(
            calorie_target, meals_per_day, fasting_window, recent_metrics
        )
        
        logger.info(f"Generating daily meal plan for user {user_id}")
        
        # Call OpenAI
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": "Create my daily meal plan."}
            ],
            temperature=0.8,
            max_tokens=1500
        )
        
        ai_response = response.choices[0].message.content.strip()
        
        # Parse JSON
        try:
            result = json.loads(ai_response)
        except json.JSONDecodeError:
            if '```json' in ai_response:
                json_str = ai_response.split('```json')[1].split('```')[0].strip()
                result = json.loads(json_str)
            elif '```' in ai_response:
                json_str = ai_response.split('```')[1].split('```')[0].strip()
                result = json.loads(json_str)
            else:
                raise
        
        # Save session
        session = NutritionCoachSession(
            user_id=user_id,
            query_type='plan',
            input_json=json.dumps({
                'calorie_target': calorie_target,
                'meals_per_day': meals_per_day,
                'fasting_window': fasting_window
            }),
            response_json=json.dumps(result)
        )
        db.session.add(session)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'session_id': session.id,
            **result
        })
        
    except Exception as e:
        logger.error(f"Error generating daily plan: {e}")
        return jsonify({
            'error': 'Failed to generate daily plan',
            'details': str(e)
        }), 500

@ai_nutrition_bp.route('/coach/analyze-meal', methods=['POST'])
def analyze_meal():
    """Analyze a meal description and provide feedback"""
    
    if not client:
        return jsonify({
            'error': 'Nutrition Coach requires OpenAI API key',
            'available': False
        }), 503
    
    try:
        data = request.json or {}
        user_id = data.get('user_id', 1)
        description = data.get('description', '')
        
        if not description:
            return jsonify({'error': 'Meal description is required'}), 400
        
        # Build prompt
        system_prompt = build_analyze_meal_prompt(description)
        
        logger.info(f"Analyzing meal for user {user_id}: {description[:50]}...")
        
        # Call OpenAI
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": "Analyze this meal."}
            ],
            temperature=0.7,
            max_tokens=800
        )
        
        ai_response = response.choices[0].message.content.strip()
        
        # Parse JSON
        try:
            result = json.loads(ai_response)
        except json.JSONDecodeError:
            if '```json' in ai_response:
                json_str = ai_response.split('```json')[1].split('```')[0].strip()
                result = json.loads(json_str)
            elif '```' in ai_response:
                json_str = ai_response.split('```')[1].split('```')[0].strip()
                result = json.loads(json_str)
            else:
                raise
        
        # Save to meal log
        meal_log = MealLog(
            user_id=user_id,
            description=description,
            estimated_calories=result.get('estimated_macros', {}).get('calories'),
            estimated_protein=result.get('estimated_macros', {}).get('protein'),
            estimated_carbs=result.get('estimated_macros', {}).get('carbs'),
            estimated_fat=result.get('estimated_macros', {}).get('fat'),
            ai_feedback=result.get('feedback')
        )
        db.session.add(meal_log)
        
        # Save session
        session = NutritionCoachSession(
            user_id=user_id,
            query_type='analyze',
            input_json=json.dumps({'description': description}),
            response_json=json.dumps(result)
        )
        db.session.add(session)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'meal_log_id': meal_log.id,
            'session_id': session.id,
            **result
        })
        
    except Exception as e:
        logger.error(f"Error analyzing meal: {e}")
        return jsonify({
            'error': 'Failed to analyze meal',
            'details': str(e)
        }), 500

@ai_nutrition_bp.route('/coach/availability', methods=['GET'])
def check_availability():
    """Check if Nutrition Coach is available"""
    return jsonify({
        'available': client is not None,
        'model': 'gpt-4o-mini' if client else None
    })

@ai_nutrition_bp.route('/coach/sessions', methods=['GET'])
def get_sessions():
    """Get user's nutrition coach session history"""
    user_id = request.args.get('user_id', 1, type=int)
    limit = request.args.get('limit', 10, type=int)
    
    sessions = NutritionCoachSession.query.filter_by(
        user_id=user_id
    ).order_by(NutritionCoachSession.created_at.desc()).limit(limit).all()
    
    return jsonify({
        'sessions': [s.to_dict() for s in sessions]
    })

@ai_nutrition_bp.route('/coach/meal-logs', methods=['GET'])
def get_meal_logs():
    """Get user's meal log history"""
    user_id = request.args.get('user_id', 1, type=int)
    days = request.args.get('days', 7, type=int)
    
    start_date = datetime.utcnow() - timedelta(days=days)
    
    meals = MealLog.query.filter(
        MealLog.user_id == user_id,
        MealLog.logged_at >= start_date
    ).order_by(MealLog.logged_at.desc()).all()
    
    return jsonify({
        'meals': [m.to_dict() for m in meals]
    })
