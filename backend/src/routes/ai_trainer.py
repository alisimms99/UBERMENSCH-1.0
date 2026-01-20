from flask import Blueprint, request, jsonify
from openai import OpenAI
from datetime import datetime, timedelta
from ..models.models import db, VideoSession, DailyMetrics, TrainerSession
from ..services.video_matcher import enhance_workout_with_videos
import json
import os
import logging

ai_trainer_bp = Blueprint('ai_trainer', __name__)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize OpenAI client
client = None
if os.getenv('OPENAI_API_KEY'):
    client = OpenAI()
    logger.info("OpenAI client initialized successfully")
else:
    logger.warning("OPENAI_API_KEY not found in environment variables")

# User profile (hardcoded for MVP)
USER_PROFILE = {
    'age': 56,
    'on_trt': True,
    'equipment': [
        'Airbike',
        'Treadmill',
        'Adjustable dumbbells',
        'Adjustable bench',
        'Heavy bag',
        'Double-end bag',
        'Uppercut bag',
        'Floor space (bodyweight/calisthenics)',
        'Incline back stretch table',
        'TV/Firestick for video playback'
    ],
    'likes': ['Qigong', 'calisthenics', 'boxing', 'walking', 'airbike', 'dumbbell work'],
    'dislikes': ['Heavy weights', 'machines'],
    'goals': {
        'primary': 'Improve cardio endurance',
        'secondary': 'Lose body fat',
        'constraint': 'Preserve muscle mass'
    },
    'video_categories': [
        'Boxing Training',
        'Breath Work, Tai Chi & Qi Gong',
        'Cardio',
        'Strength Training',
        'Yoga',
        'Shaolin Warrior Workout',
        'Krav Maga',
        'Gracie Combatives'
    ]
}

def get_system_prompt(recent_history, today_metrics, time_available, energy_level, focus):
    """Generate the system prompt for the AI trainer"""
    
    prompt = f"""You are an AI fitness trainer for a {USER_PROFILE['age']}-year-old male on TRT.

GOALS:
- Primary: {USER_PROFILE['goals']['primary']}
- Secondary: {USER_PROFILE['goals']['secondary']}
- Constraint: {USER_PROFILE['goals']['constraint']}

EQUIPMENT AVAILABLE:
{chr(10).join(f'- {eq}' for eq in USER_PROFILE['equipment'])}

PREFERENCES:
- LIKES: {', '.join(USER_PROFILE['likes'])}
- DISLIKES: {', '.join(USER_PROFILE['dislikes'])}

PROGRAMMING PRINCIPLES:
- 3-4 cardio sessions per week (airbike HIIT, boxing, walking)
- 2-3 resistance sessions (dumbbells, calisthenics)
- Daily mobility/qigong is encouraged
- TRT allows faster recovery but still need rest days
- Prioritize joint-friendly movements for longevity
- Mix video-guided workouts with simple exercises

VIDEO LIBRARY CATEGORIES AVAILABLE:
{chr(10).join(f'- {cat}' for cat in USER_PROFILE['video_categories'])}

RECENT WORKOUT HISTORY (Last 7 days):
{recent_history}

TODAY'S METRICS:
- Energy Level: {energy_level}/5
{f'- Sleep: {today_metrics.get("sleep_quality", "N/A")}' if today_metrics else '- Sleep: N/A'}
{f'- Morning Energy: {today_metrics.get("morning_energy", "N/A")}' if today_metrics else ''}

WORKOUT REQUEST:
- Time Available: {time_available} minutes
- Focus: {focus if focus else 'Balanced workout'}

INSTRUCTIONS:
Generate a personalized workout that:
1. Fits within the time constraint
2. Matches the user's energy level and recent training
3. Incorporates preferred equipment and movements
4. Avoids overtraining (check recent history)
5. Includes specific exercises with sets/reps or duration
6. For exercises that can use library videos, include a "category_hint" field with the video category

Return ONLY valid JSON in this exact format (no markdown, no explanation):
{{
  "workout": {{
    "name": "Workout name",
    "estimated_duration": 45,
    "warmup": [
      {{
        "name": "Exercise name",
        "duration_seconds": 300,
        "notes": "Form cues or instructions",
        "category_hint": "Breath Work, Tai Chi & Qi Gong"
      }}
    ],
    "main": [
      {{
        "name": "Exercise name",
        "sets": 3,
        "reps": 10,
        "rest_seconds": 60,
        "notes": "Form cues",
        "category_hint": "Boxing Training"
      }}
    ],
    "cooldown": [
      {{
        "name": "Exercise name",
        "duration_seconds": 300,
        "notes": "Stretch and breathe",
        "category_hint": "Yoga"
      }}
    ]
  }}
}}"""
    
    return prompt

