from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import UniqueConstraint
from datetime import datetime
import json

# This must be at the top level of the file
db = SQLAlchemy()

# Your model definitions follow...
class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    age = db.Column(db.Integer)
    weight = db.Column(db.Float)
    height = db.Column(db.Float)
    onboarding_completed = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    target_pushups = db.Column(db.Integer, default=50)
    target_situps = db.Column(db.Integer, default=50)
    target_daily_steps = db.Column(db.Integer, default=10000)
    current_pushup_target = db.Column(db.Integer, default=5)
    current_situp_target = db.Column(db.Integer, default=5)
    preferred_workout_duration = db.Column(db.Integer, default=30)
    workouts_per_week = db.Column(db.Integer, default=3)

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'age': self.age,
            'weight': self.weight,
            'height': self.height,
            'target_pushups': self.target_pushups,
            'target_situps': self.target_situps,
            'preferred_workout_duration': self.preferred_workout_duration,
            'workouts_per_week': self.workouts_per_week
        }

class WorkoutTemplate(db.Model):
    __tablename__ = 'workout_templates'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False)
    description = db.Column(db.Text)
    estimated_duration_min = db.Column(db.Integer)
    estimated_duration_max = db.Column(db.Integer)
    difficulty_level = db.Column(db.String(50))
    # Relationship to exercises through association table
    template_exercises = db.relationship('WorkoutTemplateExercise', backref='template', lazy=True, cascade="all, delete-orphan")

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'estimated_duration_min': self.estimated_duration_min,
            'estimated_duration_max': self.estimated_duration_max,
            'difficulty_level': self.difficulty_level,
            # Sort exercises by order
            'exercises': sorted([te.to_dict() for te in self.template_exercises], key=lambda x: x['sort_order'])
        }

class Exercise(db.Model):
    __tablename__ = 'exercises'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False, unique=True)
    category = db.Column(db.String(100))
    description = db.Column(db.Text)
    instructions = db.Column(db.Text)
    is_timed = db.Column(db.Boolean, default=False)
    is_reps = db.Column(db.Boolean, default=True)
    is_distance = db.Column(db.Boolean, default=False)
    default_reps = db.Column(db.Integer)
    default_duration_seconds = db.Column(db.Integer)
    default_rest_seconds = db.Column(db.Integer, default=60)
    
    # Video paths - relative path within VIDEO_ROOT_PATH
    video_path = db.Column(db.String(500), nullable=True)  # Single primary video path
    video_paths = db.Column(db.JSON, nullable=True)  # Array of paths for exercises with multiple videos
    
    # Relationships
    video_mappings = db.relationship('WorkoutVideoMapping', backref='exercise', lazy=True)
    template_associations = db.relationship('WorkoutTemplateExercise', backref='exercise', lazy=True, cascade="all, delete-orphan")

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'category': self.category,
            'description': self.description,
            'instructions': self.instructions,
            'is_timed': self.is_timed,
            'is_reps': self.is_reps,
            'is_distance': self.is_distance,
            'default_reps': self.default_reps,
            'default_duration_seconds': self.default_duration_seconds,
            'default_rest_seconds': self.default_rest_seconds,
            'video_path': self.video_path,
            'video_paths': self.video_paths if self.video_paths is not None else []
        }

class WorkoutTemplateExercise(db.Model):
    __tablename__ = 'workout_template_exercises'
    id = db.Column(db.Integer, primary_key=True)
    template_id = db.Column(db.Integer, db.ForeignKey('workout_templates.id'), nullable=False)
    exercise_id = db.Column(db.Integer, db.ForeignKey('exercises.id'), nullable=False)
    
    phase = db.Column(db.String(50)) # warmup, main, cooldown
    sort_order = db.Column(db.Integer, default=0)
    
    # Overrides (nullable - optional template-specific overrides)
    target_reps = db.Column(db.Integer, nullable=True)
    target_sets = db.Column(db.Integer, nullable=True)  # None for timed exercises, explicit value for rep-based
    target_duration_seconds = db.Column(db.Integer, nullable=True)
    rest_seconds = db.Column(db.Integer, nullable=True)
    
    def to_dict(self):
        # Merge exercise details with template overrides
        # Safety check: ensure exercise relationship exists before accessing
        if not self.exercise:
            # Exercise relationship is broken or exercise was deleted
            # Return minimal error response to avoid ambiguous state
            # Don't return target values as they're meaningless without exercise context
            return {
                'id': self.id,
                'exercise_id': self.exercise_id,
                'exercise': None,
                'phase': self.phase,
                'sort_order': self.sort_order,
                'target_reps': None,  # Don't expose orphaned values
                'target_sets': None,  # Don't expose orphaned values
                'target_duration_seconds': None,  # Don't expose orphaned values
                'rest_seconds': None,  # Don't expose orphaned values
                'error': 'Exercise not found - this association references a deleted exercise'  # Always present: None when no error, string when error exists
            }
        
        # Normal case: exercise exists, use defaults as fallback
        base_exercise = self.exercise.to_dict()
        # Use explicit None check to preserve valid zero values
        target_reps = self.target_reps if self.target_reps is not None else base_exercise.get('default_reps')
        target_duration_seconds = self.target_duration_seconds if self.target_duration_seconds is not None else base_exercise.get('default_duration_seconds')
        rest_seconds = self.rest_seconds if self.rest_seconds is not None else base_exercise.get('default_rest_seconds')
        
        # For timed exercises, target_sets is semantically invalid - return None instead of stored value
        is_timed = base_exercise.get('is_timed', False)
        target_sets = None if is_timed else self.target_sets
        
        return {
            'id': self.id,
            'exercise_id': self.exercise_id,
            'exercise': base_exercise,
            'phase': self.phase,
            'sort_order': self.sort_order,
            'target_reps': target_reps,
            'target_sets': target_sets,
            'target_duration_seconds': target_duration_seconds,
            'rest_seconds': rest_seconds,
            'error': None  # Always present: None when no error, string when error exists
        }

