import React from 'react';

function SettingsPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          ⚙️ Settings
        </h1>

        <div className="bg-gray-100 rounded-lg p-12 text-center">
          <div className="text-6xl mb-4">🔧</div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            Settings Panel - Coming in Phase 5
          </h2>
          <p className="text-gray-500">
            Configure event details and preferences
          </p>
        </div>

        <div className="mt-6 text-sm text-gray-600">
          <p className="font-semibold mb-2">Phase 5 will include:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Event name and hashtag configuration</li>
            <li>Message template editor</li>
            <li>Delivery preferences</li>
            <li>Export/import settings</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;
