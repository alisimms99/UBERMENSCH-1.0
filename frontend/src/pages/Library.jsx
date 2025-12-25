import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../lib/api';

export default function Library() {
  const [categories, setCategories] = useState([]);
  const [recentSessions, setRecentSessions] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
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
            className="pl-10 pr-4 py-2 border rounded-lg w-64"
            onClick={() => navigate('/library/search')}
            readOnly
          />
          <span className="absolute left-3 top-2.5">🔍</span>
        </div>
      </div>

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
                className="flex-shrink-0 w-48 cursor-pointer hover:opacity-80"
                onClick={() => navigate(`/library/play?path=${encodeURIComponent(fav.video_path)}`)}
              >
                <div className="bg-gray-800 h-28 rounded-lg flex items-center justify-center text-white text-4xl">
                  ▶
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
    </div>
  );
}

