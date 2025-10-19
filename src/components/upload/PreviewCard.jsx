import React from 'react';
import { formatFileSize } from '../../utils/helpers';

function PreviewCard({ previewUrl, fileName, fileSize, progress, isProcessing }) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Image Preview */}
      <div className="relative w-full aspect-video bg-gray-100">
        <img
          src={previewUrl}
          alt="Preview"
          className="w-full h-full object-contain"
        />

        {/* Processing Overlay */}
        {isProcessing && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="text-white text-center px-4">
              <div className="text-3xl mb-2">⚙️</div>
              <p className="text-sm font-medium">Processing...</p>
            </div>
          </div>
        )}
      </div>

      {/* File Info */}
      <div className="p-4 space-y-3">
        <div>
          <p className="font-medium text-gray-800 truncate text-sm sm:text-base">
            {fileName}
          </p>
          <p className="text-xs sm:text-sm text-gray-500">
            {formatFileSize(fileSize)}
          </p>
        </div>

        {/* Progress Bar */}
        {progress > 0 && (
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-gray-600">
                {isProcessing ? 'Processing' : 'Ready'}
              </span>
              <span className="text-xs font-medium text-blue-600">
                {progress}%
              </span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-300 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PreviewCard;
