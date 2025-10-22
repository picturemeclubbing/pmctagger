/**
 * File: /src/services/CustomerStore.js
 * Purpose: Core customer CRUD operations and search service (Phase 8.0)
 * Connects To: database.js, DeliveryAutomation.js, useCustomerData.js
 */

import { db, getSetting } from './database.js';

/**
 * Create or update a customer record
 * @param {Object} customerData - Customer information
 * @returns {Promise<Object>} Created/updated customer
 */
export async function upsertCustomer(customerData) {
  try {
    const { customerId, ...data } = customerData;

    if (!customerId) {
      throw new Error('customerId is required');
    }

    const existingCustomer = await db.customers.get(customerId);

    const customer = {
      ...existingCustomer,
      ...data,
      customerId,
      updatedAt: new Date().toISOString()
    };

    await db.customers.put(customer);

    console.log(`[CustomerStore] ${existingCustomer ? 'Updated' : 'Created'} customer: ${customerId}`);
    return customer;

  } catch (error) {
    console.error('[CustomerStore] Upsert customer failed:', error);
    throw error;
  }
}

/**
 * Get customer by handle (case-insensitive)
 * @param {string} handle - Customer handle (with or without @)
 * @returns {Promise<Object|null>}
 */
export async function getCustomerByHandle(handle) {
  try {
    if (!handle) return null;

    // Normalize handle (remove @, trim, lowercase)
    const normalizedHandle = handle.trim().replace(/^@/, '').toLowerCase();

    // Since customerId can be a handle, email, or phone,
    // we need to search through the handle field specifically
    const customers = await db.customers.toArray();
    const customer = customers.find(c =>
      c.handle && c.handle.replace(/^@/, '').toLowerCase() === normalizedHandle
    );

    return customer || null;
  } catch (error) {
    console.error('[CustomerStore] Get customer by handle failed:', error);
    return null;
  }
}

/**
 * Get customer by ID
 * @param {string} customerId
 * @returns {Promise<Object|null>}
 */
export async function getCustomerById(customerId) {
  try {
    return await db.customers.get(customerId);
  } catch (error) {
    console.error('[CustomerStore] Get customer failed:', error);
    return null;
  }
}

/**
 * LEGACY: Add or update customer (for older delivery integration)
 * @param {Object} customerData - { customerId?, name, phone, email?, ...other fields }
 * @returns {Promise<Object>} Created or updated customer record
 */
export async function addOrUpdateCustomer(customerData) {
  try {
    if (!customerData) return null;

    // Try to find existing customer by different criteria
    let existing = null;

    // If customerId provided, use it directly
    if (customerData.customerId) {
      existing = await db.customers.get(customerData.customerId);
    }

    // If not found by customerId, try phone number (legacy behavior)
    if (!existing && customerData.phone) {
      const customersArray = await db.customers.toArray();
      existing = customersArray.find(c => c.phone === customerData.phone);
    }

    // If not found by phone, try email
    if (!existing && customerData.email) {
      const customersArray = await db.customers.toArray();
      existing = customersArray.find(c => c.email === customerData.email);
    }

    const now = new Date().toISOString();

    if (existing) {
      // Update existing customer
      const updatedData = {
        ...existing,
        ...customerData,
        updatedAt: now,
        customerId: existing.customerId // Preserve existing customerId
      };
      await db.customers.put(updatedData);
      console.log(`[CustomerStore] Updated existing customer: ${existing.customerId}`);
      return updatedData;
    } else {
      // Create new customer
      const newCustomerId = customerData.customerId ||
                           customerData.phone ||
                           customerData.email ||
                           `customer_${Date.now()}`;

      const newCustomer = {
        customerId: newCustomerId,
        handle: '',
        name: customerData.name || '',
        phone: customerData.phone || '',
        email: customerData.email || '',
        createdAt: now,
        lastDeliveryAt: null,
        tagCount: 0,
        imagesCount: 0,
        updatedAt: now
      };

      await db.customers.put(newCustomer);
      console.log(`[CustomerStore] Created new customer: ${newCustomerId}`);
      return newCustomer;
    }
  } catch (error) {
    console.error('[CustomerStore] addOrUpdateCustomer failed:', error);
    throw error;
  }
}

/**
 * LEGACY: List all customers with optional filtering (for compatibility)
 * @param {Object} filters - { searchText?, sortBy? }
 * @returns {Promise<Array>} Array of customer objects
 */
