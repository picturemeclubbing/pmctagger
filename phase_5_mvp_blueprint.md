## 📘 PMC Revamp — Minimal Viable Feature Set (MVP Blueprint)

### 🎯 Objective
Create a **stable, production-ready MVP** that covers the full offline workflow for photo sessions without adding unnecessary complexity.  
Focus only on features required for day‑to‑day use and internal testing.

---

### 🧩 Core MVP Workflow
**Upload → Tag → Save → Reopen → Share**

---

### ✅ Existing (Already Complete)
| Area | Purpose | Source Phase |
|-------|----------|---------------|
| **UploadPage** | Start new sessions, compress image, create Dexie record | 5.1 |
| **TaggingPage / SocialTagger** | Add Instagram‑style tags with CRM auto‑link | 5.2b |
| **CustomerStore + Dexie v3** | Manage and look up customers for auto‑linking | 5.2b |
| **Debug Console (/debug)** | View logs, pause, export, filter | 5.2a |
| **HomePage Dashboard (/)** | Quick actions, stats, recent sessions, version footer | 5.2b |
| **AppVersion / version.js** | Visible version + build info | 5.2b |

---

### 🚀 MVP Additions (Next Phases)

#### **Phase 5.3 — Gallery Page (/gallery)**
**Goal:** Reopen and manage previously uploaded sessions.

**Deliverables:**
- `GalleryPage.jsx` — Grid of all sessions (from `SessionStore.listSessions()`)
- `SessionCard.jsx` — Each card shows thumbnail, status badge (Tagged/Raw), and quick actions: Open / Delete / Share
- `FilterBar.jsx` — Simple filter (All | Tagged | Untagged)

**Dependencies:** `SessionStore`, `DebugContext`

**Debug Domain:** `[GALLERY]`

**UI Notes:**
- Same styling system as HomePage (white cards, subtle shadows)
- Integrate small `CustomerBadgeInline` if linked to CRM
- Keep layout responsive (2–6 columns)

---

#### **Phase 5.4 — Session Detail Page (/session/:id)**
**Goal:** Provide focused view of a single session after selection from Gallery.

**Deliverables:**
- `SessionDetailPage.jsx` — Preview image + actions:
  - **Tag Again** → `/tag/:sessionId`
  - **Share** → `/share/:sessionId`
  - **Delete Session** (confirm dialog)

**Dependencies:** `SessionStore`, `DebugContext`

**Debug Domain:** `[SESSION]`

**UI Notes:**
- Layout: large image preview, metadata sidebar, action buttons
- Maintain dark mode visual consistency
- Keep Dexie update on delete to refresh Gallery

---

### ⚙️ Optional (Do Not Implement Yet)
| Feature | Reason |
|----------|---------|
| **CRMPage (/crm)** | Redundant for MVP (auto-link already works) |
| **Delivery Queue (/queue)** | Depends on hosting & messaging services |
| **SettingsPage (/settings)** | Needed later for branding or watermarks |

---

### 🧱 Resulting MVP Capabilities
| Capability | Description |
|-------------|-------------|
| **Session Creation** | Upload new photos, auto‑save in Dexie |
| **Tag Management** | Add, edit, and auto‑link tags to customers |
| **Session Persistence** | View, reopen, or delete sessions in Gallery |
| **Debugging & Diagnostics** | Full internal console via `/debug` |
| **Version Visibility** | Version + build date in footer |

---

### 🧩 Phase Roadmap Summary
| Phase | Deliverables | Priority |
|--------|--------------|-----------|
| **5.3** | GalleryPage.jsx + FilterBar.jsx + SessionCard.jsx | 🔥 Critical |
| **5.4** | SessionDetailPage.jsx | 🔥 Critical |
| **5.5+** | CRMPage, Queue, Settings | 💤 Deferred |

---

### ✅ MVP Exit Criteria
The app is considered **MVP‑ready** when:
- User can upload a photo, tag people, save, reopen via Gallery, and share.
- Database retains all sessions between reloads.
- No missing routes or dead buttons.
- Debug Console shows logs for Upload, Tagging, Gallery, and Session domains.

---

**Next Action:**
Proceed with **Phase 5.3a Blueprint Assessment** (Gallery Layout + Data Flow) before coding.

