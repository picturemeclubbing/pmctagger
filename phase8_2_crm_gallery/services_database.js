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

// Version 9: Phase 8.1 - CRM Visual & Profile Enhancements (profile images)
db.version(9).stores({
  photoSessions: '++id, sessionId, createdAt, hasTags, imageName, thumbDataUrl',
  deliveryJobs: '++id, jobId, sessionId, status, createdAt',
  settings: 'key',
  customers: 'customerId, handle, name, email, phone, createdAt, lastDeliveryAt, tagCount, imagesCount, profileImageUrl, profileImageUpdatedAt',
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
 * PHASE 8.1: Set customer profile image
 * @param {string} customerId - Customer ID
 * @param {string} imageUrl - Image URL to set as profile
 * @returns {Promise<boolean>} Success status
 */
export async function setProfileImage(customerId, imageUrl) {
  try {
    await db.customers.update(customerId, {
      profileImageUrl: imageUrl,
      profileImageUpdatedAt: Date.now()
    });
    console.log(`[Database] Updated profile image for customer: ${customerId}`);
    return true;
  } catch (error) {
    console.error('[Database] Set profile image failed:', error);
    return false;
  }
}

/**
 * PHASE 8.2: Upgrade existing images with source metadata (additive)
 */
export async function upgradeCustomerImagesToV82() {
  console.log('[Database] Upgrading customer_images to v8.2 format...');
  try {
    const allImages = await db.customer_images.toArray();
    const toPut = [];

    for (const img of allImages) {
      if (img.sourceType) continue; // already upgraded

      let sourceType = 'manual';
      if (img.deliveryMethod) {
        // Heuristic: images that carry delivery metadata probably came from delivery flow
        sourceType = 'delivery';
      } else {
        // Optional debug: ambiguous cases
        console.debug('[v8.2 upgrade] Ambiguous image source; defaulting to manual', { id: img.id });
      }

      toPut.push({
        ...img,
        sourceType,
        deliveryId: img.deliveryId ?? null,
        tagData: img.tagData ?? null,
        isProfileImage: img.isProfileImage ?? false,
        uploadedBy: sourceType === 'delivery' ? 'system' : 'user',
        originalSessionId: img.originalSessionId ?? img.sessionId ?? null
      });
    }

    if (toPut.length) {
      await db.customer_images.bulkPut(toPut);
    }
    console.log(`[Database] v8.2 image upgrade complete: ${toPut.length} updated`);
    return toPut.length;
  } catch (err) {
    console.error('[Database] v8.2 image upgrade failed:', err);
    throw err;
  }
}

/**
 * PHASE 8.2: Set default profile images WITHOUT N+1 (Gemini fix - bulk processing)
 */
export async function setDefaultProfileImages() {
  console.log('[Database] Setting default profile images (bulk, no N+1)...');

  // Load only customers lacking a profile image
  const candidates = await db.customers
    .filter(c => !c.profileImageId)
    .toArray();

  if (candidates.length === 0) return 0;

  const customerIds = candidates.map(c => c.customerId);
  // Get all images for these customers in one query
  const allImages = await db.customer_images
    .where('customerId')
    .anyOf(customerIds)
    .toArray();

  // Group images by customerId
  const imgsByCustomer = new Map();
  for (const img of allImages) {
    if (!imgsByCustomer.has(img.customerId)) imgsByCustomer.set(img.customerId, []);
    imgsByCustomer.get(img.customerId).push(img);
  }

  // Choose "best" image per customer (tagged first, then newest)
  const customerUpdates = [];
  const imageUpdates = [];

  const now = Date.now();
  for (const customer of candidates) {
    const list = imgsByCustomer.get(customer.customerId) || [];
    if (list.length === 0) continue;

    // Sort: tagged first; then by createdAt desc
    list.sort((a, b) => {
      const aTagged = a.sourceType === 'tagged';
      const bTagged = b.sourceType === 'tagged';
      if (aTagged !== bTagged) return aTagged ? -1 : 1;
      return (b.createdAt || 0) - (a.createdAt || 0);
    });

    const chosen = list[0];

    // Stage customer update
    customerUpdates.push({
      customerId: customer.customerId,
      patch: {
        profileImageId: chosen.id,
        profileImageSource: chosen.sourceType || 'manual',
        profileImageUrl: chosen.url, // keep for compatibility
        profileImageUpdatedAt: now
      }
    });

    // Stage image updates (set chosen isProfileImage true, others false)
    for (const img of list) {
      const shouldBeProfile = img.id === chosen.id;
      if (img.isProfileImage !== shouldBeProfile) {
        imageUpdates.push({ ...img, isProfileImage: shouldBeProfile });
      }
    }
  }

  // Transactional bulk write
  await db.transaction('rw', [db.customers, db.customer_images], async () => {
    if (imageUpdates.length) {
      await db.customer_images.bulkPut(imageUpdates);
    }
    // Apply customer patches in transaction
    await Promise.all(
      customerUpdates.map(({ customerId, patch }) => db.customers.update(customerId, patch))
    );
  });

  console.log(`[Database] Default profile images set for ${customerUpdates.length} customers`);
  return customerUpdates.length;
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
