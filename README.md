# AI Content Detector for Search Engine Results

[![Manifest V3](https://img.shields.io/badge/Chrome-Manifest_V3-blue.svg)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![Pure JavaScript](https://img.shields.io/badge/Language-Pure_JavaScript_(ES6+)-yellow.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Speed](https://img.shields.io/badge/Speed-%3C15ms_Execution-brightgreen.svg)](#performance--privacy)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](#license)

A lightweight, high-speed, instant Chrome Extension (Manifest V3) that inspects search engine result pages (Google, Bing, DuckDuckGo) and inserts subtle inline percentage badges next to each result title indicating the estimated proportion of AI-generated content.

---

## Key Features

- **Instant Engine (< 15ms)**: Powered by a multi-signal statistical & linguistic NLP heuristic engine running 100% locally in pure JavaScript with zero external dependencies.
- **Search Engine DOM Integration**: Automatically injects subtle color-coded percentage pills (`14% AI`, `78% AI`) next to result titles on Google, Bing, and DuckDuckGo in both Light and Dark themes.
- **Rich Hover Tooltips**: Hover over any badge to see detailed score breakdowns including lexical hits, sentence burstiness, vocabulary richness, and structural indicators.
- **Persistent LRU Caching**: Background service worker stores analysis results in `chrome.storage.local` for instant 0ms repeat query rendering.
- **Interactive Extension Popup & Playground**: Modern glassmorphic extension popup featuring a live text testing playground, confidence meters, signal metrics, and global extension stats.
- **Standalone Test Suite**: Includes a dedicated visual test runner (`test_runner.html`) for automated engine benchmarking, heuristic validation, and edge-case verification.

---

## Repository Architecture

```
AI_Detection_Chrome_Extension/
├── manifest.json               # Manifest V3 extension metadata & host permissions
├── detector.js                 # Pure JS multi-signal AI text analysis engine
├── content.js                  # Search engine DOM scraper, query observer & badge injector
├── content.css                 # Subtle pill badge & breakdown hover tooltip styles
├── background.js               # Service worker with LRU storage caching & messaging relay
├── popup.html                  # Extension settings popup & interactive text playground UI
├── popup.css                   # Glassmorphic UI styles & theme styling
├── popup.js                    # Popup controller, real-time playground analyzer & settings
├── test_runner.html            # Standalone visual test suite & benchmark dashboard
├── AGENTS.md                   # Core project guidelines & multi-agent conventions
├── phase_1.md - phase_5.md     # Step-by-step phased engineering specifications
└── icons/                      # Extension icons (16px, 48px, 128px)
```

---

## Detection Engine Deep-Dive

The detection engine (`detector.js`) combines four distinct heuristic signals to analyze text patterns without needing cloud API calls or large language model weights:

| Signal | Weight | Description |
| :--- | :---: | :--- |
| **Lexical Density** | **45%** | Scans text against 150+ categorized high-confidence AI phrases, n-grams, and overrepresented vocabulary (e.g. *"delve into"*, *"rich tapestry of"*, *"testament to"*). |
| **Burstiness Analysis** | **25%** | Calculates the Coefficient of Variation ($CV = \frac{\sigma}{\mu}$) of sentence lengths. AI generation tends to produce uniform sentence lengths (low CV), while human writing exhibits high length variance. |
| **Vocabulary Richness** | **15%** | Computes Type-Token Ratio ($TTR = \frac{\text{Unique Words}}{\text{Total Words}}$) to detect LLM vocabulary balancing patterns within tight statistical bands. |
| **Structural & Cadence** | **15%** | Detects artificial formatting patterns such as structured bold-prefix lists (`- **Title:** Description`), formulaic transition words, and em-dash/colon balances. |

### Classification Tiers

- **Low AI Probability**: `0% - 30%` (Green Pill)
- **Moderate AI Probability**: `31% - 64%` (Orange Pill)
- **High AI Probability**: `65% - 100%` (Red Pill)

---

## Installation & Setup

### Load Unpacked Extension in Chrome

1. Clone or download this repository to your local machine:
   ```bash
   git clone https://github.com/P-Sushanth/AI_Detection_Chrome_Extension.git
   ```
2. Open Chrome (or any Chromium-based browser like Brave or Edge) and navigate to `chrome://extensions/`.
3. Enable **Developer mode** using the toggle switch in the top right corner.
4. Click **Load unpacked** and select the repository directory (`AI_Detection_Chrome_Extension`).
5. Perform a search on [Google](https://www.google.com), [Bing](https://www.bing.com), or [DuckDuckGo](https://duckduckgo.com) to see live AI detection badges!

---

## Visual Test Suite & Benchmarking

You can run the built-in test suite without installing the extension:

1. Open `test_runner.html` directly in any web browser.
2. The benchmark runner will evaluate sample human articles, hybrid texts, and AI-generated passages.
3. View real-time score breakdowns, execution timings (sub-15ms target), and assertion pass/fail statuses.

---

## Supported Search Engines & Theme Support

- **Google Search**: Seamlessly attaches next to `h3` title containers in both default Light and Dark search themes.
- **Microsoft Bing**: Attaches to `h2 > a` search result headers.
- **DuckDuckGo**: Integrates into `[data-testid="result-title-a"]` result elements.

---

## Performance & Privacy

- **100% Local Processing**: All text parsing and scoring occurs locally inside your browser. Zero snippet data is uploaded or logged.
- **Sub-15ms Latency**: Native JS regular expressions and array scanning deliver instantaneous results without hindering page scroll or load speed.
- **DOM Safety**: Strict DOM creation using `document.createElement` and `element.textContent` prevents XSS injection vulnerabilities.

---

## License

Distributed under the MIT License. See `LICENSE` for more information.
