/**
 * File: /src/pages/CRMHomePage.jsx
 * Purpose: Main CRM dashboard showing customer list with search and stats (Phase 8.0)
 * Connects To: useCustomerData.js, CustomerCard.jsx, CustomerProfilePage.jsx
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomerData } from '../hooks/useCustomerData.js';
import CustomerCard from '../components/CustomerCard.jsx';

const CRMHomePage = () => {
  const navigate = useNavigate();
  const {
    displayCustomers,
    stats,
    isLoading,
    error,
    searchQuery,
    updateSearch,
    refreshData
  } = useCustomerData();

  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  // Handle customer card click
  const handleCustomerClick = (customerId) => {
    navigate(`/crm/${customerId}`);
  };

  // Handle refresh
  const handleRefresh = async () => {
    await refreshData();
  };

  if (isLoading && displayCustomers.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading CRM data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="text-red-500 text-xl mr-3">⚠️</div>
            <div>
              <h3 className="text-red-800 font-medium">Error loading CRM data</h3>
              <p className="text-red-600 mt-1">{error}</p>
              <button
                onClick={handleRefresh}
                className="mt-2 bg-red-600 text-white px-4 py-2 rounded-md text-sm hover:bg-red-700"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Customer Relationship Management
        </h1>
        <p className="text-gray-600">
          Manage your customers, track delivery history, and build relationships
        </p>
      </div>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
          <div className="text-sm text-gray-600">Total Customers</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          <div className="text-sm text-gray-600">Active (30d)</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-2xl font-bold text-purple-600">{stats.tagged}</div>
          <div className="text-sm text-gray-600">Tagged Customers</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-2xl font-bold text-orange-600">{stats.withImages}</div>
          <div className="text-sm text-gray-600">With Images</div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        {/* Search */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <input
              type="text"
              placeholder="Search customers by name or handle..."
              value={searchQuery}
              onChange={(e) => updateSearch(e.target.value)}
              className="w-full pl-4 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <span className="text-gray-400">🔍</span>
            </div>
          </div>
        </div>

        {/* View Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
          >
            <span className="text-sm">🔄</span>
            <span className="hidden sm:inline">{isLoading ? 'Refreshing...' : 'Refresh'}</span>
          </button>

          <div className="flex border border-gray-300 rounded-lg">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 text-sm ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
            >
              ⊞ Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 text-sm ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
            >
              ☰ List
            </button>
          </div>
        </div>
      </div>

      {/* Customers Display */}
      {displayCustomers.length === 0 && !isLoading ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">👥</div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">
            {searchQuery ? 'No customers found' : 'No customers yet'}
          </h3>
          <p className="text-gray-600 mb-4">
            {searchQuery
              ? `No customers match "${searchQuery}". Try a different search.`
              : 'Customers will appear here as deliveries are processed.'
            }
          </p>
          {searchQuery && (
            <button
              onClick={() => updateSearch('')}
              className="text-blue-600 hover:text-blue-800 underline"
            >
              Clear search
            </button>
          )}
        </div>
      ) : (
        <div className={viewMode === 'grid'
          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          : "space-y-4"
        }>
          {displayCustomers.map((customer) => (
            <CustomerCard
              key={customer.customerId}
              customer={customer}
              onClick={handleCustomerClick}
            />
          ))}
        </div>
      )}

      {/* Loading overlay for refresh */}
      {isLoading && displayCustomers.length > 0 && (
        <div className="fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg text-sm flex items-center gap-2">
          <div className="animate-spin h-4 w-4 border border-white border-t-transparent rounded-full"></div>
          Refreshing...
        </div>
      )}
    </div>
  );
};

export default CRMHomePage;
