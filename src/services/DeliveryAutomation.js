/**
 * DeliveryAutomation.js - Automated delivery processing service
 * Compatible with: Phase 7.0 - Automated Delivery & Customer Notifications
 */

import { db, getSetting, saveSettings } from './database.js';
import { TokenBucket } from '../utils/TokenBucket.js';
import { sendEmail } from './EmailService.js';
import { sendSMS } from './TwilioService.js';
import { cleanupOldLogs } from './DeliveryMaintenance.js';

// Global state
let automationEnabled = false;
let processing = false;
let tokenBucket = null;
let automationInterval = null;

// Default values
const DEFAULTS = {
  rateLimitPerMinute: 10,
  retryAttempts: 3,
  retryDelayMs: [1000, 3000, 9000] // Progressive delays: 1s, 3s, 9s
};

/**
 * Initialize the delivery automation system
 * @returns {Promise<boolean>} Success status
 */
export async function initializeAutomation() {
  try {
    console.log('[DeliveryAutomation] Initializing...');

    const enableAutomation = await getSetting('enableAutomation');
    const autoStart = await getSetting('autoStartOnLoad');
    const rateLimit = await getSetting('rateLimitPerMinute') || DEFAULTS.rateLimitPerMinute;

    // Initialize rate limiter
    tokenBucket = new TokenBucket(60, rateLimit / 60); // Convert to tokens per second

    // Check if auto-start is enabled
    if (enableAutomation && autoStart) {
      automationEnabled = true;
      console.log('[DeliveryAutomation] Auto-starting automation');
      startAutomation();
    } else {
      automationEnabled = !!enableAutomation;
      console.log('[DeliveryAutomation] Automation ready (manual start required)');
    }

    return true;
  } catch (error) {
    console.error('[DeliveryAutomation] Initialization failed:', error);
    return false;
  }
}

/**
 * Start the delivery automation loop
 * @returns {boolean} Success status
 */
export function startAutomation() {
  if (automationEnabled && !automationInterval) {
    console.log('[DeliveryAutomation] Starting automation loop...');
    automationEnabled = true;
    processDeliveryQueue(); // Start immediately
    return true;
  }
  console.log('[DeliveryAutomation] Already running or disabled');
  return false;
}

/**
 * Stop the delivery automation loop
 */
export function stopAutomation() {
  console.log('[DeliveryAutomation] Stopping automation...');
  automationEnabled = false;
  if (automationInterval) {
    clearTimeout(automationInterval);
    automationInterval = null;
  }
}

/**
 * Get automation status and queue information
 * @returns {Promise<Object>} Status and queue data
 */
export async function getQueueStatus() {
  try {
    const pending = await db.deliveries_simple.where('status').equals('pending').count();
    const processing = await db.deliveries_simple.where('status').equals('processing').count();
    const sent = await db.deliveries_simple.where('status').equals('sent').count();
    const failed = await db.deliveries_simple.where('status').equals('failed').count();
    const total = pending + processing + sent + failed;

    return {
      automationEnabled,
      processing,
      queue: {
        pending,
        processing,
        sent,
        failed,
        total
      },
      rateLimit: tokenBucket?.tokens || 0
    };
  } catch (error) {
    console.error('[DeliveryAutomation] Failed to get queue status:', error);
    return { error: error.message };
  }
}

/**
 * Main processing loop - uses recursive setTimeout instead of setInterval
 */
function processDeliveryQueue() {
  if (!automationEnabled) {
    console.log('[DeliveryAutomation] Automation disabled, stopping loop');
    return;
  }

  // Use non-blocking setTimeout to avoid call stack issues
  setTimeout(async () => {
    try {
      await processNextDelivery();
    } catch (error) {
      console.error('[DeliveryAutomation] Loop error:', error);
    }

    // Schedule next iteration - recursive approach
    if (automationEnabled) {
      processDeliveryQueue();
    }
  }, 1000); // Check every second
}

/**
 * Process the next pending delivery using atomic locks
 * @returns {Promise<boolean>} True if processed, false if none available or rate limited
 */
async function processNextDelivery() {
  if (processing) {
    return false; // Already processing
  }

  // Check rate limiter
  if (!tokenBucket?.acquire()) {
    return false; // Rate limited
  }

  processing = true;

  try {
    // Atomically get next pending delivery and set to processing
    let delivery = null;
    await db.transaction('rw', db.deliveries_simple, async () => {
      delivery = await db.deliveries_simple
        .where('status')
        .equals('pending')
        .and(d => !d.nextRetryAt || new Date(d.nextRetryAt) <= new Date())
        .first();

      if (delivery) {
        // Atomically update to processing status
        await db.deliveries_simple.update(delivery.id, {
          status: 'processing'
        });
      }
    });

    if (!delivery) {
      processing = false;
      return false; // No eligible deliveries
    }

    console.log(`[DeliveryAutomation] Processing delivery ${delivery.id} (${delivery.method} to ${delivery.customerId})`);

    // Process the delivery
    await processDelivery(delivery);

    return true;

  } catch (error) {
    console.error('[DeliveryAutomation] Processing error:', error);
    return false;
  } finally {
    processing = false;
  }
}

