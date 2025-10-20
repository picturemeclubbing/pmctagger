
# PHASE 5 — Claude Architect Prompt: Rebuild SocialTagger Flow

## 🧠 ROLE
You are **Claude**, the Architect AI for the PMC Revamp project.

Your task is to design a clean, fully functional "Instagram-style tagging" system for the app, based on the desired workflow described below.  
You will output structured file definitions (headers + logic outline) in standard format, ready for Gemini to review and Grok to implement.

---

## 🎯 OBJECTIVE
Rebuild the tagging system so that it behaves like a native Instagram tag editor:
- Clicking **Add Tag** drops a tag marker (dot) onto the image.
- The user immediately types a name — the text appears in real time above or below the marker.
- The tag stays fixed to the clicked position.
- Tags can be moved (dragged) or deleted.
- No editing flow — deleting and re-adding replaces tags.
- Resize/scale logic stays in code but is disabled.
- Supports both "local" and "physical" modes (via TagModeSelector).

---

## 🧩 USER FLOW OVERVIEW

1. **Initial State**
   - Image loads centered and scaled responsively.
   - No tags visible initially.
   - TagModeSelector shown above controls (default: “local”).

2. **Add Tag**
   - User clicks **Add Tag** button.
   - The cursor changes to indicate placement mode (e.g., “Tap image to place tag”).
   - Next click on the image drops a **tag marker** (dot) at that position.
   - An input box automatically appears near the marker.
   - As the user types, the text appears **live** on top of the image, attached to that marker.

3. **Display Tag**
   - Once the user presses Enter or clicks outside:
     - The input box disappears.
     - The tag text remains visible.
   - The tag now behaves as a draggable element within the image boundaries.

4. **Delete Tag**
   - Each tag shows a small “✕” icon.
   - Clicking it removes the tag immediately.

5. **Burning Tags (Physical Mode)**
   - When user chooses “Burn Into Image” and clicks “Send to Customer”:
     - A canvas overlay burns each tag and Instagram-style logo into the exported image.
     - Claude should outline the logic for this canvas burn (using `drawImage`, positioning, proportional scaling).
   - If “Local Mode” is selected, tags are stored in metadata and rendered on top of the image without modifying the file.

6. **Visual Layout**
   - The tag marker (dot) should appear as a small, colored circle.
   - The tag text appears slightly offset (above or below).
   - Both adjust their position responsively when the image scales.

7. **Data Model**
   ```js
   Tag = {
     id: string,       // unique ID (UUID)
     text: string,     // entered label
     x: number,        // percent position relative to image width
     y: number,        // percent position relative to image height
   }
   ```

8. **Component Responsibilities**
   - `SocialTagger.jsx` → Core component that renders the image and handles tags (add, delete, drag).
   - `TagMarker.jsx` → Small child component that renders one tag’s dot, text label, delete button, and input (if active).
   - `TagModeSelector.jsx` → Controls whether tags are burned or overlaid.
   - `TagCanvasService.js` → Utility service to “burn” tags permanently into a canvas version of the image.

---

## 📂 EXPECTED FILES TO DEFINE

```
/src/components/tagging/SocialTagger.jsx
/src/components/tagging/TagMarker.jsx
/src/components/tagging/TagModeSelector.jsx
/src/services/TagCanvasService.js
```

---

## 🧱 LOGIC & FUNCTIONAL DETAILS

### **SocialTagger.jsx**
- Props:
  - `imageSrc`, `mode`, `onTagsComplete`
- Hooks:
  - `useState` for tags
  - `useRef` for image element
- Functions:
  - `enterPlacementMode()` → enables next click to place a tag
  - `handleImageClick()` → stores percentage position of click, creates new tag, focuses its input
  - `handleAddTag()` → triggers placement mode
  - `handleTagTextChange()` → live updates tag text
  - `handleDeleteTag()` → removes tag
  - `handleDrag()` → updates tag position
  - `handleSendToCustomer()` → calls TagCanvasService if mode is “physical”
- Render:
  - Image with absolute-positioned tags overlaid
  - Controls panel at bottom:
    - “Add Tag” button
    - “Send to Customer” button
    - TagModeSelector (local/physical)

### **TagMarker.jsx**
- Handles rendering one tag:
  - A dot + label + delete button
  - Input field active only when tag is newly added or active
- Handles drag movement with mouse/touch events
- Disables resizing (keep handlers commented)

### **TagCanvasService.js**
- Exports:
  - `burnTagsToImage(image, tags)` → returns dataURL with tags drawn directly on the image
- Logic:
  - Uses `<canvas>` to draw base image + tag markers + text
  - Maintains proportional scaling regardless of image resolution

---

## 🧾 OUTPUT FORMAT
For each file:
```js
### FILE: /src/components/tagging/SocialTagger.jsx
// Purpose: Core Instagram-style tagger component
// Connects To: TagMarker, TagModeSelector, TagCanvasService
[structured outline + pseudocode]
```

End with:
```
✅ Tagging Flow Architecture Complete
Ready for Gemini Review → Grok Implementation
```
