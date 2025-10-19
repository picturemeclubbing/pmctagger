/**
 * File: /src/components/ConfirmModal.jsx
 * Purpose: Reusable confirmation modal for dangerous actions
 */
import React from 'react';

const ConfirmModal = ({
  isOpen,
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmStyle = "danger", // "danger" or "primary"
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg shadow-xl max-w-md w-full border border-gray-700">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
          <p className="text-gray-400 text-sm leading-relaxed mb-6">{message}</p>

          <div className="flex space-x-3 justify-end">
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
            >
              {cancelText}
            </button>

            <button
              onClick={onConfirm}
              className={`px-4 py-2 font-medium rounded-lg transition-colors text-white ${
                confirmStyle === "danger"
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
