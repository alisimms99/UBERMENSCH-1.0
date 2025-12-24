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
from flask_sqlalchemy import SQLAlchemy
from src.models import (
    db, User, Exercise, WorkoutTemplate, Achievement, 
    Supplement, DailyMetrics, SupplementLog, DiaryEntry
)
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
        
        # Create sample exercises
        exercises = [
            Exercise(
                name="Pushups",
                category="upper_body",
                description="Standard pushup exercise for chest, shoulders, and triceps",
                instructions="Start in plank position, lower body to ground, push back up",
                is_timed=False,
                is_reps=True,
                is_distance=False,
                default_rest_seconds=60
            ),
            Exercise(
                name="Situps",
                category="core_lower",
                description="Basic abdominal exercise",
                instructions="Lie on back, knees bent, hands behind head, sit up",
                is_timed=False,
                is_reps=True,
                is_distance=False,
                default_rest_seconds=60
            ),
            Exercise(
                name="Plank",
                category="core_lower",
                description="Isometric core strengthening exercise",
                instructions="Hold plank position with straight body line",
                is_timed=True,
                is_reps=False,
                is_distance=False,
                default_rest_seconds=60
            ),
            Exercise(
                name="Squats",
                category="functional",
                description="Basic lower body exercise",
                instructions="Stand with feet shoulder-width apart, lower into squat position",
                is_timed=False,
                is_reps=True,
                is_distance=False,
                default_rest_seconds=60
            ),
            Exercise(
                name="Walking",
                category="walking",
                description="Low-impact cardiovascular exercise",
                instructions="Walk at a steady pace for the specified duration",
                is_timed=True,
                is_reps=False,
                is_distance=True,
                default_rest_seconds=0
            )
        ]
        
        for exercise in exercises:
            db.session.add(exercise)
        
        # Create sample workout template
        template = WorkoutTemplate(
            name="Basic Fitness",
            description="A simple workout for beginners",
            estimated_duration_min=30,
            estimated_duration_max=45,
            difficulty_level="beginner",
            phases=json.dumps([
                {
                    "name": "Warmup",
                    "exercises": [{"exercise_id": 1, "reps": 5, "sets": 1}]
                }
            ]) 
        )
        db.session.add(template)
        
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
                schedule_json=json.dumps({"frequency": "daily", "times": ["evening"]}),
                form="capsule"
            ),
            Supplement(
                user_id=user_id,
                name="B-Complex",
                dosage="1 cap",
                category="vitamin",
                schedule_json=json.dumps({"frequency": "daily", "times": ["morning"]}),
                form="capsule"
            )
        ]
        
        for supp in supplements:
            db.session.add(supp)
            
        db.session.commit()
        
        print("Sample data added successfully!")
        print(f"Database initialized at: {app.config['SQLALCHEMY_DATABASE_URI']}")
        print("Demo user created: Ali")

if __name__ == "__main__":
    init_database()

