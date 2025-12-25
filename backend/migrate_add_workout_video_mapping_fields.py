#!/usr/bin/env python3
"""
Migration script to add metadata fields to WorkoutVideoMapping table
Adds: mapping_type, is_primary, sort_order, start_time_seconds, end_time_seconds, notes
"""

import os
import sys
import sqlite3

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from src.main import create_app
from src.models import db

def migrate_database():
    """Add metadata fields to WorkoutVideoMapping table if they don't exist."""
    app = create_app()
    
    with app.app_context():
        # Get database path
        database_path = app.config['SQLALCHEMY_DATABASE_URI'].replace('sqlite:///', '')
        
        print(f"📊 Checking database: {database_path}")
        
        # Connect directly to SQLite to check columns
        conn = sqlite3.connect(database_path)
        cursor = conn.cursor()
        
        # Get table info
        cursor.execute("PRAGMA table_info(workout_video_mappings)")
        columns = {col[1]: col for col in cursor.fetchall()}
        
        print(f"Current columns: {list(columns.keys())}")
        
        # Define new columns to add
        new_columns = [
            ('mapping_type', 'VARCHAR(50)', "'instruction'"),
            ('is_primary', 'BOOLEAN', '0'),
            ('sort_order', 'INTEGER', '0'),
            ('start_time_seconds', 'INTEGER', 'NULL'),
            ('end_time_seconds', 'INTEGER', 'NULL'),
            ('notes', 'TEXT', 'NULL'),
        ]
        
        # Add each column if it doesn't exist
        for column_name, column_type, default_value in new_columns:
            if column_name not in columns:
                print(f"➕ Adding {column_name} column...")
                try:
                    if default_value == 'NULL':
                        cursor.execute(f"ALTER TABLE workout_video_mappings ADD COLUMN {column_name} {column_type}")
                    else:
                        cursor.execute(f"ALTER TABLE workout_video_mappings ADD COLUMN {column_name} {column_type} DEFAULT {default_value}")
                    conn.commit()
                    print(f"✅ Added {column_name} column")
                except sqlite3.Error as e:
                    print(f"❌ Error adding {column_name}: {e}")
            else:
                print(f"✓ {column_name} column already exists")
        
        conn.close()
        print("🎉 Migration complete!")

if __name__ == "__main__":
    migrate_database()

