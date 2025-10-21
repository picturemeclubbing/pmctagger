/**
 * TwilioService.js - Twilio SMS/MMS service for photo tag deliveries
 * Compatible with: Phase 7.0 - Automated Delivery & Customer Notifications
 */

import { getSetting } from './database.js';

// Twilio API base URL
const TWILIO_BASE_URL = 'https://api.twilio.com/2010-04-01';

/**
 * Send SMS/MMS using Twilio REST API
 * @param {string} phoneNumber - Recipient phone number (E.164 format)
 * @param {string} imageUrl - Image URL for MMS (optional, if not provided sends SMS only)
 * @param {string} messageText - SMS message text
 * @returns {Promise<Object>} Normalized response object
 */
export async function sendSMS(phoneNumber, imageUrl = null, messageText = '') {
  const startTime = Date.now();

  try {
    // Get Twilio settings
    const accountSid = await getSetting('twilioAccountSid');
    const authToken = await getSetting('twilioAuthToken');
    const fromNumber = await getSetting('twilioPhoneNumber');

    if (!accountSid || !authToken || !fromNumber) {
      throw { error: 'CONFIG_ERROR', message: 'Twilio credentials not configured' };
    }

    // Clean phone number (remove non-numeric characters)
    const cleanPhoneNumber = phoneNumber.replace(/\D/g, '');

    // Prepare API payload
    const payload = new URLSearchParams();
    payload.append('To', `+${cleanPhoneNumber}`);
    payload.append('From', fromNumber);

    // Add media URL if provided (MMS) or body if not
    if (imageUrl) {
      payload.append('MediaUrl', imageUrl);
      payload.append('Body', messageText || 'Your tagged photo is attached!');
    } else {
      payload.append('Body', messageText || 'Your photo tagging is complete!');
    }

    // Create Basic Auth header
    const authString = btoa(`${accountSid}:${authToken}`);

    // Make API request
    const response = await fetch(`${TWILIO_BASE_URL}/Accounts/${accountSid}/Messages.json`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authString}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: payload.toString()
    });

    const responseData = await response.json();
    const processingTime = Date.now() - startTime;

    if (response.ok) {
      return {
        success: true,
        status: response.status,
        messageId: responseData.sid,
        provider: 'twilio',
        rawResponse: responseData,
        processingTime
      };
    } else {
      // Extract error details from Twilio response
      let errorCode = responseData.code?.toString() || 'TWILIO_ERROR';
      let errorMessage = responseData.message || responseData.error_message || 'Twilio API error';

      // Map common Twilio error codes
      if (responseData.code) {
        switch (responseData.code) {
          case 21211: errorCode = 'INVALID_PHONE'; errorMessage = 'Invalid phone number'; break;
          case 21408: errorCode = 'PERMISSION_DENIED'; errorMessage = 'Phone permission not enabled'; break;
          case 21612: errorCode = 'UNAUTHORIZED'; errorMessage = 'Account not authorized for messaging'; break;
          case 30002: errorCode = 'INVALID_ACC_SID'; errorMessage = 'Invalid Account SID'; break;
          case 20003: errorCode = 'UNAUTHORIZED'; errorMessage = 'Authentication failed'; break;
        }
      }

      return {
        success: false,
        status: response.status,
        errorCode,
        errorMessage,
        provider: 'twilio',
        rawResponse: responseData,
        processingTime
      };
    }

  } catch (error) {
    const processingTime = Date.now() - startTime;

    // Handle configuration errors
    if (error.error === 'CONFIG_ERROR') {
      return {
        success: false,
        errorCode: 'CONFIG_ERROR',
        errorMessage: error.message,
        provider: 'twilio',
        processingTime
      };
    }

    // Handle network/other errors
    return {
      success: false,
      errorCode: 'NETWORK_ERROR',
      errorMessage: error.message || 'Network or unknown error occurred',
      provider: 'twilio',
      processingTime
    };
  }
}

/**
 * Validate Twilio credentials and configuration
 * @param {string} accountSid - Twilio Account SID
 * @param {string} authToken - Twilio Auth Token
 * @returns {Promise<Object>} Validation result
 */
export async function validateTwilioCredentials(accountSid, authToken) {
  try {
    const authString = btoa(`${accountSid}:${authToken}`);

    const response = await fetch(`${TWILIO_BASE_URL}/Accounts/${accountSid}.json`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${authString}`
      }
    });

    if (response.ok) {
      const accountData = await response.json();
      return {
        valid: true,
        message: 'Twilio credentials are valid',
        account: {
          sid: accountData.sid,
          status: accountData.status,
          type: accountData.type
        }
      };
    } else {
      let message = 'Invalid credentials';
      if (response.status === 401) {
        message = 'Authentication failed - check Account SID and Auth Token';
      } else if (response.status === 404) {
        message = 'Account not found';
      }
      return { valid: false, message };
    }
  } catch (error) {
    return { valid: false, message: `Connection error: ${error.message}` };
  }
}

/**
 * Get Twilio account information (stub for potential future use)
 * @returns {Promise<Object>} Account info stub
 */
export async function getTwilioAccountInfo() {
  // This is a stub that could be expanded in the future
  // For now, just return a basic supported status
  const accountSid = await getSetting('twilioAccountSid');

  if (accountSid) {
    return {
      supported: true,
      accountSid: accountSid.substr(-4).padStart(accountSid.length, '*'),
      message: 'Twilio integration configured'
    };
  }

  return {
    supported: false,
    message: 'Twilio not configured'
  };
}

export default {
  sendSMS,
  validateTwilioCredentials,
  getTwilioAccountInfo
};
