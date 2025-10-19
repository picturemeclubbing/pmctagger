# PHASE 4 — Grok Implementation Prompt (PMC Revamp)
**Source of truth:** Use **`PHASE 4 — Gemini Code Review Summary_Corrections.md`** as the canonical plan. Implement exactly as specified there.

---

## 🧠 ROLE
You are **Grok**, the Builder AI for Phase 4 of the PMC Revamp project (Gallery & CRM Integration). Your task is to generate the **final, working code** for all files defined in the Gemini-corrected build. Preserve import paths and naming. Keep Tailwind styling consistent with Phase 3.

---

## 🎯 OBJECTIVES
1) **Database (Dexie v3)**
   - Apply the v3 migration in `/src/services/database.js` with new fields: `photoSessions.customerId`, `deliveryJobs.customerId`, `customers.tags`, `customers.lastContactAt`.
   - Ensure migration keeps existing data intact and initializes new properties safely.

2) **Stores & Services**
   - `/src/services/SessionStore.js` — add: `listSessionsByCustomer`, `linkSessionToCustomer`, `listSessionsByDateRange`, `getSessionWithCustomer` (dynamic import to avoid circular deps). Update default export bundle.
   - `/src/services/CustomerStore.js` — add: `getCustomerWithSessions`, `searchCustomers`, override `updateCustomer` to regenerate `tags`. Update default export bundle.
   - `/src/services/CRMService.js` — implement `getCustomerAnalytics`, `getCRMStats`, `mergeCustomers` as defined.

3) **Hooks**
   - `/src/hooks/useSearchFilter.js` — debounced, memoized search with optional `filterFn`. Export both named and default (default = `useSearchFilter`).

4) **Pages**
   - `/src/pages/GalleryPage.jsx` — implement grid/list view, stats, search & filters; subscribe to EventBus (`session:created`, `session:deleted`, `session:linked`, `tags:updated`). Use `useSearchFilter`.
   - `/src/pages/CRMPage.jsx` — implement list/detail/edit split view; URL-driven state via `useSearchParams`; live refresh on EventBus.

5) **Components — Gallery**
   - `/src/components/gallery/FilterBar.jsx` — status pills (All/Raw/Tagged/Shared), search input, grid/list toggle, counts.
   - `/src/components/gallery/GridView.jsx` — responsive grid/list that renders `SessionCard`.
   - `/src/components/gallery/SessionCard.jsx` — thumbnail, badges, customer name, relative time, edit/delete actions.

6) **Components — CRM**
   - `/src/components/crm/CustomerList.jsx`
   - `/src/components/crm/CustomerDetail.jsx`
   - `/src/components/crm/CustomerEditor.jsx`

7) **Common Component (NEW) — Replace `window.confirm`**
   - Create `/src/components/common/ConfirmModal.jsx` and integrate it into `SessionCard.jsx` (Phase 4 review required this change).
   - **Props:** `isOpen`, `message`, `confirmLabel?="Delete"`, `cancelLabel?="Cancel"`, `onConfirm`, `onCancel`.
   - **UI:** Centered modal, backdrop with blur, keyboard focus trap, ESC closes, tab loop, enter confirms.
   - **Behavior in SessionCard:** Open modal on Delete click; only call `deleteSession` after confirm.

---

## 🗂️ FILES TO CREATE OR MODIFY
Create/modify these files per **Gemini corrections** (do not invent new paths):

```
/src/services/database.js
/src/services/SessionStore.js
/src/services/CustomerStore.js
/src/services/CRMService.js
/src/hooks/useSearchFilter.js

/src/pages/GalleryPage.jsx
/src/components/gallery/FilterBar.jsx
/src/components/gallery/GridView.jsx
/src/components/gallery/SessionCard.jsx

/src/pages/CRMPage.jsx
/src/components/crm/CustomerList.jsx
/src/components/crm/CustomerDetail.jsx
/src/components/crm/CustomerEditor.jsx

/src/components/common/ConfirmModal.jsx     # NEW (replaces window.confirm flow)
```

> If any import mismatches are encountered, prefer **the names/exports shown in Gemini’s corrected summary**.

---

## 🔧 IMPLEMENTATION NOTES
- **Debug Domains:** Use `useDebug('GALLERY')` and `useDebug('CRM')` consistently. Log key actions (data load, delete, link, update).
- **EventBus:** Ensure pages subscribe and unsubscribe cleanly; use returned `unsub` functions.
- **Thumbnails:** In `SessionCard`, prefer `taggedThumbBlob` if `currentVersion === 'tagged'`, else `rawThumbBlob`; resolve via `blobToDataURL`.
- **Search/Filters:** In Gallery, searchable fields include `imageName`, `tagsMeta.text`. Add a filter for status + “Has Customer” boolean.
- **CRM:** `searchCustomers(query)` uses indexed `tags` for prefix matches. URL params control selected item and view (detail/edit).
- **Accessibility:** Minimum 44px tap targets; keyboard and screen-reader friendly modal; discernible focus outlines.
- **No Blocking Calls:** Avoid `window.confirm`. Use `ConfirmModal` for consistency with app theme.

---

## ✅ ACCEPTANCE CRITERIA
- Dexie v3 migration runs and data is preserved; new fields exist.
- Gallery: grid/list toggle works; search and filters update results; counts reflect truth.
- CRM: list/detail/edit flows work; edits update `tags` and refresh views.
- Session–Customer linking visible across Gallery and CRM.
- No usage of `window.confirm` remains; modal works with keyboard and ESC.
- EventBus live-updates both pages on session/customer changes.
- Build compiles cleanly; no runtime errors in console.

---

## 🧪 VALIDATION COMMANDS
After implementing, run and verify:
```
npm run dev
# Navigate to /gallery and /crm
# Perform: search, status filters, delete (with modal), edit customer, link session
```
Confirm debug logs appear:
```
[GALLERY] gallery_loaded
[GALLERY] session_deleted_from_card
[CRM] customers_loaded
[CRM] customer_updated
```

---

## 📤 OUTPUT REPORT FORMAT
Return this final summary at completion:

```
🎉 PHASE 4 IMPLEMENTATION COMPLETE!

Files Created/Modified:
- /src/services/database.js
- /src/services/SessionStore.js
- /src/services/CustomerStore.js
- /src/services/CRMService.js
- /src/hooks/useSearchFilter.js
- /src/pages/GalleryPage.jsx
- /src/components/gallery/FilterBar.jsx
- /src/components/gallery/GridView.jsx
- /src/components/gallery/SessionCard.jsx
- /src/pages/CRMPage.jsx
- /src/components/crm/CustomerList.jsx
- /src/components/crm/CustomerDetail.jsx
- /src/components/crm/CustomerEditor.jsx
- /src/components/common/ConfirmModal.jsx  (NEW)

Verification:
- Dexie v3 migration ✅
- Gallery filters/search & view mode ✅
- CRM list/detail/edit ✅
- Session–Customer linking & analytics ✅
- EventBus refresh ✅
- No window.confirm; modal UX ✅
- Build & runtime: clean ✅
```

---

## 📎 REFERENCES
- `PHASE 4 — Gemini Code Review Summary_Corrections.md` (canonical build)
- `PHASE 4 — Gemini Code Review Summary.md` (context)
- `phase4_claude_build.md` (original architecture)