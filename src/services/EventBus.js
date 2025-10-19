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
