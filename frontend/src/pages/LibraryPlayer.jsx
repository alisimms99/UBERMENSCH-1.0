import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import VideoPlayer from '../components/VideoPlayer';
import { apiService } from '../lib/api';

export default function LibraryPlayer() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const videoPath = searchParams.get('path');
  const videoName = searchParams.get('name') || 'Video';
  const category = searchParams.get('category') || '';
  const isWorkout = searchParams.get('workout') === 'true';
  
  const [session, setSession] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteId, setFavoriteId] = useState(null);
  const timerRef = useRef(null);

  const startTimer = useCallback(() => {
    setIsPlaying(true);
    timerRef.current = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);
  }, []);

  const startSession = useCallback(async () => {
    try {
      const res = await apiService.request('/library/sessions', {
        method: 'POST',
        body: {
          video_path: videoPath,
          video_name: videoName,
          category: category,
          user_id: 1
        }
      });
      setSession(res);
      startTimer();
    } catch (error) {
      console.error('Failed to start session:', error);
    }
  }, [videoPath, videoName, category, startTimer]);

  useEffect(() => {
    if (isWorkout) {
      startSession();
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isWorkout, startSession]);

  useEffect(() => {
    const checkFavoriteStatus = async () => {
      try {
        const favorites = await apiService.getFavorites();
        const match = favorites.find(f => f.video_path === videoPath);
        if (match) {
          setIsFavorited(true);
          setFavoriteId(match.id);
        }
      } catch (error) {
        console.error('Failed to check favorite status:', error);
      }
    };
    if (videoPath) {
      checkFavoriteStatus();
    }
  }, [videoPath]);

  const pauseTimer = () => {
    setIsPlaying(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const toggleFavorite = async () => {
    try {
      if (isFavorited) {
        await apiService.removeFavorite(favoriteId);
        setIsFavorited(false);
        setFavoriteId(null);
      } else {
        const result = await apiService.addFavorite(videoPath, videoName, category);
        setIsFavorited(true);
        setFavoriteId(result.id);
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  const completeSession = async () => {
    if (!session) return;
    
    try {
      await apiService.request(`/library/sessions/${session.id}/complete`, {
        method: 'POST',
        body: {
          duration_seconds: elapsedTime,
          notes: ''
        }
      });
      navigate('/library', { state: { message: 'Workout completed!' } });
    } catch (error) {
      console.error('Failed to complete session:', error);
    }
  };

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Prepare video object for VideoPlayer
  const video = {
    video_path: videoPath,
    title: videoName
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent p-4">
        <div className="flex justify-between items-center max-w-6xl mx-auto">
          <button
            onClick={() => navigate('/library')}
            className="text-white hover:text-gray-300 flex items-center gap-2"
          >
            ← Back
          </button>
          <div className="flex items-center gap-4">
            <button
              onClick={toggleFavorite}
              className={`text-white hover:text-yellow-400 ${isFavorited ? 'text-yellow-400' : ''}`}
            >
              {isFavorited ? '★' : '☆'} Favorite
            </button>
            <button className="text-white hover:text-blue-400 flex items-center gap-1">
              📺 Cast to TV
            </button>
          </div>
        </div>
      </div>

      {/* Video Player - Full Screen */}
      <div className="h-screen">
        <VideoPlayer
          video={video}
          autoPlay={true}
          showControls={true}
          className="h-full w-full"
        />
      </div>

      {/* Workout Overlay - Bottom */}
      {isWorkout && (
        <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-6">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div>
              <p className="text-white text-sm opacity-75">{category}</p>
              <h2 className="text-white text-xl font-semibold">{videoName}</h2>
            </div>
            
            <div className="flex items-center gap-6">
              {/* Timer */}
              <div className="text-center">
                <p className="text-white text-3xl font-mono">{formatTime(elapsedTime)}</p>
                <div className="flex gap-2 mt-2">
                  {isPlaying ? (
                    <button
                      onClick={pauseTimer}
                      className="px-3 py-1 bg-white/20 text-white rounded hover:bg-white/30"
                    >
                      Pause
                    </button>
                  ) : (
                    <button
                      onClick={startTimer}
                      className="px-3 py-1 bg-white/20 text-white rounded hover:bg-white/30"
                    >
                      Resume
                    </button>
                  )}
                </div>
              </div>

              {/* Complete Button */}
              <button
                onClick={completeSession}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
              >
                ✓ Complete Workout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

