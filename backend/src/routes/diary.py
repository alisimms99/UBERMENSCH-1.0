from flask import Blueprint, request, jsonify
from ..models.models import db, DiaryEntry
from datetime import datetime
import json

diary_bp = Blueprint('diary', __name__)

@diary_bp.route('/entry', methods=['GET'])
def get_entry():
    date_str = request.args.get('date')
    if not date_str:
        return jsonify({'error': 'Date parameter is required'}), 400
    
    try:
        target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
    except ValueError:
        return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
    
    entry_type = request.args.get('type') # morning / evening
    user_id = request.args.get('user_id', 1)
    
    entry = DiaryEntry.query.filter_by(user_id=user_id, date=target_date, type=entry_type).first()
    
    if not entry:
        return jsonify(None)
        
    return jsonify(entry.to_dict())

@diary_bp.route('/save', methods=['POST'])
def save_entry():
    data = request.json
    date_str = data.get('date')
    if not date_str:
        return jsonify({'error': 'Date parameter is required'}), 400
    
    try:
        target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
    except ValueError:
        return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
    
    user_id = data.get('user_id', 1)
    entry_type = data.get('type')
    
    entry = DiaryEntry.query.filter_by(user_id=user_id, date=target_date, type=entry_type).first()
    
    if not entry:
        entry = DiaryEntry(user_id=user_id, date=target_date, type=entry_type)
        db.session.add(entry)
    
    entry.content_json = json.dumps(data.get('content', {}))
    
    db.session.commit()
    return jsonify(entry.to_dict())
