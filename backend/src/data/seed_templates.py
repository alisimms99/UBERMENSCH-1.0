"""
Seed data for workout templates and exercises
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from src.models.workout_templates import db, WorkoutTemplateLibrary, TemplateExercise, ExerciseLibrary
import json

def create_exercises():
    """Create the exercise library"""
    exercises = [
        # Qigong exercises
        {
            'name': '8 Brocades (Ba Duan Jin)',
            'category': 'flexibility',
            'subcategory': 'qigong',
            'description': 'Traditional Chinese qigong sequence for health and vitality',
            'instructions': 'Perform each movement slowly and mindfully. Focus on breathing and gentle stretching.',
            'progression_notes': 'Start with 3-5 repetitions, gradually increase to 8-12 repetitions',
            'beginner_modification': 'Perform seated or with reduced range of motion',
            'exercise_type': 'duration',
            'default_duration': 600,  # 10 minutes
            'default_sets': 1,
            'icon_name': 'Waves',
            'difficulty_level': 'beginner',
            'muscle_groups': json.dumps(['full_body', 'core', 'flexibility']),
            'equipment_needed': 'None'
        },
        {
            'name': 'Zhan Zhuang (Standing Meditation)',
            'category': 'flexibility',
            'subcategory': 'qigong',
            'description': 'Standing meditation posture for building internal strength',
            'instructions': 'Stand with feet shoulder-width apart, arms rounded as if holding a large ball. Breathe naturally.',
            'progression_notes': 'Start with 1-2 minutes, gradually increase to 5-10 minutes',
            'beginner_modification': 'Use wall support or sit in chair',
            'exercise_type': 'duration',
            'default_duration': 180,  # 3 minutes
            'default_sets': 1,
            'icon_name': 'User',
            'difficulty_level': 'beginner',
            'muscle_groups': json.dumps(['legs', 'core', 'posture']),
            'equipment_needed': 'None'
        },
        
        # Upper body exercises
        {
            'name': 'Pushups',
            'category': 'upper_body',
            'subcategory': 'pushup_variation',
            'description': 'Classic upper body strengthening exercise',
            'instructions': 'Start in plank position, lower chest to floor, push back up. Keep body straight.',
            'progression_notes': 'Progress from knee pushups to full pushups to elevated feet',
            'beginner_modification': 'Knee pushups or wall pushups',
            'exercise_type': 'reps',
            'default_reps': 10,
            'default_sets': 3,
            'icon_name': 'ArrowUp',
            'difficulty_level': 'intermediate',
            'muscle_groups': json.dumps(['chest', 'shoulders', 'triceps', 'core']),
            'equipment_needed': 'None'
        },
        
        # Core exercises
        {
            'name': 'Situps',
            'category': 'core_lower',
            'subcategory': 'abdominal',
            'description': 'Core strengthening exercise targeting abdominal muscles',
            'instructions': 'Lie on back, knees bent, hands behind head. Lift torso toward knees.',
            'progression_notes': 'Progress from partial situps to full situps to weighted situps',
            'beginner_modification': 'Crunches or assisted situps',
            'exercise_type': 'reps',
            'default_reps': 15,
            'default_sets': 3,
            'icon_name': 'RotateCcw',
            'difficulty_level': 'beginner',
            'muscle_groups': json.dumps(['abs', 'hip_flexors']),
            'equipment_needed': 'None'
        },
        {
            'name': 'Plank',
            'category': 'core_lower',
            'subcategory': 'plank_variation',
            'description': 'Isometric core strengthening exercise',
            'instructions': 'Hold plank position with straight body from head to heels. Engage core.',
            'progression_notes': 'Increase hold time gradually. Progress to side planks or plank variations',
            'beginner_modification': 'Knee plank or incline plank',
            'exercise_type': 'duration',
            'default_duration': 30,
            'default_sets': 3,
            'icon_name': 'Minus',
            'difficulty_level': 'intermediate',
            'muscle_groups': json.dumps(['core', 'shoulders', 'glutes']),
            'equipment_needed': 'None'
        },
        
        # Lower body exercises
        {
            'name': 'Squats',
            'category': 'core_lower',
            'subcategory': 'squat_variation',
            'description': 'Lower body strengthening exercise',
            'instructions': 'Stand with feet shoulder-width apart, lower hips back and down, return to standing.',
            'progression_notes': 'Progress from bodyweight to jump squats or weighted squats',
            'beginner_modification': 'Chair-assisted squats or partial range of motion',
            'exercise_type': 'reps',
            'default_reps': 15,
            'default_sets': 3,
            'icon_name': 'ArrowDown',
            'difficulty_level': 'beginner',
            'muscle_groups': json.dumps(['quads', 'glutes', 'hamstrings']),
            'equipment_needed': 'None'
        },
        {
            'name': 'Glute Bridges',
            'category': 'core_lower',
            'subcategory': 'glute_activation',
            'description': 'Glute strengthening and hip mobility exercise',
            'instructions': 'Lie on back, knees bent, lift hips up squeezing glutes, lower slowly.',
            'progression_notes': 'Progress to single-leg bridges or weighted bridges',
            'beginner_modification': 'Partial range of motion or hold at top',
            'exercise_type': 'reps',
            'default_reps': 15,
            'default_sets': 2,
            'icon_name': 'TrendingUp',
            'difficulty_level': 'beginner',
            'muscle_groups': json.dumps(['glutes', 'hamstrings', 'core']),
            'equipment_needed': 'None'
        },
        
        # Cardio and movement
        {
            'name': 'Mountain Climbers',
            'category': 'cardio',
            'subcategory': 'bodyweight_cardio',
            'description': 'Dynamic cardio exercise combining core and cardio training',
            'instructions': 'Start in plank, alternate bringing knees to chest rapidly while maintaining plank position.',
            'progression_notes': 'Increase speed and duration gradually',
            'beginner_modification': 'Slow controlled movement or step instead of jump',
            'exercise_type': 'reps',
            'default_reps': 20,
            'default_sets': 2,
            'icon_name': 'Zap',
            'difficulty_level': 'intermediate',
            'muscle_groups': json.dumps(['core', 'shoulders', 'legs', 'cardio']),
            'equipment_needed': 'None'
        },
        {
            'name': 'Walking',
            'category': 'cardio',
            'subcategory': 'low_impact_cardio',
            'description': 'Low-impact cardiovascular exercise',
            'instructions': 'Walk at a comfortable pace, maintain good posture, breathe naturally.',
            'progression_notes': 'Increase distance, speed, or add inclines gradually',
            'beginner_modification': 'Start with shorter distances and slower pace',
            'exercise_type': 'duration',
            'default_duration': 900,  # 15 minutes
            'default_sets': 1,
            'icon_name': 'MapPin',
            'difficulty_level': 'beginner',
            'muscle_groups': json.dumps(['legs', 'cardio']),
            'equipment_needed': 'None'
        },
        
        # Stability and mobility
        {
            'name': 'Dead Bugs',
            'category': 'core_lower',
            'subcategory': 'core_stability',
            'description': 'Core stability exercise for coordination and strength',
            'instructions': 'Lie on back, arms up, knees bent at 90°. Lower opposite arm and leg slowly.',
            'progression_notes': 'Focus on control and stability before increasing speed',
            'beginner_modification': 'Move only arms or only legs separately',
            'exercise_type': 'reps',
            'default_reps': 10,
            'default_sets': 2,
            'icon_name': 'RotateCw',
            'difficulty_level': 'intermediate',
            'muscle_groups': json.dumps(['core', 'hip_flexors', 'shoulders']),
            'equipment_needed': 'None'
        },
        {
            'name': 'Bird Dogs',
            'category': 'core_lower',
            'subcategory': 'core_stability',
            'description': 'Core and back strengthening exercise',
            'instructions': 'Start on hands and knees, extend opposite arm and leg, hold, return to start.',
            'progression_notes': 'Focus on balance and control, increase hold time',
            'beginner_modification': 'Move only arm or only leg separately',
            'exercise_type': 'reps',
            'default_reps': 10,
            'default_sets': 2,
            'icon_name': 'Move',
            'difficulty_level': 'beginner',
            'muscle_groups': json.dumps(['core', 'back', 'glutes', 'shoulders']),
            'equipment_needed': 'None'
        },
        {
            'name': 'Leg Raises',
            'category': 'core_lower',
            'subcategory': 'abdominal',
            'description': 'Lower abdominal strengthening exercise',
            'instructions': 'Lie on back, legs straight, lift legs to 90°, lower slowly without touching floor.',
            'progression_notes': 'Control the lowering phase, progress to hanging leg raises',
            'beginner_modification': 'Bent knee raises or partial range of motion',
            'exercise_type': 'reps',
            'default_reps': 10,
            'default_sets': 2,
            'icon_name': 'ArrowUp',
            'difficulty_level': 'intermediate',
            'muscle_groups': json.dumps(['lower_abs', 'hip_flexors']),
            'equipment_needed': 'None'
        }
    ]
    
    created_exercises = []
    for exercise_data in exercises:
        exercise = ExerciseLibrary(**exercise_data)
        db.session.add(exercise)
        created_exercises.append(exercise)
    
    db.session.flush()  # Get IDs
    return created_exercises

def create_workout_templates(exercises):
    """Create the workout templates"""
    
    # Create exercise lookup by name
    exercise_lookup = {ex.name: ex for ex in exercises}
    
    templates = [
        {
            'name': 'Getting Back Into It',
            'description': 'Gentle reintroduction to fitness with qigong, light calisthenics, and walking',
            'duration_min': 37,  # 30-45 min average
            'difficulty_level': 'beginner',
            'frequency_per_week': '2-3x',
            'category': 'recovery',
            'exercises': [
                {
                    'exercise_name': '8 Brocades (Ba Duan Jin)',
                    'order_index': 1,
                    'target_sets': 1,
                    'target_duration': 600,  # 10 minutes
                    'intensity_modifier': 1.0,
                    'notes': 'Focus on gentle movements and breathing'
                },
                {
                    'exercise_name': 'Pushups',
                    'order_index': 2,
                    'target_sets': 2,
                    'intensity_modifier': 0.5,  # 50% of current target
                    'rest_seconds': 90,
                    'notes': 'Use knee pushups if needed'
                },
                {
                    'exercise_name': 'Situps',
                    'order_index': 3,
                    'target_sets': 2,
                    'intensity_modifier': 0.5,  # 50% of current target
                    'rest_seconds': 90,
                    'notes': 'Focus on controlled movement'
                },
                {
                    'exercise_name': 'Plank',
                    'order_index': 4,
                    'target_sets': 1,
                    'target_duration': 30,
                    'intensity_modifier': 1.0,
                    'notes': 'Hold for 30 seconds or current ability'
                },
                {
                    'exercise_name': 'Walking',
                    'order_index': 5,
                    'target_sets': 1,
                    'target_duration': 1200,  # 20 minutes (1-2 loops)
                    'intensity_modifier': 1.0,
                    'notes': '1-2 loops of the 1.37-mile route'
                }
            ]
        },
        {
            'name': 'Building Strength',
            'description': 'Focused strength training with full targets and extended walking',
            'duration_min': 52,  # 45-60 min average
            'difficulty_level': 'intermediate',
            'frequency_per_week': '2x',
            'category': 'strength',
            'exercises': [
                {
                    'exercise_name': '8 Brocades (Ba Duan Jin)',
                    'order_index': 1,
                    'target_sets': 1,
                    'target_duration': 600,  # 10 minutes
                    'intensity_modifier': 1.0,
                    'notes': 'Full 8 Brocades sequence'
                },
                {
                    'exercise_name': 'Zhan Zhuang (Standing Meditation)',
                    'order_index': 2,
                    'target_sets': 1,
                    'target_duration': 180,  # 3 minutes
                    'intensity_modifier': 1.0,
                    'notes': '3-minute standing meditation'
                },
                {
                    'exercise_name': 'Pushups',
                    'order_index': 3,
                    'target_sets': 3,
                    'intensity_modifier': 1.0,  # Full weekly target
                    'rest_seconds': 120,
                    'notes': 'Full weekly target, 3 sets'
                },
                {
                    'exercise_name': 'Situps',
                    'order_index': 4,
                    'target_sets': 3,
                    'intensity_modifier': 1.0,  # Full weekly target
                    'rest_seconds': 120,
                    'notes': 'Full weekly target, 3 sets'
                },
                {
                    'exercise_name': 'Plank',
                    'order_index': 5,
                    'target_sets': 1,
                    'intensity_modifier': 1.0,  # Current target duration
                    'notes': 'Current target duration (20+ seconds)'
                },
                {
                    'exercise_name': 'Squats',
                    'order_index': 6,
                    'target_sets': 2,
                    'target_reps': 15,
                    'rest_seconds': 90,
                    'notes': '12-15 reps, 2 sets'
                },
                {
                    'exercise_name': 'Mountain Climbers',
                    'order_index': 7,
                    'target_sets': 2,
                    'target_reps': 20,
                    'rest_seconds': 90,
                    'notes': '20 reps, 2 sets'
                },
                {
                    'exercise_name': 'Walking',
                    'order_index': 8,
                    'target_sets': 1,
                    'target_duration': 1200,  # 20 minutes (2-3 loops)
                    'intensity_modifier': 1.0,
                    'notes': '2-3 loops of the route'
                }
            ]
        },
        {
            'name': 'Full Workout',
            'description': 'Complete comprehensive workout with all exercise categories',
            'duration_min': 60,
            'difficulty_level': 'advanced',
            'frequency_per_week': '1x',
            'category': 'full',
            'exercises': [
                {
                    'exercise_name': '8 Brocades (Ba Duan Jin)',
                    'order_index': 1,
                    'target_sets': 1,
                    'target_duration': 600,  # 10 minutes
                    'intensity_modifier': 1.0,
                    'notes': 'Complete 8 Brocades sequence'
                },
                {
                    'exercise_name': 'Zhan Zhuang (Standing Meditation)',
                    'order_index': 2,
                    'target_sets': 1,
                    'target_duration': 300,  # 5 minutes
                    'intensity_modifier': 1.0,
                    'notes': '5-minute standing meditation'
                },
                {
                    'exercise_name': 'Pushups',
                    'order_index': 3,
                    'target_sets': 3,
                    'intensity_modifier': 1.0,
                    'rest_seconds': 120,
                    'notes': 'Progressive sets toward weekly target'
                },
                {
                    'exercise_name': 'Situps',
                    'order_index': 4,
                    'target_sets': 3,
                    'intensity_modifier': 1.0,
                    'rest_seconds': 120,
                    'notes': 'Progressive sets toward weekly target'
                },
                {
                    'exercise_name': 'Plank',
                    'order_index': 5,
                    'target_sets': 1,
                    'intensity_modifier': 1.2,  # Maximum hold attempt
                    'notes': 'Maximum hold attempt'
                },
                {
                    'exercise_name': 'Squats',
                    'order_index': 6,
                    'target_sets': 3,
                    'target_reps': 20,
                    'rest_seconds': 90,
                    'notes': '15-20 reps, 3 sets'
                },
                {
                    'exercise_name': 'Dead Bugs',
                    'order_index': 7,
                    'target_sets': 2,
                    'target_reps': 10,
                    'rest_seconds': 60,
                    'notes': '10 each side, 2 sets'
                },
                {
                    'exercise_name': 'Bird Dogs',
                    'order_index': 8,
                    'target_sets': 2,
                    'target_reps': 10,
                    'rest_seconds': 60,
                    'notes': '10 each side, 2 sets'
                },
                {
                    'exercise_name': 'Glute Bridges',
                    'order_index': 9,
                    'target_sets': 2,
                    'target_reps': 15,
                    'rest_seconds': 60,
                    'notes': '15 reps, 2 sets'
                },
                {
                    'exercise_name': 'Mountain Climbers',
                    'order_index': 10,
                    'target_sets': 2,
                    'target_reps': 30,
                    'rest_seconds': 90,
                    'notes': '30 reps, 2 sets'
                },
                {
                    'exercise_name': 'Leg Raises',
                    'order_index': 11,
                    'target_sets': 2,
                    'target_reps': 10,
                    'rest_seconds': 60,
                    'notes': '10 reps, 2 sets'
                },
                {
                    'exercise_name': 'Walking',
                    'order_index': 12,
                    'target_sets': 1,
                    'target_duration': 900,  # 15 minutes (2+ loops)
                    'intensity_modifier': 1.0,
                    'notes': '2+ loops of the route'
                }
            ]
        },
        {
            'name': 'Qigong & Walk',
            'description': 'Gentle recovery day with qigong and walking',
            'duration_min': 25,  # 20-30 min
            'difficulty_level': 'beginner',
            'frequency_per_week': 'daily',
            'category': 'recovery',
            'exercises': [
                {
                    'exercise_name': '8 Brocades (Ba Duan Jin)',
                    'order_index': 1,
                    'target_sets': 1,
                    'target_duration': 900,  # 15 minutes
                    'intensity_modifier': 1.0,
                    'notes': '8 Brocades, standing meditation, gentle flows'
                },
                {
                    'exercise_name': 'Walking',
                    'order_index': 2,
                    'target_sets': 1,
                    'target_duration': 900,  # 15 minutes
                    'intensity_modifier': 0.8,  # Recovery pace
                    'notes': '1-2 loops, recovery pace'
                }
            ]
        }
    ]
    
    created_templates = []
    for template_data in templates:
        template = WorkoutTemplateLibrary(
            name=template_data['name'],
            description=template_data['description'],
            duration_min=template_data['duration_min'],
            difficulty_level=template_data['difficulty_level'],
            frequency_per_week=template_data['frequency_per_week'],
            category=template_data['category']
        )
        
        db.session.add(template)
        db.session.flush()  # Get template ID
        
        # Add exercises to template
        for exercise_data in template_data['exercises']:
            exercise = exercise_lookup[exercise_data['exercise_name']]
            template_exercise = TemplateExercise(
                template_id=template.id,
                exercise_id=exercise.id,
                order_index=exercise_data['order_index'],
                target_sets=exercise_data.get('target_sets', 1),
                target_reps=exercise_data.get('target_reps'),
                target_duration=exercise_data.get('target_duration'),
                rest_seconds=exercise_data.get('rest_seconds', 60),
                intensity_modifier=exercise_data.get('intensity_modifier', 1.0),
                notes=exercise_data.get('notes'),
                is_optional=exercise_data.get('is_optional', False)
            )
            db.session.add(template_exercise)
        
        created_templates.append(template)
    
    return created_templates

def seed_database():
    """Seed the database with workout templates and exercises"""
    try:
        # Create exercises first
        exercises = create_exercises()
        
        # Create workout templates
        templates = create_workout_templates(exercises)
        
        # Commit all changes
        db.session.commit()
        
        print(f"Successfully created {len(exercises)} exercises and {len(templates)} workout templates")
        
        return exercises, templates
        
    except Exception as e:
        db.session.rollback()
        print(f"Error seeding database: {str(e)}")
        raise

if __name__ == '__main__':
    from src.main import app
    
    with app.app_context():
        seed_database()

