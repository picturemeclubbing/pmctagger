/**
 * DeliveryMaintenance.js - Automated delivery log cleanup service
 * Compatible with: Phase 7.0 - Automated Delivery & Customer Notifications
 */

import { db, getSetting } from './database.js';

// Cleanup scheduler interval ID
let cleanupScheduler = null;

/**
 * Cleanup old delivery logs beyond retention period
 * @param {number} days - Number of days to retain logs (default: 90)
 * @returns {Promise<number>} Number of deleted logs
 */
export async function cleanupOldLogs(days = 90) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    // Get actual logs count first for logging
    const logsBefore = await db.delivery_logs.count();

    // Delete logs older than cutoff
    const deletedCount = await db.delivery_logs
      .where('createdAt')
      .below(cutoffDate.toISOString())
      .delete();

    console.log(`[DeliveryMaintenance] Cleaned up ${deletedCount} delivery logs (${logsBefore - deletedCount} remaining)`);

    // Log the cleanup action to logs table
    await db.delivery_logs.add({
      deliveryId: null,
      sessionId: null,
      customerId: null,
      method: 'maintenance',
      status: 'cleanup',
      attempt: 0,
      createdAt: new Date().toISOString(),
      provider: 'system',
      responseCode: deletedCount,
      processingTime: 0,
      responseData: { action: 'logs_cleaned', deletedCount, days, cutoffDate: cutoffDate.toISOString() }
    });

    return deletedCount;
  } catch (error) {
    console.error('[DeliveryMaintenance] Cleanup failed:', error);
    return 0;
  }
}

/**
 * Schedule daily log cleanup at 3 AM local time
 */
export function scheduleLogCleanup() {
  if (cleanupScheduler) {
    clearInterval(cleanupScheduler);
  }

  // Calculate time until next 3 AM
  const now = new Date();
  const nextCleanup = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    3, 0, 0, 0 // 3:00:00.000 AM
  );

  if (now >= nextCleanup) {
    nextCleanup.setDate(nextCleanup.getDate() + 1);
  }

  const timeUntilFirstCleanup = nextCleanup - now;

  // Schedule first cleanup at next 3 AM
  console.log(`[DeliveryMaintenance] Scheduling first cleanup in ${(timeUntilFirstCleanup / 1000 / 60 / 60).toFixed(1)} hours`);

  setTimeout(() => {
    performDailyCleanup();
    // Then every 24 hours (86400000 ms)
    cleanupScheduler = setInterval(performDailyCleanup, 24 * 60 * 60 * 1000);
  }, timeUntilFirstCleanup);
}

/**
 * Perform the actual cleanup based on settings
 */
async function performDailyCleanup() {
  try {
    console.log('[DeliveryMaintenance] Starting scheduled daily cleanup');

    const retentionDays = await getSetting('logRetentionDays') || 90;
    await cleanupOldLogs(retentionDays);

  } catch (error) {
    console.error('[DeliveryMaintenance] Daily cleanup failed:', error);
  }
}

/**
 * Stop the cleanup scheduler (for development/testing)
 */
export function stopLogCleanup() {
  if (cleanupScheduler) {
    clearInterval(cleanupScheduler);
    cleanupScheduler = null;
    console.log('[DeliveryMaintenance] Cleanup scheduler stopped');
  }
}

export default {
  cleanupOldLogs,
  scheduleLogCleanup,
  stopLogCleanup
};
