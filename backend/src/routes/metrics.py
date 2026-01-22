from flask import Blueprint, request, jsonify
from ..models.models import db, DailyMetrics, VideoSession, WorkoutSession
from datetime import datetime, timedelta
import json

metrics_bp = Blueprint('metrics', __name__)

@metrics_bp.route('/daily/<date_str>', methods=['GET'])
def get_daily_metrics(date_str):
    try:
        target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
    except ValueError:
        return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400

    user_id = request.args.get('user_id', 1, type=int)

    metrics = DailyMetrics.query.filter_by(user_id=user_id, date=target_date).first()

    # Query video sessions for this date
    day_start = datetime.combine(target_date, datetime.min.time())
    day_end = day_start + timedelta(days=1)

    video_sessions = VideoSession.query.filter(
        VideoSession.user_id == user_id,
        VideoSession.started_at >= day_start,
        VideoSession.started_at < day_end
    ).all()

    completed_sessions = [s for s in video_sessions if s.completed]

    # Check for completed scheduled workouts on this day (for "Extra Effort" indicator)
    scheduled_workouts_completed = WorkoutSession.query.filter(
        WorkoutSession.user_id == user_id,
        WorkoutSession.date == target_date,
        WorkoutSession.status == 'completed'
    ).count()

    # Extra effort = user did both a scheduled workout AND video workout(s)
    extra_effort = scheduled_workouts_completed > 0 and len(completed_sessions) > 0

    video_summary = {
        'count': len(completed_sessions),
        'total_minutes': sum(s.duration_seconds for s in completed_sessions) // 60,
        'categories': list(set(s.category for s in completed_sessions if s.category)),
        'extra_effort': extra_effort
    }

    if not metrics:
        # Return empty/default metrics object instead of 404
        # This allows frontend to display empty forms for new days
        # Structure matches DailyMetrics.to_dict() format
        return jsonify({
            'id': None,
            'date': target_date.isoformat(),
            'morning': {
                'wake_time': None,
                'sleep_quality': None,
                'energy_level': None,
                'mood': None,
                'weight': None,
                'symptoms': [],
                'notes': None
            },
            'evening': {
                'energy_level': None,
                'mood': None,
                'libido': None,
                'stress_level': None,
                'cramping': None,
                'symptoms': [],
                'notes': None
            },
            'throughout_day': {
                'water_oz': None,
                'movement_minutes': None,
                'steps': None,
                'bowel_movements': None,
                'supplements_taken': False
            },
            'video_sessions': video_summary,
            'extra_effort': extra_effort
        })

    result = metrics.to_dict()
    result['video_sessions'] = video_summary
    result['extra_effort'] = extra_effort
    return jsonify(result)

@metrics_bp.route('/morning', methods=['POST'])
def save_morning_checkin():
    data = request.json
    date_str = data.get('date')
    if not date_str:
        return jsonify({'error': 'Date parameter is required'}), 400
    
    try:
        target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
    except ValueError:
        return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
    
    user_id = int(data.get('user_id', 1))
    
    metrics = DailyMetrics.query.filter_by(user_id=user_id, date=target_date).first()
    
    if not metrics:
        metrics = DailyMetrics(user_id=user_id, date=target_date)
        db.session.add(metrics)
    
    # Update morning fields (only if provided)
    morning_data = data.get('morning', {})
    if 'wake_time' in morning_data: metrics.morning_wake_time = morning_data.get('wake_time')
    if 'sleep_quality' in morning_data: metrics.morning_sleep_quality = morning_data.get('sleep_quality')
    if 'energy_level' in morning_data: metrics.morning_energy_level = morning_data.get('energy_level')
    if 'mood' in morning_data: metrics.morning_mood = morning_data.get('mood')
    if 'weight' in morning_data: metrics.morning_weight = morning_data.get('weight')
    if 'symptoms' in morning_data: metrics.morning_symptoms = json.dumps(morning_data.get('symptoms', []))
    if 'notes' in morning_data: metrics.morning_notes = morning_data.get('notes')
    
    db.session.commit()
    return jsonify(metrics.to_dict())

