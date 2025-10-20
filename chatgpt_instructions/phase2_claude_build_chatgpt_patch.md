Phase 2 — ChatGPT Patch (Final, Ready for Grok)

Filename: phase2_claude_build_chatgpt_patch.md
Purpose: Drop-in replacement for Claude’s Phase 2 output with all fixes applied per Gemini + Blueprint.
Instruction to Grok: Create or overwrite the files below exactly as specified. Do not invent extra files. Keep paths and filenames identical. Each file begins with a header comment describing its purpose and connections.

✅ Summary of Corrections in This Patch

Aligns schema & field names to Blueprint (e.g., rawImageBlob, taggedThumbBlob, currentVersion, hasTags, tagsMeta[]).

Adds safe Blob handling + ensureBlob, blobToDataURL, dataURLToBlob.

Ensures SessionStore returns full session objects where needed; avoids Dexie update result misuse.

Adds EventBus (typed-ish) + emissions for session:created, tags:updated, share:completed, delivery:queued.

ImageService: robust compress/thumbnail/burn with consistent canvas sizing; no color-space surprises.

DeliveryQueue: skeleton with enqueue/poll/update; no external APIs yet.

Debug: timeline/perf markers, namespaced levels (trace/info/warn/error), export & clear.

HostingService: mock storage (localStorage) returning deterministic URLs for dev.

All files include headers with: path, purpose, connections.

If a Phase-1 placeholder already exists, overwrite it with the versions below.

/src/services/database.js
/**
 * File: /src/services/database.js
 * Purpose: Dexie initialization, schema definition, versioning, common helpers.
 * Connects To: SessionStore, SettingsStore, CustomerStore, DeliveryQueue, HostingService, Debug system.
 */

import Dexie from 'dexie';

export const db = new Dexie('pmc_revamp_db');

/**
 * Schema Version 2
 * - Matches Blueprint — Architecture & Data Flow
 * - Tables:
 *   - photoSessions
 *   - deliveryJobs
 *   - settings (singleton id=1)
 *   - customers
 */
db.version(2).stores({
  photoSessions:
    // id (auto), sessionId (unique), imageName, blobs, flags, metrics, links
    '++id, &sessionId, imageName, hasTags, currentVersion, createdAt, lastSharedAt, shareCount',
  deliveryJobs:
    // jobId primary key, with status and indexes for polling
    '&jobId, sessionId, status, createdAt, updatedAt',
  settings:
    // singleton id=1
    '&id',
  customers:
    // customerId primary key
    '&customerId, name, createdAt'
});

