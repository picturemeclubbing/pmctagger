/**
 * File: /src/pages/HomePage.jsx
 * Purpose: Main landing page with quick actions and recent sessions (Phase 5.2b)
 * Connects To: AppVersion.jsx, GalleryPage.jsx, UploadPage.jsx
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useDebug from '../debug/useDebug';
import { listSessions } from '../services/SessionStore';
import { getDatabaseStats } from '../services/database';
import { resolvePreview } from '../utils/resolvePreview';
import AppVersion from '../components/AppVersion';

function HomePage() {
  const navigate = useNavigate();
  const debug = useDebug('HOME');

  const [recentSessions, setRecentSessions] = useState([]);
  const [stats, setStats] = useState({ sessions: 0, customers: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    debug.time('load_homepage');
    try {
      // Load recent sessions (last 6)
      const sessions = await listSessions();
      setRecentSessions(sessions.slice(0, 6));

      // Load database stats
      const dbStats = await getDatabaseStats();
      setStats(dbStats);

      debug.timeEnd('load_homepage', {
        sessionCount: sessions.length,
        stats: dbStats
      });
      setIsLoading(false);
    } catch (error) {
      debug.error('load_failed', { error: error.message });
      setIsLoading(false);
    }
  };

  const handleGoToUpload = () => {
    debug.log('navigation', { to: '/upload' });
    navigate('/upload');
  };

  const handleOpenSession = (sessionId) => {
    debug.log('open_session', { sessionId });
    navigate(`/session/${sessionId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                📸 PictureMeClubbing
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Social Tagging • Tag. Share. Deliver.
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                to="/gallery"
                className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium"
              >
                Gallery
              </Link>
              <Link
                to="/debug"
                className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium"
              >
                Debug
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
        {/* Quick Actions */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Upload Button */}
            <button
              onClick={handleGoToUpload}
              className="
                p-6 bg-gradient-to-br from-blue-500 to-blue-600
                text-white rounded-xl shadow-md hover:shadow-xl
                transition-all duration-200 hover:scale-105
                text-left
              "
            >
              <div className="text-4xl mb-3">📤</div>
              <h3 className="text-xl font-bold mb-2">Upload Photo</h3>
              <p className="text-blue-100 text-sm">
                Start a new tagging session
              </p>
            </button>

            {/* Gallery Button */}
            <Link
              to="/gallery"
              className="
                p-6 bg-gradient-to-br from-purple-500 to-purple-600
                text-white rounded-xl shadow-xl hover:shadow-xl
                transition-all duration-200 hover:scale-105
                text-left
              "
            >
              <div className="text-4xl mb-3">🖼️</div>
              <h3 className="text-xl font-bold mb-2">Browse Gallery</h3>
              <p className="text-purple-100 text-sm">
                View all photo sessions
              </p>
            </Link>

            {/* Debug Console Button */}
            <Link
              to="/debug"
              className="
                p-6 bg-gradient-to-br from-gray-700 to-gray-800
                text-white rounded-xl shadow-md hover:shadow-xl
                transition-all duration-200 hover:scale-105
                text-left
              "
            >
              <div className="text-4xl mb-3">🐛</div>
              <h3 className="text-xl font-bold mb-2">Debug Console</h3>
              <p className="text-gray-300 text-sm">
                View system logs & diagnostics
              </p>
            </Link>
          </div>
        </section>

        {/* System Stats */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">System Status</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <div className="text-3xl font-bold text-blue-600">{stats.sessions}</div>
              <div className="text-sm text-gray-600 mt-1">Photo Sessions</div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <div className="text-3xl font-bold text-green-600">{stats.customers}</div>
              <div className="text-sm text-gray-600 mt-1">CRM Customers</div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <div className="text-3xl font-bold text-purple-600">
                {recentSessions.filter(s => s.hasTags).length}
              </div>
              <div className="text-sm text-gray-600 mt-1">Tagged Photos</div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <div className="text-3xl font-bold text-orange-600">v{stats.version}</div>
              <div className="text-sm text-gray-600 mt-1">DB Schema</div>
            </div>
          </div>
        </section>

        {/* Recent Sessions */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Recent Sessions</h2>
            <Link
              to="/gallery"
              className="text-blue-600 hover:text-blue-700 font-medium text-sm"
            >
              View All →
            </Link>
          </div>

          {isLoading ? (
            <div className="text-center py-12 text-gray-500">
              Loading recent sessions...
            </div>
          ) : recentSessions.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
              <div className="text-6xl mb-4">📭</div>
              <p className="text-gray-600 mb-4">No sessions yet</p>
              <button
                onClick={handleGoToUpload}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
              >
                Upload Your First Photo
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {recentSessions.map(session => {
                console.info('[HOMEPAGE] preview_source', {
                  sessionId: session.sessionId,
                  hasThumbDataUrl: !!session.thumbDataUrl,
                  hasThumbnailPath: !!session.thumbnailPath,
                  hasImageUrl: !!session.imageUrl,
                  hasFileBlob: !!session.fileBlob,
                });

                return (
                  <button
                    key={session.sessionId}
                    onClick={() => handleOpenSession(session.sessionId)}
                    className="
                      relative aspect-square bg-white rounded-lg
                      border border-gray-200 shadow-sm
                      hover:shadow-md transition-all overflow-hidden
                      group
                    "
                  >
                    <img
                      src={resolvePreview(session)}
                      alt={session.imageName || 'Session Preview'}
                      className="object-cover w-full h-full rounded-lg"
                      loading="lazy"
                    />

                  {/* Status Badge */}
                  {session.hasTags && (
                    <div className="absolute top-2 right-2 px-2 py-1 bg-green-500 text-white text-xs font-bold rounded-full">
                      ✓ Tagged
                    </div>
                  )}

                  {/* Hover Overlay */}
                  <div className="
                    absolute inset-0 bg-black/60
                    opacity-0 group-hover:opacity-100
                    transition-opacity duration-200
                    flex items-center justify-center
                  ">
                    <span className="text-white font-medium text-sm">
                      View Session
                    </span>
                  </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* Phase 5.2b: App Version Footer */}
      <AppVersion />
    </div>
  );
}

export default HomePage;
