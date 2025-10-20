import React, { useState, useEffect } from 'react';
import { addDelivery, markSent, listDeliveries, clearDeliveries, getDeliveryStats } from './DeliverySimple';
import { addOrUpdateCustomer, listCustomers } from './CustomerStore';

// DARK THEME TABLE UI - PHASE 6.1 MVP
export default function DeliverySimplePage() {
  const [deliveries, setDeliveries] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, sent: 0, byMethod: {} });
  const [customers, setCustomers] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'sent'

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadDeliveries();
  }, [filter]);

  async function loadData() {
    const statsData = await getDeliveryStats();
    setStats(statsData);

    const customersData = await listCustomers();
    setCustomers(customersData);
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

  return (
    <div className="p-6 bg-gray-900 min-h-screen text-white">
      <h1 className="text-2xl font-bold mb-6">Delivery Simple — MVP</h1>

      {/* Stats Section */}
      <div className="grid grid-cols-4 gap-4 mb-6">
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
      </div>

      {/* Deliveries Table */}
      <div className="bg-gray-800 rounded overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-700">
            <tr>
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
                <td className="p-3">
                  {delivery.status === 'pending' && (
                    <button
                      onClick={() => handleMarkSent(delivery.id)}
                      className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm"
                    >
                      Mark Sent
                    </button>
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