def get_recent_workout_history(user_id, days=7):
    """Get recent workout history for context"""
    start_date = datetime.utcnow() - timedelta(days=days)
    
    sessions = VideoSession.query.filter(
        VideoSession.user_id == user_id,
        VideoSession.started_at >= start_date,
        VideoSession.completed == True
    ).order_by(VideoSession.started_at.desc()).all()
    
    if not sessions:
        return "No recent workouts"
    
    history = []
    for session in sessions:
        date_str = session.started_at.strftime('%Y-%m-%d')
        duration_min = session.duration_seconds // 60
        history.append(f"- {date_str}: {session.category or 'Workout'} ({duration_min} min)")
    
    return '\n'.join(history)

def get_today_metrics(user_id):
    """Get today's metrics if available"""
    today = datetime.utcnow().date()
    
    metrics = DailyMetrics.query.filter_by(
        user_id=user_id,
        date=today
    ).first()
    
    if not metrics:
        return {}
    
    return {
        'sleep_quality': metrics.morning_sleep_quality,
        'morning_energy': metrics.morning_energy_level,
        'evening_energy': metrics.evening_energy_level
    }

@ai_trainer_bp.route('/trainer/generate-workout', methods=['POST'])
def generate_workout():
    """Generate a personalized workout using AI"""
    
    # Check if OpenAI is configured
    if not client:
        return jsonify({
            'error': 'AI trainer requires OpenAI API key',
            'fallback': 'manual'
        }), 503
    
    try:
        data = request.json
        user_id = data.get('user_id', 1)
        time_available = data.get('time_available', 30)
        energy_level = data.get('energy_level', 3)
        focus = data.get('focus', None)
        
        # Validate inputs
        if time_available not in [15, 30, 45, 60]:
            return jsonify({'error': 'time_available must be 15, 30, 45, or 60'}), 400
        
        if not 1 <= energy_level <= 5:
            return jsonify({'error': 'energy_level must be between 1 and 5'}), 400
        
        # Get context
        recent_history = get_recent_workout_history(user_id)
        today_metrics = get_today_metrics(user_id)
        
        # Generate system prompt
        system_prompt = get_system_prompt(
            recent_history,
            today_metrics,
            time_available,
            energy_level,
            focus
        )
        
        # Log the request
        logger.info(f"Generating workout for user {user_id}: {time_available}min, energy {energy_level}/5, focus: {focus}")
        
        # Call OpenAI API
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": "Generate my workout now."}
            ],
            temperature=0.8,
            max_tokens=1500
        )
        
        # Parse response
        ai_response = response.choices[0].message.content.strip()
        
        # Log the raw response
        logger.info(f"AI Response: {ai_response[:200]}...")
        
        # Try to parse JSON
        try:
            workout_data = json.loads(ai_response)
        except json.JSONDecodeError:
            # Try to extract JSON if wrapped in markdown
            if '```json' in ai_response:
                json_str = ai_response.split('```json')[1].split('```')[0].strip()
                workout_data = json.loads(json_str)
            elif '```' in ai_response:
                json_str = ai_response.split('```')[1].split('```')[0].strip()
                workout_data = json.loads(json_str)
            else:
                raise
        
        # Enhance workout with video matches
        workout = workout_data.get('workout', {})
        enhanced_workout = enhance_workout_with_videos(workout)
        
        # Save to database
        trainer_session = TrainerSession(
            user_id=user_id,
            workout_json=json.dumps(enhanced_workout),
            time_requested=time_available,
            energy_level=energy_level,
            focus=focus
        )
        db.session.add(trainer_session)
        db.session.commit()
        
        logger.info(f"Saved trainer session {trainer_session.id} for user {user_id}")
        
        # Return the enhanced workout
        return jsonify({
            'success': True,
            'workout': enhanced_workout,
            'session_id': trainer_session.id,
            'generated_at': datetime.utcnow().isoformat()
        })
        
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse AI response: {e}")
        logger.error(f"Raw response: {ai_response}")
        return jsonify({
            'error': 'Failed to parse AI response',
            'details': str(e),
            'raw_response': ai_response[:500]
        }), 500
        
    except Exception as e:
        logger.error(f"Error generating workout: {e}")
        return jsonify({
            'error': 'Failed to generate workout',
            'details': str(e)
        }), 500

