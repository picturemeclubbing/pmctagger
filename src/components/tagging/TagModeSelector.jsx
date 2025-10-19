// File: /src/components/tagging/TagModeSelector.jsx
// Purpose: Toggle between local overlay and physical burn modes
// Connects to: SocialTagger.jsx

import React from 'react';

function TagModeSelector({ mode, onModeChange }) {
  return (
    <div className="flex items-center justify-center gap-4 p-3 bg-gray-750 rounded-lg">
      <span className="text-sm text-gray-400 font-medium">Tag Mode:</span>

      <div className="flex bg-gray-800 rounded-lg p-1">
        <button
          onClick={() => onModeChange('local')}
          className={`
            px-4 py-2 rounded-md text-sm font-medium transition-all
            min-h-[40px] touch-manipulation
            ${mode === 'local'
              ? 'bg-primary text-white shadow-sm'
              : 'text-gray-400 hover:text-white'
            }
          `}
        >
          📋 Local Overlay
        </button>

        <button
          onClick={() => onModeChange('physical')}
          className={`
            px-4 py-2 rounded-md text-sm font-medium transition-all
            min-h-[40px] touch-manipulation
            ${mode === 'physical'
              ? 'bg-primary text-white shadow-sm'
              : 'text-gray-400 hover:text-white'
            }
          `}
        >
          🔥 Burn Into Image
        </button>
      </div>

      {/* Mode Description */}
      <div className="hidden sm:block">
        {mode === 'local' ? (
          <p className="text-xs text-gray-500">
            Tags stored in metadata (reversible)
          </p>
        ) : (
          <p className="text-xs text-gray-500">
            Tags permanently embedded in image
          </p>
        )}
      </div>
    </div>
  );
}

export default TagModeSelector;
