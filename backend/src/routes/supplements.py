from flask import Blueprint, request, jsonify
from ..models.models import db, Supplement, SupplementLog
from datetime import datetime, date
import json

supplements_bp = Blueprint('supplements', __name__)

@supplements_bp.route('/list', methods=['GET'])
def get_supplements():
    user_id = request.args.get('user_id', 1, type=int)
        
    supplements = Supplement.query.filter_by(user_id=user_id, is_active=True).all()
    return jsonify([s.to_dict() for s in supplements])

@supplements_bp.route('/add', methods=['POST'])
def add_supplement():
    data = request.json
    
    new_supp = Supplement(
        user_id=int(data.get('user_id', 1)),
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
    if 'interactions' in data: supp.interactions = json.dumps(data['interactions'])
    if 'notes' in data: supp.notes = data['notes']
    
    db.session.commit()
    return jsonify(supp.to_dict())

@supplements_bp.route('/log', methods=['POST'])
def log_supplement():
    # Log that a supplement was taken
    data = request.json
    
    # Validate supplement_id is provided
    supplement_id = data.get('supplement_id')
    if not supplement_id:
        return jsonify({'error': 'supplement_id parameter is required'}), 400
    
    # Validate user_id is provided
    user_id = int(data.get('user_id', 1))
    
    # Validate supplement exists before creating log entry
    supp = Supplement.query.get(supplement_id)
    if not supp:
        return jsonify({'error': f'Supplement with id {supplement_id} not found'}), 404
    
    # Validate supplement belongs to the specified user (security check)
    if supp.user_id != user_id:
        return jsonify({'error': f'Supplement with id {supplement_id} does not belong to user {user_id}'}), 403
    
    log_date_str = data.get('date', date.today().isoformat())
    try:
        log_date = datetime.strptime(log_date_str, '%Y-%m-%d').date()
    except ValueError:
        return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
    
    new_log = SupplementLog(
        user_id=user_id,
        supplement_id=supplement_id,
        date=log_date,
        time_taken=data.get('time_taken', datetime.now().strftime('%H:%M')),
        taken=data.get('taken', True),
        notes=data.get('notes')
    )
    
    # Update inventory (only for the supplement owner)
    if supp.inventory_json:
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
    try:
        target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
    except ValueError:
        return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
    
    user_id = request.args.get('user_id', 1, type=int)
    
    logs = SupplementLog.query.filter_by(user_id=user_id, date=target_date).all()
    return jsonify([l.to_dict() for l in logs])

@supplements_bp.route('/delete/<int:id>', methods=['DELETE'])
def delete_supplement(id):
    supp = Supplement.query.get_or_404(id)
    supp.is_active = False # Soft delete
    db.session.commit()
    return jsonify({"message": "Supplement deleted"})
