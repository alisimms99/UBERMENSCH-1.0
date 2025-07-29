import os
from flask import Blueprint, jsonify, request
from ..models import db, User
from datetime import datetime

user_bp = Blueprint('user', __name__)

@user_bp.route('/users', methods=['GET'])
def get_users():
    users = User.query.all()
    return jsonify([user.to_dict() for user in users])

@user_bp.route('/users', methods=['POST'])
def create_user():
    data = request.json
    user = User(
        username=data['username'], 
        email=data['email'],
        age=data.get('age'),
        weight=data.get('weight'),
        height=data.get('height')
    )
    db.session.add(user)
    db.session.commit()
    return jsonify(user.to_dict()), 201

@user_bp.route('/users/<int:user_id>', methods=['GET'])
def get_user(user_id):
    user = User.query.get_or_404(user_id)
    return jsonify(user.to_dict())

@user_bp.route('/users/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    user = User.query.get_or_404(user_id)
    data = request.json
    
    # Update basic info
    user.username = data.get('username', user.username)
    user.email = data.get('email', user.email)
    user.age = data.get('age', user.age)
    user.weight = data.get('weight', user.weight)
    user.height = data.get('height', user.height)
    
    # Update fitness goals
    user.target_pushups = data.get('target_pushups', user.target_pushups)
    user.target_situps = data.get('target_situps', user.target_situps)
    user.target_daily_steps = data.get('target_daily_steps', user.target_daily_steps)
    
    # Update preferences
    user.preferred_workout_duration = data.get('preferred_workout_duration', user.preferred_workout_duration)
    user.workouts_per_week = data.get('workouts_per_week', user.workouts_per_week)
    
    db.session.commit()
    return jsonify(user.to_dict())

@user_bp.route('/users/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    user = User.query.get_or_404(user_id)
    db.session.delete(user)
    db.session.commit()
    return '', 204

@user_bp.route('/users/<int:user_id>/fitness-assessment', methods=['POST'])
def complete_fitness_assessment(user_id):
    """Complete initial fitness assessment and calculate targets"""
    user = User.query.get_or_404(user_id)
    data = request.json
    
    user.initial_max_pushups = data.get('max_pushups')
    user.initial_max_situps = data.get('max_situps')
    user.initial_plank_duration = data.get('plank_duration')
    
    # Calculate initial targets
    user.calculate_initial_targets()
    user.onboarding_completed = True
    
    db.session.commit()
    return jsonify(user.to_dict())

@user_bp.route('/users/<int:user_id>/targets', methods=['PUT'])
def update_targets(user_id):
    """Update current workout targets (for progression)"""
    user = User.query.get_or_404(user_id)
    data = request.json
    
    user.current_pushup_target = data.get('pushup_target', user.current_pushup_target)
    user.current_situp_target = data.get('situp_target', user.current_situp_target)
    user.current_plank_target = data.get('plank_target', user.current_plank_target)
    
    db.session.commit()
    return jsonify(user.to_dict())
