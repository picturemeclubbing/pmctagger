import React, { useState, useEffect } from 'react';
import useDebug from '../debug/useDebug';
import { addDelivery, markSent, listDeliveries, clearDeliveries, getDeliveryStats, sendEmail, sendSMS, createAndSendEmail, createAndSendSMS, bulkMarkSent, bulkSendEmail, bulkSendSMS, bulkSendBoth } from '../services/DeliverySimple';
import { addOrUpdateCustomer, listCustomers } from '../services/CustomerStore';
import { listSessions } from '../services/SessionStore';

// DARK THEME TABLE UI - PHASE 6.2 MVP
export default function DeliverySimplePage() {
  const debug = useDebug('DELIVERY_SIMPLE');
  const [deliveries, setDeliveries] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, sent: 0, byMethod: {} });
  const [customers, setCustomers] = useState([]);
  const [sessions, setSessions] = useState([]); // Bulk loaded sessions
  const [sessionMap, setSessionMap] = useState(new Map()); // Efficient session lookup Map
  const [customerMap, setCustomerMap] = useState(new Map()); // Efficient customer lookup Map
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'sent'
  const [feedback, setFeedback] = useState({}); // { deliveryId: '✅ Sent!' }
  const [selectedDeliveries, setSelectedDeliveries] = useState([]); // For bulk operations

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadDeliveries();
  }, [filter]);

  async function loadData() {
    const statsData = await getDeliveryStats();
    setStats(statsData);

    // Bulk load customers for delivery operations
    const customersData = await listCustomers();
    setCustomers(customersData);

    // Bulk load sessions for delivery enrichment (N+1 query fix)
    const sessionsData = await listSessions();
    setSessions(sessionsData);

    // Create efficient lookup Maps to eliminate N+1 queries
    const customerMap = new Map();
    customersData.forEach(customer => {
      customerMap.set(customer.id, customer);
    });
    setCustomerMap(customerMap);

    const sessionMap = new Map();
    sessionsData.forEach(session => {
      sessionMap.set(session.sessionId, session);
    });
    setSessionMap(sessionMap);
  }

  async function loadDeliveries() {
    const deliveriesData = await listDeliveries(filter === 'all' ? {} : { status: filter });
    setDeliveries(deliveriesData);
  }

  async function handleAddTestDelivery() {
    try {
      if (customers.length === 0) {
        alert('No customers found. Please create a customer first.');
        return;
      }

      const customer = customers[0]; // Use first customer for demo
      const sessionId = 'test-session-' + Date.now();
      await addDelivery(sessionId, customer.id, 'manual');
      await loadData();
    } catch (error) {
      console.error('Failed to add delivery:', error);
      alert('Failed to add delivery: ' + error.message);
    }
  }

  async function handleMarkSent(id) {
    try {
      await markSent(id);
      await loadData();
    } catch (error) {
      console.error('Failed to mark sent:', error);
      alert('Failed to mark sent: ' + error.message);
    }
  }

  async function handleClearAll() {
    if (confirm('Are you sure you want to clear all deliveries?')) {
      try {
        await clearDeliveries();
        await loadData();
      } catch (error) {
        console.error('Failed to clear deliveries:', error);
        alert('Failed to clear deliveries: ' + error.message);
      }
    }
  }

  async function handleSendEmail(deliveryId) {
    try {
      const result = await sendEmail(deliveryId);
      setFeedback({ ...feedback, [deliveryId]: '✅ Email Sent!' });
      await loadData();
      // Clear feedback after 3 seconds
      setTimeout(() => {
        setFeedback(prev => { const newState = {...prev}; delete newState[deliveryId]; return newState; });
      }, 3000);
    } catch (error) {
      console.error('Failed to send email:', error);
      alert('Failed to send email: ' + error.message);
    }
  }

  async function handleSendSMS(deliveryId) {
    try {
      const result = await sendSMS(deliveryId);
      setFeedback({ ...feedback, [deliveryId]: '✅ SMS Sent!' });
      await loadData();
      // Clear feedback after 3 seconds
      setTimeout(() => {
        setFeedback(prev => { const newState = {...prev}; delete newState[deliveryId]; return newState; });
      }, 3000);
    } catch (error) {
      console.error('Failed to send SMS:', error);
      alert('Failed to send SMS: ' + error.message);
    }
  }

  async function handleBulkMarkSent() {
    if (selectedDeliveries.length === 0) return;
    try {
      const count = await bulkMarkSent(selectedDeliveries);
      setFeedback({ ...feedback, bulk: `${count} deliveries marked sent!` });
      setSelectedDeliveries([]);
      await loadData();
      setTimeout(() => {
        setFeedback(prev => { const newState = {...prev}; delete newState.bulk; return newState; });
      }, 3000);
    } catch (error) {
      console.error('Bulk mark sent failed:', error);
      alert('Bulk mark sent failed: ' + error.message);
    }
  }

  async function handleBulkSendEmail() {
    if (selectedDeliveries.length === 0) return;
    try {
      const count = await bulkSendEmail(selectedDeliveries);
      setFeedback({ ...feedback, bulk: `${count} emails sent!` });
      setSelectedDeliveries([]);
      await loadData();
      setTimeout(() => {
        setFeedback(prev => { const newState = {...prev}; delete newState.bulk; return newState; });
      }, 3000);
    } catch (error) {
      console.error('Bulk send email failed:', error);
      alert('Bulk send email failed: ' + error.message);
    }
  }

  async function handleBulkSendSMS() {
    if (selectedDeliveries.length === 0) return;
    try {
      const count = await bulkSendSMS(selectedDeliveries);
      setFeedback({ ...feedback, bulk: `${count} SMS sent!` });
      setSelectedDeliveries([]);
      await loadData();
      setTimeout(() => {
        setFeedback(prev => { const newState = {...prev}; delete newState.bulk; return newState; });
      }, 3000);
    } catch (error) {
      console.error('Bulk send SMS failed:', error);
      alert('Bulk send SMS failed: ' + error.message);
    }
  }

  async function handleBulkSendBoth() {
    if (selectedDeliveries.length === 0) return;
    try {
      const count = await bulkSendBoth(selectedDeliveries);
      setFeedback({ ...feedback, bulk: `${count} deliveries sent both!` });
      setSelectedDeliveries([]);
      await loadData();
      setTimeout(() => {
        setFeedback(prev => { const newState = {...prev}; delete newState.bulk; return newState; });
      }, 3000);
    } catch (error) {
      console.error('Bulk send both failed:', error);
      alert('Bulk send both failed: ' + error.message);
    }
  }

  // PHASE 6.2f: Atomic create+send demo handlers
  async function handleCreateAndSendEmail() {
    try {
      if (customers.length === 0) {
        alert('No customers found. Please create a customer first.');
        return;
      }

      const customer = customers[0]; // Use first customer for demo
      const sessionId = 'atomic-email-' + Date.now();

      const result = await createAndSendEmail(sessionId, customer.id);
      setFeedback({ ...feedback, atomic: '⚡ Atomic Email Sent!' });
      await loadData();
      setTimeout(() => {
        setFeedback(prev => { const newState = {...prev}; delete newState.atomic; return newState; });
      }, 3000);
    } catch (error) {
      console.error('Atomic email failed:', error);
      alert('Atomic email failed: ' + error.message);
    }
  }

  async function handleCreateAndSendSMS() {
    try {
      if (customers.length === 0) {
        alert('No customers found. Please create a customer first.');
        return;
      }

      const customer = customers[0]; // Use first customer for demo
      const sessionId = 'atomic-sms-' + Date.now();

      const result = await createAndSendSMS(sessionId, customer.id);
      setFeedback({ ...feedback, atomic: '⚡ Atomic SMS Sent!' });
      await loadData();
      setTimeout(() => {
        setFeedback(prev => { const newState = {...prev}; delete newState.atomic; return newState; });
      }, 3000);
    } catch (error) {
      console.error('Atomic SMS failed:', error);
      alert('Atomic SMS failed: ' + error.message);
    }
  }

  function handleSelectDelivery(id, checked) {
    if (checked) {
      setSelectedDeliveries([...selectedDeliveries, id]);
    } else {
      setSelectedDeliveries(selectedDeliveries.filter(i => i !== id));
    }
  }

  function handleSelectAll(checked) {
    if (checked) {
      setSelectedDeliveries(deliveries.filter(d => d.status === 'pending').map(d => d.id));
    } else {
      setSelectedDeliveries([]);
    }
  }

  // Function removed - now using customerMap for O(1) lookups to eliminate N+1 queries

  return (
    <div className="p-6 bg-gray-900 min-h-screen text-white">
      <h1 className="text-2xl font-bold mb-6">Delivery Simple — MVP</h1>

      {/* Stats Section */}
      <div className="grid grid-cols-7 gap-4 mb-6">
        <div className="bg-gray-800 p-4 rounded">
          <div className="text-lg font-semibold">Total</div>
          <div className="text-2xl">{stats.total}</div>
        </div>
        <div className="bg-gray-800 p-4 rounded">
          <div className="text-lg font-semibold">Pending</div>
          <div className="text-2xl">{stats.pending}</div>
        </div>
        <div className="bg-gray-800 p-4 rounded">
          <div className="text-lg font-semibold">Sent</div>
          <div className="text-2xl">{stats.sent}</div>
        </div>
        <div className="bg-gray-800 p-4 rounded">
          <div className="text-lg font-semibold">Manual</div>
          <div className="text-2xl">{stats.byMethod?.manual || 0}</div>
        </div>
        <div className="bg-gray-800 p-4 rounded">
          <div className="text-lg font-semibold">Email</div>
          <div className="text-2xl">{stats.byMethod?.email || 0}</div>
        </div>
        <div className="bg-gray-800 p-4 rounded">
          <div className="text-lg font-semibold">SMS</div>
          <div className="text-2xl">{stats.byMethod?.sms || 0}</div>
        </div>
        <div className="bg-gray-800 p-4 rounded">
          <div className="text-lg font-semibold">Customers</div>
          <div className="text-2xl">{customers.length}</div>
        </div>
      </div>

      {/* Filter and Controls */}
      <div className="flex gap-4 mb-6">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="bg-gray-800 text-white px-3 py-2 rounded"
        >
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="sent">Sent</option>
        </select>

        <button
          onClick={handleAddTestDelivery}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
        >
          Add Test Delivery
        </button>

        <button
          onClick={handleClearAll}
          className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded"
        >
          Clear All
        </button>

        {/* PHASE 6.2f: Atomic create+send demo buttons */}
        <button
          onClick={handleCreateAndSendEmail}
          className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-sm"
          disabled={customers.length === 0}
        >
          ⚡ Atomic Email
        </button>

        <button
          onClick={handleCreateAndSendSMS}
          className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded text-sm"
          disabled={customers.length === 0}
        >
          ⚡ Atomic SMS
        </button>
      </div>

      {/* Bulk Actions - Phase 6.2d */}
      {deliveries.some(d => d.status === 'pending') && (
        <div className="bg-gray-800 p-4 rounded mb-6">
          <div className="flex items-center gap-4 mb-3">
            <input
              type="checkbox"
              checked={deliveries.length > 0 && selectedDeliveries.length === deliveries.filter(d => d.status === 'pending').length}
              onChange={(e) => handleSelectAll(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm">Select All Pending ({deliveries.filter(d => d.status === 'pending').length})</span>
            {selectedDeliveries.length > 0 && (
              <span className="text-sm text-gray-400">({selectedDeliveries.length} selected)</span>
            )}
          </div>

          {selectedDeliveries.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={handleBulkMarkSent}
                className="bg-gray-600 hover:bg-gray-700 px-3 py-1 rounded text-sm"
              >
                Bulk Mark Sent ({selectedDeliveries.length})
              </button>
              <button
                onClick={handleBulkSendEmail}
                className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm"
              >
                📩 Bulk Send Email ({selectedDeliveries.length})
              </button>
              <button
                onClick={handleBulkSendSMS}
                className="bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded text-sm"
              >
                📱 Bulk Send SMS ({selectedDeliveries.length})
              </button>
              <button
                onClick={handleBulkSendBoth}
                className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm"
              >
                📨 Bulk Send Both ({selectedDeliveries.length})
              </button>
              <button
                onClick={() => setSelectedDeliveries([])}
                className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm"
              >
                Clear Selection
              </button>
            </div>
          )}

          {feedback.bulk && (
            <div className="text-green-400 text-sm mt-2">{feedback.bulk}</div>
          )}

          {/* PHASE 6.2f: Atomic operation feedback */}
          {feedback.atomic && (
            <div className="text-blue-400 text-sm mt-2">{feedback.atomic}</div>
          )}
        </div>
      )}

      {/* Deliveries Table */}
      <div className="bg-gray-800 rounded overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-700">
            <tr>
              <th className="p-3 text-left">
                {deliveries.some(d => d.status === 'pending') && (
                  <input
                    type="checkbox"
                    checked={deliveries.filter(d => d.status === 'pending').every(d => selectedDeliveries.includes(d.id))}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="w-4 h-4"
                  />
                )}
              </th>
              <th className="p-3 text-left">ID</th>
              <th className="p-3 text-left">Session</th>
              <th className="p-3 text-left">Customer</th>
              <th className="p-3 text-left">Method</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Created</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {deliveries.map(delivery => (
              <tr key={delivery.id} className="border-t border-gray-700">
                <td className="p-3">
                  {delivery.status === 'pending' && (
                    <input
                      type="checkbox"
                      checked={selectedDeliveries.includes(delivery.id)}
                      onChange={(e) => handleSelectDelivery(delivery.id, e.target.checked)}
                      className="w-4 h-4"
                    />
                  )}
                </td>
                <td className="p-3">{delivery.id}</td>
                <td className="p-3">{delivery.sessionId}</td>
                <td className="p-3">{delivery.customerId}</td>
                <td className="p-3">{delivery.method}</td>
                <td className="p-3">
                  <span
                    className={`px-2 py-1 rounded text-sm ${
                      delivery.status === 'pending'
                        ? 'bg-yellow-600 text-yellow-100'
                        : 'bg-green-600 text-green-100'
                    }`}
                  >
                    {delivery.status}
                  </span>
                </td>
                <td className="p-3">
                  {new Date(delivery.createdAt).toLocaleDateString()}
                </td>
                <td className="p-3 space-x-2">
                  {delivery.status === 'pending' ? (
                    <div className="flex gap-2">
                      {(() => {
                        const customer = customerMap.get(delivery.customerId);
                        return (
                          <>
                            <button
                              onClick={() => handleSendEmail(delivery.id)}
                              disabled={!customer?.email}
                              title={!customer?.email ? 'Customer has no email address' : ''}
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                !customer?.email
                                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                  : 'bg-blue-600 hover:bg-blue-700 text-white'
                              }`}
                            >
                              📩 Email
                            </button>
                            <button
                              onClick={() => handleSendSMS(delivery.id)}
                              disabled={!customer?.phone}
                              title={!customer?.phone ? 'Customer has no phone number' : ''}
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                !customer?.phone
                                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                  : 'bg-purple-600 hover:bg-purple-700 text-white'
                              }`}
                            >
                              📱 SMS
                            </button>
                            <button
                              onClick={() => handleMarkSent(delivery.id)}
                              className="bg-gray-600 hover:bg-gray-700 px-2 py-1 rounded text-xs"
                            >
                              Mark Sent
                            </button>
                          </>
                        );
                      })()}
                    </div>
                  ) : (
                    <span className="text-gray-500 text-xs">Completed</span>
                  )}
                  {feedback[delivery.id] && (
                    <div className="italic text-green-400 text-sm mt-1">{feedback[delivery.id]}</div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {deliveries.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            No deliveries found. Click "Add Test Delivery" to create one.
          </div>
        )}
      </div>
    </div>
  );
}
