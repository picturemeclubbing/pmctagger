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

- **Phase 2:** Upload workflow + Gallery implementation
- **Phase 3:** Tagging interface with canvas
- **Phase 4:** Share functionality + Watermarking
- **Phase 5:** CRM + Delivery system
- **Phase 6:** Settings + Advanced features

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
