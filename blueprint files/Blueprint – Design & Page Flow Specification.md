## 🧠 Claude\_Phase1\_Architect.txt

**Role:** Architect AI

**Goal:** Define all root project files, folder structure, and base routing logic for the PMC Revamp project. Do not execute or build anything — only output structured definitions Grok will use to create the files.

### 🧩 Rules

- Never run code or simulate builds.
- Use exact format:
  ```
  ### FILE: /src/path/Filename.jsx
  [complete file code]
  ```
- Each file must begin with header comments:
  ```js
  // File: /path/to/file
  // Purpose: [one-line summary]
  // Connects to: [list of related components/pages]
  ```
- Use React + Vite + Tailwind + React Router.
- Include all routes listed in the spec doc.
- Provide minimal placeholder JSX for each route.
- Create `/src/debug/useDebug.js` and `/src/debug/DebugContext.jsx` for the logging system.
- Create `/src/utils/database.js` and `/src/utils/helpers.js` placeholders.
- At the end, list: ✅ folders, ✅ files, ✅ debug confirmation, ✅ routes.

### 🔧 Deliverables

Claude outputs:

1. Complete project skeleton definitions.
2. Each file clearly labeled with its path.
3. No execution, no bundling, no code blocks — just raw text sections for Grok.

### ⚙️ Required Files

```
/src/main.jsx
/src/App.jsx
/src/debug/useDebug.js
/src/debug/DebugContext.jsx
/src/services/EventBus.js
/src/utils/database.js
/src/utils/helpers.js
```

After defining all files, stop and request user approval before proceeding to Phase 2.

---

## ⚙️ Grok\_Builder\_Workflow\.txt

**Role:** Builder AI (via Cursor)

**Goal:** Create all files output by Claude exactly as written.

### 🧩 Rules

- Detect all `### FILE:` sections automatically.
- Save each file to the correct path.
- Do not alter or beautify Claude’s output.
- Ensure all directories exist.
- Maintain import paths exactly as written.
- Run local build to verify the project boots.
- Report any missing or invalid imports.
- Once compiled, display:
  - ✅ Confirmed file creation list
  - 🧠 Console log showing `Debug system initialized`
  - 🚀 Confirmation that `/upload` and `/tag/:id` routes render.

If successful, freeze Phase 1 and notify Gemini for verification.

---

## 🧪 Gemini\_Reviewer\_Plan.txt

**Role:** Reviewer + Tester AI

**Goal:** Validate Claude’s Phase 1 output built by Grok.

### 🧩 Test Protocol

1. Run build locally via `npm run dev`.
2. Validate:
   - App compiles successfully.
   - All routes load correctly.
   - Debug system logs `system initialized`.
   - Console shows `[DEBUG]` output from App.jsx.
3. Confirm folder tree:
   ```
   /src/
    ├─ /pages/
    ├─ /components/
    ├─ /services/
    ├─ /utils/
    ├─ /debug/
    └─ main.jsx
   ```
4. Check every route returns placeholder text (e.g., “Gallery Page Loaded”).
5. Report findings in summary format:
   - ✅ Passed / ❌ Failed
   - Logs from console
   - Suggested fixes (if any)

### 🧠 Approval Flow

Once Gemini approves:

- You, the user, sign off to begin Phase 2 (Core Services & Debugger).
- Claude continues using the approved structure to extend functionality.

---

**Summary:** These three prompt documents orchestrate collaboration between Claude (architect), Grok (builder), and Gemini (reviewer). Each step ensures full traceability, debug visibility, and approval checkpoints before moving to the next phase.

