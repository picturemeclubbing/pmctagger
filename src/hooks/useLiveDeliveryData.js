/**
 * useLiveDeliveryData.js - Custom React hook for live delivery data polling
 * Compatible with: Phase 7.0 - Automated Delivery & Customer Notifications
 */

import { useState, useEffect, useRef } from 'react';
import { db, getSetting } from '../services/database.js';

/**
 * Custom hook for polling live delivery data with cleanup-safe subscriptions
 * @param {number} pollInterval - Polling interval in milliseconds
 * @param {boolean} autoRefresh - Whether to auto-refresh data
 * @returns {Object} Hook state and data
 */
export function useLiveDeliveryData(pollInterval = 3000, autoRefresh = true) {
  const [data, setData] = useState({
    deliveries: [],
    logs: [],
    stats: { pending: 0, processing: 0, sent: 0, failed: 0, total: 0 }
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMounted, setIsMounted] = useState(true);

  // Use ref to store interval ID for cleanup
  const intervalRef = useRef(null);

  /**
   * Fetch live delivery data
   */
  const fetchData = async () => {
    if (!isMounted) return;

    try {
      // Fetch deliveries with service data
      const deliveries = await db.deliveries_simple
        .orderBy('createdAt')
        .reverse()
        .limit(50)
        .toArray();

      // Fetch logs with customer and session data
      const logs = await db.delivery_logs
        .orderBy('createdAt')
        .reverse()
        .limit(50)
        .toArray();

      // Enhance logs with customer and session info
      const enhancedLogs = await Promise.all(
        logs.map(async (log) => {
          const [customer, session] = await Promise.all([
            log.customerId ? db.customers.get(log.customerId) : null,
            log.sessionId ? db.photoSessions.get(log.sessionId) : null
          ]);

          return {
            ...log,
            customerName: customer?.name || customer?.handle || 'Unknown',
            customerEmail: customer?.email || '',
            sessionName: session?.imageName || session?.sessionId || 'Unknown'
          };
        })
      );

      // Calculate stats
      const stats = {
        pending: await db.deliveries_simple.where('status').equals('pending').count(),
        processing: await db.deliveries_simple.where('status').equals('processing').count(),
        sent: await db.deliveries_simple.where('status').equals('sent').count(),
        failed: await db.deliveries_simple.where('status').equals('failed').count(),
        total: 0
      };
      stats.total = stats.pending + stats.processing + stats.sent + stats.failed;

      // Enhance deliveries with customer and session info
      const enhancedDeliveries = await Promise.all(
        deliveries.map(async (delivery) => {
          const [customer, session] = await Promise.all([
            delivery.customerId ? db.customers.get(delivery.customerId) : null,
            delivery.sessionId ? db.photoSessions.get(delivery.sessionId) : null
          ]);

          return {
            ...delivery,
            customerName: customer?.name || customer?.handle || 'Unknown',
            customerEmail: customer?.email || '',
            customerPhone: customer?.phone || '',
            sessionName: session?.imageName || session?.sessionId || 'Unknown',
            attempt: delivery.attempt || 0,
            nextRetryAt: delivery.nextRetryAt || null,
            sentAt: delivery.sentAt || null
          };
        })
      );

      // Update state only if component is still mounted
      if (isMounted) {
        setData({
          deliveries: enhancedDeliveries,
          logs: enhancedLogs,
          stats
        });
        setError(null);
      }

    } catch (err) {
      if (isMounted) {
        setError(err.message || 'Failed to fetch delivery data');
        console.error('[useLiveDeliveryData] Fetch error:', err);
      }
    } finally {
      if (isMounted) {
        setIsLoading(false);
      }
    }
  };

  /**
   * Manually refresh data
   */
  const refresh = async () => {
    setIsLoading(true);
    await fetchData();
  };

  // Set mounted flag and cleanup function
  useEffect(() => {
    setIsMounted(true);

    // Initial fetch
    fetchData();

    return () => {
      setIsMounted(false);
      // Cleanup will happen in the polling effect below
    };
  }, []);

  // Polling effect with cleanup
  useEffect(() => {
    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Start new interval if auto-refresh is enabled
    if (autoRefresh && pollInterval > 0) {
      intervalRef.current = setInterval(() => {
        if (isMounted) {
          fetchData();
        }
      }, pollInterval);
    }

    // Cleanup function
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [pollInterval, autoRefresh]);

  return {
    ...data,
    isLoading,
    error,
    refresh
  };
}

export default useLiveDeliveryData;
