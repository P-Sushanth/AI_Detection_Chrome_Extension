/**
 * Content Script - Search Engine DOM Scraper & AI Badge Injector
 * Supports Google Search, Bing Search, and DuckDuckGo.
 */

(function () {
  'use strict';

  // Global state
  let isExtensionEnabled = true;
  let activeTooltip = null;
  let processedElements = new WeakSet();

  // Search Engine Domain Configuration
  const ENGINE_CONFIGS = [
    {
      name: 'Google',
      hostRegex: /google\.[a-z.]+/i,
      cardSelector: '#rso .g, div.MjjYud, div.g, div.WwSpTe',
      titleSelector: 'h3',
      linkSelector: 'a[href]',
      snippetSelector: 'div.VwiC3b, div.yXK7bf, div.IsZvec, .GIW4sq, div.N54UYe'
    },
    {
      name: 'Bing',
      hostRegex: /bing\.com/i,
      cardSelector: '#b_results .b_algo',
      titleSelector: 'h2 a',
      linkSelector: 'h2 a',
      snippetSelector: '.b_caption p, .b_snippet'
    },
    {
      name: 'DuckDuckGo',
      hostRegex: /duckduckgo\.com/i,
      cardSelector: '.react-results--main article, li[data-layout="organic"]',
      titleSelector: 'h2 a, a[data-testid="result-title-a"]',
      linkSelector: 'h2 a, a[data-testid="result-title-a"]',
      snippetSelector: 'div[data-result="snippet"], .oglV270w_L'
    }
  ];

  /**
   * Initialize content script on search engine page
   */
  function init() {
    // Check extension enabled state from chrome storage if API exists
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(['enabled'], (res) => {
        isExtensionEnabled = res.enabled !== false;
        if (isExtensionEnabled) {
          scanPage();
          setupMutationObserver();
        }
      });

      chrome.storage.onChanged.addListener((changes) => {
        if (changes.enabled) {
          isExtensionEnabled = changes.enabled.newValue !== false;
          if (isExtensionEnabled) {
            scanPage();
          } else {
            removeBadges();
          }
        }
      });
    } else {
      // Fallback for standalone context
      scanPage();
      setupMutationObserver();
    }
  }

  /**
   * Detect current active search engine configuration
   */
  function getCurrentEngineConfig() {
    const hostname = window.location.hostname;
    return ENGINE_CONFIGS.find(cfg => cfg.hostRegex.test(hostname));
  }

  /**
   * Scans page for search result containers and injects AI badges
   */
  function scanPage() {
    if (!isExtensionEnabled) return;
    const config = getCurrentEngineConfig();
    if (!config) return;

    const cards = document.querySelectorAll(config.cardSelector);
    cards.forEach(card => {
      if (processedElements.has(card)) return;
      processSearchCard(card, config);
    });
  }

  /**
   * Process an individual search result card with caching
   */
  function processSearchCard(card, config) {
    processedElements.add(card);

    const titleEl = card.querySelector(config.titleSelector);
    if (!titleEl) return;

    if (card.querySelector('.ai-detector-badge')) return;

    const linkEl = card.querySelector(config.linkSelector) || titleEl.closest('a');
    const resultUrl = linkEl ? linkEl.getAttribute('href') : '';
    const snippetEl = card.querySelector(config.snippetSelector);
    const titleText = titleEl.textContent ? titleEl.textContent.trim() : '';
    const snippetText = snippetEl ? snippetEl.textContent.trim() : '';
    const combinedText = `${titleText}. ${snippetText}`.trim();

    if (!combinedText || combinedText.length < 10) return;

    // Check Chrome extension storage cache via background service worker
    if (resultUrl && typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({ action: 'GET_SCORE', url: resultUrl }, (response) => {
        if (chrome.runtime.lastError) {
          // Compute locally if message fails
          computeAndInject(combinedText, resultUrl, titleEl);
          return;
        }

        if (response && response.cached && response.result) {
          // Cache hit (0ms latency!)
          injectBadge(response.result, titleEl);
        } else {
          // Cache miss: Compute and save to cache
          computeAndInject(combinedText, resultUrl, titleEl);
        }
      });
    } else {
      // Direct local compute fallback
      computeAndInject(combinedText, resultUrl, titleEl);
    }
  }

  /**
   * Computes score using AIDetector engine and saves to background cache
   */
  function computeAndInject(text, url, titleEl) {
    if (typeof AIDetector === 'undefined') return;
    const result = AIDetector.analyze(text);
    injectBadge(result, titleEl);

    // Save to cache via background worker
    if (url && typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({ action: 'SAVE_SCORE', url: url, result: result }, () => {
        if (chrome.runtime.lastError) { /* ignore silent error */ }
      });
    }
  }

  /**
   * Injects badge element next to title header
   */
  function injectBadge(result, titleEl) {
    if (!titleEl || titleEl.querySelector('.ai-detector-badge')) return;
    const badgeEl = createBadgeElement(result);

    if (titleEl.tagName.toLowerCase() === 'h3' || titleEl.tagName.toLowerCase() === 'h2') {
      titleEl.appendChild(badgeEl);
    } else if (titleEl.parentElement) {
      titleEl.parentElement.appendChild(badgeEl);
    }
  }

  /**
   * Constructs the subtle inline pill badge DOM element
   */
  function createBadgeElement(result) {
    const badge = document.createElement('span');
    badge.className = 'ai-detector-badge';

    if (result.score >= 65) {
      badge.classList.add('ai-badge-high');
    } else if (result.score >= 31) {
      badge.classList.add('ai-badge-moderate');
    } else {
      badge.classList.add('ai-badge-low');
    }

    badge.textContent = `🤖 ${result.score}% AI`;
    badge.setAttribute('title', `AI Likelihood: ${result.score}% (${result.label}). Hover for breakdown.`);

    badge.addEventListener('mouseenter', (e) => showTooltip(e, result));
    badge.addEventListener('mouseleave', () => hideTooltip());

    return badge;
  }

  /**
   * Shows floating hover popover card
   */
  function showTooltip(event, result) {
    hideTooltip();

    const tooltip = document.createElement('div');
    tooltip.className = 'ai-detector-tooltip';

    const header = document.createElement('div');
    header.className = 'ai-tooltip-header';
    
    const titleSpan = document.createElement('span');
    titleSpan.textContent = `AI Content Breakdown`;
    
    const labelSpan = document.createElement('span');
    labelSpan.style.color = result.score >= 65 ? '#c084fc' : (result.score >= 31 ? '#fbbf24' : '#34d399');
    labelSpan.textContent = `${result.score}% (${result.label})`;
    
    header.appendChild(titleSpan);
    header.appendChild(labelSpan);
    tooltip.appendChild(header);

    const barBg = document.createElement('div');
    barBg.className = 'ai-tooltip-bar-bg';
    const barFill = document.createElement('div');
    barFill.className = 'ai-tooltip-bar-fill';
    barFill.style.width = `${result.score}%`;
    barFill.style.backgroundColor = result.score >= 65 ? '#8b5cf6' : (result.score >= 31 ? '#f59e0b' : '#10b981');
    barBg.appendChild(barFill);
    tooltip.appendChild(barBg);

    const grid = document.createElement('div');
    grid.className = 'ai-tooltip-signals';

    const signalsData = [
      { lbl: 'Lexical Buzzwords', val: `${result.signals.lexical.score}/100` },
      { lbl: 'Burstiness Variance', val: `${result.signals.burstiness.score}/100` },
      { lbl: 'Vocab Richness', val: `${result.signals.vocabulary.score}/100` },
      { lbl: 'Structure Cadence', val: `${result.signals.structure.score}/100` }
    ];

    signalsData.forEach(item => {
      const box = document.createElement('div');
      box.className = 'ai-tooltip-signal-item';
      
      const lbl = document.createElement('div');
      lbl.className = 'ai-tooltip-signal-lbl';
      lbl.textContent = item.lbl;
      
      const val = document.createElement('div');
      val.className = 'ai-tooltip-signal-val';
      val.textContent = item.val;

      box.appendChild(lbl);
      box.appendChild(val);
      grid.appendChild(box);
    });

    tooltip.appendChild(grid);

    if (result.detectedPhrases && result.detectedPhrases.length > 0) {
      const phraseHeader = document.createElement('div');
      phraseHeader.style.fontSize = '10px';
      phraseHeader.style.color = '#94a3b8';
      phraseHeader.style.marginTop = '4px';
      phraseHeader.textContent = 'Detected AI Markers:';
      tooltip.appendChild(phraseHeader);

      const phrasesBox = document.createElement('div');
      phrasesBox.className = 'ai-tooltip-phrases';
      result.detectedPhrases.forEach(p => {
        const tag = document.createElement('span');
        tag.className = 'ai-tooltip-phrase-tag';
        tag.textContent = `"${p}"`;
        phrasesBox.appendChild(tag);
      });
      tooltip.appendChild(phrasesBox);
    }

    document.body.appendChild(tooltip);
    activeTooltip = tooltip;

    const rect = event.target.getBoundingClientRect();
    const tooltipHeight = tooltip.offsetHeight || 160;
    
    let top = rect.bottom + 6;
    if (top + tooltipHeight > window.innerHeight) {
      top = rect.top - tooltipHeight - 6;
    }

    let left = rect.left;
    if (left + 260 > window.innerWidth) {
      left = window.innerWidth - 270;
    }

    tooltip.style.top = `${Math.max(10, top)}px`;
    tooltip.style.left = `${Math.max(10, left)}px`;

    requestAnimationFrame(() => {
      tooltip.classList.add('visible');
    });
  }

  function hideTooltip() {
    if (activeTooltip) {
      activeTooltip.remove();
      activeTooltip = null;
    }
  }

  function removeBadges() {
    document.querySelectorAll('.ai-detector-badge').forEach(b => b.remove());
    hideTooltip();
  }

  function setupMutationObserver() {
    const observer = new MutationObserver((mutations) => {
      let shouldScan = false;
      for (const mutation of mutations) {
        if (mutation.addedNodes.length > 0) {
          shouldScan = true;
          break;
        }
      }
      if (shouldScan) {
        scanPage();
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
