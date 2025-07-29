"""
Enhanced Seed Data for Workout Templates with Video Integration
Creates comprehensive workout templates with specific video mappings based on user's video library
"""

import json
from datetime import datetime
from flask import current_app
from ..models import db, Exercise, WorkoutTemplate

def create_enhanced_workout_templates():
    """Seed the database with required workout templates"""
    with current_app.app_context():
        try:
            required_templates = [
                {
                    'name': 'Getting Back Into It',
                    'description': 'Gentle routine for beginners',
                    'estimated_duration_min': 20,
                    'estimated_duration_max': 30,
                    'difficulty_level': 'beginner',
                    'phases': json.dumps(['warmup', 'qigong', 'cooldown'])
                },
                {
                    'name': 'Building Strength',
                    'description': 'Progressive strength training',
                    'estimated_duration_min': 30,
                    'estimated_duration_max': 45,
                    'difficulty_level': 'intermediate',
                    'phases': json.dumps(['warmup', 'strength', 'cooldown'])
                },
                {
                    'name': 'Full Workout',
                    'description': 'Complete fitness routine',
                    'estimated_duration_min': 45,
                    'estimated_duration_max': 60,
                    'difficulty_level': 'advanced',
                    'phases': json.dumps(['warmup', 'cardio', 'strength', 'cooldown'])
                },
                {
                    'name': 'Qigong & Walk',
                    'description': 'Mindful movement practice',
                    'estimated_duration_min': 25,
                    'estimated_duration_max': 40,
                    'difficulty_level': 'beginner',
                    'phases': json.dumps(['qigong', 'walking', 'meditation'])
                }
            ]

            db.session.query(WorkoutTemplate).delete()
            for template_data in required_templates:
                db.session.add(WorkoutTemplate(**template_data))
            
            db.session.commit()
            return True
        except Exception as e:
            print(f"Error creating workout templates: {str(e)}")
            db.session.rollback()
            return False

def create_enhanced_exercises():
    """Seed the database with required exercises"""
    with current_app.app_context():
        try:
            required_exercises = [
                {
                    'name': '8 Brocades Sequence',
                    'category': 'qigong',
                    'description': 'Traditional qigong routine',
                    'instructions': 'Perform all 8 movements slowly with breath control',
                    'is_timed': True,
                    'default_duration_seconds': 600
                },
                {
                    'name': 'Basic Standing Meditation',
                    'category': 'qigong',
                    'description': 'Foundational standing practice',
                    'instructions': 'Stand with proper alignment for 5-10 minutes',
                    'is_timed': True,
                    'default_duration_seconds': 300
                },
                {
                    'name': 'Pushups',
                    'category': 'strength',
                    'description': 'Upper body strength exercise',
                    'instructions': 'Maintain straight body line',
                    'default_reps': 10
                },
                {
                    'name': 'Situps',
                    'category': 'core',
                    'description': 'Abdominal strengthening',
                    'instructions': 'Engage core throughout movement',
                    'default_reps': 15
                },
                {
                    'name': 'Plank Hold',
                    'category': 'core',
                    'description': 'Isometric core exercise',
                    'instructions': 'Maintain straight body line',
                    'is_timed': True,
                    'default_duration_seconds': 60
                }
            ]

            db.session.query(Exercise).delete()
            for exercise_data in required_exercises:
                db.session.add(Exercise(**exercise_data))
            
            db.session.commit()
            return True
        except Exception as e:
            print(f"Error creating exercises: {str(e)}")
            db.session.rollback()
            return False

