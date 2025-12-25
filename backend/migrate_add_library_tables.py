#!/usr/bin/env python3
"""Migration script to add VideoSession and VideoFavorite tables"""
from src.main import create_app
from src.models import db

app = create_app()

with app.app_context():
    # Create new tables
    db.create_all()
    print("Library tables (video_sessions, video_favorites) created successfully!")

