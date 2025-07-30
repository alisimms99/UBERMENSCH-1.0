from flask_sqlalchemy import SQLAlchemy
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
    phases = db.Column(db.Text)  # JSON string
    exercises = db.relationship('Exercise', backref='template', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'phases': json.loads(self.phases) if self.phases else None
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
    is_distance = db.Column(db.Boolean, default=False)  # Add this
    default_reps = db.Column(db.Integer)  # Add this
    default_duration_seconds = db.Column(db.Integer)  # THIS FIXES THE ERROR
    default_rest_seconds = db.Column(db.Integer, default=60)
    template_id = db.Column(db.Integer, db.ForeignKey('workout_templates.id'))
    video_mappings = db.relationship('WorkoutVideoMapping', backref='exercise', lazy=True)

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