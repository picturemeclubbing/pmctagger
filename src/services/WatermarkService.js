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
