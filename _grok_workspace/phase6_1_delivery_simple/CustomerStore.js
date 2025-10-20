/**
 * File: /src/services/CustomerStore.js
 * Purpose: Customer CRM management with handle-based lookup for tag auto-linking
 * Connects To: database.js (Dexie), SocialTagger.jsx, normalizeHandle helper
 */

import { db } from './database';
import { normalizeHandle } from '../utils/helpers';

/**
 * Add a new customer to the CRM database
 * @param {Object} customerData - { handle, name, phone?, email? }
 * @returns {Promise<Object>} Created customer with id
 */
export async function addCustomer(customerData) {
  const { handle, name, phone, email } = customerData;

  if (!handle || !name) {
    throw new Error('[CustomerStore.addCustomer] Handle and name are required');
  }

  // Normalize handle (ensure @ prefix, lowercase, trim)
  const normalizedHandle = normalizeHandle(handle);

  // Check if customer already exists
  const existing = await db.customers
    .where('handle')
    .equals(normalizedHandle)
    .first();

  if (existing) {
    throw new Error(`Customer with handle ${normalizedHandle} already exists`);
  }

  const customer = {
    handle: normalizedHandle,
    name: name.trim(),
    phone: phone?.trim() || null,
    email: email?.trim() || null,
    createdAt: Date.now(),
    linkedSessions: []
  };

  const id = await db.customers.add(customer);
  return { ...customer, id };
}

/**
 * Find customer by Instagram handle (case-insensitive)
 * @param {string} handle - Instagram handle (with or without @)
 * @returns {Promise<Object|null>} Customer object or null if not found
 */
export async function getCustomerByHandle(handle) {
  if (!handle) return null;

  // Normalize the search handle
  const normalizedHandle = normalizeHandle(handle);

  const customer = await db.customers
    .where('handle')
    .equals(normalizedHandle)
    .first();

  return customer || null;
}

/**
 * Get customer by ID
 * @param {number} id - Customer ID
 * @returns {Promise<Object|null>} Customer object or null
 */
export async function getCustomerById(id) {
  return await db.customers.get(id);
}

/**
 * Update customer information
 * @param {number} id - Customer ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated customer
 */
export async function updateCustomer(id, updates) {
  const existing = await db.customers.get(id);
  if (!existing) {
    throw new Error(`[CustomerStore.updateCustomer] Customer ${id} not found`);
  }

  // If handle is being updated, normalize it
  if (updates.handle) {
    updates.handle = normalizeHandle(updates.handle);
  }

  const updated = { ...existing, ...updates };
  await db.customers.put(updated);
  return updated;
}

/**
 * Delete customer by ID
 * @param {number} id - Customer ID
 */
export async function deleteCustomer(id) {
  await db.customers.delete(id);
}

/**
 * List all customers with optional filtering
 * @param {Object} filters - { searchText?, sortBy? }
 * @returns {Promise<Array>} Array of customer objects
 */
export async function listCustomers(filters = {}) {
  let collection = db.customers.toCollection();

  // Search filter (name or handle)
  if (filters.searchText) {
    const search = filters.searchText.toLowerCase();
    collection = collection.filter(customer =>
      customer.name.toLowerCase().includes(search) ||
      customer.handle.toLowerCase().includes(search) ||
      customer.email?.toLowerCase().includes(search)
    );
  }

  // Sort by name by default
  const customers = await collection.toArray();
  customers.sort((a, b) => a.name.localeCompare(b.name));

  return customers;
}

/**
 * Link a customer to a session
 * @param {number} customerId - Customer ID
 * @param {string} sessionId - Session ID to link
 */
export async function linkCustomerToSession(customerId, sessionId) {
  const customer = await db.customers.get(customerId);
  if (!customer) {
    throw new Error(`[CustomerStore.linkCustomerToSession] Customer ${customerId} not found`);
  }

  // Add sessionId to linkedSessions if not already present
  const linkedSessions = customer.linkedSessions || [];
  if (!linkedSessions.includes(sessionId)) {
    linkedSessions.push(sessionId);
    await db.customers.update(customerId, { linkedSessions });
  }
}

