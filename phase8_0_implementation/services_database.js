/**
 * File: /src/services/database.js
 * Purpose: Complete Dexie IndexedDB configuration with Phase 8.0 CRM schema
 * Compatible With: Phase 8.0 - CRM Core (customers, customer_notes, customer_images)
 * Baseline: Phase 7.0 (phase7_0_implementation_ready)
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
  customers: '++customerId, handle, name, email, phone, createdAt, lastDeliveryAt, tagCount',
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

    const deliveryLogs = await db.delivery_logs.toArray();

    // Use Map to deduplicate customers by customerId
    const customerMap = new Map();

    for (const log of deliveryLogs) {
      const key = log.customerId || log.customerId;

      if (!customerMap.has(key)) {
        // Look up existing customer record or create from delivery log
        const existingCustomer = await db.customers.get(key);

        if (existingCustomer) {
          customerMap.set(key, existingCustomer);
        } else {
          // Extract customer info from log (handle, email, phone)
          const customerInfo = extractCustomerInfoFromLog(log);
          customerMap.set(key, {
            customerId: key,
            handle: customerInfo.handle || '',
            name: customerInfo.name || '',
            email: customerInfo.email || '',
            phone: customerInfo.phone || '',
            createdAt: new Date().toISOString(),
            lastDeliveryAt: log.createdAt,
            tagCount: 0
          });
        }
      }

      // Update lastDeliveryAt for existing customer
      const customer = customerMap.get(key);
      if (customer.lastDeliveryAt && new Date(log.createdAt) > new Date(customer.lastDeliveryAt)) {
        customer.lastDeliveryAt = log.createdAt;
      }
    }

    // Bulk insert/update customers
    const customers = Array.from(customerMap.values());
    await db.customers.bulkPut(customers);

    console.log(`[Database] Backfilled ${customers.length} customer records`);
    return {
      success: true,
      processed: customers.length,
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
 * Extract customer information from delivery log data
 * @param {Object} log - Delivery log entry
 * @returns {Object} Customer info
 */
function extractCustomerInfoFromLog(log) {
  // This would extract customer info from responseData or other log fields
  // For now, return basic structure
  return {
    handle: log.customerId || '',
    name: '',
    email: log.customerId && log.customerId.includes('@') ? log.customerId : '',
    phone: ''
  };
}

/**
 * Get database statistics
 */
export async function getDatabaseStats() {
  try {
    const deliveryLogs = (await db.delivery_logs?.count()) || 0;
    return {
      sessions: await db.photoSessions.count(),
      customers: await db.customers.count(),
      customerNotes: (await db.customer_notes?.count()) || 0,
      customerImages: (await db.customer_images?.count()) || 0,
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
