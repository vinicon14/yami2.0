/**
 * YAMI Database Integration for Auto-Panel (server.js)
 * 
 * This module provides integration functions to replace file-based state management
 * in the auto-panel with database operations.
 * 
 * Usage in server.js:
 * 
 *   import { initPanelDatabase } from './database/integration-auto-panel.mjs';
 *   
 *   // At startup:
 *   const { db, syncEngine, syncAPI } = await initPanelDatabase({
 *     syncApiPort: 18900,
 *     peerUrl: process.env.YAMI_SYNC_PEER_URL,
 *     autoSync: true
 *   });
 *   
 *   // Replace readState() calls:
 *   const state = getPanelState(db);
 *   
 *   // Replace saveState() calls:
 *   savePanelState(db, nextState);
 *   
 *   // Replace readConfig() calls (from yami.json):
 *   const config = getYamiConfig(db);
 *   
 *   // Replace writeJsonFile(CONFIG_PATH, cfg) calls:
 *   setYamiConfig(db, cfg);
 */

import { join } from "node:path";
import { initializeDatabase } from "./index.mjs";

const YAMI_HOME = process.env.YAMI_HOME || join(process.env.USERPROFILE || ".", ".yami");

export async function initPanelDatabase(options = {}) {
  const result = await initializeDatabase({
    dbPath: options.dbPath || join(YAMI_HOME, "database", "data", "yami.db"),
    deviceId: options.deviceId || null,
    peerUrl: options.peerUrl || null,
    syncKey: options.syncKey || null,
    syncIntervalMs: options.syncIntervalMs || 30000,
    autoSync: options.autoSync !== false,
    syncApiPort: options.syncApiPort || 18900,
    syncApiHost: options.syncApiHost || "127.0.0.1",
    startSyncApi: options.startSyncApi !== false,
    onSyncComplete: options.onSyncComplete || null,
    onConflict: options.onConflict || null,
    onError: options.onError || null
  });

  return result;
}

// --- State Management (replaces readState/saveState) ---

export function getPanelState(db) {
  const enabled = db.getPreference("panel", "enabled");
  const blockedContacts = db.getPreference("panel", "blockedContacts");
  const voice = db.getPreference("panel", "voice");
  const updatedAt = db.getPreference("panel", "updatedAt");

  return {
    enabled: enabled !== false && enabled !== undefined ? true : false,
    blockedContacts: Array.isArray(blockedContacts) ? blockedContacts : [],
    voice: voice && typeof voice === "object" ? voice : {
      backend: "powershell",
      voice: "Microsoft Maria Desktop",
      model: "",
      rate: 0,
      volume: 100,
      referenceUrl: "https://github.com/isair/jarvis",
      referenceNote: "Referencia visual/conceitual para assistente local. A voz ativa continua sendo a voz Windows padrao.",
      nativeSpeak: false
    },
    updatedAt: updatedAt || new Date().toISOString()
  };
}

export function savePanelState(db, next) {
  const now = new Date().toISOString();
  db.setPreference("panel", "enabled", next.enabled !== false, "auto-panel");
  db.setPreference("panel", "blockedContacts", Array.isArray(next.blockedContacts) ? next.blockedContacts : [], "auto-panel");
  db.setPreference("panel", "voice", next.voice && typeof next.voice === "object" ? next.voice : {}, "auto-panel");
  db.setPreference("panel", "updatedAt", now, "auto-panel");

  return getPanelState(db);
}

// --- Config Management (replaces readConfig/writeJsonFile for yami.json) ---

export function getYamiConfig(db) {
  const full = db.getSetting("yami_config", "full");
  if (full && typeof full === "object") {
    return full;
  }

  const config = {
    gateway: db.getSetting("yami_config", "gateway") || {},
    skills: db.getSetting("yami_config", "skills") || {},
    plugins: db.getSetting("yami_config", "plugins") || {},
    channels: db.getSetting("yami_config", "channels") || {},
    messages: db.getSetting("yami_config", "messages") || {},
    session: db.getSetting("yami_config", "session") || {},
    talk: db.getSetting("yami_config", "talk") || {},
    agents: db.getSetting("yami_config", "agents") || {}
  };

  return config;
}

export function setYamiConfig(db, config) {
  const now = new Date().toISOString();
  db.setSetting("yami_config", "full", config, "auto-panel");
  db.setSetting("yami_config", "gateway", config.gateway || {}, "auto-panel");
  db.setSetting("yami_config", "skills", config.skills || {}, "auto-panel");
  db.setSetting("yami_config", "plugins", config.plugins || {}, "auto-panel");
  db.setSetting("yami_config", "channels", config.channels || {}, "auto-panel");
  db.setSetting("yami_config", "messages", config.messages || {}, "auto-panel");
  db.setSetting("yami_config", "session", config.session || {}, "auto-panel");
  db.setSetting("yami_config", "talk", config.talk || {}, "auto-panel");
  db.setSetting("yami_config", "agents", config.agents || {}, "auto-panel");

  return config;
}

// --- Device Management ---

