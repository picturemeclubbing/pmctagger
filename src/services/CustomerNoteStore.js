/**
 * File: /src/services/CustomerNoteStore.js
 * Purpose: Append-only note storage for customer relationship management (Phase 8.0)
 * Connects To: database.js, CustomerProfilePage.jsx
 */

import { db } from './database.js';

/**
 * Add a note to a customer
 * @param {string} customerId
 * @param {string} content - Text content of the note
 * @param {string} author - Author of the note (optional)
 * @returns {Promise<Object>} Created note record
 */
export async function addNote(customerId, content, author = 'System') {
  try {
    if (!customerId || !content || content.trim().length === 0) {
      throw new Error('customerId and content are required');
    }

    const note = {
      customerId,
      content: content.trim(),
      author,
      createdAt: new Date().toISOString()
    };

    const id = await db.customer_notes.add(note);

    console.log(`[CustomerNoteStore] Added note ${id} for customer: ${customerId}`);
    return { ...note, id };

  } catch (error) {
    console.error('[CustomerNoteStore] Add note failed:', error);
    throw error;
  }
}

/**
 * Get single note by ID
 * @param {number} noteId
 * @returns {Promise<Object|null>}
 */
export async function getNote(noteId) {
  try {
    return await db.customer_notes.get(noteId);
  } catch (error) {
    console.error('[CustomerNoteStore] Get note failed:', error);
    return null;
  }
}

/**
 * Get all notes for a customer, ordered by creation date (newest first)
 * @param {string} customerId
 * @returns {Promise<Array>}
 */
export async function listNotes(customerId) {
  try {
    return await db.customer_notes
      .where('customerId')
      .equals(customerId)
      .reverse()
      .sortBy('createdAt');
  } catch (error) {
    console.error('[CustomerNoteStore] List notes failed:', error);
    return [];
  }
}

/**
 * Update note content or author
 * @param {number} noteId
 * @param {Object} updates - { content, author }
 * @returns {Promise<boolean>}
 */
export async function updateNote(noteId, updates) {
  try {
    const updateData = {};
    if (updates.content !== undefined) {
      updateData.content = updates.content.trim();
    }
    if (updates.author !== undefined) {
      updateData.author = updates.author;
    }

    await db.customer_notes.update(noteId, updateData);

    console.log(`[CustomerNoteStore] Updated note: ${noteId}`);
    return true;

  } catch (error) {
    console.error('[CustomerNoteStore] Update note failed:', error);
    return false;
  }
}

/**
 * Delete a note
 * @param {number} noteId
 * @returns {Promise<boolean>}
 */
export async function deleteNote(noteId) {
  try {
    await db.customer_notes.delete(noteId);

    console.log(`[CustomerNoteStore] Deleted note: ${noteId}`);
    return true;

  } catch (error) {
    console.error('[CustomerNoteStore] Delete note failed:', error);
    return false;
  }
}

/**
 * Bulk delete all notes for a customer
 * @param {string} customerId
 * @returns {Promise<number>} Number of notes deleted
 */
export async function deleteAllCustomerNotes(customerId) {
  try {
    const deletedCount = await db.customer_notes
      .where('customerId')
      .equals(customerId)
      .delete();

    console.log(`[CustomerNoteStore] Deleted ${deletedCount} notes for customer: ${customerId}`);
    return deletedCount;

  } catch (error) {
    console.error('[CustomerNoteStore] Bulk delete notes failed:', error);
    return 0;
  }
}

/**
 * Get recent notes across all customers (for dashboard/monitoring)
 * @param {number} limit - Maximum number of notes to return
 * @returns {Promise<Array>}
 */
export async function getRecentNotes(limit = 50) {
  try {
    return await db.customer_notes
      .orderBy('createdAt')
      .reverse()
      .limit(limit)
      .toArray();
  } catch (error) {
    console.error('[CustomerNoteStore] Get recent notes failed:', error);
    return [];
  }
}

/**
 * Search notes by content or author
 * @param {string} query - Search query (case insensitive)
 * @param {string} customerId - Optional customer filter
 * @returns {Promise<Array>}
 */
export async function searchNotes(query, customerId = null) {
  try {
    if (!query || query.trim().length === 0) {
      return [];
    }

    const searchTerm = query.toLowerCase().trim();

    let collection = db.customer_notes;

    // Filter by customer if specified
    if (customerId) {
      collection = collection.where('customerId').equals(customerId);
    }

    const allNotes = await collection.toArray();

    // Filter by content or author (case insensitive)
    return allNotes.filter(note =>
      note.content.toLowerCase().includes(searchTerm) ||
      (note.author && note.author.toLowerCase().includes(searchTerm))
    );

  } catch (error) {
    console.error('[CustomerNoteStore] Search notes failed:', error);
    return [];
  }
}

export default {
  addNote,
  getNote,
  listNotes,
  updateNote,
  deleteNote,
  deleteAllCustomerNotes,
  getRecentNotes,
  searchNotes
};
