#!/usr/bin/env python3
"""
Migration script to add unique constraint on (user_id, video_path) to video_favorites table.
This prevents duplicate favorites and fixes the race condition bug.
"""
import os
import sys
import sqlite3

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from src.main import create_app
from src.models import db

def migrate_database():
    """Add unique constraint to video_favorites table."""
    app = create_app()
    
    with app.app_context():
        # Get database path
        database_path = app.config['SQLALCHEMY_DATABASE_URI'].replace('sqlite:///', '')
        
        print(f"📊 Checking database: {database_path}")
        
        # Connect directly to SQLite
        conn = sqlite3.connect(database_path)
        cursor = conn.cursor()
        
        # Check if table exists
        cursor.execute("""
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name='video_favorites'
        """)
        if not cursor.fetchone():
            print("⚠️  video_favorites table doesn't exist yet. It will be created with the constraint on next db.create_all().")
            conn.close()
            return
        
        # Check for existing duplicates before adding constraint
        print("🔍 Checking for duplicate favorites...")
        cursor.execute("""
            SELECT user_id, video_path, COUNT(*) as count
            FROM video_favorites
            GROUP BY user_id, video_path
            HAVING count > 1
        """)
        duplicates = cursor.fetchall()
        
        if duplicates:
            print(f"⚠️  Found {len(duplicates)} duplicate favorite entries. Removing duplicates...")
            for user_id, video_path, count in duplicates:
                # Keep the oldest entry (lowest id), delete the rest
                cursor.execute("""
                    DELETE FROM video_favorites
                    WHERE user_id = ? AND video_path = ?
                    AND id NOT IN (
                        SELECT MIN(id) FROM video_favorites
                        WHERE user_id = ? AND video_path = ?
                    )
                """, (user_id, video_path, user_id, video_path))
                print(f"   Removed {count - 1} duplicate(s) for user {user_id}, path: {video_path[:50]}...")
            conn.commit()
        
        # Check if unique index already exists
        cursor.execute("""
            SELECT name FROM sqlite_master 
            WHERE type='index' AND name='uq_video_favorite_user_path'
        """)
        if cursor.fetchone():
            print("✓ Unique constraint already exists")
            conn.close()
            return
        
        # Create unique index (SQLite uses indexes to enforce unique constraints)
        print("➕ Adding unique constraint on (user_id, video_path)...")
        try:
            cursor.execute("""
                CREATE UNIQUE INDEX uq_video_favorite_user_path 
                ON video_favorites(user_id, video_path)
            """)
            conn.commit()
            print("✅ Unique constraint added successfully!")
        except sqlite3.OperationalError as e:
            if "already exists" in str(e).lower():
                print("✓ Unique constraint already exists")
            else:
                print(f"❌ Error adding constraint: {e}")
                raise
        
        conn.close()
        print("🎉 Migration complete!")

if __name__ == "__main__":
    migrate_database()

