import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiService } from '../lib/api';

export default function LibraryCategory() {
  const { categoryName } = useParams();
  const navigate = useNavigate();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadVideos = useCallback(async () => {
    try {
      const res = await apiService.request(`/library/category/${encodeURIComponent(categoryName)}`, { method: 'GET' });
      setVideos(res.videos || []);
    } catch (error) {
      console.error('Failed to load videos:', error);
    } finally {
      setLoading(false);
    }
  }, [categoryName]);

  useEffect(() => {
    loadVideos();
  }, [loadVideos]);

  const formatDuration = (seconds) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    return `${mins} min`;
  };

  if (loading) {
    return <div className="p-8 text-center">Loading videos...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <button
        onClick={() => navigate('/library')}
        className="text-blue-600 hover:underline mb-4 flex items-center gap-1"
      >
        ← Back to Library
      </button>
      
      <h1 className="text-2xl font-bold mb-6">{decodeURIComponent(categoryName)}</h1>
      <p className="text-gray-600 mb-6">{videos.length} videos</p>

      {/* Video List */}
      <div className="space-y-4">
        {videos.map((video, index) => (
          <div
            key={index}
            className="bg-white border rounded-lg p-4 flex gap-4 hover:shadow-md transition-shadow"
          >
            {/* Thumbnail placeholder */}
            <div className="w-32 h-20 bg-gray-800 rounded flex-shrink-0 flex items-center justify-center text-white text-2xl">
              ▶
            </div>
            
            {/* Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-medium truncate">{video.name || video.filename}</h3>
              <p className="text-sm text-gray-500">
                {formatDuration(video.duration)} 
                {video.codec && ` • ${video.codec}`}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate(`/library/play?path=${encodeURIComponent(video.path)}&name=${encodeURIComponent(video.name || video.filename)}&category=${encodeURIComponent(categoryName)}`)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                ▶ Play
              </button>
              <button
                onClick={() => navigate(`/library/play?path=${encodeURIComponent(video.path)}&name=${encodeURIComponent(video.name || video.filename)}&category=${encodeURIComponent(categoryName)}&workout=true`)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                📋 Start Workout
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

