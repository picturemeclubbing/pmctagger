/**
 * SettingsPage.jsx - Application settings and configuration
 * Compatible with: Phase 7.0 - Automated Delivery & Customer Notifications
 */

import React, { useState, useEffect } from 'react';
import { getAllSettings, saveSettings, getSetting } from '../services/database.js';
import { validateSendGridKey } from '../services/EmailService.js';
import { validateTwilioCredentials } from '../services/TwilioService.js';

export default function SettingsPage() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState({});
  const [feedback, setFeedback] = useState({});

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const allSettings = await getAllSettings();
      setSettings(allSettings);
    } catch (error) {
      console.error('Failed to load settings:', error);
      setFeedback({ type: 'error', message: 'Failed to load settings' });
    } finally {
      setLoading(false);
    }
  };

  // Handle input changes
  const handleChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  // Handle toggle changes
  const handleToggle = async (key) => {
    const newValue = !settings[key];
    try {
      await saveSettings({ [key]: newValue });
      handleChange(key, newValue);
      setFeedback({
        type: 'success',
        message: `${key.replace(/([A-Z])/g, ' $1').toLowerCase()} ${newValue ? 'enabled' : 'disabled'}`
      });
      setTimeout(() => setFeedback({}), 3000);
    } catch (error) {
      setFeedback({ type: 'error', message: 'Failed to save setting' });
    }
  };

  // Save all settings
  const handleSave = async () => {
    setSaving(true);
    try {
      await saveSettings(settings);
      setFeedback({ type: 'success', message: 'All settings saved successfully' });
      setTimeout(() => setFeedback({}), 3000);
    } catch (error) {
      setFeedback({ type: 'error', message: 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  // Test SendGrid credentials
  const handleTestSendGrid = async () => {
    const apiKey = settings.sendgridApiKey;
    if (!apiKey) {
      setFeedback({ type: 'error', message: 'SendGrid API key is required' });
      return;
    }

    setTesting(prev => ({ ...prev, sendgrid: true }));
    try {
      const result = await validateSendGridKey(apiKey);
      if (result.valid) {
        setFeedback({ type: 'success', message: 'SendGrid credentials are valid' });
      } else {
        setFeedback({ type: 'error', message: `SendGrid: ${result.message}` });
      }
    } catch (error) {
      setFeedback({ type: 'error', message: 'SendGrid test failed' });
    } finally {
      setTesting(prev => ({ ...prev, sendgrid: false }));
    }
  };

  // Test Twilio credentials
  const handleTestTwilio = async () => {
    const accountSid = settings.twilioAccountSid;
    const authToken = settings.twilioAuthToken;
    if (!accountSid || !authToken) {
      setFeedback({ type: 'error', message: 'Twilio Account SID and Auth Token are required' });
      return;
    }

    setTesting(prev => ({ ...prev, twilio: true }));
    try {
      const result = await validateTwilioCredentials(accountSid, authToken);
      if (result.valid) {
        setFeedback({ type: 'success', message: 'Twilio credentials are valid' });
      } else {
        setFeedback({ type: 'error', message: `Twilio: ${result.message}` });
      }
    } catch (error) {
      setFeedback({ type: 'error', message: 'Twilio test failed' });
    } finally {
      setTesting(prev => ({ ...prev, twilio: false }));
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading settings...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">⚙️ Settings</h1>

        {/* Feedback messages */}
        {feedback.message && (
          <div className={`mb-6 p-4 rounded ${
            feedback.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            {feedback.message}
          </div>
        )}

        {/* Delivery Automation Panel */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">🚀 Delivery Automation</h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Basic Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700">General</h3>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">Enable Automation</label>
                  <p className="text-xs text-gray-500">Start/stop automated delivery processing</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.enableAutomation || false}
                    onChange={() => handleToggle('enableAutomation')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">Auto-Start on App Load</label>
                  <p className="text-xs text-gray-500">Automatically start automation when app loads</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.autoStartOnLoad || false}
                    onChange={() => handleToggle('autoStartOnLoad')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rate Limit (per minute)
                </label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={settings.rateLimitPerMinute || 10}
                  onChange={(e) => handleChange('rateLimitPerMinute', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Maximum deliveries processed per minute</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Retry Attempts
                </label>
                <input
                  type="number"
                  min="1"
                  max="3"
                  value={settings.retryAttempts || 3}
                  onChange={(e) => handleChange('retryAttempts', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Number of retry attempts before marking as failed</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Log Retention (days)
                </label>
                <input
                  type="number"
                  min="7"
                  max="365"
                  value={settings.logRetentionDays || 90}
                  onChange={(e) => handleChange('logRetentionDays', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">How long to keep delivery logs before cleanup</p>
              </div>
            </div>

            {/* Provider Credentials */}
            <div className="space-y-6">
              {/* SendGrid */}
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-md font-semibold text-gray-700">SendGrid (Email)</h4>
                  <button
                    onClick={handleTestSendGrid}
                    disabled={testing.sendgrid}
                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                  >
                    {testing.sendgrid ? 'Testing...' : 'Test'}
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                    <input
                      type="password"
                      value={settings.sendgridApiKey || ''}
                      onChange={(e) => handleChange('sendgridApiKey', e.target.value)}
                      placeholder="SG.XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">From Email</label>
                    <input
                      type="email"
                      value={settings.sendgridFromEmail || ''}
                      onChange={(e) => handleChange('sendgridFromEmail', e.target.value)}
                      placeholder="noreply@pmctagger.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">From Name</label>
                    <input
                      type="text"
                      value={settings.sendgridFromName || ''}
                      onChange={(e) => handleChange('sendgridFromName', e.target.value)}
                      placeholder="PMC Social Tagger"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Twilio */}
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-md font-semibold text-gray-700">Twilio (SMS/MMS)</h4>
                  <button
                    onClick={handleTestTwilio}
                    disabled={testing.twilio}
                    className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 disabled:opacity-50"
                  >
                    {testing.twilio ? 'Testing...' : 'Test'}
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Account SID</label>
                    <input
                      type="password"
                      value={settings.twilioAccountSid || ''}
                      onChange={(e) => handleChange('twilioAccountSid', e.target.value)}
                      placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Auth Token</label>
                    <input
                      type="password"
                      value={settings.twilioAuthToken || ''}
                      onChange={(e) => handleChange('twilioAuthToken', e.target.value)}
                      placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={settings.twilioPhoneNumber || ''}
                      onChange={(e) => handleChange('twilioPhoneNumber', e.target.value)}
                      placeholder="+1234567890"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Security Notice</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  API keys are stored client-side and exposed to users. For production, you must enforce provider-side restrictions:
                </p>
                <ul className="mt-2 list-disc list-inside space-y-1">
                  <li><strong>SendGrid:</strong> Domain/HTTP referrer restrictions and IP allowlists</li>
                  <li><strong>Twilio:</strong> Phone number geo-permissions and IP restrictions</li>
                  <li>Use environment variables (VITE_*) for additional security</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save All Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
