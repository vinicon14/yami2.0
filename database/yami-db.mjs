import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync, copyFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const YAMI_HOME = process.env.YAMI_HOME || join(process.env.USERPROFILE || ".", ".yami");
const DB_DIR = join(YAMI_HOME, "database", "data");
const DB_PATH = join(DB_DIR, "yami.db");
const MIGRATIONS_DIR = join(__dirname, "migrations");

let initSqlJs;
try {
  initSqlJs = (await import("sql.js")).default;
} catch {
  throw new Error("sql.js is required. Run: npm install sql.js in " + join(YAMI_HOME, "database"));
}

function _uuid() {
  return randomUUID();
}

export class YamiDB {
  constructor(dbPath = DB_PATH) {
    this.dbPath = dbPath;
    this.db = null;
    this.instanceId = null;
    this.ready = false;
    this._readyPromise = null;
  }

  async init() {
    if (this.ready) return;
    if (this._readyPromise) return this._readyPromise;

    this._readyPromise = this._doInit();
    return this._readyPromise;
  }

  async _doInit() {
    const SQL = await initSqlJs();
    if (this.dbPath !== ":memory:") {
      mkdirSync(dirname(this.dbPath), { recursive: true });
    }

    if (this.dbPath !== ":memory:" && existsSync(this.dbPath)) {
      const buffer = readFileSync(this.dbPath);
      this.db = new SQL.Database(buffer);
    } else {
      this.db = new SQL.Database();
    }

    this.db.run("PRAGMA journal_mode = WAL");
    this.db.run("PRAGMA foreign_keys = ON");
    this.db.run("PRAGMA busy_timeout = 5000");

    this._ensureMeta();
    this.ready = true;
    return this;
  }

  save() {
    if (this.dbPath === ":memory:") return;
    const data = this.db.export();
    const buffer = Buffer.from(data);
    mkdirSync(dirname(this.dbPath), { recursive: true });
    writeFileSync(this.dbPath, buffer);
  }

  _checkReady() {
    if (!this.ready) throw new Error("YamiDB not initialized. Call await db.init() first.");
  }

  _ensureMeta() {
    this._ensureTable("meta", { key: "TEXT PRIMARY KEY", value: "TEXT NOT NULL" });
    const rows = this._queryAll("SELECT value FROM meta WHERE key = 'db_instance_id'");
    if (rows.length === 0) {
      this.db.run("INSERT INTO meta (key, value) VALUES ('db_instance_id', ?)", [_uuid().replace(/-/g, "")]);
      this.db.run("INSERT OR IGNORE INTO meta (key, value) VALUES ('schema_version', '1')");
      this.save();
    }
    const row = this._queryOne("SELECT value FROM meta WHERE key = 'db_instance_id'");
    this.instanceId = row ? row.value : null;
  }

  _ensureTable(name, columns, constraints = "") {
    const cols = Object.entries(columns).map(([k, v]) => `"${k}" ${v}`).join(", ");
    this.db.run(`CREATE TABLE IF NOT EXISTS "${name}" (${cols}${constraints ? ", " + constraints : ""})`);
  }

  _ensureIndex(name, table, columns, unique = false) {
    const u = unique ? "UNIQUE " : "";
    const cols = Array.isArray(columns) ? columns.join(", ") : columns;
    this.db.run(`CREATE ${u}INDEX IF NOT EXISTS "${name}" ON "${table}" (${cols})`);
  }

  _queryOne(sql, params = []) {
    const stmt = this.db.prepare(sql);
    if (params.length > 0) stmt.bind(params);
    const result = stmt.step() ? stmt.getAsObject() : null;
    stmt.free();
    return result;
  }

  _queryAll(sql, params = []) {
    const stmt = this.db.prepare(sql);
    if (params.length > 0) stmt.bind(params);
    const results = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
  }

  _run(sql, params = []) {
    this.db.run(sql, params);
  }

  runSchema(sql) {
    this.db.run(sql);
    this.save();
  }

  getInstanceId() {
    return this.instanceId;
  }

  getSchemaVersion() {
    const row = this._queryOne("SELECT value FROM meta WHERE key = 'schema_version'");
    return row ? parseInt(row.value, 10) : 0;
  }

