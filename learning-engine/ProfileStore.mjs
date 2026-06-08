import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const PROFILE_VERSION = 1;
const MAX_INTERACTIONS_HISTORY = 500;
const MAX_WORKFLOWS = 50;
const MAX_RECENT_CONTEXTS = 20;
const DECAY_THRESHOLD_DAYS = 30;

export class ProfileStore {
  constructor(baseDir) {
    this.baseDir = baseDir;
    this.profilePath = join(baseDir, "profile.json");
    this.interactionsPath = join(baseDir, "interactions.json");
    this.profile = null;
    this.interactions = [];
  }

  load() {
    if (!existsSync(this.baseDir)) {
      mkdirSync(this.baseDir, { recursive: true });
    }
    this.profile = this._loadJSON(this.profilePath, this._defaultProfile());
    this.interactions = this._loadJSON(this.interactionsPath, []);
    return this;
  }

  save() {
    this._writeJSON(this.profilePath, this.profile);
    this._writeJSON(this.interactionsPath, this.interactions);
  }

  getProfile() {
    return this.profile;
  }

  recordInteraction(type, content, context = {}) {
    const interaction = {
      timestamp: new Date().toISOString(),
      type,
      content: typeof content === "string" ? content.slice(0, 500) : content,
      context: {
        hour: new Date().getHours(),
        dayOfWeek: new Date().getDay(),
        ...context,
      },
    };
    this.interactions.push(interaction);
    this.profile.lastUpdated = interaction.timestamp;
    this.profile.totalInteractions++;

    if (this.interactions.length > MAX_INTERACTIONS_HISTORY) {
      this.interactions = this.interactions.slice(-MAX_INTERACTIONS_HISTORY);
    }

    this._updateHabits(type, content, interaction);
    this._updateRoutines(interaction);
    this._decayOldEntries();
    this.save();
  }

  recordToolUse(toolName, args = {}) {
    this.profile.habits.toolsUsed = this.profile.habits.toolsUsed || {};
    const key = toolName;
    const entry = this.profile.habits.toolsUsed[key] || { count: 0, firstUsed: null, lastUsed: null };
    entry.count++;
    entry.lastUsed = new Date().toISOString();
    if (!entry.firstUsed) entry.firstUsed = entry.lastUsed;
    this.profile.habits.toolsUsed[key] = entry;
    this.profile.lastUpdated = new Date().toISOString();
    this.save();
  }

  recordWorkflow(name, steps) {
    if (!Array.isArray(this.profile.workflows)) {
      this.profile.workflows = [];
    }
    const existing = this.profile.workflows.find((w) => w.name === name);
    if (existing) {
      existing.frequency++;
      existing.lastUsed = new Date().toISOString();
      existing.steps = steps;
    } else {
      this.profile.workflows.push({
        name,
        steps,
        frequency: 1,
        firstUsed: new Date().toISOString(),
        lastUsed: new Date().toISOString(),
      });
    }
    if (this.profile.workflows.length > MAX_WORKFLOWS) {
      this.profile.workflows.sort((a, b) => b.frequency - a.frequency);
      this.profile.workflows = this.profile.workflows.slice(0, MAX_WORKFLOWS);
    }
    this.save();
  }

  _updateHabits(type, content, interaction) {
    const hour = interaction.context.hour;
    const timeKey = `${String(hour).padStart(2, "0")}:00`;
    const habits = this.profile.habits;

    habits.activeHours[timeKey] = (habits.activeHours[timeKey] || 0) + 1;

    if (type === "command" || type === "request") {
      const cmdKey = typeof content === "string" ? content.split(" ").slice(0, 3).join(" ") : content;
      this._incrementList(habits.frequentCommands, cmdKey);
    }

    if (type === "app") {
      this._incrementList(habits.frequentApps, content);
    }

    if (type === "site") {
      this._incrementList(habits.frequentSites, content);
    }

    if (type === "communication") {
      this._incrementList(habits.communicationMethods, content);
    }

    this._updatePreferences(interaction);
  }

  _updatePreferences(interaction) {
    const prefs = this.profile.preferences;
    const content = typeof interaction.content === "string" ? interaction.content.toLowerCase() : "";

    if (/pdf|relatório|relatorio|report/i.test(content)) {
      this._biasPreference(prefs, "outputFormat", "pdf");
    } else if (/apresenta[cç][aã]o|slides|presentation/i.test(content)) {
      this._biasPreference(prefs, "outputFormat", "presentation");
    } else if (/planilha|spreadsheet|csv|excel/i.test(content)) {
      this._biasPreference(prefs, "outputFormat", "spreadsheet");
    }

    if (/resumid[oa]|curt[oa]|rápid[oa]|rapid[oa]|concis[eo]/i.test(content)) {
      this._biasPreference(prefs, "verbosity", "concise");
    } else if (/detalhad[oa]|complet[oa]|extens[oa]|long[oa]/i.test(content)) {
      this._biasPreference(prefs, "verbosity", "detailed");
    }

    if (/formal|senhor|senhora|prezad[oa]/i.test(content)) {
      this._biasPreference(prefs, "formality", "formal");
    } else if (/você|vc|tu|hey|oi|e aí/i.test(content)) {
      this._biasPreference(prefs, "formality", "casual");
    }

    const lang = this._detectLanguage(content);
    if (lang) {
      this._biasPreference(prefs, "language", lang);
    }
  }

