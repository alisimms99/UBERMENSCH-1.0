"""
Video transcoding utilities using FFmpeg
"""
import subprocess
import os
import hashlib
import logging
import json
import time
from pathlib import Path

logger = logging.getLogger(__name__)

TRANSCODE_CACHE_DIR = os.environ.get('TRANSCODE_CACHE_DIR', '/tmp/ubermensch_video_cache')
# Cache size limit in bytes (default: 10 GB)
CACHE_SIZE_LIMIT = int(os.environ.get('TRANSCODE_CACHE_SIZE_LIMIT', 10 * 1024 * 1024 * 1024))
# Cache TTL in seconds (default: 30 days)
CACHE_TTL = int(os.environ.get('TRANSCODE_CACHE_TTL', 30 * 24 * 60 * 60))
# Metadata file for tracking cache usage
CACHE_METADATA_FILE = os.path.join(TRANSCODE_CACHE_DIR, '.cache_metadata.json')

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
    """Generate cache path for transcoded file"""
    path_hash = hashlib.md5(original_path.encode()).hexdigest()
    filename = os.path.basename(original_path)
    name, _ = os.path.splitext(filename)
    # Limit filename length for filesystem compatibility
    safe_name = name[:50].replace('/', '_').replace('\\', '_')
    return os.path.join(TRANSCODE_CACHE_DIR, f"{path_hash}_{safe_name}.mp4")

def ensure_cache_dir():
    """Create cache directory if it doesn't exist"""
    os.makedirs(TRANSCODE_CACHE_DIR, exist_ok=True)

def load_cache_metadata():
    """Load cache metadata from file"""
    if not os.path.exists(CACHE_METADATA_FILE):
        return {}
    
    try:
        with open(CACHE_METADATA_FILE, 'r') as f:
            return json.load(f)
    except Exception as e:
        logger.warning(f"Failed to load cache metadata: {e}")
        return {}

def save_cache_metadata(metadata):
    """Save cache metadata to file"""
    ensure_cache_dir()
    try:
        with open(CACHE_METADATA_FILE, 'w') as f:
            json.dump(metadata, f, indent=2)
    except Exception as e:
        logger.error(f"Failed to save cache metadata: {e}")

def update_cache_metadata(cache_path, original_path):
    """Update metadata for a cached file"""
    metadata = load_cache_metadata()
    
    # Get file size
    file_size = os.path.getsize(cache_path) if os.path.exists(cache_path) else 0
    
    metadata[cache_path] = {
        'original_path': original_path,
        'created_at': time.time(),
        'last_accessed': time.time(),
        'size': file_size
    }
    
    save_cache_metadata(metadata)
    logger.debug(f"Updated metadata for {cache_path}")

def touch_cache_file(cache_path):
    """Update last accessed time for a cached file"""
    metadata = load_cache_metadata()
    
    if cache_path in metadata:
        metadata[cache_path]['last_accessed'] = time.time()
        save_cache_metadata(metadata)
        logger.debug(f"Touched cache file: {cache_path}")

def get_cache_size():
    """Calculate total size of cache directory"""
    total_size = 0
    metadata = load_cache_metadata()
    
    for cache_path, info in metadata.items():
        if os.path.exists(cache_path):
            # Update size if it changed
            actual_size = os.path.getsize(cache_path)
            if actual_size != info.get('size', 0):
                info['size'] = actual_size
            total_size += info['size']
        else:
            # File was deleted externally, remove from metadata
            logger.debug(f"Removing stale metadata entry: {cache_path}")
    
    # Clean up stale entries
    metadata = {k: v for k, v in metadata.items() if os.path.exists(k)}
    save_cache_metadata(metadata)
    
    return total_size

