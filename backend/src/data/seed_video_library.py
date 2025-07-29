"""
Video Library Seeding Script
Creates video categories and mappings based on the user's actual video library structure
"""

import os
import sys
from datetime import datetime
from flask import current_app

# Add the src directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from ..models import db, VideoCategory, Exercise, WorkoutTemplate  # Fixed import

def create_video_categories():
    """Create video categories based on the user's library structure."""
    
    categories_data = [
        # Main Categories
        {
            'name': 'qigong',
            'display_name': 'Qigong & Breath Work',
            'folder_path': 'Breath Work, Tai Chi & Qi Gong/!Chi Gong',
            'description': 'Traditional Chinese Qigong practices for health and vitality',
            'icon': '🧘',
            'sort_order': 1,
            'subcategories': [
                {
                    'name': 'ba_duan_jin',
                    'display_name': 'Ba Duan Jin (8 Brocades)',
                    'folder_path': 'Breath Work, Tai Chi & Qi Gong/!Chi Gong/!Movements/!Ba Duan Jin',
                    'description': 'Eight Pieces of Brocade - Traditional Qigong sequence',
                    'icon': '🌸',
                    'sort_order': 1
                },
                {
                    'name': 'zhan_zhuang',
                    'display_name': 'Zhan Zhuang (Standing Meditation)',
                    'folder_path': 'Breath Work, Tai Chi & Qi Gong/!Chi Gong/!Movements/!Zhan Zhuang',
                    'description': 'Standing meditation practice for building internal energy',
                    'icon': '🧍',
                    'sort_order': 2
                },
                {
                    'name': 'yi_jin_jing',
                    'display_name': 'Yi Jin Jing (Muscle Tendon Change)',
                    'folder_path': 'Breath Work, Tai Chi & Qi Gong/!Chi Gong/!Movements/!Yi Jin Jing',
                    'description': 'Muscle and tendon transformation exercises',
                    'icon': '💪',
                    'sort_order': 3
                },
                {
                    'name': 'morning_routines',
                    'display_name': 'Morning Routines',
                    'folder_path': 'Breath Work, Tai Chi & Qi Gong/!Chi Gong/Morning Routines',
                    'description': 'Daily morning Qigong practices',
                    'icon': '🌅',
                    'sort_order': 4
                },
                {
                    'name': 'cloud_hands',
                    'display_name': 'Cloud Hands',
                    'folder_path': 'Breath Work, Tai Chi & Qi Gong/!Chi Gong/!Movements/Cloud Hands',
                    'description': 'Flowing cloud hands movements',
                    'icon': '☁️',
                    'sort_order': 5
                },
                {
                    'name': 'yuan_gong',
                    'display_name': 'Yuan Gong',
                    'folder_path': 'Breath Work, Tai Chi & Qi Gong/!Chi Gong/!Movements/Yuan Gong',
                    'description': 'Yuan Gong methods for the new era',
                    'icon': '⭕',
                    'sort_order': 6
                }
            ]
        },
        {
            'name': 'boxing',
            'display_name': 'Boxing Training',
            'folder_path': '!Boxing Training',
            'description': 'Boxing techniques, training, and conditioning',
            'icon': '🥊',
            'sort_order': 2,
            'subcategories': [
                {
                    'name': 'beginners_boxing',
                    'display_name': 'Beginner Boxing Lessons',
                    'folder_path': '!Boxing Training/Boxing With Adolfo - Beginner\'s Boxing Lessons',
                    'description': 'Fundamental boxing techniques for beginners',
                    'icon': '🥊',
                    'sort_order': 1
                },
                {
                    'name': 'advanced_boxing',
                    'display_name': 'Advanced Boxing',
                    'folder_path': '!Boxing Training/Everlast Advanced Boxing Workout',
                    'description': 'Advanced boxing techniques and workouts',
                    'icon': '🥊',
                    'sort_order': 2
                },
                {
                    'name': 'title_boxing',
                    'display_name': 'Title Boxing Series',
                    'folder_path': '!Boxing Training/Title Boxing Vol. 1-23',
                    'description': 'Comprehensive Title Boxing training series',
                    'icon': '🏆',
                    'sort_order': 3
                },
                {
                    'name': 'david_haye',
                    'display_name': 'David Haye Box & Tone',
                    'folder_path': '!Boxing Training/DAVID HAYE_S BOX AND TONE',
                    'description': 'Boxing and toning workouts with David Haye',
                    'icon': '🥊',
                    'sort_order': 4
                }
            ]
        },
        {
            'name': 'strength_training',
            'display_name': 'Strength Training',
            'folder_path': '!Strength Training',
            'description': 'Bodyweight and resistance strength training',
            'icon': '💪',
            'sort_order': 3,
            'subcategories': [
                {
                    'name': 'convict_conditioning',
                    'display_name': 'Convict Conditioning',
                    'folder_path': '!Strength Training/Convict Conditioning',
                    'description': 'Progressive bodyweight strength training system',
                    'icon': '🔒',
                    'sort_order': 1
                },
                {
                    'name': 'p90x',
                    'display_name': 'P90X Series',
                    'folder_path': '!Strength Training/P90X & P90X+ Plus - Extreme Home Fitness Exercise Videos - Portable MP4 (PSP-IPOD)',
                    'description': 'Extreme home fitness program',
                    'icon': '🔥',
                    'sort_order': 2
                },
                {
                    'name': 'body_beast',
                    'display_name': 'Body Beast',
                    'folder_path': '!Strength Training/Body Beast',
                    'description': 'Muscle building and mass gaining program',
                    'icon': '🦍',
                    'sort_order': 3
                }
            ]
        },
        {
            'name': 'cardio',
            'display_name': 'Cardio & HIIT',
            'folder_path': '!Cardio',
            'description': 'Cardiovascular and high-intensity interval training',
            'icon': '❤️',
            'sort_order': 4,
            'subcategories': [
                {
                    'name': 'insanity',
                    'display_name': 'Insanity Series',
                    'folder_path': '!Cardio/Insanity Asylum Vol 2',
                    'description': 'High-intensity cardio and conditioning',
                    'icon': '🔥',
                    'sort_order': 1
                },
                {
                    'name': 'turbo_fire',
                    'display_name': 'TurboFire',
                    'folder_path': '!Cardio/Beachbody - TurboFire',
                    'description': 'High-intensity cardio and HIIT workouts',
                    'icon': '🔥',
                    'sort_order': 2
                },
                {
                    'name': 'cize',
                    'display_name': 'CIZE Dance Workouts',
                    'folder_path': '!Cardio/CIZE - The End of Exercize - Beachbody - Shaun T',
                    'description': 'Dance-based cardio workouts',
                    'icon': '💃',
                    'sort_order': 3
                },
                {
                    'name': '21_day_fix',
                    'display_name': '21 Day Fix',
                    'folder_path': '!Cardio/21 Day Fix [ Fitness & Nutrition Plan ] (2014)',
                    'description': 'Complete fitness and nutrition program',
                    'icon': '📅',
                    'sort_order': 4
                }
            ]
        },
        {
            'name': 'yoga',
            'display_name': 'Yoga & Flexibility',
            'folder_path': '!Yoga',
            'description': 'Yoga practices for flexibility and mindfulness',
            'icon': '🧘‍♀️',
            'sort_order': 5,
            'subcategories': [
                {
                    'name': 'yoga_retreat',
                    'display_name': '3 Week Yoga Retreat',
                    'folder_path': '!Yoga/3 Week Yoga Retreat',
                    'description': 'Comprehensive yoga retreat program',
                    'icon': '🏔️',
                    'sort_order': 1
                },
                {
                    'name': 'kemetic_yoga',
                    'display_name': 'Kemetic Yoga',
                    'folder_path': '!Yoga/Kemetic Yoga',
                    'description': 'Ancient Egyptian yoga practices',
                    'icon': '🏺',
                    'sort_order': 2
                }
            ]
        },
        {
            'name': 'breath_work',
            'display_name': 'Breath Work & Meditation',
            'folder_path': 'Breath Work, Tai Chi & Qi Gong/Breath Work',
            'description': 'Breathing techniques and meditation practices',
            'icon': '🌬️',
            'sort_order': 6,
            'subcategories': [
                {
                    'name': 'longevity_breathing',
                    'display_name': 'Longevity Breathing',
                    'folder_path': 'Breath Work, Tai Chi & Qi Gong/Breath Work/Longevity Breathing',
                    'description': 'Breathing techniques for longevity and health',
                    'icon': '🌬️',
                    'sort_order': 1
                }
            ]
        },
        {
            'name': 'nei_gong',
            'display_name': 'Nei Gong (Internal Work)',
            'folder_path': 'Breath Work, Tai Chi & Qi Gong/Nei Gong',
            'description': 'Internal energy cultivation practices',
            'icon': '⚡',
            'sort_order': 7
        }
    ]
    
    created_categories = []
    
    for category_data in categories_data:
        # Create main category
        category = VideoCategory(
            name=category_data['name'],
            display_name=category_data['display_name'],
            folder_path=category_data['folder_path'],
            description=category_data['description'],
            icon=category_data.get('icon'),
            sort_order=category_data['sort_order'],
            is_active=True
        )
        
        db.session.add(category)
        db.session.flush()  # Get the ID
        created_categories.append(category)
        
        # Create subcategories if they exist
        if 'subcategories' in category_data:
            for sub_data in category_data['subcategories']:
                subcategory = VideoCategory(
                    name=sub_data['name'],
                    display_name=sub_data['display_name'],
                    folder_path=sub_data['folder_path'],
                    description=sub_data['description'],
                    icon=sub_data.get('icon'),
                    sort_order=sub_data['sort_order'],
                    parent_id=category.id,
                    is_active=True
                )
                
                db.session.add(subcategory)
                created_categories.append(subcategory)
    
    return created_categories

