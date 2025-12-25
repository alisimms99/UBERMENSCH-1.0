# Video Transcoding Cache Management

## Overview

The video transcoding cache system prevents unbounded disk space growth by implementing automatic cleanup with LRU (Least Recently Used) eviction, size limits, and TTL (Time To Live) expiration.

## Features

### 1. **Automatic Cache Cleanup**
- Runs automatically before each new transcoding operation
- Ensures adequate disk space for new transcoded videos

### 2. **LRU (Least Recently Used) Eviction**
- Tracks last access time for each cached file
- When cache exceeds size limit, removes least recently accessed files first
- Maintains 20% headroom below the size limit after cleanup

### 3. **TTL (Time To Live) Expiration**
- Removes cached files older than the configured TTL
- Prevents indefinite cache growth from rarely-accessed videos

### 4. **Cache Metadata Tracking**
- Stores metadata in `.cache_metadata.json` within the cache directory
- Tracks:
  - Original video path
  - Creation timestamp
  - Last access timestamp
  - File size

## Configuration

Configure cache behavior using environment variables:

### `TRANSCODE_CACHE_DIR`
- **Default:** `/tmp/ubermensch_video_cache`
- **Description:** Directory where transcoded videos are cached

### `TRANSCODE_CACHE_SIZE_LIMIT`
- **Default:** `10737418240` (10 GB)
- **Description:** Maximum cache size in bytes
- **Example:** `export TRANSCODE_CACHE_SIZE_LIMIT=21474836480` (20 GB)

### `TRANSCODE_CACHE_TTL`
- **Default:** `2592000` (30 days)
- **Description:** Maximum age of cached files in seconds
- **Examples:**
  - 7 days: `export TRANSCODE_CACHE_TTL=604800`
  - 60 days: `export TRANSCODE_CACHE_TTL=5184000`
  - 90 days: `export TRANSCODE_CACHE_TTL=7776000`

## API Endpoints

### Get Cache Statistics
```
GET /api/videos/cache/stats
```

**Response:**
```json
{
  "total_files": 42,
  "total_size_bytes": 8589934592,
  "total_size_mb": 8192.0,
  "total_size_gb": 8.0,
  "limit_bytes": 10737418240,
  "limit_gb": 10.0,
  "usage_percent": 80.0,
  "ttl_days": 30.0
}
```

### Trigger Manual Cleanup
```
POST /api/videos/cache/cleanup
POST /api/videos/cache/cleanup?force=true
```

**Query Parameters:**
- `force` (optional): If `true`, forces cleanup regardless of current cache size

**Response:**
```json
{
  "message": "Cache cleanup completed",
  "stats": {
    "files_removed": 5,
    "bytes_freed": 2147483648,
    "ttl_expired": 2,
    "lru_evicted": 3
  }
}
```

## How It Works

### Automatic Cleanup Flow

1. **Before Transcoding:** `cleanup_cache()` is called automatically
2. **TTL Check:** Remove files older than `CACHE_TTL`
3. **Size Check:** If cache size exceeds `CACHE_SIZE_LIMIT`:
   - Sort remaining files by last access time (oldest first)
   - Remove files until cache is at 80% of limit
4. **Metadata Update:** Remove deleted files from metadata

### Cache Hit Flow

1. Client requests video via `/api/videos/stream/<path:filename>`
2. System checks if video needs transcoding
3. If cached version exists:
   - Update last accessed timestamp (for LRU tracking)
   - Serve cached file
4. If not cached:
   - Run cleanup to ensure space
   - Transcode video
   - Save to cache with metadata
   - Serve transcoded file

## Storage Requirements

### Estimating Cache Size

Average transcoded video size depends on:
- **Duration:** ~10-15 MB per minute for 720p H.264 (CRF 23)
- **Resolution:** Original resolution affects output size
- **Content:** High-motion content compresses less

**Example calculations:**
- 5-minute workout video: ~50-75 MB
- 30-minute instructional video: ~300-450 MB
- 100 videos (avg 10 min): ~10-15 GB

**Recommended settings:**
- Small library (<50 videos): 5 GB
- Medium library (50-200 videos): 10-20 GB
- Large library (>200 videos): 20-50 GB

### Monitoring

Monitor cache usage with:
```bash
curl http://localhost:5000/api/videos/cache/stats
```

Set up alerts when `usage_percent` exceeds 90%.

## Best Practices

### 1. Set Appropriate Size Limits
- Base on available disk space
- Leave buffer for system operations
- Consider video library growth

### 2. Tune TTL Based on Usage
- **Frequently accessed videos:** Longer TTL (60-90 days)
- **Rarely accessed videos:** Shorter TTL (7-30 days)
- **Large libraries:** Shorter TTL to ensure turnover

### 3. Monitor Cache Health
- Check cache stats regularly
- Watch for high eviction rates (may indicate undersized cache)
- Monitor disk space on cache volume

### 4. Production Deployment
- Use dedicated volume for cache directory
- Enable monitoring/alerting on disk usage
- Consider SSD for better transcoding performance
- Set up log aggregation to track cleanup events

## Troubleshooting

### Cache Growing Too Large
- Reduce `TRANSCODE_CACHE_SIZE_LIMIT`
- Reduce `TRANSCODE_CACHE_TTL`
- Trigger manual cleanup: `POST /api/videos/cache/cleanup?force=true`

### Frequent Re-transcoding
- Increase `TRANSCODE_CACHE_SIZE_LIMIT`
- Increase `TRANSCODE_CACHE_TTL`
- Check if cache directory is being cleared externally

### Performance Issues
- Ensure cache is on fast storage (SSD preferred)
- Monitor disk I/O during transcoding
- Consider async transcoding for large files

## Security Considerations

- Cache directory should not be web-accessible
- Ensure proper file permissions (readable only by application)
- Metadata file contains original paths (no sensitive data)
- Cache cleanup logs may contain file paths

## Future Enhancements

Potential improvements for consideration:
- Async/background transcoding queue
- Pre-warming cache for popular videos
- Distributed cache across multiple servers
- Compression of less-accessed cached files
- Integration with CDN for cached content
