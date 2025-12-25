# Asynchronous Video Transcoding

## Overview

Video transcoding has been implemented using RQ (Redis Queue) to prevent blocking the web server during long-running transcoding operations. This ensures that the web server can continue handling other requests while videos are being transcoded in the background.

## Architecture

- **RQ (Redis Queue)**: Lightweight task queue for Python
- **Redis**: In-memory data store used as the message broker
- **Worker Process**: Separate process that handles transcoding jobs

## Setup

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

This will install:
- `rq`: Redis Queue library
- `redis`: Redis client for Python

### 2. Start Redis Server

Redis must be running for async transcoding to work:

```bash
# Using Docker (recommended)
docker run -d -p 6379:6379 redis:alpine

# Or install Redis locally
# On macOS:
brew install redis
redis-server

# On Ubuntu/Debian:
sudo apt-get install redis-server
sudo systemctl start redis
```

### 3. Start RQ Worker

In a separate terminal, start the RQ worker to process transcoding jobs:

```bash
cd backend
rq worker transcode --url redis://localhost:6379
```

For production, use a process manager like systemd or supervisord to keep workers running.

### 4. Configure Environment Variables (Optional)

Create a `.env` file in the `backend` directory:

```env
# Redis configuration (defaults shown)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0

# Video configuration
VIDEO_ROOT_PATH=/path/to/your/videos
TRANSCODE_CACHE_DIR=/tmp/ubermensch_video_cache
```

## How It Works

### When Redis/RQ is Available (Async Mode)

1. Client requests a video that needs transcoding
2. Server checks if transcoding job already exists in queue
3. If not, server enqueues a transcoding job and returns HTTP 202 (Accepted)
4. Worker process picks up the job and transcodes the video
5. Client polls `/transcode-status` endpoint to check progress
6. Once complete, client can stream the transcoded video

### When Redis/RQ is Unavailable (Fallback Mode)

The system gracefully falls back to synchronous transcoding:
- First video request will block until transcoding completes
- Subsequent requests will serve the cached transcoded file
- A warning is logged indicating RQ is unavailable

## API Endpoints

### Check Transcode Status
```
GET /api/videos/transcode-status/<path:filename>
```

Response:
```json
{
  "needs_transcoding": true,
  "cache_exists": false,
  "transcoding_in_progress": true,
  "ready": false,
  "codec": "h265",
  "job": {
    "job_id": "transcode:/path/to/video.mp4",
    "status": "started",
    "created_at": "2025-12-25T17:30:00Z",
    "started_at": "2025-12-25T17:30:05Z"
  }
}
```

### Trigger Transcoding (Pre-cache)
```
POST /api/videos/transcode
Content-Type: application/json

{
  "filename": "path/to/video.mp4"
}
```

Response (async):
```json
{
  "status": "queued",
  "message": "Transcoding job queued successfully",
  "job_id": "transcode:/path/to/video.mp4"
}
```

### Stream Video
```
GET /api/videos/stream/<path:filename>
```

- Returns video stream if ready (200 OK)
- Returns job queued response if transcoding needed (202 Accepted)
- Returns error if transcoding failed (500 Internal Server Error)

## Production Deployment

### Multiple Workers

For better performance, run multiple worker processes:

```bash
# Terminal 1
rq worker transcode --url redis://localhost:6379

# Terminal 2
rq worker transcode --url redis://localhost:6379

# Terminal 3
rq worker transcode --url redis://localhost:6379
```

### Monitoring

Use RQ's built-in dashboard for monitoring:

```bash
pip install rq-dashboard
rq-dashboard --redis-url redis://localhost:6379
```

Then visit http://localhost:9181

### Process Management

Example systemd service file (`/etc/systemd/system/ubermensch-worker.service`):

```ini
[Unit]
Description=UBERMENSCH RQ Worker
After=network.target redis.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/UBERMENSCH-1.0/backend
Environment="PATH=/path/to/venv/bin"
ExecStart=/path/to/venv/bin/rq worker transcode --url redis://localhost:6379
Restart=always

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable ubermensch-worker
sudo systemctl start ubermensch-worker
```

## Limitations

- **No Redis = No Async**: Without Redis, the system falls back to synchronous transcoding
- **Job Persistence**: Jobs are stored in Redis memory; consider Redis persistence configuration for production
- **Network**: Redis should be on the same network/machine as the web server for best performance
- **Timeouts**: Default job timeout is 1 hour; adjust based on your video sizes

## Benefits

✅ **Non-blocking**: Web server remains responsive during transcoding  
✅ **Scalable**: Add more workers to process multiple videos concurrently  
✅ **Resilient**: Graceful fallback when Redis is unavailable  
✅ **Transparent**: Jobs can be monitored and managed through RQ  
✅ **Efficient**: Duplicate jobs are detected and avoided
