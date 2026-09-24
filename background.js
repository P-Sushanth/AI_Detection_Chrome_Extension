/**
 * Background Service Worker - AI Content Detector
 * Manages persistent storage caching, messaging bus, LRU eviction, and extension state.
 */

const DEFAULT_SETTINGS = {
  enabled: true,
  sensitivity: 'medium',
  cacheLimit: 5000,
  cacheStats: { hits: 0, misses: 0 }
};

// Initialize extension default settings on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['enabled', 'sensitivity', 'cacheLimit', 'cacheStats'], (res) => {
    const initialStorage = {};
    if (res.enabled === undefined) initialStorage.enabled = DEFAULT_SETTINGS.enabled;
    if (res.sensitivity === undefined) initialStorage.sensitivity = DEFAULT_SETTINGS.sensitivity;
    if (res.cacheLimit === undefined) initialStorage.cacheLimit = DEFAULT_SETTINGS.cacheLimit;
    if (res.cacheStats === undefined) initialStorage.cacheStats = DEFAULT_SETTINGS.cacheStats;
    if (res.urlCache === undefined) initialStorage.urlCache = {};

    chrome.storage.local.set(initialStorage, () => {
      console.log('[AI Detector Service Worker] Initialized default settings.');
    });
  });
});

// Handle incoming messages from Content Script and Extension Popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (!request || !request.action) return false;

  switch (request.action) {
    case 'GET_SCORE':
      handleGetScore(request.url, sendResponse);
      return true; // Async response

    case 'SAVE_SCORE':
      handleSaveScore(request.url, request.result, sendResponse);
      return true; // Async response

    case 'CLEAR_CACHE':
      handleClearCache(sendResponse);
      return true; // Async response

    case 'GET_STATS':
      handleGetStats(sendResponse);
      return true; // Async response

    case 'PREFETCH_PAGE':
      handlePrefetchPage(request.url, sendResponse);
      return true; // Async response

    default:
      sendResponse({ status: 'unknown_action' });
      return false;
  }
});

/**
 * Retrieves cached score for a specific URL
 */
function handleGetScore(url, sendResponse) {
  if (!url) {
    sendResponse({ cached: false });
    return;
  }

  const cacheKey = normalizeUrl(url);

  chrome.storage.local.get(['urlCache', 'cacheStats'], (res) => {
    const urlCache = res.urlCache || {};
    const stats = res.cacheStats || { hits: 0, misses: 0 };

    if (urlCache[cacheKey]) {
      // Cache Hit
      stats.hits = (stats.hits || 0) + 1;
      // Update last accessed timestamp for LRU
      urlCache[cacheKey].lastAccessed = Date.now();

      chrome.storage.local.set({ urlCache, cacheStats: stats }, () => {
        sendResponse({ cached: true, result: urlCache[cacheKey].data });
      });
    } else {
      // Cache Miss
      stats.misses = (stats.misses || 0) + 1;
      chrome.storage.local.set({ cacheStats: stats }, () => {
        sendResponse({ cached: false });
      });
    }
  });
}

/**
 * Saves URL analysis result to cache with LRU eviction protection
 */
function handleSaveScore(url, result, sendResponse) {
  if (!url || !result) {
    sendResponse({ status: 'invalid_data' });
    return;
  }

  const cacheKey = normalizeUrl(url);

  chrome.storage.local.get(['urlCache', 'cacheLimit'], (res) => {
    let urlCache = res.urlCache || {};
    const limit = res.cacheLimit || DEFAULT_SETTINGS.cacheLimit;

    // Enforce LRU eviction if cache exceeds capacity
    const keys = Object.keys(urlCache);
    if (keys.length >= limit) {
      // Sort keys by lastAccessed timestamp ascending and purge oldest 10%
      const sortedKeys = keys.sort((a, b) => (urlCache[a].lastAccessed || 0) - (urlCache[b].lastAccessed || 0));
      const purgeCount = Math.max(1, Math.floor(limit * 0.1));
      for (let i = 0; i < purgeCount; i++) {
        delete urlCache[sortedKeys[i]];
      }
    }

    urlCache[cacheKey] = {
      data: result,
      timestamp: Date.now(),
      lastAccessed: Date.now()
    };

    chrome.storage.local.set({ urlCache }, () => {
      sendResponse({ status: 'success', cachedCount: Object.keys(urlCache).length });
    });
  });
}

/**
 * Clears cached score entries
 */
function handleClearCache(sendResponse) {
  chrome.storage.local.set({ urlCache: {}, cacheStats: { hits: 0, misses: 0 } }, () => {
    sendResponse({ status: 'success' });
  });
}

/**
 * Returns cache performance statistics
 */
function handleGetStats(sendResponse) {
  chrome.storage.local.get(['urlCache', 'cacheStats'], (res) => {
    const urlCache = res.urlCache || {};
    const stats = res.cacheStats || { hits: 0, misses: 0 };
    sendResponse({
      cachedUrlsCount: Object.keys(urlCache).length,
      hits: stats.hits || 0,
      misses: stats.misses || 0
    });
  });
}

/**
 * Lightweight background fetch for snippet expansion
 */
function handlePrefetchPage(url, sendResponse) {
  if (!url || !url.startsWith('http')) {
    sendResponse({ status: 'error', message: 'Invalid URL' });
    return;
  }

  fetch(url, { method: 'GET', headers: { 'Accept': 'text/html' } })
    .then(response => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.text();
    })
    .then(html => {
      // Extract text content from body paragraphs
      const textMatch = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                            .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
                            .replace(/<[^>]+>/g, ' ')
                            .replace(/\s+/g, ' ')
                            .trim();
      sendResponse({ status: 'success', text: textMatch.slice(0, 3000) });
    })
    .catch(err => {
      sendResponse({ status: 'error', message: err.message });
    });
}

/**
 * Normalizes URL keys for cache lookup
 */
function normalizeUrl(url) {
  try {
    const parsed = new URL(url);
    return `${parsed.hostname}${parsed.pathname}`.toLowerCase();
  } catch (e) {
    return String(url).trim().toLowerCase();
  }
}
