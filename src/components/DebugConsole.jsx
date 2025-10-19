import React, { useState, useEffect } from 'react';
import {
  getDebugLogs,
  clearDebugLogs,
  downloadDebugLogs,
  subscribeToDebugLogs
} from '../services/debugger';

function DebugConsole({ onClose }) {
  const [logs, setLogs] = useState(getDebugLogs());
  const [filter, setFilter] = useState('ALL');
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    // Subscribe to new logs
    const unsubscribe = subscribeToDebugLogs((logEntry) => {
      if (logEntry.type === 'CLEAR') {
        setLogs([]);
      } else {
        setLogs(getDebugLogs());
      }
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (autoScroll) {
      const logContainer = document.getElementById('debug-log-container');
      if (logContainer) {
        logContainer.scrollTop = logContainer.scrollHeight;
      }
    }
  }, [logs, autoScroll]);

  const filteredLogs = filter === 'ALL'
    ? logs
    : logs.filter(log => log.eventType.includes(filter));

  const filterOptions = [
    'ALL',
    'UPLOAD',
    'TAG',
    'SHARE',
    'GALLERY',
    'CRM',
    'DELIVERY',
    'SETTINGS',
    'ERROR'
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end justify-center">
      <div className="bg-white w-full h-2/3 rounded-t-lg shadow-2xl flex flex-col">
        {/* Header */}
        <div className="bg-gray-800 text-white px-4 py-3 flex items-center justify-between rounded-t-lg">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-bold">🐛 Debug Console</h2>
            <span className="text-sm text-gray-300">
              {filteredLogs.length} logs
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {/* Filter Dropdown */}
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-gray-700 text-white px-3 py-1 rounded text-sm"
            >
              {filterOptions.map(option => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>

            {/* Auto-scroll Toggle */}
            <button
              onClick={() => setAutoScroll(!autoScroll)}
              className={`px-3 py-1 rounded text-sm ${
                autoScroll ? 'bg-green-600' : 'bg-gray-600'
              }`}
            >
              Auto-scroll: {autoScroll ? 'ON' : 'OFF'}
            </button>

            {/* Clear Logs */}
            <button
              onClick={clearDebugLogs}
              className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm"
            >
              Clear
            </button>

            {/* Export Logs */}
            <button
              onClick={downloadDebugLogs}
              className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm"
            >
              Export
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="bg-gray-600 hover:bg-gray-700 px-3 py-1 rounded text-sm"
            >
              Close
            </button>
          </div>
        </div>

        {/* Log Container */}
        <div
          id="debug-log-container"
          className="flex-1 overflow-y-auto bg-gray-900 text-gray-100 p-4 font-mono text-xs"
        >
          {filteredLogs.length === 0 ? (
            <div className="text-gray-500 text-center mt-8">
              No logs to display
            </div>
          ) : (
            filteredLogs.map(log => (
              <div
                key={log.id}
                className="mb-3 pb-3 border-b border-gray-700"
              >
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-gray-500">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  <span className={`font-bold ${getEventColor(log.eventType)}`}>
                    [{log.eventType}]
                  </span>
                </div>
                <pre className="text-gray-300 whitespace-pre-wrap">
                  {JSON.stringify(log.data, null, 2)}
                </pre>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function getEventColor(eventType) {
  if (eventType.includes('ERROR')) return 'text-red-400';
  if (eventType.includes('SUCCESS')) return 'text-green-400';
  if (eventType.includes('UPLOAD')) return 'text-blue-400';
  if (eventType.includes('TAG')) return 'text-purple-400';
  if (eventType.includes('SHARE')) return 'text-green-400';
  if (eventType.includes('GALLERY')) return 'text-yellow-400';
  if (eventType.includes('CRM')) return 'text-pink-400';
  if (eventType.includes('DELIVERY')) return 'text-cyan-400';
  return 'text-gray-400';
}

export default DebugConsole;
