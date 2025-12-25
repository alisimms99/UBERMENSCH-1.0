from flask import Blueprint, request, jsonify
from ..models.models import db, DiaryEntry
from datetime import datetime
import json

diary_bp = Blueprint('diary', __name__)

def _parse_yyyy_mm_dd(date_str):
    if not date_str:
        return None, jsonify({"error": "Missing required parameter: date (YYYY-MM-DD)"}), 400
    try:
        return datetime.strptime(date_str, '%Y-%m-%d').date(), None, None
    except ValueError:
        return None, jsonify({"error": "Invalid date format. Expected YYYY-MM-DD."}), 400

@diary_bp.route('/entry', methods=['GET'])
def get_entry():
    date_str = request.args.get('date')
    entry_type = request.args.get('type') # morning / evening
    user_id = request.args.get('user_id', 1)
    
    target_date, err_resp, err_code = _parse_yyyy_mm_dd(date_str)
    if err_resp:
        return err_resp, err_code
    if not entry_type:
        return jsonify({"error": "Missing required parameter: type (morning|evening)"}), 400
    
    entry = DiaryEntry.query.filter_by(user_id=user_id, date=target_date, type=entry_type).first()
    
    if not entry:
        return jsonify(None)
        
    return jsonify(entry.to_dict())

@diary_bp.route('/save', methods=['POST'])
def save_entry():
    data = request.get_json(silent=True) or {}
    date_str = data.get('date')
    target_date, err_resp, err_code = _parse_yyyy_mm_dd(date_str)
    if err_resp:
        return err_resp, err_code
    user_id = data.get('user_id', 1)
    entry_type = data.get('type')
    if not entry_type:
        return jsonify({"error": "Missing required field: type (morning|evening)"}), 400
    
    entry = DiaryEntry.query.filter_by(user_id=user_id, date=target_date, type=entry_type).first()
    
    if not entry:
        entry = DiaryEntry(user_id=user_id, date=target_date, type=entry_type)
        db.session.add(entry)
    
    entry.content_json = json.dumps(data.get('content', {}))
    
    db.session.commit()
    return jsonify(entry.to_dict())
