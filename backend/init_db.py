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
from src.models.user import db, User, Exercise, WorkoutTemplate, Workout, WorkoutExercise, ProgressEntry, Achievement, UserAchievement

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
            estimated_duration=30,
            difficulty_level="beginner",
            exercises_config='[{"exercise_id": 1, "reps": 5, "sets": 1}, {"exercise_id": 2, "reps": 5, "sets": 1}, {"exercise_id": 3, "duration": 30, "sets": 1}]'
        )
        db.session.add(template)
        
        # Create sample achievements
        achievements = [
            Achievement(
                name="First Workout",
                description="Complete your first workout",
                category="milestone",
                criteria='{"type": "workout_count", "value": 1}',
                xp_reward=10,
                badge_icon="trophy"
            ),
            Achievement(
                name="Week Warrior",
                description="Complete 7 workouts",
                category="milestone",
                criteria='{"type": "workout_count", "value": 7}',
                xp_reward=50,
                badge_icon="calendar"
            ),
            Achievement(
                name="Pushup Pro",
                description="Complete 100 pushups in a single workout",
                category="progression",
                criteria='{"type": "single_exercise", "exercise": "pushups", "value": 100}',
                xp_reward=100,
                badge_icon="muscle"
            )
        ]
        
        for achievement in achievements:
            db.session.add(achievement)
        
        # Create demo user
        demo_user = User(
            username="demo_user",
            email="demo@fittracker.com",
            age=55,
            weight=225.0,
            height=70.5,
            target_pushups=50,
            target_situps=50,
            target_daily_steps=10000,
            initial_max_pushups=5,
            initial_max_situps=5,
            initial_plank_duration=30,
            current_pushup_target=5,
            current_situp_target=5,
            current_plank_target=30,
            preferred_workout_duration=60,
            workouts_per_week=3,
            onboarding_completed=True,
            created_at=datetime.utcnow()
        )
        db.session.add(demo_user)
        
        # Commit all changes
        db.session.commit()
        
        print("Sample data added successfully!")
        print(f"Database initialized at: {app.config['SQLALCHEMY_DATABASE_URI']}")
        print("Demo user created: demo_user")

if __name__ == "__main__":
    init_database()