class VideoCategory(db.Model):
    __tablename__ = 'video_categories'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False, unique=True)
    display_name = db.Column(db.String(100))
    parent_id = db.Column(db.Integer, db.ForeignKey('video_categories.id'))
    videos = db.relationship('Video', backref='category', lazy=True)

class Video(db.Model):
    __tablename__ = 'videos'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200))
    file_path = db.Column(db.String(1000), nullable=False)
    filename = db.Column(db.String(500))
    category_id = db.Column(db.Integer, db.ForeignKey('video_categories.id'))
    exercise_mappings = db.relationship('WorkoutVideoMapping', backref='video', lazy=True)

class WorkoutVideoMapping(db.Model):
    __tablename__ = 'workout_video_mappings'
    id = db.Column(db.Integer, primary_key=True)
    exercise_id = db.Column(db.Integer, db.ForeignKey('exercises.id'), nullable=False)
    video_id = db.Column(db.Integer, db.ForeignKey('videos.id'), nullable=False)
    
    # Optional metadata fields
    mapping_type = db.Column(db.String(50), default='instruction')  # instruction, demonstration, variation, etc.
    is_primary = db.Column(db.Boolean, default=False)  # Primary video for this exercise
    sort_order = db.Column(db.Integer, default=0)  # Order for multiple videos per exercise
    start_time_seconds = db.Column(db.Integer, nullable=True)  # Start time for video segment
    end_time_seconds = db.Column(db.Integer, nullable=True)  # End time for video segment
    notes = db.Column(db.Text, nullable=True)  # Additional notes about this mapping
    
    def to_dict(self):
        """Convert mapping to dictionary, including related video info"""
        video_dict = None
        if self.video:
            video_dict = {
                'id': self.video.id,
                'title': self.video.title,
                'file_path': self.video.file_path,
                'filename': self.video.filename
            }
        
        return {
            'id': self.id,
            'exercise_id': self.exercise_id,
            'video_id': self.video_id,
            'video': video_dict,
            'mapping_type': self.mapping_type,
            'is_primary': self.is_primary,
            'sort_order': self.sort_order,
            'start_time_seconds': self.start_time_seconds,
            'end_time_seconds': self.end_time_seconds,
            'notes': self.notes
        }

class ProgressEntry(db.Model):
    __tablename__ = 'progress_entries'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    date = db.Column(db.Date, nullable=False)
    daily_steps = db.Column(db.Integer, default=0)

class Achievement(db.Model):
    __tablename__ = 'achievements'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)

class UserAchievement(db.Model):
    __tablename__ = 'user_achievements'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    achievement_id = db.Column(db.Integer, db.ForeignKey('achievements.id'))
    earned_at = db.Column(db.DateTime, default=datetime.utcnow)

# Add these classes to your existing models.py
class WorkoutSession(db.Model):
    __tablename__ = 'workout_sessions'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    workout_template_id = db.Column(db.Integer, db.ForeignKey('workout_templates.id'))
    date = db.Column(db.Date, nullable=False)
    status = db.Column(db.String(20), default='planned')
    start_time = db.Column(db.DateTime)
    end_time = db.Column(db.DateTime)
    duration_minutes = db.Column(db.Integer)
    notes = db.Column(db.Text)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'date': self.date.isoformat() if self.date else None,
            'status': self.status,
            'duration_minutes': self.duration_minutes
        }