  setSchemaVersion(version) {
    this._run("INSERT OR REPLACE INTO meta (key, value) VALUES ('schema_version', ?)", [String(version)]);
    this.save();
  }

  close() {
    if (this.db) {
      this.save();
      this.db.close();
      this.db = null;
      this.ready = false;
    }
  }

  backup(backupPath) {
    const data = this.db.export();
    mkdirSync(dirname(backupPath), { recursive: true });
    writeFileSync(backupPath, Buffer.from(data));
  }

  // --- User Settings ---
  getSetting(category, key) {
    const row = this._queryOne("SELECT value_json FROM user_settings WHERE category = ? AND key = ?", [category, key]);
    return row ? JSON.parse(row.value_json) : undefined;
  }

  setSetting(category, key, value, updatedBy = null) {
    const valueJson = JSON.stringify(value);
    const now = new Date().toISOString();
    const existing = this._queryOne("SELECT id, value_json FROM user_settings WHERE category = ? AND key = ?", [category, key]);
    const beforeJson = existing ? existing.value_json : null;
    if (existing) {
      this._run("UPDATE user_settings SET value_json = ?, updated_at = ?, updated_by = ? WHERE category = ? AND key = ?",
        [valueJson, now, updatedBy, category, key]);
    } else {
      this._run("INSERT INTO user_settings (id, category, key, value_json, updated_at, updated_by) VALUES (?, ?, ?, ?, ?, ?)",
        [_uuid(), category, key, valueJson, now, updatedBy]);
    }
    this._logChange("user_settings", existing ? existing.id : _uuid(), existing ? "update" : "insert", beforeJson, valueJson, updatedBy);
    this.save();
  }

  deleteSetting(category, key, updatedBy = null) {
    const existing = this._queryOne("SELECT id, value_json FROM user_settings WHERE category = ? AND key = ?", [category, key]);
    if (!existing) return false;
    this._logChange("user_settings", existing.id, "delete", existing.value_json, null, updatedBy);
    this._run("DELETE FROM user_settings WHERE category = ? AND key = ?", [category, key]);
    this.save();
    return true;
  }

  getAllSettings(category) {
    const rows = category
      ? this._queryAll("SELECT category, key, value_json, updated_at FROM user_settings WHERE category = ? ORDER BY key", [category])
      : this._queryAll("SELECT category, key, value_json, updated_at FROM user_settings ORDER BY category, key");
    return rows.map(r => ({ ...r, value: JSON.parse(r.value_json) }));
  }

  // --- Preferences ---
  getPreference(namespace, key) {
    const row = this._queryOne("SELECT value_json FROM user_preferences WHERE namespace = ? AND key = ?", [namespace, key]);
    return row ? JSON.parse(row.value_json) : undefined;
  }

  setPreference(namespace, key, value, updatedBy = null) {
    const valueJson = JSON.stringify(value);
    const now = new Date().toISOString();
    const existing = this._queryOne("SELECT id, value_json FROM user_preferences WHERE namespace = ? AND key = ?", [namespace, key]);
    const beforeJson = existing ? existing.value_json : null;
    if (existing) {
      this._run("UPDATE user_preferences SET value_json = ?, updated_at = ?, updated_by = ? WHERE namespace = ? AND key = ?",
        [valueJson, now, updatedBy, namespace, key]);
    } else {
      this._run("INSERT INTO user_preferences (id, namespace, key, value_json, updated_at, updated_by) VALUES (?, ?, ?, ?, ?, ?)",
        [_uuid(), namespace, key, valueJson, now, updatedBy]);
    }
    this._logChange("user_preferences", existing ? existing.id : _uuid(), existing ? "update" : "insert", beforeJson, valueJson, updatedBy);
    this.save();
  }

  getAllPreferences(namespace) {
    const rows = namespace
      ? this._queryAll("SELECT namespace, key, value_json, updated_at FROM user_preferences WHERE namespace = ? ORDER BY key", [namespace])
      : this._queryAll("SELECT namespace, key, value_json, updated_at FROM user_preferences ORDER BY namespace, key");
    return rows.map(r => ({ ...r, value: JSON.parse(r.value_json) }));
  }

  // --- Communication Profile ---
  getCommunicationProfile(channel) {
    const row = this._queryOne("SELECT profile, updated_at FROM communication_profile WHERE channel = ?", [channel]);
    return row ? { ...JSON.parse(row.profile), channel, updatedAt: row.updated_at } : null;
  }

