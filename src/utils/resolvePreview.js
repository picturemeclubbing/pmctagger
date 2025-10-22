// src/utils/resolvePreview.js
// Helper to pick the best available preview for a session

export function resolvePreview(session) {
  try {
    if (session?.thumbDataUrl) return session.thumbDataUrl;
    if (session?.thumbnailPath) return session.thumbnailPath;
    if (session?.imageUrl) return session.imageUrl;
    if (session?.fileBlob) return URL.createObjectURL(session.fileBlob);
    return '/assets/no-image.png';
  } catch (e) {
    console.warn('[HOMEPAGE] resolvePreview failed', e);
    return '/assets/no-image.png';
  }
}
