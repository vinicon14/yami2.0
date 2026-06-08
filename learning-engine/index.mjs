import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { existsSync, writeFileSync } from "node:fs";
import { ProfileStore } from "./ProfileStore.mjs";
import { HabitTracker } from "./HabitTracker.mjs";
import { ContextAnalyzer } from "./ContextAnalyzer.mjs";
import { SuggestionEngine } from "./SuggestionEngine.mjs";
import { WritingStyleStore } from "./WritingStyleStore.mjs";
import { WritingStyleProfiler } from "./WritingStyleProfiler.mjs";
import { WritingStyleRenderer } from "./WritingStyleRenderer.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));

export class LearningEngine {
  constructor(options = {}) {
    this.baseDir = options.baseDir || __dirname;
    this.enabled = options.enabled !== false;
    this.profileStore = new ProfileStore(this.baseDir);
    this.habitTracker = null;
    this.contextAnalyzer = null;
    this.suggestionEngine = null;
    this.writingStyleStore = null;
    this.writingStyleProfiler = null;
    this.writingStyleRenderer = null;
    this.initialized = false;
  }

  initialize() {
    if (!this.enabled) return this;
    this.profileStore.load();
    this.habitTracker = new HabitTracker(this.profileStore);
    this.contextAnalyzer = new ContextAnalyzer(this.profileStore);
    this.suggestionEngine = new SuggestionEngine(
      this.profileStore,
      this.habitTracker,
      this.contextAnalyzer,
    );
    this.writingStyleStore = new WritingStyleStore(this.baseDir);
    this.writingStyleStore.load();
    this.writingStyleProfiler = new WritingStyleProfiler();
    this.writingStyleRenderer = new WritingStyleRenderer(this.writingStyleStore);
    this.initialized = true;
    return this;
  }

  recordInteraction(type, content, context = {}) {
    if (!this.initialized) return this;
    this.profileStore.recordInteraction(type, content, context);
    return this;
  }

  recordToolUse(toolName, args = {}) {
    if (!this.initialized) return this;
    this.profileStore.recordToolUse(toolName, args);
    return this;
  }

  recordWorkflow(name, steps) {
    if (!this.initialized) return this;
    this.profileStore.recordWorkflow(name, steps);
    return this;
  }

  recordMessage(text) {
    if (!this.initialized || !this.writingStyleStore || !this.writingStyleProfiler) return this;
    this.writingStyleStore.recordMessage(text);
    const metrics = this.writingStyleProfiler.analyzeMessage(text);
    this._applyWritingMetrics(metrics);
    return this;
  }

  _applyWritingMetrics(metrics) {
    if (!metrics) return;
    
    const styleMetrics = {};
    if (metrics.formalityLevel) {
      styleMetrics.formality = metrics.formalityLevel;
    }
    if (metrics.tone) {
      styleMetrics.tone = metrics.tone;
    }
    if (metrics.vocabularyLevel) {
      styleMetrics.vocabularyLevel = metrics.vocabularyLevel;
    }
    if (metrics.sentenceStructure) {
      styleMetrics.sentenceStructure = metrics.sentenceStructure;
    }
    if (metrics.avgWordsPerSentence !== undefined) {
      styleMetrics.avgWordsPerSentence = metrics.sentences > 0 
        ? metrics.wordCount / metrics.sentences 
        : metrics.wordCount;
    }
    if (metrics.charCount !== undefined) {
      styleMetrics.avgMessageLength = metrics.charCount;
    }
    if (metrics.emojiCount !== undefined && metrics.wordCount > 0) {
      styleMetrics.emojiFrequency = metrics.emojiCount / metrics.wordCount;
    }
    if (metrics.slangScore !== undefined) {
      styleMetrics.slangFrequency = metrics.slangScore;
    }

    this.writingStyleStore.updateMetrics(styleMetrics);

    if (metrics.vocabulary && Object.keys(metrics.vocabulary).length > 0) {
      this.writingStyleStore.updateVocabulary(metrics.vocabulary);
    }

    if (metrics.expressions && metrics.expressions.length > 0) {
      this.writingStyleStore.updateExpressions(metrics.expressions);
    }

    if (metrics.tone) {
      this.writingStyleStore.updateTone(metrics.tone);
    }

    if (metrics.greetings) {
      const greeting = metrics.greetings;
      if (greeting && !this.writingStyleStore.profile.greetings.find(g => g.text === greeting)) {
        this.writingStyleStore.profile.greetings.push({
          text: greeting,
          count: 1,
          firstSeen: new Date().toISOString(),
          lastSeen: new Date().toISOString()
        });
      } else if (greeting) {
        const found = this.writingStyleStore.profile.greetings.find(g => g.text === greeting);
        if (found) {
          found.count++;
          found.lastSeen = new Date().toISOString();
        }
      }
    }

    if (metrics.signoffs) {
      const signoff = metrics.signoffs;
      if (signoff && !this.writingStyleStore.profile.signoffs.find(s => s.text === signoff)) {
        this.writingStyleStore.profile.signoffs.push({
          text: signoff,
          count: 1,
          firstSeen: new Date().toISOString(),
          lastSeen: new Date().toISOString()
        });
      } else if (signoff) {
        const found = this.writingStyleStore.profile.signoffs.find(s => s.text === signoff);
        if (found) {
          found.count++;
          found.lastSeen = new Date().toISOString();
        }
      }
    }

    this.writingStyleStore.save();
  }

