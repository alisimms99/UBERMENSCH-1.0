"""
Video Matcher Service
Matches exercise names to videos in the library using fuzzy matching
"""

import json
import os
from difflib import SequenceMatcher
import logging

logger = logging.getLogger(__name__)

class VideoMatcher:
    def __init__(self, video_index_path=None):
        """Initialize the video matcher with video index"""
        if video_index_path is None:
            # Default path relative to this file
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            video_index_path = os.path.join(base_dir, 'data', 'video_index.json')
        
        self.video_index_path = video_index_path
        self.videos = []
        self.load_video_index()
    
    def load_video_index(self):
        """Load the video index from JSON file"""
        try:
            with open(self.video_index_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                self.videos = data.get('videos', [])
            logger.info(f"Loaded {len(self.videos)} videos from index")
        except Exception as e:
            logger.error(f"Failed to load video index: {e}")
            self.videos = []
    
    def similarity_score(self, str1, str2):
        """Calculate similarity between two strings (0-1)"""
        return SequenceMatcher(None, str1.lower(), str2.lower()).ratio()
    
    def find_matching_videos(self, exercise_name, category_hint=None, max_results=3):
        """
        Find videos that match the exercise name
        
        Args:
            exercise_name: Name of the exercise to match
            category_hint: Optional category to filter by (e.g., "Boxing Training")
            max_results: Maximum number of results to return
        
        Returns:
            List of matching videos with scores
        """
        if not self.videos:
            logger.warning("No videos loaded in index")
            return []
        
        # Filter by category if provided
        candidate_videos = self.videos
        if category_hint:
            candidate_videos = [v for v in self.videos if v.get('category') == category_hint]
            logger.info(f"Filtered to {len(candidate_videos)} videos in category '{category_hint}'")
        
        # Calculate similarity scores
        matches = []
        for video in candidate_videos:
            # Check against filename, searchable text, and subcategory
            filename_score = self.similarity_score(exercise_name, video.get('filename', ''))
            searchable_score = self.similarity_score(exercise_name, video.get('searchable', ''))
            subcategory_score = self.similarity_score(exercise_name, video.get('subcategory', ''))
            
            # Use the best score
            best_score = max(filename_score, searchable_score, subcategory_score)
            
            # Boost score if exercise keywords are in video name
            exercise_keywords = exercise_name.lower().split()
            video_text = (video.get('filename', '') + ' ' + video.get('searchable', '')).lower()
            keyword_matches = sum(1 for kw in exercise_keywords if kw in video_text)
            keyword_boost = keyword_matches * 0.1
            
            final_score = min(best_score + keyword_boost, 1.0)
            
            if final_score > 0.3:  # Minimum threshold
                matches.append({
                    'video': video,
                    'score': final_score
                })
        
        # Sort by score and return top matches
        matches.sort(key=lambda x: x['score'], reverse=True)
        top_matches = matches[:max_results]
        
        logger.info(f"Found {len(top_matches)} matches for '{exercise_name}' (from {len(matches)} candidates)")
        
        return [
            {
                'id': m['video']['id'],
                'filename': m['video']['filename'],
                'path': m['video']['path'],
                'category': m['video']['category'],
                'subcategory': m['video'].get('subcategory'),
                'match_score': round(m['score'], 2)
            }
            for m in top_matches
        ]
    
    def enhance_workout_with_videos(self, workout_data):
        """
        Enhance a workout by adding video matches to each exercise
        
        Args:
            workout_data: Workout dict with warmup, main, cooldown sections
        
        Returns:
            Enhanced workout with videos array added to each exercise
        """
        enhanced = workout_data.copy()
        
        for section in ['warmup', 'main', 'cooldown']:
            if section not in enhanced:
                continue
            
            for exercise in enhanced[section]:
                exercise_name = exercise.get('name', '')
                category_hint = exercise.get('category_hint')
                
                # Find matching videos
                matches = self.find_matching_videos(
                    exercise_name,
                    category_hint=category_hint,
                    max_results=3
                )
                
                # Add videos to exercise
                exercise['videos'] = matches
                
                # Log the match
                if matches:
                    logger.info(f"Matched '{exercise_name}' to {len(matches)} videos (best: {matches[0]['filename']})")
                else:
                    logger.info(f"No video matches found for '{exercise_name}'")
        
        return enhanced

# Global instance
_matcher = None

def get_video_matcher():
    """Get or create the global video matcher instance"""
    global _matcher
    if _matcher is None:
        _matcher = VideoMatcher()
    return _matcher

def find_matching_videos(exercise_name, category_hint=None, max_results=3):
    """Convenience function to find matching videos"""
    matcher = get_video_matcher()
    return matcher.find_matching_videos(exercise_name, category_hint, max_results)

def enhance_workout_with_videos(workout_data):
    """Convenience function to enhance workout with videos"""
    matcher = get_video_matcher()
    return matcher.enhance_workout_with_videos(workout_data)
