/**
 * EmailService.js - SendGrid email service for photo tag deliveries
 * Compatible with: Phase 7.0 - Automated Delivery & Customer Notifications
 */

import { getSetting } from './database.js';

// SendGrid API endpoint
const SENDGRID_BASE_URL = 'https://api.sendgrid.com/v3/mail/send';

/**
 * Validate image URL for security and protocol requirements
 * @param {string} url - URL to validate
 * @returns {Object} { isValid: boolean, error?: string }
 */
export function validateImageUrl(url) {
  if (!url || typeof url !== 'string') {
    return { isValid: false, error: 'INVALID_URL', message: 'URL must be a non-empty string' };
  }

  try {
    const parsedUrl = new URL(url);

    // Must be HTTPS
    if (parsedUrl.protocol !== 'https:') {
      return { isValid: false, error: 'INVALID_URL', message: 'URL must use HTTPS protocol' };
    }

    // Reject dangerous schemes
    const dangerousSchemes = ['javascript:', 'data:', 'vbscript:', 'file:', 'ftp:'];
    if (dangerousSchemes.includes(parsedUrl.protocol)) {
      return { isValid: false, error: 'INVALID_URL', message: 'URL scheme not allowed' };
    }

    // Reject URLs with inline script-like content
    const href = parsedUrl.href.toLowerCase();
    if (href.includes('javascript:') || href.includes('<script') ||
        href.includes('onload=') || href.includes('onerror=')) {
      return { isValid: false, error: 'INVALID_URL', message: 'URL contains dangerous content' };
    }

    return { isValid: true };

  } catch (error) {
    return { isValid: false, error: 'INVALID_URL', message: 'Invalid URL format' };
  }
}

/**
 * Generate HTML email template for photo tag delivery
 * @param {string} imageUrl - Validated image URL
 * @param {Object} sessionData - Session information
 * @returns {string} HTML email content
 */
function generateEmailTemplate(imageUrl, sessionData) {
  const sessionName = sessionData?.imageName || 'Your Tagged Photos';
  const sessionId = sessionData?.sessionId || 'N/A';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Tagged Photos</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Robson, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background-color: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #E1306C;
            margin-bottom: 10px;
        }
        .image-container {
            text-align: center;
            margin: 30px 0;
        }
        .tagged-image {
            max-width: 100%;
            height: auto;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            font-size: 14px;
            color: #666;
            text-align: center;
        }
        .session-info {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">📸 PMC Social Tagger</div>
            <h1>Your Tagged Photos Are Ready!</h1>
        </div>

        <div class="session-info">
            <strong>Session:</strong> ${sessionName}<br>
            <strong>Session ID:</strong> ${sessionId}
        </div>

        <div class="image-container">
            <img src="${imageUrl}" alt="Your tagged photos" class="tagged-image">
        </div>

        <p>Thank you for using our photo tagging service! We hope you love your customized photos.</p>

        <p>If you have any questions or need assistance, feel free to reach out to our support team.</p>

        <div class="footer">
            <p>© 2025 PMC Social Tagger. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`;
}

/**
 * Send email using SendGrid API
 * @param {string} toEmail - Recipient email address
 * @param {string} imageUrl - Image URL to include in email
 * @param {Object} sessionData - Session information
 * @returns {Promise<Object>} Normalized response object
 */
export async function sendEmail(toEmail, imageUrl, sessionData) {
  const startTime = Date.now();

  try {
    // Validate image URL first
    const validation = validateImageUrl(imageUrl);
    if (!validation.isValid) {
      throw validation;
    }

    // Get SendGrid settings
    const apiKey = await getSetting('sendgridApiKey');
    const fromEmail = await getSetting('sendgridFromEmail') || 'noreply@pmctagger.com';
    const fromName = await getSetting('sendgridFromName') || 'PMC Social Tagger';

    if (!apiKey) {
      throw { error: 'CONFIG_ERROR', message: 'SendGrid API key not configured' };
    }

    // Generate email content
    const htmlContent = generateEmailTemplate(imageUrl, sessionData);
    const subject = `Your Tagged Photos - ${sessionData?.imageName || 'Session Complete'}`;

    // SendGrid API payload
    const payload = {
      personalizations: [{
        to: [{ email: toEmail }]
      }],
      from: {
        email: fromEmail,
        name: fromName
      },
      subject: subject,
      content: [{
        type: 'text/html',
        value: htmlContent
      }]
    };

    // Make API request
    const response = await fetch(SENDGRID_BASE_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const responseData = await response.json();
    const processingTime = Date.now() - startTime;

    if (response.ok) {
      return {
        success: true,
        status: response.status,
        messageId: responseData?.headers?.['x-message-id'] || `sent-${Date.now()}`,
        provider: 'sendgrid',
        rawResponse: responseData,
        processingTime
      };
    } else {
      return {
        success: false,
        status: response.status,
        errorCode: responseData?.errors?.[0]?.field || 'SENDGRID_ERROR',
        errorMessage: responseData?.errors?.[0]?.message || responseData?.error || 'SendGrid API error',
        provider: 'sendgrid',
        rawResponse: responseData,
        processingTime
      };
    }

  } catch (error) {
    const processingTime = Date.now() - startTime;

    // Handle validation errors
    if (error.error === 'INVALID_URL') {
      return {
        success: false,
        errorCode: 'INVALID_URL',
        errorMessage: error.message,
        provider: 'sendgrid',
        processingTime
      };
    }

    // Handle configuration errors
    if (error.error === 'CONFIG_ERROR') {
      return {
        success: false,
        errorCode: 'CONFIG_ERROR',
        errorMessage: error.message,
        provider: 'sendgrid',
        processingTime
      };
    }

    // Handle network/other errors
    return {
      success: false,
      errorCode: 'NETWORK_ERROR',
      errorMessage: error.message || 'Network or unknown error occurred',
      provider: 'sendgrid',
      processingTime
    };
  }
}

/**
 * Validate SendGrid API key and configuration
 * @param {string} apiKey - SendGrid API key to validate
 * @returns {Promise<Object>} Validation result
 */
export async function validateSendGridKey(apiKey) {
  try {
    const response = await fetch('https://api.sendgrid.com/v3/user/profile', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    if (response.ok) {
      return { valid: true, message: 'SendGrid API key is valid' };
    } else if (response.status === 401) {
      return { valid: false, message: 'Invalid API key' };
    } else {
      return { valid: false, message: `API error: ${response.status} ${response.statusText}` };
    }
  } catch (error) {
    return { valid: false, message: `Connection error: ${error.message}` };
  }
}

export default {
  sendEmail,
  validateImageUrl,
  validateSendGridKey
};
