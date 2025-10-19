// File: /src/services/TagCanvasService.js
// Purpose: Canvas-based tag burning into image files
// Connects to: SocialTagger.jsx, SharePage.jsx

import { pctToPixels } from '../utils/helpers';

/**
 * Burn tags permanently into image
 * @param {string} imageDataUrl - Base64 data URL of image
 * @param {Array} tags - Array of tag objects with xPct, yPct, text
 * @param {Object} imageDimensions - Current display dimensions for scaling
 * @returns {Promise<string>} Data URL of image with burned tags
 */
export async function burnTagsToImage(imageDataUrl, tags, imageDimensions) {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Use full image resolution
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;

        // Draw base image
        ctx.drawImage(img, 0, 0);

        // Calculate scale factor (display → actual)
        const scaleX = img.naturalWidth / imageDimensions.width;
        const scaleY = img.naturalHeight / imageDimensions.height;

        // Draw each tag
        tags.forEach(tag => {
          if (!tag.text) return;

          // Convert percentage to actual pixels on full-res image
          const x = (tag.xPct / 100) * canvas.width;
          const y = (tag.yPct / 100) * canvas.height;

          drawInstagramTag(ctx, x, y, tag.text, scaleX);
        });

        // Convert to data URL
        const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
        resolve(dataUrl);
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image for burning'));
    };

    img.src = imageDataUrl;
  });
}

function drawInstagramTag(ctx, x, y, text, scale = 1) {
  ctx.save();

  // Tighter layout: reduced box size and padding for better proportion
  const boxSize = 30 * scale;     // was 36
  const padding = 8 * scale;      // was 12
  const fontSize = 22 * scale;    // was 24
  const logoSize = 26 * scale;    // unchanged for visual balance
  const iconPadding = (boxSize - logoSize) / 2 * scale; // Corrected: logoSize inset from box edges

  const gradient = ctx.createRadialGradient(
    x - boxSize * 0.2,
    y + boxSize * 0.5,
    0,
    x,
    y,
    boxSize * 0.8
  );
  gradient.addColorStop(0, '#fdf497');
  gradient.addColorStop(0.05, '#fdf497');
  gradient.addColorStop(0.45, '#fd5949');
  gradient.addColorStop(0.6, '#d6249f');
  gradient.addColorStop(0.9, '#285AEB');

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.roundRect(x - boxSize / 2, y - boxSize / 2, boxSize, boxSize, 8 * scale);
  ctx.fill();

  ctx.strokeStyle = '#FFFFFF';
  ctx.fillStyle = '#FFFFFF';
  ctx.lineWidth = 2.5 * scale; // slightly thicker for visibility

  ctx.beginPath();
  ctx.roundRect(x - logoSize / 2, y - logoSize / 2, logoSize, logoSize, 4 * scale);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(x, y, logoSize * 0.25, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(x + logoSize * 0.25, y - logoSize * 0.25, 2 * scale, 0, Math.PI * 2);
  ctx.fill();

  const textY = y + boxSize / 2 + padding + fontSize / 2;

  ctx.font = `bold ${fontSize}px Arial`;
  const textWidth = ctx.measureText(text).width;
  const bgWidth = textWidth + padding * 2;
  const bgHeight = fontSize + padding;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
  ctx.beginPath();
  ctx.roundRect(
    x - bgWidth / 2,
    textY - fontSize / 2 - padding / 2,
    bgWidth,
    bgHeight,
    8 * scale
  );
  ctx.fill();

  ctx.fillStyle = '#FFFFFF';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
  ctx.shadowBlur = 4 * scale;
  ctx.shadowOffsetX = 2 * scale;
  ctx.shadowOffsetY = 2 * scale;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, textY);

  ctx.restore();
}

/**
 * Create Instagram logo as small circle (alternative to @)
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x
 * @param {number} y
 * @param {number} size
 */
function drawInstagramLogo(ctx, x, y, size) {
  ctx.save();

  // Gradient circle
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, size / 2);
  gradient.addColorStop(0, '#f09433');
  gradient.addColorStop(0.25, '#e6683c');
  gradient.addColorStop(0.5, '#dc2743');
  gradient.addColorStop(0.75, '#cc2366');
  gradient.addColorStop(1, '#bc1888');

  ctx.beginPath();
  ctx.arc(x, y, size / 2, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.fill();

  // White @ symbol
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `bold ${size * 0.6}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('@', x, y);

  ctx.restore();
}

/**
 * Polyfill for roundRect (not available in all browsers)
 */
if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function(x, y, width, height, radius) {
    this.moveTo(x + radius, y);
    this.lineTo(x + width - radius, y);
    this.quadraticCurveTo(x + width, y, x + width, y + radius);
    this.lineTo(x + width, y + height - radius);
    this.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    this.lineTo(x + radius, y + height);
    this.quadraticCurveTo(x, y + height, x, y + height - radius);
    this.lineTo(x, y + radius);
    this.quadraticCurveTo(x, y, x + radius, y);
    this.closePath();
  };
}

export default {
  burnTagsToImage
};
