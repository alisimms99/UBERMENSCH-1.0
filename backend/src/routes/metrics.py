from flask import Blueprint, request, jsonify
from ..models.models import db, DailyMetrics, VideoSession
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
    video_summary = {
        'count': len(completed_sessions),
        'total_minutes': sum(s.duration_seconds for s in completed_sessions) // 60,
        'categories': list(set(s.category for s in completed_sessions if s.category))
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
            'video_sessions': video_summary
        })

    result = metrics.to_dict()
    result['video_sessions'] = video_summary
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
