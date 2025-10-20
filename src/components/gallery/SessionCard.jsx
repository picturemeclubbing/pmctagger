/**
 * File: /src/components/gallery/SessionCard.jsx
 * Purpose: Display individual session card with thumbnail and actions
 * Connects To: GalleryPage.jsx, SessionStore, CustomerBadge
 */

import React, { useState, useEffect } from 'react';
import { CustomerBadgeInline } from '../CustomerBadge';
import { formatDate } from '../../utils/helpers';

/**
 * SessionCard Component
 * Displays session thumbnail, metadata, and action buttons
 *
 * @param {Object} props
 * @param {Object} props.session - Session object from Dexie
 * @param {Function} props.onOpen - Open session handler
 * @param {Function} props.onDelete - Delete session handler
 */
export default function SessionCard({ session, onOpen, onDelete }) {
  const [thumbnailUrl, setThumbnailUrl] = useState(null);
  const [isHovered, setIsHovered] = useState(false);

  // Generate thumbnail URL with fallback hierarchy
  useEffect(() => {
    let url = null;

    // 1. thumbnailPath (preferred)
    if (session.thumbnailPath) {
      url = session.thumbnailPath;
    }
    // 2. imageUrl (legacy)
    else if (session.imageUrl) {
      url = session.imageUrl;
    }
    // 3. Create URL from fileBlob
    else if (session.fileBlob) {
      url = URL.createObjectURL(session.fileBlob);
    }
    // 4. fallback to rawThumbBlob (old format)
    else if (session.rawThumbBlob) {
      url = URL.createObjectURL(session.rawThumbBlob);
    }

    setThumbnailUrl(url);

    // Cleanup if we created a blob URL
    return () => {
      if ((session.rawThumbBlob || session.fileBlob) && url) {
        URL.revokeObjectURL(url);
      }
    };
  }, [session]);

  // Get first linked customer name if available
  const linkedCustomerName = session.tagsMeta
    ?.find(tag => tag.customerName)
    ?.customerName;

  const handleOpenClick = (e) => {
    e.stopPropagation();
    // Navigate to session detail page instead of directly to tagging
    window.location.href = `/session/${session.sessionId}`;
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    onDelete(session.sessionId);
  };

  return (
    <div
      className="
        relative bg-white rounded-lg border border-gray-200
        shadow-sm hover:shadow-md transition-all duration-200
        overflow-hidden group cursor-pointer
      "
      onClick={handleOpenClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Thumbnail */}
      <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={session.imageName || 'Session thumbnail'}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-6xl opacity-50">📷</span>
          </div>
        )}

        {/* Status Badge */}
        <div className="absolute top-2 right-2">
          {session.hasTags ? (
            <span className="px-2 py-1 bg-green-500 text-white text-xs font-bold rounded-full shadow-md flex items-center gap-1">
              <span>✓</span>
              <span>Tagged</span>
            </span>
          ) : (
            <span className="px-2 py-1 bg-gray-400 text-white text-xs font-bold rounded-full shadow-md">
              Raw
            </span>
          )}
        </div>

        {/* Tag Count Badge */}
        {session.hasTags && session.tagsMeta && session.tagsMeta.length > 0 && (
          <div className="absolute top-2 left-2">
            <span className="px-2 py-1 bg-blue-600 text-white text-xs font-bold rounded-full shadow-md">
              🏷️ {session.tagsMeta.length}
            </span>
          </div>
        )}

        {/* Hover Overlay */}
        <div
          className={`
            absolute inset-0 bg-black/60
            flex flex-col items-center justify-center gap-3
            transition-opacity duration-200
            ${isHovered ? 'opacity-100' : 'opacity-0'}
          `}
        >
          <button
            onClick={handleOpenClick}
            className="
              px-6 py-3 bg-blue-600 hover:bg-blue-700
              text-white font-semibold rounded-lg
              transition-colors shadow-lg
            "
          >
            Open Session
          </button>
          <button
            onClick={handleDeleteClick}
            className="
              px-4 py-2 bg-red-600 hover:bg-red-700
              text-white font-medium rounded-lg
              transition-colors text-sm
            "
          >
            🗑️ Delete
          </button>
        </div>
      </div>

      {/* Card Info */}
      <div className="p-3 space-y-2">
        {/* Image Name */}
        <h3 className="font-medium text-gray-900 truncate text-sm">
          {session.imageName || 'Untitled Session'}
        </h3>

        {/* Metadata */}
        <div className="space-y-1 text-xs text-gray-600">
          <div className="flex items-center justify-between">
            <span>📅 {formatDate(session.createdAt)}</span>
          </div>

          {/* Session ID (truncated) */}
          <div className="font-mono text-xs text-gray-400 truncate">
            ID: {session.sessionId.slice(0, 12)}...
          </div>
        </div>

        {/* Customer Badge (if linked) */}
        {linkedCustomerName && (
          <div className="pt-2 border-t border-gray-100">
            <CustomerBadgeInline customerName={linkedCustomerName} />
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * SessionCard Skeleton (loading state)
 */
export function SessionCardSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden animate-pulse">
      <div className="aspect-square bg-gray-200"></div>
      <div className="p-3 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        <div className="h-3 bg-gray-200 rounded w-full"></div>
      </div>
    </div>
  );
}
