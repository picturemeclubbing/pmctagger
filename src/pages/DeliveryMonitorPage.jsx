/**
 * DeliveryMonitorPage.jsx - Live delivery automation monitor and control center
 * Compatible with: Phase 7.0 - Automated Delivery & Customer Notifications
 */

import React, { useState, useEffect } from 'react';
import { useLiveDeliveryData } from '../hooks/useLiveDeliveryData';
import { startAutomation, stopAutomation, getQueueStatus } from '../services/DeliveryAutomation';

export default function DeliveryMonitorPage() {
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [automationStatus, setAutomationStatus] = useState('unknown');
  const [queueStatus, setQueueStatus] = useState(null);

  // Use the live data hook
  const { deliveries, logs, stats, isLoading, error, refresh } = useLiveDeliveryData(3000, autoRefresh);

  // Get automation status on mount and periodically
  useEffect(() => {
    const updateStatus = async () => {
      try {
        const status = await getQueueStatus();
        setQueueStatus(status);
        setAutomationStatus(status.automationEnabled ? 'running' : 'paused');
      } catch (err) {
        console.error('Failed to get automation status:', err);
        setAutomationStatus('error');
      }
    };

    updateStatus();
    const interval = setInterval(updateStatus, 5000); // Check every 5 seconds
    return () => clearInterval(interval);
  }, []);

  // Handle start automation
  const handleStartAutomation = async () => {
    try {
      const result = startAutomation();
      if (result) {
        setAutomationStatus('running');
        await refresh();
      }
    } catch (error) {
      console.error('Failed to start automation:', error);
      setAutomationStatus('error');
    }
  };

  // Handle stop automation
  const handleStopAutomation = async () => {
    try {
      stopAutomation();
      setAutomationStatus('paused');
      await refresh();
    } catch (error) {
      console.error('Failed to stop automation:', error);
    }
  };

  // Get status badge styling
  const getStatusBadge = () => {
    switch (automationStatus) {
      case 'running':
        return 'bg-green-600 text-green-100';
      case 'paused':
        return 'bg-yellow-600 text-yellow-100';
      case 'error':
        return 'bg-red-600 text-red-100';
      default:
        return 'bg-gray-600 text-gray-100';
    }
  };

  // Format time
  const formatTime = (isoString) => {
    if (!isoString) return 'N/A';
    return new Date(isoString).toLocaleString();
  };

  // Get response code styling
  const getResponseCodeStyle = (code) => {
    if (!code) return 'text-gray-400';
    if (code < 300) return 'text-green-400';
    if (code < 400) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="p-6 bg-gray-900 min-h-screen text-white">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">🚀 Delivery Automation Monitor</h1>
          <div className="flex items-center gap-4">
            {/* Status Badge */}
            <div className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusBadge()}`}>
              {automationStatus === 'running' && '🟢 Running'}
              {automationStatus === 'paused' && '🟡 Paused'}
              {automationStatus === 'error' && '🔴 Error'}
              {automationStatus === 'unknown' && '⚪ Unknown'}
            </div>

            {/* Controls */}
            <div className="flex gap-2">
              {automationStatus !== 'running' && (
                <button
                  onClick={handleStartAutomation}
                  className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded font-medium"
                >
                  ▶️ Start
                </button>
              )}
              {automationStatus === 'running' && (
                <button
                  onClick={handleStopAutomation}
                  className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded font-medium"
                >
                  ⏹️ Stop
                </button>
              )}
              <button
                onClick={refresh}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded font-medium disabled:opacity-50"
              >
                🔄 Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Auto-refresh toggle */}
        <div className="flex items-center gap-4 mb-6">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm">Auto-refresh every 3 seconds</span>
          </label>
          {isLoading && <span className="text-yellow-400 text-sm">⏳ Updating...</span>}
          {error && <span className="text-red-400 text-sm">❌ Error: {error}</span>}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-5 gap-4 mb-6">
          <div className="bg-gray-800 p-4 rounded">
            <div className="text-lg font-semibold">Total</div>
            <div className="text-3xl font-bold text-blue-400">{stats.total || 0}</div>
          </div>
          <div className="bg-gray-800 p-4 rounded">
            <div className="text-lg font-semibold">Pending</div>
            <div className="text-3xl font-bold text-yellow-400">{stats.pending || 0}</div>
          </div>
          <div className="bg-gray-800 p-4 rounded">
            <div className="text-lg font-semibold">Processing</div>
            <div className="text-3xl font-bold text-orange-400">{stats.processing || 0}</div>
          </div>
          <div className="bg-gray-800 p-4 rounded">
            <div className="text-lg font-semibold">Sent</div>
            <div className="text-3xl font-bold text-green-400">{stats.sent || 0}</div>
          </div>
          <div className="bg-gray-800 p-4 rounded">
            <div className="text-lg font-semibold">Failed</div>
            <div className="text-3xl font-bold text-red-400">{stats.failed || 0}</div>
          </div>
        </div>

        {/* Queue Table */}
        <div className="bg-gray-800 rounded mb-6">
          <div className="p-4 border-b border-gray-700">
            <h2 className="text-xl font-semibold">📋 Delivery Queue</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700">
                <tr>
                  <th className="p-3 text-left">ID</th>
                  <th className="p-3 text-left">Customer</th>
                  <th className="p-3 text-left">Session</th>
                  <th className="p-3 text-left">Method</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Attempts</th>
                  <th className="p-3 text-left">Next Retry</th>
                  <th className="p-3 text-left">Sent At</th>
                </tr>
              </thead>
              <tbody>
                {deliveries.slice(0, 20).map(delivery => (
                  <tr key={delivery.id} className="border-t border-gray-700">
                    <td className="p-3 font-mono text-sm">{delivery.id}</td>
                    <td className="p-3">
                      <div className="text-sm font-medium">{delivery.customerName}</div>
                      <div className="text-xs text-gray-400">{delivery.customerEmail}</div>
                    </td>
                    <td className="p-3">
                      <div className="text-sm">{delivery.sessionName}</div>
                      <div className="text-xs text-gray-400">{delivery.sessionId}</div>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs ${
                        delivery.method === 'email' ? 'bg-blue-600' :
                        delivery.method === 'sms' ? 'bg-purple-600' :
                        'bg-green-600'
                      }`}>
                        {delivery.method.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        delivery.status === 'pending' ? 'bg-yellow-600 text-yellow-100' :
                        delivery.status === 'processing' ? 'bg-orange-600 text-orange-100' :
                        delivery.status === 'sent' ? 'bg-green-600 text-green-100' :
                        'bg-red-600 text-red-100'
                      }`}>
                        {delivery.status}
                      </span>
                    </td>
                    <td className="p-3 text-center">{delivery.attempt}</td>
                    <td className="p-3 text-xs">
                      {delivery.nextRetryAt ? formatTime(delivery.nextRetryAt) : '-'}
                    </td>
                    <td className="p-3 text-xs">
                      {delivery.sentAt ? formatTime(delivery.sentAt) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {deliveries.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                No deliveries in queue.
              </div>
            )}
          </div>
        </div>

        {/* Recent Logs */}
        <div className="bg-gray-800 rounded">
          <div className="p-4 border-b border-gray-700">
            <h2 className="text-xl font-semibold">📋 Recent Activity Logs</h2>
            <p className="text-sm text-gray-400">Last 50 delivery attempts</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700">
                <tr>
                  <th className="p-3 text-left">Time</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Delivery ID</th>
                  <th className="p-3 text-left">Customer</th>
                  <th className="p-3 text-left">Method</th>
                  <th className="p-3 text-left">Provider</th>
                  <th className="p-3 text-left">Response Code</th>
                  <th className="p-3 text-left">Processing Time</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={`${log.id}-${log.createdAt}`} className="border-t border-gray-700">
                    <td className="p-3 text-xs font-mono">
                      {formatTime(log.createdAt)}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        log.status === 'sent' ? 'bg-green-600 text-green-100' :
                        'bg-red-600 text-red-100'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-sm">{log.deliveryId || '-'}</td>
                    <td className="p-3 text-sm">{log.customerName}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs ${
                        log.method === 'email' ? 'bg-blue-600' :
                        log.method === 'sms' ? 'bg-purple-600' :
                        log.method === 'mms' ? 'bg-green-600' :
                        'bg-gray-600'
                      }`}>
                        {log.method || '-'}
                      </span>
                    </td>
                    <td className="p-3 text-xs">{log.provider || '-'}</td>
                    <td className="p-3">
                      <span className={`font-mono text-xs ${getResponseCodeStyle(log.responseCode)}`}>
                        {log.responseCode || '-'}
                      </span>
                    </td>
                    <td className="p-3 text-xs">
                      {log.processingTime ? `${log.processingTime}ms` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {logs.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                No activity logs yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