def cleanup_cache(force=False):
    """
    Clean up cache based on size limits and TTL.
    
    Implements LRU eviction when cache size exceeds limit.
    Removes files older than TTL.
    
    Args:
        force: If True, perform cleanup regardless of current cache size
    
    Returns:
        dict: Statistics about cleanup operation
    """
    ensure_cache_dir()
    metadata = load_cache_metadata()
    current_time = time.time()
    
    stats = {
        'files_removed': 0,
        'bytes_freed': 0,
        'ttl_expired': 0,
        'lru_evicted': 0
    }
    
    files_to_remove = []
    
    # First pass: Remove files older than TTL
    for cache_path, info in list(metadata.items()):
        created_at = info.get('created_at', 0)
        age = current_time - created_at
        
        if age > CACHE_TTL:
            files_to_remove.append((cache_path, info, 'ttl'))
            stats['ttl_expired'] += 1
            logger.info(f"Cache file expired (age: {age/86400:.1f} days): {cache_path}")
    
    # Second pass: LRU eviction if cache is too large
    current_size = get_cache_size()
    
    if force or current_size > CACHE_SIZE_LIMIT:
        # Sort files by last accessed time (oldest first)
        remaining_files = [(path, info) for path, info in metadata.items() 
                          if path not in [f[0] for f in files_to_remove]]
        
        remaining_files.sort(key=lambda x: x[1].get('last_accessed', 0))
        
        # Remove files until we're under the limit
        target_size = CACHE_SIZE_LIMIT * 0.8  # Leave 20% headroom
        
        for cache_path, info in remaining_files:
            if current_size <= target_size and not force:
                break
            
            files_to_remove.append((cache_path, info, 'lru'))
            current_size -= info.get('size', 0)
            stats['lru_evicted'] += 1
            logger.info(f"LRU evicting cache file: {cache_path}")
    
    # Remove files and update metadata
    for cache_path, info, reason in files_to_remove:
        try:
            if os.path.exists(cache_path):
                os.remove(cache_path)
                stats['bytes_freed'] += info.get('size', 0)
                stats['files_removed'] += 1
                logger.info(f"Removed cache file ({reason}): {cache_path}")
            
            # Remove from metadata
            if cache_path in metadata:
                del metadata[cache_path]
        
        except Exception as e:
            logger.error(f"Failed to remove cache file {cache_path}: {e}")
    
    # Save updated metadata
    save_cache_metadata(metadata)
    
    # Log summary
    if stats['files_removed'] > 0:
        logger.info(
            f"Cache cleanup complete: removed {stats['files_removed']} files "
            f"({stats['bytes_freed'] / (1024*1024):.2f} MB), "
            f"TTL expired: {stats['ttl_expired']}, LRU evicted: {stats['lru_evicted']}"
        )
    
    return stats

def get_cache_stats():
    """Get current cache statistics"""
    metadata = load_cache_metadata()
    total_size = get_cache_size()
    
    return {
        'total_files': len(metadata),
        'total_size_bytes': total_size,
        'total_size_mb': total_size / (1024 * 1024),
        'total_size_gb': total_size / (1024 * 1024 * 1024),
        'limit_bytes': CACHE_SIZE_LIMIT,
        'limit_gb': CACHE_SIZE_LIMIT / (1024 * 1024 * 1024),
        'usage_percent': (total_size / CACHE_SIZE_LIMIT * 100) if CACHE_SIZE_LIMIT > 0 else 0,
        'ttl_days': CACHE_TTL / (24 * 60 * 60)
    }

def transcode_to_h264(input_path, output_path):
    """
    Transcode video to H.264/AAC for browser playback
    Uses 'fast' preset for reasonable speed/quality balance
    """
    ensure_cache_dir()
    
    # Run cache cleanup before transcoding to ensure space
    cleanup_cache()
    
    # Create temp file first, then rename (atomic operation)
    temp_path = output_path + '.tmp'
    
    try:
        logger.info(f"Transcoding: {input_path}")
        result = subprocess.run([
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
        
        # Update cache metadata
        update_cache_metadata(output_path, input_path)
        
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
        # Update last accessed time for LRU tracking
        touch_cache_file(cache_path)
        return cache_path
    
    return None  # Needs transcoding

