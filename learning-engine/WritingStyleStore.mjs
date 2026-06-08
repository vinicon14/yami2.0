import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const STYLE_VERSION = 1;
const MAX_MESSAGES_ANALYZED = 200;
const DECAY_THRESHOLD_DAYS = 60;
const MIN_CONFIDENCE = 0.1;
const MAX_CONFIDENCE = 0.95;
const CONFIDENCE_INCREMENT = 0.04;
const CONFIDENCE_DECREMENT = 0.02;

export class WritingStyleStore {
  constructor(baseDir) {
    this.baseDir = baseDir;
    this.filePath = join(baseDir, "writing-style.json");
    this.profile = null;
  }

  load() {
    if (!existsSync(this.baseDir)) {
      mkdirSync(this.baseDir, { recursive: true });
    }
    this.profile = this._loadJSON(this.filePath, this._defaultProfile());
    return this;
  }

  save() {
    this.profile.lastUpdated = new Date().toISOString();
    this._writeJSON(this.filePath, this.profile);
  }

  getProfile() {
    return this.profile;
  }

  get enabled() {
    return this.profile.enabled !== false;
  }

  set enabled(val) {
    this.profile.enabled = val;
    this.save();
  }

  recordMessage(text) {
    if (!this.enabled) return;
    const msgs = this.profile.messages;
    msgs.push({
      text: text.slice(0, 2000),
      timestamp: new Date().toISOString(),
      charCount: text.length,
      wordCount: text.split(/\s+/).filter(Boolean).length,
    });
    if (msgs.length > MAX_MESSAGES_ANALYZED) {
      this.profile.messages = msgs.slice(-MAX_MESSAGES_ANALYZED);
    }
    this.profile.totalMessages++;
    this._decayOldEntries();
  }

  updateMetrics(metrics) {
    const s = this.profile.style;
    for (const [key, value] of Object.entries(metrics)) {
      if (value === undefined || value === null) continue;
      if (typeof value === "string") {
        this._biasPreference(s, key, value);
      } else if (typeof value === "number") {
        this._updateRunningAverage(s, key, value);
      } else if (typeof value === "object" && !Array.isArray(value)) {
        if (!s[key]) s[key] = {};
        if (value.count) {
          s[key].count = (s[key].count || 0) + value.count;
        }
        if (value.value) {
          this._biasPreference(s, key, value.value);
        }
      }
    }
    this.save();
  }

  updateVocabulary(words) {
    const vocab = this.profile.vocabulary;
    for (const [word, count] of Object.entries(words)) {
      const existing = vocab.find((v) => v.word === word);
      if (existing) {
        existing.count += count;
        existing.lastSeen = new Date().toISOString();
      } else {
        vocab.push({
          word,
          count,
          firstSeen: new Date().toISOString(),
          lastSeen: new Date().toISOString(),
        });
      }
    }
    vocab.sort((a, b) => b.count - a.count);
    if (vocab.length > 200) {
      this.profile.vocabulary = vocab.slice(0, 200);
    }
  }

  updateExpressions(expressions) {
    const exprs = this.profile.expressions;
    for (const expr of expressions) {
      const existing = exprs.find((e) => e.text === expr.text);
      if (existing) {
        existing.count += expr.count || 1;
        existing.lastSeen = new Date().toISOString();
      } else {
        exprs.push({
          text: expr.text,
          type: expr.type || "phrase",
          count: expr.count || 1,
          firstSeen: new Date().toISOString(),
          lastSeen: new Date().toISOString(),
        });
      }
    }
    exprs.sort((a, b) => b.count - a.count);
    if (exprs.length > 50) {
      this.profile.expressions = exprs.slice(0, 50);
    }
  }

  updateTone(tone) {
    const tones = this.profile.toneHistory;
    tones.push({
      tone,
      timestamp: new Date().toISOString(),
    });
    if (tones.length > 100) {
      this.profile.toneHistory = tones.slice(-100);
    }
    const counts = {};
    for (const t of tones) {
      counts[t.tone] = (counts[t.tone] || 0) + 1;
    }
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    const dominant = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    if (dominant.length > 0) {
      this.profile.style.dominantTone = {
        value: dominant[0][0],
        confidence: Math.min(MAX_CONFIDENCE, dominant[0][1] / total),
        distribution: Object.fromEntries(
          dominant.map(([k, v]) => [k, v / total])
        ),
      };
    }
    this.save();
  }

  resetProfile() {
    this.profile = this._defaultProfile();
    this.save();
  }

