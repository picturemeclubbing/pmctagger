import React, { useState } from 'react';

// ============================================================================
// DEMO: Phase 5.2b Customer Auto-Linking + Version Display
// ============================================================================

// Mock data
const CUSTOMERS = [
  { id: 1, handle: '@john_doe', name: 'John Doe', email: 'john@example.com' },
  { id: 2, handle: '@jane_smith', name: 'Jane Smith', email: 'jane@example.com' },
  { id: 3, handle: '@mike_jones', name: 'Mike Jones', email: 'mike@example.com' }
];

// CustomerBadge Component
function CustomerBadge({ customerName, customerId }) {
  if (!customerName) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-green-600 to-green-500 text-white text-sm font-medium rounded-lg shadow-md border border-green-400/30">
      <span className="text-base">👤</span>
      <span className="font-semibold">{customerName}</span>
      <span className="text-xs opacity-75">✓ Linked</span>
    </div>
  );
}

// Tag Marker Simulation
function TagMarkerDemo({ tag, onComplete, onDelete }) {
  const [isEditing, setIsEditing] = useState(tag.isEditing);
  const [text, setText] = useState(tag.text);

  const handleComplete = () => {
    setIsEditing(false);
    onComplete(tag.id, text);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleComplete();
    }
  };

  return (
    <div className="inline-flex flex-col items-center gap-2 p-4 bg-gray-800 rounded-lg border-2 border-gray-700">
      {/* Instagram Logo */}
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg overflow-hidden" style={{
        background: isEditing ? '#3B82F6' : 'radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285AEB 90%)'
      }}>
        {!isEditing && (
          <div className="relative w-6 h-6 flex items-center justify-center">
            <div className="absolute inset-[5px] border-2 border-white rounded-lg"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-3 h-3 border-2 border-white rounded-full"></div>
            </div>
            <div className="absolute top-0.5 right-0.5 w-1 h-1 bg-white rounded-full"></div>
          </div>
        )}
      </div>

      {/* Text Input or Label */}
      {isEditing ? (
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={handleComplete}
          onKeyDown={handleKeyDown}
          placeholder="@username"
          className="px-3 py-2 rounded-lg text-white text-sm font-medium bg-gray-900 border-2 border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[140px] text-center"
          autoFocus
        />
      ) : (
        <>
          <div className="px-3 py-1.5 rounded-lg bg-black bg-opacity-80">
            <span className="text-white text-sm font-medium">{tag.text}</span>
          </div>

          {/* Customer Badge */}
          {tag.customerId && tag.customerName && (
            <CustomerBadge customerName={tag.customerName} customerId={tag.customerId} />
          )}
        </>
      )}

      {/* Delete Button */}
      {!isEditing && (
        <button
          onClick={() => onDelete(tag.id)}
          className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-xs rounded-full transition-colors"
        >
          ✕ Delete
        </button>
      )}
    </div>
  );
}

