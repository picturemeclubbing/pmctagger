/**
 * File: /src/components/DeliveryItem.jsx
 * Purpose: Display individual delivery record with action buttons (Phase 6.0b-R1 Enhanced)
 * Connects To: DeliveryQueuePage.jsx
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { formatDate } from '../utils/helpers';

const statusConfig = {
  pending: { label: 'Pending', icon: '⏳', style: 'bg-yellow-500 text-yellow-900' },
  sent: { label: 'Sent', icon: '✅', style: 'bg-green-500 text-green-900' },
  failed: { label: 'Failed', icon: '❌', style: 'bg-red-500 text-red-900' },
};

export default function DeliveryItem({ delivery, onMarkSent, onRetry }) {
  const config = statusConfig[delivery.status] || statusConfig.pending;

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 hover:border-blue-500 transition-all duration-200">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">

        {/* Left Side: Info */}
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-white">👤 {delivery.customerName}</h3>
            <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${config.style}`}>
              <span>{config.icon}</span>
              <span>{config.label}</span>
            </span>
          </div>
          <div className="text-sm text-gray-400">
            {delivery.customerPhone && <p>📱 {delivery.customerPhone}</p>}
            {delivery.customerEmail && <p>✉️ {delivery.customerEmail}</p>}
          </div>
           {delivery.lastError && (
             <div className="text-xs text-red-400 bg-red-900/50 p-2 rounded">
                <strong>Last Error:</strong> {delivery.lastError}
             </div>
           )}
          <div className="text-xs text-gray-500 pt-2 border-t border-gray-700/50">
            <p>Consent Given: {formatDate(delivery.consentAt)}</p>
            {delivery.sentAt && <p>Sent On: {formatDate(delivery.sentAt)}</p>}
          </div>
        </div>

        {/* Right Side: Actions */}
        <div className="flex-shrink-0 flex flex-row md:flex-col gap-2 items-stretch md:items-end">
          <Link to={`/session/${delivery.sessionId}`} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded-lg transition-colors text-center">
            View Session
          </Link>
          {delivery.status === 'pending' && (
            <button onClick={() => onMarkSent(delivery.id)} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-colors">
              Mark as Sent
            </button>
          )}
           {delivery.status === 'failed' && (
            <button onClick={() => onRetry(delivery.id)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors">
              Retry Delivery
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function DeliveryItemSkeleton() {
  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="flex-1 space-y-3">
          <div className="h-6 bg-gray-700 rounded w-1/3"></div>
          <div className="h-4 bg-gray-700 rounded w-1/2"></div>
          <div className="h-3 bg-gray-700 rounded w-2/3 mt-4"></div>
        </div>
        <div className="h-10 bg-gray-700 rounded w-32"></div>
      </div>
    </div>
  );
}
