/**
 * Popup Script - UI Event Handlers & State Sync
 * AI Content Detector Chrome Extension
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Element References
  const masterToggle = document.getElementById('masterToggle');
  const sensitivityHint = document.getElementById('sensitivityHint');
  const segmentBtns = document.querySelectorAll('.segment-btn');
  const showIconToggle = document.getElementById('showIconToggle');
  const showTooltipToggle = document.getElementById('showTooltipToggle');
  
  const cacheCountBadge = document.getElementById('cacheCountBadge');
  const cacheMemoryVal = document.getElementById('cacheMemoryVal');
  const cacheHitsVal = document.getElementById('cacheHitsVal');
  const clearCacheBtn = document.getElementById('clearCacheBtn');

  // Playground Elements
  const pgTextarea = document.getElementById('pgTextarea');
  const pgSpeedTag = document.getElementById('pgSpeedTag');
  const pgScoreText = document.getElementById('pgScoreText');
  const pgScoreFill = document.getElementById('pgScoreFill');
  const pgLex = document.getElementById('pgLex');
  const pgBst = document.getElementById('pgBst');
  const pgVoc = document.getElementById('pgVoc');
  const pgStr = document.getElementById('pgStr');
  const pgPhrasesTags = document.getElementById('pgPhrasesTags');

  // API Elements
  const apiRelayToggle = document.getElementById('apiRelayToggle');
  const apiKeyInput = document.getElementById('apiKeyInput');
  const apiEndpointInput = document.getElementById('apiEndpointInput');
  const prefetchToggle = document.getElementById('prefetchToggle');

  // Tab Navigation Setup
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      tabPanes.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const tabId = btn.getAttribute('data-tab');
      document.getElementById(tabId).classList.add('active');
    });
  });

  /**
   * Load stored extension settings from chrome.storage.local
   */
  function loadSettings() {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get([
        'enabled', 'sensitivity', 'showIcon', 'showTooltip',
        'useApiRelay', 'apiKey', 'apiEndpoint', 'prefetchFullPage'
      ], (res) => {
        if (res.enabled !== undefined) masterToggle.checked = res.enabled;
        if (res.showIcon !== undefined) showIconToggle.checked = res.showIcon;
        if (res.showTooltip !== undefined) showTooltipToggle.checked = res.showTooltip;
        if (res.useApiRelay !== undefined) apiRelayToggle.checked = res.useApiRelay;
        if (res.apiKey !== undefined) apiKeyInput.value = res.apiKey;
        if (res.apiEndpoint !== undefined) apiEndpointInput.value = res.apiEndpoint;
        if (res.prefetchFullPage !== undefined) prefetchToggle.checked = res.prefetchFullPage;

        const sensitivity = res.sensitivity || 'medium';
        setSensitivityUI(sensitivity);
      });
    }

    refreshCacheStats();
  }

  /**
   * Updates sensitivity UI state
   */
  function setSensitivityUI(sens) {
    segmentBtns.forEach(btn => {
      if (btn.getAttribute('data-sensitivity') === sens) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    const labels = { low: 'Permissive', medium: 'Balanced', high: 'Strict' };
    sensitivityHint.textContent = labels[sens] || 'Balanced';
  }

  /**
   * Save setting key-value pair to chrome.storage.local
   */
  function saveSetting(key, val) {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ [key]: val });
    }
  }

  // Event Listeners for settings
  masterToggle.addEventListener('change', (e) => saveSetting('enabled', e.target.checked));
  showIconToggle.addEventListener('change', (e) => saveSetting('showIcon', e.target.checked));
  showTooltipToggle.addEventListener('change', (e) => saveSetting('showTooltip', e.target.checked));
  apiRelayToggle.addEventListener('change', (e) => saveSetting('useApiRelay', e.target.checked));
  apiKeyInput.addEventListener('input', (e) => saveSetting('apiKey', e.target.value.trim()));
  apiEndpointInput.addEventListener('input', (e) => saveSetting('apiEndpoint', e.target.value.trim()));
  prefetchToggle.addEventListener('change', (e) => saveSetting('prefetchFullPage', e.target.checked));

  segmentBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const sens = btn.getAttribute('data-sensitivity');
      setSensitivityUI(sens);
      saveSetting('sensitivity', sens);
    });
  });

  /**
   * Refreshes cache stats display
   */
  function refreshCacheStats() {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({ action: 'GET_CACHE_STATS' }, (res) => {
        if (chrome.runtime.lastError || !res) return;
        cacheCountBadge.textContent = `${res.count || 0} Cached`;
        cacheHitsVal.textContent = `${res.totalHits || 0}`;

        const kb = ((res.bytesUsed || 0) / 1024).toFixed(1);
        cacheMemoryVal.textContent = `${kb} KB`;
      });
    }
  }

  // Clear cache action
  clearCacheBtn.addEventListener('click', () => {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({ action: 'CLEAR_CACHE' }, (res) => {
        refreshCacheStats();
      });
    }
  });

  /**
   * Live Playground Analyzer
   */
  function runPlaygroundAnalysis() {
    const text = pgTextarea.value.trim();
    if (!text || typeof AIDetector === 'undefined') {
      pgSpeedTag.textContent = '0ms';
      pgScoreText.textContent = '0% (Low)';
      pgScoreFill.style.width = '0%';
      pgLex.textContent = '0/100';
      pgBst.textContent = '0/100';
      pgVoc.textContent = '0/100';
      pgStr.textContent = '0/100';
      pgPhrasesTags.innerHTML = '<span class="no-phrases">None detected</span>';
      return;
    }

    const res = AIDetector.analyze(text);

    pgSpeedTag.textContent = `${res.executionTimeMs}ms`;
    pgScoreText.textContent = `${res.score}% (${res.label})`;
    pgScoreFill.style.width = `${res.score}%`;

    if (res.score >= 65) {
      pgScoreFill.style.backgroundColor = '#8b5cf6';
    } else if (res.score >= 31) {
      pgScoreFill.style.backgroundColor = '#f59e0b';
    } else {
      pgScoreFill.style.backgroundColor = '#10b981';
    }

    pgLex.textContent = `${res.signals.lexical.score}/100`;
    pgBst.textContent = `${res.signals.burstiness.score}/100`;
    pgVoc.textContent = `${res.signals.vocabulary.score}/100`;
    pgStr.textContent = `${res.signals.structure.score}/100`;

    if (res.detectedPhrases && res.detectedPhrases.length > 0) {
      pgPhrasesTags.innerHTML = res.detectedPhrases.map(p => `<span class="phrase-tag">"${p}"</span>`).join('');
    } else {
      pgPhrasesTags.innerHTML = '<span class="no-phrases">None detected</span>';
    }
  }

  pgTextarea.addEventListener('input', runPlaygroundAnalysis);

  // Initialize
  loadSettings();

  // Set default sample text in playground
  pgTextarea.value = "In the ever-evolving landscape of modern technology, artificial intelligence serves as a testament to human ingenuity. It is worth noting that AI plays a crucial role in unlocking potential.";
  runPlaygroundAnalysis();
});
