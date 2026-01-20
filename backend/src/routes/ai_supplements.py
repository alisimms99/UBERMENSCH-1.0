from flask import Blueprint, request, jsonify
from openai import OpenAI
from datetime import datetime, timedelta
from ..models.models import db, Supplement, DailyMetrics, SupplementAdvisorSession
import json
import os
import logging

ai_supplements_bp = Blueprint('ai_supplements', __name__)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize OpenAI client
client = None
if os.getenv('OPENAI_API_KEY'):
    client = OpenAI()
    logger.info("OpenAI client initialized for Supplement Advisor")
else:
    logger.warning("OPENAI_API_KEY not found - Supplement Advisor unavailable")

# User profile (hardcoded for MVP)
USER_PROFILE = {
    'age': 56,
    'gender': 'male',
    'on_trt': True,
    'goals': [
        'Improve cardio endurance',
        'Lose body fat',
        'Preserve muscle mass',
        'Optimize energy levels'
    ],
    'considerations': [
        'TRT affects sleep, recovery, estrogen management',
        'May need DIM or calcium-d-glucarate for estrogen control',
        'Age 56 - focus on longevity and joint health'
    ]
}

def get_current_supplements(user_id):
    """Get user's current supplement list"""
    supplements = Supplement.query.filter_by(
        user_id=user_id,
        is_active=True
    ).all()
    
    if not supplements:
        return []
    
    supp_list = []
    for supp in supplements:
        supp_dict = {
            'name': supp.name,
            'dosage': supp.dosage,
            'form': supp.form,
            'category': supp.category
        }
        
        # Parse schedule if available
        if supp.schedule_json:
            try:
                schedule = json.loads(supp.schedule_json)
                supp_dict['schedule'] = schedule
            except:
                pass
        
        supp_list.append(supp_dict)
    
    return supp_list

def get_recent_metrics(user_id, days=7):
    """Get recent daily metrics for context"""
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
        if m.morning_sleep_quality:
            parts.append(f"Sleep {m.morning_sleep_quality}/5")
        if m.evening_digestion:
            parts.append(f"Digestion {m.evening_digestion}/5")
        if m.evening_libido:
            parts.append(f"Libido {m.evening_libido}/5")
        
        summary.append(" ".join(parts))
    
    return "\n".join(summary)

def build_analyze_prompt(supplements, recent_metrics, concern=None, symptoms=None):
    """Build system prompt for supplement analysis"""
    
    supp_list = "\n".join([
        f"- {s['name']} ({s.get('dosage', 'unknown dose')}) - {s.get('form', 'unknown form')}"
        for s in supplements
    ])
    
    symptoms_text = ""
    if symptoms:
        symptoms_text = f"\nRECENT SYMPTOMS: {', '.join(symptoms)}"
    
    concern_text = ""
    if concern:
        concern_text = f"\nUSER CONCERN: {concern}"
    
    prompt = f"""You are an expert supplement advisor specializing in optimization for men on TRT.

USER PROFILE:
- Age: {USER_PROFILE['age']}, {USER_PROFILE['gender']}
- On TRT (testosterone replacement therapy)
- Goals: {', '.join(USER_PROFILE['goals'])}

CURRENT SUPPLEMENT STACK:
{supp_list if supp_list else "No supplements currently tracked"}

RECENT METRICS (Last 7 days):
{recent_metrics}
{symptoms_text}
{concern_text}

SUPPLEMENT KNOWLEDGE BASE:
- TRT considerations: May increase estrogen (consider DIM, calcium-d-glucarate), affects sleep
- Magnesium: Best taken at night for sleep, glycinate form preferred
- Omega-3: Take with fat-containing meal for absorption
- Sea moss: Thyroid support, rich in minerals
- Zinc: Supports testosterone but competes with copper absorption
- Vitamin D: Fat-soluble, take with meals, important for TRT users
- Calcium vs Magnesium: Can compete for absorption, space them out

TASK:
Analyze the user's current supplement stack and provide:
1. Overall assessment of the stack
2. Specific recommendations (add, adjust, or remove supplements)
3. Timing and dosing optimization
4. Potential interactions or concerns
5. Follow-up questions to better understand the user's needs

Return ONLY valid JSON in this format:
{{
  "analysis": "Overall assessment of the supplement stack",
  "recommendations": [
    {{
      "supplement": "Supplement name",
      "action": "add" | "adjust" | "remove" | "continue",
      "reasoning": "Why this recommendation",
      "timing": "When to take (morning/afternoon/evening/with meals)"
    }}
  ],
  "warnings": [
    {{
      "type": "interaction" | "timing" | "dosage" | "missing",
      "message": "Warning description"
    }}
  ],
  "questions": [
    "Follow-up question 1",
    "Follow-up question 2"
  ]
}}"""
    
    return prompt

