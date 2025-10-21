/**
 * File: /src/pages/GalleryPage.jsx
 * Purpose: Browse, filter, and manage all photo sessions (Phase 5.3a MVP)
 * Connects To: SessionStore, SessionCard, FilterBar, DebugContext
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useDebug from '../debug/useDebug';
import { listSessions, deleteSession } from '../services/SessionStore';
import FilterBar from '../components/gallery/FilterBar';
import SessionCard from '../components/gallery/SessionCard';

function GalleryPage() {
  const navigate = useNavigate();
  const debug = useDebug('GALLERY');

  const [sessions, setSessions] = useState([]);
  const [filteredSessions, setFilteredSessions] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all' | 'tagged' | 'untagged'
  const [searchText, setSearchText] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Load sessions on mount
  useEffect(() => {
    loadSessions();
  }, []);

  // Apply filters whenever sessions, filter, or search text changes
  useEffect(() => {
    applyFilters();
  }, [sessions, filter, searchText]);

  const loadSessions = async () => {
    debug.time('gallery_load');
    setIsLoading(true);

    try {
      const allSessions = await listSessions();
      setSessions(allSessions);

      debug.timeEnd('gallery_load', {
        count: allSessions.length,
        tagged: allSessions.filter(s => s.hasTags).length
      });
      debug.info('sessions_loaded', {
        total: allSessions.length
      });
    } catch (error) {
      debug.error('load_failed', { error: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    debug.time('apply_filters');

    let filtered = [...sessions];

    // Filter by tag status
    if (filter === 'tagged') {
      filtered = filtered.filter(s => s.hasTags === true);
    } else if (filter === 'untagged') {
      filtered = filtered.filter(s => s.hasTags === false);
    }

    // Filter by search text
    if (searchText.trim()) {
      const search = searchText.toLowerCase();
      filtered = filtered.filter(s =>
        s.imageName?.toLowerCase().includes(search) ||
        s.sessionId?.toLowerCase().includes(search)
      );
    }

    setFilteredSessions(filtered);

    debug.timeEnd('apply_filters', {
      before: sessions.length,
      after: filtered.length,
      filter,
      searchText
    });
  };

  const handleFilterChange = (newFilter) => {
    debug.log('filter_change', { from: filter, to: newFilter });
    setFilter(newFilter);
  };

  const handleSearchChange = (text) => {
    setSearchText(text);
    debug.log('search_change', { text, length: text.length });
  };



  const handleDeleteSession = async (sessionId) => {
    // Confirm deletion
    if (!window.confirm('Delete this session? This cannot be undone.')) {
      debug.log('delete_cancelled', { sessionId });
      return;
    }

    debug.time('delete_session');

    try {
      await deleteSession(sessionId);

      // Remove from state
      setSessions(prev => prev.filter(s => s.sessionId !== sessionId));

      debug.timeEnd('delete_session', { sessionId });
      debug.info('session_deleted', { sessionId });
    } catch (error) {
      debug.error('delete_failed', { sessionId, error: error.message });
    }
  };

  const handleRefresh = () => {
    debug.log('manual_refresh');
    loadSessions();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">🖼️ Gallery</h1>
              <p className="text-sm text-gray-600 mt-1">
                {filteredSessions.length} of {sessions.length} sessions
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium disabled:opacity-50"
              >
                🔄 Refresh
              </button>
              <Link
                to="/upload"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                + Upload New
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Filter Bar */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <FilterBar
            filter={filter}
            onFilterChange={handleFilterChange}
            searchText={searchText}
            onSearchChange={handleSearchChange}
            stats={{
              all: sessions.length,
              tagged: sessions.filter(s => s.hasTags).length,
              untagged: sessions.filter(s => !s.hasTags).length
            }}
          />
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 py-6 w-full">
        {isLoading ? (
          // Loading State
          <div className="flex flex-col items-center justify-center py-20">
            <div className="text-6xl mb-4">⏳</div>
            <p className="text-gray-600 text-lg">Loading sessions...</p>
          </div>
        ) : filteredSessions.length === 0 ? (
          // Empty State
          <div className="flex flex-col items-center justify-center py-20">
            <div className="text-8xl mb-6">📭</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              {sessions.length === 0
                ? 'No Sessions Yet'
                : 'No Matching Sessions'}
            </h2>
            <p className="text-gray-600 mb-6 text-center max-w-md">
              {sessions.length === 0
                ? 'Upload your first photo to get started with social tagging.'
                : 'Try adjusting your filters or search terms.'}
            </p>
            {sessions.length === 0 && (
              <Link
                to="/upload"
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
              >
                📤 Upload Your First Photo
              </Link>
            )}
            {sessions.length > 0 && (
              <button
                onClick={() => {
                  setFilter('all');
                  setSearchText('');
                }}
                className="px-6 py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          // Sessions Grid
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredSessions.map(session => (
              <SessionCard
                key={session.sessionId}
                session={session}
                onDelete={handleDeleteSession}
              />
            ))}
          </div>
        )}
      </main>

      {/* Footer with Navigation */}
      <footer className="bg-white border-t border-gray-200 py-4">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-center gap-4 text-sm text-gray-600">
          <Link to="/" className="hover:text-gray-900">Home</Link>
          <span>•</span>
          <Link to="/upload" className="hover:text-gray-900">Upload</Link>
          <span>•</span>
          <Link to="/debug" className="hover:text-gray-900">Debug</Link>
        </div>
      </footer>
    </div>
  );
}

export default GalleryPage;
