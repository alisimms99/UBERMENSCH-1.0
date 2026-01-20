import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiService } from '../lib/api';

export default function LibraryCategory() {
  const { categoryName } = useParams();
  const navigate = useNavigate();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState(new Map()); // video_path -> favorite_id

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

  useEffect(() => {
    const loadFavorites = async () => {
      try {
        const favs = await apiService.getFavorites();
        const favMap = new Map(favs.map(f => [f.video_path, f.id]));
        setFavorites(favMap);
      } catch (error) {
        console.error('Failed to load favorites:', error);
      }
    };
    loadFavorites();
  }, []);

  const toggleFavorite = async (video) => {
    const videoPath = video.path;
    const videoName = video.name || video.filename;

    try {
      if (favorites.has(videoPath)) {
        await apiService.removeFavorite(favorites.get(videoPath));
        setFavorites(prev => {
          const next = new Map(prev);
          next.delete(videoPath);
          return next;
        });
      } else {
        const result = await apiService.addFavorite(videoPath, videoName, categoryName);
        setFavorites(prev => new Map(prev).set(videoPath, result.id));
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    return `${mins} min`;
  };

  // Group videos by subcategory
  const groupedVideos = videos.reduce((acc, video) => {
    const subcategory = video.subcategory || 'Other';
    if (!acc[subcategory]) {
      acc[subcategory] = [];
    }
    acc[subcategory].push(video);
    return acc;
  }, {});

  // Sort subcategories alphabetically
  const sortedSubcategories = Object.keys(groupedVideos).sort();

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

      {/* Video List with Subcategory Headers */}
      <div className="space-y-6">
        {sortedSubcategories.map((subcategory) => (
          <div key={subcategory}>
            {/* Subcategory Header */}
            <div className="mb-3 pb-2 border-b-2 border-gray-200">
              <h2 className="text-lg font-semibold text-gray-700">{subcategory}</h2>
              <p className="text-sm text-gray-500">{groupedVideos[subcategory].length} videos</p>
            </div>

            {/* Videos in this subcategory */}
            <div className="space-y-4">
              {groupedVideos[subcategory].map((video, index) => (
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
                      onClick={() => toggleFavorite(video)}
                      className={`p-2 rounded-lg hover:bg-gray-100 text-xl ${favorites.has(video.path) ? 'text-yellow-500' : 'text-gray-400'}`}
                      title={favorites.has(video.path) ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      {favorites.has(video.path) ? '★' : '☆'}
                    </button>
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
        ))}
      </div>
    </div>
  );
}
