"""
Enhanced Seed Data for Workout Templates
Creates comprehensive workout templates with specific video mappings based on user's video library
"""

import json
from flask import current_app
from ..models import db, Exercise, WorkoutTemplate, WorkoutTemplateExercise

def create_enhanced_exercises():
    """Seed the database with reusable exercises"""
    with current_app.app_context():
        try:
            # 1. Define Reusable Exercises
            exercises_data = [
                # Qigong
                {'name': '8 Brocades Sequence', 'category': 'qigong', 'is_timed': True, 'default_duration_seconds': 600},
                {'name': 'Standing Meditation', 'category': 'qigong', 'is_timed': True, 'default_duration_seconds': 300},
                {'name': 'Cloud Hands', 'category': 'qigong', 'is_timed': True, 'default_duration_seconds': 180},
                
                # Warmup
                {'name': 'Arm Circles', 'category': 'warmup', 'is_timed': False, 'default_reps': 20},
                {'name': 'Jumping Jacks', 'category': 'warmup', 'is_timed': False, 'default_reps': 30},
                {'name': 'High Knees', 'category': 'warmup', 'is_timed': True, 'default_duration_seconds': 60},

                # Strength
                {'name': 'Pushups', 'category': 'strength', 'default_reps': 10},
                {'name': 'Situps', 'category': 'core', 'default_reps': 15},
                {'name': 'Squats', 'category': 'strength', 'default_reps': 20},
                {'name': 'Lunges', 'category': 'strength', 'default_reps': 10},
                {'name': 'Plank', 'category': 'core', 'is_timed': True, 'default_duration_seconds': 45},
                {'name': 'Glute Bridges', 'category': 'core', 'default_reps': 15},
                {'name': 'Mountain Climbers', 'category': 'cardio', 'is_timed': True, 'default_duration_seconds': 45},

                # Cooldown / Yoga
                {'name': 'Childs Pose', 'category': 'cooldown', 'is_timed': True, 'default_duration_seconds': 60},
                {'name': 'Cat-Cow', 'category': 'cooldown', 'default_reps': 10},
                
                # Cardio
                {'name': 'Walking', 'category': 'cardio', 'is_distance': True, 'is_timed': True, 'default_duration_seconds': 1200}
            ]

            # Clear existing exercises (cascade will handle mappings)
            db.session.query(Exercise).delete()
            
            created_exercises = {}
            for ex in exercises_data:
                new_ex = Exercise(**ex)
                db.session.add(new_ex)
                # Flush to get ID if needed, but we'll query back or use object reference
                created_exercises[ex['name']] = new_ex
            
            db.session.commit()
            return created_exercises
        except Exception as e:
            print(f"Error creating exercises: {str(e)}")
            db.session.rollback()
            return False

