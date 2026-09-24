/**
 * Background Service Worker - Cache Manager & API Relay
 * AI Content Detector Chrome Extension (MV3)
 */

// Default Configuration Settings
const DEFAULT_SETTINGS = {
  enabled: true,
  sensitivity: 'medium', // 'low', 'medium', 'high'
  cacheLimit: 5000,
  apiEndpoint: '',
  apiKey: '',
  useApiRelay: false,
  prefetchFullPage: false
};

/**
 * Service Worker Installation & Setup
 */
chrome.runtime.onInstalled.addListener(async () => {
  const current = await chrome.storage.local.get(null);
  const newStorage = {};

  // Merge default settings without overwriting existing user preferences
  for (const [key, val] of Object.entries(DEFAULT_SETTINGS)) {
    if (current[key] === undefined) {
      newStorage[key] = val;
    }
  }

  if (current.cache === undefined) {
    newStorage.cache = {};
  }

  if (Object.keys(newStorage).length > 0) {
    await chrome.storage.local.set(newStorage);
  }
  console.log('[AI Content Detector SW] Initialized storage default settings');
});

/**
 * Message Handler Interface for Content Scripts & Popup
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (!request || !request.action) return false;

  switch (request.action) {
    case 'GET_CACHED_SCORE':
      handleGetCachedScore(request, sendResponse);
      return true; // Async response

    case 'SAVE_SCORE':
      handleSaveScore(request, sendResponse);
      return true;

    case 'CLEAR_CACHE':
      handleClearCache(sendResponse);
      return true;

    case 'GET_CACHE_STATS':
      handleGetCacheStats(sendResponse);
      return true;

    case 'FETCH_AND_ANALYZE':
      handleFetchAndAnalyze(request, sendResponse);
      return true;

    case 'API_RELAY_ANALYZE':
      handleApiRelayAnalyze(request, sendResponse);
      return true;

    default:
      sendResponse({ status: 'unknown_action' });
      return false;
  }
});

/**
 * Retrieves cached score by URL or snippet text hash
 */
async function handleGetCachedScore(req, sendResponse) {
  try {
    const { url, textKey } = req;
    const { cache = {} } = await chrome.storage.local.get(['cache']);

    const key = url || textKey;
    if (key && cache[key]) {
      // Update hit count and timestamp for LRU tracking
      cache[key].timestamp = Date.now();
      cache[key].hits = (cache[key].hits || 0) + 1;
      await chrome.storage.local.set({ cache });

      sendResponse({ found: true, result: cache[key].result, fromCache: true });
      return;
    }

    sendResponse({ found: false });
  } catch (err) {
    console.error('[AI Detector SW] Error getting cache:', err);
    sendResponse({ found: false, error: err.message });
  }
}

/**
 * Saves analysis result into persistent chrome.storage.local with LRU eviction
 */
async function handleSaveScore(req, sendResponse) {
  try {
    const { url, textKey, result } = req;
    const key = url || textKey;

    if (!key || !result) {
      sendResponse({ success: false, reason: 'Invalid parameters' });
      return;
    }

    const { cache = {}, cacheLimit = DEFAULT_SETTINGS.cacheLimit } = await chrome.storage.local.get(['cache', 'cacheLimit']);

    // Store entry with LRU metadata
    cache[key] = {
      result,
      timestamp: Date.now(),
      hits: (cache[key] ? cache[key].hits : 0) + 1
    };

    // LRU Eviction check
    const keys = Object.keys(cache);
    if (keys.length > cacheLimit) {
      // Sort keys by timestamp ascending (oldest first)
      const sortedKeys = keys.sort((a, b) => cache[a].timestamp - cache[b].timestamp);
      const itemsToRemove = keys.length - cacheLimit;
      for (let i = 0; i < itemsToRemove; i++) {
        delete cache[sortedKeys[i]];
      }
    }

    await chrome.storage.local.set({ cache });
    sendResponse({ success: true, cacheCount: Object.keys(cache).length });
  } catch (err) {
    console.error('[AI Detector SW] Error saving cache:', err);
    sendResponse({ success: false, error: err.message });
  }
}

/**
 * Clears persistent cache
 */
async function handleClearCache(sendResponse) {
  try {
    await chrome.storage.local.set({ cache: {} });
    sendResponse({ success: true, message: 'Cache cleared' });
  } catch (err) {
    sendResponse({ success: false, error: err.message });
  }
}

/**
 * Calculates cache statistics
 */
async function handleGetCacheStats(sendResponse) {
  try {
    const { cache = {} } = await chrome.storage.local.get(['cache']);
    const keys = Object.keys(cache);
    let totalHits = 0;
    keys.forEach(k => { totalHits += (cache[k].hits || 0); });

    sendResponse({
      count: keys.length,
      totalHits,
      bytesUsed: JSON.stringify(cache).length
    });
  } catch (err) {
    sendResponse({ count: 0, totalHits: 0, error: err.message });
  }
}

/**
 * Background fetch and hydration of lightweight page content
 */
async function handleFetchAndAnalyze(req, sendResponse) {
  try {
    const { url } = req;
    if (!url || !url.startsWith('http')) {
      sendResponse({ success: false, reason: 'Invalid URL' });
      return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: { 'Accept': 'text/html' }
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      sendResponse({ success: false, reason: `HTTP ${response.status}` });
      return;
    }

    const htmlText = await response.text();
    // Extract main paragraph text or meta description from HTML
    const extractedText = extractTextFromHtml(htmlText);

    if (!extractedText || extractedText.length < 50) {
      sendResponse({ success: false, reason: 'Insufficient text extracted' });
      return;
    }

    // Import detector in service worker or run heuristic calculation
    if (typeof AIDetector !== 'undefined') {
      const result = AIDetector.analyze(extractedText);
      await handleSaveScore({ url, result }, () => {});
      sendResponse({ success: true, result, extractedLength: extractedText.length });
    } else {
      sendResponse({ success: false, reason: 'AIDetector engine not available in SW context' });
    }
  } catch (err) {
    sendResponse({ success: false, error: err.message });
  }
}

/**
 * Utility to extract clean plain text from raw HTML string
 */
function extractTextFromHtml(html) {
  // Simple regex parser for background SW (no DOM available in SW context)
  const metaDescMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
  let metaDesc = metaDescMatch ? metaDescMatch[1] : '';

  // Clean script and style tags
  let cleaned = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
                    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ');

  // Extract paragraph texts
  const pMatches = cleaned.match(/<p\b[^>]*>(.*?)<\/p>/gi) || [];
  const pTexts = pMatches.map(p => p.replace(/<[^>]+>/g, '').trim()).filter(t => t.length > 20);

  const combined = [metaDesc, ...pTexts.slice(0, 5)].join(' ').trim();
  return combined;
}

/**
 * Optional API Relay Handler (e.g. Gemini / Custom AI API)
 */
async function handleApiRelayAnalyze(req, sendResponse) {
  try {
    const { apiKey, apiEndpoint } = await chrome.storage.local.get(['apiKey', 'apiEndpoint']);

    if (!apiKey || !apiEndpoint) {
      sendResponse({ success: false, reason: 'API Key or Endpoint not configured' });
      return;
    }

    const payload = {
      contents: [{
        parts: [{ text: `Analyze the following text for AI probability (0-100%):\n"${req.text}"` }]
      }]
    };

    const response = await fetch(`${apiEndpoint}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    sendResponse({ success: true, apiData: data });
  } catch (err) {
    sendResponse({ success: false, error: err.message });
  }
}
