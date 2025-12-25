from flask import Blueprint, jsonify, request
from ..models import db, ProgressEntry, Achievement, UserAchievement, User
from datetime import datetime, date, timedelta
from sqlalchemy import func
import json

progress_bp = Blueprint('progress', __name__)

@progress_bp.route('/users/<int:user_id>/progress', methods=['GET'])
def get_user_progress(user_id):
    """Get progress entries for a user"""
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    limit = request.args.get('limit', 30, type=int)
    
    query = ProgressEntry.query.filter_by(user_id=user_id)
    
    if start_date:
        query = query.filter(ProgressEntry.date >= datetime.fromisoformat(start_date).date())
    if end_date:
        query = query.filter(ProgressEntry.date <= datetime.fromisoformat(end_date).date())
    
    progress_entries = query.order_by(ProgressEntry.date.desc()).limit(limit).all()
    return jsonify([entry.to_dict() for entry in progress_entries])

@progress_bp.route('/users/<int:user_id>/progress', methods=['POST'])
def create_progress_entry(user_id):
    """Create or update today's progress entry"""
    data = request.json
    entry_date = datetime.fromisoformat(data['date']).date() if data.get('date') else date.today()
    
    # Check if entry already exists for this date
    existing_entry = ProgressEntry.query.filter_by(user_id=user_id, date=entry_date).first()
    
    if existing_entry:
        # Update existing entry
        entry = existing_entry
    else:
        # Create new entry
        entry = ProgressEntry(user_id=user_id, date=entry_date)
        db.session.add(entry)
    
    # Update fields
    entry.daily_steps = data.get('daily_steps', entry.daily_steps)
    entry.walking_loops = data.get('walking_loops', entry.walking_loops)
    entry.max_pushups = data.get('max_pushups', entry.max_pushups)
    entry.max_situps = data.get('max_situps', entry.max_situps)
    entry.max_plank_duration = data.get('max_plank_duration', entry.max_plank_duration)
    entry.qigong_streak = data.get('qigong_streak', entry.qigong_streak)
    entry.workout_streak = data.get('workout_streak', entry.workout_streak)
    entry.walking_streak = data.get('walking_streak', entry.walking_streak)
    entry.xp_earned = data.get('xp_earned', entry.xp_earned)
    entry.current_level = data.get('current_level', entry.current_level)
    entry.notes = data.get('notes', entry.notes)
    
    db.session.commit()
    return jsonify(entry.to_dict()), 201

@progress_bp.route('/users/<int:user_id>/progress/today', methods=['GET'])
def get_today_progress(user_id):
    """Get today's progress entry"""
    today = date.today()
    entry = ProgressEntry.query.filter_by(user_id=user_id, date=today).first()
    
    if entry:
        return jsonify(entry.to_dict())
    else:
        # Return empty progress entry for today
        return jsonify({
            'user_id': user_id,
            'date': today.isoformat(),
            'daily_steps': 0,
            'walking_loops': 0,
            'qigong_streak': 0,
            'workout_streak': 0,
            'walking_streak': 0,
            'xp_earned': 0,
            'current_level': 1
        })

@progress_bp.route('/users/<int:user_id>/progress/analytics', methods=['GET'])
def get_progress_analytics(user_id):
    """Get comprehensive progress analytics"""
    days = request.args.get('days', 30, type=int)
    start_date = date.today() - timedelta(days=days)
    
    # Get progress entries for the period
    entries = ProgressEntry.query.filter(
        ProgressEntry.user_id == user_id,
        ProgressEntry.date >= start_date
    ).order_by(ProgressEntry.date.asc()).all()
    
    if not entries:
        return jsonify({
            'period_days': days,
            'total_entries': 0,
            'analytics': {}
        })
    
    # Calculate analytics
    total_steps = sum(entry.daily_steps for entry in entries)
    total_loops = sum(entry.walking_loops for entry in entries)
    avg_daily_steps = total_steps / len(entries) if entries else 0
    
    # Get max values progression
    max_pushups_progression = [(entry.date.isoformat(), entry.max_pushups) for entry in entries if entry.max_pushups]
    max_situps_progression = [(entry.date.isoformat(), entry.max_situps) for entry in entries if entry.max_situps]
    plank_progression = [(entry.date.isoformat(), entry.max_plank_duration) for entry in entries if entry.max_plank_duration]
    
    # Get current streaks
    latest_entry = entries[-1] if entries else None
    current_streaks = {
        'qigong': latest_entry.qigong_streak if latest_entry else 0,
        'workout': latest_entry.workout_streak if latest_entry else 0,
        'walking': latest_entry.walking_streak if latest_entry else 0
    }
    
    # Calculate step goal achievement rate
    user = User.query.get(user_id)
    step_goal = user.target_daily_steps if user else 10000
    days_met_step_goal = sum(1 for entry in entries if entry.daily_steps >= step_goal)
    step_goal_rate = (days_met_step_goal / len(entries) * 100) if entries else 0
    
    return jsonify({
        'period_days': days,
        'total_entries': len(entries),
        'analytics': {
            'total_steps': total_steps,
            'total_walking_loops': total_loops,
            'avg_daily_steps': round(avg_daily_steps),
            'step_goal_achievement_rate': round(step_goal_rate, 1),
            'days_met_step_goal': days_met_step_goal,
            'current_streaks': current_streaks,
            'max_pushups_progression': max_pushups_progression,
            'max_situps_progression': max_situps_progression,
            'plank_duration_progression': plank_progression,
            'daily_steps_data': [(entry.date.isoformat(), entry.daily_steps) for entry in entries]
        }
    })

