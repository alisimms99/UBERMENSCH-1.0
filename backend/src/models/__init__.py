# This makes the db instance available when importing from src.models
from .models import (
    db, User, WorkoutTemplate, Exercise,
    VideoCategory, Video, WorkoutVideoMapping,
    ProgressEntry, Achievement, UserAchievement,
    WorkoutSession, ExerciseCompletion,
    VideoPlaylist, VideoPlaylistItem
)

__all__ = [
    'db', 'User', 'WorkoutTemplate', 'Exercise',
    'VideoCategory', 'Video', 'WorkoutVideoMapping',
    'ProgressEntry', 'Achievement', 'UserAchievement',
    'WorkoutSession', 'ExerciseCompletion',
    'VideoPlaylist', 'VideoPlaylistItem'
]