/**
 * Add or update customer (for delivery workflow - Phase 6.0a)
 * Checks for existing customer by phone or email
 * Updates if found, creates new if not found
 *
 * @param {Object} customerData - { name, phone, email? }
 * @returns {Promise<Object>} Customer record with id
 */
export async function addOrUpdateCustomer(customerData) {
  const { name, phone, email } = customerData;

  if (!name || !phone) {
    throw new Error('[CustomerStore.addOrUpdateCustomer] Name and phone are required');
  }

  const cleanPhone = phone.trim();
  const cleanEmail = email?.trim() || null;
  const cleanName = name.trim();

  // Search for existing customer by phone
  let existing = await db.customers
    .where('phone')
    .equals(cleanPhone)
    .first();

  // If not found by phone, try email (if provided)
  if (!existing && cleanEmail) {
    existing = await db.customers
      .where('email')
      .equals(cleanEmail)
      .first();
  }

  if (existing) {
    // Update existing customer
    const updated = {
      ...existing,
      name: cleanName, // Update name
      phone: cleanPhone, // Update phone
      email: cleanEmail || existing.email, // Update email if provided
    };

    await db.customers.put(updated);
    console.log('[CustomerStore] Updated existing customer:', existing.id);
    return updated;
  }

  // Create new customer
  const newCustomer = {
    handle: null, // Will be set later when linking tags
    name: cleanName,
    phone: cleanPhone,
    email: cleanEmail,
    createdAt: Date.now(),
    linkedSessions: []
  };

  const id = await db.customers.add(newCustomer);
  console.log('[CustomerStore] Created new customer:', id);

  return { ...newCustomer, id };
}

/**
 * Seed initial test customers (for development/testing)
 * @returns {Promise<void>}
 */
export async function seedTestCustomers() {
  const testCustomers = [
    { handle: '@john_doe', name: 'John Doe', phone: '313-555-0101', email: 'john@example.com' },
    { handle: '@jane_smith', name: 'Jane Smith', phone: '313-555-0102', email: 'jane@example.com' },
    { handle: '@mike_jones', name: 'Mike Jones', phone: '313-555-0103', email: 'mike@example.com' }
  ];

  for (const customer of testCustomers) {
    try {
      await addCustomer(customer);
      console.log(`[CustomerStore] Seeded: ${customer.handle}`);
    } catch (err) {
      // Ignore if already exists
      if (!err.message.includes('already exists')) {
        console.error(`[CustomerStore] Seed error:`, err);
      }
    }
  }
}

// ============================================================================
// LEGACY FUNCTIONS (for backward compatibility)
// ============================================================================

// Link a session to a customer (legacy)
export async function linkSessionToCustomer(sessionId, customerId) {
  return await db.photoSessions.update(sessionId, { customerId });
}

// Find existing customer by phone or email (legacy)
export async function findCustomerByContact({ phone, email }) {
  if (!phone && !email) return null;

  let customers = [];

  if (phone) {
    const byPhone = await db.customers.where('phone').equals(phone).toArray();
    customers = customers.concat(byPhone);
  }

  if (email) {
    const byEmail = await db.customers.where('email').equals(email).toArray();
    customers = customers.concat(byEmail);
  }

  // Return the first match if any exists
  return customers.length > 0 ? customers[0] : null;
}

// ============================================================================
// EXPORT ALL FUNCTIONS
// ============================================================================

export default {
  addCustomer,
  addOrUpdateCustomer,
  getCustomerByHandle,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  listCustomers,
  linkCustomerToSession,
  seedTestCustomers,
  // Legacy exports
  linkSessionToCustomer,
  findCustomerByContact
};
