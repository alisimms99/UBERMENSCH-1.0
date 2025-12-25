"""
Video Server Routes for Enhanced Fitness Tracker
Handles video streaming, library management, and workout-video integration
"""

from flask import Blueprint, request, jsonify, send_file, Response
from werkzeug.utils import secure_filename
from urllib.parse import unquote
import os
import mimetypes
import json
from datetime import datetime
import subprocess
import re
import logging

from ..models import db, VideoCategory, Video, WorkoutVideoMapping, VideoPlaylist, VideoPlaylistItem
from ..models import Exercise
from ..utils.video_transcoder import (
    needs_transcoding,
    get_cache_path,
    get_playable_path,
    transcode_to_h264,
    get_video_codec
)

logger = logging.getLogger(__name__)

# Create blueprint
video_bp = Blueprint('video', __name__, url_prefix='/api/videos')

# Configuration
VIDEO_ROOT_PATH = os.environ.get('VIDEO_ROOT_PATH', '/path/to/video/library')
ALLOWED_NETWORKS = ['192.168.0.0/16', '10.0.0.0/8', '172.16.0.0/12', '127.0.0.1/32']
SUPPORTED_FORMATS = ['.mp4', '.avi', '.mov', '.mkv', '.wmv', '.flv', '.webm']

def is_video_file(filename):
    """Check if file is a supported video format."""
    return any(filename.lower().endswith(ext) for ext in SUPPORTED_FORMATS)

def send_file_partial(file_path):
    """Send file with range request support for video seeking."""
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

