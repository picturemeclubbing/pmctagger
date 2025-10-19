/**
 * File: /src/components/DisclaimerText.jsx
 * Purpose: Reusable photo release disclaimer text component
 * Connects To: CustomerInfoPage, settings (future)
 */

import React from 'react';

/**
 * DisclaimerText Component
 * Displays the photo release and usage terms
 *
 * @param {Object} props
 * @param {boolean} props.compact - Use compact layout (default: false)
 */
export default function DisclaimerText({ compact = false }) {
  if (compact) {
    return (
      <div className="text-xs text-gray-400 leading-relaxed space-y-1">
        <p>
          By providing your information, you consent to receive your photo via SMS/email
          and allow PictureMeClubbing to use event photos for promotional purposes.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900/50 rounded-lg p-4 space-y-3 text-sm text-gray-300 leading-relaxed">
      <p>
        <strong className="text-white">Photo Release & Usage Terms:</strong>
      </p>

      <ul className="list-disc list-inside space-y-2 text-gray-400">
        <li>
          By providing your contact information, you consent to receive your tagged photo
          via SMS and/or email.
        </li>
        <li>
          You grant PictureMeClubbing and the event organizer permission to use photos
          taken at this event for promotional purposes, including but not limited to
          social media, websites, and marketing materials.
        </li>
        <li>
          Your contact information will be stored securely and will not be shared with
          third parties without your consent, except as required by law.
        </li>
        <li>
          You may request removal of your photo from promotional materials by contacting
          us at any time.
        </li>
        <li>
          Standard messaging rates may apply for SMS delivery. You can opt out of SMS
          notifications at any time.
        </li>
      </ul>

      <p className="text-xs text-gray-500 pt-2 border-t border-gray-700">
        By checking the box below, you acknowledge that you have read and agree to these terms.
      </p>
    </div>
  );
}

/**
 * Mini disclaimer variant for use in footers or small spaces
 */
export function DisclaimerMini() {
  return (
    <p className="text-xs text-gray-500">
      By continuing, you agree to our{' '}
      <a href="#" className="text-blue-400 hover:text-blue-300 underline">
        Photo Release Terms
      </a>
      .
    </p>
  );
}
