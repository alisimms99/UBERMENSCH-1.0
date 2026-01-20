import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../lib/api';

export default function Library() {
  const [categories, setCategories] = useState([]);
  const [recentSessions, setRecentSessions] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadLibraryData();
  }, []);

  const loadLibraryData = async () => {
    try {
      const [catRes, recentRes, favRes] = await Promise.all([
        apiService.request('/library/categories', { method: 'GET' }),
        apiService.request('/library/sessions/recent?limit=5&user_id=1', { method: 'GET' }),
        apiService.request('/library/favorites?user_id=1', { method: 'GET' })
      ]);
      setCategories(catRes);
      setRecentSessions(recentRes);
      setFavorites(favRes);
    } catch (error) {
      console.error('Failed to load library:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (e, favoriteId) => {
    e.stopPropagation(); // Prevent navigation to video
    try {
      await apiService.removeFavorite(favoriteId);
      setFavorites(prev => prev.filter(f => f.id !== favoriteId));
    } catch (error) {
      console.error('Failed to remove favorite:', error);
    }
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    try {
      const results = await apiService.request(`/library/search?q=${encodeURIComponent(query)}`, { method: 'GET' });
      setSearchResults(results.videos || []);
    } catch (error) {
      console.error('Failed to search videos:', error);
      setSearchResults([]);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSearching(false);
  };

  if (loading) {
    return <div className="p-8 text-center">Loading library...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          🎬 Video Library
        </h1>
        <div className="relative">
          <input
            type="text"
            placeholder="Search videos..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10 pr-10 py-2 border rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="absolute left-3 top-2.5">🔍</span>
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Search Results */}
      {searching && (
        <section className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">
              Search Results {searchResults.length > 0 && `(${searchResults.length})`}
            </h2>
            <button onClick={clearSearch} className="text-blue-600 hover:underline">
              Clear Search
            </button>
          </div>
          
          {searchResults.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No videos found for "{searchQuery}"
            </div>
          ) : (
            <div className="space-y-3">
              {searchResults.map((video, index) => (
                <div
                  key={index}
                  className="bg-white border rounded-lg p-4 flex gap-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate(`/library/play?path=${encodeURIComponent(video.path)}&name=${encodeURIComponent(video.name || video.filename)}&category=${encodeURIComponent(video.category)}`)}
                >
                  <div className="w-24 h-16 bg-gray-800 rounded flex-shrink-0 flex items-center justify-center text-white text-xl">
                    ▶
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{video.name || video.filename}</h3>
                    <p className="text-sm text-gray-500">{video.category}</p>
                    {video.subcategory && (
                      <p className="text-xs text-gray-400">{video.subcategory}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Hide other sections when searching */}
      {!searching && (
        <>
          {/* Recently Watched */}
          {recentSessions.length > 0 && (
            <section className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Recently Watched</h2>
                <button className="text-blue-600 hover:underline">See All →</button>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-2">
                {recentSessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex-shrink-0 w-48 cursor-pointer hover:opacity-80"
                    onClick={() => navigate(`/library/play?path=${encodeURIComponent(session.video_path)}`)}
                  >
                    <div className="bg-gray-800 h-28 rounded-lg flex items-center justify-center text-white text-4xl">
                      ▶
                    </div>
                    <p className="mt-2 text-sm font-medium truncate">{session.video_name}</p>
                    <p className="text-xs text-gray-500">{session.category}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Favorites */}
          {favorites.length > 0 && (
            <section className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">⭐ Favorites</h2>
                <button className="text-blue-600 hover:underline">See All →</button>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-2">
                {favorites.map((fav) => (
                  <div
                    key={fav.id}
                    className="flex-shrink-0 w-48 cursor-pointer hover:opacity-80 relative group"
                    onClick={() => navigate(`/library/play?path=${encodeURIComponent(fav.video_path)}&name=${encodeURIComponent(fav.video_name)}&category=${encodeURIComponent(fav.category)}`)}
                  >
                    <div className="bg-gray-800 h-28 rounded-lg flex items-center justify-center text-white text-4xl relative">
                      ▶
                      <button
                        onClick={(e) => removeFavorite(e, fav.id)}
                        className="absolute top-1 right-1 w-6 h-6 bg-black/50 hover:bg-red-600 rounded-full text-white text-sm opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove from favorites"
                      >
                        ✕
                      </button>
                    </div>
                    <p className="mt-2 text-sm font-medium truncate">{fav.video_name}</p>
                    <p className="text-xs text-gray-500">{fav.category}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Categories */}
          <section>
            <h2 className="text-xl font-semibold mb-4">Categories</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {categories.map((cat) => (
                <div
                  key={cat.name}
                  className="bg-white border rounded-xl p-6 cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => navigate(`/library/category/${encodeURIComponent(cat.name)}`)}
                >
                  <div className="text-4xl mb-2">{cat.icon}</div>
                  <h3 className="font-semibold">{cat.name}</h3>
                  <p className="text-sm text-gray-500">{cat.video_count} videos</p>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
