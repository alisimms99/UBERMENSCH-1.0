import os
import argparse
import sys

# Ensure Python can find your modules
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from src.main import create_app
from src.models import db  # This import will now work
from src.models import WorkoutTemplate, Exercise
from src.data.seed_video_library import seed_video_library
from src.data.enhanced_seed_templates import create_enhanced_exercises, create_enhanced_workout_templates

os.environ['VIDEO_ROOT_PATH'] = "/Users/dlaimins/Shared/Parnes/Exercise Videos"

app = create_app()

def initialize_database():
    with app.app_context():
        print("🚀 Initializing Database...")
        try:
            db.drop_all()
            db.create_all()
            
            if not all([
                create_enhanced_exercises(),
                create_enhanced_workout_templates(),
                seed_video_library()
            ]):
                raise Exception("One or more seeding operations failed")
                
            db.session.commit()
            print("🎉 Database initialized successfully!")
            return True
        except Exception as e:
            print(f"❌ Error: {str(e)}")
            db.session.rollback()
            return False

def ensure_min_seed_data():
    """
    Ensure core seed data exists for local dev runs.
    This avoids 404s like /api/templates/1 when the DB is empty.
    """
    with app.app_context():
        try:
            # If templates are missing, seed exercises + templates.
            if WorkoutTemplate.query.count() == 0:
                # If exercises are missing, create them first.
                if Exercise.query.count() == 0:
                    create_enhanced_exercises()
                create_enhanced_workout_templates()
                db.session.commit()
        except Exception as e:
            print(f"⚠️  Seed check failed: {str(e)}")
            db.session.rollback()

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--init-db', action='store_true')
    args = parser.parse_args()

    if args.init_db:
        sys.exit(0 if initialize_database() else 1)
    else:
        ensure_min_seed_data()
        app.run(host='0.0.0.0', port=5180, debug=True)