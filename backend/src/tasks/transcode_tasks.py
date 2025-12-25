"""
Asynchronous video transcoding tasks using RQ (Redis Queue)
"""
import os
import logging
from rq import Queue
from redis import Redis
from ..utils.video_transcoder import transcode_to_h264

logger = logging.getLogger(__name__)

# Redis connection
# Use environment variables for Redis configuration
REDIS_HOST = os.environ.get('REDIS_HOST', 'localhost')
REDIS_PORT = int(os.environ.get('REDIS_PORT', 6379))
REDIS_DB = int(os.environ.get('REDIS_DB', 0))

def get_redis_connection():
    """Get Redis connection, fallback to None if Redis is not available"""
    try:
        redis_conn = Redis(host=REDIS_HOST, port=REDIS_PORT, db=REDIS_DB, 
                          socket_connect_timeout=1)
        # Test connection
        redis_conn.ping()
        return redis_conn
    except Exception as e:
        logger.warning(f"Redis not available: {e}. Async transcoding disabled.")
        return None

def get_transcode_queue():
    """Get RQ queue for transcoding tasks, returns None if Redis unavailable"""
    redis_conn = get_redis_connection()
    if redis_conn is None:
        return None
    return Queue('transcode', connection=redis_conn, default_timeout=3600)

def transcode_video_async(input_path, output_path):
    """
    Background task function for transcoding videos.
    This function will be executed by RQ worker.
    """
    logger.info(f"[Task] Starting transcoding: {input_path} -> {output_path}")
    try:
        success = transcode_to_h264(input_path, output_path)
        if success:
            logger.info(f"[Task] Transcoding completed: {output_path}")
        else:
            logger.error(f"[Task] Transcoding failed: {input_path}")
        return success
    except Exception as e:
        logger.error(f"[Task] Transcoding error: {str(e)}")
        raise

def enqueue_transcode_job(input_path, output_path):
    """
    Enqueue a transcoding job to RQ.
    Returns job object if successful, None if Redis is unavailable.
    """
    queue = get_transcode_queue()
    if queue is None:
        logger.warning("RQ not available, cannot enqueue transcoding job")
        return None
    
    try:
        # Check if a job for this file is already queued or running
        job_id = f"transcode:{input_path}"
        
        # Try to fetch existing job
        try:
            from rq.job import Job
            existing_job = Job.fetch(job_id, connection=queue.connection)
            if existing_job and existing_job.get_status() in ['queued', 'started']:
                logger.info(f"Transcoding job already exists: {job_id}")
                return existing_job
        except Exception:
            pass  # Job doesn't exist, create new one
        
        job = queue.enqueue(
            transcode_video_async,
            input_path,
            output_path,
            job_id=job_id,
            job_timeout=3600,  # 1 hour timeout
            result_ttl=86400,  # Keep result for 24 hours
            failure_ttl=3600   # Keep failure info for 1 hour
        )
        logger.info(f"Enqueued transcoding job: {job_id}")
        return job
    except Exception as e:
        logger.error(f"Failed to enqueue transcoding job: {str(e)}")
        return None

def get_job_status(input_path):
    """
    Get the status of a transcoding job.
    Returns dict with status info, or None if job doesn't exist or Redis unavailable.
    """
    queue = get_transcode_queue()
    if queue is None:
        return None
    
    try:
        from rq.job import Job
        job_id = f"transcode:{input_path}"
        job = Job.fetch(job_id, connection=queue.connection)
        
        return {
            'job_id': job.id,
            'status': job.get_status(),  # queued, started, finished, failed
            'created_at': job.created_at.isoformat() if job.created_at else None,
            'started_at': job.started_at.isoformat() if job.started_at else None,
            'ended_at': job.ended_at.isoformat() if job.ended_at else None,
            'result': job.result,
            'exc_info': job.exc_info
        }
    except Exception as e:
        logger.debug(f"Job not found or error: {str(e)}")
        return None
