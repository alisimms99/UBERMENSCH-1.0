from flask import Blueprint, jsonify, request
from ..models import db, User, WorkoutTemplate, Exercise, WorkoutSession, ExerciseCompletion  # Updated import
from datetime import datetime, date

workouts_bp = Blueprint('workouts', __name__)

@workouts_bp.route('/users/<int:user_id>/workouts', methods=['GET'])
def get_user_workouts(user_id):
    """Get all workouts for a user"""
    status = request.args.get('status')
    query = WorkoutSession.query.filter_by(user_id=user_id)
    
    if status:
        query = query.filter_by(status=status)
        
    workouts = query.order_by(WorkoutSession.date.desc()).all()
    return jsonify([w.to_dict() for w in workouts])

@workouts_bp.route('/users/<int:user_id>/workouts', methods=['POST'])
def create_workout(user_id):
    """Create a new workout for a user"""
    data = request.json
    workout_session = WorkoutSession(
        user_id=user_id,
        workout_template_id=data.get('template_id'),
        date=datetime.strptime(data['date'], '%Y-%m-%d').date() if data.get('date') else date.today(),
        status='planned'
    )
    db.session.add(workout_session)
    db.session.commit()
    return jsonify(workout_session.to_dict()), 201

@workouts_bp.route('/workouts/<int:workout_id>', methods=['GET'])
def get_workout(workout_id):
    """Get a specific workout"""
    workout = WorkoutSession.query.get_or_404(workout_id)
    return jsonify(workout.to_dict())

@workouts_bp.route('/workouts/<int:workout_id>', methods=['PUT'])
def update_workout(workout_id):
    """Update a workout"""
    workout = WorkoutSession.query.get_or_404(workout_id)
    data = request.json
    
    workout.status = data.get('status', workout.status)
    workout.notes = data.get('notes', workout.notes)
    workout.duration_minutes = data.get('duration_minutes', workout.duration_minutes)
    
    if data.get('start_time'):
        workout.start_time = datetime.fromisoformat(data['start_time'])
    if data.get('end_time'):
        workout.end_time = datetime.fromisoformat(data['end_time'])
    
    db.session.commit()
    return jsonify(workout.to_dict())

@workouts_bp.route('/workouts/<int:workout_id>/start', methods=['POST'])
def start_workout(workout_id):
    """Start a workout session"""
    workout = WorkoutSession.query.get_or_404(workout_id)
    
    workout.status = 'in_progress'
    workout.start_time = datetime.utcnow()
    
    db.session.commit()
    return jsonify(workout.to_dict())

@workouts_bp.route('/workouts/<int:workout_id>/complete', methods=['POST'])
def complete_workout(workout_id):
    """Complete a workout session"""
    workout = WorkoutSession.query.get_or_404(workout_id)
    data = request.json
    
    workout.status = 'completed'
    workout.end_time = datetime.utcnow()
    
    if workout.start_time:
        duration = workout.end_time - workout.start_time
        workout.duration_minutes = int(duration.total_seconds() / 60)
    
    workout.notes = data.get('notes', workout.notes)
    
    db.session.commit()
    return jsonify(workout.to_dict())

@workouts_bp.route('/workouts/<int:workout_id>', methods=['DELETE'])
def delete_workout(workout_id):
    """Delete a workout"""
    workout = WorkoutSession.query.get_or_404(workout_id)
    db.session.delete(workout)
    db.session.commit()
    return '', 204

@workouts_bp.route('/workout-exercises/<int:exercise_id>', methods=['PUT'])
def update_workout_exercise(exercise_id):
    """Update a specific exercise within a workout"""
    workout_exercise = ExerciseCompletion.query.get_or_404(exercise_id)
    data = request.json
    
    workout_exercise.completed_reps = data.get('completed_reps', workout_exercise.completed_reps)
    workout_exercise.completed_duration = data.get('completed_duration', workout_exercise.completed_duration)
    workout_exercise.completed_sets = data.get('completed_sets', workout_exercise.completed_sets)
    workout_exercise.notes = data.get('notes', workout_exercise.notes)
    
    db.session.commit()
    return jsonify(workout_exercise.to_dict())

