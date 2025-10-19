/**
 * File: /src/components/AppVersion.jsx
 * Purpose: Display current app version and build date in footer
 * Connects To: HomePage.jsx, version.js
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { APP_VERSION, BUILD_DATE, APP_NAME } from '../version';

/**
 * AppVersion Component
 * Displays app version, build date, and link to debug console
 * Typically placed in footer of main pages
 */
export default function AppVersion() {
  return (
    <footer className="w-full border-t border-gray-800 bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
          {/* Version Info */}
          <div className="flex items-center gap-3 text-gray-400">
            <span className="font-semibold text-white">📸 {APP_NAME}</span>
            <span className="hidden sm:inline text-gray-600">•</span>
            <span>v{APP_VERSION}</span>
            <span className="hidden sm:inline text-gray-600">•</span>
            <span className="text-gray-500">{BUILD_DATE}</span>
          </div>

          {/* Debug Console Link */}
          <Link
            to="/debug"
            className="
              flex items-center gap-2 px-3 py-1.5
              text-blue-400 hover:text-blue-300
              hover:bg-gray-800/50 rounded-md
              transition-all duration-200
              text-xs font-medium
            "
          >
            <span>⚙️</span>
            <span>Debug Console</span>
          </Link>
        </div>

        {/* Optional: Copyright or Additional Info */}
        <div className="mt-2 text-center text-xs text-gray-600">
          © 2025 PMC Social Tagger. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

/**
 * Compact version for use in modals or small spaces
 */
export function AppVersionCompact() {
  return (
    <div className="text-xs text-gray-500 text-center py-2">
      v{APP_VERSION} • {BUILD_DATE}
    </div>
  );
}
