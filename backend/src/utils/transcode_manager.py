"""
Background task manager for video transcoding jobs
Uses threading to process transcode jobs without blocking HTTP requests

Note: This implementation uses in-memory queues which work for single-process
deployments (e.g., Flask development server, single Gunicorn worker).
For multi-process production deployments, consider using a proper task queue
like Celery, Redis Queue, or similar distributed task systems.
"""
import threading
import logging
import hashlib
import time
from datetime import datetime
from flask import current_app

logger = logging.getLogger(__name__)

# Global job queue and worker thread
_job_queue = []
_queue_lock = threading.Lock()
_worker_thread = None
_worker_running = False
_shutdown_event = threading.Event()

def get_job_id(file_path):
    """Generate consistent job ID from file path using SHA-256"""
    return hashlib.sha256(file_path.encode()).hexdigest()[:32]  # Use first 32 chars for readability

def start_worker(app):
    """Start the background worker thread"""
    global _worker_thread, _worker_running, _shutdown_event
    
    if _worker_thread is not None and _worker_thread.is_alive():
        logger.info("Worker thread already running")
        return
    
    _shutdown_event.clear()
    _worker_running = True
    _worker_thread = threading.Thread(
        target=_worker_loop,
        args=(app,),
        daemon=True,
        name="TranscodeWorker"
    )
    _worker_thread.start()
    logger.info("Started transcode worker thread")

def stop_worker():
    """Stop the background worker thread gracefully"""
    global _worker_running, _shutdown_event
    
    logger.info("Stopping transcode worker thread...")
    _worker_running = False
    _shutdown_event.set()
    
    if _worker_thread is not None and _worker_thread.is_alive():
        _worker_thread.join(timeout=5.0)
        if _worker_thread.is_alive():
            logger.warning("Worker thread did not stop gracefully")
        else:
            logger.info("Worker thread stopped successfully")

def _worker_loop(app):
    """Main worker loop that processes transcode jobs"""
    from ..models import db, TranscodeJob
    from .video_transcoder import transcode_to_h264
    
    logger.info("Transcode worker loop started")
    
    while _worker_running:
        job_id = None
        
        # Get next job from queue
        with _queue_lock:
            if _job_queue:
                job_id = _job_queue.pop(0)
        
        if job_id is None:
            # No jobs, sleep briefly or wait for shutdown signal
            _shutdown_event.wait(timeout=1.0)
            continue
        
        # Process the job with app context
        with app.app_context():
            try:
                job = TranscodeJob.query.get(job_id)
                if not job:
                    logger.error(f"Job {job_id} not found in database")
                    continue
                
                if job.status != 'pending':
                    logger.warning(f"Job {job_id} already processed (status: {job.status})")
                    continue
                
                # Update status to processing
                job.status = 'processing'
                job.started_at = datetime.utcnow()
                job.progress = 0
                db.session.commit()
                
                logger.info(f"Starting transcode job {job_id}: {job.input_path}")
                
                # Perform transcoding
                success = transcode_to_h264(job.input_path, job.output_path)
                
                # Update job status
                if success:
                    job.status = 'complete'
                    job.progress = 100
                    logger.info(f"Transcode job {job_id} completed successfully")
                else:
                    job.status = 'failed'
                    job.error_message = 'Transcoding failed'
                    logger.error(f"Transcode job {job_id} failed")
                
                job.completed_at = datetime.utcnow()
                db.session.commit()
                
            except Exception as e:
                logger.error(f"Error processing job {job_id}: {str(e)}", exc_info=True)
                try:
                    job = TranscodeJob.query.get(job_id)
                    if job:
                        job.status = 'failed'
                        job.error_message = str(e)
                        job.completed_at = datetime.utcnow()
                        db.session.commit()
                except Exception as db_error:
                    logger.error(f"Failed to update job status: {str(db_error)}")

def enqueue_job(job_id):
    """Add a job to the processing queue"""
    # Using a set for O(1) duplicate checking alongside the list
    with _queue_lock:
        # Convert to set for faster lookup, then back to list
        queue_set = set(_job_queue)
        if job_id not in queue_set:
            _job_queue.append(job_id)
            logger.info(f"Enqueued job {job_id}, queue size: {len(_job_queue)}")
            return True
        else:
            logger.info(f"Job {job_id} already in queue")
            return False

def create_or_get_job(file_path, cache_path):
    """Create a new transcoding job or return existing one"""
    from ..models import db, TranscodeJob
    
    job_id = get_job_id(file_path)
    
    # Check if job already exists
    job = TranscodeJob.query.get(job_id)
    
    if job:
        # Job exists, check status
        if job.status == 'complete':
            return job, False  # Job already complete, no need to enqueue
        elif job.status == 'processing':
            return job, False  # Job already being processed
        elif job.status == 'failed':
            # Retry failed job
            job.status = 'pending'
            job.error_message = None
            job.started_at = None
            job.completed_at = None
            job.progress = 0
            db.session.commit()
            return job, True  # Need to enqueue
        else:  # pending
            return job, True  # Need to enqueue
    
    # Create new job
    job = TranscodeJob(
        id=job_id,
        input_path=file_path,
        output_path=cache_path,
        status='pending',
        progress=0
    )
    db.session.add(job)
    db.session.commit()
    
    return job, True  # Need to enqueue

def get_job_status(job_id):
    """Get the status of a transcoding job"""
    from ..models import TranscodeJob
    
    job = TranscodeJob.query.get(job_id)
    return job.to_dict() if job else None
