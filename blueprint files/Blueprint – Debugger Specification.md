# Page-by-Page Design Specification (PMC / SnapFlow Revamp)

This document defines the design, layout, and core functionality for each page in the application. Each section includes: purpose, UI layout, key actions, debug domains, and background operations.

---

## 1. HomePage

**Route:** `/`

### Purpose

Quick access to uploads, recent sessions, and system status.

### Layout

- **Top Section:** Quick Upload button (`Go to UploadPage`)
- **Middle Section:** Recent sessions grid (thumbnails)
- **Bottom Section:** System health summary (active jobs, queue status)

### Actions

- `handleGoToUpload()` → navigates to `/upload`
- `handleOpenSession(sessionId)` → navigates to `/session/:sessionId`

### Debug Domain

`[HOME]` Logs load time, recent sessions query duration, and navigation events.

---

## 2. UploadPage

**Route:** `/upload`

### Purpose

Upload or drop images and create new session records.

### Layout

- **Upload Drop Zone:** File picker and drag-drop area
- **Preview:** Shows compressed version after upload
- **Progress Bar:** Visual feedback during compression
- **Buttons:** Cancel / Continue to Tagging

### Key Functions

- `handleFileSelect(file)` → validates file → compresses image → generates thumbnail
- `createSessionId()` → unique timestamp or UUID
- `saveRawVersion()` → creates session record in IndexedDB
- `navigateToTagging(sessionId)`

### Background

- Calls `ImageService.compressImage()` and `ImageService.makeThumbnail()`
- Writes record via `SessionStore.saveRawVersion()`

### Debug Domain

`[UPLOAD]` — logs file validation, compression, thumbnail generation, and session creation.

---

## 3. TaggingPage

**Route:** `/tag/:sessionId`

### Purpose

Add, move, resize, and preview social tags overlayed on images.

### Layout

- **Main Canvas:** Image + tag overlays (Instagram logo + username)
- **Tag List Panel:** Shows all tags added
- **Add Tag Button:** Opens tag creation mode
- **Customer Bar:** Name, phone, email input
- **Next Button:** Navigates to SharePage

### Key Functions

- `addTag(username)` → places tag center-screen by default
- `dragTag(tagId, x, y)` → updates tag position
- `resizeTag(tagId, scale)` → resizes tag
- `saveTagsMeta(sessionId, tagsMeta)` → persists tag metadata only (no burn)
- `handleContinue()` → navigates to `/share/:sessionId`

### Background

- Uses `SessionStore.updateTagsMeta()` for storage.
- Reads raw image blob from IndexedDB.

### Debug Domain

`[TAGGING]` — logs tag creation, drag events, metadata saves.

---

## 4. SharePage

**Route:** `/share/:sessionId`

### Purpose

Preview and export both clean and tagged versions of an image.

### Layout

- **Image Preview:** Toggle between raw/tagged
- **Buttons:**
  - Export Tagged
  - Export Clean
  - Copy Caption
  - Send to Customer

### Key Functions

- `handleExportTagged()` → burns tags using `ImageService.burnTagsToImage()`
- `handleExportClean()` → uses unmodified raw version
- `handleCopyCaption()` → calls `CaptionService.generateCaption()`
- `handleSendToCustomer()` → opens SendDeliveryModal

### Background

- Pulls session data via `SessionStore.getSession()`
- Uses `WatermarkService.applyGradientWatermark()` optionally

### Debug Domain

`[SHARE]` — logs burn time, watermark status, file output, and errors.

---

## 5. GalleryPage

**Route:** `/gallery`

### Purpose

Browse, filter, and manage photo sessions.

### Layout

- **Filter Bar:** Search box, tag status filter (Tagged/Raw)
- **Grid View:** Thumbnails with version badges
- **Bulk Actions:** Delete, Send, Share

### Key Functions

- `loadSessions()` → fetches all from `SessionStore`
- `toggleVersionView(sessionId)` → swaps raw/tagged thumbnail
- `deleteSession(sessionId)` → removes session

### Background

- Reads sessions via IndexedDB
- Updates gallery on data changes

### Debug Domain

`[GALLERY]` — logs load times, deletions, filter changes.

---

## 6. SessionDetailPage

**Route:** `/session/:sessionId`

### Purpose

Provide full-screen preview with all possible actions.

### Layout

- **Main Image:** raw/tagged preview toggle
- **Buttons:** Tag, Share, Send, Delete

### Key Functions

- `handleEditTags()` → `/tag/:sessionId`
- `handleShare()` → `/share/:sessionId`
- `handleSend()` → opens SendDeliveryModal

### Debug Domain

`[SESSION]` — logs state toggles, deletions, and navigation events.

---

## 7. CRMPage

**Route:** `/crm`

### Purpose

Manage and link customer records to photo sessions.

### Layout

- **Customer Table:** name, phone, email, linked sessions
- **Edit Drawer:** inline edit modal
- **Add Customer Button:** opens customer form

### Key Functions

- `addCustomer()` / `updateCustomer()` / `deleteCustomer()`
- `linkSessionToCustomer(sessionId, customerId)`

### Background

- CRUD via `CustomerStore`
- Sync with session on link

### Debug Domain

`[CRM]` — logs CRUD actions, links, sync success/fail.

---

## 8. SendDeliveryModal

**Modal, accessible from SharePage and GalleryPage**

### Purpose

Queue selected version for email/SMS delivery.

### Layout

- **Recipient Fields:** Email, phone
- **Version Selector:** Raw / Tagged radio buttons
- **Delivery Options:** Email, SMS, Both
- **Queue Button:** Adds delivery job

### Key Functions

- `queueDelivery(sessionId, version, method, recipients)`
- `uploadImageToHost(blob)`
- `DeliveryQueue.add(job)`

### Background

- Uses `HostingService.upload()` for public link
- Background worker handles actual send

### Debug Domain

`[DELIVERY]` — logs queued jobs, worker events, response codes.

---

## 9. SettingsPage

**Route:** `/settings`

### Purpose

Configure branding, watermarks, and integrations.

### Layout

- **Tabs:** Branding | Tag Defaults | Watermark | Caption | Integrations
- **Logo Upload:** Stores PNG/SVG to IndexedDB
- **Preview Box:** Live sample of watermark and tag styles
- **Save Button:** Persists settings

### Key Functions

- `saveAppSettings()` → `SettingsStore.save()`
- `uploadLogo(blob)` → `AssetStore.saveBrandLogo()`
- `resetDefaults()` → restores factory defaults

### Debug Domain

`[SETTINGS]` — logs saves, resets, and validation events.

---

## 10. DebugPanel

**Route:** Dev-only overlay

### Purpose

Display all logs live and provide export/filter options.

### Layout

- **Log Feed:** scrollable with colored severity levels
- **Filters:** domain tabs
- **Session Tracker:** current ID + workflow state
- **Buttons:** Export Logs, Clear Logs, Live Refresh toggle

### Debug Domain

`[DEBUG]` — monitors internal debugger and background operations.

---

## Global Page Debug Integration

All pages import `useDebug(pageName)` to log domain-specific events.

```js
const debug = useDebug("UploadPage");
debug.log("File selected", { fileName });
debug.success("Session created", { sessionId });
```

---

## Data Flow Map Summary

1. **UploadPage** → creates session → `/tag/:id`
2. **TaggingPage** → edits metadata → `/share/:id`
3. **SharePage** → exports or queues delivery → `/gallery`
4. **GalleryPage** → manages sessions → `/session/:id` or `/crm`
5. **CRMPage** → links customers → `/send`

---

**End of Page-by-Page Design Specification**