  setCommunicationProfile(channel, profile, updatedBy = null) {
    const profileJson = JSON.stringify(profile);
    const now = new Date().toISOString();
    const existing = this._queryOne("SELECT id, profile FROM communication_profile WHERE channel = ?", [channel]);
    if (existing) {
      this._run("UPDATE communication_profile SET profile = ?, updated_at = ? WHERE channel = ?", [profileJson, now, channel]);
    } else {
      this._run("INSERT INTO communication_profile (id, channel, profile, updated_at) VALUES (?, ?, ?, ?)",
        [_uuid(), channel, profileJson, now]);
    }
    this._logChange("communication_profile", existing ? existing.id : _uuid(), existing ? "update" : "insert",
      existing ? existing.profile : null, profileJson, updatedBy);
    this.save();
  }

  // --- Automation History ---
  addAutomationEntry(entry) {
    const id = entry.id || _uuid();
    const now = new Date().toISOString();
    this._run(
      "INSERT INTO automation_history (id, automation, trigger, status, input_json, output_json, started_at, finished_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [id, entry.automation, entry.trigger || null, entry.status || "completed",
       entry.input ? JSON.stringify(entry.input) : null,
       entry.output ? JSON.stringify(entry.output) : null,
       entry.startedAt || now, entry.finishedAt || now, now]
    );
    this.save();
    return id;
  }

  getAutomationHistory(limit = 50, offset = 0) {
    return this._queryAll("SELECT * FROM automation_history ORDER BY created_at DESC LIMIT ? OFFSET ?", [limit, offset]);
  }

  // --- Schedule Events ---
  addEvent(event) {
    const id = event.id || _uuid();
    const now = new Date().toISOString();
    this._run(
      "INSERT INTO schedule_events (id, title, description, event_date, start_time, end_time, all_day, recurrence, source, reminders, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [id, event.title, event.description || null, event.eventDate, event.startTime || null, event.endTime || null,
       event.allDay ? 1 : 0, event.recurrence || null, event.source || null,
       JSON.stringify(event.reminders || []), event.status || "pending", now, now]
    );
    this.save();
    return id;
  }

  updateEvent(id, updates) {
    const fields = [];
    const values = [];
    for (const [k, v] of Object.entries(updates)) {
      const col = k.replace(/([A-Z])/g, "_$1").toLowerCase();
      fields.push(`"${col}" = ?`);
      values.push(typeof v === "object" && v !== null ? JSON.stringify(v) : v);
    }
    if (fields.length === 0) return false;
    fields.push('"updated_at" = ?');
    values.push(new Date().toISOString());
    values.push(id);
    this._run(`UPDATE schedule_events SET ${fields.join(", ")} WHERE id = ?`, values);
    this.save();
    return true;
  }

  deleteEvent(id) {
    this._run("DELETE FROM schedule_events WHERE id = ?", [id]);
    this.save();
    return true;
  }

  getEvents(fromDate, toDate) {
    if (fromDate && toDate) {
      return this._queryAll("SELECT * FROM schedule_events WHERE event_date >= ? AND event_date <= ? ORDER BY event_date, start_time", [fromDate, toDate]);
    }
    return this._queryAll("SELECT * FROM schedule_events ORDER BY event_date, start_time");
  }

  getUpcomingEvents(limit = 10) {
    const today = new Date().toISOString().split("T")[0];
    return this._queryAll("SELECT * FROM schedule_events WHERE event_date >= ? AND status != 'cancelled' ORDER BY event_date, start_time LIMIT ?", [today, limit]);
  }

  // --- Connected Accounts ---
  addAccount(account) {
    const now = new Date().toISOString();
    this._run(
      "INSERT OR REPLACE INTO connected_accounts (id, provider, account_id, label, auth_json, scopes, enabled, expires_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [account.id || _uuid(), account.provider, account.accountId, account.label || null,
       account.auth ? JSON.stringify(account.auth) : null,
       JSON.stringify(account.scopes || []), account.enabled !== false ? 1 : 0,
       account.expiresAt || null, now, now]
    );
    this.save();
  }

  getAccounts(enabled = null) {
    if (enabled !== null) {
      return this._queryAll("SELECT * FROM connected_accounts WHERE enabled = ? ORDER BY provider", [enabled ? 1 : 0]);
    }
    return this._queryAll("SELECT * FROM connected_accounts ORDER BY provider");
  }

  deleteAccount(id) {
    this._run("DELETE FROM connected_accounts WHERE id = ?", [id]);
    this.save();
  }

  // --- Authorized Integrations ---
  addIntegration(integration) {
    const now = new Date().toISOString();
    this._run(
      "INSERT OR REPLACE INTO authorized_integrations (id, integration, provider_id, access_level, config_json, enabled, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [integration.id || _uuid(), integration.integration, integration.providerId || null,
       integration.accessLevel || "read",
       integration.config ? JSON.stringify(integration.config) : null,
       integration.enabled !== false ? 1 : 0, now]
    );
    this.save();
  }

  getIntegrations(enabled = null) {
    if (enabled !== null) {
      return this._queryAll("SELECT * FROM authorized_integrations WHERE enabled = ? ORDER BY integration", [enabled ? 1 : 0]);
    }
    return this._queryAll("SELECT * FROM authorized_integrations ORDER BY integration");
  }

  // --- Devices ---
  addDevice(device) {
    const now = new Date().toISOString();
    this._run(
      "INSERT OR REPLACE INTO devices (device_id, display_name, platform, client_id, client_mode, roles, scopes, public_key, tokens_json, last_seen_at, last_seen_reason, is_current, approved_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [device.deviceId, device.displayName || null, device.platform || null, device.clientId || null,
       device.clientMode || null, JSON.stringify(device.roles || []), JSON.stringify(device.scopes || []),
       device.publicKey || null, device.tokens ? JSON.stringify(device.tokens) : null,
       device.lastSeenAt || now, device.lastSeenReason || null, device.isCurrent ? 1 : 0,
       device.approvedAt || null, now, now]
    );
    this.save();
  }

  getDevice(deviceId) {
    const row = this._queryOne("SELECT * FROM devices WHERE device_id = ?", [deviceId]);
    return row ? this._parseDevice(row) : null;
  }

  getAllDevices() {
    return this._queryAll("SELECT * FROM devices ORDER BY last_seen_at DESC").map(r => this._parseDevice(r));
  }

  updateDeviceSeen(deviceId, reason = null) {
    const now = new Date().toISOString();
    this._run("UPDATE devices SET last_seen_at = ?, last_seen_reason = ?, updated_at = ? WHERE device_id = ?",
      [now, reason, now, deviceId]);
    this.save();
  }

  deleteDevice(deviceId) {
    this._run("DELETE FROM devices WHERE device_id = ?", [deviceId]);
    this.save();
  }

  setCurrentDevice(deviceId) {
    const now = new Date().toISOString();
    this._run("UPDATE devices SET is_current = 0");
    this._run("UPDATE devices SET is_current = 1, updated_at = ? WHERE device_id = ?", [now, deviceId]);
    this.save();
  }

  getCurrentDevice() {
    const row = this._queryOne("SELECT * FROM devices WHERE is_current = 1");
    return row ? this._parseDevice(row) : null;
  }

  _parseDevice(row) {
    return {
      ...row,
      roles: JSON.parse(row.roles || "[]"),
      scopes: JSON.parse(row.scopes || "[]"),
      tokens: row.tokens_json ? JSON.parse(row.tokens_json) : null,
      isCurrent: Boolean(row.is_current)
    };
  }

  // --- Bootstrap Tokens ---
  addBootstrapToken(token, profile) {
    this._run("INSERT INTO pending_bootstrap_tokens (token, profile_json, issued_at) VALUES (?, ?, ?)",
      [token, JSON.stringify(profile), new Date().toISOString()]);
    this.save();
  }

  redeemBootstrapToken(token) {
    const row = this._queryOne("SELECT * FROM pending_bootstrap_tokens WHERE token = ? AND redeemed = 0", [token]);
    if (!row) return null;
    this._run("UPDATE pending_bootstrap_tokens SET redeemed = 1, redeemed_at = ? WHERE token = ?",
      [new Date().toISOString(), token]);
    this.save();
    return { token, profile: JSON.parse(row.profile_json) };
  }

  // --- Pairing Requests ---
  addPairingRequest(request) {
    this._run(
      "INSERT INTO pending_pairing_requests (request_id, device_id, display_name, platform, roles, scopes, public_key, is_repair, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [request.requestId, request.deviceId, request.displayName || null, request.platform || null,
       JSON.stringify(request.roles || []), JSON.stringify(request.scopes || []),
       request.publicKey || null, request.isRepair ? 1 : 0, new Date().toISOString()]
    );
    this.save();
  }

  getPendingPairingRequests() {
    return this._queryAll("SELECT * FROM pending_pairing_requests ORDER BY created_at DESC");
  }

  removePairingRequest(requestId) {
    this._run("DELETE FROM pending_pairing_requests WHERE request_id = ?", [requestId]);
    this.save();
  }

  // --- Conversation History ---
  addMessage(msg) {
    const id = msg.id || _uuid();
    const now = new Date().toISOString();
    this._run(
      "INSERT INTO conversation_history (id, session_id, channel, contact_id, role, content, metadata_json, tokens_used, model, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [id, msg.sessionId, msg.channel || null, msg.contactId || null, msg.role, msg.content,
       msg.metadata ? JSON.stringify(msg.metadata) : null, msg.tokensUsed || null, msg.model || null, msg.createdAt || now]
    );
    this.save();
    return id;
  }

  getConversation(sessionId, limit = 50, before = null) {
    if (before) {
      const rows = this._queryAll("SELECT * FROM conversation_history WHERE session_id = ? AND created_at < ? ORDER BY created_at DESC LIMIT ?", [sessionId, before, limit]);
      return rows.reverse();
    }
    return this._queryAll("SELECT * FROM conversation_history WHERE session_id = ? ORDER BY created_at ASC LIMIT ?", [sessionId, limit]);
  }

  getContactConversation(contactId, limit = 50) {
    const rows = this._queryAll("SELECT * FROM conversation_history WHERE contact_id = ? ORDER BY created_at DESC LIMIT ?", [contactId, limit]);
    return rows.reverse();
  }

  deleteConversation(sessionId) {
    this._run("DELETE FROM conversation_history WHERE session_id = ?", [sessionId]);
    this.save();
  }

  // --- Persona State ---
  getPersonaState(stateKey) {
    const row = this._queryOne("SELECT value_json FROM yami_persona_state WHERE state_key = ?", [stateKey]);
    return row ? JSON.parse(row.value_json) : null;
  }

  setPersonaState(stateKey, value) {
    const valueJson = JSON.stringify(value);
    const now = new Date().toISOString();
    this._run("INSERT OR REPLACE INTO yami_persona_state (id, state_key, value_json, updated_at) VALUES (?, ?, ?, ?)",
      [_uuid(), stateKey, valueJson, now]);
    this.save();
  }

  getAllPersonaStates() {
    return this._queryAll("SELECT state_key, value_json, updated_at FROM yami_persona_state").map(r => ({
      key: r.state_key, value: JSON.parse(r.value_json), updatedAt: r.updated_at
    }));
  }

  // --- Friends ---
  addFriend(friend) {
    const now = new Date().toISOString();
    this._run(
      "INSERT OR REPLACE INTO yami_friends (id, friend_id, display_name, avatar_url, bio, tags, metadata_json, added_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [friend.id || _uuid(), friend.friendId, friend.displayName || null, friend.avatarUrl || null,
       friend.bio || null, JSON.stringify(friend.tags || []),
       friend.metadata ? JSON.stringify(friend.metadata) : null, now, now]
    );
    this.save();
  }

  getFriends() {
    return this._queryAll("SELECT * FROM yami_friends ORDER BY display_name").map(r => ({
      ...r,
      tags: JSON.parse(r.tags || "[]"),
      metadata: r.metadata_json ? JSON.parse(r.metadata_json) : null
    }));
  }

  removeFriend(friendId) {
    this._run("DELETE FROM yami_friends WHERE friend_id = ?", [friendId]);
    this.save();
  }

  // --- Behavioral Learnings ---
  addLearning(learning) {
    const id = learning.id || _uuid();
    const now = new Date().toISOString();
    this._run(
      "INSERT INTO behavioral_learnings (id, category, pattern, insight, confidence, source, metadata_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [id, learning.category, learning.pattern, learning.insight || null, learning.confidence || 0.0,
       learning.source || null, learning.metadata ? JSON.stringify(learning.metadata) : null, now, now]
    );
    this.save();
    return id;
  }

  getLearnings(category = null, minConfidence = 0) {
    if (category) {
      return this._queryAll("SELECT * FROM behavioral_learnings WHERE category = ? AND confidence >= ? ORDER BY confidence DESC", [category, minConfidence]);
    }
    return this._queryAll("SELECT * FROM behavioral_learnings WHERE confidence >= ? ORDER BY category, confidence DESC", [minConfidence]);
  }

  updateLearningConfidence(id, confidence) {
    this._run("UPDATE behavioral_learnings SET confidence = ?, updated_at = ? WHERE id = ?",
      [confidence, new Date().toISOString(), id]);
    this.save();
  }

  // --- Change Log ---
  _logChange(tableName, recordId, operation, dataBefore, dataAfter, changedBy) {
    const changeHash = _uuid().replace(/-/g, "").slice(0, 12);
    const now = new Date().toISOString();
    this._run(
      "INSERT INTO sync_change_log (table_name, record_id, operation, data_before, data_after, changed_by, device_id, change_hash, changed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [tableName, recordId, operation, dataBefore || null, dataAfter || null, changedBy, this.instanceId, changeHash, now]
    );
  }

  // --- Sync Operations ---
  getChangesSince(deviceId, tableName, lastSeq) {
    return this._queryAll(
      "SELECT * FROM sync_change_log WHERE table_name = ? AND id > ? AND synced = 0 ORDER BY id ASC",
      [tableName, lastSeq]
    );
  }

  getUnsyncedChanges(limit = 500) {
    return this._queryAll("SELECT * FROM sync_change_log WHERE synced = 0 ORDER BY id ASC LIMIT ?", [limit]);
  }

  markChangesSynced(ids) {
    const now = new Date().toISOString();
    for (const id of ids) {
      this._run("UPDATE sync_change_log SET synced = 1, synced_at = ? WHERE id = ?", [now, id]);
    }
    this.save();
  }

  updateSyncCheckpoint(deviceId, tableName, lastSeq) {
    this._run(
      "INSERT OR REPLACE INTO sync_checkpoints (device_id, table_name, last_seq, last_sync_at) VALUES (?, ?, ?, ?)",
      [deviceId, tableName, lastSeq, new Date().toISOString()]
    );
    this.save();
  }

  getSyncCheckpoint(deviceId, tableName) {
    return this._queryOne("SELECT * FROM sync_checkpoints WHERE device_id = ? AND table_name = ?", [deviceId, tableName]);
  }

  getAllSyncCheckpoints(deviceId) {
    return this._queryAll("SELECT * FROM sync_checkpoints WHERE device_id = ?", [deviceId]);
  }

  // --- Conflict Resolution ---
  logConflict(tableName, recordId, localVersion, remoteVersion) {
    this._run(
      "INSERT INTO conflict_log (table_name, record_id, local_version, remote_version, resolution, created_at) VALUES (?, ?, ?, ?, 'pending', ?)",
      [tableName, recordId,
       localVersion ? JSON.stringify(localVersion) : null,
       remoteVersion ? JSON.stringify(remoteVersion) : null,
       new Date().toISOString()]
    );
    this.save();
  }

  resolveConflict(conflictId, resolution, resolvedBy = null) {
    this._run("UPDATE conflict_log SET resolution = ?, resolved_at = ?, resolved_by = ? WHERE id = ?",
      [resolution, new Date().toISOString(), resolvedBy, conflictId]);
    this.save();
  }

  getPendingConflicts() {
    return this._queryAll("SELECT * FROM conflict_log WHERE resolution = 'pending' ORDER BY created_at ASC");
  }

  // --- Export / Import for sync ---
  exportSnapshot() {
    const tables = [
      "user_settings", "user_preferences", "communication_profile",
      "devices", "yami_persona_state", "yami_friends", "behavioral_learnings",
      "schedule_events", "connected_accounts", "authorized_integrations"
    ];
    const snapshot = {};
    for (const table of tables) {
      snapshot[table] = this._queryAll(`SELECT * FROM "${table}"`);
    }
    snapshot._meta = {
      instanceId: this.instanceId,
      exportedAt: new Date().toISOString(),
      schemaVersion: this.getSchemaVersion()
    };
    return snapshot;
  }

  importSnapshot(snapshot, sourceInstanceId) {
    const tables = [
      "user_settings", "user_preferences", "communication_profile",
      "devices", "yami_persona_state", "yami_friends", "behavioral_learnings",
      "schedule_events", "connected_accounts", "authorized_integrations"
    ];
    for (const table of tables) {
      const rows = snapshot[table];
      if (!rows || rows.length === 0) continue;
      for (const row of rows) {
        const keys = Object.keys(row);
        const cols = keys.map(k => `"${k}"`).join(", ");
        const placeholders = keys.map(() => "?").join(", ");
        const values = keys.map(k => row[k]);
        const idCol = row.device_id ? '"device_id"' : row.request_id ? '"request_id"' : row.token ? '"token"' : '"id"';
        const updateCols = keys.filter(k => k !== "id" && k !== "device_id" && k !== "request_id" && k !== "token")
          .map(k => `"${k}" = excluded."${k}"`).join(", ");
        try {
          this._run(
            `INSERT INTO "${table}" (${cols}) VALUES (${placeholders}) ON CONFLICT(${idCol}) DO UPDATE SET ${updateCols || '"id" = excluded."id"'}`, values
          );
        } catch (e) {
          // skip rows that fail
        }
      }
    }
    this.save();
    return true;
  }

  // --- Run full setup (schema + migration) ---
  async runFullSetup() {
    await this.init();
    this.runSchema(SCHEMA_SQL);
    const currentVersion = this.getSchemaVersion();
    if (currentVersion === 1) {
      await this._runMigrations(currentVersion);
    }
    return this;
  }
}

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS meta (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS user_settings (
  id         TEXT PRIMARY KEY,
  category   TEXT NOT NULL DEFAULT 'general',
  key        TEXT NOT NULL,
  value_json TEXT NOT NULL DEFAULT '{}',
  updated_at TEXT NOT NULL,
  updated_by TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_us_cat_key ON user_settings(category, key);
CREATE TABLE IF NOT EXISTS user_preferences (
  id         TEXT PRIMARY KEY,
  namespace  TEXT NOT NULL DEFAULT 'general',
  key        TEXT NOT NULL,
  value_json TEXT NOT NULL DEFAULT '{}',
  updated_at TEXT NOT NULL,
  updated_by TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_up_ns_key ON user_preferences(namespace, key);
CREATE TABLE IF NOT EXISTS communication_profile (
  id         TEXT PRIMARY KEY,
  channel    TEXT NOT NULL,
  profile    TEXT NOT NULL DEFAULT '{}',
  updated_at TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_cp_channel ON communication_profile(channel);
CREATE TABLE IF NOT EXISTS automation_history (
  id          TEXT PRIMARY KEY,
  automation  TEXT NOT NULL,
  trigger     TEXT,
  status      TEXT NOT NULL DEFAULT 'completed',
  input_json  TEXT,
  output_json TEXT,
  started_at  TEXT,
  finished_at TEXT,
  created_at  TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS schedule_events (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  description TEXT,
  event_date  TEXT NOT NULL,
  start_time  TEXT,
  end_time    TEXT,
  all_day     INTEGER NOT NULL DEFAULT 0,
  recurrence  TEXT,
  source      TEXT,
  reminders   TEXT DEFAULT '[]',
  status      TEXT NOT NULL DEFAULT 'pending',
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS connected_accounts (
  id          TEXT PRIMARY KEY,
  provider    TEXT NOT NULL,
  account_id  TEXT NOT NULL,
  label       TEXT,
  auth_json   TEXT,
  scopes      TEXT DEFAULT '[]',
  enabled     INTEGER NOT NULL DEFAULT 1,
  expires_at  TEXT,
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_ca_prov_acc ON connected_accounts(provider, account_id);
CREATE TABLE IF NOT EXISTS authorized_integrations (
  id              TEXT PRIMARY KEY,
  integration     TEXT NOT NULL,
  provider_id     TEXT,
  access_level    TEXT NOT NULL DEFAULT 'read',
  config_json     TEXT,
  enabled         INTEGER NOT NULL DEFAULT 1,
  last_used_at    TEXT,
  created_at      TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_ai_integration ON authorized_integrations(integration);
CREATE TABLE IF NOT EXISTS devices (
  device_id       TEXT PRIMARY KEY,
  display_name    TEXT,
  platform        TEXT,
  client_id       TEXT,
  client_mode     TEXT,
  roles           TEXT DEFAULT '[]',
  scopes          TEXT DEFAULT '[]',
  public_key      TEXT,
  tokens_json     TEXT,
  last_seen_at    TEXT,
  last_seen_reason TEXT,
  is_current      INTEGER NOT NULL DEFAULT 0,
  approved_at     TEXT,
  created_at      TEXT NOT NULL,
  updated_at      TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS conversation_history (
  id              TEXT PRIMARY KEY,
  session_id      TEXT NOT NULL,
  channel         TEXT,
  contact_id      TEXT,
  role            TEXT NOT NULL,
  content         TEXT NOT NULL,
  metadata_json   TEXT,
  tokens_used     INTEGER,
  model           TEXT,
  created_at      TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_conv_session ON conversation_history(session_id, created_at);
CREATE INDEX IF NOT EXISTS idx_conv_contact ON conversation_history(contact_id, created_at);
CREATE TABLE IF NOT EXISTS yami_persona_state (
  id          TEXT PRIMARY KEY,
  state_key   TEXT NOT NULL UNIQUE,
  value_json  TEXT NOT NULL DEFAULT '{}',
  updated_at  TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS yami_friends (
  id          TEXT PRIMARY KEY,
  friend_id   TEXT NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url  TEXT,
  bio         TEXT,
  tags        TEXT DEFAULT '[]',
  metadata_json TEXT,
  added_at    TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS behavioral_learnings (
  id          TEXT PRIMARY KEY,
  category    TEXT NOT NULL,
  pattern     TEXT NOT NULL,
  insight     TEXT,
  confidence  REAL NOT NULL DEFAULT 0.0,
  source      TEXT,
  metadata_json TEXT,
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_bl_category ON behavioral_learnings(category);
CREATE TABLE IF NOT EXISTS sync_change_log (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  table_name  TEXT NOT NULL,
  record_id   TEXT NOT NULL,
  operation   TEXT NOT NULL,
  data_before TEXT,
  data_after  TEXT,
  changed_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  changed_by  TEXT,
  device_id   TEXT,
  change_hash TEXT,
  synced      INTEGER NOT NULL DEFAULT 0,
  synced_at   TEXT
);
CREATE INDEX IF NOT EXISTS idx_scl_unsynced ON sync_change_log(synced, changed_at);
CREATE INDEX IF NOT EXISTS idx_scl_table ON sync_change_log(table_name, changed_at);
CREATE TABLE IF NOT EXISTS sync_checkpoints (
  device_id   TEXT NOT NULL,
  table_name  TEXT NOT NULL,
  last_seq    INTEGER NOT NULL DEFAULT 0,
  last_sync_at TEXT NOT NULL,
  PRIMARY KEY (device_id, table_name)
);
CREATE TABLE IF NOT EXISTS conflict_log (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  table_name    TEXT NOT NULL,
  record_id     TEXT NOT NULL,
  local_version TEXT,
  remote_version TEXT,
  resolution    TEXT NOT NULL DEFAULT 'pending',
  resolved_at   TEXT,
  resolved_by   TEXT,
  created_at    TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS pending_bootstrap_tokens (
  token       TEXT PRIMARY KEY,
  profile_json TEXT NOT NULL,
  issued_at   TEXT NOT NULL,
  redeemed    INTEGER NOT NULL DEFAULT 0,
  redeemed_at TEXT
);
CREATE TABLE IF NOT EXISTS pending_pairing_requests (
  request_id   TEXT PRIMARY KEY,
  device_id    TEXT NOT NULL,
  display_name TEXT,
  platform     TEXT,
  roles        TEXT DEFAULT '[]',
  scopes       TEXT DEFAULT '[]',
  public_key   TEXT,
  is_repair    INTEGER DEFAULT 0,
  created_at   TEXT NOT NULL
);
`;

export async function createYamiDB(dbPath) {
  const db = new YamiDB(dbPath);
  await db.init();
  return db;
}

export { SCHEMA_SQL };
