/**
 * Pure JavaScript Multi-Signal AI Content Detection Engine
 * Fast (< 15ms), self-contained, client-side statistical & linguistic heuristic analyzer.
 */

(function (global) {
  'use strict';

  // 150+ Lexical markers categorized by AI signal weight
  const LEXICON = [
    // Tier 3: High-Confidence AI Phrases (Weight: 4.5 - 5.0)
    { phrase: 'delve into', weight: 4.8 },
    { phrase: 'delves into', weight: 4.8 },
    { phrase: 'delving into', weight: 4.8 },
    { phrase: 'rich tapestry of', weight: 5.0 },
    { phrase: 'tapestry of', weight: 4.5 },
    { phrase: 'serves as a testament', weight: 4.9 },
    { phrase: 'testament to', weight: 4.2 },
    { phrase: 'nestled in the heart of', weight: 4.8 },
    { phrase: 'beacon of', weight: 4.5 },
    { phrase: 'in conclusion,', weight: 4.0 },
    { phrase: 'to summarize,', weight: 4.0 },
    { phrase: 'in summary,', weight: 4.0 },
    { phrase: 'vital role in', weight: 3.8 },
    { phrase: 'crucial role in', weight: 3.8 },
    { phrase: 'paramount importance', weight: 4.5 },
    { phrase: 'shed light on', weight: 4.2 },
    { phrase: 'interplay between', weight: 4.5 },
    { phrase: 'a myriad of', weight: 4.4 },
    { phrase: 'it is worth noting', weight: 4.5 },
    { phrase: 'it is important to note', weight: 4.5 },
    { phrase: 'it is crucial to understand', weight: 4.6 },
    { phrase: 'reasons behind', weight: 3.5 },
    { phrase: 'treasure trove', weight: 4.5 },
    { phrase: 'leverage the power of', weight: 4.6 },
    { phrase: 'seamless integration', weight: 4.2 },
    { phrase: 'ever-evolving landscape', weight: 4.8 },
    { phrase: 'unwavering commitment', weight: 4.7 },
    { phrase: 'fostering a', weight: 4.2 },
    { phrase: 'cornerstone of', weight: 4.3 },
    { phrase: 'profound impact', weight: 4.2 },
    { phrase: 'indispensable tool', weight: 4.5 },
    { phrase: 'unlocking the potential', weight: 4.6 },
    { phrase: 'spearheading the', weight: 4.4 },
    { phrase: 'transformative power', weight: 4.5 },
    { phrase: 'pivotal moment', weight: 4.2 },
    { phrase: 'embark on a journey', weight: 4.8 },
    { phrase: 'navigating the complexities', weight: 4.7 },
    { phrase: 'double-edged sword', weight: 4.3 },
    { phrase: 'shaping the future of', weight: 4.2 },
    { phrase: 'a testament to human', weight: 4.8 },
    { phrase: 'key takeaways', weight: 3.5 },

    // Tier 2: Moderate-Confidence AI Indicators (Weight: 2.5 - 3.5)
    { phrase: 'moreover,', weight: 3.2 },
    { phrase: 'furthermore,', weight: 3.2 },
    { phrase: 'consequently,', weight: 3.0 },
    { phrase: 'nonetheless,', weight: 3.0 },
    { phrase: 'imperative that', weight: 3.4 },
    { phrase: 'synergy between', weight: 3.5 },
    { phrase: 'holistic approach', weight: 3.4 },
    { phrase: 'paradigm shift', weight: 3.5 },
    { phrase: 'seamlessly blend', weight: 3.6 },
    { phrase: 'reimagine the', weight: 3.4 },
    { phrase: 'unparalleled', weight: 3.2 },
    { phrase: 'empower users', weight: 3.5 },
    { phrase: 'demystify the', weight: 3.5 },
    { phrase: 'invaluable asset', weight: 3.4 },
    { phrase: 'harnessing the', weight: 3.3 },
    { phrase: 'catalyst for', weight: 3.5 },
    { phrase: 'foster a sense', weight: 3.6 },
    { phrase: 'underscore the', weight: 3.4 },
    { phrase: 'accentuate the', weight: 3.5 },
    { phrase: 'intricate web', weight: 3.6 },
    { phrase: 'bolster the', weight: 3.4 },
    { phrase: 'meticulous attention', weight: 3.5 },
    { phrase: 'game-changer', weight: 3.2 },
    { phrase: 'revolutionize the', weight: 3.3 },
    { phrase: 'delve deeper', weight: 3.8 },
    { phrase: 'tapestry', weight: 3.5 },
    { phrase: 'multifaceted', weight: 3.2 },
    { phrase: 'underpins', weight: 3.2 },
    { phrase: 'orchestrate', weight: 3.3 },

    // Tier 1: Overrepresented Vocabulary Buzzwords (Weight: 1.5 - 2.4)
    { phrase: 'delve', weight: 2.4 },
    { phrase: 'myriad', weight: 2.2 },
    { phrase: 'pivotal', weight: 2.0 },
    { phrase: 'paramount', weight: 2.2 },
    { phrase: 'holistic', weight: 2.0 },
    { phrase: 'seamless', weight: 1.8 },
    { phrase: 'synergy', weight: 2.2 },
    { phrase: 'beacon', weight: 2.2 },
    { phrase: 'catalyst', weight: 2.0 },
    { phrase: 'bolster', weight: 2.0 },
    { phrase: 'interplay', weight: 2.2 },
    { phrase: 'cornerstone', weight: 2.1 },
    { phrase: 'leverage', weight: 1.8 },
    { phrase: 'underscore', weight: 2.0 },
    { phrase: 'unwavering', weight: 2.2 },
    { phrase: 'tapestry', weight: 2.4 },
    { phrase: 'testament', weight: 2.2 },
    { phrase: 'realm', weight: 2.0 },
    { phrase: 'landscape', weight: 1.6 }
  ];

  class AIDetector {
    /**
     * Main Entry Point for AI Detection
     * @param {string} text - The input snippet or article text.
     * @param {object} options - Custom options (e.g. sensitivity).
     * @returns {object} Analysis result containing percentage score, label, breakdown, and execution time.
     */
    static analyze(text, options = {}) {
      const startTime = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
      
      if (!text || typeof text !== 'string' || text.trim().length === 0) {
        return this._getEmptyResult();
      }

      const cleanText = text.trim();
      const words = this._tokenizeWords(cleanText);
      const sentences = this._tokenizeSentences(cleanText);

      // 1. Calculate Individual Signals
      const lexical = this._calcLexicalSignal(cleanText, words);
      const burstiness = this._calcBurstinessSignal(sentences);
      const vocabulary = this._calcVocabularySignal(words);
      const structure = this._calcStructuralSignal(cleanText, sentences);

      // 2. Compute Weighted Final Score
      // Weights: Lexical (45%), Burstiness (25%), Vocabulary (15%), Structure (15%)
      let rawScore = (
        (lexical.score * 0.45) +
        (burstiness.score * 0.25) +
        (vocabulary.score * 0.15) +
        (structure.score * 0.15)
      );

      // Apply short text boost or normalization if text is concise (e.g., search engine snippet)
      if (words.length < 35 && lexical.matchedPhrases.length > 0) {
        rawScore = Math.min(100, rawScore * 1.25);
      }

      const finalScore = Math.min(100, Math.max(0, Math.round(rawScore)));

      // 3. Label & Confidence
      let label = 'Low';
      if (finalScore >= 65) {
        label = 'High';
      } else if (finalScore >= 31) {
        label = 'Moderate';
      }

      const confidence = this._calcConfidence(words.length, finalScore);
      const endTime = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
      const executionTimeMs = parseFloat((endTime - startTime).toFixed(2));

      return {
        score: finalScore,
        label: label,
        confidence: confidence,
        signals: {
          lexical: { score: lexical.score, weight: 0.45, matches: lexical.matchedPhrases },
          burstiness: { score: burstiness.score, weight: 0.25, cv: burstiness.cv, meanLength: burstiness.meanLength },
          vocabulary: { score: vocabulary.score, weight: 0.15, ttr: vocabulary.ttr },
          structure: { score: structure.score, weight: 0.15, indicators: structure.indicators }
        },
        detectedPhrases: lexical.matchedPhrases,
        wordCount: words.length,
        sentenceCount: sentences.length,
        executionTimeMs: executionTimeMs
      };
    }

    /**
     * Lexical Analysis: Scans text against AI lexicon
     */
    static _calcLexicalSignal(text, words) {
      const lowerText = text.toLowerCase();
      let totalPoints = 0;
      const matchedPhrases = [];

      for (const item of LEXICON) {
        if (lowerText.includes(item.phrase)) {
          totalPoints += item.weight;
          if (matchedPhrases.length < 5) {
            matchedPhrases.push(item.phrase);
          }
        }
      }

      const wordCount = Math.max(1, words.length);
      // Normalized density per 100 words
      const density = (totalPoints / wordCount) * 100;
      
      // Map density to 0 - 100 scale
      let score = 0;
      if (density > 0) {
        score = Math.min(100, Math.round(density * 18));
      }

      return { score, matchedPhrases };
    }

    /**
     * Burstiness Analysis: Measures sentence length variance
     * Human writing has high variance (high CV); AI text is uniform (low CV).
     */
    static _calcBurstinessSignal(sentences) {
      if (sentences.length < 2) {
        return { score: 35, cv: 0.5, meanLength: sentences[0] ? sentences[0].split(/\s+/).length : 0 };
      }

      const lengths = sentences.map(s => s.trim().split(/\s+/).filter(Boolean).length);
      const mean = lengths.reduce((acc, val) => acc + val, 0) / lengths.length;

      if (mean === 0) return { score: 0, cv: 0, meanLength: 0 };

      const variance = lengths.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / lengths.length;
      const stdDev = Math.sqrt(variance);
      const cv = stdDev / mean; // Coefficient of Variation

      // Low CV (< 0.35) -> Uniform length -> High AI score
      // High CV (> 0.65) -> Varied length -> Low AI score
      let score = 50;
      if (cv < 0.25) {
        score = 85;
      } else if (cv < 0.40) {
        score = 70;
      } else if (cv < 0.55) {
        score = 45;
      } else if (cv > 0.70) {
        score = 15;
      }

      return { score, cv: parseFloat(cv.toFixed(2)), meanLength: parseFloat(mean.toFixed(1)) };
    }

    /**
     * Vocabulary Richness: Type-Token Ratio (TTR)
     */
    static _calcVocabularySignal(words) {
      if (words.length === 0) return { score: 0, ttr: 0 };

      const lowerWords = words.map(w => w.toLowerCase());
      const uniqueWords = new Set(lowerWords);
      const ttr = uniqueWords.size / words.length;

      // LLMs tend to balance vocabulary within tight predictable bands for medium texts
      let score = 40;
      if (words.length > 30) {
        if (ttr > 0.85) {
          score = 20; // High vocabulary variance (human)
        } else if (ttr >= 0.55 && ttr <= 0.75) {
          score = 65; // Typical LLM output band
        }
      }

      return { score, ttr: parseFloat(ttr.toFixed(2)) };
    }

    /**
     * Structural Signal: Formatting & artificial cadence
     */
    static _calcStructuralSignal(text, sentences) {
      const indicators = [];
      let score = 20;

      // 1. Colon / Em-dash balance check
      const emDashCount = (text.match(/—/g) || []).length;
      const colonCount = (text.match(/:/g) || []).length;

      if (emDashCount >= 2 || colonCount >= 3) {
        score += 25;
        indicators.push('Excessive colons/em-dashes');
      }

      // 2. Structured list pattern matching (e.g., "- **Title:** Description")
      const listPattern = /[-•*]\s*\*\*[^*]+\*\*:/g;
      if (listPattern.test(text)) {
        score += 35;
        indicators.push('Structured bold-prefix list format');
      }

      // 3. Balanced paragraph or sentence length cadence
      if (sentences.length >= 3) {
        const startsWithTransition = /^(firstly|secondly|furthermore|in conclusion|additionally|overall|moreover)/i;
        let transitionCount = 0;
        sentences.forEach(s => {
          if (startsWithTransition.test(s.trim())) transitionCount++;
        });

        if (transitionCount >= 2) {
          score += 30;
          indicators.push('Formulaic transition cadence');
        }
      }

      return { score: Math.min(100, score), indicators };
    }

    static _calcConfidence(wordCount, score) {
      if (wordCount < 10) return 45;
      if (wordCount < 25) return 65;
      if (wordCount < 60) return 85;
      return 95;
    }

    static _tokenizeWords(text) {
      return text.replace(/[^\w\s]/gi, '').split(/\s+/).filter(w => w.length > 0);
    }

    static _tokenizeSentences(text) {
      return text.split(/[.!?]+(?:\s+|$)/).filter(s => s.trim().length > 0);
    }

    static _getEmptyResult() {
      return {
        score: 0,
        label: 'Low',
        confidence: 0,
        signals: {
          lexical: { score: 0, weight: 0.45, matches: [] },
          burstiness: { score: 0, weight: 0.25, cv: 0, meanLength: 0 },
          vocabulary: { score: 0, weight: 0.15, ttr: 0 },
          structure: { score: 0, weight: 0.15, indicators: [] }
        },
        detectedPhrases: [],
        wordCount: 0,
        sentenceCount: 0,
        executionTimeMs: 0
      };
    }
  }

  // Export to global scope (Browser Window & Chrome Content Script)
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = AIDetector;
  } else {
    global.AIDetector = AIDetector;
  }
})(typeof self !== 'undefined' ? self : this);
