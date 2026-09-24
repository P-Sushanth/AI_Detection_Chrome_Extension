# Phase 1: Core Detection Engine & Manifest Setup

## 🎯 Objectives
Build the core foundation of the Chrome Extension:
1. Define the Manifest V3 structure (`manifest.json`) with necessary permissions and rules.
2. Develop the standalone pure JS AI Detection Engine (`detector.js`).
3. Create crisp icons (`icons/icon16.png`, `icon48.png`, `icon128.png`).
4. Build a visual standalone test runner (`test_runner.html`) to benchmark the engine on sample texts.

---

## 📋 Task Checklist

- [x] **1. Create `manifest.json`**
  - Schema version: `3`
  - Permissions: `storage`, `activeTab`
  - Host permissions: Google, Bing, DuckDuckGo domains
  - Declare content script, service worker, and popup page entry points.

- [x] **2. Develop `detector.js` (Multi-Signal Statistical Engine)**
  - **Lexical Signal**: 150+ weighted ChatGPT/LLM buzzwords & transition markers ("delve into", "testament to", "tapestry", "in conclusion", "moreover", "leverage", "furthermore", "it is worth noting", etc.).
  - **Burstiness Signal**: Measure variation in sentence lengths (Standard Deviation / Mean).
  - **Vocabulary Richness**: Type-Token Ratio (TTR) and word length distribution.
  - **Structure Signal**: Repetitive list item prefix structures, formal transition cadence.
  - Output format: `{ score: 0-100, label: 'Low'|'Moderate'|'High', breakdown: { lexical, burstiness, ttr }, confidence: 0-100 }`.

- [x] **3. Create Extension Icons**
  - Generate SVG/PNG icons for 16x16, 48x48, and 128x128 pixels.

- [x] **4. Build `test_runner.html`**
  - Lightweight local browser test suite with pre-loaded samples (Human essay, ChatGPT answer, Claude article, hybrid content).
  - Displays instant score calculation speed (< 10ms target) and breakdown visualization.

---

## 🧪 Verification Criteria
- [x] `detector.js` runs in under 15ms per snippet (verified: ~0.2ms - 0.4ms).
- [x] `test_runner.html` opens cleanly in browser and passes test cases with expected score differentiation (Human 18%, AI 75%).
- [x] Extension manifest parses without warnings in `chrome://extensions`.
