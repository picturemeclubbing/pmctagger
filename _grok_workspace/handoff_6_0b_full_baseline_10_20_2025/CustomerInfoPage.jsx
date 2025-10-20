/**
 * File: /src/pages/CustomerInfoPage.jsx
 * Purpose: Collect customer info + consent before delivery (Phase 6.0a)
 * Connects To: CustomerStore, DeliveryQueue, SessionStore, DisclaimerText
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import useDebug from '../debug/useDebug';
import { getSession } from '../services/SessionStore';
import { addOrUpdateCustomer } from '../services/CustomerStore';
import { addToQueue } from '../services/DeliveryQueue';
import DisclaimerText from '../components/DisclaimerText';

function CustomerInfoPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const debug = useDebug('DELIVERY');

  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);

  // Validation errors
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadSession();
  }, [sessionId]);

  const loadSession = async () => {
    debug.time('customer_form_load');
    setIsLoading(true);

    try {
      const sessionData = await getSession(sessionId);

      if (!sessionData) {
        debug.error('session_not_found', { sessionId });
        throw new Error('Session not found');
      }

      setSession(sessionData);

      // Pre-fill if customer data exists in tags
      const firstTag = sessionData.tagsMeta?.[0];
      if (firstTag?.customerName) {
        setName(firstTag.customerName);
      }

      debug.timeEnd('customer_form_load', { sessionId });
      debug.info('form_loaded', { sessionId, hasTags: sessionData.hasTags });
    } catch (error) {
      debug.error('load_failed', { sessionId, error: error.message });
      setTimeout(() => navigate('/gallery'), 2000);
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Name is required
    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }

    // Phone is required
    if (!phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\d{10,}$/.test(phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Please enter a valid phone number (at least 10 digits)';
    }

    // Email is optional but must be valid if provided
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Consent is required
    if (!consent) {
      newErrors.consent = 'You must agree to the disclaimer to continue';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    if (!validateForm()) {
      debug.warn('validation_failed', { errors: Object.keys(errors) });
      return;
    }

    debug.time('customer_submit');
    setIsSubmitting(true);

    try {
      // Add or update customer record
      const customer = await addOrUpdateCustomer({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || null
      });

      debug.info('customer_created', {
        customerId: customer.id,
        name: customer.name,
        hasEmail: !!customer.email
      });

      // Add to delivery queue
      await addToQueue(sessionId, customer.id);

      debug.timeEnd('customer_submit', { sessionId, customerId: customer.id });
      debug.info('delivery_created', {
        sessionId,
        customerId: customer.id,
        customerName: customer.name
      });

      // Show success and redirect
      setTimeout(() => {
        navigate('/gallery');
      }, 1000);

    } catch (error) {
      debug.error('submit_failed', {
        sessionId,
        error: error.message
      });
      setErrors({ submit: error.message });
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    debug.log('form_skipped', { sessionId });
    navigate('/gallery');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="text-6xl mb-4">⏳</div>
          <p className="text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold mb-2">Session Not Found</h2>
          <Link
            to="/gallery"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors inline-block mt-4"
          >
            Return to Gallery
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header with Navigation */}
      <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                to="/gallery"
                className="text-gray-300 hover:text-white transition-colors"
              >
                ← Back to Gallery
              </Link>
              <h1 className="text-xl font-bold text-white">
                📋 Confirm Your Info
              </h1>
            </div>

            <div className="flex items-center gap-4">
              <Link
                to="/"
                className="text-gray-300 hover:text-white transition-colors text-sm hidden sm:block"
              >
                Home
              </Link>
              <Link
                to="/debug"
                className="text-gray-300 hover:text-white transition-colors text-sm hidden sm:block"
              >
                Debug
              </Link>
              <button
                onClick={handleSkip}
                className="text-gray-400 hover:text-white transition-colors text-sm"
              >
                Skip for now
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 md:p-8">
            {/* Intro Text */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">
                Before We Send Your Photo
              </h2>
              <p className="text-gray-400">
                Please provide your contact information so we can deliver your tagged photo.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name Field */}
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Full Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className={`
                    w-full px-4 py-3 rounded-lg
                    bg-gray-700 border
                    ${errors.name ? 'border-red-500' : 'border-gray-600'}
                    text-white placeholder-gray-400
                    focus:outline-none focus:ring-2 focus:ring-blue-500
                    transition-colors
                  `}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-400">{errors.name}</p>
                )}
              </div>

              {/* Phone Field */}
              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Phone Number <span className="text-red-400">*</span>
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(555) 123-4567"
                  className={`
                    w-full px-4 py-3 rounded-lg
                    bg-gray-700 border
                    ${errors.phone ? 'border-red-500' : 'border-gray-600'}
                    text-white placeholder-gray-400
                    focus:outline-none focus:ring-2 focus:ring-blue-500
                    transition-colors
                  `}
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-400">{errors.phone}</p>
                )}
              </div>

              {/* Email Field (Optional) */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Email <span className="text-gray-500 text-xs">(Optional)</span>
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  className={`
                    w-full px-4 py-3 rounded-lg
                    bg-gray-700 border
                    ${errors.email ? 'border-red-500' : 'border-gray-600'}
                    text-white placeholder-gray-400
                    focus:outline-none focus:ring-2 focus:ring-blue-500
                    transition-colors
                  `}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-400">{errors.email}</p>
                )}
              </div>

              {/* Disclaimer Section */}
              <div className="pt-4 border-t border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-3">
                  Photo Release Agreement
                </h3>
                <DisclaimerText />
              </div>

              {/* Consent Checkbox */}
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="consent"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="
                    mt-1 w-5 h-5 rounded
                    border-gray-600 bg-gray-700
                    text-blue-600 focus:ring-2 focus:ring-blue-500
                    cursor-pointer
                  "
                />
                <label
                  htmlFor="consent"
                  className="text-sm text-gray-300 cursor-pointer select-none"
                >
                  I agree to the photo release terms above and consent to receive my photo.
                  <span className="text-red-400 ml-1">*</span>
                </label>
              </div>
              {errors.consent && (
                <p className="text-sm text-red-400 -mt-2">{errors.consent}</p>
              )}

              {/* Submit Error */}
              {errors.submit && (
                <div className="p-4 bg-red-900/30 border border-red-500 rounded-lg">
                  <p className="text-sm text-red-400">{errors.submit}</p>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleSkip}
                  className="
                    flex-1 px-6 py-4
                    bg-gray-700 hover:bg-gray-600
                    text-white font-semibold rounded-lg
                    transition-colors
                  "
                >
                  Skip for Now
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="
                    flex-1 px-6 py-4
                    bg-blue-600 hover:bg-blue-700
                    text-white font-semibold rounded-lg
                    transition-all duration-200
                    disabled:opacity-50 disabled:cursor-not-allowed
                    shadow-md hover:shadow-lg
                  "
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="animate-spin">⏳</span>
                      <span>Submitting...</span>
                    </span>
                  ) : (
                    'Confirm & Continue'
                  )}
                </button>
              </div>
            </form>

            {/* Helper Text */}
            <p className="mt-6 text-center text-xs text-gray-500">
              Session ID: {sessionId}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default CustomerInfoPage;