@progress_bp.route('/users/<int:user_id>/update-streaks', methods=['POST'])
def update_streaks(user_id):
    """Update user streaks based on today's activities"""
    data = request.json
    today = date.today()
    
    # Get or create today's progress entry
    entry = ProgressEntry.query.filter_by(user_id=user_id, date=today).first()
    if not entry:
        entry = ProgressEntry(user_id=user_id, date=today)
        db.session.add(entry)
    
    # Get yesterday's entry for streak calculation
    yesterday = today - timedelta(days=1)
    yesterday_entry = ProgressEntry.query.filter_by(user_id=user_id, date=yesterday).first()
    
    # Update streaks based on activities
    if data.get('completed_qigong'):
        entry.qigong_streak = (yesterday_entry.qigong_streak if yesterday_entry else 0) + 1
    else:
        entry.qigong_streak = 0
    
    if data.get('completed_workout'):
        entry.workout_streak = (yesterday_entry.workout_streak if yesterday_entry else 0) + 1
    else:
        entry.workout_streak = 0
    
    if data.get('completed_walking'):
        entry.walking_streak = (yesterday_entry.walking_streak if yesterday_entry else 0) + 1
    else:
        entry.walking_streak = 0
    
    # Award XP for activities
    xp_earned = 0
    if data.get('completed_qigong'):
        xp_earned += 50
    if data.get('completed_workout'):
        xp_earned += 100
    if data.get('completed_walking'):
        xp_earned += 75
    
    entry.xp_earned += xp_earned
    
    # Calculate level (every 1000 XP = 1 level)
    total_xp = db.session.query(func.sum(ProgressEntry.xp_earned)).filter_by(user_id=user_id).scalar() or 0
    entry.current_level = (total_xp // 1000) + 1
    
    db.session.commit()
    return jsonify(entry.to_dict())

@progress_bp.route('/achievements', methods=['GET'])
def get_achievements():
    """Get all available achievements"""
    achievements = Achievement.query.all()
    return jsonify([achievement.to_dict() for achievement in achievements])

@progress_bp.route('/users/<int:user_id>/achievements', methods=['GET'])
def get_user_achievements(user_id):
    """Get achievements earned by a user"""
    user_achievements = UserAchievement.query.filter_by(user_id=user_id).all()
    return jsonify([ua.to_dict() for ua in user_achievements])

@progress_bp.route('/users/<int:user_id>/check-achievements', methods=['POST'])
def check_achievements(user_id):
    """Check and award new achievements for a user"""
    # Validate user exists
    User.query.get_or_404(user_id)
    
    # Get user's current progress
    latest_progress = ProgressEntry.query.filter_by(user_id=user_id).order_by(ProgressEntry.date.desc()).first()
    if not latest_progress:
        return jsonify({'new_achievements': []})
    
    # Get already earned achievements
    earned_achievement_ids = set(
        ua.achievement_id for ua in UserAchievement.query.filter_by(user_id=user_id).all()
    )
    
    new_achievements = []
    
    # Check milestone achievements
    achievements_to_check = [
        (1, 'First Pushup', latest_progress.max_pushups and latest_progress.max_pushups >= 1),
        (2, 'First 10 Pushups', latest_progress.max_pushups and latest_progress.max_pushups >= 10),
        (3, 'First Situp', latest_progress.max_situps and latest_progress.max_situps >= 1),
        (4, 'First 10 Situps', latest_progress.max_situps and latest_progress.max_situps >= 10),
        (5, '7-Day Qigong Streak', latest_progress.qigong_streak >= 7),
        (6, '7-Day Workout Streak', latest_progress.workout_streak >= 7),
        (7, '30-Day Qigong Streak', latest_progress.qigong_streak >= 30),
        (8, 'Level 5 Reached', latest_progress.current_level >= 5),
        (9, '10,000 Steps', latest_progress.daily_steps >= 10000),
        (10, 'Plank Master', latest_progress.max_plank_duration and latest_progress.max_plank_duration >= 120)
    ]
    
    for achievement_id, name, condition in achievements_to_check:
        if condition and achievement_id not in earned_achievement_ids:
            # Award achievement
            user_achievement = UserAchievement(
                user_id=user_id,
                achievement_id=achievement_id,
                earned_at=datetime.utcnow()
            )
            db.session.add(user_achievement)
            
            # Add XP reward
            achievement = Achievement.query.get(achievement_id)
            if achievement:
                latest_progress.xp_earned += achievement.xp_reward
                new_achievements.append(achievement.to_dict())
    
    db.session.commit()
    return jsonify({'new_achievements': new_achievements})

@progress_bp.route('/seed-achievements', methods=['POST'])
def seed_achievements():
    """Seed the database with default achievements"""
    
    if Achievement.query.count() > 0:
        return jsonify({'message': 'Achievements already seeded'}), 200
    
    achievements_data = [
        {
            'id': 1,
            'name': 'First Pushup',
            'description': 'Complete your first pushup',
            'category': 'milestone',
            'criteria': json.dumps({'max_pushups': 1}),
            'xp_reward': 100,
            'badge_icon': '💪'
        },
        {
            'id': 2,
            'name': 'Pushup Warrior',
            'description': 'Complete 10 pushups in a single session',
            'category': 'milestone',
            'criteria': json.dumps({'max_pushups': 10}),
            'xp_reward': 250,
            'badge_icon': '🏆'
        },
        {
            'id': 3,
            'name': 'First Situp',
            'description': 'Complete your first situp',
            'category': 'milestone',
            'criteria': json.dumps({'max_situps': 1}),
            'xp_reward': 100,
            'badge_icon': '🎯'
        },
        {
            'id': 4,
            'name': 'Core Champion',
            'description': 'Complete 10 situps in a single session',
            'category': 'milestone',
            'criteria': json.dumps({'max_situps': 10}),
            'xp_reward': 250,
            'badge_icon': '⭐'
        },
        {
            'id': 5,
            'name': 'Qigong Week',
            'description': 'Practice qigong for 7 consecutive days',
            'category': 'streak',
            'criteria': json.dumps({'qigong_streak': 7}),
            'xp_reward': 300,
            'badge_icon': '🧘'
        },
        {
            'id': 6,
            'name': 'Workout Week',
            'description': 'Complete workouts for 7 consecutive days',
            'category': 'streak',
            'criteria': json.dumps({'workout_streak': 7}),
            'xp_reward': 400,
            'badge_icon': '🔥'
        },
        {
            'id': 7,
            'name': 'Qigong Master',
            'description': 'Practice qigong for 30 consecutive days',
            'category': 'streak',
            'criteria': json.dumps({'qigong_streak': 30}),
            'xp_reward': 1000,
            'badge_icon': '🏅'
        },
        {
            'id': 8,
            'name': 'Level Up',
            'description': 'Reach level 5',
            'category': 'progression',
            'criteria': json.dumps({'level': 5}),
            'xp_reward': 500,
            'badge_icon': '📈'
        },
        {
            'id': 9,
            'name': 'Step Counter',
            'description': 'Walk 10,000 steps in a single day',
            'category': 'milestone',
            'criteria': json.dumps({'daily_steps': 10000}),
            'xp_reward': 200,
            'badge_icon': '👟'
        },
        {
            'id': 10,
            'name': 'Plank Master',
            'description': 'Hold a plank for 2 minutes',
            'category': 'milestone',
            'criteria': json.dumps({'plank_duration': 120}),
            'xp_reward': 350,
            'badge_icon': '🛡️'
        }
    ]
    
    for ach_data in achievements_data:
        achievement = Achievement(**ach_data)
        db.session.add(achievement)
    
    db.session.commit()
    return jsonify({'message': f'Successfully seeded {len(achievements_data)} achievements'}), 201

