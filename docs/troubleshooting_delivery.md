# Troubleshooting Delivery Automation

This guide covers common issues with the automated delivery system (Phase 7.0) and how to resolve them.

## 🚨 Common Issues

### Email Deliveries Failing

**Symptoms:**
- Deliveries stuck in "failed" status
- Error code `INVALID_URL` in logs

**Causes & Solutions:**

1. **Invalid Image URLs**
   - **Error:** `INVALID_URL`
   - **Cause:** URLs must be HTTPS and safe
   - **Solution:** Ensure images are hosted on HTTPS URLs. Avoid data://, javascript://, or URLs with script content

2. **SendGrid Configuration**
   - **Error:** `CONFIG_ERROR` or `UNAUTHORIZED`
   - **Cause:** API key or from-email not configured
   - **Solution:** Check settings for SendGrid credentials. Use Test button in Settings to validate

3. **SendGrid API Limits**
   - **Error:** `SENDGRID_ERROR` with status 429
   - **Cause:** Rate limiting or quota exceeded
   - **Solution:** Wait and retry, or reduce delivery rate in settings

### SMS/MMS Deliveries Failing

**Symptoms:**
- SMS showing as failed with error codes
- MMS not sending media attachments

**Causes & Solutions:**

1. **Twilio Credentials**
   - **Error:** `AUTHENTICATION_FAILED` or `UNAUTHORIZED`
   - **Cause:** Account SID/Auth Token incorrect
   - **Solution:** Verify credentials in settings, phone number permissions

2. **Phone Number Format**
   - **Error:** `INVALID_PHONE`
   - **Cause:** Phone number not in E.164 format
   - **Solution:** Include country code, e.g., +15551234567

3. **Account Restrictions**
   - **Error:** `PERMISSION_DENIED` or `UNAUTHORIZED`
   - **Cause:** Account/geo restrictions on messaging
   - **Solution:** Upgrade Twilio account or contact support

### Automation Not Starting

**Symptoms:**
- Monitor shows "paused" status
- No deliveries processing automatically

**Causes & Solutions:**

1. **Auto-Start Disabled**
   - Monitor shows paused after app reload
   - **Solution:** Enable "Auto-Start on App Load" in settings or manually start from monitor

2. **Automation Disabled**
   - Status shows "paused" even when started
   - **Solution:** Check "Enable Automation" toggle in settings

### Rate Limiting Issues

**Symptoms:**
- Deliveries slowing down or stopping
- Processing status showing but not completing

**Causes & Solutions:**

1. **Rate Limit Exceeded**
   - TokenBucket exhausted faster than refill
   - **Solution:** Reduce deliveries per minute in settings, or increase capacity

2. **Concurrent Processing**
   - Multiple tabs/windows attempting deliveries
   - **Solution:** Use only one instance of the app

### Database Issues

**Symptoms:**
- Stats showing incorrect numbers
- Unable to update delivery status

**Causes & Solutions:**

1. **Version Mismatch**
   - Console errors about tables not existing
   - **Solution:** Clear browser data or use incognito mode (database will auto-migrate)

2. **Locked Records**
   - Atomic transactions timing out
   - **Solution:** Close other tabs, retry operation

## 🔍 Monitoring & Debugging

### Logs Location
- **Delivery Logs:** View via Monitor > Recent Activity Logs
- **Console Logs:** Open browser dev tools > Console tab
- **Debug Page:** Navigate to `/debug` for additional tools

### Log Analysis
Each delivery log entry contains:
- **Delivery ID:** Links delivery to specific attempt
- **Error Codes:** Specific failure reasons
- **Response Data:** Raw API responses for debugging
- **Processing Time:** Performance metrics

### Status Meanings
- **pending:** Waiting for processing
- **processing:** Currently being sent
- **sent:** Successfully delivered
- **failed:** Unrecoverable error

## ⚙️ Configuration Issues

### Environment Variables (Production)
For production deployments, use environment variables:
```
VITE_SENDGRID_API_KEY=SG.xxxxxxxxxx
VITE_SENDGRID_FROM_EMAIL=noreply@yourdomain.com
VITE_SENDGRID_FROM_NAME=Your App Name
VITE_TWILIO_ACCOUNT_SID=ACxxxxxxxxxx
VITE_TWILIO_AUTH_TOKEN=xxxxxxxxxx
VITE_TWILIO_PHONE_NUMBER=+15551234567
```

### Security Best Practices
- **SendGrid:** Enable domain authentication and IP restrictions
- **Twilio:** Use account-level geo-permissions
- **API Keys:** Never log credentials in console or share publicly

## 🆘 Getting Help

1. **Check Logs:** Start with delivery logs in the monitor
2. **Console Errors:** Look for JavaScript errors
3. **Settings Validation:** Use Test buttons to verify credentials
4. **Database Reset:** Clear IndexedDB data if issues persist

### Escalation Steps
1. Verify settings/configuration
2. Check credentials validity
3. Review rate limiting settings
4. Clear browser data and restart
5. Contact support with log details

## 🚀 Performance Tuning

- **Rate Limits:** Start low (5-10/min) and increase gradually
- **Log Retention:** Default 90 days; increase for debugging
- **Auto-Start:** Enable only if automation needed at startup
- **Bulk Operations:** Use simple delivery page for large volumes

Remember: The system automatically retries failed deliveries (1s, 3s, 9s delays) before marking as failed.
