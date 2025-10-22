/**
 * File: /src/components/DebugPanel.jsx
 * Purpose: Developer debug tools panel with CRM database management
 * Connects To: useDebugActions hook, Debug page
 */

import React from 'react';
import { useDebugActions } from '../debug/DebugContext';

function DebugPanel() {
  const actions = useDebugActions();

  return (
    <div className="bg-gray-50 border-t border-gray-200 p-6 rounded-lg shadow-inner">
      <h2 className="text-lg font-semibold mb-4 text-gray-800">🧩 Developer Debug Tools</h2>

      <div className="space-y-3">
        {actions.map((a) => (
          <button
            key={a.label}
            onClick={a.action}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded-lg text-left transition-all"
          >
            {a.label}
            <span className="block text-sm text-gray-500">{a.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default DebugPanel;