def build_protocol_prompt(supplements):
    """Build prompt for daily protocol generation"""
    
    supp_list = "\n".join([
        f"- {s['name']} ({s.get('dosage', 'unknown dose')})"
        for s in supplements
    ])
    
    prompt = f"""You are an expert supplement advisor. Generate an optimal daily protocol for taking these supplements.

CURRENT SUPPLEMENTS:
{supp_list if supp_list else "No supplements currently tracked"}

USER PROFILE:
- Age: {USER_PROFILE['age']}, male, on TRT
- Goals: {', '.join(USER_PROFILE['goals'])}

TIMING PRINCIPLES:
- Magnesium: Evening (promotes sleep)
- Omega-3: With fat-containing meal
- Fat-soluble vitamins (D, E, K): With meals
- Zinc: Away from calcium and iron
- TRT injection: Follow prescribed schedule

Return ONLY valid JSON in this format:
{{
  "morning": [
    {{
      "supplement": "Name",
      "dose": "Amount",
      "with_food": true,
      "notes": "Any special instructions"
    }}
  ],
  "afternoon": [...],
  "evening": [...],
  "warnings": [
    "Important timing note 1",
    "Important timing note 2"
  ]
}}"""
    
    return prompt

@ai_supplements_bp.route('/advisor/analyze', methods=['POST'])
def analyze_stack():
    """Analyze user's supplement stack and provide recommendations"""
    
    if not client:
        return jsonify({
            'error': 'Supplement Advisor requires OpenAI API key',
            'available': False
        }), 503
    
    try:
        data = request.json or {}
        user_id = data.get('user_id', 1)
        concern = data.get('concern')
        symptoms = data.get('recent_symptoms', [])
        
        # Get current supplements
        supplements = get_current_supplements(user_id)
        
        # Get recent metrics
        recent_metrics = get_recent_metrics(user_id)
        
        # Build prompt
        system_prompt = build_analyze_prompt(supplements, recent_metrics, concern, symptoms)
        
        logger.info(f"Analyzing supplement stack for user {user_id}")
        
        # Call OpenAI
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": "Analyze my supplement stack and provide recommendations."}
            ],
            temperature=0.7,
            max_tokens=1500
        )
        
        ai_response = response.choices[0].message.content.strip()
        
        # Parse JSON
        try:
            result = json.loads(ai_response)
        except json.JSONDecodeError:
            # Try to extract JSON if wrapped
            if '```json' in ai_response:
                json_str = ai_response.split('```json')[1].split('```')[0].strip()
                result = json.loads(json_str)
            elif '```' in ai_response:
                json_str = ai_response.split('```')[1].split('```')[0].strip()
                result = json.loads(json_str)
            else:
                raise
        
        # Save session
        session = SupplementAdvisorSession(
            user_id=user_id,
            query_type='analyze',
            input_json=json.dumps({
                'concern': concern,
                'symptoms': symptoms,
                'supplements': supplements
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
        logger.error(f"Error analyzing supplement stack: {e}")
        return jsonify({
            'error': 'Failed to analyze supplement stack',
            'details': str(e)
        }), 500

@ai_supplements_bp.route('/advisor/daily-protocol', methods=['GET'])
def get_daily_protocol():
    """Generate optimal daily supplement timing protocol"""
    
    if not client:
        return jsonify({
            'error': 'Supplement Advisor requires OpenAI API key',
            'available': False
        }), 503
    
    try:
        user_id = request.args.get('user_id', 1, type=int)
        
        # Get current supplements
        supplements = get_current_supplements(user_id)
        
        if not supplements:
            return jsonify({
                'morning': [],
                'afternoon': [],
                'evening': [],
                'warnings': ['No supplements currently tracked. Add supplements to get a personalized protocol.']
            })
        
        # Build prompt
        system_prompt = build_protocol_prompt(supplements)
        
        logger.info(f"Generating daily protocol for user {user_id}")
        
        # Call OpenAI
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": "Generate my daily supplement protocol."}
            ],
            temperature=0.7,
            max_tokens=1000
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
        session = SupplementAdvisorSession(
            user_id=user_id,
            query_type='protocol',
            input_json=json.dumps({'supplements': supplements}),
            response_json=json.dumps(result)
        )
        db.session.add(session)
        db.session.commit()
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Error generating daily protocol: {e}")
        return jsonify({
            'error': 'Failed to generate daily protocol',
            'details': str(e)
        }), 500

@ai_supplements_bp.route('/advisor/check-interaction', methods=['POST'])
def check_interaction():
    """Check for interactions between supplements"""
    
    if not client:
        return jsonify({
            'error': 'Supplement Advisor requires OpenAI API key',
            'available': False
        }), 503
    
    try:
        data = request.json or {}
        user_id = data.get('user_id', 1)
        supplement_names = data.get('supplements', [])
        
        if not supplement_names or len(supplement_names) < 2:
            return jsonify({
                'error': 'Please provide at least 2 supplements to check'
            }), 400
        
        prompt = f"""You are an expert supplement advisor. Check for interactions between these supplements:

SUPPLEMENTS TO CHECK:
{chr(10).join(f'- {name}' for name in supplement_names)}

USER CONTEXT:
- Age: {USER_PROFILE['age']}, male, on TRT

Analyze potential interactions, absorption competition, and timing conflicts.

Return ONLY valid JSON:
{{
  "safe": true | false,
  "interactions": [
    {{
      "pair": "Supplement A + Supplement B",
      "severity": "low" | "medium" | "high",
      "description": "Description of the interaction"
    }}
  ]
}}"""
        
        logger.info(f"Checking interactions for: {supplement_names}")
        
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": prompt},
                {"role": "user", "content": "Check for interactions."}
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
        
        # Save session
        session = SupplementAdvisorSession(
            user_id=user_id,
            query_type='interaction',
            input_json=json.dumps({'supplements': supplement_names}),
            response_json=json.dumps(result)
        )
        db.session.add(session)
        db.session.commit()
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Error checking interactions: {e}")
        return jsonify({
            'error': 'Failed to check interactions',
            'details': str(e)
        }), 500

@ai_supplements_bp.route('/advisor/availability', methods=['GET'])
def check_availability():
    """Check if Supplement Advisor is available"""
    return jsonify({
        'available': client is not None,
        'model': 'gpt-4o-mini' if client else None
    })

@ai_supplements_bp.route('/advisor/sessions', methods=['GET'])
def get_sessions():
    """Get user's supplement advisor session history"""
    user_id = request.args.get('user_id', 1, type=int)
    limit = request.args.get('limit', 10, type=int)
    
    sessions = SupplementAdvisorSession.query.filter_by(
        user_id=user_id
    ).order_by(SupplementAdvisorSession.created_at.desc()).limit(limit).all()
    
    return jsonify({
        'sessions': [s.to_dict() for s in sessions]
    })
