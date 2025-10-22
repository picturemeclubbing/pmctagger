/**
 * File: /src/components/CustomerCard.jsx
 * Purpose: Compact customer display card for CRM listing (Phase 8.0)
 * Connects To: CRMHomePage.jsx, CustomerProfilePage.jsx
 */

import React from 'react';

const CustomerCard = ({ customer, onClick }) => {
  if (!customer) return null;

  const {
    customerId,
    handle,
    name,
    email,
    phone,
    createdAt,
    lastDeliveryAt,
    tagCount = 0
  } = customer;

  // Format last delivery date
  const formatLastDelivery = (dateString) => {
    if (!dateString) return 'Never';

    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays} days ago`;
    if (diffDays <= 30) return `${Math.ceil(diffDays / 7)} weeks ago`;

    return date.toLocaleDateString();
  };

  // Status indicators
  const isActive = lastDeliveryAt && (new Date() - new Date(lastDeliveryAt)) < (30 * 24 * 60 * 60 * 1000); // 30 days
  const hasTags = tagCount > 0;

  return (
    <div
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onClick && onClick(customerId)}
    >
      {/* Header with avatar placeholder and name */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {/* Avatar placeholder */}
          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 font-medium">
            {(name && name.charAt(0).toUpperCase()) || (handle && handle.charAt(0).toUpperCase()) || '?'}
          </div>

          {/* Name and handle */}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-900 truncate">
              {name || handle || customerId}
            </h3>
            {handle && name && handle !== name && (
              <p className="text-sm text-gray-500 truncate">@{handle}</p>
            )}
            {email && (
              <p className="text-sm text-gray-500 truncate">{email}</p>
            )}
          </div>
        </div>

        {/* Status badges */}
        <div className="flex gap-1">
          {isActive && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Active
            </span>
          )}
          {hasTags && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {tagCount} tags
            </span>
          )}
        </div>
      </div>

      {/* Contact info */}
      <div className="text-sm text-gray-600 mb-2">
        {phone && (
          <div className="flex items-center gap-1">
            <span>📞</span>
            <span>{phone}</span>
          </div>
        )}
      </div>

      {/* Footer with stats */}
      <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
        <span>Last delivery: {formatLastDelivery(lastDeliveryAt)}</span>
        <span>
          Customer since {createdAt ? new Date(createdAt).getFullYear() : 'N/A'}
        </span>
      </div>
    </div>
  );
};

export default CustomerCard;
