import React, { useState, useEffect, useContext, createContext, useRef, useMemo } from 'react';

// --- CONSTANTS & CONFIGURATION ---
const LOG_LEVELS = {
  trace: { label: 'Trace', color: 'bg-gray-500', textColor: 'text-gray-400' },
  info: { label: 'Info', color: 'bg-green-500', textColor: 'text-green-400' },
  warn: { label: 'Warn', color: 'bg-yellow-500', textColor: 'text-yellow-400' },
  error: { label: 'Error', color: 'bg-red-500', textColor: 'text-red-400' },
};

// --- DEBUG CONTEXT (Enhanced as per Phase 5.2 spec) ---
const DebugContext = createContext();

export const DebugProvider = ({ children }) => {
  const [logs, setLogs] = useState([]);
  const [filters, setFilters] = useState({
    namespaces: [],
    levels: [],
    searchText: '',
  });

  const addLog = (level, namespace, message, payload) => {
    const newLog = {
      timestamp: Date.now(),
      level,
      namespace,
      message,
      payload,
    };
    setLogs(prevLogs => [...prevLogs, newLog]);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const searchMatch = !filters.searchText || 
        log.message.toLowerCase().includes(filters.searchText.toLowerCase()) || 
        log.namespace.toLowerCase().includes(filters.searchText.toLowerCase());
      
      const levelMatch = filters.levels.length === 0 || filters.levels.includes(log.level);
      
      const namespaceMatch = filters.namespaces.length === 0 || filters.namespaces.includes(log.namespace);

      return searchMatch && levelMatch && namespaceMatch;
    });
  }, [logs, filters]);

  const value = {
    logs,
    filteredLogs,
    addLog,
    clearLogs,
    setFilters,
    filters,
  };

  return <DebugContext.Provider value={value}>{children}</DebugContext.Provider>;
};

export const useDebugContext = () => {
  const context = useContext(DebugContext);
  if (!context) {
    throw new Error('useDebugContext must be used within a DebugProvider');
  }
  return context;
};

// Custom hook for components to easily add namespaced logs
export const useDebug = (namespace) => {
  const { addLog } = useDebugContext();
  return {
    trace: (message, payload) => addLog('trace', namespace, message, payload),
    info: (message, payload) => addLog('info', namespace, message, payload),
    warn: (message, payload) => addLog('warn', namespace, message, payload),
    error: (message, payload) => addLog('error', namespace, message, payload),
  };
};


