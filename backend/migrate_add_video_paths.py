#!/usr/bin/env python3
"""
Migration script to add video_path and video_paths columns to Exercise table
"""

import os
import sys
import sqlite3

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from src.main import create_app
from src.models import db

def migrate_database():
    """Add video_path columns to Exercise table if they don't exist."""
    app = create_app()
    
    with app.app_context():
        # Get database path
        database_path = app.config['SQLALCHEMY_DATABASE_URI'].replace('sqlite:///', '')
        
        print(f"📊 Checking database: {database_path}")
        
        # Connect directly to SQLite to check columns
        conn = sqlite3.connect(database_path)
        cursor = conn.cursor()
        
        # Get table info
        cursor.execute("PRAGMA table_info(exercises)")
        columns = [col[1] for col in cursor.fetchall()]
        
        print(f"Current columns: {columns}")
        
        # Add video_path if it doesn't exist
        if 'video_path' not in columns:
            print("➕ Adding video_path column...")
            cursor.execute("ALTER TABLE exercises ADD COLUMN video_path VARCHAR(500)")
            conn.commit()
            print("✅ Added video_path column")
        else:
            print("✓ video_path column already exists")
        
        # Add video_paths if it doesn't exist
        if 'video_paths' not in columns:
            print("➕ Adding video_paths column...")
            cursor.execute("ALTER TABLE exercises ADD COLUMN video_paths JSON")
            conn.commit()
            print("✅ Added video_paths column")
        else:
            print("✓ video_paths column already exists")
        
        conn.close()
        print("🎉 Migration complete!")

if __name__ == "__main__":
    migrate_database()

