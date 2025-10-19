/**
 * File: /src/debug/useDebug.js
 * Purpose: Page/service-friendly debug API with namespace + levels + timing.
 * Connects To: DebugContext.
 *
 * Usage:
 *   const debug = useDebug('UPLOAD');
 *   debug.info('File selected', { name });
 *   debug.time('compress'); ... debug.timeEnd('compress');
 */

import { useDebugContext } from './DebugContext';

export function useDebug(namespace = 'APP') {
  const ctx = useDebugContext();

  function base(level, msg, data) {
    ctx.add({ ts: Date.now(), level, ns: namespace, msg, data });
    // Also echo to console (optional)
    // eslint-disable-next-line no-console
    console[level === 'error' ? 'error' : (level === 'warn' ? 'warn' : 'log')](`[${namespace}] ${msg}`, data || '');
  }

  return {
    log: (msg, data) => base('log', msg, data),  // Added log method
    success: (msg, data) => base('info', msg, data),  // Added success method
    trace: (msg, data) => base('trace', msg, data),
    info: (msg, data) => base('info', msg, data),
    warn: (msg, data) => base('warn', msg, data),
    error: (msg, data) => base('error', msg, data),

    time: (label) => ctx.perfStart(`${namespace}:${label}`),
    timeEnd: (label, extra) => {
      const dur = ctx.perfEnd(`${namespace}:${label}`);
      if (dur != null) base('info', `⏱ ${label}: ${dur.toFixed(1)}ms`, extra);
      return dur;
    },

    subscribe: (cb) => ctx.subscribe(cb),
    clear: () => ctx.clear(),
    export: () => ctx.export()
  };
}

// Export as default for compatibility with existing default imports
export { useDebug as default };
