/**
 * File: /src/services/SessionStore.js
 * Purpose: High-level CRUD for photo sessions with versioned blobs and tags metadata
 * Connects To: database.js (Dexie db), EventBus, Debug (useDebug)
 *
 * Phase 5.3a: Added searchSessions() and getSessionStats() helpers for gallery filtering
 */

import { db } from './database';
import { emit } from './EventBus';

/**
 * Creates a new RAW session record with initial version fields.
 * Returns the full session object (not a Dexie count).
 */
export async function saveRawVersion(sessionId, imageBlob, thumbBlob, imageName) {
  if (!sessionId) {
    sessionId = `sess_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
  }

  // Check if sessionId already exists
  const existing = await db.photoSessions.where({ sessionId }).first();
  if (existing) {
    throw new Error(`Session ID ${sessionId} already exists`);
  }

  const now = Date.now();
  const session = {
    sessionId,
    imageName: imageName || `upload_${sessionId}.jpg`,
    rawImageBlob: imageBlob,
    rawThumbBlob: thumbBlob,
    taggedImageBlob: null,
    taggedThumbBlob: null,
    hasTags: false,
    tagsMeta: [],
    currentVersion: 'raw',
    createdAt: now,
    lastSharedAt: null,
    shareCount: 0,
    hostedUrl: null,
    deliveryPreference: null
  };

  await db.photoSessions.add(session);
  emit('session:created', { sessionId });
  return session;
}

export async function updateSession(sessionId, updates) {
  const existing = await db.photoSessions.where({ sessionId }).first();
  if (!existing) throw new Error(`[SessionStore.updateSession] Not found: ${sessionId}`);
  const merged = { ...existing, ...updates };
  await db.photoSessions.put(merged);
  return merged;
}

export async function getSession(sessionId) {
  return db.photoSessions.where({ sessionId }).first();
}

export async function listSessions(filters = {}) {
  // Basic filters (expand later if needed)
  let coll = db.photoSessions.toCollection();
  if (typeof filters.hasTags === 'boolean') {
    coll = coll.filter(s => s.hasTags === filters.hasTags);
  }
  return coll.reverse().sortBy('createdAt'); // newest first
}

export async function deleteSession(sessionId) {
  const s = await db.photoSessions.where({ sessionId }).first();
  if (!s) return;
  await db.photoSessions.where({ sessionId }).delete();
  emit('session:deleted', { sessionId });
}

/**
 * Persists tag overlay metadata (does not burn).
 */
export async function updateTagsMeta(sessionId, tagsMeta = []) {
  const updated = await updateSession(sessionId, {
    tagsMeta,
    hasTags: Array.isArray(tagsMeta) && tagsMeta.length > 0
  });
  emit('tags:updated', { sessionId, count: tagsMeta.length });
  return updated;
}

/**
 * Saves burned/derived TAGGED version and thumbnail.
 */
export async function saveTaggedVersion(sessionId, taggedBlob, taggedThumbBlob) {
  const updated = await updateSession(sessionId, {
    taggedImageBlob: taggedBlob,
    taggedThumbBlob,
    currentVersion: 'tagged'
  });
  emit('share:completed', { sessionId, type: 'tagged' });
  return updated;
}

// ============================================================================
// PHASE 5.3a: Gallery Search & Filter Helpers
// ============================================================================

/**
 * Search sessions with advanced filtering
 * Phase 5.3a: Added for gallery page support
 *
 * @param {Object} options - Filter options
 * @param {string} options.searchText - Text to search in imageName or sessionId
 * @param {'all'|'tagged'|'untagged'} options.filterType - Tag status filter
 * @param {string} options.sortBy - Sort field (default: 'createdAt')
 * @param {'asc'|'desc'} options.sortOrder - Sort direction (default: 'desc')
 * @returns {Promise<Array>} Filtered and sorted sessions
 */
export async function searchSessions(options = {}) {
  const {
    searchText = '',
    filterType = 'all',
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = options;

  let sessions = await listSessions();

  // Apply tag status filter
  if (filterType === 'tagged') {
    sessions = sessions.filter(s => s.hasTags === true);
  } else if (filterType === 'untagged') {
    sessions = sessions.filter(s => s.hasTags === false);
  }

  // Apply text search
  if (searchText.trim()) {
    const search = searchText.toLowerCase();
    sessions = sessions.filter(s =>
      s.imageName?.toLowerCase().includes(search) ||
      s.sessionId?.toLowerCase().includes(search) ||
      s.tagsMeta?.some(tag =>
        tag.text?.toLowerCase().includes(search) ||
        tag.customerName?.toLowerCase().includes(search)
      )
    );
  }

  // Sort (already sorted by createdAt desc from listSessions, but allow override)
  if (sortBy !== 'createdAt' || sortOrder !== 'desc') {
    sessions.sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];

      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
  }

  return sessions;
}

/**
 * Get session statistics
 * Phase 5.3a: Helper for dashboard/gallery stats
 *
 * @returns {Promise<Object>} Session statistics
 */
export async function getSessionStats() {
  const sessions = await listSessions();

  return {
    total: sessions.length,
    tagged: sessions.filter(s => s.hasTags).length,
    untagged: sessions.filter(s => !s.hasTags).length,
    withCustomers: sessions.filter(s =>
      s.tagsMeta?.some(tag => tag.customerId)
    ).length,
    totalTags: sessions.reduce((sum, s) =>
      sum + (s.tagsMeta?.length || 0), 0
    )
  };
}

// ============================================================================
// BACKWARD COMPATIBILITY CHECK
// ============================================================================

// Export all functions to maintain backward compatibility
export default {
  saveRawVersion,
  updateSession,
  getSession,
  listSessions,
  deleteSession,
  updateTagsMeta,
  saveTaggedVersion,
  searchSessions,      // Phase 5.3a
  getSessionStats      // Phase 5.3a
};