class ExerciseCompletion(db.Model):
    __tablename__ = 'exercise_completions'
    id = db.Column(db.Integer, primary_key=True)
    workout_session_id = db.Column(db.Integer, db.ForeignKey('workout_sessions.id'))
    exercise_id = db.Column(db.Integer, db.ForeignKey('exercises.id'))
    order_in_workout = db.Column(db.Integer)
    completed_reps = db.Column(db.Integer)
    completed_duration = db.Column(db.Integer)  # in seconds
    completed_sets = db.Column(db.Integer, default=1)
    rest_duration = db.Column(db.Integer)  # in seconds
    notes = db.Column(db.Text)

    def to_dict(self):
        return {
            'id': self.id,
            'exercise_id': self.exercise_id,
            'completed_reps': self.completed_reps,
            'completed_duration': self.completed_duration
        }

class VideoPlaylist(db.Model):
    __tablename__ = 'video_playlists'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description
        }

class VideoPlaylistItem(db.Model):
    __tablename__ = 'video_playlist_items'
    id = db.Column(db.Integer, primary_key=True)
    playlist_id = db.Column(db.Integer, db.ForeignKey('video_playlists.id'))
    video_id = db.Column(db.Integer, db.ForeignKey('videos.id'))
    position = db.Column(db.Integer)
    added_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'video_id': self.video_id,
            'position': self.position
        }

# New Models for Sprint 1

class Supplement(db.Model):
    __tablename__ = 'supplements'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    name = db.Column(db.String(150), nullable=False)
    brand = db.Column(db.String(100))
    dosage = db.Column(db.String(50))
    form = db.Column(db.String(50))  # capsule, powder, liquid, etc
    category = db.Column(db.String(50)) # mineral, vitamin, etc
    
    # Schedule (stored as JSON string)
    # { "frequency": "daily", "times": ["morning", "evening"], "with_food": true }
    schedule_json = db.Column(db.Text)
    
    # Inventory (stored as JSON string)
    # { "quantity_remaining": 45, "unit": "capsules", "reorder_threshold": 14, "vendor": "Amazon", "vendor_url": "...", "price_per_unit": 0.35 }
    inventory_json = db.Column(db.Text)
    
    benefits = db.Column(db.Text)  # JSON list
    interactions = db.Column(db.Text)  # JSON list
    notes = db.Column(db.Text)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'brand': self.brand,
            'dosage': self.dosage,
            'form': self.form,
            'category': self.category,
            'schedule': json.loads(self.schedule_json) if self.schedule_json else {},
            'inventory': json.loads(self.inventory_json) if self.inventory_json else {},
            'benefits': json.loads(self.benefits) if self.benefits else [],
            'interactions': json.loads(self.interactions) if self.interactions else [],
            'notes': self.notes
        }

class SupplementLog(db.Model):
    __tablename__ = 'supplement_logs'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    supplement_id = db.Column(db.Integer, db.ForeignKey('supplements.id'))
    date = db.Column(db.Date, nullable=False)
    time_taken = db.Column(db.String(10)) # HH:MM
    taken = db.Column(db.Boolean, default=True)
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'supplement_id': self.supplement_id,
            'date': self.date.isoformat() if self.date else None,
            'time_taken': self.time_taken,
            'taken': self.taken,
            'notes': self.notes
        }

class DailyMetrics(db.Model):
    __tablename__ = 'daily_metrics'
    __table_args__ = (
        UniqueConstraint('user_id', 'date', name='uq_daily_metrics_user_date'),
    )
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    date = db.Column(db.Date, nullable=False)
    
    # Morning
    morning_wake_time = db.Column(db.String(10))
    morning_sleep_quality = db.Column(db.Integer) # 1-5
    morning_energy_level = db.Column(db.Integer) # 1-5
    morning_mood = db.Column(db.Integer) # 1-5
    morning_weight = db.Column(db.Float)
    morning_symptoms = db.Column(db.Text) # JSON list
    morning_notes = db.Column(db.Text)
    
    # Evening
    evening_energy_level = db.Column(db.Integer) # 1-5
    evening_mood = db.Column(db.Integer) # 1-5
    evening_libido = db.Column(db.Integer) # 1-5
    evening_stress_level = db.Column(db.Integer) # 1-5
    evening_cramping = db.Column(db.String(50)) # None/Mild/Moderate/Severe
    evening_symptoms = db.Column(db.Text) # JSON list
    evening_notes = db.Column(db.Text)
    
    # Throughout Day
    water_oz = db.Column(db.Integer)
    movement_minutes = db.Column(db.Integer)
    steps = db.Column(db.Integer)
    bowel_movements = db.Column(db.Integer)
    supplements_taken = db.Column(db.Boolean, default=False)

    def to_dict(self):
        return {
            'id': self.id,
            'date': self.date.isoformat() if self.date else None,
            'morning': {
                'wake_time': self.morning_wake_time,
                'sleep_quality': self.morning_sleep_quality,
                'energy_level': self.morning_energy_level,
                'mood': self.morning_mood,
                'weight': self.morning_weight,
                'symptoms': json.loads(self.morning_symptoms) if self.morning_symptoms else [],
                'notes': self.morning_notes
            },
            'evening': {
                'energy_level': self.evening_energy_level,
                'mood': self.evening_mood,
                'libido': self.evening_libido,
                'stress_level': self.evening_stress_level,
                'cramping': self.evening_cramping,
                'symptoms': json.loads(self.evening_symptoms) if self.evening_symptoms else [],
                'notes': self.evening_notes
            },
            'throughout_day': {
                'water_oz': self.water_oz,
                'movement_minutes': self.movement_minutes,
                'steps': self.steps,
                'bowel_movements': self.bowel_movements,
                'supplements_taken': self.supplements_taken
            }
        }

