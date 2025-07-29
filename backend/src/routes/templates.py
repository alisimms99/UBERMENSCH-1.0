from flask import Blueprint, request, jsonify
from ..models.workout_templates import db, WorkoutTemplate, Exercise, WorkoutSession, ExerciseCompletion
from datetime import datetime
import json

templates_bp = Blueprint('templates', __name__)

@templates_bp.route('/templates', methods=['GET'])
def get_workout_templates():
    """Get all workout templates"""
    try:
        templates = WorkoutTemplate.query.all()
        return jsonify({
            'success': True,
            'templates': [template.to_dict() for template in templates]
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@templates_bp.route('/templates/<int:template_id>', methods=['GET'])
def get_workout_template(template_id):
    """Get a specific workout template with exercises"""
    try:
        template = WorkoutTemplate.query.get_or_404(template_id)
        return jsonify({
            'success': True,
            'template': template.to_dict()
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@templates_bp.route('/templates', methods=['POST'])
def create_workout_template():
    """Create a new workout template"""
    try:
        data = request.get_json()
        
        template = WorkoutTemplate(
            name=data['name'],
            description=data.get('description'),
            duration_min=data.get('duration_min'),
            difficulty_level=data.get('difficulty_level', 'beginner'),
            frequency_per_week=data.get('frequency_per_week'),
            category=data.get('category')
        )
        
        db.session.add(template)
        db.session.flush()  # Get the template ID
        
        # Add exercises to template
        if 'exercises' in data:
            for exercise_data in data['exercises']:
                exercise = Exercise(
                    name=exercise_data['name'],
                    category=exercise_data['category'],
                    subcategory=exercise_data.get('subcategory'),
                    description=exercise_data.get('description'),
                    instructions=exercise_data.get('instructions'),
                    progression_notes=exercise_data.get('progression_notes'),
                    beginner_modification=exercise_data.get('beginner_modification'),
                    exercise_type=exercise_data['exercise_type'],
                    default_reps=exercise_data.get('default_reps'),
                    default_duration=exercise_data.get('default_duration'),
                    default_sets=exercise_data.get('default_sets', 1),
                    image_url=exercise_data.get('image_url'),
                    video_url=exercise_data.get('video_url'),
                    icon_name=exercise_data.get('icon_name'),
                    difficulty_level=exercise_data.get('difficulty_level', 'beginner'),
                    muscle_groups=json.dumps(exercise_data.get('muscle_groups', [])),
                    equipment_needed=exercise_data.get('equipment_needed')
                )
                db.session.add(exercise)
                template.exercises.append(exercise) # Assuming WorkoutTemplate has an 'exercises' relationship
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'template': template.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@templates_bp.route('/exercises', methods=['GET'])
def get_exercises():
    """Get all exercises"""
    try:
        exercises = Exercise.query.all()
        return jsonify({
            'success': True,
            'exercises': [exercise.to_dict() for exercise in exercises]
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@templates_bp.route('/exercises', methods=['POST'])
def create_exercise():
    """Create a new exercise"""
    try:
        data = request.get_json()
        
        exercise = Exercise(
            name=data['name'],
            category=data['category'],
            subcategory=data.get('subcategory'),
            description=data.get('description'),
            instructions=data.get('instructions'),
            progression_notes=data.get('progression_notes'),
            beginner_modification=data.get('beginner_modification'),
            exercise_type=data['exercise_type'],
            default_reps=data.get('default_reps'),
            default_duration=data.get('default_duration'),
            default_sets=data.get('default_sets', 1),
            image_url=data.get('image_url'),
            video_url=data.get('video_url'),
            icon_name=data.get('icon_name'),
            difficulty_level=data.get('difficulty_level', 'beginner'),
            muscle_groups=json.dumps(data.get('muscle_groups', [])),
            equipment_needed=data.get('equipment_needed')
        )
        
        db.session.add(exercise)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'exercise': exercise.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@templates_bp.route('/workout-sessions', methods=['POST'])
def start_workout_session():
    """Start a new workout session"""
    try:
        data = request.get_json()
        
        session = WorkoutSession(
            user_id=data['user_id'],
            workout_template_id=data.get('template_id'),
            date=datetime.strptime(data['date'], '%Y-%m-%d').date() if data.get('date') else datetime.utcnow().date(),
            status='in_progress'
        )
        
        db.session.add(session)
        db.session.flush()
        
        # Create exercise logs for the session
        if 'exercises' in data:
            for exercise_data in data['exercises']:
                exercise_completion = ExerciseCompletion(
                    workout_session_id=session.id,
                    exercise_id=exercise_data['exercise_id'],
                    planned_sets=exercise_data.get('planned_sets'),
                    planned_reps=exercise_data.get('planned_reps'),
                    planned_duration=exercise_data.get('planned_duration'),
                    status='planned'
                )
                db.session.add(exercise_completion)
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'session': session.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@templates_bp.route('/workout-sessions/<int:session_id>', methods=['PUT'])
def update_workout_session(session_id):
    """Update workout session progress"""
    try:
        data = request.get_json()
        session = WorkoutSession.query.get_or_404(session_id)
        
        # Update session fields
        if 'actual_duration' in data:
            session.actual_duration = data['actual_duration']
        if 'completion_percentage' in data:
            session.completion_percentage = data['completion_percentage']
        if 'notes' in data:
            session.notes = data['notes']
        if 'difficulty_rating' in data:
            session.difficulty_rating = data['difficulty_rating']
        if 'energy_level_before' in data:
            session.energy_level_before = data['energy_level_before']
        if 'energy_level_after' in data:
            session.energy_level_after = data['energy_level_after']
        if 'status' in data:
            session.status = data['status']
            if data['status'] == 'completed':
                session.completed_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'session': session.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@templates_bp.route('/exercise-logs/<int:log_id>', methods=['PUT'])
def update_exercise_log(log_id):
    """Update exercise log with actual performance"""
    try:
        data = request.get_json()
        log = ExerciseCompletion.query.get_or_404(log_id)
        
        # Update log fields
        if 'actual_sets' in data:
            log.actual_sets = data['actual_sets']
        if 'actual_reps' in data:
            log.actual_reps = data['actual_reps']
        if 'actual_duration' in data:
            log.actual_duration = data['actual_duration']
        if 'weight_used' in data:
            log.weight_used = data['weight_used']
        if 'rest_time' in data:
            log.rest_time = data['rest_time']
        if 'perceived_exertion' in data:
            log.perceived_exertion = data['perceived_exertion']
        if 'status' in data:
            log.status = data['status']
        if 'notes' in data:
            log.notes = data['notes']
        if 'skipped_reason' in data:
            log.skipped_reason = data['skipped_reason']
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'log': log.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@templates_bp.route('/workout-history/<int:user_id>', methods=['GET'])
def get_workout_history(user_id):
    """Get workout history for a user"""
    try:
        # Get query parameters
        limit = request.args.get('limit', 50, type=int)
        offset = request.args.get('offset', 0, type=int)
        
        sessions = WorkoutSession.query.filter_by(user_id=user_id)\
                                         .order_by(WorkoutSession.date.desc())\
                                         .offset(offset)\
                                         .limit(limit)\
                                         .all()
        
        return jsonify({
            'success': True,
            'sessions': [session.to_dict() for session in sessions]
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@templates_bp.route('/workout-sessions/<int:session_id>', methods=['DELETE'])
def delete_workout_session(session_id):
    """Delete a workout session"""
    try:
        session = WorkoutSession.query.get_or_404(session_id)
        db.session.delete(session)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Workout session deleted successfully'
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

