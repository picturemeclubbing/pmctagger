/**
 * File: /src/components/CustomerBadge.jsx
 * Purpose: Display linked customer info beneath tag markers
 * Connects To: TagMarker.jsx, CustomerStore
 */

import React from 'react';

/**
 * CustomerBadge Component
 * Displays when a tag is linked to a CRM customer
 *
 * @param {Object} props
 * @param {string} props.customerName - Customer's display name
 * @param {string} props.customerId - Customer ID (for future click actions)
 * @param {boolean} props.compact - Show compact version (default: false)
 */
export default function CustomerBadge({ customerName, customerId, compact = false }) {
  if (!customerName) return null;

  if (compact) {
    // Compact version for small spaces
    return (
      <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-600 text-white text-xs font-medium rounded-full">
        <span>👤</span>
        <span className="truncate max-w-[100px]">{customerName}</span>
      </div>
    );
  }

  // Full version with hover effect
  return (
    <div
      className="
        flex items-center gap-2 px-3 py-1.5
        bg-gradient-to-r from-green-600 to-green-500
        text-white text-sm font-medium rounded-lg
        shadow-md hover:shadow-lg
        transition-all duration-200
        cursor-pointer
        border border-green-400/30
      "
      title={`Linked to customer: ${customerName}`}
    >
      {/* Icon */}
      <span className="text-base">👤</span>

      {/* Customer Name */}
      <span className="font-semibold">{customerName}</span>

      {/* Link Indicator */}
      <span className="text-xs opacity-75">✓ Linked</span>
    </div>
  );
}

/**
 * Compact inline badge variant (for use in lists/grids)
 */
export function CustomerBadgeInline({ customerName }) {
  if (!customerName) return null;

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-800 text-xs font-medium rounded-full">
      <span>👤</span>
      <span>{customerName}</span>
    </span>
  );
}