@video_bp.route('/list', methods=['GET'])
def list_videos():
    """List all available videos from video index or database."""
    try:
        # Try to load from video index JSON first
        video_index_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'video_index.json')
        
        if os.path.exists(video_index_path):
            with open(video_index_path, 'r') as f:
                index_data = json.load(f)
                return jsonify({
                    'videos': index_data.get('videos', []),
                    'categories': index_data.get('categories', []),
                    'total': len(index_data.get('videos', []))
                })
        
        # Fallback to database
        videos = Video.query.all()
        return jsonify({
            'videos': [{
                'id': v.id,
                'filename': v.filename,
                'path': v.file_path,
                'title': v.title or v.filename
            } for v in videos],
            'total': len(videos)
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@video_bp.route('/search', methods=['GET'])
def search_videos():
    """Search videos by filename/path."""
    try:
        query = request.args.get('q', '').lower()
        
        if not query:
            return jsonify({'videos': [], 'total': 0, 'query': ''})
        
        # Try to load from video index JSON first
        video_index_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'video_index.json')
        
        if os.path.exists(video_index_path):
            with open(video_index_path, 'r') as f:
                index_data = json.load(f)
                videos = index_data.get('videos', [])
                # Filter by searchable text
                filtered = [v for v in videos if query in v.get('searchable', '').lower() or 
                           query in v.get('filename', '').lower() or 
                           query in v.get('path', '').lower()]
                return jsonify({
                    'videos': filtered,
                    'total': len(filtered),
                    'query': query
                })
        
        # Fallback to database search
        videos = Video.query.filter(
            db.or_(
                Video.filename.contains(query),
                Video.file_path.contains(query),
                Video.title.contains(query)
            )
        ).all()
        
        return jsonify({
            'videos': [{
                'id': v.id,
                'filename': v.filename,
                'path': v.file_path,
                'title': v.title or v.filename
            } for v in videos],
            'total': len(videos),
            'query': query
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@video_bp.route('/stream/<path:filename>', methods=['GET'])
def stream_video_by_path(filename):
    """Stream video file, transcoding if necessary for browser compatibility."""
    try:
        if not VIDEO_ROOT_PATH:
            return jsonify({'error': 'VIDEO_ROOT_PATH not configured'}), 500
        
        # Flask's <path:filename> already URL-decodes, but handle any edge cases
        # Properly decode URL-encoded characters (handles %2F, %20, %26, etc.)
        video_path = unquote(filename)
        
        # Remove leading ./ if present
        if video_path.startswith('./'):
            video_path = video_path[2:]
        
        file_path = os.path.join(VIDEO_ROOT_PATH, video_path)
        
        # Security check: ensure path is within VIDEO_ROOT_PATH
        abs_video_root = os.path.abspath(VIDEO_ROOT_PATH)
        abs_file_path = os.path.abspath(file_path)
        if not abs_file_path.startswith(abs_video_root):
            return jsonify({'error': 'Invalid video path'}), 403
        
        if not os.path.exists(file_path):
            return jsonify({'error': 'Video file not found'}), 404
        
        if not is_video_file(file_path):
            return jsonify({'error': 'File is not a supported video format'}), 400
        
        # Check if we need transcoding
        playable_path = get_playable_path(file_path)
        
        if playable_path:
            # Already playable (H.264 or cached transcode)
            logger.debug(f"Serving playable video: {playable_path}")
            return send_file_partial(playable_path)
        
        # Need to transcode - check if transcoding is in progress or start it
        cache_path = get_cache_path(file_path)
        
        # Check if cache is being created (temp file exists)
        tmp_path = cache_path + '.tmp'
        if os.path.exists(tmp_path):
            # Verify that the temp file is not stale before assuming transcoding is in progress
            try:
                mtime = datetime.fromtimestamp(os.path.getmtime(tmp_path))
                age = datetime.now() - mtime
                # If the temp file is older than 1 hour, assume a previous transcoding attempt failed
                if age.total_seconds() > 3600:
                    logger.warning(
                        f"Stale transcoding temp file detected (age={age.total_seconds()}s) for: {file_path}. "
                        "Removing temp file and restarting transcoding."
                    )
                    try:
                        os.remove(tmp_path)
                    except OSError as remove_err:
                        logger.error(f"Failed to remove stale temp file {tmp_path}: {remove_err}")
                else:
                    # Transcoding in progress - return 202 Accepted with retry-after
                    return jsonify({
                        'error': 'Video is being prepared for playback',
                        'status': 'transcoding',
                        'message': 'Please wait and try again in a moment'
                    }), 202
            except Exception as tmp_check_err:
                # If we cannot reliably determine staleness, fall back to existing behavior
                logger.warning(
                    f"Error while checking transcoding temp file {tmp_path}: {tmp_check_err}. "
                    "Assuming transcoding is in progress."
                )
                return jsonify({
                    'error': 'Video is being prepared for playback',
                    'status': 'transcoding',
                    'message': 'Please wait and try again in a moment'
                }), 202
        
        # Start transcoding (this will block - consider async for large files)
        logger.info(f"Starting transcoding for: {file_path}")
        if transcode_to_h264(file_path, cache_path):
            logger.info(f"Transcoding complete, serving: {cache_path}")
            return send_file_partial(cache_path)
        else:
            logger.error(f"Transcoding failed for: {file_path}")
            return jsonify({
                'error': 'Video transcoding failed',
                'message': 'Unable to prepare video for playback'
            }), 500
    
    except Exception as e:
        logger.error(f"Error streaming video: {str(e)}")
        return jsonify({'error': str(e)}), 500

@video_bp.route('/stream/<int:video_id>', methods=['GET'])
def stream_video(video_id):
    """Stream video by ID with range support for seeking."""
    try:
        video = Video.query.get_or_404(video_id)
        file_path = os.path.join(VIDEO_ROOT_PATH, video.file_path)
        
        if not os.path.exists(file_path):
            return jsonify({'error': 'Video file not found'}), 404
        
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

@video_bp.route('/transcode-status/<path:filename>', methods=['GET'])
def transcode_status(filename):
    """Check if a video needs transcoding and if cache exists."""
    try:
        if not VIDEO_ROOT_PATH:
            return jsonify({'error': 'VIDEO_ROOT_PATH not configured'}), 500
        
        video_path = unquote(filename)
        if video_path.startswith('./'):
            video_path = video_path[2:]
        
        file_path = os.path.join(VIDEO_ROOT_PATH, video_path)
        
        if not os.path.exists(file_path):
            return jsonify({'error': 'Video file not found'}), 404
        
        needs_tc = needs_transcoding(file_path)
        cache_path = get_cache_path(file_path)
        cache_exists = os.path.exists(cache_path)
        transcoding_in_progress = os.path.exists(cache_path + '.tmp')
        
        return jsonify({
            'needs_transcoding': needs_tc,
            'cache_exists': cache_exists,
            'transcoding_in_progress': transcoding_in_progress,
            'ready': not needs_tc or cache_exists,
            'codec': get_video_codec(file_path) if needs_tc else 'h264'
        })
    except Exception as e:
        logger.error(f"Error checking transcode status: {str(e)}")
        return jsonify({'error': str(e)}), 500

@video_bp.route('/transcode', methods=['POST'])
def trigger_transcode():
    """Trigger transcoding of a video (for pre-caching)."""
    try:
        if not VIDEO_ROOT_PATH:
            return jsonify({'error': 'VIDEO_ROOT_PATH not configured'}), 500
        
        data = request.get_json()
        filename = data.get('filename')
        
        if not filename:
            return jsonify({'error': 'filename required'}), 400
        
        video_path = unquote(filename)
        if video_path.startswith('./'):
            video_path = video_path[2:]
        
        file_path = os.path.join(VIDEO_ROOT_PATH, video_path)
        
        if not os.path.exists(file_path):
            return jsonify({'error': 'Video file not found'}), 404
        
        if not needs_transcoding(file_path):
            return jsonify({
                'status': 'not_needed',
                'message': 'Already H.264, no transcoding needed'
            })
        
        cache_path = get_cache_path(file_path)
        if os.path.exists(cache_path):
            return jsonify({
                'status': 'cached',
                'message': 'Already transcoded',
                'cache_path': cache_path
            })
        
        # Check if already transcoding
        if os.path.exists(cache_path + '.tmp'):
            return jsonify({
                'status': 'in_progress',
                'message': 'Transcoding already in progress'
            })
        
        # Start transcoding (synchronous - consider async for production)
        logger.info(f"Triggering transcoding for: {file_path}")
        success = transcode_to_h264(file_path, cache_path)
        
        if success:
            return jsonify({
                'status': 'complete',
                'message': 'Transcoding completed successfully',
                'cache_path': cache_path
            })
        else:
            return jsonify({
                'status': 'failed',
                'message': 'Transcoding failed'
            }), 500
    
    except Exception as e:
        logger.error(f"Error triggering transcode: {str(e)}")
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