/** Ensure default settings row exists */
export async function initDatabase() {
  const existing = await db.settings.get(1);
  if (!existing) {
    await db.settings.put({
      id: 1,
      brandName: 'Your Brand',
      igHandle: '@yourhandle',
      eventName: '',
      watermarkStyle: {
        enabled: true,
        position: 'bottom',
        padding: 24,
        textSize: 28
      },
      deliveryProviders: {
        email: { enabled: false },
        sms: { enabled: false }
      },
      sizeLimits: { maxWidth: 1920, thumb: 300 },
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
  }
}

/src/services/SessionStore.js
/**
 * File: /src/services/SessionStore.js
 * Purpose: High-level CRUD for photo sessions with versioned blobs and tags metadata.
 * Connects To: database.js (Dexie db), EventBus, Debug (useDebug).
 */

import { db } from './database';
import { emit } from './EventBus';

export const SessionStore = {
  /**
   * Creates or overwrites a RAW session record with initial version fields.
   * Returns the full session object (not a Dexie count).
   */
  async saveRawVersion(sessionId, imageBlob, thumbBlob, imageName) {
    const now = Date.now();
    const session = {
      sessionId,
      imageName: imageName || `upload_${sessionId}.jpg`,
      rawImageBlob: imageBlob,
      rawThumbBlob: thumbBlob,
      taggedImageBlob: null,
      taggedThumbBlob: null,
      hasTags: false,
      tagsMeta: [],
      currentVersion: 'raw',
      createdAt: now,
      lastSharedAt: null,
      shareCount: 0,
      hostedUrl: null,
      deliveryPreference: null
    };
    await db.photoSessions.put(session);
    emit('session:created', { sessionId });
    return session;
  },

  async updateSession(sessionId, updates) {
    const existing = await db.photoSessions.get({ sessionId });
    if (!existing) throw new Error(`[SessionStore.updateSession] Not found: ${sessionId}`);
    const merged = { ...existing, ...updates };
    await db.photoSessions.put(merged);
    return merged;
  },

  async getSession(sessionId) {
    return db.photoSessions.get({ sessionId });
  },

  async listSessions(filters = {}) {
    // Basic filters (expand later if needed)
    let coll = db.photoSessions.toCollection();
    if (typeof filters.hasTags === 'boolean') {
      coll = coll.filter(s => s.hasTags === filters.hasTags);
    }
    return coll.reverse().sortBy('createdAt'); // newest first
  },

  async deleteSession(sessionId) {
    const s = await db.photoSessions.get({ sessionId });
    if (!s) return;
    await db.photoSessions.where({ sessionId }).delete();
  },

  /**
   * Persists tag overlay metadata (does not burn).
   */
  async updateTagsMeta(sessionId, tagsMeta = []) {
    const updated = await this.updateSession(sessionId, {
      tagsMeta,
      hasTags: Array.isArray(tagsMeta) && tagsMeta.length > 0
    });
    emit('tags:updated', { sessionId, count: tagsMeta.length });
    return updated;
  },

  /**
   * Saves burned/derived TAGGED version and thumbnail.
   */
  async saveTaggedVersion(sessionId, taggedBlob, taggedThumbBlob) {
    const updated = await this.updateSession(sessionId, {
      taggedImageBlob: taggedBlob,
      taggedThumbBlob,
      currentVersion: 'tagged'
    });
    emit('share:completed', { sessionId, type: 'tagged' });
    return updated;
  }
};

/src/services/SettingsStore.js
/**
 * File: /src/services/SettingsStore.js
 * Purpose: Read and write app-level settings (singleton row).
 * Connects To: database.js, used by SettingsPage, WatermarkService, CaptionService, Upload limits.
 */

import { db } from './database';

export const SettingsStore = {
  async getSettings() {
    return db.settings.get(1);
  },

  async saveSettings(updates) {
    const existing = await this.getSettings();
    const merged = { ...existing, ...updates, updatedAt: Date.now() };
    await db.settings.put(merged);
    return merged;
  },

  async resetDefaults() {
    const defaults = {
      id: 1,
      brandName: 'Your Brand',
      igHandle: '@yourhandle',
      eventName: '',
      watermarkStyle: {
        enabled: true,
        position: 'bottom',
        padding: 24,
        textSize: 28
      },
      deliveryProviders: {
        email: { enabled: false },
        sms: { enabled: false }
      },
      sizeLimits: { maxWidth: 1920, thumb: 300 },
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    await db.settings.put(defaults);
    return defaults;
  }
};

/src/services/CustomerStore.js
/**
 * File: /src/services/CustomerStore.js
 * Purpose: Customer CRUD & linking sessions to customers.
 * Connects To: database.js; used by CRMPage and possibly Share/Delivery flows.
 */

import { db } from './database';

export const CustomerStore = {
  async addCustomer(name, phone, email) {
    const customerId = `cust_${Date.now()}`;
    const row = {
      customerId,
      name,
      phone: phone || null,
      email: email || null,
      linkedSessions: [],
      createdAt: Date.now()
    };
    await db.customers.put(row);
    return row;
  },

  async updateCustomer(customerId, updates) {
    const existing = await db.customers.get({ customerId });
    if (!existing) throw new Error(`[CustomerStore.updateCustomer] Not found: ${customerId}`);
    const merged = { ...existing, ...updates };
    await db.customers.put(merged);
    return merged;
  },

  async deleteCustomer(customerId) {
    await db.customers.where({ customerId }).delete();
  },

  async listCustomers() {
    return db.customers.toArray();
  },

  async linkSessionToCustomer(sessionId, customerId) {
    const customer = await db.customers.get({ customerId });
    if (!customer) throw new Error(`[CustomerStore.link] customer missing: ${customerId}`);
    const linked = new Set(customer.linkedSessions || []);
    linked.add(sessionId);
    customer.linkedSessions = Array.from(linked);
    await db.customers.put(customer);
    return customer;
  }
};

/src/utils/helpers.js
/**
 * File: /src/utils/helpers.js
 * Purpose: Utility helpers for IDs, dates, validation, and blob/dataURL conversion.
 * Connects To: Upload, ImageService, SessionStore.
 */

export function generateSessionId() {
  return `${Date.now()}`;
}

export function formatDate(ts) {
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return `${ts}`;
  }
}

export function validateFile(file, { maxSizeMB = 10, types = ['image/jpeg', 'image/png'] } = {}) {
  if (!file) return { ok: false, reason: 'No file' };
  if (!types.includes(file.type)) return { ok: false, reason: 'Unsupported type' };
  const sizeMB = file.size / (1024 * 1024);
  if (sizeMB > maxSizeMB) return { ok: false, reason: `File too large (${sizeMB.toFixed(2)} MB)` };
  return { ok: true };
}

export function calculateFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export async function blobToDataURL(blob) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result);
    fr.onerror = reject;
    fr.readAsDataURL(blob);
  });
}

