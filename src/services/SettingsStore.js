/**
 * File: /src/services/SettingsStore.js
 * Purpose: Read and write app-level settings (singleton row).
 * Connects To: database.js, used by SettingsPage, WatermarkService, CaptionService, Upload limits.
 */

import { db } from './database';

export async function getSettings() {
  return db.settings.get(1);
}

export async function saveSettings(updates) {
  const existing = await getSettings();
  const merged = { ...existing, ...updates, updatedAt: Date.now() };
  await db.settings.put(merged);
  return merged;
}

export async function resetDefaults() {
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
