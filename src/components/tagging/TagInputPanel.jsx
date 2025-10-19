import React from 'react';

function TagInputPanel({ onAddTag }) {
  return (
    <div className="bg-gray-800 border-t border-gray-700 p-4 max-h-[40vh] overflow-y-auto">
      {/* Add Tag Button */}
      <div className="mb-4">
        <button
          onClick={onAddTag}
          className="
            w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-medium
            hover:bg-blue-700 active:bg-blue-800 transition-colors
            text-sm min-h-[48px] touch-manipulation
          "
        >
          + Add Instagram Tag
        </button>
      </div>
    </div>
  );
}

export default TagInputPanel;