  getSuggestions(request = "") {
    if (!this.initialized || !this.suggestionEngine) return [];
    return this.suggestionEngine.generateSuggestions(request);
  }

  getContextSummary(request = "") {
    if (!this.initialized || !this.suggestionEngine) return {};
    return this.suggestionEngine.generateContextSummary(request);
  }

  getProfileSummary() {
    if (!this.initialized || !this.suggestionEngine) return [];
    return this.suggestionEngine.generateProfileSummary();
  }

  getProfile() {
    if (!this.initialized) return null;
    return this.profileStore.getProfile();
  }

  shouldConfirmAction(request) {
    if (!this.initialized || !this.contextAnalyzer) return null;
    return this.contextAnalyzer.shouldConfirmAction(request);
  }

  shouldSuggestDefaultFormat(request) {
    if (!this.initialized || !this.contextAnalyzer) return null;
    return this.contextAnalyzer.shouldSuggestDefaultFormat(request);
  }

  buildSystemPromptInjection() {
    if (!this.initialized) return "";
    const summary = this.habitTracker.getUsageSummary();
    const lines = [];

    lines.push("<learning_profile>");

    const prefs = summary.preferences;
    if (prefs && Object.keys(prefs).length > 0) {
      lines.push("  <preferences>");
      for (const [key, val] of Object.entries(prefs)) {
        lines.push(`    <${key} confidence="${Math.round(val.confidence * 100)}%">${val.value}</${key}>`);
      }
      lines.push("  </preferences>");
    }

    if (summary.currentRoutine) {
      lines.push(`  <current_routine period="${summary.currentRoutine.period}">`);
      for (const action of summary.currentRoutine.commonActions) {
        lines.push(`    <typical_action>${this._escapeXml(action)}</typical_action>`);
      }
      lines.push("  </current_routine>");
    }

    if (summary.frequentCommands && summary.frequentCommands.length > 0) {
      lines.push("  <frequent_commands>");
      for (const cmd of summary.frequentCommands.slice(0, 3)) {
        lines.push(`    <command frequency="${cmd.frequency}">${this._escapeXml(cmd.command)}</command>`);
      }
      lines.push("  </frequent_commands>");
    }

    if (summary.activeWorkflows && summary.activeWorkflows.length > 0) {
      lines.push("  <identified_workflows>");
      for (const wf of summary.activeWorkflows.slice(0, 3)) {
        lines.push(`    <workflow frequency="${wf.frequency}">${this._escapeXml(wf.name)}</workflow>`);
      }
      lines.push("  </identified_workflows>");
    }

    lines.push(`  <total_interactions>${summary.totalInteractions}</total_interactions>`);
    lines.push("</learning_profile>");

    const writingStyleBlock = this.buildWritingStylePromptInjection();
    if (writingStyleBlock) {
      lines.push("");
      lines.push(writingStyleBlock);
    }

    return lines.join("\n");
  }

  buildWritingStylePromptInjection() {
    if (!this.initialized || !this.writingStyleRenderer) return "";
    return this.writingStyleRenderer.buildPromptInjection();
  }

  getWritingProfile() {
    if (!this.initialized || !this.writingStyleStore) return null;
    return this.writingStyleStore.getProfile();
  }

  getWritingProfileSummary() {
    if (!this.initialized || !this.writingStyleStore) return null;
    return this.writingStyleStore.getStyleSummary();
  }

  getWritingStyleInstructions(purpose = "general") {
    if (!this.initialized || !this.writingStyleRenderer) return "";
    return this.writingStyleRenderer.buildStyleInstructions(purpose);
  }

  getWritingStyleAdaptationHints() {
    if (!this.initialized || !this.writingStyleRenderer) return [];
    return this.writingStyleRenderer.getAdaptationHints();
  }

  buildResponseWithWritingStyle(message, userInput = "") {
    if (!this.initialized || !this.writingStyleRenderer) return message;
    const style = this.writingStyleRenderer.buildResponseStyle(userInput);
    if (!style) return message;
    return this.writingStyleRenderer.formatMessageWithStyle(message, style);
  }

  resetWritingProfile() {
    if (!this.initialized || !this.writingStyleStore) return this;
    this.writingStyleStore.resetProfile();
    return this;
  }

  updateWritingProfileField(field, value) {
    if (!this.initialized || !this.writingStyleStore) return this;
    this.writingStyleStore.updateField(field, value);
    return this;
  }

  setWritingStyleEnabled(enabled) {
    if (!this.initialized || !this.writingStyleStore) return this;
    this.writingStyleStore.enabled = enabled;
    return this;
  }

  isWritingStyleEnabled() {
    if (!this.initialized || !this.writingStyleStore) return false;
    return this.writingStyleStore.enabled;
  }

  _escapeXml(str) {
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  static createAndInitialize(options = {}) {
    const engine = new LearningEngine(options);
    return engine.initialize();
  }
}

let _instance = null;

export function getInstance(options = {}) {
  if (!_instance) {
    _instance = LearningEngine.createAndInitialize(options);
  }
  return _instance;
}
