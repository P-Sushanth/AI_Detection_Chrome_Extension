# Phase 4: Sleek Extension Popup UI & Live Playground

## 🎯 Objectives
Build a modern, glassmorphism extension popup interface (`popup.html`, `popup.css`, `popup.js`) with control switches, live text/URL playground, cache stats, and API settings.

---

## 📋 Task Checklist

- [ ] **1. Extension Popup UI Design (`popup.html`, `popup.css`)**
  - Dark mode aesthetic, vibrant accents, smooth micro-interactions.
  - Header: Extension logo, title, and primary Master ON/OFF toggle switch.
  - Tab Navigation:
    - **Tab 1: Settings**: Sensitivity slider (Strict / Balanced / Permissive), Badge style toggles, Cache status counter with "Clear Cache" button.
    - **Tab 2: Live Playground**: Textarea input where users can paste any paragraph or URL to test AI percentage live with score gauge & breakdown.
    - **Tab 3: API & Advanced**: Optional API key input field (Gemini / Custom endpoint) for server-assisted deep analysis.

- [ ] **2. Interactive Logic (`popup.js`)**
  - Sync state bi-directionally with `chrome.storage.local`.
  - Connect live playground directly to `detector.js` engine for instant (< 10ms) feedback as user types or pastes.

---

## 🧪 Verification Criteria
- [ ] Extension popup opens cleanly when clicking toolbar icon.
- [ ] Master switch immediately toggles search engine badges ON/OFF.
- [ ] Playground tab scores pasted text accurately with animated visual gauge.
