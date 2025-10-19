/**
 * File: /src/components/session/SessionMeta.jsx
 * Purpose: Display detailed session metadata and customer information
 * Connects To: CustomerBadge, formatDate, SessionStore
 */

import React from 'react';
import { formatDate } from '../../utils/helpers';
import { CustomerBadgeInline } from '../CustomerBadge';

/**
 * SessionMeta Component
 * Displays session properties in a clean, organized layout
 *
 * @param {Object} props
 * @param {Object} props.session - Session object from Dexie
 */
export default function SessionMeta({ session }) {
  // Extract linked customers
  const linkedCustomers = session.tagsMeta?.filter(tag => tag.customerId) || [];
  const hasLinkedCustomers = linkedCustomers.length > 0;

  return (
    <div className="space-y-4">
      {/* File Name */}
      <div className="space-y-1">
        <div className="text-xs text-gray-400 uppercase tracking-wide">
          File Name
        </div>
        <div className="text-white font-medium">
          {session.imageName || 'Untitled'}
        </div>
      </div>

      {/* Session ID */}
      <div className="space-y-1">
        <div className="text-xs text-gray-400 uppercase tracking-wide">
          Session ID
        </div>
        <div className="text-white font-mono text-sm">
          {session.sessionId}
        </div>
      </div>

      {/* Created Date */}
      <div className="space-y-1">
        <div className="text-xs text-gray-400 uppercase tracking-wide">
          Created
        </div>
        <div className="text-white">
          {formatDate(session.createdAt)}
        </div>
      </div>

      {/* Tag Status */}
      <div className="space-y-1">
        <div className="text-xs text-gray-400 uppercase tracking-wide">
          Tag Status
        </div>
        <div className="flex items-center gap-2">
          {session.hasTags ? (
            <>
              <span className="text-green-400 font-semibold">
                ✓ Tagged
              </span>
              <span className="text-gray-400">
                ({session.tagsMeta?.length || 0} tag{session.tagsMeta?.length !== 1 ? 's' : ''})
              </span>
            </>
          ) : (
            <span className="text-gray-400">
              ○ Untagged
            </span>
          )}
        </div>
      </div>

      {/* Tag List (if tags exist) */}
      {session.hasTags && session.tagsMeta && session.tagsMeta.length > 0 && (
        <div className="space-y-1">
          <div className="text-xs text-gray-400 uppercase tracking-wide">
            Tags
          </div>
          <div className="space-y-2">
            {session.tagsMeta.map((tag, index) => (
              <div
                key={tag.id || index}
                className="flex items-center gap-2 text-sm"
              >
                <span className="text-blue-400 font-mono">
                  {tag.text}
                </span>
                {tag.customerName && (
                  <CustomerBadgeInline customerName={tag.customerName} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Linked Customers Summary */}
      {hasLinkedCustomers && (
        <div className="space-y-1">
          <div className="text-xs text-gray-400 uppercase tracking-wide">
            Linked Customers
          </div>
          <div className="text-green-400 font-semibold">
            👤 {linkedCustomers.length} customer{linkedCustomers.length !== 1 ? 's' : ''} linked
          </div>
        </div>
      )}

      {/* Current Version */}
      <div className="space-y-1">
        <div className="text-xs text-gray-400 uppercase tracking-wide">
          Current Version
        </div>
        <div className="text-white">
          {session.currentVersion === 'tagged' ? 'Tagged' : 'Raw'}
        </div>
      </div>

      {/* Share Count (if shared) */}
      {session.shareCount > 0 && (
        <div className="space-y-1">
          <div className="text-xs text-gray-400 uppercase tracking-wide">
            Share Count
          </div>
          <div className="text-white">
            {session.shareCount} time{session.shareCount !== 1 ? 's' : ''}
          </div>
        </div>
      )}

      {/* Last Shared (if applicable) */}
      {session.lastSharedAt && (
        <div className="space-y-1">
          <div className="text-xs text-gray-400 uppercase tracking-wide">
            Last Shared
          </div>
          <div className="text-white">
            {formatDate(session.lastSharedAt)}
          </div>
        </div>
      )}

      {/* Hosted URL (if available) */}
      {session.hostedUrl && (
        <div className="space-y-1">
          <div className="text-xs text-gray-400 uppercase tracking-wide">
            Hosted URL
          </div>
          <a
            href={session.hostedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 text-sm underline"
          >
            View Online
          </a>
        </div>
      )}
    </div>
  );
}

/**
 * Compact SessionMeta variant for use in cards/modals
 */
export function SessionMetaCompact({ session }) {
  return (
    <div className="space-y-2 text-sm">
      <div className="flex items-center justify-between">
        <span className="text-gray-400">Created:</span>
        <span className="text-white">{formatDate(session.createdAt)}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-gray-400">Tags:</span>
        <span className="text-white">{session.tagsMeta?.length || 0}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-gray-400">Status:</span>
        <span className={session.hasTags ? 'text-green-400' : 'text-gray-400'}>
          {session.hasTags ? 'Tagged' : 'Raw'}
        </span>
      </div>
    </div>
  );
}
