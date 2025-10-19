import React from 'react';

function UploadActions({ onUpload, onCancel, isProcessing, disabled }) {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <button
        onClick={onUpload}
        disabled={disabled || isProcessing}
        className="
          flex-1 px-6 py-4 bg-blue-600 text-white rounded-lg font-medium
          hover:bg-blue-700 active:bg-blue-800 disabled:bg-gray-300
          disabled:cursor-not-allowed transition-colors
          text-base min-h-[52px] touch-manipulation
          shadow-sm
        "
      >
        {isProcessing ? 'Processing...' : 'Continue to Tagging'}
      </button>

      <button
        onClick={onCancel}
        disabled={isProcessing}
        className="
          flex-1 sm:flex-initial px-6 py-4 bg-white border-2 border-gray-300
          text-gray-700 rounded-lg font-medium
          hover:bg-gray-50 active:bg-gray-100 disabled:opacity-50
          disabled:cursor-not-allowed transition-colors
          text-base min-h-[52px] touch-manipulation
        "
      >
        Cancel
      </button>
    </div>
  );
}

export default UploadActions;
