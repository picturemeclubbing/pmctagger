/**
 * File: /src/components/Navigation.jsx
 * Purpose: Global top navigation bar for all pages
 * Connects To: All pages via Layout wrapper
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Navigation() {
  const location = useLocation();

  const navItems = [
    { path: '/gallery', label: 'Gallery', icon: '🖼️', color: 'green' },
    { path: '/upload', label: 'Upload', icon: '📤', color: 'blue' },
    { path: '/crm', label: 'CRM', icon: '👥', color: 'blue' },
    { path: '/settings', label: 'Settings', icon: '⚙️', color: 'gray' },
    { path: '/debug', label: 'Debug', icon: '🐛', color: 'gray' }
  ];

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const getButtonClass = (path, color) => {
    const active = isActive(path);
    const baseClass = 'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors text-sm';

    if (active) {
      const activeColors = {
        green: 'bg-green-600 text-white',
        blue: 'bg-blue-600 text-white',
        gray: 'bg-gray-600 text-white'
      };
      return `${baseClass} ${activeColors[color]}`;
    }

    return `${baseClass} bg-gray-100 text-gray-700 hover:bg-gray-200`;
  };

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo/Brand */}
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl">📸</span>
            <span className="text-lg font-bold text-gray-900">PMC Revamp</span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-2">
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={getButtonClass(item.path, item.color)}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
