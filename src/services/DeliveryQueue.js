/**
 * File: /src/services/DeliveryQueue.js
 * Purpose: Manage delivery queue for photo distribution (Phase 6.0a)
 * Connects To: database.js (Dexie), CustomerStore, SessionStore
 */

import { db } from './database';

/**
 * Add a session to the delivery queue
 *
 * @param {string} sessionId - Session ID to deliver
 * @param {number} customerId - Customer ID from CustomerStore
 * @returns {Promise<Object>} Created delivery record
 */
export async function addToQueue(sessionId, customerId) {
  const now = Date.now();

  const delivery = {
    sessionId,
    customerId,
    status: 'pending',
    consentAt: now,
    createdAt: now,
    sentAt: null,
    deliveryMethod: null, // 'sms' | 'email' | 'both' (set later)
    attempts: 0,
    lastError: null
  };

  const id = await db.deliveries.add(delivery);

  console.log('[DeliveryQueue] Added to queue:', { id, sessionId, customerId });

  return { ...delivery, id };
}

/**
 * List all pending deliveries
 *
 * @returns {Promise<Array>} Pending delivery records
 */
export async function listPending() {
  return db.deliveries
    .where('status')
    .equals('pending')
    .toArray();
}

/**
 * List all deliveries (any status)
 *
 * @param {Object} filters - Optional filters { status?, customerId?, sessionId? }
 * @returns {Promise<Array>} Delivery records
 */
export async function listDeliveries(filters = {}) {
  let collection = db.deliveries.toCollection();

  if (filters.status) {
    collection = collection.filter(d => d.status === filters.status);
  }

  if (filters.customerId) {
    collection = collection.filter(d => d.customerId === filters.customerId);
  }

  if (filters.sessionId) {
    collection = collection.filter(d => d.sessionId === filters.sessionId);
  }

  return collection.reverse().sortBy('createdAt');
}

/**
 * Mark a delivery as sent
 *
 * @param {number} id - Delivery record ID
 * @param {string} method - Delivery method used ('sms' | 'email' | 'both')
 * @returns {Promise<void>}
 */
export async function markSent(id, method = 'sms') {
  await db.deliveries.update(id, {
    status: 'sent',
    sentAt: Date.now(),
    deliveryMethod: method
  });

  console.log('[DeliveryQueue] Marked as sent:', { id, method });
}

/**
 * Mark a delivery as failed
 *
 * @param {number} id - Delivery record ID
 * @param {string} error - Error message
 * @returns {Promise<void>}
 */
export async function markFailed(id, error) {
  const delivery = await db.deliveries.get(id);

  await db.deliveries.update(id, {
    status: 'failed',
    attempts: (delivery?.attempts || 0) + 1,
    lastError: error
  });

  console.log('[DeliveryQueue] Marked as failed:', { id, error });
}

/**
 * Retry a failed delivery
 *
 * @param {number} id - Delivery record ID
 * @returns {Promise<void>}
 */
export async function retryDelivery(id) {
  await db.deliveries.update(id, {
    status: 'pending',
    lastError: null
  });

  console.log('[DeliveryQueue] Retry queued:', { id });
}

/**
 * Get delivery by ID
 *
 * @param {number} id - Delivery record ID
 * @returns {Promise<Object|null>} Delivery record
 */
export async function getDelivery(id) {
  return db.deliveries.get(id);
}

/**
 * Delete a delivery record
 *
 * @param {number} id - Delivery record ID
 * @returns {Promise<void>}
 */
export async function deleteDelivery(id) {
  await db.deliveries.delete(id);
  console.log('[DeliveryQueue] Deleted delivery:', { id });
}

/**
 * Get delivery statistics
 *
 * @returns {Promise<Object>} Delivery stats
 */
export async function getDeliveryStats() {
  const all = await db.deliveries.toArray();

  return {
    total: all.length,
    pending: all.filter(d => d.status === 'pending').length,
    sent: all.filter(d => d.status === 'sent').length,
    failed: all.filter(d => d.status === 'failed').length
  };
}

// Export all functions
export default {
  addToQueue,
  listPending,
  listDeliveries,
  markSent,
  markFailed,
  retryDelivery,
  getDelivery,
  deleteDelivery,
  getDeliveryStats
};