// --- LogEntry Component (as per Phase 5.2 spec) ---
const LogEntry = ({ log }) => {
  const { timestamp, namespace, level, message, payload } = log;
  const [isExpanded, setIsExpanded] = useState(false);
  const levelConfig = LOG_LEVELS[level] || LOG_LEVELS.trace;

  const formattedTimestamp = new Date(timestamp).toLocaleTimeString('en-US', {
    hour12: false,
  });

  return (
    <div
      className={`flex items-start p-2 border-l-4 rounded-r-md transition-colors duration-200 hover:bg-gray-800/50 cursor-pointer ${levelConfig.color.replace('bg-', 'border-')}`}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className="flex-shrink-0 w-24 text-gray-500">{formattedTimestamp}</div>
      <div className="flex-shrink-0 w-32">
        <span className="px-2 py-1 text-xs font-semibold text-white bg-gray-700 rounded-full">
          {namespace}
        </span>
      </div>
      <div className="flex-grow font-mono text-sm">
        <p className={`${levelConfig.textColor}`}>{message}</p>
        {isExpanded && payload && (
          <pre className="mt-2 text-xs text-gray-400 bg-gray-900/50 p-2 rounded-md overflow-x-auto">
            {JSON.stringify(payload, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
};


// --- DebugPanel Page Component (as per Phase 5.2 spec) ---
const DebugPanel = () => {
  const { logs, filteredLogs, clearLogs, setFilters } = useDebugContext();
  const [searchText, setSearchText] = useState('');
  const [selectedLevels, setSelectedLevels] = useState([]);
  const [selectedNamespaces, setSelectedNamespaces] = useState([]);
  const [isAutoScroll, setIsAutoScroll] = useState(true);

  const logStreamRef = useRef(null);

  const allNamespaces = useMemo(() => [...new Set(logs.map(log => log.namespace))], [logs]);

  useEffect(() => {
    setFilters({
      searchText,
      levels: selectedLevels,
      namespaces: selectedNamespaces
    });
  }, [searchText, selectedLevels, selectedNamespaces, setFilters]);

  useEffect(() => {
    if (isAutoScroll && logStreamRef.current) {
      logStreamRef.current.scrollTop = logStreamRef.current.scrollHeight;
    }
  }, [filteredLogs, isAutoScroll]);
  
  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filteredLogs, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `debug_logs_${new Date().toISOString()}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
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

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white font-sans">
      {/* Header */}
      <header className="flex-shrink-0 p-4 bg-gray-800 border-b border-gray-700">
        <h1 className="text-xl font-bold">🐛 Debug Console</h1>
      </header>

      {/* Filter & Action Bar */}
      <div className="flex-shrink-0 p-2 space-y-2 bg-gray-800/50 border-b border-gray-700">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            placeholder="Search logs..."
            className="flex-grow px-3 py-2 text-sm bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <button onClick={handleExport} className="px-4 py-2 text-sm font-semibold bg-blue-600 rounded-md hover:bg-blue-700">Export</button>
          <button onClick={() => setIsAutoScroll(!isAutoScroll)} className={`px-4 py-2 text-sm font-semibold rounded-md ${isAutoScroll ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 hover:bg-gray-500'}`}>
            {isAutoScroll ? 'Live' : 'Paused'}
          </button>
          <button onClick={clearLogs} className="px-4 py-2 text-sm font-semibold bg-red-600 rounded-md hover:bg-red-700">Clear</button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="text-sm font-semibold mr-2">Namespaces:</div>
          {allNamespaces.map(ns => (
            <button key={ns} onClick={() => toggleNamespace(ns)} className={`px-3 py-1 text-xs rounded-full transition-colors ${selectedNamespaces.includes(ns) ? 'bg-indigo-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>
              {ns}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="text-sm font-semibold mr-2">Levels:</div>
          {Object.entries(LOG_LEVELS).map(([level, {label}]) => (
             <button key={level} onClick={() => toggleLevel(level)} className={`px-3 py-1 text-xs rounded-full transition-colors ${selectedLevels.includes(level) ? LOG_LEVELS[level].color + ' text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Log Stream */}
      <main ref={logStreamRef} className="flex-grow p-2 overflow-y-auto space-y-1">
        {filteredLogs.length > 0 ? (
          filteredLogs.map((log) => <LogEntry key={log.timestamp + log.message} log={log} />)
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            No logs to display. Try changing filters or performing an action.
          </div>
        )}
      </main>
    </div>
  );
};


// --- DEMO APP to host and test the Debug Console ---
const DemoApp = () => {
    const uploadLogger = useDebug('UPLOAD');
    const taggingLogger = useDebug('TAGGING');
    const shareLogger = useDebug('SHARE');
    
    const handleSimulateUpload = () => {
        uploadLogger.trace('Starting file validation...');
        uploadLogger.info('file_valid', { name: 'photo.jpg', size: 1024 });
        uploadLogger.warn('High resolution image detected', { resolution: '4096x2160' });
        setTimeout(() => {
            uploadLogger.info('upload_complete', { fileId: 'xyz-123' });
        }, 500);
    };
    
    const handleSimulateTagging = () => {
        taggingLogger.info('tag_created', { tag: '@john_doe', position: {x: 100, y: 250}});
        taggingLogger.error('Failed to link customer', { handle: '@jane_doe_private' });
    };

    const handleSimulateShare = () => {
        shareLogger.info('share_modal_opened');
        shareLogger.trace('User selected email provider', { provider: 'gmail' });
    };

    return (
        <div className="p-4 bg-gray-900 min-h-screen">
          <div className="max-w-md mx-auto bg-gray-800 p-6 rounded-lg">
             <h2 className="text-white text-lg font-bold mb-4">Log Generation Test Panel</h2>
             <p className="text-gray-400 text-sm mb-4">Click buttons to generate logs from different namespaces. The debug console below will update in real-time.</p>
             <div className="flex flex-col space-y-2">
                <button onClick={handleSimulateUpload} className="px-4 py-2 text-sm font-semibold bg-blue-600 rounded-md hover:bg-blue-700 text-white">Simulate Upload</button>
                <button onClick={handleSimulateTagging} className="px-4 py-2 text-sm font-semibold bg-purple-600 rounded-md hover:bg-purple-700 text-white">Simulate Tagging</button>
                <button onClick={handleSimulateShare} className="px-4 py-2 text-sm font-semibold bg-green-600 rounded-md hover:bg-green-700 text-white">Simulate Share</button>
             </div>
          </div>
          <div className="mt-4 border border-gray-700 rounded-lg overflow-hidden" style={{height: '70vh'}}>
            <DebugPanel />
          </div>
        </div>
    );
};


// --- MAIN APP COMPONENT ---
export default function App() {
  return (
    <DebugProvider>
      <DemoApp />
    </DebugProvider>
  );
}
