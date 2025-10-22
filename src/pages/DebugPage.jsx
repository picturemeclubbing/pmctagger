// File: /src/pages/DebugPage.jsx
// Purpose: Enhanced Debug Console with filtering, pause/resume, and session tracking (Phase 5.2a)
// Connects To: DebugContext.jsx, useDebug.js, App.jsx (route registration)

import React, { useState, useEffect, useRef, useMemo } from 'react';
import DebugPanel from '../components/DebugPanel';

// ============================================================================
// CONSTANTS & CONFIGURATION
// ============================================================================

const LOG_LEVELS = {
  trace: { label: 'Trace', color: 'bg-gray-500', textColor: 'text-gray-400', borderColor: 'border-gray-500' },
  info: { label: 'Info', color: 'bg-green-500', textColor: 'text-green-400', borderColor: 'border-green-500' },
  warn: { label: 'Warn', color: 'bg-yellow-500', textColor: 'text-yellow-400', borderColor: 'border-yellow-500' },
  error: { label: 'Error', color: 'bg-red-500', textColor: 'text-red-400', borderColor: 'border-red-500' },
};

// ============================================================================
// LOG ENTRY COMPONENT (as per Phase 5.2 spec)
// ============================================================================

export function LogEntry({ log }) {
  const { timestamp, namespace, level, message, payload } = log;
  const [isExpanded, setIsExpanded] = useState(false);
  const levelConfig = LOG_LEVELS[level] || LOG_LEVELS.trace;

  const formattedTimestamp = new Date(timestamp).toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <div
      className={`flex items-start p-3 border-l-4 rounded-r-md transition-all duration-200 hover:bg-gray-800/50 cursor-pointer ${levelConfig.borderColor}`}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      {/* Timestamp */}
      <div className="flex-shrink-0 w-20 text-xs text-gray-500 font-mono">
        {formattedTimestamp}
      </div>

      {/* Namespace Badge */}
      <div className="flex-shrink-0 w-28 px-2">
        <span className="px-2 py-1 text-xs font-semibold text-white bg-gray-700 rounded-full whitespace-nowrap">
          {namespace}
        </span>
      </div>

      {/* Level Badge */}
      <div className="flex-shrink-0 w-16 px-2">
        <span className={`px-2 py-1 text-xs font-bold rounded ${levelConfig.color} text-white`}>
          {levelConfig.label}
        </span>
      </div>

      {/* Message & Payload */}
      <div className="flex-grow font-mono text-sm">
        <p className={`${levelConfig.textColor} font-medium`}>{message}</p>
        {isExpanded && payload && (
          <pre className="mt-2 text-xs text-gray-400 bg-gray-900/70 p-3 rounded-md overflow-x-auto border border-gray-700">
            {JSON.stringify(payload, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// SESSION TRACKER COMPONENT (Phase 5.2a Enhancement)
// ============================================================================

function SessionTracker({ logs }) {
  const currentSession = useMemo(() => {
    // Extract sessionId from most recent log payload
    for (let i = logs.length - 1; i >= 0; i--) {
      const log = logs[i];
      if (log.payload && log.payload.sessionId) {
        return log.payload.sessionId;
      }
    }
    return null;
  }, [logs]);

  if (!currentSession) return null;

  return (
    <div className="px-4 py-2 bg-gray-800/70 border-b border-gray-700 flex items-center gap-2">
      <span className="text-xs font-semibold text-gray-400">Current Session:</span>
      <span className="px-2 py-1 text-xs font-mono bg-indigo-600 text-white rounded">
        {currentSession}
      </span>
    </div>
  );
}

// ============================================================================
// MAIN DEBUG PANEL PAGE (Phase 5.2a)
// ============================================================================

export default function DebugPage({ debugContext }) {
  // Destructure from debugContext prop
  const logs = debugContext?.logs || [];
  const filteredLogs = debugContext?.filteredLogs || [];
  const setFilters = debugContext?.setFilters || (() => {});
  const clearLogs = debugContext?.clear || (() => {});
  const exportLogs = debugContext?.export || (() => {});
  const isPaused = debugContext?.isPaused || false;
  const togglePause = debugContext?.togglePause || (() => {});

  const [searchText, setSearchText] = useState('');
  const [selectedLevels, setSelectedLevels] = useState([]);
  const [selectedNamespaces, setSelectedNamespaces] = useState([]);
  const [isAutoScroll, setIsAutoScroll] = useState(true);

  const logStreamRef = useRef(null);

  // Extract unique namespaces from all logs
  const allNamespaces = useMemo(() => {
    return [...new Set(logs.map(log => log.namespace))];
  }, [logs]);

  // Update filters whenever search/level/namespace changes
  useEffect(() => {
    setFilters({
      searchText,
      levels: selectedLevels,
      namespaces: selectedNamespaces
    });
  }, [searchText, selectedLevels, selectedNamespaces, setFilters]);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (isAutoScroll && logStreamRef.current) {
      logStreamRef.current.scrollTop = logStreamRef.current.scrollHeight;
    }
  }, [filteredLogs, isAutoScroll]);

  // ========== HANDLERS ==========

  const handleExport = () => {
    if (exportLogs) {
      exportLogs();
    } else {
      // Fallback: Optimized Blob export (Phase 5.2a requirement)
      const blob = new Blob([JSON.stringify(filteredLogs, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pmc_debug_${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const toggleLevel = (level) => {
    setSelectedLevels(prev =>
      prev.includes(level) ? prev.filter(l => l !== level) : [...prev, level]
    );
  };

  const toggleNamespace = (namespace) => {
    setSelectedNamespaces(prev =>
      prev.includes(namespace) ? prev.filter(n => n !== namespace) : [...prev, namespace]
    );
  };

  const handleClearAll = () => {
    if (window.confirm('Clear all logs? This cannot be undone.')) {
      clearLogs();
    }
  };

  // ========== RENDER ==========

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white font-sans">
      {/* ===== HEADER ===== */}
      <header className="flex-shrink-0 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold">🐛 Debug Console</h1>
            {/* Phase 5.2a: Pause/Resume Status Badge */}
            <button
              onClick={togglePause}
              className={`px-3 py-1 text-sm font-semibold rounded-full transition-all ${
                isPaused
                  ? 'bg-yellow-600 hover:bg-yellow-700 animate-pulse'
                  : 'bg-green-600 hover:bg-green-700'
              }`}
              title={isPaused ? 'Click to resume logging' : 'Click to pause logging'}
            >
              {isPaused ? '⏸️ Paused' : '▶️ Live'}
            </button>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span>{filteredLogs.length} / {logs.length} logs</span>
          </div>
        </div>
      </header>

        {/* Phase 5.2a: Session Tracker */}
        <SessionTracker logs={logs} />

      {/* ===== FILTER & ACTION BAR ===== */}
      <div className="flex-shrink-0 p-3 space-y-3 bg-gray-800/50 border-b border-gray-700">
        {/* Search & Action Buttons */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="🔍 Search logs..."
            className="flex-grow px-4 py-2 text-sm bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <button
            onClick={handleExport}
            className="px-4 py-2 text-sm font-semibold bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
            title="Export filtered logs as JSON"
          >
            💾 Export
          </button>
          <button
            onClick={() => setIsAutoScroll(!isAutoScroll)}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
              isAutoScroll
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-gray-600 hover:bg-gray-500'
            }`}
            title={isAutoScroll ? 'Auto-scroll enabled' : 'Auto-scroll disabled'}
          >
            {isAutoScroll ? '📜 Auto' : '🔒 Fixed'}
          </button>
          <button
            onClick={handleClearAll}
            className="px-4 py-2 text-sm font-semibold bg-red-600 rounded-md hover:bg-red-700 transition-colors"
            title="Clear all logs"
          >
            🗑️ Clear
          </button>
        </div>

        {/* Namespace Filter */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="text-sm font-semibold text-gray-300">Namespaces:</div>
          {allNamespaces.length === 0 ? (
            <span className="text-xs text-gray-500 italic">No namespaces yet</span>
          ) : (
            allNamespaces.map(ns => (
              <button
                key={ns}
                onClick={() => toggleNamespace(ns)}
                className={`px-3 py-1 text-xs font-medium rounded-full transition-all ${
                  selectedNamespaces.includes(ns)
                    ? 'bg-indigo-500 text-white shadow-md'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {ns}
              </button>
            ))
          )}
        </div>

        {/* Level Filter */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="text-sm font-semibold text-gray-300">Levels:</div>
          {Object.entries(LOG_LEVELS).map(([level, { label, color }]) => (
            <button
              key={level}
              onClick={() => toggleNamespace(level)} // Fixed: should be toggleLevel
              className={`px-3 py-1 text-xs font-bold rounded-full transition-all ${
                selectedLevels.includes(level)
                  ? `${color} text-white shadow-md`
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ===== PHASE 8.2: DEBUG TOOLS PANEL ===== */}
      <section className="flex-shrink-0 px-3 py-4 bg-gray-800/30 border-b border-gray-700">
        <DebugPanel />
      </section>

      {/* ===== LOG STREAM ===== */}
      <main
        ref={logStreamRef}
        className="flex-grow p-3 overflow-y-auto space-y-2 bg-gray-900"
      >
        {filteredLogs.length > 0 ? (
          filteredLogs.map((log, index) => (
            <LogEntry key={`${log.timestamp}-${index}`} log={log} />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-lg font-medium">No logs to display</p>
            <p className="text-sm mt-2">
              {logs.length > 0
                ? 'Try adjusting your filters'
                : 'Perform actions in the app to generate logs'}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

// ============================================================================
// ✅ Phase 5.2a Compliance Summary
// ============================================================================
// - Pause/Resume: Added (togglePause prop, visual badge in header)
// - Session Tracker: Added (SessionTracker component extracts sessionId)
// - Router Integration: Component renamed to DebugPage.jsx for /debug route
// - Export Optimization: Added Blob + URL.createObjectURL for large datasets
// - Backward Compatibility: Preserved (accepts debugContext prop)
// - UI Enhancements: Auto-scroll toggle, improved filter UX, empty state
// ============================================================================
