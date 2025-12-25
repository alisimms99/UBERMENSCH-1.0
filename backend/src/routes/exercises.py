from flask import Blueprint, jsonify, request
from ..models import db, Exercise, WorkoutTemplate  # Updated import
import json

exercises_bp = Blueprint('exercises', __name__)

@exercises_bp.route('/exercises', methods=['GET'])
def get_exercises():
    """Get all exercises, optionally filtered by category"""
    category = request.args.get('category')
    if category:
        exercises = Exercise.query.filter_by(category=category).all()
    else:
        exercises = Exercise.query.all()
    return jsonify([exercise.to_dict() for exercise in exercises])

@exercises_bp.route('/exercises', methods=['POST'])
def create_exercise():
    """Create a new exercise"""
    data = request.json
    
    # Validate video_paths if provided
    if 'video_paths' in data and data['video_paths'] is not None:
        is_valid, result = Exercise.validate_video_paths(data['video_paths'])
        if not is_valid:
            return jsonify({'error': f'Invalid video_paths: {result}'}), 400
        validated_video_paths = result
    else:
        validated_video_paths = None
    
    exercise = Exercise(
        name=data['name'],
        category=data['category'],
        description=data.get('description'),
        instructions=data.get('instructions'),
        is_timed=data.get('is_timed', False),
        is_reps=data.get('is_reps', True),
        is_distance=data.get('is_distance', False),
        default_rest_seconds=data.get('default_rest_seconds', 60),
        video_path=data.get('video_path'),
        video_paths=validated_video_paths
    )
    db.session.add(exercise)
    db.session.commit()
    return jsonify(exercise.to_dict()), 201

@exercises_bp.route('/exercises/<int:exercise_id>', methods=['GET'])
def get_exercise(exercise_id):
    """Get a specific exercise"""
    exercise = Exercise.query.get_or_404(exercise_id)
    return jsonify(exercise.to_dict())

@exercises_bp.route('/exercises/<int:exercise_id>', methods=['PUT'])
def update_exercise(exercise_id):
    """Update an exercise"""
    exercise = Exercise.query.get_or_404(exercise_id)
    data = request.json
    
    exercise.name = data.get('name', exercise.name)
    exercise.category = data.get('category', exercise.category)
    exercise.description = data.get('description', exercise.description)
    exercise.instructions = data.get('instructions', exercise.instructions)
    exercise.is_timed = data.get('is_timed', exercise.is_timed)
    exercise.is_reps = data.get('is_reps', exercise.is_reps)
    exercise.is_distance = data.get('is_distance', exercise.is_distance)
    exercise.default_rest_seconds = data.get('default_rest_seconds', exercise.default_rest_seconds)
    
    # Validate video_paths if provided
    if 'video_paths' in data:
        is_valid, result = Exercise.validate_video_paths(data['video_paths'])
        if not is_valid:
            return jsonify({'error': f'Invalid video_paths: {result}'}), 400
        exercise.video_paths = result
    
    # Validate and update video_path if provided
    if 'video_path' in data:
        exercise.video_path = data['video_path']
    
    db.session.commit()
    return jsonify(exercise.to_dict())

@exercises_bp.route('/exercises/<int:exercise_id>', methods=['DELETE'])
def delete_exercise(exercise_id):
    """Delete an exercise"""
    exercise = Exercise.query.get_or_404(exercise_id)
    db.session.delete(exercise)
    db.session.commit()
    return '', 204

@exercises_bp.route('/workout-templates', methods=['GET'])
def get_workout_templates():
    """Get all workout templates"""
    templates = WorkoutTemplate.query.all()
    return jsonify([template.to_dict() for template in templates])

@exercises_bp.route('/workout-templates', methods=['POST'])
def create_workout_template():
    """Create a new workout template"""
    data = request.json
    template = WorkoutTemplate(
        name=data['name'],
        description=data.get('description'),
        estimated_duration=data['estimated_duration'],
        difficulty_level=data.get('difficulty_level', 'beginner'),
        exercises_config=json.dumps(data.get('exercises_config', []))
    )
    db.session.add(template)
    db.session.commit()
    return jsonify(template.to_dict()), 201

@exercises_bp.route('/workout-templates/<int:template_id>', methods=['GET'])
def get_workout_template(template_id):
    """Get a specific workout template"""
    template = WorkoutTemplate.query.get_or_404(template_id)
    return jsonify(template.to_dict())

@exercises_bp.route('/workout-templates/<int:template_id>', methods=['PUT'])
def update_workout_template(template_id):
    """Update a workout template"""
    template = WorkoutTemplate.query.get_or_404(template_id)
    data = request.json
    
    template.name = data.get('name', template.name)
    template.description = data.get('description', template.description)
    template.estimated_duration = data.get('estimated_duration', template.estimated_duration)
    template.difficulty_level = data.get('difficulty_level', template.difficulty_level)
    if 'exercises_config' in data:
        template.exercises_config = json.dumps(data['exercises_config'])
    
    db.session.commit()
    return jsonify(template.to_dict())

@exercises_bp.route('/workout-templates/<int:template_id>', methods=['DELETE'])
def delete_workout_template(template_id):
    """Delete a workout template"""
    template = WorkoutTemplate.query.get_or_404(template_id)
    db.session.delete(template)
    db.session.commit()
    return '', 204

