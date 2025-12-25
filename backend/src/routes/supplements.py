from flask import Blueprint, request, jsonify
from ..models.models import db, Supplement, SupplementLog
from datetime import datetime, date
import json

supplements_bp = Blueprint('supplements', __name__)

@supplements_bp.route('/list', methods=['GET'])
def get_supplements():
    user_id = request.args.get('user_id')
    if not user_id:
        # Default to first user if not specified (MVP)
        user_id = 1
        
    supplements = Supplement.query.filter_by(user_id=user_id, is_active=True).all()
    return jsonify([s.to_dict() for s in supplements])

@supplements_bp.route('/add', methods=['POST'])
def add_supplement():
    data = request.json
    
    new_supp = Supplement(
        user_id=data.get('user_id', 1),
        name=data['name'],
        brand=data.get('brand'),
        dosage=data.get('dosage'),
        form=data.get('form'),
        category=data.get('category'),
        schedule_json=json.dumps(data.get('schedule', {})),
        inventory_json=json.dumps(data.get('inventory', {})),
        benefits=json.dumps(data.get('benefits', [])),
        interactions=json.dumps(data.get('interactions', [])),
        notes=data.get('notes')
    )
    
    db.session.add(new_supp)
    db.session.commit()
    return jsonify(new_supp.to_dict()), 201

@supplements_bp.route('/update/<int:id>', methods=['PUT'])
def update_supplement(id):
    supp = Supplement.query.get_or_404(id)
    data = request.json
    
    if 'name' in data: supp.name = data['name']
    if 'brand' in data: supp.brand = data['brand']
    if 'dosage' in data: supp.dosage = data['dosage']
    if 'form' in data: supp.form = data['form']
    if 'category' in data: supp.category = data['category']
    if 'schedule' in data: supp.schedule_json = json.dumps(data['schedule'])
    if 'inventory' in data: supp.inventory_json = json.dumps(data['inventory'])
    if 'benefits' in data: supp.benefits = json.dumps(data['benefits'])
    if 'notes' in data: supp.notes = data['notes']
    
    db.session.commit()
    return jsonify(supp.to_dict())

@supplements_bp.route('/log', methods=['POST'])
def log_supplement():
    # Log that a supplement was taken
    data = request.get_json(silent=True) or {}
    log_date_str = data.get('date', date.today().isoformat())
    try:
        log_date = datetime.strptime(log_date_str, '%Y-%m-%d').date()
    except ValueError:
        return jsonify({"error": "Invalid date format. Expected YYYY-MM-DD."}), 400

    supplement_id = data.get('supplement_id')
    if supplement_id is None:
        return jsonify({"error": "Missing required field: supplement_id"}), 400
    
    new_log = SupplementLog(
        user_id=data.get('user_id', 1),
        supplement_id=supplement_id,
        date=log_date,
        time_taken=data.get('time_taken', datetime.now().strftime('%H:%M')),
        taken=data.get('taken', True),
        notes=data.get('notes')
    )
    
    # Update inventory
    supp = Supplement.query.get(supplement_id)
    if supp and supp.inventory_json:
        inventory = json.loads(supp.inventory_json)
        if 'quantity_remaining' in inventory and inventory['quantity_remaining'] > 0:
            inventory['quantity_remaining'] -= 1
            supp.inventory_json = json.dumps(inventory)
    
    db.session.add(new_log)
    db.session.commit()
    return jsonify(new_log.to_dict()), 201

@supplements_bp.route('/logs/<date_str>', methods=['GET'])
def get_logs(date_str):
    # Get logs for a specific date
    target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
    user_id = request.args.get('user_id', 1)
    
    logs = SupplementLog.query.filter_by(user_id=user_id, date=target_date).all()
    return jsonify([l.to_dict() for l in logs])

@supplements_bp.route('/delete/<int:id>', methods=['DELETE'])
def delete_supplement(id):
    supp = Supplement.query.get_or_404(id)
    supp.is_active = False # Soft delete
    db.session.commit()
    return jsonify({"message": "Supplement deleted"})