  updateField(key, value) {
    const keys = key.split(".");
    let obj = this.profile;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!obj[keys[i]]) obj[keys[i]] = {};
      obj = obj[keys[i]];
    }
    obj[keys[keys.length - 1]] = value;
    this.save();
  }

  getStyleSummary() {
    const p = this.profile;
    const s = p.style;
    const summary = {};

    if (s.formality?.confidence >= MIN_CONFIDENCE) {
      summary.formality = { value: s.formality.value, confidence: s.formality.confidence };
    }
    if (s.tone?.confidence >= MIN_CONFIDENCE) {
      summary.tone = { value: s.tone.value, confidence: s.tone.confidence };
    }
    if (s.vocabularyLevel?.confidence >= MIN_CONFIDENCE) {
      summary.vocabularyLevel = { value: s.vocabularyLevel.value, confidence: s.vocabularyLevel.confidence };
    }
    if (s.sentenceStructure?.confidence >= MIN_CONFIDENCE) {
      summary.sentenceStructure = { value: s.sentenceStructure.value, confidence: s.sentenceStructure.confidence };
    }
    if (s.dominantTone?.confidence >= MIN_CONFIDENCE) {
      summary.dominantTone = s.dominantTone;
    }

    if (s.avgMessageLength !== undefined) {
      summary.avgMessageLength = Math.round(s.avgMessageLength);
    }
    if (s.avgWordsPerSentence !== undefined) {
      summary.avgWordsPerSentence = Math.round(s.avgWordsPerSentence * 10) / 10;
    }
    if (s.emojiFrequency !== undefined) {
      summary.emojiFrequency = Math.round(s.emojiFrequency * 100) / 100;
    }
    if (s.slangFrequency !== undefined) {
      summary.slangFrequency = Math.round(s.slangFrequency * 100) / 100;
    }

    if (p.greetings.length > 0) {
      summary.topGreeting = p.greetings.sort((a, b) => b.count - a.count)[0].text;
      summary.greetings = p.greetings.sort((a, b) => b.count - a.count).slice(0, 3).map((g) => g.text);
    }
    if (p.signoffs.length > 0) {
      summary.topSignoff = p.signoffs.sort((a, b) => b.count - a.count)[0].text;
      summary.signoffs = p.signoffs.sort((a, b) => b.count - a.count).slice(0, 3).map((s) => s.text);
    }
    if (p.expressions.length > 0) {
      summary.topExpressions = p.expressions.slice(0, 5).map((e) => e.text);
    }

    if (p.vocabulary.length > 10) {
      const top = p.vocabulary.slice(0, 10);
      summary.topWords = top.map((v) => ({ word: v.word, count: v.count }));
    }

    summary.totalMessages = p.totalMessages;
    summary.enabled = p.enabled !== false;
    summary.confidence = this._calculateOverallConfidence();

    return summary;
  }

  getStylePromptBlock() {
    if (!this.enabled) return "";
    const summary = this.getStyleSummary();
    if (!summary.formality && !summary.tone && !summary.topGreeting) return "";

    const lines = [];
    lines.push("<writing_style_profile>");

    if (summary.formality) {
      lines.push(`  <formality confidence="${Math.round(summary.formality.confidence * 100)}%">${summary.formality.value}</formality>`);
    }
    if (summary.tone) {
      lines.push(`  <tone confidence="${Math.round(summary.tone.confidence * 100)}%">${summary.tone.value}</tone>`);
    }
    if (summary.vocabularyLevel) {
      lines.push(`  <vocabulary_level confidence="${Math.round(summary.vocabularyLevel.confidence * 100)}%">${summary.vocabularyLevel.value}</vocabulary_level>`);
    }
    if (summary.sentenceStructure) {
      lines.push(`  <sentence_structure confidence="${Math.round(summary.sentenceStructure.confidence * 100)}%">${summary.sentenceStructure.value}</sentence_structure>`);
    }
    if (summary.avgMessageLength) {
      lines.push(`  <avg_message_length>${summary.avgMessageLength} caracteres</avg_message_length>`);
    }
    if (summary.avgWordsPerSentence) {
      lines.push(`  <avg_words_per_sentence>${summary.avgWordsPerSentence}</avg_words_per_sentence>`);
    }
    if (summary.emojiFrequency !== undefined && summary.emojiFrequency > 0) {
      lines.push(`  <emoji_frequency>${summary.emojiFrequency} por mensagem</emoji_frequency>`);
    }
    if (summary.topGreeting) {
      lines.push(`  <typical_greeting>${this._escapeXml(summary.topGreeting)}</typical_greeting>`);
    }
    if (summary.topSignoff) {
      lines.push(`  <typical_signoff>${this._escapeXml(summary.topSignoff)}</typical_signoff>`);
    }
    if (summary.topExpressions && summary.topExpressions.length > 0) {
      lines.push("  <recurring_expressions>");
      for (const expr of summary.topExpressions) {
        lines.push(`    <expression>${this._escapeXml(expr)}</expression>`);
      }
      lines.push("  </recurring_expressions>");
    }
    if (summary.topWords && summary.topWords.length > 0) {
      lines.push("  <characteristic_vocabulary>");
      for (const w of summary.topWords.slice(0, 5)) {
        lines.push(`    <word frequency="${w.count}">${this._escapeXml(w.word)}</word>`);
      }
      lines.push("  </characteristic_vocabulary>");
    }

    if (summary.confidence >= 0.3) {
      lines.push("  <style_established_confidence>" + Math.round(summary.confidence * 100) + "%</style_established_confidence>");
    }

    lines.push("</writing_style_profile>");
    return lines.join("\n");
  }

  _updateRunningAverage(obj, key, value) {
    const current = obj[key];
    if (current === undefined) {
      obj[key] = value;
      return;
    }
    const n = obj[key + "_samples"] || 1;
    const alpha = 1 / (n + 1);
    obj[key] = current * (1 - alpha) + value * alpha;
    obj[key + "_samples"] = n + 1;
  }

  _biasPreference(obj, key, value) {
    if (!obj[key]) {
      obj[key] = { value, confidence: 0.15 };
      return;
    }
    const entry = obj[key];
    if (entry.value === value) {
      entry.confidence = Math.min(MAX_CONFIDENCE, entry.confidence + CONFIDENCE_INCREMENT);
    } else {
      entry.confidence = Math.max(0.05, entry.confidence - CONFIDENCE_DECREMENT);
      if (entry.confidence < 0.2) {
        entry.value = value;
        entry.confidence = 0.2;
      }
    }
  }

  _calculateOverallConfidence() {
    const s = this.profile.style;
    const scores = [];
    for (const key of ["formality", "tone", "vocabularyLevel", "sentenceStructure"]) {
      if (s[key]?.confidence) scores.push(s[key].confidence);
    }
    if (this.profile.totalMessages < 5) return scores.reduce((a, b) => a + b, 0) / (scores.length || 1) * 0.3;
    if (scores.length === 0) return Math.min(0.5, this.profile.totalMessages / 50);
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    const msgFactor = Math.min(1, this.profile.totalMessages / 20);
    return Math.min(MAX_CONFIDENCE, avg * 0.7 + msgFactor * 0.3);
  }

  _decayOldEntries() {
    const now = Date.now();
    const decayMs = DECAY_THRESHOLD_DAYS * 24 * 60 * 60 * 1000;

    for (const list of ["greetings", "signoffs"]) {
      const arr = this.profile[list];
      if (!Array.isArray(arr)) continue;
      this.profile[list] = arr.filter((item) => {
        if (!item.lastSeen) return true;
        const age = now - new Date(item.lastSeen).getTime();
        return age < decayMs || item.count > 2;
      });
    }
  }

  _defaultProfile() {
    return {
      version: STYLE_VERSION,
      enabled: true,
      lastUpdated: new Date().toISOString(),
      totalMessages: 0,
      style: {
        formality: null,
        tone: null,
        vocabularyLevel: null,
        sentenceStructure: null,
        avgMessageLength: undefined,
        avgMessageLength_samples: 0,
        avgWordsPerSentence: undefined,
        avgWordsPerSentence_samples: 0,
        emojiFrequency: 0,
        emojiFrequency_samples: 0,
        slangFrequency: 0,
        slangFrequency_samples: 0,
        dominantTone: null,
      },
      vocabulary: [],
      expressions: [],
      greetings: [],
      signoffs: [],
      toneHistory: [],
      messages: [],
    };
  }

  _loadJSON(filePath, defaultVal) {
    try {
      if (existsSync(filePath)) {
        return JSON.parse(readFileSync(filePath, "utf-8"));
      }
    } catch {
      // corrupted or missing
    }
    return defaultVal;
  }

  _writeJSON(filePath, data) {
    try {
      writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
    } catch (err) {
      console.error(`[WritingStyleStore] Failed to write ${filePath}: ${err.message}`);
    }
  }

  _escapeXml(str) {
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
}