export async function listCustomers(filters = {}) {
  try {
    let collection = db.customers.toCollection();

    // Search filter (name or handle)
    if (filters.searchText) {
      const search = filters.searchText.toLowerCase();
      collection = collection.filter(customer =>
        customer.name?.toLowerCase().includes(search) ||
        customer.handle?.toLowerCase().includes(search) ||
        customer.email?.toLowerCase().includes(search)
      );
    }

    // Sort by name by default (if no custom sort specified)
    if (!filters.sortBy) {
      const customers = await collection.toArray();
      customers.sort((a, b) => a.name?.localeCompare(b.name) || b.createdAt - a.createdAt);
      return customers;
    }

    return await collection.toArray();

  } catch (error) {
    console.error('[CustomerStore] List customers failed:', error);
    return [];
  }
}

/**
 * Search customers by name or handle using Dexie indexing
 * @param {string} query - Search query (case insensitive)
 * @returns {Promise<Array>}
 */
export async function searchCustomers(query) {
  try {
    if (!query || query.trim().length === 0) {
      return [];
    }

    const searchTerm = query.toLowerCase().trim();

    // Use Promise.all to search both name and handle in parallel
    const [nameResults, handleResults] = await Promise.all([
      // Search by name (case insensitive prefix)
      db.customers.where('name').startsWithIgnoreCase(searchTerm).toArray(),
      // Search by handle (case insensitive prefix)
      db.customers.where('handle').startsWithIgnoreCase(searchTerm).toArray()
    ]);

    // Merge results and deduplicate using Map
    const customerMap = new Map();

    // Add name results
    nameResults.forEach(customer => {
      customerMap.set(customer.customerId, customer);
    });

    // Add handle results (may overlap with name results)
    handleResults.forEach(customer => {
      customerMap.set(customer.customerId, customer);
    });

    return Array.from(customerMap.values());

  } catch (error) {
    console.error('[CustomerStore] Search customers failed:', error);
    return [];
  }
}

/**
 * Get all customers (with optional filtering)
 * @param {Object} options - Filter options { activeOnly, withImages }
 * @returns {Promise<Array>}
 */
export async function getAllCustomers(options = {}) {
  try {
    let collection = db.customers.orderBy('createdAt');

    if (options.activeOnly) {
      // Active customers: lastDeliveryAt within 30 days
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      collection = collection.filter(customer =>
        customer.lastDeliveryAt && new Date(customer.lastDeliveryAt) > thirtyDaysAgo
      );
    }

    return await collection.toArray();

  } catch (error) {
    console.error('[CustomerStore] Get all customers failed:', error);
    return [];
  }
}

/**
 * Delete customer and all associated data
 * @param {string} customerId
 * @returns {Promise<boolean>}
 */
export async function deleteCustomer(customerId) {
  try {
    // Delete customer and associated data in transaction
    await Promise.all([
      db.customers.delete(customerId),
      // Clean up related data (will be handled by cascade in React components)
      db.customer_notes.where('customerId').equals(customerId).delete(),
      db.customer_images.where('customerId').equals(customerId).delete(),
      // Update delivery references (customerId becomes null or inactive)
    ]);

    console.log(`[CustomerStore] Deleted customer: ${customerId}`);
    return true;

  } catch (error) {
    console.error('[CustomerStore] Delete customer failed:', error);
    return false;
  }
}

/**
 * Attach delivery event to customer (updates lastDeliveryAt, etc.)
 * @param {string} customerId
 * @param {string} deliveryAt - ISO timestamp
 * @param {number} tagCount - Number of tags in this session
 * @returns {Promise<boolean>}
 */
export async function attachDeliveryEvent(customerId, deliveryAt, tagCount = 0) {
  try {
    const customer = await getCustomerById(customerId);

    if (!customer) {
      // Create customer record if it doesn't exist
      await upsertCustomer({
        customerId,
        handle: customerId, // Use customerId as handle initially
        name: '',
        email: '',
        phone: '',
        createdAt: deliveryAt,
        lastDeliveryAt: deliveryAt,
        tagCount: tagCount
      });
    } else {
      // Update existing customer
      await upsertCustomer({
        ...customer,
        lastDeliveryAt: deliveryAt,
        tagCount: Math.max(customer.tagCount || 0, tagCount)
      });
    }

    console.log(`[CustomerStore] Attached delivery event for: ${customerId}`);
    return true;

  } catch (error) {
    console.error('[CustomerStore] Attach delivery event failed:', error);
    return false;
  }
}

