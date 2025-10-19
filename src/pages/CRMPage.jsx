import React from 'react';

function CRMPage() {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-800">
            👥 Customer Management
          </h1>
          <button className="bg-primary text-white px-4 py-2 rounded-md hover:bg-blue-600">
            Add Customer
          </button>
        </div>

        <div className="bg-gray-100 rounded-lg p-12 text-center">
          <div className="text-6xl mb-4">📊</div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            CRM Interface - Coming in Phase 5
          </h2>
          <p className="text-gray-500">
            Manage customers and delivery history
          </p>
        </div>

        <div className="mt-6 text-sm text-gray-600">
          <p className="font-semibold mb-2">Phase 5 will include:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Customer table with search and filters</li>
            <li>Delivery history tracking</li>
            <li>CSV export functionality</li>
            <li>Customer status management</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default CRMPage;