@exercises_bp.route('/seed-exercises', methods=['POST'])
def seed_exercises():
    """Seed the database with default exercises"""
    
    # Check if exercises already exist
    if Exercise.query.count() > 0:
        return jsonify({'message': 'Exercises already seeded'}), 200
    
    # Qigong exercises
    qigong_exercises = [
        {
            'name': '8 Brocades Sequence',
            'category': 'qigong',
            'description': 'Traditional qigong sequence for health and vitality',
            'instructions': 'Perform the complete 8 Brocades sequence with mindful breathing',
            'is_timed': True,
            'is_reps': False,
            'default_rest_seconds': 30
        },
        {
            'name': 'Zhan Zhuang Standing Meditation',
            'category': 'qigong',
            'description': 'Standing meditation for building internal energy',
            'instructions': 'Stand in horse stance with arms in circle, focus on breathing',
            'is_timed': True,
            'is_reps': False,
            'default_rest_seconds': 60
        },
        {
            'name': 'Closing Flow',
            'category': 'qigong',
            'description': 'Gentle movements to close qigong practice',
            'instructions': 'Gentle flowing movements to integrate energy',
            'is_timed': True,
            'is_reps': False,
            'default_rest_seconds': 30
        }
    ]
    
    # Upper body exercises
    upper_body_exercises = [
        {
            'name': 'Pushups',
            'category': 'upper_body',
            'description': 'Standard pushups for chest, shoulders, and triceps',
            'instructions': 'Keep body straight, lower chest to floor, push back up',
            'is_timed': False,
            'is_reps': True,
            'default_rest_seconds': 60
        },
        {
            'name': 'Knee Pushups',
            'category': 'upper_body',
            'description': 'Modified pushups on knees for beginners',
            'instructions': 'Same as pushups but with knees on ground for support',
            'is_timed': False,
            'is_reps': True,
            'default_rest_seconds': 45
        },
        {
            'name': 'Pike Pushups',
            'category': 'upper_body',
            'description': 'Pushups in pike position for shoulders',
            'instructions': 'Start in downward dog position, lower head toward hands',
            'is_timed': False,
            'is_reps': True,
            'default_rest_seconds': 75
        },
        {
            'name': 'Tricep Dips',
            'category': 'upper_body',
            'description': 'Dips using chair or bench for triceps',
            'instructions': 'Hands on chair behind you, lower body by bending elbows',
            'is_timed': False,
            'is_reps': True,
            'default_rest_seconds': 60
        }
    ]
    
    # Core and lower body exercises
    core_lower_exercises = [
        {
            'name': 'Situps',
            'category': 'core_lower',
            'description': 'Standard situps for abdominal strength',
            'instructions': 'Lie on back, knees bent, sit up to touch knees',
            'is_timed': False,
            'is_reps': True,
            'default_rest_seconds': 45
        },
        {
            'name': 'Plank',
            'category': 'core_lower',
            'description': 'Isometric hold for core stability',
            'instructions': 'Hold pushup position, keep body straight and rigid',
            'is_timed': True,
            'is_reps': False,
            'default_rest_seconds': 60
        },
        {
            'name': 'Squats',
            'category': 'core_lower',
            'description': 'Bodyweight squats for leg strength',
            'instructions': 'Feet shoulder-width apart, lower as if sitting in chair',
            'is_timed': False,
            'is_reps': True,
            'default_rest_seconds': 45
        },
        {
            'name': 'Mountain Climbers',
            'category': 'core_lower',
            'description': 'Dynamic exercise for cardio and core',
            'instructions': 'Plank position, alternate bringing knees to chest rapidly',
            'is_timed': True,
            'is_reps': True,
            'default_rest_seconds': 60
        }
    ]
    
    # Functional exercises
    functional_exercises = [
        {
            'name': 'Dead Bugs',
            'category': 'functional',
            'description': 'Core stability exercise',
            'instructions': 'Lie on back, opposite arm and leg movements',
            'is_timed': False,
            'is_reps': True,
            'default_rest_seconds': 30
        },
        {
            'name': 'Bird Dogs',
            'category': 'functional',
            'description': 'Balance and stability exercise',
            'instructions': 'On hands and knees, extend opposite arm and leg',
            'is_timed': False,
            'is_reps': True,
            'default_rest_seconds': 30
        },
        {
            'name': 'Leg Raises',
            'category': 'functional',
            'description': 'Lower abdominal strengthening',
            'instructions': 'Lie on back, raise straight legs to 90 degrees',
            'is_timed': False,
            'is_reps': True,
            'default_rest_seconds': 45
        },
        {
            'name': 'Glute Bridges',
            'category': 'functional',
            'description': 'Hip and glute strengthening',
            'instructions': 'Lie on back, lift hips by squeezing glutes',
            'is_timed': False,
            'is_reps': True,
            'default_rest_seconds': 30
        }
    ]
    
    # Walking exercises
    walking_exercises = [
        {
            'name': 'Neighborhood Loop',
            'category': 'walking',
            'description': '1.37 mile walking loop (2,740 steps)',
            'instructions': 'Walk the designated neighborhood route at comfortable pace',
            'is_timed': True,
            'is_reps': False,
            'is_distance': True,
            'default_rest_seconds': 0
        },
        {
            'name': 'Brisk Walk',
            'category': 'walking',
            'description': 'Faster paced walking for cardio',
            'instructions': 'Walk at increased pace to elevate heart rate',
            'is_timed': True,
            'is_reps': False,
            'is_distance': True,
            'default_rest_seconds': 0
        }
    ]
    
    # Add all exercises to database
    all_exercises = qigong_exercises + upper_body_exercises + core_lower_exercises + functional_exercises + walking_exercises
    
    for ex_data in all_exercises:
        exercise = Exercise(**ex_data)
        db.session.add(exercise)
    
    db.session.commit()
    
    return jsonify({'message': f'Successfully seeded {len(all_exercises)} exercises'}), 201

