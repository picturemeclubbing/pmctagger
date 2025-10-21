# PMC Revamp - Photo Tagging & Delivery System

A modern photo management system for event photographers to upload, tag, share, and deliver photos efficiently.

## 🚀 Phase 1: Foundation & Core Infrastructure

This phase establishes the foundational architecture:

- ✅ React 18 + Vite setup
- ✅ React Router v6 with all page routes
- ✅ Dexie.js database schema
- ✅ Debug system with real-time console
- ✅ Tailwind CSS styling
- ✅ Navigation and layout components

## 📦 Installation

```bash
npm install
```

## 🏃 Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 🏗️ Build

```bash
npm run build
```

## 🧪 Debug Console

Press `Ctrl+Shift+D` or click the Debug button in the navigation to toggle the debug console.

## 📁 Project Structure

```
/src
  /pages          - Page components (Upload, Tagging, Share, Gallery, etc.)
  /components     - Reusable UI components (Navigation, DebugConsole, etc.)
  /services       - Business logic (database.js, debugger.js)
  /hooks          - Custom React hooks (Phase 2+)
  /assets         - Static assets (Phase 2+)
  App.jsx         - Main app component with router
  main.jsx        - React entry point
  index.css       - Global styles and Tailwind
```

## 🔄 Next Phases

## ✅ Phase 7.0: Automated Delivery & Customer Notifications

This phase completes the automated delivery system with real-time monitoring:

- ✅ **Delivery Automation:** Recursive setTimeout loop with atomic processing locks
- ✅ **TokenBucket Rate Limiting:** Configurable delivery rate limits (default: 10/min)
- ✅ **Provider Services:** SendGrid (Email) and Twilio (SMS/MMS) integrations
- ✅ **Security:** Strict HTTPS URL validation and provider-side API restrictions
- ✅ **Monitoring:** Live delivery monitor with real-time stats and logging
- ✅ **Maintenance:** Automated log cleanup and settings management
- ✅ **Configuration:** Comprehensive settings panel with credential testing

### 🔧 Configuration Required

#### SendGrid (Email)
- API Key: Create at [SendGrid Dashboard](https://app.sendgrid.com/)
- Domain Authentication: Required for production security
- IP Restrictions: Configure allowlists for additional security

#### Twilio (SMS/MMS)
- Account SID & Auth Token: Available in [Twilio Console](https://console.twilio.com/)
- Phone Number: Purchase SMS-enabled number
- Geo-Permissions: Configure account-level messaging restrictions

### 🚀 Access Points
- **Delivery Monitor:** `/deliveries-auto` - Real-time queue monitoring and controls
- **Settings:** `/settings` - Configure automation, providers, and credentials

## 🔄 Future Phases

- **Phase 8:** Advanced analytics and reporting
- **Phase 9:** Mobile app companion
- **Phase 10:** Multi-event management

## 📖 Documentation

See `Design & Page Flow Specification (v1)` for complete app blueprint.

## 🐛 Debug Events

All operations are tracked via the debug system. Event types include:

- Upload: `UPLOAD_START`, `UPLOAD_SUCCESS`, `IMAGE_COMPRESSED`
- Tagging: `TAG_ADDED`, `TAG_MOVED`, `TAG_SAVED`
- Sharing: `SHARE_TAGGED`, `SHARE_UNTAGGED`, `WATERMARK_APPLIED`
- Gallery: `GALLERY_LOAD`, `SESSION_VIEWED`, `SESSION_DELETED`
- CRM: `CUSTOMER_UPDATED`, `CUSTOMER_DELIVERED`
- Delivery: `DELIVERY_QUEUED`, `DELIVERY_SUCCESS`, `DELIVERY_FAIL`

## 📄 License

Private project - All rights reserved
