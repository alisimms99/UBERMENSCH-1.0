"""
Video Server Routes for Enhanced Fitness Tracker
Handles video streaming, library management, and workout-video integration
"""

from flask import Blueprint, request, jsonify, send_file, Response
from werkzeug.utils import secure_filename
import os
import mimetypes
import json
from datetime import datetime
import subprocess
import re

from ..models import db, VideoCategory, Video, WorkoutVideoMapping, VideoPlaylist, VideoPlaylistItem
from ..models import Exercise

# Create blueprint
video_bp = Blueprint('video', __name__, url_prefix='/api/videos')

# Configuration
VIDEO_ROOT_PATH = os.environ.get('VIDEO_ROOT_PATH', '/path/to/video/library')
ALLOWED_NETWORKS = ['192.168.0.0/16', '10.0.0.0/8', '172.16.0.0/12', '127.0.0.1/32']
SUPPORTED_FORMATS = ['.mp4', '.avi', '.mov', '.mkv', '.wmv', '.flv', '.webm']

def is_video_file(filename):
    """Check if file is a supported video format."""
    return any(filename.lower().endswith(ext) for ext in SUPPORTED_FORMATS)

def get_video_info(file_path):
    """Extract video metadata using ffprobe."""
    try:
        cmd = [
            'ffprobe', '-v', 'quiet', '-print_format', 'json', '-show_format', '-show_streams',
            file_path
        ]
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode == 0:
            data = json.loads(result.stdout)
            
            # Extract video stream info
            video_stream = next((s for s in data.get('streams', []) if s.get('codec_type') == 'video'), None)
            format_info = data.get('format', {})
            
            return {
                'duration': float(format_info.get('duration', 0)),
                'size': int(format_info.get('size', 0)),
                'format': format_info.get('format_name', '').split(',')[0],
                'resolution': f"{video_stream.get('width', 0)}x{video_stream.get('height', 0)}" if video_stream else None
            }
    except Exception as e:
        print(f"Error extracting video info: {e}")
    
    return {'duration': 0, 'size': 0, 'format': None, 'resolution': None}

