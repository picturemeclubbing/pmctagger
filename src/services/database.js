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

// Version 6: Added deliveries_simple table (Phase 6.1) + thumbDataUrl for homepage thumbnails (Phase 6.3b)
db.version(6).stores({
  photoSessions: '++id, sessionId, createdAt, hasTags, imageName, thumbDataUrl',
  deliveryJobs: '++id, jobId, sessionId, status, createdAt',
  settings: 'key',
  customers: '++id, handle, name, email, phone, createdAt',
  deliveries: '++id, sessionId, customerId, status, consentAt, sentAt, createdAt',
  deliveries_simple: '++id, status, sessionId, customerId, method, createdAt'
});

// Version 7: Phase 7.0 - Automated Delivery & Customer Notifications
db.version(7).stores({
  photoSessions: '++id, sessionId, createdAt, hasTags, imageName, thumbDataUrl',
  deliveryJobs: '++id, jobId, sessionId, status, createdAt',
  settings: 'key',
  customers: '++id, handle, name, email, phone, createdAt',
  deliveries: '++id, sessionId, customerId, status, consentAt, sentAt, createdAt',
  deliveries_simple: '++id, status, sessionId, customerId, method, createdAt, attempt, nextRetryAt, sentAt',
  delivery_logs: '++id, deliveryId, sessionId, customerId, method, status, attempt, createdAt, provider, responseCode, responseData, processingTime'
});

// Version 8: Phase 8.0 - CRM Core (customers, customer_notes, customer_images)
db.version(8).stores({
  photoSessions: '++id, sessionId, createdAt, hasTags, imageName, thumbDataUrl',
  deliveryJobs: '++id, jobId, sessionId, status, createdAt',
  settings: 'key',
  customers: 'customerId, handle, name, email, phone, createdAt, lastDeliveryAt, tagCount, imagesCount',
  deliveries: '++id, sessionId, customerId, status, consentAt, sentAt, createdAt',
  deliveries_simple: '++id, status, sessionId, customerId, method, createdAt, attempt, nextRetryAt, sentAt',
  delivery_logs: '++id, deliveryId, sessionId, customerId, method, status, attempt, createdAt, provider, responseCode, responseData, processingTime',
  customer_notes: '++id, customerId, createdAt, author, content',
  customer_images: '++id, customerId, url, filename, thumbnailUrl, createdAt, updatedAt'
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
 * Backfill CRM customers from existing delivery logs (Phase 8.0 migration)
 * @returns {Promise<{success: boolean, processed: number, errors: string[]}>}
 */
export async function backfillCustomersFromDeliveryLogs() {
  try {
    console.log('[Database] Starting CRM customer backfill from delivery logs...');

    // Bulk-read all relevant delivery logs once
    const deliveryLogs = await db.delivery_logs.toArray();

    // Bulk-read all existing customers once into a Map
    const existingCustomers = await db.customers.toArray();
    const customerMap = new Map();
    existingCustomers.forEach(customer => {
      customerMap.set(customer.customerId, customer);
    });

    // Process in memory and prepare for bulk update
    const customersToUpsert = new Map();

    for (const log of deliveryLogs) {
      const customerId = log.customerId || '';

      if (!customerId) continue;

      // Get existing or create new customer record
      const existing = customerMap.get(customerId) || customersToUpsert.get(customerId) || {
        customerId,
        handle: '',
        name: '',
        email: '',
        phone: '',
        createdAt: new Date().toISOString(),
        lastDeliveryAt: null,
        tagCount: 0,
        imagesCount: 0
      };

      // Update lastDeliveryAt if this log is more recent
      if (!existing.lastDeliveryAt ||
          new Date(log.createdAt) > new Date(existing.lastDeliveryAt)) {
        existing.lastDeliveryAt = log.createdAt;
      }

      // Extract additional info from log if available
      if (!existing.handle && log.customerId) {
        existing.handle = log.customerId;
      }
      if (!existing.email && log.customerId && log.customerId.includes('@')) {
        existing.email = log.customerId;
      }

      customersToUpsert.set(customerId, existing);
    }

    // Bulk-write all changes in a single transaction
    const customersArray = Array.from(customersToUpsert.values());
    if (customersArray.length > 0) {
      await db.customers.bulkPut(customersArray);
    }

    console.log(`[Database] Backfilled ${customersArray.length} customer records`);
    return {
      success: true,
      processed: customersArray.length,
      errors: []
    };

  } catch (error) {
    console.error('[Database] Backfill failed:', error);
    return {
      success: false,
      processed: 0,
      errors: [error.message]
    };
  }
}

/**
 * Get database statistics
 */
export async function getDatabaseStats() {
  try {
    const deliveryLogs = (await db.delivery_logs?.count()) || 0;
    const customerNotes = (await db.customer_notes?.count()) || 0;
    const customerImages = (await db.customer_images?.count()) || 0;

    return {
      sessions: await db.photoSessions.count(),
      customers: await db.customers.count(),
      customerNotes,
      customerImages,
      deliveries: (await db.deliveries?.count()) || 0,
      simpleDeliveries: (await db.deliveries_simple?.count()) || 0,
      deliveryLogs,
      version: db.verno
    };
  } catch (error) {
    console.error('[Database] Stats fetch failed:', error);
    return { error: error.message };
  }
}

// ============================================================================
// SETTINGS HELPERS - Phase 7.0
// ============================================================================

/**
 * Get a single setting value by key
 * @param {string} key - Setting key to retrieve
 * @returns {Promise<any>} Setting value or null if not found
 */
export async function getSetting(key) {
  try {
    const record = await db.settings.get(key);
    return record ? record.value : null;
  } catch (error) {
    console.error('[Database] Get setting failed:', error);
    return null;
  }
}

/**
 * Set multiple settings at once
 * @param {Object} settingsObj - Object containing settings key-value pairs
 * @returns {Promise<boolean>} True if successful
 */
export async function saveSettings(settingsObj) {
  try {
    const settings = Object.entries(settingsObj).map(([key, value]) => ({
      key,
      value
    }));

    await db.settings.bulkPut(settings);
    console.log('[Database] Settings saved:', Object.keys(settingsObj));
    return true;
  } catch (error) {
    console.error('[Database] Save settings failed:', error);
    return false;
  }
}

/**
 * Get all settings as an object
 * @returns {Promise<Object>} All settings
 */
export async function getAllSettings() {
  try {
    const all = await db.settings.toArray();
    return all.reduce((acc, { key, value }) => {
      acc[key] = value;
      return acc;
    }, {});
  } catch (error) {
    console.error('[Database] Get all settings failed:', error);
    return {};
  }
}

export default db;
