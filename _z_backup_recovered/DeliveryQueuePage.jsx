/**
 * File: /src/pages/DeliveryQueuePage.jsx
 * Purpose: View and manage pending/sent photo deliveries (Phase 6.0b-R1 Refactored)
 * Connects To: DeliveryQueue.js, DeliveryItem.jsx, useDebug
 */
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import useDebug from '../debug/useDebug';
import * as DeliveryQueue from '../services/DeliveryQueue';
import DeliveryItem, { DeliveryItemSkeleton } from '../components/DeliveryItem';

// A simple, non-blocking confirmation modal component
function ConfirmModal({ show, title, message, onConfirm, onCancel }) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 shadow-xl max-w-sm w-full border border-gray-700">
        <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
        <p className="text-gray-400 mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white font-semibold rounded-lg">
            Cancel
          </button>
          <button onClick={onConfirm} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg">
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

function DeliveryQueuePage() {
  const debug = useDebug('DELIVERY');
  const [deliveries, setDeliveries] = useState([]);
  const [filter, setFilter] = useState('pending'); // 'pending' | 'sent' | 'all'
  const [stats, setStats] = useState({ total: 0, pending: 0, sent: 0, failed: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [modalState, setModalState] = useState({ show: false, title: '', message: '', onConfirm: null });

  const loadStats = useCallback(async () => {
    try {
      const deliveryStats = await DeliveryQueue.getDeliveryStats();
      setStats(deliveryStats);
    } catch (error) {
      debug.error('stats_load_failed', { message: error.message });
    }
  }, [debug]);

  const loadDeliveries = useCallback(async () => {
    debug.trace('load_start', { filter });
    setIsLoading(true);
    try {
      let data;
      if (filter === 'pending') data = await DeliveryQueue.listPending();
      else if (filter === 'sent') data = await DeliveryQueue.listSent();
      else data = await DeliveryQueue.listAll();

      setDeliveries(data);
      debug.info('deliveries_loaded', { filter, count: data.length });
    } catch (error) {
      debug.error('load_failed', { error: error.message });
      setDeliveries([]); // Clear list on error
    } finally {
      setIsLoading(false);
    }
  }, [filter, debug]);

  // Effect for initial stats load (runs once)
  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // Effect for loading deliveries when filter changes
  useEffect(() => {
    loadDeliveries();
  }, [loadDeliveries]);

  const handleMarkSent = (id) => {
    setModalState({
      show: true,
      title: 'Confirm Action',
      message: 'Mark this delivery as sent? This will update the status permanently.',
      onConfirm: async () => {
        debug.info('mark_sent_confirmed', { id });
        try {
          await DeliveryQueue.markSent(id, 'manual');
          debug.info('delivery_marked_sent', { id });
          // Refresh both list and stats for accuracy
          await Promise.all([loadDeliveries(), loadStats()]);
        } catch (error) {
          debug.error('mark_sent_failed', { id, error: error.message });
        }
        setModalState({ show: false }); // Close modal
      },
    });
  };

  const handleRetry = async (id) => {
      debug.info('retry_delivery_triggered', { id });
      try {
        await DeliveryQueue.retryDelivery(id);
        debug.info('delivery_retry_queued', { id });
        await Promise.all([loadDeliveries(), loadStats()]);
      } catch (error) {
        debug.error('retry_failed', { id, error: error.message });
      }
  };

  const closeModal = () => setModalState({ show: false });

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <ConfirmModal {...modalState} onCancel={closeModal} />
      {/* Header & Filter Bar omitted for brevity but would be here */}
      <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-10 p-4">
        <div className="max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold">📦 Delivery Queue</h1>
            <p className="text-sm text-gray-400 mt-1">
              Showing {isLoading ? '...' : deliveries.length} of {stats.total} total deliveries
            </p>
            <div className="flex items-center gap-3 mt-4">
                 <button onClick={() => setFilter('pending')} className={`px-4 py-2 rounded-lg font-medium ${filter === 'pending' ? 'bg-blue-600' : 'bg-gray-700'}`}>
                    ⏳ Pending ({stats.pending})
                 </button>
                 <button onClick={() => setFilter('sent')} className={`px-4 py-2 rounded-lg font-medium ${filter === 'sent' ? 'bg-blue-600' : 'bg-gray-700'}`}>
                    ✅ Sent ({stats.sent})
                 </button>
                 <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-lg font-medium ${filter === 'all' ? 'bg-blue-600' : 'bg-gray-700'}`}>
                    📋 All ({stats.total})
                 </button>
            </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 py-6 w-full">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => <DeliveryItemSkeleton key={i} />)}
          </div>
        ) : deliveries.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📭</div>
            <h2 className="text-2xl font-bold">Queue is Empty</h2>
            <p className="text-gray-400">No deliveries match the current filter.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {deliveries.map(delivery => (
              <DeliveryItem
                key={delivery.id}
                delivery={delivery}
                onMarkSent={handleMarkSent}
                onRetry={handleRetry}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default DeliveryQueuePage;
