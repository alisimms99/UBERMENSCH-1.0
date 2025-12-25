from flask import Blueprint, request, jsonify
from ..models.models import db, DailyMetrics
from datetime import datetime
import json

metrics_bp = Blueprint('metrics', __name__)

@metrics_bp.route('/daily/<date_str>', methods=['GET'])
def get_daily_metrics(date_str):
    try:
        target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
    except ValueError:
        return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
    
    user_id = request.args.get('user_id', 1)
    
    metrics = DailyMetrics.query.filter_by(user_id=user_id, date=target_date).first()
    
    if not metrics:
        return jsonify(None)
        
    return jsonify(metrics.to_dict())

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
    
    user_id = data.get('user_id', 1)
    
    metrics = DailyMetrics.query.filter_by(user_id=user_id, date=target_date).first()
    
    if not metrics:
        metrics = DailyMetrics(user_id=user_id, date=target_date)
        db.session.add(metrics)
    
    # Update morning fields
    morning_data = data.get('morning', {})
    metrics.morning_wake_time = morning_data.get('wake_time')
    metrics.morning_sleep_quality = morning_data.get('sleep_quality')
    metrics.morning_energy_level = morning_data.get('energy_level')
    metrics.morning_mood = morning_data.get('mood')
    metrics.morning_weight = morning_data.get('weight')
    metrics.morning_symptoms = json.dumps(morning_data.get('symptoms', []))
    metrics.morning_notes = morning_data.get('notes')
    
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
    
    user_id = data.get('user_id', 1)
    
    metrics = DailyMetrics.query.filter_by(user_id=user_id, date=target_date).first()
    
    if not metrics:
        metrics = DailyMetrics(user_id=user_id, date=target_date)
        db.session.add(metrics)
    
    # Update evening fields
    evening_data = data.get('evening', {})
    metrics.evening_energy_level = evening_data.get('energy_level')
    metrics.evening_mood = evening_data.get('mood')
    metrics.evening_libido = evening_data.get('libido')
    metrics.evening_stress_level = evening_data.get('stress_level')
    metrics.evening_cramping = evening_data.get('cramping')
    metrics.evening_symptoms = json.dumps(evening_data.get('symptoms', []))
    metrics.evening_notes = evening_data.get('notes')
    
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
    
    user_id = data.get('user_id', 1)
    
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