@workouts_bp.route('/users/<int:user_id>/workouts/generate', methods=['POST'])
def generate_workout(user_id):
    """Generate a workout based on user's current targets and template"""
    user = User.query.get_or_404(user_id)
    data = request.json
    
    template_name = data.get('template', 'Building Strength')
    workout_date = datetime.strptime(data['date'], '%Y-%m-%d').date() if data.get('date') else date.today()
    
    # Create workout
    workout_session = WorkoutSession(
        user_id=user_id,
        workout_template_id=WorkoutTemplate.query.filter_by(name=template_name).first().id,
        date=workout_date,
        status='planned'
    )
    
    db.session.add(workout_session)
    db.session.flush()
    
    # Generate exercises based on template
    if template_name == 'Getting Back Into It':
        exercises_config = [
            {'name': '8 Brocades Sequence', 'target_duration': 300},  # 5 minutes
            {'name': 'Knee Pushups', 'target_reps': max(1, user.current_pushup_target // 2)},
            {'name': 'Situps', 'target_reps': max(1, user.current_situp_target // 2)},
            {'name': 'Plank', 'target_duration': max(15, user.current_plank_target // 2)},
            {'name': 'Neighborhood Loop', 'target_duration': 1200}  # 20 minutes
        ]
    elif template_name == 'Building Strength':
        exercises_config = [
            {'name': '8 Brocades Sequence', 'target_duration': 300},
            {'name': 'Pushups', 'target_reps': user.current_pushup_target or 5},
            {'name': 'Situps', 'target_reps': user.current_situp_target or 5},
            {'name': 'Plank', 'target_duration': user.current_plank_target or 30},
            {'name': 'Squats', 'target_reps': 15},
            {'name': 'Dead Bugs', 'target_reps': 10},
            {'name': 'Neighborhood Loop', 'target_duration': 1800}  # 30 minutes
        ]
    elif template_name == 'Full Workout':
        exercises_config = [
            {'name': 'Zhan Zhuang Standing Meditation', 'target_duration': 180},
            {'name': '8 Brocades Sequence', 'target_duration': 420},
            {'name': 'Pushups', 'target_reps': user.current_pushup_target or 5, 'target_sets': 2},
            {'name': 'Situps', 'target_reps': user.current_situp_target or 5, 'target_sets': 2},
            {'name': 'Plank', 'target_duration': user.current_plank_target or 30, 'target_sets': 2},
            {'name': 'Pike Pushups', 'target_reps': 5},
            {'name': 'Squats', 'target_reps': 20},
            {'name': 'Mountain Climbers', 'target_duration': 30},
            {'name': 'Bird Dogs', 'target_reps': 8},
            {'name': 'Glute Bridges', 'target_reps': 15},
            {'name': 'Closing Flow', 'target_duration': 180},
            {'name': 'Neighborhood Loop', 'target_duration': 2400}  # 40 minutes
        ]
    else:  # Recovery Day
        exercises_config = [
            {'name': '8 Brocades Sequence', 'target_duration': 600},  # 10 minutes
            {'name': 'Zhan Zhuang Standing Meditation', 'target_duration': 300},
            {'name': 'Closing Flow', 'target_duration': 300},
            {'name': 'Neighborhood Loop', 'target_duration': 1200}  # 20 minutes gentle walk
        ]
    
    # Add exercises to workout
    for i, ex_config in enumerate(exercises_config):
        exercise = Exercise.query.filter_by(name=ex_config['name']).first()
        if exercise:
            workout_exercise = ExerciseCompletion(
                workout_session_id=workout_session.id,
                exercise_id=exercise.id,
                order_in_workout=i + 1,
                target_reps=ex_config.get('target_reps'),
                target_duration=ex_config.get('target_duration'),
                target_sets=ex_config.get('target_sets', 1),
                rest_duration=exercise.default_rest_seconds
            )
            db.session.add(workout_exercise)
    
    db.session.commit()
    return jsonify(workout_session.to_dict()), 201

@workouts_bp.route('/users/<int:user_id>/workouts/today', methods=['GET'])
def get_today_workout(user_id):
    """Get today's workout for a user"""
    today = date.today()
    workout = WorkoutSession.query.filter_by(user_id=user_id, date=today).first()
    
    if workout:
        return jsonify(workout.to_dict())
    else:
        return jsonify({'message': 'No workout scheduled for today'}), 404

@workouts_bp.route('/users/<int:user_id>/workout-stats', methods=['GET'])
def get_workout_stats(user_id):
    """Get workout statistics for a user"""
    # Get workout counts by status
    total_workouts = WorkoutSession.query.filter_by(user_id=user_id).count()
    completed_workouts = WorkoutSession.query.filter_by(user_id=user_id, status='completed').count()
    
    # Get recent workout streak
    recent_workouts = WorkoutSession.query.filter_by(user_id=user_id).order_by(WorkoutSession.date.desc()).limit(30).all()
    
    current_streak = 0
    for workout in recent_workouts:
        if workout.status == 'completed':
            current_streak += 1
        else:
            break
    
    # Calculate completion rate
    completion_rate = (completed_workouts / total_workouts * 100) if total_workouts > 0 else 0
    
    return jsonify({
        'total_workouts': total_workouts,
        'completed_workouts': completed_workouts,
        'current_streak': current_streak,
        'completion_rate': round(completion_rate, 1)
    })

