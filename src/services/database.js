/**
 * File: /src/services/database.js
 * Purpose: Dexie IndexedDB configuration with schema versioning
 * Connects To: All stores (SessionStore, CustomerStore), data models
 *
 * Version History:
 * - v1: Initial schema (photoSessions)
 * - v2: Added deliveryJobs, settings
 * - v3: Added customers table (Phase 5.2b)
 * - v4: Added deliveries table (Phase 6.0a)
 */

import Dexie from 'dexie';

export const db = new Dexie('PMC_SocialTagger');

// ============================================================================
// SCHEMA VERSIONS
// ============================================================================

// Version 1: Initial schema
db.version(1).stores({
  photoSessions: '++id, sessionId, createdAt, hasTags, imageName'
});

// Version 2: Added delivery and settings
db.version(2).stores({
  photoSessions: '++id, sessionId, createdAt, hasTags, imageName',
  deliveryJobs: '++id, jobId, sessionId, status, createdAt',
  settings: 'key'
});

// Version 3: Added customers (Phase 5.2b)
db.version(3).stores({
  photoSessions: '++id, sessionId, createdAt, hasTags, imageName',
  deliveryJobs: '++id, jobId, sessionId, status, createdAt',
  settings: 'key',
  customers: '++id, handle, name, email, phone, createdAt'
});

// Version 4: Added deliveries table (Phase 6.0a)
db.version(4).stores({
  photoSessions: '++id, sessionId, createdAt, hasTags, imageName',
  deliveryJobs: '++id, jobId, sessionId, status, createdAt',
  settings: 'key',
  customers: '++id, handle, name, email, phone, createdAt',
  deliveries: '++id, sessionId, customerId, status, consentAt, createdAt'
});

// ============================================================================
// DATABASE INITIALIZATION
// ============================================================================

/**
 * Initialize database and verify schema
 * Ensures default settings row exists and seeds test customers
 */
export async function initDatabase() {
  try {
    await db.open();
    console.log('[Database] Initialized successfully');
    console.log('[Database] Schema version:', db.verno);
    console.log('[Database] Tables:', db.tables.map(t => t.name).join(', '));

    // Ensure default settings row exists
    const existing = await db.settings.get(1);
    if (!existing) {
      await db.settings.put({
        id: 1,
        brandName: 'Your Brand',
        igHandle: '@yourhandle',
        eventName: '',
        watermarkStyle: {
          enabled: true,
          position: 'bottom',
          padding: 24,
          textSize: 28
        },
        deliveryProviders: {
          email: { enabled: false },
          sms: { enabled: false }
        },
        sizeLimits: { maxWidth: 1920, thumb: 300 },
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
      console.log('[Database] Default settings initialized');
    }

    return true;
  } catch (error) {
    console.error('[Database] Initialization failed:', error);
    return false;
  }
}

/**
 * Check if database is ready
 */
export async function isDatabaseReady() {
  return db.isOpen();
}

/**
 * Clear all data (development/testing only)
 */
export async function clearAllData() {
  if (process.env.NODE_ENV !== 'production') {
    await db.photoSessions.clear();
    await db.deliveryJobs.clear();
    await db.settings.clear();
    await db.customers.clear();
    await db.deliveries.clear();
    console.log('[Database] All data cleared');
  }
}

/**
 * Get database statistics
 */
export async function getDatabaseStats() {
  return {
    sessions: await db.photoSessions.count(),
    deliveryJobs: await db.deliveryJobs.count(),
    deliveries: await db.deliveries.count(),
    customers: await db.customers.count(),
    version: db.verno
  };
}

// Auto-initialize on import
initDatabase();

export default db;