def create_enhanced_workout_templates():
    """Seed the database with workout templates and associations"""
    with current_app.app_context():
        try:
            # Re-fetch exercises to ensure we have attached instances
            exercises = {e.name: e for e in Exercise.query.all()}
            if not exercises:
                # If separate call, try creating them
                create_enhanced_exercises()
                exercises = {e.name: e for e in Exercise.query.all()}

            # Clear existing templates
            db.session.query(WorkoutTemplate).delete()

            # 1. Getting Back Into It
            t1 = WorkoutTemplate(
                name='Getting Back Into It',
                description='Gentle routine for beginners to mobilize joints and wake up muscles.',
                estimated_duration_min=20,
                estimated_duration_max=30,
                difficulty_level='beginner'
            )
            db.session.add(t1)
            db.session.flush()

            # T1 Associations
            t1_items = [
                ('Arm Circles', 'warmup', 1, 20, 1, 0),
                ('High Knees', 'warmup', 2, 0, 1, 30),
                ('Squats', 'main', 3, 10, 2, 0),
                ('Wall Pushups', 'main', 4, 10, 2, 0), # Fallback if specific exercise missing?
                ('Glute Bridges', 'main', 5, 12, 2, 0),
                ('Plank', 'main', 6, 0, 2, 20),
                ('Childs Pose', 'cooldown', 7, 0, 1, 60)
            ]
            
            for name, phase, order, reps, sets, dur in t1_items:
                ex = exercises.get(name)
                # Handle "Wall Pushups" fallback to "Pushups" for MVP
                if not ex and 'Pushups' in name: ex = exercises.get('Pushups')
                
                if ex:
                    assoc = WorkoutTemplateExercise(
                        template_id=t1.id,
                        exercise_id=ex.id,
                        phase=phase,
                        sort_order=order,
                        target_reps=reps if reps > 0 else None,
                        target_sets=sets,
                        target_duration_seconds=dur if dur > 0 else None
                    )
                    db.session.add(assoc)

            # 2. Building Strength
            t2 = WorkoutTemplate(
                name='Building Strength',
                description='Progressive calisthenics to build functional strength.',
                estimated_duration_min=30,
                estimated_duration_max=45,
                difficulty_level='intermediate'
            )
            db.session.add(t2)
            db.session.flush()
            
            t2_items = [
                ('Jumping Jacks', 'warmup', 1, 50, 1, 0),
                ('Pushups', 'main', 2, 10, 3, 0),
                ('Squats', 'main', 3, 20, 3, 0),
                ('Lunges', 'main', 4, 10, 3, 0),
                ('Situps', 'main', 5, 15, 3, 0),
                ('Plank', 'main', 6, 0, 3, 45),
                ('Standing Meditation', 'cooldown', 7, 0, 1, 120)
            ]
            
            for name, phase, order, reps, sets, dur in t2_items:
                ex = exercises.get(name)
                if ex:
                    assoc = WorkoutTemplateExercise(
                        template_id=t2.id,
                        exercise_id=ex.id,
                        phase=phase,
                        sort_order=order,
                        target_reps=reps if reps > 0 else None,
                        target_sets=sets,
                        target_duration_seconds=dur if dur > 0 else None
                    )
                    db.session.add(assoc)

            # 3. Full Workout (Advanced)
            t3 = WorkoutTemplate(
                name='Full Workout',
                description='High intensity interval training mixed with strength.',
                estimated_duration_min=45,
                estimated_duration_max=60,
                difficulty_level='advanced'
            )
            db.session.add(t3)
            db.session.flush()
            
            t3_items = [
                ('Jumping Jacks', 'warmup', 1, 100, 1, 0),
                ('Mountain Climbers', 'warmup', 2, 0, 2, 45),
                ('Pushups', 'strength', 3, 20, 4, 0),
                ('Squats', 'strength', 4, 30, 4, 0),
                ('Situps', 'core', 5, 25, 4, 0),
                ('Plank', 'core', 6, 0, 3, 60),
                ('8 Brocades Sequence', 'cooldown', 7, 0, 1, 600)
            ]

            for name, phase, order, reps, sets, dur in t3_items:
                ex = exercises.get(name)
                if ex:
                    assoc = WorkoutTemplateExercise(
                        template_id=t3.id,
                        exercise_id=ex.id,
                        phase=phase,
                        sort_order=order,
                        target_reps=reps if reps > 0 else None,
                        target_sets=sets,
                        target_duration_seconds=dur if dur > 0 else None
                    )
                    db.session.add(assoc)

            # 4. Qigong & Walk
            t4 = WorkoutTemplate(
                name='Qigong & Walk',
                description='Active recovery focusing on breath and movement.',
                estimated_duration_min=25,
                estimated_duration_max=40,
                difficulty_level='beginner'
            )
            db.session.add(t4)
            db.session.flush()
            
            t4_items = [
                ('8 Brocades Sequence', 'qigong', 1, 0, 1, 600),
                ('Standing Meditation', 'meditation', 2, 0, 1, 300),
                ('Walking', 'cardio', 3, 0, 1, 1200) # 20 mins
            ]

            for name, phase, order, reps, sets, dur in t4_items:
                ex = exercises.get(name)
                if ex:
                    assoc = WorkoutTemplateExercise(
                        template_id=t4.id,
                        exercise_id=ex.id,
                        phase=phase,
                        sort_order=order,
                        target_reps=reps if reps > 0 else None,
                        target_sets=sets,
                        target_duration_seconds=dur if dur > 0 else None
                    )
                    db.session.add(assoc)
            
            db.session.commit()
            return True
        except Exception as e:
            print(f"Error creating workout templates: {str(e)}")
            import traceback
            traceback.print_exc()
            db.session.rollback()
            return False