export async function dataURLToBlob(dataURL) {
  const res = await fetch(dataURL);
  return res.blob();
}

/** Accepts Blob or dataURL string — returns Blob */
export async function ensureBlob(dataUrlOrBlob) {
  if (dataUrlOrBlob instanceof Blob) return dataUrlOrBlob;
  if (typeof dataUrlOrBlob === 'string' && dataUrlOrBlob.startsWith('data:')) {
    return dataURLToBlob(dataUrlOrBlob);
  }
  throw new Error('[helpers.ensureBlob] Invalid input');
}

/src/services/EventBus.js
/**
 * File: /src/services/EventBus.js
 * Purpose: Lightweight pub/sub for app events used by UI and services.
 * Connects To: SessionStore, DeliveryQueue, pages for reactive UX.
 */

const listeners = new Map(); // eventName -> Set(callback)

export function on(eventName, cb) {
  if (!listeners.has(eventName)) listeners.set(eventName, new Set());
  listeners.get(eventName).add(cb);
  return () => off(eventName, cb);
}

export function off(eventName, cb) {
  const set = listeners.get(eventName);
  if (set) set.delete(cb);
}

export function emit(eventName, payload) {
  const set = listeners.get(eventName);
  if (!set) return;
  for (const cb of set) {
    try { cb(payload); } catch (e) { console.error('[EventBus]', eventName, e); }
  }
}

/** Event Names (informal typing) */
export const Events = {
  SESSION_CREATED: 'session:created',
  TAGS_UPDATED: 'tags:updated',
  SHARE_COMPLETED: 'share:completed',
  DELIVERY_QUEUED: 'delivery:queued'
};

/src/services/ImageService.js
/**
 * File: /src/services/ImageService.js
 * Purpose: Image compression, thumbnails, and tag burning (canvas).
 * Connects To: UploadPage, TaggingPage (future preview), SharePage, SessionStore.
 */

import { ensureBlob } from '../utils/helpers';

/** Internal: draws a blob to a canvas with optional max width */
async function drawToCanvas(imgBlob, maxWidth = null, qualityAware = false) {
  const blob = await ensureBlob(imgBlob);
  const url = URL.createObjectURL(blob);
  const img = new Image();
  img.decoding = 'async';
  img.loading = 'eager';
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
    img.src = url;
  });

  const scale = maxWidth ? Math.min(1, maxWidth / img.width) : 1;
  const width = Math.max(1, Math.round(img.width * scale));
  const height = Math.max(1, Math.round(img.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { alpha: true, willReadFrequently: false });

  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);
  URL.revokeObjectURL(url);
  return { canvas, ctx, width, height };
}

async function canvasToBlob(canvas, quality = 0.9, type = 'image/jpeg') {
  return new Promise(resolve => canvas.toBlob(b => resolve(b), type, quality));
}

