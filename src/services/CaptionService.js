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
