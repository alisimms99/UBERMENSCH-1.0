#!/usr/bin/env python3
"""
Enhanced Database Initialization Script with Video Library Support
Initializes the fitness tracker database with workout templates, exercises, and video library structure
"""

import os
import sys
import argparse
from flask import Flask

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from src.main import create_app
from src.models import db  # Updated import
from src.data.seed_video_library import seed_video_library
from src.data.enhanced_seed_templates import create_enhanced_exercises, create_enhanced_workout_templates

def initialize_database():
    print("🚀 Initializing Database...")
    try:
        db.drop_all()
        db.create_all()
        
        # Create exercises first (templates depend on exercises)
        exercises_result = create_enhanced_exercises()
        if not exercises_result.get('success', False):
            raise Exception(f"Failed to create exercises: {exercises_result.get('error', 'Unknown error')}")
        
        if not create_enhanced_workout_templates():
            raise Exception("Failed to create workout templates")
            
        if not seed_video_library():
            raise Exception("Failed to seed video library")
        
        db.session.commit()
        print("🎉 Database initialization complete!")
        return True
    except Exception as e:
        print(f"❌ Error: {e}")
        db.session.rollback()
        return False

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Initialize the Fitness Tracker Database.")
    parser.add_argument("--video-root", required=True, help="Path to your video directory.")
    args = parser.parse_args()
    
    os.environ['VIDEO_ROOT_PATH'] = args.video_root
    app = create_app()
    
    with app.app_context():
        if initialize_database():
            print("✅ Database is ready!")
        else:
            print("❌ Database initialization failed")
            sys.exit(1)

