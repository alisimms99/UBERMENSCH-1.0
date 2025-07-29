#!/usr/bin/env python3
"""
Enhanced Database Initialization Script
Sets up the enhanced fitness tracker database with workout templates and seed data
"""

import os
import sys
import argparse
from flask import Flask

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from src.main import create_app, db
from src.data.seed_video_library import seed_video_library
from src.data.enhanced_seed_templates import create_enhanced_exercises, create_enhanced_workout_templates

def initialize_database():
    print("🚀 Initializing Database...")
    try:
        db.drop_all()
        db.create_all()
        create_enhanced_exercises()
        create_enhanced_workout_templates()
        seed_video_library()
        db.session.commit()
        print("🎉 Database initialization complete!")
    except Exception as e:
        print(f"❌ Error: {e}")
        db.session.rollback()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Initialize the Fitness Tracker Database.")
    parser.add_argument("--video-root", required=True, help="Path to your video directory.")
    args = parser.parse_args()
    os.environ['VIDEO_ROOT_PATH'] = args.video_root
    app = create_app()
    with app.app_context():
        initialize_database()

