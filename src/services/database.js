/**
 * File: /src/utils/database.js
 * Purpose: Complete Dexie IndexedDB configuration with full schema history + getDatabaseStats()
 * Compatible With: Phase 6.1 DeliverySimple MVP and prior phases
 */

import Dexie from 'dexie';

export const db = new Dexie('PMC_SocialTagger');

// ============================================================================
// SCHEMA VERSION HISTORY
// ============================================================================

// Version 1: Initial sessions table
db.version(1).stores({
  photoSessions: '++id, sessionId, createdAt, hasTags, imageName'
});

// Version 2: Added deliveryJobs + settings
db.version(2).stores({
  photoSessions: '++id, sessionId, createdAt, hasTags, imageName',
  deliveryJobs: '++id, jobId, sessionId, status, createdAt',
  settings: 'key'
});

// Version 3: Added customers table
db.version(3).stores({
  photoSessions: '++id, sessionId, createdAt, hasTags, imageName',
  deliveryJobs: '++id, jobId, sessionId, status, createdAt',
  settings: 'key',
  customers: '++id, handle, name, email, phone, createdAt'
});

// Version 4: Added deliveries table
db.version(4).stores({
  photoSessions: '++id, sessionId, createdAt, hasTags, imageName',
  deliveryJobs: '++id, jobId, sessionId, status, createdAt',
  settings: 'key',
  customers: '++id, handle, name, email, phone, createdAt',
  deliveries: '++id, sessionId, customerId, status, consentAt, createdAt'
});

// Version 5: Added sentAt index for deliveries
db.version(5).stores({
  photoSessions: '++id, sessionId, createdAt, hasTags, imageName',
  deliveryJobs: '++id, jobId, sessionId, status, createdAt',
  settings: 'key',
  customers: '++id, handle, name, email, phone, createdAt',
  deliveries: '++id, sessionId, customerId, status, consentAt, sentAt, createdAt'
});

// Version 6: Added deliveries_simple table (Phase 6.1)
db.version(6).stores({
  photoSessions: '++id, sessionId, createdAt, hasTags, imageName',
  deliveryJobs: '++id, jobId, sessionId, status, createdAt',
  settings: 'key',
  customers: '++id, handle, name, email, phone, createdAt',
  deliveries: '++id, sessionId, customerId, status, consentAt, sentAt, createdAt',
  deliveries_simple: '++id, status, sessionId, customerId, method, createdAt'
});

// ============================================================================
// DATABASE UTILITIES
// ============================================================================

/**
 * Initialize database and verify schema
 */
export async function initDatabase() {
  try {
    await db.open();
    console.log('[Database] Initialized successfully');
    console.log('[Database] Version:', db.verno);
    console.log('[Database] Tables:', db.tables.map(t => t.name).join(', '));
    return true;
  } catch (error) {
    console.error('[Database] Initialization failed:', error);
    return false;
  }
}

/**
 * Clear all data (dev use only)
 */
export async function clearAllData() {
  try {
    await Promise.all(db.tables.map(table => table.clear()));
    console.log('[Database] All tables cleared (development only)');
  } catch (error) {
    console.error('[Database] Clear failed:', error);
  }
}

/**
 * Get database statistics
 */
export async function getDatabaseStats() {
  try {
    return {
      sessions: await db.photoSessions.count(),
      customers: await db.customers.count(),
      deliveries: (await db.deliveries?.count()) || 0,
      simpleDeliveries: (await db.deliveries_simple?.count()) || 0,
      version: db.verno
    };
  } catch (error) {
    console.error('[Database] Stats fetch failed:', error);
    return { error: error.message };
  }
}

export default db;
