from flask import Blueprint, jsonify, request
from datetime import datetime
from sqlalchemy.exc import IntegrityError
from ..models import db, VideoSession, VideoFavorite, DailyMetrics
import json
import os

library_bp = Blueprint('library', __name__)

# Load video index
VIDEO_INDEX_PATH = os.path.join(os.path.dirname(__file__), '../data/video_index.json')

def load_video_index():
    """Load and return video index"""
    try:
        with open(VIDEO_INDEX_PATH, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        return {'videos': []}

def get_category_icon(category_name):
    """Return emoji icon for category"""
    icons = {
        'Boxing Training': '🥊',
        'Breath Work, Tai Chi & Qi Gong': '🧘',
        'Cardio': '🏃',
        'Strength Training': '💪',
        'Yoga': '🧘‍♀️',
        'Martial Arts': '🥋',
        'HIIT': '⚡',
        'Stretching': '🤸',
    }
    # Partial match
    for key, icon in icons.items():
        if key.lower() in category_name.lower():
            return icon
    return '🎬'

@library_bp.route('/library/categories', methods=['GET'])
def get_categories():
    """Get all video categories with counts"""
    index = load_video_index()
    videos = index.get('videos', [])
    
    # Group videos by category
    categories_dict = {}
    for video in videos:
        category = video.get('category', 'Uncategorized')
        if category not in categories_dict:
            categories_dict[category] = []
        categories_dict[category].append(video)
    
    # Convert to list format
    categories = []
    for cat_name, cat_videos in categories_dict.items():
        categories.append({
            'name': cat_name,
            'video_count': len(cat_videos),
            'icon': get_category_icon(cat_name)
        })
    
    # Sort by name
    categories.sort(key=lambda x: x['name'])
    
    return jsonify(categories)

@library_bp.route('/library/category/<path:category_name>', methods=['GET'])
def get_category_videos(category_name):
    """Get all videos in a category"""
    index = load_video_index()
    videos = index.get('videos', [])
    
    # Filter videos by category
    category_videos = [
        video for video in videos 
        if video.get('category', '') == category_name
    ]
    
    return jsonify({
        'category': category_name,
        'videos': category_videos
    })

@library_bp.route('/library/search', methods=['GET'])
def search_videos():
    """Search videos by name, category, or instructor"""
    query = request.args.get('q', '').lower().strip()
    
    if not query:
        return jsonify({'videos': []})
    
    index = load_video_index()
    videos = index.get('videos', [])
    
    # Search in searchable field (which includes filename, path, category, subcategory)
    matching_videos = [
        video for video in videos
        if query in video.get('searchable', '').lower()
    ]
    
    # Limit results to 100 for performance
    return jsonify({
        'query': query,
        'videos': matching_videos[:100]
    })

@library_bp.route('/library/sessions', methods=['POST'])
def start_session():
    """Start a video workout session"""
    data = request.get_json()
    user_id = data.get('user_id', 1)
    
    session = VideoSession(
        user_id=user_id,
        video_path=data['video_path'],
        video_name=data.get('video_name', ''),
        category=data.get('category', ''),
        started_at=datetime.utcnow()
    )
    db.session.add(session)
    db.session.commit()
    
    return jsonify(session.to_dict()), 201

@library_bp.route('/library/sessions/<int:session_id>/complete', methods=['POST'])
def complete_session(session_id):
    """Mark a video session as complete and update daily metrics"""
    data = request.get_json()
    session = VideoSession.query.get_or_404(session_id)

    session.ended_at = datetime.utcnow()
    session.completed = True
    session.duration_seconds = data.get('duration_seconds', 0)
    session.notes = data.get('notes', '')

    # Auto-update DailyMetrics movement_minutes
    # Use session's start date (not today) for edge case where session spans midnight
    session_date = session.started_at.date() if session.started_at else datetime.utcnow().date()

    daily_metrics = DailyMetrics.query.filter_by(
        user_id=session.user_id,
        date=session_date
    ).first()

    if not daily_metrics:
        daily_metrics = DailyMetrics(user_id=session.user_id, date=session_date)
        db.session.add(daily_metrics)

    # Add video session duration to movement_minutes
    current_movement = daily_metrics.movement_minutes or 0
    video_minutes = session.duration_seconds // 60
    daily_metrics.movement_minutes = current_movement + video_minutes

    db.session.commit()
    return jsonify(session.to_dict())

@library_bp.route('/library/sessions/recent', methods=['GET'])
def get_recent_sessions():
    """Get recent video sessions for history"""
    user_id = request.args.get('user_id', 1, type=int)
    limit = request.args.get('limit', 10, type=int)
    
    sessions = VideoSession.query.filter_by(user_id=user_id)\
        .order_by(VideoSession.started_at.desc())\
        .limit(limit)\
        .all()
    
    return jsonify([s.to_dict() for s in sessions])

@library_bp.route('/library/favorites', methods=['GET'])
def get_favorites():
    """Get user's favorite videos"""
    user_id = request.args.get('user_id', 1, type=int)
    favorites = VideoFavorite.query.filter_by(user_id=user_id).all()
    return jsonify([f.to_dict() for f in favorites])

@library_bp.route('/library/favorites', methods=['POST'])
def add_favorite():
    """Add a video to favorites"""
    data = request.get_json()
    user_id = data.get('user_id', 1)
    
    # Check if already favorited (optimistic check for better UX)
    existing = VideoFavorite.query.filter_by(
        user_id=user_id, 
        video_path=data['video_path']
    ).first()
    
    if existing:
        return jsonify({'error': 'Already in favorites'}), 400
    
    try:
        favorite = VideoFavorite(
            user_id=user_id,
            video_path=data['video_path'],
            video_name=data.get('video_name', ''),
            category=data.get('category', '')
        )
        db.session.add(favorite)
        db.session.commit()
        
        return jsonify(favorite.to_dict()), 201
    except IntegrityError:
        # Handle race condition: another request added the same favorite concurrently
        db.session.rollback()
        # Return the existing favorite
        existing = VideoFavorite.query.filter_by(
            user_id=user_id,
            video_path=data['video_path']
        ).first()
        if existing:
            return jsonify(existing.to_dict()), 200
        else:
            return jsonify({'error': 'Failed to add favorite'}), 500

@library_bp.route('/library/favorites/<int:favorite_id>', methods=['DELETE'])
def remove_favorite(favorite_id):
    """Remove a video from favorites"""
    favorite = VideoFavorite.query.get_or_404(favorite_id)
    db.session.delete(favorite)
    db.session.commit()
    return jsonify({'success': True})