export function getPairedDevices(db) {
  return db.getAllDevices().map(d => ({
    deviceId: d.device_id,
    displayName: d.display_name,
    platform: d.platform,
    clientId: d.client_id,
    clientMode: d.client_mode,
    roles: d.roles,
    scopes: d.scopes,
    publicKey: d.public_key,
    tokens: d.tokens,
    lastSeenAt: d.last_seen_at,
    lastSeenReason: d.last_seen_reason,
    approvedAt: d.approved_at
  }));
}

export function addPairedDevice(db, device) {
  db.addDevice({
    deviceId: device.deviceId,
    displayName: device.displayName,
    platform: device.platform,
    clientId: device.clientId,
    clientMode: device.clientMode,
    roles: device.roles,
    scopes: device.scopes,
    publicKey: device.publicKey,
    tokens: device.tokens,
    lastSeenAt: device.lastSeenAt,
    lastSeenReason: device.lastSeenReason,
    approvedAt: device.approvedAt
  });
}

// --- WhatsApp Account Management ---

export function getWhatsAppAccount(db, accountName = "default") {
  const settings = db.getSetting("channels", "whatsapp");
  if (settings && settings.accounts && settings.accounts[accountName]) {
    return settings.accounts[accountName];
  }
  return null;
}

export function setWhatsAppAccount(db, account, accountName = "default") {
  const settings = db.getSetting("channels", "whatsapp") || { accounts: {} };
  if (!settings.accounts) settings.accounts = {};
  settings.accounts[accountName] = account;
  db.setSetting("channels", "whatsapp", settings, "auto-panel");
}

// --- TTS Settings Management ---

export function getTtsSettings(db) {
  const settings = db.getSetting("tts", "settings");
  if (settings && typeof settings === "object") {
    return settings;
  }
  return {
    provider: "tts-local-cli",
    auto: "off",
    enabled: true
  };
}

export function setTtsSettings(db, settings) {
  db.setSetting("tts", "settings", settings, "auto-panel");
  return getTtsSettings(db);
}

// --- Conversation Management ---

export function addChatMessage(db, sessionId, message) {
  return db.addMessage({
    sessionId,
    role: message.role,
    content: message.content,
    channel: message.channel || null,
    contactId: message.contactId || null,
    metadata: message.metadata || null,
    tokensUsed: message.tokensUsed || null,
    model: message.model || null
  });
}

export function getChatHistory(db, sessionId, limit = 50) {
  return db.getConversation(sessionId, limit);
}

export function getChatByContact(db, contactId, limit = 50) {
  return db.getContactConversation(contactId, limit);
}

export function clearChat(db, sessionId) {
  return db.deleteConversation(sessionId);
}

// --- Scheduled Events / Calendar ---

export function addScheduledEvent(db, event) {
  return db.addEvent({
    title: event.title,
    description: event.description,
    eventDate: event.eventDate,
    startTime: event.startTime,
    endTime: event.endTime,
    allDay: event.allDay,
    recurrence: event.recurrence,
    source: event.source,
    reminders: event.reminders,
    status: event.status
  });
}

export function updateScheduledEvent(db, eventId, updates) {
  return db.updateEvent(eventId, updates);
}

export function getScheduledEvents(db, fromDate, toDate) {
  return db.getEvents(fromDate, toDate);
}

export function getUpcomingEvents(db, limit = 10) {
  return db.getUpcomingEvents(limit);
}

// --- Automation History ---

export function recordAutomation(db, automation) {
  return db.addAutomationEntry({
    automation: automation.name,
    trigger: automation.trigger,
    status: automation.status || "completed",
    input: automation.input,
    output: automation.output,
    startedAt: automation.startedAt,
    finishedAt: automation.finishedAt
  });
}

export function getAutomationHistory(db, limit = 50, offset = 0) {
  return db.getAutomationHistory(limit, offset);
}

// --- Persona State Management (for YAMI character) ---

export function getPersonaState(db, stateKey) {
  return db.getPersonaState(stateKey);
}

export function setPersonaState(db, stateKey, value) {
  return db.setPersonaState(stateKey, value);
}

export function getAllPersonaStates(db) {
  return db.getAllPersonaStates();
}

// --- Connected Accounts (Google, Microsoft, etc.) ---

export function getConnectedAccounts(db, enabledOnly = false) {
  return db.getAccounts(enabledOnly === true ? true : null);
}

export function addConnectedAccount(db, account) {
  db.addAccount(account);
}

// --- Export/Snapshot for debugging ---

export function exportPanelSnapshot(db) {
  return {
    state: getPanelState(db),
    config: getYamiConfig(db),
    devices: getPairedDevices(db),
    ttsSettings: getTtsSettings(db),
    accounts: getConnectedAccounts(db),
    personaStates: getAllPersonaStates(db),
    dbSnapshot: db.exportSnapshot()
  };
}

export function getPanelDiagnostics(db) {
  const devices = db.getAllDevices();
  const unsynced = db.getUnsyncedChanges(10);
  const conflicts = db.getPendingConflicts();

  return {
    databaseReady: db.ready,
    instanceId: db.getInstanceId(),
    schemaVersion: db.getSchemaVersion(),
    pairedDevices: devices.length,
    currentDevice: db.getCurrentDevice(),
    unsyncedChanges: unsynced.length,
    pendingConflicts: conflicts.length,
    personaStateCount: db.getAllPersonaStates().length,
    connectedAccountCount: db.getAccounts().length
  };
}
