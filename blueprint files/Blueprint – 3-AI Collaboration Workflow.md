# 🤖 PMC Revamp — 3‑AI Collaboration Workflow (v2)

### 🎯 Objective

Establish a fully traceable, phase‑based build system between Claude (Architect), Gemini (Reviewer), ChatGPT (Final Arbiter), and Grok (Builder in Cursor). Each AI has a clear role, file naming convention, and output expectation.

---

## 🧠 Claude — The Architect

**Role:** Generate structured project code in text‑based build files. Claude never executes code.

### 🧩 Responsibilities

1. Read from the official project blueprint docs (Design Spec + Architecture + Data Flow).
2. Create each phase’s full code output in a text file.
3. Follow exact file definition format:
   ```
   ### FILE: /src/path/FileName.jsx
   // File: /src/path/FileName.jsx
   // Purpose: [summary]
   // Connects to: [linked files]
   [full file code here]
   ```
4. Include all necessary imports and routes.
5. Always list created files at the end of each doc.
6. Stop for user approval before next phase.

### 🧾 Output File Name

```
phase[NUMBER]_claude_build.txt
```

**Examples:**

- `phase1_claude_build.txt` → Root setup and router skeleton.
- `phase2_claude_build.txt` → Core Services & Debugger.
- `phase3_claude_build.txt` → Upload workflow, etc.

### ✅ Deliverable Summary

Claude’s file should contain:

- Code for all relevant components.
- File headers with paths & purposes.
- Folder list.
- Short summary of functionality added.

Claude **does not** save or execute files. It only defines them for Grok.

---

## ⚙️ Grok — The Builder (via Cursor)

**Role:** Convert Claude’s structured definitions into actual project files locally.

### 🧩 Responsibilities

1. Parse all `### FILE:` sections from `phaseX_claude_build.txt`.
2. Create files in exact specified paths.
3. Maintain import paths exactly.
4. Do not change syntax, formatting, or logic.
5. Report:
   - ✅ File creation success list.
   - 🧠 Detected route list.
   - 🚀 Confirmation that project compiles and runs.

### 🧾 Input File Name

```
phase[NUMBER]_claude_build.txt
```

### 🧾 Output File Name

```
phase[NUMBER]_grok_execution_log.txt
```

This file includes:

- Build confirmation
- Compilation success or errors
- Local dev server confirmation (if applicable)

---

## 🧪 Gemini — The Reviewer (Online Studio)

**Role:** Analyze Claude’s generated code for technical accuracy, syntax correctness, and architectural consistency.

### 🧩 Responsibilities

1. Receive `phaseX_claude_build.txt` from Claude.
2. Review and validate:
   - Code syntax and dependency correctness.
   - Dexie schemas and database usage.
   - Hook patterns and React best practices.
   - Performance and modularity.
3. Produce a summarized analysis.

### 🧾 Input File Name

```
phase[NUMBER]_claude_build.txt
```

### 🧾 Output File Name

```
phase[NUMBER]_gemini_review.txt
```

### 🧠 Review Structure

Gemini’s file must contain:

```
PHASE [NUMBER] — Gemini Code Review Summary

✅ Passed Checks:
- [List]

⚠️ Warnings:
- [List]

❌ Errors / Fix Recommendations:
- [Details]

🧩 Structural Notes:
- [Architecture, component logic, routing, etc.]
```

---

## 🧩 ChatGPT — The Final Arbiter / Architect Reviewer

**Role:** Compare Claude’s build output and Gemini’s review, approve or patch code, and generate the Grok‑ready final prompt.

### 🧩 Responsibilities

1. Receive both:
   - `phaseX_claude_build.txt`
   - `phaseX_gemini_review.txt`
2. Cross‑check all feedback.
3. Approve or modify code based on Gemini’s findings.
4. Produce final verified file for Grok.

### 🧾 Output File Name

```
phase[NUMBER]_final_grok_prompt.txt
```

### 🧩 Structure of Final Prompt

```
PHASE [NUMBER] — FINAL GROK BUILD PROMPT

✅ Overview of approved features
⚙️ File list to be created
🔧 Any fixes applied

### FILE: /src/path/Filename.jsx
[Approved Code]
...
```

---

## 🔁 Full Workflow Sequence

| Step | AI      | Input           | Output                          | Description                          |
| ---- | ------- | --------------- | ------------------------------- | ------------------------------------ |
| 1    | Claude  | Blueprint docs  | `phaseX_claude_build.txt`       | Generates structured code definition |
| 2    | Gemini  | Claude’s output | `phaseX_gemini_review.txt`      | Reviews syntax, logic, structure     |
| 3    | ChatGPT | Both docs       | `phaseX_final_grok_prompt.txt`  | Produces verified prompt for Grok    |
| 4    | Grok    | Final prompt    | `phaseX_grok_execution_log.txt` | Creates and runs files locally       |

---

## 🧠 File Naming Summary

| Agent       | Reads                   | Writes                          |
| ----------- | ----------------------- | ------------------------------- |
| **Claude**  | Blueprint docs          | `phaseX_claude_build.txt`       |
| **Gemini**  | Claude output           | `phaseX_gemini_review.txt`      |
| **ChatGPT** | Claude + Gemini outputs | `phaseX_final_grok_prompt.txt`  |
| **Grok**    | ChatGPT final prompt    | `phaseX_grok_execution_log.txt` |

---

## ✅ Verification Flow

1. Each phase starts with Claude.
2. Gemini reviews.
3. ChatGPT approves.
4. Grok builds.
5. Debug system confirms logs.
6. Phase is locked before next begins.

---

### 🚀 Benefits

- No ambiguity in file ownership or naming.
- Full traceability of every change.
- Continuous debugging visibility.
- Offline compatibility with Gemini Studio.
- Modular, rollback‑safe build system.

---

**This is the official multi‑agent workflow for the PMC Revamp project.**