@ai_trainer_bp.route('/trainer/check-availability', methods=['GET'])
def check_availability():
    """Check if AI trainer is available"""
    return jsonify({
        'available': client is not None,
        'model': 'gpt-4o-mini' if client else None
    })

@ai_trainer_bp.route('/trainer/fallback-workouts', methods=['GET'])
def get_fallback_workouts():
    """Get hardcoded template workouts as fallback"""
    
    templates = [
        {
            'id': 'cardio-30',
            'name': 'Cardio Blast - 30min',
            'estimated_duration': 30,
            'description': 'High-intensity cardio focused on airbike and boxing',
            'warmup': [
                {'name': 'Qigong Warmup', 'duration_seconds': 300, 'notes': 'Gentle movement and breathing'}
            ],
            'main': [
                {'name': 'Airbike Intervals', 'sets': 5, 'duration_seconds': 60, 'rest_seconds': 60, 'notes': '30s hard, 30s easy'},
                {'name': 'Heavy Bag Work', 'sets': 3, 'duration_seconds': 180, 'rest_seconds': 60, 'notes': 'Combinations and movement'}
            ],
            'cooldown': [
                {'name': 'Walking', 'duration_seconds': 300, 'notes': 'Cool down and stretch'}
            ]
        },
        {
            'id': 'strength-45',
            'name': 'Strength & Conditioning - 45min',
            'estimated_duration': 45,
            'description': 'Dumbbell and calisthenics workout',
            'warmup': [
                {'name': 'Dynamic Stretching', 'duration_seconds': 300, 'notes': 'Arm circles, leg swings'}
            ],
            'main': [
                {'name': 'Dumbbell Press', 'sets': 3, 'reps': 12, 'rest_seconds': 90, 'notes': 'Moderate weight'},
                {'name': 'Dumbbell Rows', 'sets': 3, 'reps': 12, 'rest_seconds': 90, 'notes': 'Each arm'},
                {'name': 'Pushups', 'sets': 3, 'reps': 15, 'rest_seconds': 60, 'notes': 'Modify as needed'},
                {'name': 'Bodyweight Squats', 'sets': 3, 'reps': 20, 'rest_seconds': 60, 'notes': 'Controlled tempo'}
            ],
            'cooldown': [
                {'name': 'Stretching', 'duration_seconds': 300, 'notes': 'Full body stretch'}
            ]
        },
        {
            'id': 'recovery-30',
            'name': 'Active Recovery - 30min',
            'estimated_duration': 30,
            'description': 'Low-intensity mobility and qigong',
            'warmup': [
                {'name': 'Gentle Walking', 'duration_seconds': 300, 'notes': 'Easy pace'}
            ],
            'main': [
                {'name': 'Qigong Practice', 'duration_seconds': 900, 'notes': 'Focus on breathing and flow'},
                {'name': 'Yoga Flow', 'duration_seconds': 600, 'notes': 'Gentle stretches'}
            ],
            'cooldown': [
                {'name': 'Meditation', 'duration_seconds': 300, 'notes': 'Deep breathing'}
            ]
        }
    ]
    
    return jsonify({'templates': templates})


@ai_trainer_bp.route('/trainer/sessions', methods=['GET'])
def get_trainer_sessions():
    """Get user's trainer session history"""
    user_id = request.args.get('user_id', 1, type=int)
    limit = request.args.get('limit', 10, type=int)
    
    sessions = TrainerSession.query.filter_by(
        user_id=user_id
    ).order_by(TrainerSession.generated_at.desc()).limit(limit).all()
    
    return jsonify({
        'sessions': [s.to_dict() for s in sessions]
    })

@ai_trainer_bp.route('/trainer/sessions/<int:session_id>', methods=['GET'])
def get_trainer_session(session_id):
    """Get a specific trainer session"""
    session = TrainerSession.query.get_or_404(session_id)
    return jsonify(session.to_dict())

@ai_trainer_bp.route('/trainer/sessions/<int:session_id>/complete', methods=['POST'])
def complete_trainer_session(session_id):
    """Mark a trainer session as completed and optionally add feedback"""
    session = TrainerSession.query.get_or_404(session_id)
    
    data = request.json or {}
    session.completed = True
    session.feedback = data.get('feedback')
    session.actual_duration = data.get('actual_duration')
    session.notes = data.get('notes')
    
    db.session.commit()
    
    logger.info(f"Completed trainer session {session_id} with feedback: {session.feedback}")
    
    return jsonify(session.to_dict())
