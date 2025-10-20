/**
 * File: /src/debug/DebugContext.jsx
 * Purpose: Central debug state, log storage, export, and subscription for UI.
 * Connects To: useDebug hook, DebugPanel component, global pages & services.
 */

import React, { createContext, useContext, useState, useRef } from 'react';

const DebugContext = createContext(null);

const MAX_LOGS = 1000;

export function DebugProvider({ children }) {
  const [logs, setLogs] = useState([]);
  const subscribersRef = useRef(new Set());
  const perfRef = useRef(new Map());
  const MAX = 500;

  const api = {
    add(entry) {
      setLogs(prev => {
        const next = [...prev, entry].slice(-MAX);
        for (const sub of subscribersRef.current) {
          try {
            sub(next);
          } catch {}
        }
        return next;
      });
    },
    subscribe(cb) {
      subscribersRef.current.add(cb);
      return () => subscribersRef.current.delete(cb);
    },
    clear() {
      setLogs([]);
    },
    export() {
      const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pmc_debug_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    },
    perfStart(label) {
      perfRef.current.set(label, performance.now());
    },
    perfEnd(label) {
      const start = perfRef.current.get(label);
      if (start != null) {
        const dur = performance.now() - start;
        perfRef.current.delete(label);
        return dur;
      }
      return null;
    },
    logs
  };

  return <DebugContext.Provider value={api}>{children}</DebugContext.Provider>;
}

export function useDebugContext() {
  const ctx = useContext(DebugContext);
  if (!ctx) throw new Error('useDebugContext must be used within <DebugProvider/>');
  return ctx;
}
