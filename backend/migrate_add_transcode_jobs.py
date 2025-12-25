#!/usr/bin/env python3
"""
Database migration to add TranscodeJob table
Run this script to add the transcode_jobs table to existing database
"""
import os
import sys

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from src.main import create_app
from src.models import db, TranscodeJob

def migrate():
    """Add TranscodeJob table to database"""
    app = create_app()
    
    with app.app_context():
        # Create the transcode_jobs table
        db.create_all()
        print("✓ Database migration complete - transcode_jobs table created")
        
        # Show existing jobs if any
        jobs = TranscodeJob.query.all()
        print(f"✓ Found {len(jobs)} existing transcode jobs")

if __name__ == '__main__':
    migrate()