def create_exercise_video_mappings():
    """Create mappings between exercises and videos based on the library structure."""
    
    mappings_data = [
        # Ba Duan Jin mappings
        {
            'exercise_name': '8 Brocades Sequence',
            'video_paths': [
                'Breath Work, Tai Chi & Qi Gong/!Chi Gong/Morning Routines/8 Brocades Qigong Practice(ipad).mp4',
                'Breath Work, Tai Chi & Qi Gong/!Chi Gong/!Movements/!Ba Duan Jin/Health Qigong - Ba duan Jin _ Eight Pieces of Brocade(ipad).mp4',
                'Breath Work, Tai Chi & Qi Gong/!Chi Gong/!Movements/!Ba Duan Jin/Health Qigong - Shaolin Ba Duan Jin (少林八段锦) Full Tutorial with English Subtitles.mp4',
                'Breath Work, Tai Chi & Qi Gong/!Chi Gong/Morning Routines/Shaolin Ba Duan Jin _ 少林八段锦 (performed by Master Shi Heng Yi _ 释恒義) Qi Gong Excercises(ipad).mp4'
            ],
            'mapping_type': 'instruction'
        },
        
        # Zhan Zhuang mappings
        {
            'exercise_name': 'Basic Standing Meditation',
            'video_paths': [
                'Breath Work, Tai Chi & Qi Gong/!Chi Gong/!Movements/!Zhan Zhuang/Daily Standing Meditation (Zhan Zhuang Qigong) Intro and Instructions(ipad).mp4',
                'Breath Work, Tai Chi & Qi Gong/!Chi Gong/!Movements/!Zhan Zhuang/10 Min. Daily Standing Meditation (Zhan Zhuang Qigong) Follow-Along(ipad).mp4',
                'Breath Work, Tai Chi & Qi Gong/!Chi Gong/!Movements/!Zhan Zhuang/Introduction to Qigong Tree Pose (Zhan Zhuang) - Qigong Standing Meditation(ipad).mp4'
            ],
            'mapping_type': 'instruction'
        },
        
        # Pushup mappings
        {
            'exercise_name': 'Pushups',
            'video_paths': [
                '!Strength Training/Convict Conditioning/Paul Wade - Convict Conditioning Vol 1 The Prison Pushup Series/Cell 2 The Pushup Series/Step 1.avi',
                '!Strength Training/Convict Conditioning/Paul Wade - Convict Conditioning Vol 1 The Prison Pushup Series/Cell 2 The Pushup Series/Step 2.avi',
                '!Strength Training/Convict Conditioning/Paul Wade - Convict Conditioning Vol 1 The Prison Pushup Series/Cell 2 The Pushup Series/Step 3.avi'
            ],
            'mapping_type': 'instruction'
        },
        
        # Boxing basics mappings
        {
            'exercise_name': 'Boxing Basics',
            'video_paths': [
                '!Boxing Training/Boxing With Adolfo - Beginner\'s Boxing Lessons/01-Handwraps & Stretching.mp4',
                '!Boxing Training/Boxing With Adolfo - Beginner\'s Boxing Lessons/02-The Jab.mp4',
                '!Boxing Training/Boxing With Adolfo - Beginner\'s Boxing Lessons/03-Straight Right Hand.mp4',
                '!Boxing Training/Boxing With Adolfo - Beginner\'s Boxing Lessons/04-Jab Right Combination.mp4'
            ],
            'mapping_type': 'instruction'
        },
        
        # Squats mappings
        {
            'exercise_name': 'Squats',
            'video_paths': [
                '!Strength Training/Convict Conditioning/Paul Wade - Convict Conditioning Vol 2 The Ultimate Bodyweight Squat Course/CCVol2_05 Step 1 - Shoulder Stand Squats.avi',
                '!Strength Training/Convict Conditioning/Paul Wade - Convict Conditioning Vol 2 The Ultimate Bodyweight Squat Course/CCVol2_09 Step 5 - Full Squats.avi'
            ],
            'mapping_type': 'instruction'
        },
        
        # Yi Jin Jing mappings
        {
            'exercise_name': 'Yi Jin Jing',
            'video_paths': [
                'Breath Work, Tai Chi & Qi Gong/!Chi Gong/!Movements/!Yi Jin Jing/易筋經 · Yi Jin Jing (1-12 · Full Explanations) · ИЦзиньЦзин +Subtitles(ipad).mp4',
                'Breath Work, Tai Chi & Qi Gong/!Chi Gong/!Movements/!Yi Jin Jing/Health Qigong - Shaolin Bodhidharma Yi Jin Jing (少林达摩易筋经) Full Tutorial with English subtitles.mp4',
                'Breath Work, Tai Chi & Qi Gong/!Chi Gong/!Movements/!Yi Jin Jing/Shaolin Yi Jin Jing _ 少林易筋经 (performed by Master Shi Heng Yi _ 释恒義) Qi Gong Excercises(ipad).mp4'
            ],
            'mapping_type': 'instruction'
        }
    ]
    
    created_mappings = []
    
    for mapping_data in mappings_data:
        # Find the exercise
        exercise = Exercise.query.filter_by(name=mapping_data['exercise_name']).first()
        if not exercise:
            print(f"Exercise '{mapping_data['exercise_name']}' not found, skipping mappings")
            continue
        
        for i, video_path in enumerate(mapping_data['video_paths']):
            # Find the video by file path
            video = Video.query.filter_by(file_path=video_path).first()
            if not video:
                print(f"Video '{video_path}' not found, skipping mapping")
                continue
            
            # Create mapping
            mapping = WorkoutVideoMapping(
                exercise_id=exercise.id,
                video_id=video.id,
                mapping_type=mapping_data['mapping_type'],
                is_primary=(i == 0),  # First video is primary
                sort_order=i
            )
            
            db.session.add(mapping)
            created_mappings.append(mapping)
    
    return created_mappings

def seed_video_library():
    """Seed the video library database"""
    try:
        required_categories = [
            {'name': 'qigong', 'display_name': 'Qigong'},
            {'name': 'boxing', 'display_name': 'Boxing'}
        ]
        
        db.session.query(VideoCategory).delete()
        for cat_data in required_categories:
            if not VideoCategory.query.filter_by(name=cat_data['name']).first():
                db.session.add(VideoCategory(**cat_data))
        
        db.session.commit()
        return True
    except Exception as e:
        print(f"Error seeding video library: {str(e)}")
        db.session.rollback()
        return False

if __name__ == "__main__":
    from main import create_app
    
    app = create_app()
    with app.app_context():
        success = seed_video_library()
        sys.exit(0 if success else 1)