/**
 * Process a single delivery item
 * @param {Object} delivery - Delivery record
 */
async function processDelivery(delivery) {
  const startTime = Date.now();
  const result = await sendDelivery(delivery);

  try {
    // Update delivery record
    const updateData = {
      attempt: (delivery.attempt || 0) + 1
    };

    if (result.success) {
      updateData.status = 'sent';
      updateData.sentAt = new Date().toISOString();
    } else {
      const maxAttempts = await getSetting('retryAttempts') || DEFAULTS.retryAttempts;

      if (updateData.attempt >= maxAttempts) {
        updateData.status = 'failed';
      } else {
        updateData.status = 'pending';
        // Calculate progressive retry delay
        const delayIndex = Math.min(updateData.attempt - 1, DEFAULTS.retryDelayMs.length - 1);
        updateData.nextRetryAt = new Date(Date.now() + DEFAULTS.retryDelayMs[delayIndex]).toISOString();
        console.log(`[DeliveryAutomation] Delivery ${delivery.id} failed, retrying in ${(DEFAULTS.retryDelayMs[delayIndex] / 1000)}s`);
      }
    }

    // Update delivery
    await db.deliveries_simple.update(delivery.id, updateData);

    // Log the attempt
    await db.delivery_logs.add({
      deliveryId: delivery.id,
      sessionId: delivery.sessionId,
      customerId: delivery.customerId,
      method: delivery.method,
      status: result.success ? 'sent' : 'failed',
      attempt: updateData.attempt,
      createdAt: new Date().toISOString(),
      provider: result.provider,
      responseCode: result.status || result.errorCode,
      processingTime: Date.now() - startTime,
      responseData: {
        ...result,
        attempt: updateData.attempt,
        nextRetryAt: updateData.nextRetryAt
      }
    });

    if (result.success) {
      console.log(`[DeliveryAutomation] ✓ Delivery ${delivery.id} sent successfully`);
    } else {
      console.log(`[DeliveryAutomation] ✗ Delivery ${delivery.id} failed: ${result.errorMessage || result.errorCode}`);
    }

  } catch (error) {
    console.error('[DeliveryAutomation] Failed to update delivery status:', error);
  }
}

/**
 * Send delivery using appropriate provider
 * @param {Object} delivery - Delivery record
 * @returns {Promise<Object>} Send result
 */
async function sendDelivery(delivery) {
  try {
    // Get customer data
    const customer = await db.customers.get(delivery.customerId);

    if (!customer) {
      return {
        success: false,
        errorCode: 'CUSTOMER_NOT_FOUND',
        errorMessage: 'Customer not found',
        provider: delivery.method
      };
    }

    // Get session data for context
    const session = await db.photoSessions.get(delivery.sessionId);
    const sessionData = session ? { sessionId: session.sessionId, imageName: session.imageName } : {};

    // Get image URL (could be session-based or delivery-specific)
    const imageUrl = delivery.imageUrl || (session ? session.thumbDataUrl : null);

    if (!imageUrl) {
      return {
        success: false,
        errorCode: 'NO_IMAGE_URL',
        errorMessage: 'No image URL available for delivery',
        provider: delivery.method
      };
    }

    // Route to appropriate provider
    switch (delivery.method) {
      case 'email':
        return await sendEmail(customer.email, imageUrl, sessionData);

      case 'sms':
        return await sendSMS(customer.phone, null, 'Your tagged photos are ready! 📸');

      case 'mms':
        return await sendSMS(customer.phone, imageUrl, 'Your tagged photos are attached! 📸');

      default:
        return {
          success: false,
          errorCode: 'UNSUPPORTED_METHOD',
          errorMessage: `Unsupported delivery method: ${delivery.method}`,
          provider: delivery.method
        };
    }

  } catch (error) {
    return {
      success: false,
      errorCode: 'INTERNAL_ERROR',
      errorMessage: error.message || 'Internal processing error',
      provider: delivery.method
    };
  }
}

export default {
  initializeAutomation,
  startAutomation,
  stopAutomation,
  getQueueStatus,
  processDeliveryQueue
};