@metrics_bp.route('/evening', methods=['POST'])
def save_evening_checkin():
    data = request.json
    date_str = data.get('date')
    if not date_str:
        return jsonify({'error': 'Date parameter is required'}), 400
    
    try:
        target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
    except ValueError:
        return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
    
    user_id = int(data.get('user_id', 1))
    
    metrics = DailyMetrics.query.filter_by(user_id=user_id, date=target_date).first()
    
    if not metrics:
        metrics = DailyMetrics(user_id=user_id, date=target_date)
        db.session.add(metrics)
    
    # Update evening fields (only if provided)
    evening_data = data.get('evening', {})
    if 'energy_level' in evening_data: metrics.evening_energy_level = evening_data.get('energy_level')
    if 'mood' in evening_data: metrics.evening_mood = evening_data.get('mood')
    if 'libido' in evening_data: metrics.evening_libido = evening_data.get('libido')
    if 'stress_level' in evening_data: metrics.evening_stress_level = evening_data.get('stress_level')
    if 'cramping' in evening_data: metrics.evening_cramping = evening_data.get('cramping')
    if 'symptoms' in evening_data: metrics.evening_symptoms = json.dumps(evening_data.get('symptoms', []))
    if 'notes' in evening_data: metrics.evening_notes = evening_data.get('notes')
    
    db.session.commit()
    return jsonify(metrics.to_dict())

@metrics_bp.route('/update_day', methods=['POST'])
def update_day_metrics():
    # Update throughout day metrics (water, steps, etc)
    data = request.json
    date_str = data.get('date')
    if not date_str:
        return jsonify({'error': 'Date parameter is required'}), 400
    
    try:
        target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
    except ValueError:
        return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
    
    user_id = int(data.get('user_id', 1))
    
    metrics = DailyMetrics.query.filter_by(user_id=user_id, date=target_date).first()
    
    if not metrics:
        metrics = DailyMetrics(user_id=user_id, date=target_date)
        db.session.add(metrics)
        
    if 'water_oz' in data: metrics.water_oz = data['water_oz']
    if 'steps' in data: metrics.steps = data['steps']
    if 'movement_minutes' in data: metrics.movement_minutes = data['movement_minutes']
    if 'bowel_movements' in data: metrics.bowel_movements = data['bowel_movements']
    
    db.session.commit()
    return jsonify(metrics.to_dict())

