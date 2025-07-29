import os
import argparse
import sys

# Set up Python path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), 'src')))

from src.main import create_app
from src.models import db
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

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--init-db', action='store_true')
    args = parser.parse_args()

    if args.init_db:
        sys.exit(0 if initialize_database() else 1)
    else:
        app.run(host='0.0.0.0', port=5180, debug=True)