@video_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint for video server."""
    return jsonify({
        'status': 'healthy',
        'video_root': VIDEO_ROOT_PATH,
        'root_exists': os.path.exists(VIDEO_ROOT_PATH),
        'timestamp': datetime.utcnow().isoformat()
    })

@video_bp.route('/categories', methods=['GET'])
def get_categories():
    """Get all video categories."""
    try:
        categories = VideoCategory.query.filter_by(is_active=True, parent_id=None).order_by(VideoCategory.sort_order).all()
        return jsonify({
            'categories': [cat.to_dict() for cat in categories],
            'total': len(categories)
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@video_bp.route('/categories/<int:category_id>/videos', methods=['GET'])
def get_category_videos(category_id):
    """Get videos in a specific category."""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        search = request.args.get('search', '')
        
        category = VideoCategory.query.get_or_404(category_id)
        
        query = Video.query.filter_by(category_id=category_id, is_available=True)
        
        if search:
            query = query.filter(Video.title.contains(search))
        
        videos = query.order_by(Video.title).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'videos': [video.to_dict() for video in videos.items],
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': videos.total,
                'pages': videos.pages,
                'has_next': videos.has_next,
                'has_prev': videos.has_prev
            },
            'category': category.to_dict()
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@video_bp.route('/search', methods=['GET'])
def search_videos():
    """Search videos across all categories."""
    try:
        query = request.args.get('q', '')
        category_id = request.args.get('category_id', type=int)
        difficulty = request.args.get('difficulty')
        instructor = request.args.get('instructor')
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        video_query = Video.query.filter_by(is_available=True)
        
        if query:
            video_query = video_query.filter(
                db.or_(
                    Video.title.contains(query),
                    Video.description.contains(query),
                    Video.instructor.contains(query)
                )
            )
        
        if category_id:
            video_query = video_query.filter_by(category_id=category_id)
        
        if difficulty:
            video_query = video_query.filter_by(difficulty_level=difficulty)
        
        if instructor:
            video_query = video_query.filter_by(instructor=instructor)
        
        videos = video_query.order_by(Video.view_count.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'videos': [video.to_dict() for video in videos.items],
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': videos.total,
                'pages': videos.pages,
                'has_next': videos.has_next,
                'has_prev': videos.has_prev
            },
            'query': query
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@video_bp.route('/stream/<int:video_id>', methods=['GET'])
def stream_video(video_id):
    """Stream video with range support for seeking."""
    try:
        video = Video.query.get_or_404(video_id)
        
        if not video.is_available:
            return jsonify({'error': 'Video not available'}), 404
        
        file_path = os.path.join(VIDEO_ROOT_PATH, video.file_path)
        
        if not os.path.exists(file_path):
            # Mark video as unavailable
            video.is_available = False
            db.session.commit()
            return jsonify({'error': 'Video file not found'}), 404
        
        # Increment view count
        video.increment_view_count()
        
        # Get file info
        file_size = os.path.getsize(file_path)
        
        # Handle range requests for video seeking
        range_header = request.headers.get('Range', None)
        if range_header:
            byte_start = 0
            byte_end = file_size - 1
            
            range_match = re.search(r'bytes=(\d+)-(\d*)', range_header)
            if range_match:
                byte_start = int(range_match.group(1))
                if range_match.group(2):
                    byte_end = int(range_match.group(2))
            
            content_length = byte_end - byte_start + 1
            
            def generate():
                with open(file_path, 'rb') as f:
                    f.seek(byte_start)
                    remaining = content_length
                    while remaining:
                        chunk_size = min(8192, remaining)
                        chunk = f.read(chunk_size)
                        if not chunk:
                            break
                        remaining -= len(chunk)
                        yield chunk
            
            response = Response(
                generate(),
                206,  # Partial Content
                headers={
                    'Content-Range': f'bytes {byte_start}-{byte_end}/{file_size}',
                    'Accept-Ranges': 'bytes',
                    'Content-Length': str(content_length),
                    'Content-Type': mimetypes.guess_type(file_path)[0] or 'video/mp4'
                }
            )
            return response
        else:
            # Full file response
            return send_file(
                file_path,
                mimetype=mimetypes.guess_type(file_path)[0] or 'video/mp4',
                as_attachment=False
            )
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@video_bp.route('/<int:video_id>', methods=['GET'])
def get_video(video_id):
    """Get video details."""
    try:
        video = Video.query.get_or_404(video_id)
        return jsonify(video.to_dict())
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@video_bp.route('/<int:video_id>/favorite', methods=['POST'])
def toggle_favorite(video_id):
    """Toggle video favorite status."""
    try:
        video = Video.query.get_or_404(video_id)
        video.is_favorite = not video.is_favorite
        db.session.commit()
        
        return jsonify({
            'video_id': video_id,
            'is_favorite': video.is_favorite
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@video_bp.route('/exercise/<int:exercise_id>/videos', methods=['GET'])
def get_exercise_videos(exercise_id):
    """Get videos mapped to a specific exercise."""
    try:
        exercise = Exercise.query.get_or_404(exercise_id)
        
        mappings = WorkoutVideoMapping.query.filter_by(exercise_id=exercise_id).order_by(
            WorkoutVideoMapping.is_primary.desc(),
            WorkoutVideoMapping.sort_order
        ).all()
        
        return jsonify({
            'exercise': exercise.to_dict(),
            'videos': [mapping.to_dict() for mapping in mappings],
            'total': len(mappings)
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@video_bp.route('/exercise/<int:exercise_id>/videos', methods=['POST'])
def map_video_to_exercise(exercise_id):
    """Map a video to an exercise."""
    try:
        data = request.get_json()
        
        exercise = Exercise.query.get_or_404(exercise_id)
        video = Video.query.get_or_404(data['video_id'])
        
        # Check if mapping already exists
        existing = WorkoutVideoMapping.query.filter_by(
            exercise_id=exercise_id,
            video_id=data['video_id']
        ).first()
        
        if existing:
            return jsonify({'error': 'Video already mapped to this exercise'}), 400
        
        mapping = WorkoutVideoMapping(
            exercise_id=exercise_id,
            video_id=data['video_id'],
            mapping_type=data.get('mapping_type', 'instruction'),
            is_primary=data.get('is_primary', False),
            sort_order=data.get('sort_order', 0),
            start_time_seconds=data.get('start_time_seconds'),
            end_time_seconds=data.get('end_time_seconds'),
            notes=data.get('notes')
        )
        
        db.session.add(mapping)
        db.session.commit()
        
        return jsonify(mapping.to_dict()), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@video_bp.route('/playlists', methods=['GET'])
def get_playlists():
    """Get video playlists."""
    try:
        user_id = request.args.get('user_id', type=int)
        include_system = request.args.get('include_system', 'true').lower() == 'true'
        
        query = VideoPlaylist.query
        
        if user_id:
            if include_system:
                query = query.filter(
                    db.or_(
                        VideoPlaylist.user_id == user_id,
                        VideoPlaylist.is_system == True
                    )
                )
            else:
                query = query.filter_by(user_id=user_id)
        elif include_system:
            query = query.filter_by(is_system=True)
        
        playlists = query.order_by(VideoPlaylist.created_at.desc()).all()
        
        return jsonify({
            'playlists': [playlist.to_dict() for playlist in playlists],
            'total': len(playlists)
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@video_bp.route('/playlists', methods=['POST'])
def create_playlist():
    """Create a new video playlist."""
    try:
        data = request.get_json()
        
        playlist = VideoPlaylist(
            name=data['name'],
            description=data.get('description'),
            user_id=data.get('user_id'),
            is_public=data.get('is_public', False)
        )
        
        db.session.add(playlist)
        db.session.commit()
        
        return jsonify(playlist.to_dict()), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@video_bp.route('/playlists/<int:playlist_id>/videos', methods=['POST'])
def add_video_to_playlist(playlist_id):
    """Add a video to a playlist."""
    try:
        data = request.get_json()
        
        playlist = VideoPlaylist.query.get_or_404(playlist_id)
        video = Video.query.get_or_404(data['video_id'])
        
        # Check if video already in playlist
        existing = VideoPlaylistItem.query.filter_by(
            playlist_id=playlist_id,
            video_id=data['video_id']
        ).first()
        
        if existing:
            return jsonify({'error': 'Video already in playlist'}), 400
        
        # Get next sort order
        max_order = db.session.query(db.func.max(VideoPlaylistItem.sort_order)).filter_by(
            playlist_id=playlist_id
        ).scalar() or 0
        
        item = VideoPlaylistItem(
            playlist_id=playlist_id,
            video_id=data['video_id'],
            sort_order=max_order + 1,
            start_time_seconds=data.get('start_time_seconds'),
            end_time_seconds=data.get('end_time_seconds'),
            notes=data.get('notes')
        )
        
        db.session.add(item)
        
        # Update playlist total duration
        if video.duration_seconds:
            playlist.total_duration_seconds += video.duration_seconds
        
        db.session.commit()
        
        return jsonify(item.to_dict()), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@video_bp.route('/scan', methods=['POST'])
def scan_video_library():
    """Scans the video directory and populates the database."""
    if not VIDEO_ROOT_PATH or not os.path.exists(VIDEO_ROOT_PATH):
        return jsonify({"error": "VIDEO_ROOT_PATH is not configured or does not exist."}), 500

    video_files = []
    for root, dirs, files in os.walk(VIDEO_ROOT_PATH):
        for file in files:
            if file.lower().endswith(('.mp4', '.avi', '.mov')):
                video_files.append(os.path.join(root, file))

    for video_path in video_files:
        relative_path = os.path.relpath(video_path, VIDEO_ROOT_PATH)
        if not Video.query.filter_by(file_path=relative_path).first():
            new_video = Video(
                title=os.path.splitext(os.path.basename(video_path))[0],
                file_path=relative_path,
                filename=os.path.basename(video_path)
            )
            db.session.add(new_video)
    
    db.session.commit()
    return jsonify({"message": f"Scan complete. Found {len(video_files)} videos."})

def get_or_create_category_from_path(folder_parts):
    """Get or create video category from folder path."""
    if not folder_parts:
        # Default category
        category = VideoCategory.query.filter_by(name='general').first()
        if not category:
            category = VideoCategory(
                name='general',
                display_name='General',
                folder_path='',
                description='General video category'
            )
            db.session.add(category)
            db.session.commit()
        return category
    
    # Build category hierarchy
    current_path = ''
    parent_id = None
    
    for folder in folder_parts:
        current_path = os.path.join(current_path, folder) if current_path else folder
        
        # Clean folder name for category
        category_name = folder.lower().replace(' ', '_').replace('!', '').replace('&', 'and')
        display_name = folder.replace('!', '').replace('_', ' ').title()
        
        category = VideoCategory.query.filter_by(
            name=category_name,
            parent_id=parent_id
        ).first()
        
        if not category:
            category = VideoCategory(
                name=category_name,
                display_name=display_name,
                folder_path=current_path,
                parent_id=parent_id,
                description=f'Category for {display_name} videos'
            )
            db.session.add(category)
            db.session.commit()
        
        parent_id = category.id
    
    return category

