import React from 'react';
import Navigation from './Navigation';

function Layout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Global Navigation */}
      <Navigation />

      {/* Page Content */}
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}

export default Layout;
