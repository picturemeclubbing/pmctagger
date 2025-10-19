/**
 * File: /src/components/gallery/FilterBar.jsx
 * Purpose: Filter controls for gallery view (All/Tagged/Untagged + Search)
 * Connects To: GalleryPage.jsx
 */

import React from 'react';

/**
 * FilterBar Component
 * Provides filter buttons and search input for gallery
 *
 * @param {Object} props
 * @param {string} props.filter - Current filter ('all' | 'tagged' | 'untagged')
 * @param {Function} props.onFilterChange - Filter change handler
 * @param {string} props.searchText - Current search text
 * @param {Function} props.onSearchChange - Search text change handler
 * @param {Object} props.stats - Session counts { all, tagged, untagged }
 */
export default function FilterBar({
  filter,
  onFilterChange,
  searchText,
  onSearchChange,
  stats
}) {
  const filters = [
    {
      id: 'all',
      label: 'All',
      icon: '📂',
      count: stats.all,
      color: 'gray'
    },
    {
      id: 'tagged',
      label: 'Tagged',
      icon: '✓',
      count: stats.tagged,
      color: 'green'
    },
    {
      id: 'untagged',
      label: 'Untagged',
      icon: '○',
      count: stats.untagged,
      color: 'blue'
    }
  ];

  const getButtonClasses = (filterId, color) => {
    const isActive = filter === filterId;

    const baseClasses = 'px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2';

    if (isActive) {
      const activeColors = {
        gray: 'bg-gray-700 text-white shadow-md',
        green: 'bg-green-600 text-white shadow-md',
        blue: 'bg-blue-600 text-white shadow-md'
      };
      return `${baseClasses} ${activeColors[color]}`;
    }

    return `${baseClasses} bg-gray-100 text-gray-700 hover:bg-gray-200`;
  };

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
      {/* Filter Buttons */}
      <div className="flex gap-2 flex-wrap">
        {filters.map(({ id, label, icon, count, color }) => (
          <button
            key={id}
            onClick={() => onFilterChange(id)}
            className={getButtonClasses(id, color)}
          >
            <span className="text-lg">{icon}</span>
            <span>{label}</span>
            <span className={`
              px-2 py-0.5 rounded-full text-xs font-bold
              ${filter === id ? 'bg-white/20' : 'bg-gray-200 text-gray-700'}
            `}>
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* Search Box */}
      <div className="flex-1 sm:max-w-xs">
        <div className="relative">
          <input
            type="text"
            placeholder="🔍 Search sessions..."
            value={searchText}
            onChange={(e) => onSearchChange(e.target.value)}
            className="
              w-full px-4 py-2 pr-10
              border border-gray-300 rounded-lg
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              text-sm
            "
          />
          {searchText && (
            <button
              onClick={() => onSearchChange('')}
              className="
                absolute right-2 top-1/2 -translate-y-1/2
                text-gray-400 hover:text-gray-600
                p-1
              "
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Compact FilterBar variant (for use in smaller spaces)
 */
export function FilterBarCompact({ filter, onFilterChange, stats }) {
  return (
    <div className="flex gap-2 text-sm">
      <button
        onClick={() => onFilterChange('all')}
        className={`px-3 py-1 rounded ${filter === 'all' ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-700'}`}
      >
        All ({stats.all})
      </button>
      <button
        onClick={() => onFilterChange('tagged')}
        className={`px-3 py-1 rounded ${filter === 'tagged' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'}`}
      >
        Tagged ({stats.tagged})
      </button>
      <button
        onClick={() => onFilterChange('untagged')}
        className={`px-3 py-1 rounded ${filter === 'untagged' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
      >
        Untagged ({stats.untagged})
      </button>
    </div>
  );
}
