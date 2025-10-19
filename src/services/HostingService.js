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
