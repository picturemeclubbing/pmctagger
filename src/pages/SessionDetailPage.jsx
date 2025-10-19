/**
 * File: /src/pages/SessionDetailPage.jsx
 * Purpose: Full-screen session detail view with actions (Phase 5.4a MVP)
 * Connects To: SessionStore, SessionMeta, DebugContext, Router
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import useDebug from '../debug/useDebug';
import { getSession, deleteSession } from '../services/SessionStore';
import { blobToDataURL } from '../utils/helpers';
import SessionMeta from '../components/session/SessionMeta';

function SessionDetailPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const debug = useDebug('SESSION');

  const [session, setSession] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadSession();

    // Cleanup image URL on unmount
    return () => {
      if (imageUrl) URL.revokeObjectURL(imageUrl);
    };
  }, [sessionId]);

  const loadSession = async () => {
    debug.time('session_load');
    setIsLoading(true);

    try {
      const sessionData = await getSession(sessionId);

      if (!sessionData) {
        debug.error('session_not_found', { sessionId });
        throw new Error('Session not found');
      }

      setSession(sessionData);

      // Convert blob to URL for display
      if (sessionData.rawImageBlob) {
        const url = await blobToDataURL(sessionData.rawImageBlob);
        setImageUrl(url);
      }

      debug.timeEnd('session_load', {
        sessionId,
        hasTags: sessionData.hasTags,
        tagCount: sessionData.tagsMeta?.length || 0
      });
      debug.success('session_loaded', { sessionId });
    } catch (error) {
      debug.error('load_failed', { sessionId, error: error.message });
      // Redirect to gallery if session not found
      setTimeout(() => navigate('/gallery'), 2000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTagAgain = () => {
    debug.log('navigate_to_tagging', { sessionId });
    navigate(`/tag/${sessionId}`);
  };

  const handleShare = () => {
    debug.log('navigate_to_share', { sessionId });
    navigate(`/share/${sessionId}`);
  };

  const handleDelete = async () => {
    // Confirm deletion
    const confirmed = window.confirm(
      'Delete this session permanently? This cannot be undone.'
    );

    if (!confirmed) {
      debug.log('delete_cancelled', { sessionId });
      return;
    }

    debug.time('session_delete');
    setIsDeleting(true);

    try {
      await deleteSession(sessionId);

      debug.timeEnd('session_delete', { sessionId });
      debug.warn('session_deleted', { sessionId });

      // Navigate back to gallery
      navigate('/gallery');
    } catch (error) {
      debug.error('delete_failed', { sessionId, error: error.message });
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="text-6xl mb-4">⏳</div>
          <p className="text-lg">Loading session...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold mb-2">Session Not Found</h2>
          <p className="text-gray-400 mb-6">
            This session may have been deleted or doesn't exist.
          </p>
          <Link
            to="/gallery"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Return to Gallery
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                to="/gallery"
                className="text-gray-300 hover:text-white transition-colors"
              >
                ← Back to Gallery
              </Link>
              <h1 className="text-xl font-bold text-white">
                📄 Session Detail
              </h1>
            </div>

            {/* Delete Button (header) */}
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="
                px-4 py-2 bg-red-600 hover:bg-red-700
                text-white font-medium rounded-lg
                transition-colors disabled:opacity-50
                text-sm
              "
            >
              {isDeleting ? 'Deleting...' : '🗑️ Delete'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Image Preview */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              Image Preview
            </h2>

            <div className="relative bg-gray-900 rounded-lg overflow-hidden">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={session.imageName || 'Session image'}
                  className="w-full h-auto object-contain max-h-[600px]"
                />
              ) : (
                <div className="w-full aspect-square flex items-center justify-center">
                  <span className="text-8xl opacity-30">📷</span>
                </div>
              )}

              {/* Status Badge Overlay */}
              <div className="absolute top-4 right-4">
                {session.hasTags ? (
                  <span className="px-3 py-1.5 bg-green-500 text-white text-sm font-bold rounded-full shadow-lg flex items-center gap-2">
                    <span>✓</span>
                    <span>Tagged</span>
                  </span>
                ) : (
                  <span className="px-3 py-1.5 bg-gray-400 text-white text-sm font-bold rounded-full shadow-lg">
                    Raw
                  </span>
                )}
              </div>

              {/* Tag Count Badge */}
              {session.hasTags && session.tagsMeta && session.tagsMeta.length > 0 && (
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1.5 bg-blue-600 text-white text-sm font-bold rounded-full shadow-lg">
                    🏷️ {session.tagsMeta.length} tag{session.tagsMeta.length !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Session Details & Actions */}
          <div className="space-y-6">
            {/* Session Metadata */}
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-white mb-4">
                Session Information
              </h2>
              <SessionMeta session={session} />
            </div>

            {/* Action Buttons */}
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-white mb-4">
                Actions
              </h2>

              <div className="space-y-3">
                {/* Tag Again */}
                <button
                  onClick={handleTagAgain}
                  className="
                    w-full px-6 py-4
                    bg-blue-600 hover:bg-blue-700
                    text-white font-semibold rounded-lg
                    transition-all duration-200
                    flex items-center justify-center gap-3
                    shadow-md hover:shadow-lg
                  "
                >
                  <span className="text-2xl">🏷️</span>
                  <span>Tag Again</span>
                </button>

                {/* Share */}
                <button
                  onClick={handleShare}
                  className="
                    w-full px-6 py-4
                    bg-green-600 hover:bg-green-700
                    text-white font-semibold rounded-lg
                    transition-all duration-200
                    flex items-center justify-center gap-3
                    shadow-md hover:shadow-lg
                  "
                >
                  <span className="text-2xl">📤</span>
                  <span>Share Session</span>
                </button>

                {/* Delete */}
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="
                    w-full px-6 py-4
                    bg-red-600 hover:bg-red-700
                    text-white font-semibold rounded-lg
                    transition-all duration-200
                    flex items-center justify-center gap-3
                    shadow-md hover:shadow-lg
                    disabled:opacity-50 disabled:cursor-not-allowed
                  "
                >
                  <span className="text-2xl">🗑️</span>
                  <span>{isDeleting ? 'Deleting...' : 'Delete Session'}</span>
                </button>
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-white mb-4">
                Quick Links
              </h2>

              <div className="space-y-2 text-sm">
                <Link
                  to="/gallery"
                  className="block text-blue-400 hover:text-blue-300 transition-colors"
                >
                  → Back to Gallery
                </Link>
                <Link
                  to="/upload"
                  className="block text-blue-400 hover:text-blue-300 transition-colors"
                >
                  → Upload New Photo
                </Link>
                <Link
                  to="/debug"
                  className="block text-blue-400 hover:text-blue-300 transition-colors"
                >
                  → View Debug Console
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 border-t border-gray-700 py-4">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-400">
          Session ID: <span className="font-mono">{sessionId}</span>
        </div>
      </footer>
    </div>
  );
}

export default SessionDetailPage;