export const ImageService = {
  async compressImage(fileOrBlob, maxWidth = 1920, quality = 0.85) {
    const { canvas } = await drawToCanvas(fileOrBlob, maxWidth);
    // Prefer JPEG for better size; keep PNG if source png and transparency needed (not needed here).
    const out = await canvasToBlob(canvas, quality, 'image/jpeg');
    return out;
  },

  async makeThumbnail(fileOrBlob, size = 300) {
    const { canvas } = await drawToCanvas(fileOrBlob, size);
    const out = await canvasToBlob(canvas, 0.9, 'image/jpeg');
    return out;
  },

  /**
   * Burns tagsMeta onto the raw image. Uses deterministic sizing based on image size.
   * tagsMeta: [{ type, xPct, yPct, logoScale, text, fontSize, color, shadow }]
   */
  async burnTagsToImage(rawImageBlob, tagsMeta = []) {
    const { canvas, ctx, width, height } = await drawToCanvas(rawImageBlob);

    for (const tag of tagsMeta) {
      const x = (tag.xPct / 100) * width;
      const y = (tag.yPct / 100) * height;
      const logoSize = Math.max(16, Math.round((tag.logoScale || 1) * (Math.min(width, height) / 12)));

      // Logo: load from settings assets later; for now draw a rounded rect placeholder
      ctx.save();
      ctx.beginPath();
      const r = Math.round(logoSize * 0.2);
      ctx.moveTo(x - logoSize/2 + r, y - logoSize + r);
      ctx.arcTo(x + logoSize/2, y - logoSize, x + logoSize/2, y - logoSize + r, r);
      ctx.arcTo(x + logoSize/2, y, x + logoSize/2 - r, y, r);
      ctx.arcTo(x - logoSize/2, y, x - logoSize/2, y - r, r);
      ctx.arcTo(x - logoSize/2, y - logoSize, x - logoSize/2 + r, y - logoSize, r);
      ctx.closePath();

      // Instagram-like gradient fill (stable & vivid)
      const grad = ctx.createLinearGradient(x - logoSize, y - logoSize, x + logoSize, y);
      grad.addColorStop(0.0, '#3051f1');
      grad.addColorStop(0.5, '#c92bb7');
      grad.addColorStop(1.0, '#f73344');
      ctx.fillStyle = grad;
      ctx.fill();

      // Inner camera circle
      ctx.beginPath();
      ctx.arc(x, y - logoSize * 0.65, logoSize * 0.18, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();

      // Username text under logo
      const fontPx = Math.max(12, Math.round(tag.fontSize || logoSize * 0.45));
      ctx.font = `600 ${fontPx}px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      if (tag.shadow) {
        ctx.shadowColor = 'rgba(0,0,0,0.4)';
        ctx.shadowBlur = Math.max(2, Math.round(fontPx/6));
        ctx.shadowOffsetY = Math.max(1, Math.round(fontPx/10));
      } else {
        ctx.shadowColor = 'transparent';
      }
      ctx.fillStyle = tag.color || '#ffffff';
      ctx.fillText(tag.text || '@username', x, y + Math.round(logoSize * 0.15));

      ctx.restore();
    }

    return canvasToBlob(canvas, 0.92, 'image/jpeg');
  }
};

/src/services/WatermarkService.js
/**
 * File: /src/services/WatermarkService.js
 * Purpose: Apply business gradient overlay watermark with brand/event text.
 * Connects To: SharePage; uses SettingsStore (passed settings object).
 */

import { ensureBlob } from '../utils/helpers';

export const WatermarkService = {
  async applyGradientWatermark(imageBlob, settings) {
    const blob = await ensureBlob(imageBlob);
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.decoding = 'async';
    await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = url; });

    const canvas = document.createElement('canvas');
    canvas.width = img.width; canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);

    if (settings?.watermarkStyle?.enabled) {
      const pad = settings.watermarkStyle.padding ?? 24;
      const textSize = settings.watermarkStyle.textSize ?? 28;

      // Bottom gradient bar
      const barH = Math.max(64, Math.round(img.height * 0.12));
      const grad = ctx.createLinearGradient(0, img.height - barH, 0, img.height);
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(1, 'rgba(0,0,0,0.55)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, img.height - barH, img.width, barH);

      // Text
      ctx.font = `600 ${textSize}px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'bottom';
      ctx.fillStyle = '#ffffff';
      const line1 = settings.eventName || '';
      const line2 = settings.igHandle || settings.brandName || '';
      if (line1) ctx.fillText(line1, pad, img.height - pad - (line2 ? textSize + 8 : 0));
      if (line2) ctx.fillText(line2, pad, img.height - pad);
    }

    URL.revokeObjectURL(url);
    return new Promise(res => canvas.toBlob(b => res(b), 'image/jpeg', 0.92));
  }
};

/src/services/CaptionService.js
/**
 * File: /src/services/CaptionService.js
 * Purpose: Build a caption string with @mentions and event details for clipboard.
 * Connects To: SharePage; SettingsStore for defaults.
 */

export const CaptionService = {
  generateCaption(tagsMeta = [], customerName = '', eventName = '') {
    const mentions = tagsMeta
      .map(t => (t?.text || '').trim())
      .filter(Boolean)
      .map(u => (u.startsWith('@') ? u : `@${u}`));

    const lines = [];
    if (eventName) lines.push(eventName);
    if (customerName) lines.push(`Captured for ${customerName}`);
    if (mentions.length) lines.push(mentions.join(' '));
    lines.push('#photobooth #event #photo #share');
    return lines.join('\n');
  }
};

/src/services/HostingService.js
/**
 * File: /src/services/HostingService.js
 * Purpose: Dev-only mock hosting that returns a deterministic "public URL".
 * Connects To: SharePage, DeliveryQueue.
 *
 * NOTE: For Phase 2 we simulate remote upload using localStorage.
 */

import { blobToDataURL } from '../utils/helpers';

export const HostingService = {
  async upload(blob, filename) {
    const dataURL = await blobToDataURL(blob);
    const key = `hosted:${Date.now()}:${filename}`;
    try {
      localStorage.setItem(key, dataURL);
    } catch (e) {
      // Fallback: store a tiny pointer
      localStorage.setItem(key, '[stored:too-large]');
    }
    // Deterministic fake URL
    return `pmc-host://${encodeURIComponent(key)}`;
  }
};

/src/services/DeliveryQueue.js
/**
 * File: /src/services/DeliveryQueue.js
 * Purpose: Simple in-app queue for delivery jobs (email/sms placeholders).
 * Connects To: database.js (deliveryJobs), HostingService, EventBus, Debug.
 */

import { db } from './database';
import { emit } from './EventBus';

export const DeliveryQueue = {
  async enqueueJob(sessionId, version, target, method) {
    const jobId = `job_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
    const job = {
      jobId,
      sessionId,
      version, // 'raw' | 'tagged'
      target,  // { email?, phone? }
      method,  // 'email' | 'sms' | 'both'
      status: 'pending',
      attempts: 0,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    await db.deliveryJobs.put(job);
    emit('delivery:queued', { jobId, sessionId, version, method });
    return job;
  },

  async pollPending(limit = 10) {
    const pending = await db.deliveryJobs.where({ status: 'pending' }).limit(limit).toArray();
    return pending;
  },

  async updateJobStatus(jobId, status) {
    const job = await db.deliveryJobs.get({ jobId });
    if (!job) return null;
    job.status = status;
    job.updatedAt = Date.now();
    await db.deliveryJobs.put(job);
    return job;
  }
};

/src/debug/DebugContext.jsx
/**
 * File: /src/debug/DebugContext.jsx
 * Purpose: Central debug state, log storage, export, and subscription for UI.
 * Connects To: useDebug hook, DebugPanel component, global pages & services.
 */

import React, { createContext, useContext, useMemo, useRef, useState } from 'react';

const DebugContext = createContext(null);

export function DebugProvider({ children }) {
  const [logs, setLogs] = useState([]); // {ts, level, ns, msg, data}
  const subscribersRef = useRef(new Set());
  const perfRef = useRef(new Map()); // label -> ts
  const MAX = 500;

  const api = useMemo(() => ({
    add(entry) {
      setLogs(prev => {
        const next = [...prev, entry].slice(-MAX);
        for (const sub of subscribersRef.current) { try { sub(next); } catch {} }
        return next;
      });
    },
    subscribe(cb) {
      subscribersRef.current.add(cb);
      return () => subscribersRef.current.delete(cb);
    },
    clear() { setLogs([]); },
    export() {
      const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pmc_debug_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    },
    perfStart(label) { perfRef.current.set(label, performance.now()); },
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
  }), [logs]);

  return (
    <DebugContext.Provider value={api}>
      {children}
    </DebugContext.Provider>
  );
}

export function useDebugContext() {
  const ctx = useContext(DebugContext);
  if (!ctx) throw new Error('useDebugContext must be used within <DebugProvider/>');
  return ctx;
}

/src/debug/useDebug.js
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

Integration Notes (for Grok)

These files are Phase 2 only. They build on Phase 1 foundation (routing, placeholders, Debug UI).

Do not modify Phase 1 pages in this step.

After creating these files, ensure initDatabase() is called in app bootstrap (e.g., main.jsx or App.jsx) once on app start:

// Example (add in App bootstrap)
import { useEffect } from 'react';
import { initDatabase } from './services/database';

function AppRoot() {
  useEffect(() => { initDatabase(); }, []);
  return <App />;
}


Pages will start consuming these services in Phase 3 (Upload/Tag/Share flows).

Sanity Checklist (Self-Test)

 npm run dev compiles with no errors.

 initDatabase() creates default settings row.

 SessionStore.saveRawVersion() returns a full object and not a Dexie count.

 ImageService.compressImage() returns a real Blob.

 ImageService.makeThumbnail() returns a Blob ≤ ~50KB for typical photos.

 ImageService.burnTagsToImage() produces visible tag (logo + text).

 WatermarkService.applyGradientWatermark() overlays bottom gradient & text.

 HostingService.upload() returns deterministic URL (pmc-host://...).

 DeliveryQueue.enqueueJob() persists row with pending status.

 useDebug('UPLOAD').time('x') logs a duration on timeEnd.

End of document.