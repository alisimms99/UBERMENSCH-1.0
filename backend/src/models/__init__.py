# This makes the db instance available when importing from src.models
from .models import (
    db, User, WorkoutTemplate, Exercise, WorkoutTemplateExercise,
    VideoCategory, Video, WorkoutVideoMapping,
    ProgressEntry, Achievement, UserAchievement,
    WorkoutSession, ExerciseCompletion,
    VideoPlaylist, VideoPlaylistItem,
    Supplement, SupplementLog, DailyMetrics, DiaryEntry, TranscodeJob
)

__all__ = [
    'db', 'User', 'WorkoutTemplate', 'Exercise', 'WorkoutTemplateExercise',
    'VideoCategory', 'Video', 'WorkoutVideoMapping',
    'ProgressEntry', 'Achievement', 'UserAchievement',
    'WorkoutSession', 'ExerciseCompletion',
    'VideoPlaylist', 'VideoPlaylistItem',
    'Supplement', 'SupplementLog', 'DailyMetrics', 'DiaryEntry', 'TranscodeJob'
]
