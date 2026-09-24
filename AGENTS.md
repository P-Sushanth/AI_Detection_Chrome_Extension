# AGENTS.md - AI Content Detector Chrome Extension

Welcome! This document outlines the project architecture, design guidelines, coding standards, and step-by-step phased rollout plan for building the **AI Content Detector Chrome Extension**.

---

## Project Vision
A lightweight, instant, subtle Chrome Extension (Manifest V3) that inspects search engine result pages (Google, Bing, DuckDuckGo) and places a subtle inline badge next to each result title indicating the estimated percentage of AI-generated content on that website.

### Core Pillars
1. **Instant Speed (< 20ms)**: Uses a pure JavaScript multi-signal statistical & linguistic heuristic engine running locally in the content script.
2. **Subtle & Premium UI**: Color-coded badges (`14% AI`) that blend seamlessly into Google/Bing dark & light themes with hover tooltips detailing signal breakdowns.
3. **Robust Caching**: Background service worker caches results in `chrome.storage.local` for 0ms repeat query rendering.
4. **Developer-Friendly Structure**: Modular design divided into self-contained execution phases.

---

## 🏗️ Project Architecture & Components

```
AI_Detection_Chrome_Extension/
├── AGENTS.md                   # Project strategy & multi-agent guidelines
├── phase_1.md                  # Phase 1: Core Detection Engine & Manifest
├── phase_2.md                  # Phase 2: Content Script & Search Result Badges
├── phase_3.md                  # Phase 3: Background Worker & Storage Cache
├── phase_4.md                  # Phase 4: Sleek Extension Popup & Playground
├── phase_5.md                  # Phase 5: Verification & Polish
├── manifest.json               # Manifest V3 metadata & permissions
├── detector.js                 # Pure JS multi-signal AI text analysis engine
├── content.js                  # Search engine DOM scraper & badge injector
├── content.css                 # Subtle pill badge & tooltip styles
├── background.js               # Service worker for caching & API relay
├── popup.html / .js / .css     # Extension settings popup & playground UI
├── test_runner.html            # Standalone visual test suite & benchmark
└── icons/                      # Extension icons (16, 48, 128)
```

---

## 📑 Phased Execution Plan

The development is divided into 5 distinct, testable phases:

| Phase | Title | Description | Target Deliverables |
| :--- | :--- | :--- | :--- |
| **Phase 1** | [Core Engine & Manifest Setup](file:///c:/Users/popur/Documents/Projects/AI_Detection_Chrome_Extension/phase_1.md) | Pure JS NLP heuristic detector engine & Extension Manifest V3 core structure. | `manifest.json`, `detector.js`, `icons/`, `test_runner.html` |
| **Phase 2** | [Search Engine Badges](file:///c:/Users/popur/Documents/Projects/AI_Detection_Chrome_Extension/phase_2.md) | Inject subtle AI percentage badges & breakdown tooltips into Google/Bing/DDG search results. | `content.js`, `content.css` |
| **Phase 3** | [Background Caching Worker](file:///c:/Users/popur/Documents/Projects/AI_Detection_Chrome_Extension/phase_3.md) | Service worker for persistent caching, messaging relay, and optional page fetching. | `background.js` |
| **Phase 4** | [Extension Popup & Playground](file:///c:/Users/popur/Documents/Projects/AI_Detection_Chrome_Extension/phase_4.md) | Modern glassmorphic extension popup UI with live playground & settings. | `popup.html`, `popup.css`, `popup.js` |
| **Phase 5** | [Verification & Polish](file:///c:/Users/popur/Documents/Projects/AI_Detection_Chrome_Extension/phase_5.md) | End-to-end integration testing, visual alignment, edge cases & benchmark polish. | Suite verification & release check |

---

## 🛠️ Code Style & Guidelines for Agents
- **No Third-Party Framework Overhead**: Keep the extension pure native JS (ES6+), HTML, and CSS to guarantee zero bundle bloat and sub-millisecond execution.
- **Manifest V3 Compliance**: Strictly adhere to MV3 service worker limits, non-persistent background execution, and asynchronous storage APIs (`chrome.storage.local`).
- **DOM Safety**: Use safe DOM manipulation methods (`createElement`, `textContent`) to prevent XSS vulnerabilities when displaying search snippets and tooltips.
- **Theme Awareness**: Use CSS variables with fallback selectors for light and dark Google/Bing search themes.