/**
 * PHASE 8.1: Get customer tags/deliveries for profile display
 * @param {string} customerId
 * @returns {Promise<Array>} Array of deliveries/tags for this customer
 */
export async function getCustomerTags(customerId) {
  try {
    // Query deliveries_simple for customer's deliveries (which represent tags)
    const deliveries = await db.deliveries_simple
      .where('customerId')
      .equals(customerId)
      .sortBy('createdAt');

    return deliveries;

  } catch (error) {
    console.error('[CustomerStore] Get customer tags failed:', error);
    return [];
  }
}

/**
 * PHASE 8.2: Update customer profile image (transactional)
 * @param {string} customerId
 * @param {number} imageId - Image to set as profile
 * @returns {Promise<boolean>}
 */
export async function updateProfileImage(customerId, imageId) {
  try {
    // Get the image to set as profile
    const image = await db.customer_images.get(imageId);
    if (!image) {
      throw new Error(`Image ${imageId} not found`);
    }

    // Clear profile flag from all other images for this customer
    const customerImages = await db.customer_images.where('customerId').equals(customerId).toArray();
    const imagesToUpdate = customerImages
      .filter(img => img.id !== imageId && img.isProfileImage)
      .map(img => ({ ...img, isProfileImage: false }));

    // Set new profile image
    imagesToUpdate.push({ ...image, isProfileImage: true });

    // Update customer profile
    const customerUpdate = {
      profileImageId: imageId,
      profileImageSource: image.sourceType || 'manual',
      profileImageUrl: image.url,
      profileImageUpdatedAt: Date.now()
    };

    await db.transaction('rw', [db.customers, db.customer_images], async () => {
      await db.customers.update(customerId, customerUpdate);
      if (imagesToUpdate.length > 0) {
        await db.customer_images.bulkPut(imagesToUpdate);
      }
    });

    console.log(`[CustomerStore] Updated profile image for customer ${customerId} to image ${imageId}`);
    return true;

  } catch (error) {
    console.error('[CustomerStore] Update profile image failed:', error);
    return false;
  }
}

/**
 * PHASE 8.2: Get customer profile image info
 * @param {string} customerId
 * @returns {Promise<Object|null>} Profile image info or null
 */
export async function getProfileImage(customerId) {
  try {
    const customer = await getCustomerById(customerId);
    if (!customer?.profileImageId) return null;

    const image = await db.customer_images.get(customer.profileImageId);
    return image || null;

  } catch (error) {
    console.error('[CustomerStore] Get profile image failed:', error);
    return null;
  }
}

/**
 * PHASE 8.2: Find or create customer by handle (for delivery/tag linkage)
 * @param {string} handle - Customer handle
 * @returns {Promise<Object>} Customer object
 */
export async function findOrCreateCustomerByHandle(handle) {
  try {
    const existing = await getCustomerByHandle(handle);
    if (existing) return existing;

    // Create new customer with handle
    const newCustomer = await upsertCustomer({
      customerId: handle, // Use handle as customerId initially
      handle: handle,
      name: '',
      email: '',
      phone: '',
      createdAt: new Date().toISOString(),
      lastDeliveryAt: null,
      tagCount: 0,
      imagesCount: 0
    });

    console.log(`[CustomerStore] Created new customer by handle: ${handle}`);
    return newCustomer;

  } catch (error) {
    console.error('[CustomerStore] Find or create by handle failed:', error);
    throw error;
  }
}

/**
 * Get customer statistics
 * @returns {Promise<Object>}
 */
export async function getCustomerStats() {
  try {
    const customers = await db.customers.toArray();
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const stats = {
      total: customers.length,
      active: customers.filter(c => c.lastDeliveryAt && new Date(c.lastDeliveryAt) > thirtyDaysAgo).length,
      tagged: customers.filter(c => (c.tagCount || 0) > 0).length,
      withImages: 0 // Will be calculated by useCustomerData hook
    };

    return stats;

  } catch (error) {
    console.error('[CustomerStore] Get customer stats failed:', error);
    return { total: 0, active: 0, tagged: 0, withImages: 0 };
  }
}

export default {
  upsertCustomer,
  getCustomerByHandle,
  getCustomerById,
  addOrUpdateCustomer,
  listCustomers,
  searchCustomers,
  getAllCustomers,
  deleteCustomer,
  attachDeliveryEvent,
  getCustomerStats,
  getCustomerTags,
  updateProfileImage,
  getProfileImage,
  findOrCreateCustomerByHandle
};
