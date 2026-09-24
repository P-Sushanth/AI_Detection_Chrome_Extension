# Phase 2: Search Engine Content Script & Badge UI Injection

## 🎯 Objectives
Inject subtle, non-intrusive AI detection badges directly into search results pages (Google Search, Bing Search, DuckDuckGo) with interactive detail tooltips.

---

## 📋 Task Checklist

- [x] **1. Develop DOM Parser in `content.js`**
  - **Google Search**: Target result containers (`#rso .g`, `div.MjjYud`, `div.g`), extract link URL, title header `h3`, snippet text (`div.VwiC3b`).
  - **Bing Search**: Target `#b_results .b_algo`, extract link header `h2`, snippet text `.b_caption p`.
  - **DuckDuckGo**: Target `.react-results--main article`, title link, snippet text.
  - Implement `MutationObserver` to handle dynamic search results loading, pagination, and AJAX query updates.

- [x] **2. Implement Subtle Badge Component (`content.js` & `content.css`)**
  - Design compact inline pill badge (e.g. `🤖 14% AI`).
  - Color palette:
    - **0 - 30% AI**: Soft Emerald (`#10b981` bg / `#047857` text) - Low AI likelihood.
    - **31 - 65% AI**: Warm Amber (`#f59e0b` bg / `#b45309` text) - Moderate AI likelihood.
    - **66 - 100% AI**: Subtle Violet/Rose (`#8b5cf6` bg / `#6d28d9` text) - High AI likelihood.
  - Ensure zero layout shifting of search result titles.

- [x] **3. Rich Interactive Breakdown Tooltip**
  - On hover/click of the badge, display a sleek floating popover card:
    - Overall score & confidence bar.
    - Top detected AI phrases/signals.
    - Burstiness & structural score breakdown.
    - Max z-index overlay positioning (`2147483647`).

- [x] **4. Extension State Sync**
  - Respect global enabled/disabled setting from `chrome.storage.local`.
  - Hide badges seamlessly when extension is toggled OFF.

---

## 🧪 Verification Criteria
- [x] Badges render next to every result title on Google Search without cluttering the layout.
- [x] Hovering over badge displays clean tooltip popover with breakdown details.
- [x] No Javascript errors on standard search result pages.
