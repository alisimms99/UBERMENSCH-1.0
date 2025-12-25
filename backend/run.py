import os
import argparse
import sys

# Ensure Python can find your modules
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from src.main import create_app
from src.models import db  # This import will now work
from src.data.seed_video_library import seed_video_library
from src.data.enhanced_seed_templates import create_enhanced_exercises, create_enhanced_workout_templates
from dotenv import load_dotenv

# Load environment variables from .env file if it exists
# This allows developers to configure paths locally without hardcoding
load_dotenv()

# VIDEO_ROOT_PATH should be set via .env file or system environment variable
# If not set, the app will handle the error appropriately
if not os.environ.get('VIDEO_ROOT_PATH'):
    print("⚠️  WARNING: VIDEO_ROOT_PATH not set. Please set it in .env file or environment variables.")
    print("   Example: VIDEO_ROOT_PATH=/path/to/your/videos")

app = create_app()

def initialize_database():
    with app.app_context():
        print("🚀 Initializing Database...")
        try:
            db.drop_all()
            db.create_all()
            
            # Check each seeding operation explicitly
            exercises_result = create_enhanced_exercises()
            if not exercises_result.get('success', False):
                raise Exception(f"Failed to create exercises: {exercises_result.get('error', 'Unknown error')}")
            
            if not create_enhanced_workout_templates():
                raise Exception("Failed to create workout templates")
            
            if not seed_video_library():
                raise Exception("Failed to seed video library")
                
            db.session.commit()
            print("🎉 Database initialized successfully!")
            return True
        except Exception as e:
            print(f"❌ Error: {str(e)}")
            db.session.rollback()
            return False

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--init-db', action='store_true')
    args = parser.parse_args()

    if args.init_db:
        sys.exit(0 if initialize_database() else 1)
    else:
        app.run(host='0.0.0.0', port=5180, debug=True)