import React, { useState, useRef } from 'react';

function DropzoneArea({ onFileSelect }) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      onFileSelect(files[0]);
    }
  };

  const handleFileInput = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFileSelect(files[0]);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div
      className={`
        relative border-4 border-dashed rounded-lg p-8 sm:p-12
        text-center cursor-pointer transition-all duration-200
        touch-manipulation min-h-[280px] sm:min-h-[320px]
        flex flex-col items-center justify-center
        ${isDragging
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-300 bg-white hover:border-blue-500 hover:bg-blue-50'
        }
      `}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png"
        onChange={handleFileInput}
        className="hidden"
      />

      {/* Icon */}
      <div className="text-6xl sm:text-7xl mb-4 select-none">
        📸
      </div>

      {/* Text */}
      <h3 className="text-lg sm:text-xl font-semibold text-gray-700 mb-2">
        {isDragging ? 'Drop photo here' : 'Tap to select photo'}
      </h3>
      <p className="text-sm sm:text-base text-gray-500 mb-4">
        or drag and drop
      </p>

      {/* Button */}
      <button
        type="button"
        className="
          px-6 py-3 bg-blue-600 text-white rounded-lg font-medium
          hover:bg-blue-700 active:bg-blue-800 transition-colors
          text-sm sm:text-base min-h-[44px] min-w-[44px]
          shadow-sm
        "
        onClick={(e) => {
          e.stopPropagation();
          handleClick();
        }}
      >
        Choose File
      </button>

      {/* Format info */}
      <p className="mt-4 text-xs text-gray-400">
        JPG, PNG · Max 10MB
      </p>
    </div>
  );
}

export default DropzoneArea;
