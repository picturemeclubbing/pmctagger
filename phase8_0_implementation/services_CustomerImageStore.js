/**
 * File: /src/services/CustomerImageStore.js
 * Purpose: Handles customer image associations and local thumbnail storage (Phase 8.0)
 * Connects To: database.js, useCustomerData.js, CustomerProfilePage.jsx
 */

import { db } from './database.js';

/**
 * Add image to customer
 * @param {string} customerId
 * @param {Object} imageData - { url, filename, thumbnailUrl }
 * @returns {Promise<Object>} Created image record
 */
export async function addCustomerImage(customerId, imageData) {
  try {
    const image = {
      customerId,
      url: imageData.url,
      filename: imageData.filename,
      thumbnailUrl: imageData.thumbnailUrl,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const id = await db.customer_images.add(image);

    console.log(`[CustomerImageStore] Added image ${id} for customer: ${customerId}`);
    return { ...image, id };

  } catch (error) {
    console.error('[CustomerImageStore] Add image failed:', error);
    throw error;
  }
}

/**
 * Get all images for a customer
 * @param {string} customerId
 * @returns {Promise<Array>}
 */
export async function getCustomerImages(customerId) {
  try {
    return await db.customer_images.where('customerId').equals(customerId).toArray();
  } catch (error) {
    console.error('[CustomerImageStore] Get customer images failed:', error);
    return [];
  }
}

/**
 * Get customer images ordered by creation date (newest first)
 * @param {string} customerId
 * @returns {Promise<Array>}
 */
export async function listCustomerImages(customerId) {
  try {
    return await db.customer_images
      .where('customerId')
      .equals(customerId)
      .reverse()
      .sortBy('createdAt');
  } catch (error) {
    console.error('[CustomerImageStore] List customer images failed:', error);
    return [];
  }
}

/**
 * Update image metadata
 * @param {number} imageId
 * @param {Object} updates - Fields to update
 * @returns {Promise<boolean>}
 */
export async function updateCustomerImage(imageId, updates) {
  try {
    const updateData = {
      ...updates,
      updatedAt: new Date().toISOString()
    };

    await db.customer_images.update(imageId, updateData);

    console.log(`[CustomerImageStore] Updated image: ${imageId}`);
    return true;

  } catch (error) {
    console.error('[CustomerImageStore] Update image failed:', error);
    return false;
  }
}

/**
 * Delete customer image
 * @param {number} imageId
 * @returns {Promise<boolean>}
 */
export async function deleteCustomerImage(imageId) {
  try {
    await db.customer_images.delete(imageId);

    console.log(`[CustomerImageStore] Deleted image: ${imageId}`);
    return true;

  } catch (error) {
    console.error('[CustomerImageStore] Delete image failed:', error);
    return false;
  }
}

/**
 * Get customer image by ID
 * @param {number} imageId
 * @returns {Promise<Object|null>}
 */
export async function getCustomerImage(imageId) {
  try {
    return await db.customer_images.get(imageId);
  } catch (error) {
    console.error('[CustomerImageStore] Get image failed:', error);
    return null;
  }
}

/**
 * Bulk delete all images for a customer
 * @param {string} customerId
 * @returns {Promise<number>} Number of images deleted
 */
export async function deleteAllCustomerImages(customerId) {
  try {
    const deletedCount = await db.customer_images
      .where('customerId')
      .equals(customerId)
      .delete();

    console.log(`[CustomerImageStore] Deleted ${deletedCount} images for customer: ${customerId}`);
    return deletedCount;

  } catch (error) {
    console.error('[CustomerImageStore] Bulk delete images failed:', error);
    return 0;
  }
}

/**
 * Store image with thumbnail generation (if needed)
 * @param {string} customerId
 * @param {File|Blob} imageFile
 * @param {string} filename
 * @returns {Promise<Object>} Created image record
 */
export async function storeCustomerImage(customerId, imageFile, filename) {
  try {
    // For now, we'll store the file using a blob URL
    // In a production app, this might upload to a cloud service
    const url = URL.createObjectURL(imageFile);

    // Create a simple thumbnail (in a real app this would resize the image)
    const thumbnailUrl = url; // Using same URL for now

    return await addCustomerImage(customerId, {
      url,
      filename,
      thumbnailUrl
    });

  } catch (error) {
    console.error('[CustomerImageStore] Store image failed:', error);
    throw error;
  }
}

export default {
  addCustomerImage,
  getCustomerImages,
  listCustomerImages,
  updateCustomerImage,
  deleteCustomerImage,
  getCustomerImage,
  deleteAllCustomerImages,
  storeCustomerImage
};
