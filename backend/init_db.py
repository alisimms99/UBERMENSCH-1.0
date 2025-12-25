#!/usr/bin/env python3
"""
Database initialization script for the fitness tracker application.
Creates all tables and populates with initial data.
"""

import os
import sys
from datetime import datetime

# Add the src directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from flask import Flask
from src.models import (
    db, User, Achievement, Supplement
)
from src.data.enhanced_seed_templates import create_enhanced_workout_templates, create_enhanced_exercises
import json

def create_app():
    """Create Flask app for database initialization."""
    app = Flask(__name__)
    
    # Database configuration
    basedir = os.path.abspath(os.path.dirname(__file__))
    database_path = os.path.join(basedir, 'src', 'database', 'app.db')
    
    # Ensure database directory exists
    os.makedirs(os.path.dirname(database_path), exist_ok=True)
    
    app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{database_path}'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    db.init_app(app)
    return app

def init_database():
    """Initialize the database with tables and sample data."""
    app = create_app()
    
    with app.app_context():
        print("Creating database tables...")
        
        # Drop all tables and recreate
        db.drop_all()
        db.create_all()
        
        print("Tables created successfully!")
        
        # Seed Exercises first, then Templates
        print("Seeding exercises...")
        exercises_result = create_enhanced_exercises()
        if not exercises_result.get('success', False):
            error_msg = exercises_result.get('error', 'Unknown error')
            print(f"ERROR: Failed to create exercises: {error_msg}. Cannot proceed with template seeding.")
            return
        print(f"Successfully created {exercises_result.get('count', 0)} exercises.")
        
        print("Seeding workout templates...")
        templates_result = create_enhanced_workout_templates()
        if not templates_result:
            print("ERROR: Failed to create workout templates.")
            return
        
        # Create sample achievements
        achievements = [
            Achievement(name="First Workout"),
            Achievement(name="Week Warrior"),
            Achievement(name="Pushup Pro")
        ]
        
        for achievement in achievements:
            db.session.add(achievement)
        
        # Create demo user
        demo_user = User(
            username="Ali",
            email="ali@ubermensch.com",
            age=55,
            weight=225.0,
            height=70.5,
            target_pushups=50,
            target_situps=50,
            target_daily_steps=10000,
            preferred_workout_duration=60,
            workouts_per_week=3,
            onboarding_completed=True,
            created_at=datetime.utcnow()
        )
        db.session.add(demo_user)
        db.session.commit()
        
        # --- Add Supplements (Sprint 1) ---
        user_id = demo_user.id
        supplements = [
            Supplement(
                user_id=user_id,
                name="TRT",
                dosage="varies",
                category="hormone",
                schedule_json=json.dumps({"frequency": "weekly", "times": ["morning"]}),
                form="injection"
            ),
            Supplement(
                user_id=user_id,
                name="Magnesium Glycinate",
                brand="Pure Encapsulations",
                dosage="400mg",
                category="mineral",
                schedule_json=json.dumps({"frequency": "daily", "times": ["evening"]}),
                form="capsule",
                inventory_json=json.dumps({"quantity_remaining": 60, "reorder_threshold": 10})
            ),
            Supplement(
                user_id=user_id,
                name="Omega-3 Fish Oil",
                dosage="2000mg",
                category="fatty acid",
                schedule_json=json.dumps({"frequency": "daily", "times": ["with_meal"]}),
                form="capsule"
            ),
            Supplement(
                user_id=user_id,
                name="Sea Moss",
                dosage="1 tbsp",
                category="superfood",
                schedule_json=json.dumps({"frequency": "daily", "times": ["morning"]}),
                form="gel"
            ),
            Supplement(
                user_id=user_id,
                name="Vitamin D3",
                dosage="5000 IU",
                category="vitamin",
                schedule_json=json.dumps({"frequency": "daily", "times": ["morning"]}),
                form="capsule"
            ),
            Supplement(
                user_id=user_id,
                name="Zinc",
                dosage="30mg",
                category="mineral",
                schedule_json=json.dumps({"frequency": "daily", "times": ["with_meal"]}),
                form="capsule"
            ),
            Supplement(
                user_id=user_id,
                name="B-Complex",
                brand="Methylated",
                category="vitamin",
                schedule_json=json.dumps({"frequency": "daily", "times": ["morning"]}),
                form="capsule"
            )
        ]
        
        for supp in supplements:
            db.session.add(supp)
            
        db.session.commit()
        print("Database initialized successfully!")

if __name__ == '__main__':
    init_database()
