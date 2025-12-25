"""
Video transcoding utilities using FFmpeg
"""
import subprocess
import os
import hashlib
import logging
import fcntl

logger = logging.getLogger(__name__)

TRANSCODE_CACHE_DIR = os.environ.get('TRANSCODE_CACHE_DIR', '/tmp/ubermensch_video_cache')

def get_video_codec(file_path):
    """Get the video codec of a file using ffprobe"""
    try:
        result = subprocess.run([
            'ffprobe', '-v', 'error', '-select_streams', 'v:0',
            '-show_entries', 'stream=codec_name', '-of', 'csv=p=0',
            file_path
        ], capture_output=True, text=True, timeout=10)
        return result.stdout.strip().lower()
    except Exception as e:
        logger.error(f"ffprobe failed for {file_path}: {e}")
        return None

def needs_transcoding(file_path):
    """Check if video needs transcoding for browser playback"""
    codec = get_video_codec(file_path)
    if not codec:
        # If we can't detect codec, assume it needs transcoding to be safe
        return True
    # These codecs play natively in browsers
    browser_compatible = ['h264', 'avc1', 'avc']
    return codec not in browser_compatible

def get_cache_path(original_path):
    """Generate cache path for transcoded file using SHA-256 for security"""
    # Use SHA-256 instead of MD5 for better security
    path_hash = hashlib.sha256(original_path.encode()).hexdigest()[:16]
    filename = os.path.basename(original_path)
    name, _ = os.path.splitext(filename)
    # Limit filename length for filesystem compatibility
    safe_name = name[:50].replace('/', '_').replace('\\', '_')
    return os.path.join(TRANSCODE_CACHE_DIR, f"{path_hash}_{safe_name}.mp4")

def ensure_cache_dir():
    """Create cache directory if it doesn't exist"""
    os.makedirs(TRANSCODE_CACHE_DIR, exist_ok=True)

def transcode_to_h264(input_path, output_path):
    """
    Transcode video to H.264/AAC for browser playback
    Uses 'fast' preset for reasonable speed/quality balance
    Implements file-based locking to prevent race conditions
    """
    ensure_cache_dir()
    
    # Create temp file first, then rename (atomic operation)
    temp_path = output_path + '.tmp'
    lock_path = output_path + '.lock'
    
    # File-based locking to prevent concurrent transcoding of same file
    try:
        lock_file = open(lock_path, 'w')
        try:
            fcntl.flock(lock_file, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except IOError:
            # Another process is already transcoding this file
            lock_file.close()
            logger.info(f"Transcoding already in progress for: {input_path}")
            return False
        
        try:
            logger.info(f"Transcoding: {input_path}")
            # Remove unused result variable - we only care about success/failure
            subprocess.run([
                'ffmpeg', '-i', input_path,
                '-c:v', 'libx264', '-preset', 'fast', '-crf', '23',
                '-c:a', 'aac', '-b:a', '192k',
                '-movflags', '+faststart',  # Enable streaming before complete
                '-f', 'mp4',  # Explicitly specify MP4 container format
                '-y',  # Overwrite
                temp_path
            ], check=True, capture_output=True, text=True, timeout=3600)  # 1 hour timeout
            
            # Rename temp to final
            os.rename(temp_path, output_path)
            logger.info(f"Transcoding complete: {output_path}")
            return True
            
        except subprocess.TimeoutExpired:
            logger.error(f"Transcoding timed out: {input_path}")
            if os.path.exists(temp_path):
                os.remove(temp_path)
            return False
        except subprocess.CalledProcessError as e:
            logger.error(f"Transcoding failed: {e.stderr if e.stderr else str(e)}")
            if os.path.exists(temp_path):
                os.remove(temp_path)
            return False
        except Exception as e:
            logger.error(f"Transcoding error: {str(e)}")
            if os.path.exists(temp_path):
                os.remove(temp_path)
            return False
        finally:
            # Release lock and close file descriptor
            fcntl.flock(lock_file, fcntl.LOCK_UN)
            lock_file.close()
            if os.path.exists(lock_path):
                os.remove(lock_path)
    except Exception as e:
        logger.error(f"Lock acquisition failed: {str(e)}");
        return False;

def get_playable_path(original_path):
    """
    Returns path to a browser-playable version of the video.
    - If already H.264, returns original path
    - If cached transcode exists, returns cache path
    - Otherwise returns None (caller should trigger transcode)
    """
    if not os.path.exists(original_path):
        return None
    
    if not needs_transcoding(original_path):
        return original_path
    
    cache_path = get_cache_path(original_path)
    if os.path.exists(cache_path):
        return cache_path
    
    return None  # Needs transcoding

