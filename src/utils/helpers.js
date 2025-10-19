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

export function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export async function blobToDataURL(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
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

export function pctToPixels(pct, total) {
  return (pct / 100) * total;
}

export function pixelsToPct(px, total) {
  if (!total || total === 0) return 0;
  return (px / total) * 100;
}

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Normalize Instagram handle format
 * @param {string} input - Raw input from user
 * @returns {string} Normalized handle starting with @
 */
export function normalizeHandle(input) {
  if (!input || typeof input !== 'string') return '@';

  // Remove all spaces and non-alphanumeric characters except dots and underscores
  let clean = input.replace(/[^a-zA-Z0-9._]/g, '');

  // Ensure it starts with @
  if (!clean.startsWith('@')) {
    clean = '@' + clean;
  }

  // Limit length and remove multiple consecutive dots/underscores
  clean = clean.substring(0, 31); // 31 to account for @
  clean = clean.replace(/\.{2,}/g, '.');
  clean = clean.replace(/_ {2,}/g, '_');

  // Instagram handles can't end with . or _ or start with number after @
  clean = clean.replace(/(@\d)/, '@');
  clean = clean.replace(/([._])$/, '');

  return clean;
}