  _updateRoutines(interaction) {
    const hour = interaction.context.hour;
    const routines = this.profile.routines;

    let period;
    if (hour >= 6 && hour < 12) period = "morning";
    else if (hour >= 12 && hour < 18) period = "afternoon";
    else if (hour >= 18 && hour < 24) period = "evening";
    else period = "night";

    if (routines[period]) {
      routines[period].frequency++;
      routines[period].lastActive = interaction.timestamp;
      const action = typeof interaction.content === "string" ? interaction.content.slice(0, 80) : "";
      if (action && !routines[period].commonActions.includes(action)) {
        routines[period].commonActions.unshift(action);
        if (routines[period].commonActions.length > 10) {
          routines[period].commonActions.length = 10;
        }
      }
    }
  }

  _incrementList(list, key) {
    if (!Array.isArray(list)) return;
    const existing = list.find((item) => item.name === key);
    if (existing) {
      existing.count++;
      existing.lastUsed = new Date().toISOString();
    } else {
      list.push({ name: key, count: 1, firstSeen: new Date().toISOString(), lastUsed: new Date().toISOString() });
    }
    list.sort((a, b) => b.count - a.count);
    if (list.length > 30) list.length = 30;
  }

  _biasPreference(prefs, key, value) {
    if (!prefs[key]) {
      prefs[key] = { value, confidence: 0.1 };
      return;
    }
    const entry = prefs[key];
    if (entry.value === value) {
      entry.confidence = Math.min(1, entry.confidence + 0.05);
    } else {
      entry.confidence = Math.max(0, entry.confidence - 0.03);
      if (entry.confidence < 0.2) {
        const otherPrefs = Object.entries(prefs)
          .filter(([k, v]) => k !== key && v.confidence > 0.3);
        if (otherPrefs.length > 0) {
          entry.value = value;
          entry.confidence = 0.15;
        }
      }
    }
  }

  _detectLanguage(text) {
    const ptPatterns = /[áàãâéêíóôõúç]/i;
    const enPatterns = /[áàãâéêíóôõúç]/i;
    if (ptPatterns.test(text)) return "pt-BR";
    if (/the|and|is|are|this|that|with|from/i.test(text)) return "en";
    return null;
  }

  _decayOldEntries() {
    const now = Date.now();
    const decayMs = DECAY_THRESHOLD_DAYS * 24 * 60 * 60 * 1000;

    for (const list of ["frequentCommands", "frequentApps", "frequentSites", "communicationMethods"]) {
      const arr = this.profile.habits[list];
      if (!Array.isArray(arr)) continue;
      this.profile.habits[list] = arr.filter((item) => {
        if (!item.lastUsed) return true;
        const age = now - new Date(item.lastUsed).getTime();
        return age < decayMs || item.count > 2;
      });
    }
  }

  _defaultProfile() {
    return {
      version: PROFILE_VERSION,
      userId: "default",
      lastUpdated: new Date().toISOString(),
      totalInteractions: 0,
      preferences: {},
      habits: {
        activeHours: {},
        frequentCommands: [],
        frequentApps: [],
        frequentSites: [],
        communicationMethods: [],
        toolsUsed: {},
      },
      routines: {
        morning: { timeRange: "06:00-12:00", commonActions: [], frequency: 0 },
        afternoon: { timeRange: "12:00-18:00", commonActions: [], frequency: 0 },
        evening: { timeRange: "18:00-00:00", commonActions: [], frequency: 0 },
        night: { timeRange: "00:00-06:00", commonActions: [], frequency: 0 },
      },
      workflows: [],
    };
  }

  _loadJSON(filePath, defaultVal) {
    try {
      if (existsSync(filePath)) {
        return JSON.parse(readFileSync(filePath, "utf-8"));
      }
    } catch {
      // corrupted file, reset
    }
    return defaultVal;
  }

  _writeJSON(filePath, data) {
    try {
      writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
    } catch (err) {
      console.error(`[LearningEngine] Failed to write ${filePath}: ${err.message}`);
    }
  }
}
