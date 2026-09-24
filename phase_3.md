# Phase 3: Background Service Worker & Storage Caching

## Objectives
Build the background service worker (`background.js`) to handle persistent result caching, message relaying, background page pre-fetching, and optional API integration.

---

## Task Checklist

- [x] **1. Develop Service Worker (`background.js`)**
  - Implement MV3 service worker event listeners (`onInstalled`, `onMessage`).
  - Set up default storage state (`enabled: true`, `sensitivity: 'medium'`, `cacheLimit: 5000`).

- [x] **2. Persistent Cache Manager**
  - Store URL-to-Score mappings in `chrome.storage.local`.
  - Content script checks cache before calculating: if cached, badge renders instantly (0ms latency).
  - Least-Recently-Used (LRU) cache eviction strategy to keep storage clean and lightweight.

- [x] **3. Background Page Hydration (Optional Fast Pre-fetch)**
  - For short snippets, optionally pre-fetch lightweight page HTML head/paragraphs in background.
  - Re-evaluate score asynchronously and update cached badge status smoothly.

- [x] **4. Optional API Relay Bridge**
  - Provide background hook to relay requests to an optional Gemini / AI Detection API endpoint if configured in user settings.

---

## Verification Criteria
- [x] Repeat searches read scores directly from `chrome.storage.local` with 0ms calculation overhead.
- [x] Service worker wakes up on demand without memory leaks or crash warnings in Chrome DevTools.
