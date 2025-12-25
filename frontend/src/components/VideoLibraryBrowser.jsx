import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, Grid, List, Play, Heart, Plus, Folder, 
  Video, Clock, User, Star, Download, Settings, ChevronRight,
  ChevronDown, Eye, BookOpen, Target
} from 'lucide-react';
import VideoPlayer from './VideoPlayer';

const VideoLibraryBrowser = ({ onVideoSelect, onAddToWorkout }) => {
  const [categories, setCategories] = useState([]);
  const [videos, setVideos] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [favorites, setFavorites] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedCategories, setExpandedCategories] = useState(new Set());
  const [filters, setFilters] = useState({
    difficulty: '',
    instructor: '',
    duration: '',
    category: ''
  });
  const [sortBy, setSortBy] = useState('title'); // 'title', 'duration', 'views', 'date'
  const [videoServerStatus, setVideoServerStatus] = useState(null);

  useEffect(() => {
    loadVideoLibrary();
    checkVideoServerStatus();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      loadCategoryVideos(selectedCategory.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, searchQuery, filters, sortBy]);

  const checkVideoServerStatus = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/videos/health');
      const data = await response.json();
      setVideoServerStatus(data);
    } catch (error) {
      console.error('Error checking video server status:', error);
      setVideoServerStatus({ status: 'offline' });
    }
  };

  const loadVideoLibrary = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5001/api/videos/categories');
      
      if (!response.ok) {
        throw new Error('Failed to load video categories');
      }
      
      const data = await response.json();
      setCategories(data.categories || []);
      
      // Auto-select first category
      if (data.categories && data.categories.length > 0) {
        setSelectedCategory(data.categories[0]);
        setExpandedCategories(new Set([data.categories[0].id]));
      }
    } catch (error) {
      console.error('Error loading video library:', error);
      setError('Failed to load video library. Please check if the video server is running.');
    } finally {
      setLoading(false);
    }
  };

  const loadCategoryVideos = async (categoryId) => {
    try {
      const params = new URLSearchParams({
        search: searchQuery,
        difficulty: filters.difficulty,
        instructor: filters.instructor,
        sort: sortBy
      });

      const response = await fetch(
        `http://localhost:5001/api/videos/categories/${categoryId}/videos?${params}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to load videos');
      }
      
      const data = await response.json();
      setVideos(data.videos || []);
    } catch (error) {
      console.error('Error loading category videos:', error);
      setVideos([]);
    }
  };

  const searchVideos = async (query) => {
    try {
      const params = new URLSearchParams({
        q: query,
        category_id: selectedCategory?.id || '',
        difficulty: filters.difficulty,
        instructor: filters.instructor,
        sort: sortBy
      });

      const response = await fetch(
        `http://localhost:5001/api/videos/search?${params}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to search videos');
      }
      
      const data = await response.json();
      setVideos(data.videos || []);
    } catch (error) {
      console.error('Error searching videos:', error);
      setVideos([]);
    }
  };

  const toggleFavorite = async (videoId) => {
    try {
      const response = await fetch(
        `http://localhost:5001/api/videos/${videoId}/favorite`,
        { method: 'POST' }
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.is_favorite) {
          setFavorites(prev => new Set([...prev, videoId]));
        } else {
          setFavorites(prev => {
            const newSet = new Set(prev);
            newSet.delete(videoId);
            return newSet;
          });
        }
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const toggleCategoryExpansion = (categoryId) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const handleVideoSelect = (video) => {
    setSelectedVideo(video);
    if (onVideoSelect) {
      onVideoSelect(video);
    }
  };

  const handlePlayVideo = (video) => {
    setSelectedVideo(video);
    setShowVideoPlayer(true);
  };

  const formatDuration = (seconds) => {
    if (!seconds) return 'Unknown';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'beginner': return 'text-green-600 bg-green-100';
      case 'intermediate': return 'text-yellow-600 bg-yellow-100';
      case 'advanced': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const renderCategoryTree = (categories, level = 0) => {
    return categories.map(category => (
      <div key={category.id} className={`${level > 0 ? 'ml-4' : ''}`}>
        <div
          className={`flex items-center p-2 rounded-lg cursor-pointer transition-colors ${
            selectedCategory?.id === category.id
              ? 'bg-blue-100 text-blue-800'
              : 'hover:bg-gray-100'
          }`}
          onClick={() => setSelectedCategory(category)}
        >
          {category.children && category.children.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleCategoryExpansion(category.id);
              }}
              className="mr-1"
            >
              {expandedCategories.has(category.id) ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          )}
          <Folder className="w-4 h-4 mr-2 text-gray-500" />
          <span className="text-sm font-medium">{category.display_name}</span>
          <span className="ml-auto text-xs text-gray-500">
            {category.video_count}
          </span>
        </div>
        
        {category.children && 
         category.children.length > 0 && 
         expandedCategories.has(category.id) && (
          <div className="mt-1">
            {renderCategoryTree(category.children, level + 1)}
          </div>
        )}
      </div>
    ));
  };

  const renderVideoGrid = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {videos.map(video => (
        <div
          key={video.id}
          className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
        >
          {/* Video Thumbnail */}
          <div className="relative h-32 bg-gray-800 flex items-center justify-center">
            <Video className="w-8 h-8 text-gray-400" />
            <button
              onClick={() => handlePlayVideo(video)}
              className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
            >
              <Play className="w-8 h-8 text-white" />
            </button>
            
            {/* Duration Badge */}
            {video.duration_formatted && (
              <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                {video.duration_formatted}
              </div>
            )}
            
            {/* Favorite Button */}
            <button
              onClick={() => toggleFavorite(video.id)}
              className="absolute top-2 right-2 p-1 rounded-full bg-black bg-opacity-50 hover:bg-opacity-70 transition-colors"
            >
              <Heart 
                className={`w-4 h-4 ${
                  favorites.has(video.id) ? 'text-red-500 fill-current' : 'text-white'
                }`} 
              />
            </button>
          </div>

          {/* Video Info */}
          <div className="p-3">
            <h3 className="font-medium text-gray-800 text-sm mb-1 line-clamp-2">
              {video.title}
            </h3>
            
            {video.instructor && (
              <p className="text-xs text-gray-600 mb-2 flex items-center">
                <User className="w-3 h-3 mr-1" />
                {video.instructor}
              </p>
            )}

            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center">
                <Eye className="w-3 h-3 mr-1" />
                {video.view_count || 0} views
              </div>
              
              {video.difficulty_level && (
                <span className={`px-2 py-1 rounded-full text-xs ${getDifficultyColor(video.difficulty_level)}`}>
                  {video.difficulty_level}
                </span>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-2 mt-3">
              <button
                onClick={() => handleVideoSelect(video)}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs py-1 px-2 rounded transition-colors"
              >
                Select
              </button>
              {onAddToWorkout && (
                <button
                  onClick={() => onAddToWorkout(video)}
                  className="bg-green-600 hover:bg-green-700 text-white text-xs py-1 px-2 rounded transition-colors"
                >
                  <Plus className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderVideoList = () => (
    <div className="space-y-2">
      {videos.map(video => (
        <div
          key={video.id}
          className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center space-x-4">
            {/* Thumbnail */}
            <div className="w-16 h-12 bg-gray-800 rounded flex items-center justify-center flex-shrink-0">
              <Video className="w-4 h-4 text-gray-400" />
            </div>

            {/* Video Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-gray-800 truncate">{video.title}</h3>
              <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                {video.instructor && (
                  <span className="flex items-center">
                    <User className="w-3 h-3 mr-1" />
                    {video.instructor}
                  </span>
                )}
                {video.duration_formatted && (
                  <span className="flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    {video.duration_formatted}
                  </span>
                )}
                <span className="flex items-center">
                  <Eye className="w-3 h-3 mr-1" />
                  {video.view_count || 0} views
                </span>
              </div>
            </div>

            {/* Difficulty Badge */}
            {video.difficulty_level && (
              <span className={`px-2 py-1 rounded-full text-xs ${getDifficultyColor(video.difficulty_level)}`}>
                {video.difficulty_level}
              </span>
            )}

            {/* Action Buttons */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => toggleFavorite(video.id)}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <Heart 
                  className={`w-4 h-4 ${
                    favorites.has(video.id) ? 'text-red-500 fill-current' : 'text-gray-400'
                  }`} 
                />
              </button>
              
              <button
                onClick={() => handlePlayVideo(video)}
                className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-colors"
              >
                <Play className="w-4 h-4" />
              </button>
              
              <button
                onClick={() => handleVideoSelect(video)}
                className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-lg text-sm transition-colors"
              >
                Select
              </button>
              
              {onAddToWorkout && (
                <button
                  onClick={() => onAddToWorkout(video)}
                  className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading video library...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <Video className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Video Library Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadVideoLibrary}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center">
              <Video className="w-6 h-6 mr-2" />
              Video Library
            </h1>
            <p className="text-gray-600">
              Browse your comprehensive fitness video collection
            </p>
          </div>
          
          {/* Server Status */}
          <div className="text-right">
            <div className="text-sm text-gray-500">Server Status</div>
            <div className={`text-sm font-medium ${
              videoServerStatus?.status === 'healthy' ? 'text-green-600' : 'text-red-600'
            }`}>
              {videoServerStatus?.status === 'healthy' ? '🟢 Online' : '🔴 Offline'}
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search videos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Filters */}
          <div className="flex space-x-2">
            <select
              value={filters.difficulty}
              onChange={(e) => setFilters(prev => ({ ...prev, difficulty: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Levels</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="title">Sort by Title</option>
              <option value="duration">Sort by Duration</option>
              <option value="views">Sort by Views</option>
              <option value="date">Sort by Date</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Category Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-lg p-4">
            <h2 className="font-semibold text-gray-800 mb-4 flex items-center">
              <Folder className="w-4 h-4 mr-2" />
              Categories
            </h2>
            <div className="space-y-1 max-h-96 overflow-y-auto">
              {renderCategoryTree(categories)}
            </div>
          </div>
        </div>

        {/* Video Content */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold text-gray-800">
                {selectedCategory ? selectedCategory.display_name : 'All Videos'}
                <span className="text-sm text-gray-500 ml-2">
                  ({videos.length} videos)
                </span>
              </h2>
            </div>

            {videos.length === 0 ? (
              <div className="text-center py-12">
                <Video className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No videos found</p>
                {searchQuery && (
                  <p className="text-sm text-gray-500 mt-2">
                    Try adjusting your search or filters
                  </p>
                )}
              </div>
            ) : (
              viewMode === 'grid' ? renderVideoGrid() : renderVideoList()
            )}
          </div>
        </div>
      </div>

      {/* Video Player Modal */}
      {showVideoPlayer && selectedVideo && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-full overflow-auto">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold">{selectedVideo.title}</h3>
              <button
                onClick={() => setShowVideoPlayer(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="p-4">
              <VideoPlayer
                video={selectedVideo}
                className="h-96 mb-4"
                showControls={true}
                autoPlay={true}
              />
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Instructor:</strong> {selectedVideo.instructor || 'Unknown'}
                </div>
                <div>
                  <strong>Duration:</strong> {selectedVideo.duration_formatted || 'Unknown'}
                </div>
                <div>
                  <strong>Difficulty:</strong> {selectedVideo.difficulty_level || 'Not specified'}
                </div>
                <div>
                  <strong>Views:</strong> {selectedVideo.view_count || 0}
                </div>
              </div>
              {selectedVideo.description && (
                <div className="mt-4">
                  <strong>Description:</strong>
                  <p className="text-gray-600 mt-1">{selectedVideo.description}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoLibraryBrowser;