@metrics_bp.route('/progress/analytics', methods=['GET'])
def get_progress_analytics():
    """Get aggregated progress analytics for a user over a time period"""
    user_id = request.args.get('user_id', 1, type=int)
    days = request.args.get('days', 30, type=int)
    
    # Calculate date range
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)
    
    # Get all completed video sessions in the time period
    sessions = VideoSession.query.filter(
        VideoSession.user_id == user_id,
        VideoSession.started_at >= start_date,
        VideoSession.started_at <= end_date,
        VideoSession.completed == True
    ).order_by(VideoSession.started_at).all()
    
    # Calculate total workout time
    total_minutes = sum(s.duration_seconds for s in sessions) // 60
    total_sessions = len(sessions)
    
    # Category breakdown - sum seconds first to avoid undercounting
    category_stats = {}
    for session in sessions:
        cat = session.category or 'Uncategorized'
        if cat not in category_stats:
            category_stats[cat] = {'count': 0, 'seconds': 0}
        category_stats[cat]['count'] += 1
        category_stats[cat]['seconds'] += session.duration_seconds
    
    # Convert seconds to minutes after aggregation
    for cat in category_stats:
        category_stats[cat]['minutes'] = category_stats[cat]['seconds'] // 60
        del category_stats[cat]['seconds']
    
    # Calculate streaks
    streaks = calculate_streaks(user_id, sessions)
    
    # Daily workout data for charts - sum seconds first to avoid undercounting
    daily_data = {}
    for session in sessions:
        date_key = session.started_at.date().isoformat()
        if date_key not in daily_data:
            daily_data[date_key] = {'count': 0, 'seconds': 0, 'categories': set()}
        daily_data[date_key]['count'] += 1
        daily_data[date_key]['seconds'] += session.duration_seconds
        if session.category:
            daily_data[date_key]['categories'].add(session.category)
    
    # Convert to list format for charts (convert seconds to minutes after aggregation)
    daily_workout_data = [
        [date, data['seconds'] // 60]
        for date, data in sorted(daily_data.items())
    ]
    
    # Weekly summary
    weeks_data = calculate_weekly_summary(sessions, start_date, end_date)
    
    return jsonify({
        'period_days': days,
        'start_date': start_date.date().isoformat(),
        'end_date': end_date.date().isoformat(),
        'total_sessions': total_sessions,
        'total_minutes': total_minutes,
        'avg_session_duration': total_minutes // total_sessions if total_sessions > 0 else 0,
        'category_breakdown': category_stats,
        'current_streaks': streaks,
        'daily_workout_data': daily_workout_data,
        'weekly_summary': weeks_data
    })

def calculate_streaks(user_id, sessions):
    """Calculate current workout streaks"""
    if not sessions:
        return {'workout': 0, 'qigong': 0}
    
    # Get all sessions ordered by date
    all_sessions = VideoSession.query.filter(
        VideoSession.user_id == user_id,
        VideoSession.completed == True
    ).order_by(VideoSession.started_at.desc()).all()
    
    if not all_sessions:
        return {'workout': 0, 'qigong': 0}
    
    # Calculate overall workout streak
    workout_streak = 0
    current_date = datetime.utcnow().date()
    
    # Group sessions by date
    sessions_by_date = {}
    for session in all_sessions:
        date = session.started_at.date()
        if date not in sessions_by_date:
            sessions_by_date[date] = []
        sessions_by_date[date].append(session)
    
    # Check if there's a session today or yesterday (to start the streak)
    yesterday = current_date - timedelta(days=1)
    if current_date not in sessions_by_date and yesterday not in sessions_by_date:
        return {'workout': 0, 'qigong': 0}
    
    # Start from today or yesterday
    check_date = current_date if current_date in sessions_by_date else yesterday
    
    # Count consecutive days with workouts
    while check_date in sessions_by_date:
        workout_streak += 1
        check_date -= timedelta(days=1)
    
    # Calculate qigong-specific streak
    qigong_streak = 0
    check_date = current_date if current_date in sessions_by_date else yesterday
    
    while check_date in sessions_by_date:
        # Check if any session on this day is qigong-related
        has_qigong = any(
            'qigong' in (s.category or '').lower() or 
            'chi gong' in (s.category or '').lower() or
            'tai chi' in (s.category or '').lower()
            for s in sessions_by_date[check_date]
        )
        if has_qigong:
            qigong_streak += 1
            check_date -= timedelta(days=1)
        else:
            break
    
    return {
        'workout': workout_streak,
        'qigong': qigong_streak
    }

def calculate_weekly_summary(sessions, start_date, end_date):
    """Calculate weekly workout summaries"""
    weeks = {}
    
    for session in sessions:
        # Get the week number
        week_start = session.started_at.date() - timedelta(days=session.started_at.weekday())
        week_key = week_start.isoformat()
        
        if week_key not in weeks:
            weeks[week_key] = {
                'week_start': week_key,
                'sessions': 0,
                'minutes': 0,
                'categories': set()
            }
        
        weeks[week_key]['sessions'] += 1
        weeks[week_key]['minutes'] += session.duration_seconds
        if session.category:
            weeks[week_key]['categories'].add(session.category)
    
    # Convert to list and format (convert seconds to minutes after aggregation)
    weekly_data = []
    for week_key in sorted(weeks.keys()):
        week = weeks[week_key]
        weekly_data.append({
            'week_start': week['week_start'],
            'sessions': week['sessions'],
            'minutes': week['minutes'] // 60,
            'categories': list(week['categories'])
        })
    
    return weekly_data
