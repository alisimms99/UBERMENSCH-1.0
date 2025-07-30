from flask import Blueprint, request, jsonify
from ..models import db, User, WorkoutTemplate, Exercise, VideoCategory, Video, WorkoutVideoMapping  # Updated import
from datetime import datetime, date
import json

data_management_bp = Blueprint('data_management', __name__)

@data_management_bp.route('/users/<int:user_id>/profile', methods=['PUT'])
def update_user_profile(user_id):
    """Update user profile information"""
    try:
        data = request.get_json()
        user = User.query.get_or_404(user_id)
        
        # Update profile fields
        if 'age' in data:
            user.age = data['age']
        if 'weight' in data:
            user.weight = data['weight']
        if 'height' in data:
            user.height = data['height']
        if 'fitness_level' in data:
            user.fitness_level = data['fitness_level']
        if 'target_pushups' in data:
            user.target_pushups = data['target_pushups']
        if 'target_situps' in data:
            user.target_situps = data['target_situps']
        if 'daily_steps_goal' in data:
            user.daily_steps_goal = data['daily_steps_goal']
        if 'workouts_per_week' in data:
            user.workouts_per_week = data['workouts_per_week']
        if 'preferred_duration' in data:
            user.preferred_duration = data['preferred_duration']
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'user': user.to_dict(),
            'message': 'Profile updated successfully'
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@data_management_bp.route('/users/<int:user_id>/reset-baselines', methods=['POST'])
def reset_user_baselines(user_id):
    """Reset user baselines and re-run fitness assessment"""
    try:
        data = request.get_json()
        user = User.query.get_or_404(user_id)
        
        # Update assessment results
        if 'max_pushups' in data:
            user.max_pushups = data['max_pushups']
            user.current_pushups = max(1, int(data['max_pushups'] * 0.4))
        
        if 'max_situps' in data:
            user.max_situps = data['max_situps']
            user.current_situps = max(1, int(data['max_situps'] * 0.3))
        
        if 'max_plank_duration' in data:
            user.max_plank_duration = data['max_plank_duration']
            user.current_plank_duration = max(10, int(data['max_plank_duration'] * 0.5))
        
        # Reset progression tracking
        user.weeks_completed = 0
        user.last_progression_date = datetime.utcnow().date()
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'user': user.to_dict(),
            'message': 'Baselines reset successfully'
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@data_management_bp.route('/users/<int:user_id>/manual-targets', methods=['PUT'])
def update_manual_targets(user_id):
    """Manually override exercise targets"""
    try:
        data = request.get_json()
        user = User.query.get_or_404(user_id)
        
        # Update current targets manually
        if 'current_pushups' in data:
            user.current_pushups = max(0, data['current_pushups'])
        if 'current_situps' in data:
            user.current_situps = max(0, data['current_situps'])
        if 'current_plank_duration' in data:
            user.current_plank_duration = max(0, data['current_plank_duration'])
        
        # Update progression targets if provided
        if 'target_pushups' in data:
            user.target_pushups = max(0, data['target_pushups'])
        if 'target_situps' in data:
            user.target_situps = max(0, data['target_situps'])
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'user': user.to_dict(),
            'message': 'Targets updated successfully'
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@data_management_bp.route('/users/<int:user_id>/workout-history', methods=['GET'])
def get_workout_history_detailed(user_id):
    """Get detailed workout history with pagination and filtering"""
    try:
        limit = request.args.get('limit', 20, type=int)
        offset = request.args.get('offset', 0, type=int)
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        template_id = request.args.get('template_id', type=int)
        
        query = WorkoutSession.query.filter_by(user_id=user_id)
        
        if start_date:
            query = query.filter(WorkoutSession.date >= datetime.strptime(start_date, '%Y-%m-%d').date())
        if end_date:
            query = query.filter(WorkoutSession.date <= datetime.strptime(end_date, '%Y-%m-%d').date())
        if template_id:
            query = query.filter_by(template_id=template_id)
        
        total_count = query.count()
        sessions = query.order_by(WorkoutSession.date.desc()).offset(offset).limit(limit).all()
        
        return jsonify({
            'success': True,
            'sessions': [session.to_dict() for session in sessions],
            'total_count': total_count,
            'limit': limit,
            'offset': offset
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@data_management_bp.route('/workout-sessions/<int:session_id>', methods=['PUT'])
def edit_workout_session(session_id):
    """Edit a workout session"""
    try:
        data = request.get_json()
        session = WorkoutSession.query.get_or_404(session_id)
        
        # Update session fields
        if 'date' in data:
            session.date = datetime.strptime(data['date'], '%Y-%m-%d').date()
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
        
        # Update exercise logs if provided
        if 'exercise_logs' in data:
            for log_data in data['exercise_logs']:
                if 'id' in log_data:
                    log = ExerciseCompletion.query.get(log_data['id'])
                    if log and log.workout_session_id == session_id:
                        # Update log fields
                        for field in ['actual_sets', 'actual_reps', 'actual_duration', 'notes', 'status']:
                            if field in log_data:
                                setattr(log, field, log_data[field])
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'session': session.to_dict(),
            'message': 'Workout session updated successfully'
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@data_management_bp.route('/workout-sessions/<int:session_id>', methods=['DELETE'])
def delete_workout_session(session_id):
    """Delete a workout session and all associated exercise logs"""
    try:
        session = WorkoutSession.query.get_or_404(session_id)
        
        # Delete associated exercise logs (cascade should handle this, but being explicit)
        ExerciseCompletion.query.filter_by(workout_session_id=session_id).delete()
        
        # Delete the session
        db.session.delete(session)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Workout session deleted successfully'
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@data_management_bp.route('/users/<int:user_id>/clear-data', methods=['POST'])
def clear_user_data(user_id):
    """Clear all user data (factory reset)"""
    try:
        data = request.get_json()
        confirmation = data.get('confirmation', '')
        
        # Require explicit confirmation
        if confirmation != 'CLEAR_ALL_DATA':
            return jsonify({
                'success': False,
                'error': 'Invalid confirmation. Please provide "CLEAR_ALL_DATA" to confirm.'
            }), 400
        
        user = User.query.get_or_404(user_id)
        
        # Delete all workout history and exercise logs
        workout_sessions = WorkoutSession.query.filter_by(user_id=user_id).all()
        for session in workout_sessions:
            ExerciseCompletion.query.filter_by(workout_session_id=session.id).delete()
            db.session.delete(session)
        
        # Delete all progress entries
        ProgressEntry.query.filter_by(user_id=user_id).delete()
        
        # Reset user to initial state
        user.current_pushups = 1
        user.current_situps = 1
        user.current_plank_duration = 10
        user.max_pushups = None
        user.max_situps = None
        user.max_plank_duration = None
        user.weeks_completed = 0
        user.total_workouts = 0
        user.current_streak = 0
        user.longest_streak = 0
        user.last_workout_date = None
        user.last_progression_date = None
        user.onboarding_completed = False
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'user': user.to_dict(),
            'message': 'All user data cleared successfully'
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@data_management_bp.route('/users/<int:user_id>/export-data', methods=['GET'])
def export_user_data(user_id):
    """Export all user data as JSON"""
    try:
        user = User.query.get_or_404(user_id)
        
        # Get all workout history
        workout_sessions = WorkoutSession.query.filter_by(user_id=user_id).all()
        
        # Get all progress entries
        progress_entries = ProgressEntry.query.filter_by(user_id=user_id).all()
        
        # Compile export data
        export_data = {
            'user_profile': user.to_dict(),
            'workout_history': [session.to_dict() for session in workout_sessions],
            'progress_entries': [entry.to_dict() for entry in progress_entries],
            'export_date': datetime.utcnow().isoformat(),
            'export_version': '1.0'
        }
        
        return jsonify({
            'success': True,
            'data': export_data,
            'message': 'Data exported successfully'
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@data_management_bp.route('/users/<int:user_id>/import-data', methods=['POST'])
def import_user_data(user_id):
    """Import user data from JSON (with validation)"""
    try:
        data = request.get_json()
        import_data = data.get('data', {})
        
        # Validate import data structure
        required_keys = ['user_profile', 'workout_history', 'progress_entries']
        if not all(key in import_data for key in required_keys):
            return jsonify({
                'success': False,
                'error': 'Invalid import data structure'
            }), 400
        
        user = User.query.get_or_404(user_id)
        
        # Import user profile (selective fields only)
        profile_data = import_data['user_profile']
        safe_fields = ['age', 'weight', 'height', 'fitness_level', 'target_pushups', 
                      'target_situps', 'daily_steps_goal', 'workouts_per_week', 
                      'preferred_duration']
        
        for field in safe_fields:
            if field in profile_data:
                setattr(user, field, profile_data[field])
        
        # Note: Workout history and progress entries import would require more complex logic
        # to handle ID conflicts and data validation. For now, just update profile.
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'user': user.to_dict(),
            'message': 'Profile data imported successfully'
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@data_management_bp.route('/users/<int:user_id>/progress-targets', methods=['POST'])
def update_progress_targets(user_id):
    """Update user's current targets based on progression schedule"""
    try:
        user = User.query.get_or_404(user_id)
        
        # Apply standard progression: +2 pushups, +3 situps, +10s plank
        user.current_pushups += 2
        user.current_situps += 3
        user.current_plank_duration += 10
        
        # Update progression tracking
        user.weeks_completed += 1
        user.last_progression_date = datetime.utcnow().date()
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'user': user.to_dict(),
            'message': 'Progress targets updated successfully',
            'new_targets': {
                'pushups': user.current_pushups,
                'situps': user.current_situps,
                'plank_duration': user.current_plank_duration
            }
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

