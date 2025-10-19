// File: /src/components/tagging/TagMarker.jsx
// Purpose: Individual tag marker with square Instagram logo
// Connects to: SocialTagger.jsx

import React, { useState, useRef, useEffect } from 'react';
import { pctToPixels, pixelsToPct, normalizeHandle } from '../../utils/helpers';

function TagMarker({ tag, imageDimensions, onTextChange, onComplete, onDelete, onMove }) {
  const markerRef = useRef(null);
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);

  useEffect(() => {
    if (tag.isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [tag.isEditing]);

  const { width, height } = imageDimensions;

  if (!width || !height) {
    return null;
  }

  const xPixels = pctToPixels(tag.xPct, width);
  const yPixels = pctToPixels(tag.yPct, height);

  const handlePointerDown = (e) => {
    if (tag.isEditing) return;
    e.stopPropagation();
    e.preventDefault();

    setDragStart({
      pointerX: e.clientX,
      pointerY: e.clientY,
      tagXPct: tag.xPct,
      tagYPct: tag.yPct
    });

    setIsDragging(true);

    if (markerRef.current) {
      markerRef.current.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e) => {
    if (!isDragging || !dragStart) return;
    e.stopPropagation();
    e.preventDefault();

    const deltaX = e.clientX - dragStart.pointerX;
    const deltaY = e.clientY - dragStart.pointerY;
    const deltaPctX = (deltaX / width) * 100;
    const deltaPctY = (deltaY / height) * 100;

    let newXPct = dragStart.tagXPct + deltaPctX;
    let newYPct = dragStart.tagYPct + deltaPctY;

    newXPct = Math.max(0, Math.min(100, newXPct));
    newYPct = Math.max(0, Math.min(100, newYPct));

    onMove(newXPct, newYPct);
  };

  const handlePointerUp = (e) => {
    if (!isDragging) return;
    e.stopPropagation();
    e.preventDefault();

    setIsDragging(false);
    setDragStart(null);

    if (markerRef.current && markerRef.current.hasPointerCapture(e.pointerId)) {
      markerRef.current.releasePointerCapture(e.pointerId);
    }
  };

  const handlePointerCancel = (e) => {
    handlePointerUp(e);
  };

  const handleInputChange = (e) => {
    let value = e.target.value;

    // Live normalization as user types
    // Only normalize if it looks like a handle (starts with @ or no spaces)
    if (value && (value.startsWith('@') || !value.includes(' '))) {
      value = normalizeHandle(value);
    }

    onTextChange(value);
  };

  const handleInputBlur = () => {
    onComplete();
  };

  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onComplete();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onComplete();
    }
  };

  const handleDeletePointerDown = (e) => {
    e.stopPropagation();
    e.preventDefault();
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    onDelete(tag.id);
  };

  return (
    <div
      ref={markerRef}
      className={`
        absolute pointer-events-auto touch-none select-none
        transition-opacity
        ${isDragging ? 'z-50 opacity-90' : 'z-10 opacity-100'}
        ${tag.isEditing ? 'cursor-default' : 'cursor-move'}
      `}
      style={{
        left: `${xPixels}px`,
        top: `${yPixels}px`,
        transform: 'translate(-50%, -50%)'
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
    >
      <div className="relative">
        {/* Instagram Square Logo with Gradient - FIXED: rounded-xl instead of rounded-full */}
        <div
          className={`
            w-10 h-10 rounded-xl flex items-center justify-center
            shadow-lg transition-all overflow-hidden relative
            ${tag.isEditing
              ? 'bg-primary animate-pulse ring-4 ring-white ring-opacity-50'
              : ''
            }
          `}
          style={{
            background: tag.isEditing 
              ? undefined 
              : 'radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285AEB 90%)'
          }}
        >
          {!tag.isEditing && (
            <div className="relative w-6 h-6 flex items-center justify-center">
              {/* Outer rounded square */}
              <div className="absolute inset-0 border-2 border-white rounded-lg"></div>
              
              {/* Inner circle (camera lens) */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-3 h-3 border-2 border-white rounded-full"></div>
              </div>
              
              {/* Small dot (camera flash) */}
              <div className="absolute top-0.5 right-0.5 w-1 h-1 bg-white rounded-full"></div>
            </div>
          )}
        </div>

        {/* Text Label */}
        {!tag.isEditing && tag.text && (
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 whitespace-nowrap pointer-events-none">
            <div className="px-3 py-1.5 rounded-lg bg-black bg-opacity-80 backdrop-blur-sm">
              <span className="text-white text-sm font-medium drop-shadow">
                {tag.text}
              </span>
            </div>
          </div>
        )}

        {/* Text Input */}
        {tag.isEditing && (
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 pointer-events-auto">
            <input
              ref={inputRef}
              type="text"
              value={tag.text}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              onKeyDown={handleInputKeyDown}
              placeholder="@username"
              className="
                px-3 py-2 rounded-lg text-white text-sm font-medium
                bg-gray-900 border-2 border-primary
                focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50
                placeholder-gray-500
                min-w-[140px] text-center
              "
              maxLength={30}
              autoComplete="off"
            />
          </div>
        )}

        {/* Delete Button */}
        {!tag.isEditing && (
          <button
            onPointerDown={handleDeletePointerDown}
            onClick={handleDeleteClick}
            className="
              absolute -top-1 -right-1
              w-6 h-6 rounded-full bg-red-500 text-white
              flex items-center justify-center text-xs font-bold
              hover:bg-red-600 active:bg-red-700
              transition-all shadow-md hover:shadow-lg
              pointer-events-auto cursor-pointer
              border-2 border-white
            "
            aria-label="Delete tag"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}

export default TagMarker;
