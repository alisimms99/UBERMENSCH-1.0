import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, RotateCcw, Settings, ExternalLink } from 'lucide-react';

const VideoPlayer = ({ 
  video, 
  onVideoEnd, 
  onVideoProgress, 
  autoPlay = false, 
  showControls = true,
  className = "",
  exerciseContext = null,
  onExerciseComplete = null
}) => {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Video URL construction
  const videoUrl = video ? `http://localhost:5001/api/videos/stream/${video.id}` : null;

  useEffect(() => {
    if (autoPlay && videoRef.current) {
      handlePlay();
    }
  }, [autoPlay, video]);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const handleLoadedMetadata = () => {
      setDuration(videoElement.duration);
      setIsLoading(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(videoElement.currentTime);
      if (onVideoProgress) {
        onVideoProgress(videoElement.currentTime, videoElement.duration);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      if (onVideoEnd) {
        onVideoEnd();
      }
      if (onExerciseComplete && exerciseContext) {
        onExerciseComplete(exerciseContext);
      }
    };

    const handleError = (e) => {
      setError('Failed to load video');
      setIsLoading(false);
      console.error('Video error:', e);
    };

    const handleLoadStart = () => {
      setIsLoading(true);
      setError(null);
    };

    videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);
    videoElement.addEventListener('timeupdate', handleTimeUpdate);
    videoElement.addEventListener('ended', handleEnded);
    videoElement.addEventListener('error', handleError);
    videoElement.addEventListener('loadstart', handleLoadStart);

    return () => {
      videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
      videoElement.removeEventListener('timeupdate', handleTimeUpdate);
      videoElement.removeEventListener('ended', handleEnded);
      videoElement.removeEventListener('error', handleError);
      videoElement.removeEventListener('loadstart', handleLoadStart);
    };
  }, [video, onVideoEnd, onVideoProgress, onExerciseComplete, exerciseContext]);

  const handlePlay = async () => {
    if (videoRef.current) {
      try {
        await videoRef.current.play();
        setIsPlaying(true);
      } catch (error) {
        console.error('Error playing video:', error);
        setError('Failed to play video');
      }
    }
  };

  const handlePause = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleSeek = (e) => {
    if (videoRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const pos = (e.clientX - rect.left) / rect.width;
      videoRef.current.currentTime = pos * duration;
    }
  };

  const handleVolumeChange = (newVolume) => {
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setVolume(newVolume);
      setIsMuted(newVolume === 0);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      const newMuted = !isMuted;
      videoRef.current.muted = newMuted;
      setIsMuted(newMuted);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      videoRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleRestart = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      handlePlay();
    }
  };

  const handlePlaybackRateChange = (rate) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
      setPlaybackRate(rate);
      setShowSettings(false);
    }
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!video) {
    return (
      <div className={`bg-gray-900 rounded-lg flex items-center justify-center h-64 ${className}`}>
        <p className="text-gray-400">No video selected</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-gray-900 rounded-lg flex flex-col items-center justify-center h-64 ${className}`}>
        <p className="text-red-400 mb-2">⚠️ {error}</p>
        <p className="text-gray-400 text-sm">Check if video server is running</p>
      </div>
    );
  }

  return (
    <div className={`relative bg-black rounded-lg overflow-hidden ${className}`}>
      {/* Video Element */}
      <video
        ref={videoRef}
        src={videoUrl}
        className="w-full h-full object-contain"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        preload="metadata"
      />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
            <p>Loading video...</p>
          </div>
        </div>
      )}

      {/* Play Button Overlay */}
      {!isPlaying && !isLoading && !error && (
        <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
          <button
            onClick={handlePlay}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 transition-colors"
          >
            <Play className="w-8 h-8" />
          </button>
        </div>
      )}

      {/* Video Info Overlay */}
      {video && (
        <div className="absolute top-4 left-4 right-4">
          <div className="bg-black bg-opacity-70 rounded-lg p-3 text-white">
            <h3 className="font-semibold text-lg">{video.title}</h3>
            {video.instructor && (
              <p className="text-sm text-gray-300">Instructor: {video.instructor}</p>
            )}
            {video.duration_formatted && (
              <p className="text-sm text-gray-300">Duration: {video.duration_formatted}</p>
            )}
            {exerciseContext && (
              <div className="mt-2 text-sm">
                <span className="bg-blue-600 px-2 py-1 rounded text-xs">
                  Exercise: {exerciseContext.name}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Controls */}
      {showControls && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
          {/* Progress Bar */}
          <div className="mb-4">
            <div 
              className="w-full h-2 bg-gray-600 rounded-full cursor-pointer"
              onClick={handleSeek}
            >
              <div 
                className="h-full bg-blue-600 rounded-full"
                style={{ width: `${(currentTime / duration) * 100}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-300 mt-1">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {/* Play/Pause */}
              <button
                onClick={isPlaying ? handlePause : handlePlay}
                className="text-white hover:text-blue-400 transition-colors"
              >
                {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
              </button>

              {/* Restart */}
              <button
                onClick={handleRestart}
                className="text-white hover:text-blue-400 transition-colors"
                title="Restart video"
              >
                <RotateCcw className="w-5 h-5" />
              </button>

              {/* Volume */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={toggleMute}
                  className="text-white hover:text-blue-400 transition-colors"
                >
                  {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  className="w-16 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Playback Rate */}
              <div className="relative">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="text-white hover:text-blue-400 transition-colors"
                  title="Playback settings"
                >
                  <Settings className="w-5 h-5" />
                </button>
                {showSettings && (
                  <div className="absolute bottom-8 left-0 bg-black bg-opacity-90 rounded-lg p-2 min-w-32">
                    <p className="text-white text-xs mb-2">Playback Speed</p>
                    {[0.5, 0.75, 1, 1.25, 1.5, 2].map(rate => (
                      <button
                        key={rate}
                        onClick={() => handlePlaybackRateChange(rate)}
                        className={`block w-full text-left px-2 py-1 text-sm rounded ${
                          playbackRate === rate 
                            ? 'bg-blue-600 text-white' 
                            : 'text-gray-300 hover:bg-gray-700'
                        }`}
                      >
                        {rate}x
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {/* External Link */}
              {video.streaming_url && (
                <a
                  href={video.streaming_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white hover:text-blue-400 transition-colors"
                  title="Open in new tab"
                >
                  <ExternalLink className="w-5 h-5" />
                </a>
              )}

              {/* Fullscreen */}
              <button
                onClick={toggleFullscreen}
                className="text-white hover:text-blue-400 transition-colors"
                title="Fullscreen"
              >
                <Maximize className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exercise Completion Overlay */}
      {exerciseContext && onExerciseComplete && (
        <div className="absolute top-4 right-4">
          <button
            onClick={() => onExerciseComplete(exerciseContext)}
            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg text-sm transition-colors"
          >
            ✓ Mark Complete
          </button>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;