class DiaryEntry(db.Model):
    __tablename__ = 'diary_entries'
    __table_args__ = (
        UniqueConstraint('user_id', 'date', 'type', name='uq_diary_entry_user_date_type'),
    )
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    date = db.Column(db.Date, nullable=False)
    type = db.Column(db.String(20)) # morning or evening
    content_json = db.Column(db.Text) # Stores the structured content (gratitude, intentions, etc)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'date': self.date.isoformat() if self.date else None,
            'type': self.type,
            'content': json.loads(self.content_json) if self.content_json else {}
        }

class TranscodeJob(db.Model):
    """Track video transcoding jobs"""
    __tablename__ = 'transcode_jobs'
    id = db.Column(db.String(64), primary_key=True)  # SHA-256 hash (first 32 chars) of input file path
    input_path = db.Column(db.String(512), nullable=False)
    output_path = db.Column(db.String(512), nullable=False)
    status = db.Column(db.String(20), nullable=False, default='pending')  # pending, processing, complete, failed
    progress = db.Column(db.Integer, default=0)  # 0-100
    error_message = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    started_at = db.Column(db.DateTime)
    completed_at = db.Column(db.DateTime)
    
    def to_dict(self):
        return {
            'id': self.id,
            'input_path': self.input_path,
            'output_path': self.output_path,
            'status': self.status,
            'progress': self.progress,
            'error_message': self.error_message,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'started_at': self.started_at.isoformat() if self.started_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None
        }

class VideoSession(db.Model):
    """Track video workout sessions for metrics"""
    __tablename__ = 'video_sessions'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    video_path = db.Column(db.String(500), nullable=False)
    video_name = db.Column(db.String(200))
    category = db.Column(db.String(100))
    started_at = db.Column(db.DateTime, default=datetime.utcnow)
    ended_at = db.Column(db.DateTime, nullable=True)
    duration_seconds = db.Column(db.Integer, default=0)
    completed = db.Column(db.Boolean, default=False)
    notes = db.Column(db.Text, nullable=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'video_path': self.video_path,
            'video_name': self.video_name,
            'category': self.category,
            'started_at': self.started_at.isoformat() if self.started_at else None,
            'ended_at': self.ended_at.isoformat() if self.ended_at else None,
            'duration_seconds': self.duration_seconds,
            'completed': self.completed,
            'notes': self.notes
        }

class VideoFavorite(db.Model):
    """User's favorite videos for quick access"""
    __tablename__ = 'video_favorites'
    __table_args__ = (
        UniqueConstraint('user_id', 'video_path', name='uq_video_favorite_user_path'),
    )
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    video_path = db.Column(db.String(500), nullable=False)
    video_name = db.Column(db.String(200))
    category = db.Column(db.String(100))
    added_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'video_path': self.video_path,
            'video_name': self.video_name,
            'category': self.category,
            'added_at': self.added_at.isoformat() if self.added_at else None
        }

class TrainerSession(db.Model):
    """Track AI-generated workout sessions for memory and adaptation"""
    __tablename__ = 'trainer_sessions'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    generated_at = db.Column(db.DateTime, default=datetime.utcnow)
    workout_json = db.Column(db.Text, nullable=False)  # Store the full workout JSON
    time_requested = db.Column(db.Integer)  # Minutes requested
    energy_level = db.Column(db.Integer)  # 1-5
    focus = db.Column(db.String(50))  # cardio, strength, flexibility, recovery, etc.
    completed = db.Column(db.Boolean, default=False)
    feedback = db.Column(db.String(50))  # "too easy", "too hard", "just right"
    actual_duration = db.Column(db.Integer)  # Actual minutes taken
    notes = db.Column(db.Text)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'generated_at': self.generated_at.isoformat() if self.generated_at else None,
            'workout': json.loads(self.workout_json) if self.workout_json else None,
            'time_requested': self.time_requested,
            'energy_level': self.energy_level,
            'focus': self.focus,
            'completed': self.completed,
            'feedback': self.feedback,
            'actual_duration': self.actual_duration,
            'notes': self.notes
        }
