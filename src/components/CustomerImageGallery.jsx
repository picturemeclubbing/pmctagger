/**
 * File: /src/components/CustomerImageGallery.jsx
 * Purpose: Displays customer images in responsive grid with profile image management (Phase 8.1)
 * Connects To: CustomerImageStore.js, CustomerProfilePage.jsx
 */

import React, { useState, useEffect } from 'react';
import { listCustomerImages, setAsProfileImage } from '../services/CustomerImageStore';

export default function CustomerImageGallery({ customerId }) {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Load customer images
   */
  const loadImages = async () => {
    try {
      setLoading(true);
      setError(null);
      const imgs = await listCustomerImages(customerId);
      setImages(imgs);
    } catch (err) {
      console.error('[CustomerImageGallery] Load failed:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle setting image as profile image
   * @param {number} imageId - Image to set as profile
   */
  const handleSetAsProfile = async (imageId) => {
    try {
      const success = await setAsProfileImage(customerId, imageId);
      if (success) {
        // Reload images to reflect the change
        await loadImages();
        alert('Profile image updated successfully!');
      }
    } catch (err) {
      console.error('[CustomerImageGallery] Set profile failed:', err);
      alert('Failed to set profile image. Please try again.');
    }
  };

  useEffect(() => {
    if (customerId) {
      loadImages();
    }
  }, [customerId]);

  if (loading) {
    return (
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex justify-center">
          <div className="text-gray-500">Loading images...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="text-red-700">Error loading images: {error}</div>
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <div className="text-gray-500 text-center">
          No images yet. Images will appear here when delivered or uploaded.
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-3">
        Images ({images.length})
      </h3>

      {/* Image Grid Container */}
      <div className="max-h-64 overflow-auto rounded-lg bg-gray-50 p-2 shadow-inner">
        <div className="image-grid grid grid-cols-3 gap-3">
          {images.map(image => (
            <div
              key={image.id}
              className="relative group rounded-lg overflow-hidden bg-white shadow-sm border border-gray-200"
            >
              {/* Image */}
              <img
                src={image.url}
                alt={`Customer image ${image.id}`}
                className="w-full h-32 object-cover cursor-pointer"
                onClick={() => window.open(image.url, '_blank')}
              />

              {/* "Set as Profile" Button - Hover Overlay */}
              <button
                onClick={() => handleSetAsProfile(image.id)}
                className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-opacity-70"
                title="Set as profile image"
              >
                Set as Profile
              </button>

              {/* Profile Image Indicator */}
              {image.url === 'profile-indicator-placeholder' && (
                <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                  Profile
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-3 text-sm text-gray-600">
        <p>
          Click image to view full size • Hover and click "Set as Profile" to change profile picture
        </p>
      </div>
    </div>
  );
}
