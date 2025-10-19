import { DEBUG_EVENTS } from './constants';

// In-memory log storage
let debugLogs = [];
let debugEnabled = true;
let listeners = [];

/**
 * Initialize debugger system
 */
export function initDebugger() {
  debugLogs = [];
  debugEnabled = true;

  // Add keyboard shortcut for debug toggle (Ctrl+Shift+D)
  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        debugEnabled = !debugEnabled;
        console.log(`Debug mode ${debugEnabled ? 'enabled' : 'disabled'}`);
      }
    });
  }

  logDebug('SYSTEM', { message: 'Debugger initialized' });
}

/**
 * Log debug event
 * @param {string} eventType - Event type from DEBUG_EVENTS
 * @param {Object} data - Event data
 */
export function logDebug(eventType, data = {}) {
  if (!debugEnabled) return;

  const logEntry = {
    id: Date.now() + Math.random(),
    timestamp: new Date().toISOString(),
    eventType,
    data,
    component: data.component || 'UNKNOWN'
  };

  debugLogs.push(logEntry);

  // Keep only last 500 logs to prevent memory issues
  if (debugLogs.length > 500) {
    debugLogs = debugLogs.slice(-500);
  }

  // Console output with color coding
  const consoleStyle = getConsoleStyle(eventType);
  console.log(
    `%c[${eventType}]`,
    consoleStyle,
    new Date().toLocaleTimeString(),
    data
  );

  // Notify listeners
  notifyListeners(logEntry);
}

/**
 * Get all debug logs
 * @returns {Array} Array of log entries
 */
export function getDebugLogs() {
  return [...debugLogs];
}

/**
 * Clear all debug logs
 */
export function clearDebugLogs() {
  debugLogs = [];
  notifyListeners({ type: 'CLEAR' });
}

/**
 * Subscribe to debug log updates
 * @param {Function} callback
 * @returns {Function} Unsubscribe function
 */
export function subscribeToDebugLogs(callback) {
  listeners.push(callback);
  return () => {
    listeners = listeners.filter(cb => cb !== callback);
  };
}

/**
 * Notify all listeners of log update
 * @param {Object} logEntry
 */
function notifyListeners(logEntry) {
  listeners.forEach(callback => callback(logEntry));
}

/**
 * Get console style based on event type
 * @param {string} eventType
 * @returns {string} CSS style string
 */
function getConsoleStyle(eventType) {
  const styles = {
    UPLOAD: 'color: #3B82F6; font-weight: bold',
    TAG: 'color: #8B5CF6; font-weight: bold',
    SHARE: 'color: #10B981; font-weight: bold',
    GALLERY: 'color: #F59E0B; font-weight: bold',
    CRM: 'color: #EC4899; font-weight: bold',
    DELIVERY: 'color: #06B6D4; font-weight: bold',
    SETTINGS: 'color: #6366F1; font-weight: bold',
    ERROR: 'color: #EF4444; font-weight: bold',
    SUCCESS: 'color: #10B981; font-weight: bold',
    DB: 'color: #8B5CF6; font-weight: bold',
    SYSTEM: 'color: #6B7280; font-weight: bold'
  };

  for (const [key, style] of Object.entries(styles)) {
    if (eventType.includes(key)) {
      return style;
    }
  }

  return 'color: #6B7280; font-weight: bold';
}

/**
 * Export logs to text file
 * @returns {string} Formatted log text
 */
export function exportLogsToText() {
  const header = `PMC REVAMP DEBUG LOGS\nExported: ${new Date().toISOString()}\n${'='.repeat(60)}\n\n`;

  const logText = debugLogs.map(log => {
    return `[${log.timestamp}] ${log.eventType}\n${JSON.stringify(log.data, null, 2)}\n`;
  }).join('\n');

  return header + logText;
}

/**
 * Download logs as text file
 */
export function downloadDebugLogs() {
  const logText = exportLogsToText();
  const blob = new Blob([logText], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `pmc-debug-logs-${Date.now()}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Filter logs by event type
 * @param {string} eventType
 * @returns {Array}
 */
export function filterLogsByEventType(eventType) {
  return debugLogs.filter(log => log.eventType.includes(eventType));
}

/**
 * Get logs by time range
 * @param {Date} startTime
 * @param {Date} endTime
 * @returns {Array}
 */
export function getLogsByTimeRange(startTime, endTime) {
  return debugLogs.filter(log => {
    const logTime = new Date(log.timestamp);
    return logTime >= startTime && logTime <= endTime;
  });
}

export default {
  initDebugger,
  logDebug,
  getDebugLogs,
  clearDebugLogs,
  subscribeToDebugLogs,
  exportLogsToText,
  downloadDebugLogs,
  filterLogsByEventType,
  getLogsByTimeRange
};
