/**
 * File: /src/pages/SessionDetailPage.jsx
 * Purpose: Full-screen session detail view with actions (Phase 5.4a MVP)
 * Connects To: SessionStore, SessionMeta, DebugContext, Router
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import useDebug from '../debug/useDebug';
import { getSession, deleteSession } from '../services/SessionStore';
import { blobToDataURL } from '../utils/helpers';
import SessionMeta from '../components/session/SessionMeta';
import { createAndSendEmail, createAndSendSMS, listDeliveries } from '../services/DeliverySimple';
import { listCustomers } from '../services/CustomerStore';

function SessionDetailPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const debug = useDebug('SESSION');

  const [session, setSession] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deliveries, setDeliveries] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [customerMap, setCustomerMap] = useState(new Map());
  const [deliveryFeedback, setDeliveryFeedback] = useState('');

  useEffect(() => {
    loadSession();

    // Cleanup image URL on unmount
    return () => {
      if (imageUrl) URL.revokeObjectURL(imageUrl);
    };
  }, [sessionId]);

  const loadSession = async () => {
    debug.time('session_load');
    setIsLoading(true);

    try {
      const sessionData = await getSession(sessionId);

      if (!sessionData) {
        debug.error('session_not_found', { sessionId });
        throw new Error('Session not found');
      }

      setSession(sessionData);

      // Convert blob to URL for display
      if (sessionData.rawImageBlob) {
        const url = await blobToDataURL(sessionData.rawImageBlob);
        setImageUrl(url);
      }

      debug.timeEnd('session_load', {
        sessionId,
        hasTags: sessionData.hasTags,
        tagCount: sessionData.tagsMeta?.length || 0
      });
      debug.success('session_loaded', { sessionId });
    } catch (error) {
      debug.error('load_failed', { sessionId, error: error.message });
      // Redirect to gallery if session not found
      setTimeout(() => navigate('/gallery'), 2000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTagAgain = () => {
    debug.log('navigate_to_tagging', { sessionId });
    navigate(`/tag/${sessionId}`);
  };

  const handleShare = () => {
    debug.log('navigate_to_share', { sessionId });
    navigate(`/share/${sessionId}`);
  };

  const handleDelete = async () => {
    // Confirm deletion
    const confirmed = window.confirm(
      'Delete this session permanently? This cannot be undone.'
    );

    if (!confirmed) {
      debug.log('delete_cancelled', { sessionId });
      return;
    }

    debug.time('session_delete');
    setIsDeleting(true);

    try {
      await deleteSession(sessionId);

      debug.timeEnd('session_delete', { sessionId });
      debug.warn('session_deleted', { sessionId });

      // Navigate back to gallery
      navigate('/gallery');
    } catch (error) {
      debug.error('delete_failed', { sessionId, error: error.message });
      setIsDeleting(false);
    }
  };

  // PHASE 6.2f: Load deliveries and customers for session delivery functionality
  useEffect(() => {
    loadDeliveriesAndCustomers();
  }, [sessionId]);

  const loadDeliveriesAndCustomers = async () => {
    try {
      // Load deliveries for this session using optimized anyOf query
      const sessionDeliveries = await listDeliveries({ sessionIds: [sessionId] });
      setDeliveries(sessionDeliveries);

      // Load customers for delivery creation
      const customersData = await listCustomers();
      setCustomers(customersData);

      // Create efficient customer lookup map
      const map = new Map();
      customersData.forEach(customer => {
        map.set(customer.id, customer);
      });
      setCustomerMap(map);

      debug.log('deliveries_and_customers_loaded', {
        sessionId,
        deliveries: sessionDeliveries.length,
        customers: customersData.length
      });
    } catch (error) {
      debug.error('load_deliveries_customers_failed', error.message);
    }
  };

  const handleCreateAndSendEmail = async (customerId) => {
    try {
      const customer = customerMap.get(customerId);
      if (!customer) throw new Error('Customer not found');

      const result = await createAndSendEmail(sessionId, customerId);
      setDeliveryFeedback('⚡ Atomic Email Sent!');
      await loadDeliveriesAndCustomers(); // Refresh deliveries

      setTimeout(() => setDeliveryFeedback(''), 3000);
    } catch (error) {
      debug.error('create_and_send_email_failed', error.message);
      setDeliveryFeedback(`❌ Error: ${error.message}`);
      setTimeout(() => setDeliveryFeedback(''), 3000);
    }
  };

  const handleCreateAndSendSMS = async (customerId) => {
    try {
      const customer = customerMap.get(customerId);
      if (!customer) throw new Error('Customer not found');

      const result = await createAndSendSMS(sessionId, customerId);
      setDeliveryFeedback('⚡ Atomic SMS Sent!');
      await loadDeliveriesAndCustomers(); // Refresh deliveries

      setTimeout(() => setDeliveryFeedback(''), 3000);
    } catch (error) {
      debug.error('create_and_send_sms_failed', error.message);
      setDeliveryFeedback(`❌ Error: ${error.message}`);
      setTimeout(() => setDeliveryFeedback(''), 3000);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="text-6xl mb-4">⏳</div>
          <p className="text-lg">Loading session...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold mb-2">Session Not Found</h2>
          <p className="text-gray-400 mb-6">
            This session may have been deleted or doesn't exist.
          </p>
          <Link
            to="/gallery"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Return to Gallery
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                to="/gallery"
                className="text-gray-300 hover:text-white transition-colors"
              >
                ← Back to Gallery
              </Link>
              <h1 className="text-xl font-bold text-white">
                📄 Session Detail
              </h1>
            </div>

            {/* Delete Button (header) */}
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="
                px-4 py-2 bg-red-600 hover:bg-red-700
                text-white font-medium rounded-lg
                transition-colors disabled:opacity-50
                text-sm
              "
            >
              {isDeleting ? 'Deleting...' : '🗑️ Delete'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Image Preview */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              Image Preview
            </h2>

            <div className="relative bg-gray-900 rounded-lg overflow-hidden">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={session.imageName || 'Session image'}
                  className="w-full h-auto object-contain max-h-[600px]"
                />
              ) : (
                <div className="w-full aspect-square flex items-center justify-center">
                  <span className="text-8xl opacity-30">📷</span>
                </div>
              )}

              {/* Status Badge Overlay */}
              <div className="absolute top-4 right-4">
                {session.hasTags ? (
                  <span className="px-3 py-1.5 bg-green-500 text-white text-sm font-bold rounded-full shadow-lg flex items-center gap-2">
                    <span>✓</span>
                    <span>Tagged</span>
                  </span>
                ) : (
                  <span className="px-3 py-1.5 bg-gray-400 text-white text-sm font-bold rounded-full shadow-lg">
                    Raw
                  </span>
                )}
              </div>

              {/* Tag Count Badge */}
              {session.hasTags && session.tagsMeta && session.tagsMeta.length > 0 && (
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1.5 bg-blue-600 text-white text-sm font-bold rounded-full shadow-lg">
                    🏷️ {session.tagsMeta.length} tag{session.tagsMeta.length !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Session Details & Actions */}
          <div className="space-y-6">
            {/* Session Metadata */}
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-white mb-4">
                Session Information
              </h2>
              <SessionMeta session={session} />
            </div>

            {/* Action Buttons */}
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-white mb-4">
                Actions
              </h2>

              <div className="space-y-3">
                {/* Tag Again */}
                <button
                  onClick={handleTagAgain}
                  className="
                    w-full px-6 py-4
                    bg-blue-600 hover:bg-blue-700
                    text-white font-semibold rounded-lg
                    transition-all duration-200
                    flex items-center justify-center gap-3
                    shadow-md hover:shadow-lg
                  "
                >
                  <span className="text-2xl">🏷️</span>
                  <span>Tag Again</span>
                </button>

                {/* Share */}
                <button
                  onClick={handleShare}
                  className="
                    w-full px-6 py-4
                    bg-green-600 hover:bg-green-700
                    text-white font-semibold rounded-lg
                    transition-all duration-200
                    flex items-center justify-center gap-3
                    shadow-md hover:shadow-lg
                  "
                >
                  <span className="text-2xl">📤</span>
                  <span>Share Session</span>
                </button>

                {/* Delete */}
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="
                    w-full px-6 py-4
                    bg-red-600 hover:bg-red-700
                    text-white font-semibold rounded-lg
                    transition-all duration-200
                    flex items-center justify-center gap-3
                    shadow-md hover:shadow-lg
                    disabled:opacity-50 disabled:cursor-not-allowed
                  "
                >
                  <span className="text-2xl">🗑️</span>
                  <span>{isDeleting ? 'Deleting...' : 'Delete Session'}</span>
                </button>
              </div>
            </div>

            {/* PHASE 6.2f: Session Deliveries */}
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-white mb-4">
                🚀 Session Deliveries ({deliveries.length})
              </h2>

              {/* Delivery Feedback */}
              {deliveryFeedback && (
                <div className={`text-sm mb-4 ${deliveryFeedback.startsWith('⚡') ? 'text-blue-400' : 'text-red-400'}`}>
                  {deliveryFeedback}
                </div>
              )}

              {/* Create Delivery Section */}
              {customers.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-md font-medium text-white mb-3">Create Atomic Delivery</h3>
                  <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                    {customers.map(customer => (
                      <div key={customer.id} className="flex items-center justify-between bg-gray-700 rounded p-3">
                        <div className="flex-1">
                          <div className="font-medium text-white">{customer.name}</div>
                          <div className="text-sm text-gray-300">@{customer.handle}</div>
                          <div className="text-xs text-gray-400">
                            {customer.email && `📧 ${customer.email}`}
                            {customer.email && customer.phone && ' • '}
                            {customer.phone && `📱 ${customer.phone}`}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleCreateAndSendEmail(customer.id)}
                            disabled={!customer.email}
                            title={!customer.email ? 'No email address' : 'Send atomic email'}
                            className={`px-3 py-1 rounded text-xs font-medium ${
                              customer.email
                                ? 'bg-green-600 hover:bg-green-700 text-white'
                                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                            }`}
                          >
                            ⚡ Email
                          </button>
                          <button
                            onClick={() => handleCreateAndSendSMS(customer.id)}
                            disabled={!customer.phone}
                            title={!customer.phone ? 'No phone number' : 'Send atomic SMS'}
                            className={`px-3 py-1 rounded text-xs font-medium ${
                              customer.phone
                                ? 'bg-purple-600 hover:bg-purple-700 text-white'
                                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                            }`}
                          >
                            ⚡ SMS
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Deliveries List */}
              {deliveries.length > 0 && (
                <div>
                  <h3 className="text-md font-medium text-white mb-3">Recent Deliveries</h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {deliveries.slice(-5).reverse().map(delivery => {
                      const customer = customerMap.get(delivery.customerId);
                      return (
                        <div key={delivery.id} className="flex items-center justify-between bg-gray-700 rounded p-3">
                          <div className="flex-1">
                            <div className="text-sm font-medium text-white">
                              {customer?.name || 'Unknown'} (@{customer?.handle || 'unknown'})
                            </div>
                            <div className="text-xs text-gray-400">
                              {new Date(delivery.createdAt).toLocaleString()}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded text-xs ${
                              delivery.method === 'email' ? 'bg-blue-600' : 'bg-purple-600'
                            } text-white`}>
                              {delivery.method}
                            </span>
                            <span className={`px-2 py-1 rounded text-xs ${
                              delivery.status === 'sent' ? 'bg-green-600' : 'bg-yellow-600'
                            } text-white`}>
                              {delivery.status}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {customers.length === 0 && (
                <div className="text-center py-4 text-gray-400">
                  <div className="text-2xl mb-2">👥</div>
                  <div className="text-sm">No customers found. Add customers first.</div>
                </div>
              )}
            </div>

            {/* Quick Links */}
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-white mb-4">
                Quick Links
              </h2>

              <div className="space-y-2 text-sm">
                <Link
                  to="/gallery"
                  className="block text-blue-400 hover:text-blue-300 transition-colors"
                >
                  → Back to Gallery
                </Link>
                <Link
                  to="/upload"
                  className="block text-blue-400 hover:text-blue-300 transition-colors"
                >
                  → Upload New Photo
                </Link>
                <Link
                  to="/debug"
                  className="block text-blue-400 hover:text-blue-300 transition-colors"
                >
                  → View Debug Console
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 border-t border-gray-700 py-4">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-400">
          Session ID: <span className="font-mono">{sessionId}</span>
        </div>
      </footer>
    </div>
  );
}

export default SessionDetailPage;