// App Version Component
function AppVersion() {
  return (
    <footer className="w-full border-t border-gray-800 bg-gray-900 mt-8">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-3 text-gray-400">
            <span className="font-semibold text-white">📸 PictureMeClubbing</span>
            <span className="text-gray-600">•</span>
            <span>v5.2.2</span>
            <span className="text-gray-600">•</span>
            <span className="text-gray-500">Oct 2025</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 text-blue-400 text-xs font-medium">
            <span>⚙️</span>
            <span>Debug Console</span>
          </div>
        </div>
        <div className="mt-2 text-center text-xs text-gray-600">
          © 2025 PMC Social Tagger. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

// Debug Log Entry
function DebugLogEntry({ log }) {
  const [expanded, setExpanded] = useState(false);

  const colors = {
    info: 'border-green-500 text-green-400',
    warn: 'border-yellow-500 text-yellow-400',
    error: 'border-red-500 text-red-400'
  };

  return (
    <div
      className={`p-3 border-l-4 rounded-r-md bg-gray-800/50 ${colors[log.level]} cursor-pointer hover:bg-gray-800`}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-start gap-3 text-sm">
        <span className="text-gray-500 font-mono text-xs">{log.time}</span>
        <span className="px-2 py-0.5 bg-gray-700 text-white rounded-full text-xs font-semibold">{log.namespace}</span>
        <span className={`flex-1 font-medium ${colors[log.level]}`}>{log.message}</span>
      </div>
      {expanded && log.payload && (
        <pre className="mt-2 text-xs text-gray-400 bg-gray-900/70 p-2 rounded overflow-x-auto">
          {JSON.stringify(log.payload, null, 2)}
        </pre>
      )}
    </div>
  );
}

// Main Demo App
export default function Phase52bDemoPage() {
  const [tags, setTags] = useState([
    { id: '1', text: '@username', isEditing: true, customerId: null, customerName: null }
  ]);
  const [logs, setLogs] = useState([]);
  const [nextId, setNextId] = useState(2);

  const addLog = (level, namespace, message, payload) => {
    const time = new Date().toLocaleTimeString('en-US', { hour12: false });
    setLogs(prev => [...prev, { time, level, namespace, message, payload }]);
  };

  const handleTagComplete = (tagId, text) => {
    // Simulate customer lookup
    const customer = CUSTOMERS.find(c => c.handle.toLowerCase() === text.toLowerCase());

    if (customer) {
      // Link customer
      setTags(prev => prev.map(t =>
        t.id === tagId
          ? { ...t, text, isEditing: false, customerId: customer.id, customerName: customer.name }
          : t
      ));
      addLog('info', 'TAGGING', 'customer_linked', {
        tagId,
        handle: text,
        customerId: customer.id,
        customerName: customer.name
      });
    } else {
      // No customer found
      setTags(prev => prev.map(t =>
        t.id === tagId
          ? { ...t, text, isEditing: false }
          : t
      ));
      addLog('warn', 'TAGGING', 'no_customer_found', {
        tagId,
        handle: text,
        suggestion: 'Add customer to CRM first'
      });
    }
  };

  const handleDeleteTag = (tagId) => {
    setTags(prev => prev.filter(t => t.id !== tagId));
    addLog('info', 'TAGGING', 'tag_deleted', { tagId });
  };

  const handleAddTag = () => {
    const newId = String(nextId);
    setNextId(nextId + 1);
    setTags(prev => [...prev, {
      id: newId,
      text: '@username',
      isEditing: true,
      customerId: null,
      customerName: null
    }]);
    addLog('info', 'TAGGING', 'tag_created', { tagId: newId });
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">📸 Phase 5.2b Demo</h1>
          <p className="text-gray-400">Customer Auto-Linking + Version Display</p>
        </div>

        {/* Instructions */}
        <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
          <h2 className="font-bold text-blue-400 mb-2">🎯 Try These Test Handles:</h2>
          <div className="grid grid-cols-3 gap-2 text-sm">
            {CUSTOMERS.map(c => (
              <div key={c.id} className="bg-gray-800 p-2 rounded">
                <span className="font-mono text-green-400">{c.handle}</span>
                <span className="text-gray-500 ml-2">→ {c.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tag Canvas */}
        <div className="bg-gray-800 rounded-lg p-8 border border-gray-700">
          <div className="flex flex-wrap gap-6 justify-center min-h-[200px] items-center">
            {tags.map(tag => (
              <TagMarkerDemo
                key={tag.id}
                tag={tag}
                onComplete={handleTagComplete}
                onDelete={handleDeleteTag}
              />
            ))}
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={handleAddTag}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              + Add Tag
            </button>
          </div>
        </div>

        {/* Debug Console */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          <div className="bg-gray-900 px-4 py-3 border-b border-gray-700 flex items-center justify-between">
            <h2 className="font-bold">🐛 Debug Console</h2>
            <span className="text-sm text-gray-400">{logs.length} events</span>
          </div>
          <div className="p-4 space-y-2 max-h-[300px] overflow-y-auto">
            {logs.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                No logs yet. Complete a tag to see events.
              </div>
            ) : (
              logs.map((log, i) => <DebugLogEntry key={i} log={log} />)
            )}
          </div>
        </div>

        {/* Version Footer */}
        <AppVersion />
      </div>
    </div>
  );
}
