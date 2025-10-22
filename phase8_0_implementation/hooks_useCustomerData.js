/**
 * File: /src/hooks/useCustomerData.js
 * Purpose: React hook for CRM data management with live polling (Phase 8.0)
 * Connects To: services/CustomerStore.js, services/CustomerImageStore.js, CRMHomePage.jsx
 */

import { useState, useEffect, useRef } from 'react';
import {
  getAllCustomers,
  getCustomerStats,
  searchCustomers
} from '../services/CustomerStore.js';
import { listCustomerImages } from '../services/CustomerImageStore.js';

export function useCustomerData(options = {}) {
  // State management
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [stats, setStats] = useState({
    total: 0, active: 0, tagged: 0, withImages: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Polling control flags (useRef to avoid re-initializing timers)
  const isPollingRef = useRef(false);
  const isMountedRef = useRef(true);
  const timeoutRef = useRef(null);

  // Default polling interval (5 seconds)
  const pollInterval = options.pollInterval || 5000;

  /**
   * Fetch all customer data with statistics
   */
  const fetchCustomers = async () => {
    try {
      // Fetch customers and stats in parallel
      const [customersData, statsData] = await Promise.all([
        getAllCustomers(options),
        getCustomerStats()
      ]);

      // Calculate customers with images (asynchronous operation)
      const customerImageCounts = await Promise.all(
        customersData.map(async (customer) => {
          const images = await listCustomerImages(customer.customerId);
          return { customerId: customer.customerId, imageCount: images.length };
        })
      );

      // Create map of customerId -> imageCount
      const imageCountMap = new Map(
        customerImageCounts.map(({ customerId, imageCount }) => [customerId, imageCount])
      );

      // Update stats with image counts
      const statsWithImages = {
        ...statsData,
        withImages: customersData.filter(c => imageCountMap.get(c.customerId) > 0).length
      };

      if (isMountedRef.current) {
        setCustomers(customersData);
        setStats(statsWithImages);
        setError(null);
      }

    } catch (err) {
      console.error('[useCustomerData] Fetch failed:', err);
      if (isMountedRef.current) {
        setError(err.message);
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  /**
   * Recursive polling function using setTimeout (not setInterval)
   */
  const startPolling = () => {
    if (!isPollingRef.current || !isMountedRef.current) {
      return;
    }

    // Schedule next poll
    timeoutRef.current = setTimeout(async () => {
      await fetchCustomers();

      // Continue polling if still mounted and polling enabled
      if (isMountedRef.current && isPollingRef.current) {
        startPolling();
      }
    }, pollInterval);
  };

  /**
   * Search and filter customers
   */
  const performSearch = async (query) => {
    if (!query.trim()) {
      setFilteredCustomers(customers);
      return;
    }

    const searchResults = await searchCustomers(query);
    setFilteredCustomers(searchResults);
  };

  /**
   * Start polling for data updates
   */
  const startDataPolling = () => {
    if (!isPollingRef.current && isMountedRef.current) {
      isPollingRef.current = true;
      startPolling();
      console.log('[useCustomerData] Started polling for customer data');
    }
  };

  /**
   * Stop polling for data updates
   */
  const stopDataPolling = () => {
    isPollingRef.current = false;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    console.log('[useCustomerData] Stopped polling for customer data');
  };

  /**
   * Manual refresh of data
   */
  const refreshData = async () => {
    setIsLoading(true);
    await fetchCustomers();
  };

  /**
   * Update search query and trigger filtering
   */
  const updateSearch = async (query) => {
    setSearchQuery(query);
    if (query.trim()) {
      await performSearch(query);
    } else {
      setFilteredCustomers(customers);
    }
  };

  // Initialize on mount
  useEffect(() => {
    isMountedRef.current = true;

    // Initial data fetch
    fetchCustomers();

    // Start polling by default (can be controlled by consumer)
    if (options.autoStart !== false) {
      startDataPolling();
    }

    // Cleanup on unmount
    return () => {
      isMountedRef.current = false;
      stopDataPolling();
    };
  }, []);

  // Update filtered customers when main customer list changes
  useEffect(() => {
    if (searchQuery.trim()) {
      performSearch(searchQuery);
    } else {
      setFilteredCustomers(customers);
    }
  }, [customers, searchQuery]);

  return {
    // Data
    customers,
    filteredCustomers,
    stats,

    // State
    isLoading,
    error,

    // Search
    searchQuery,
    updateSearch,

    // Polling controls
    startDataPolling,
    stopDataPolling,

    // Manual refresh
    refreshData,

    // Computed values
    isPolling: isPollingRef.current,
    isEmpty: customers.length === 0 && !isLoading,
    hasError: !!error,
    displayCustomers: searchQuery.trim() ? filteredCustomers : customers
  };
}

export default useCustomerData;
