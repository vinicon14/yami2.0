import { randomUUID } from "node:crypto";

const SYNC_TABLES = [
  "user_settings", "user_preferences", "communication_profile",
  "automation_history", "schedule_events", "connected_accounts",
  "authorized_integrations", "devices", "yami_persona_state",
  "yami_friends", "behavioral_learnings"
];

export class SyncEngine {
  constructor(db, options = {}) {
    this.db = db;
    this.options = {
      syncIntervalMs: options.syncIntervalMs || 30000,
      peerUrl: options.peerUrl || null,
      apiKey: options.apiKey || null,
      deviceId: options.deviceId || db.getInstanceId(),
      autoSync: options.autoSync !== false,
      onSyncComplete: options.onSyncComplete || null,
      onConflict: options.onConflict || null,
      onError: options.onError || null,
      ...options
    };
    this._timer = null;
    this._syncing = false;
    this._lastSyncTime = null;
  }

  start() {
    if (!this.options.autoSync) return;
    this._scheduleNext();
  }

  stop() {
    if (this._timer) {
      clearTimeout(this._timer);
      this._timer = null;
    }
  }

  _scheduleNext() {
    if (this._timer) clearTimeout(this._timer);
    this._timer = setTimeout(() => this._syncLoop(), this.options.syncIntervalMs);
  }

  async _syncLoop() {
    if (this._syncing) {
      this._scheduleNext();
      return;
    }
    this._syncing = true;
    try {
      await this.syncWithPeer();
    } catch (err) {
      if (this.options.onError) {
        this.options.onError(err);
      }
    } finally {
      this._syncing = false;
      this._lastSyncTime = new Date().toISOString();
      this._scheduleNext();
    }
  }

  async syncWithPeer(peerUrl = null) {
    const url = peerUrl || this.options.peerUrl;
    if (!url) return { ok: false, reason: "no-peer-url" };

    const headers = { "Content-Type": "application/json" };
    if (this.options.apiKey) {
      headers["X-YAMI-Sync-Key"] = this.options.apiKey;
    }

    try {
      const localChanges = this.db.getUnsyncedChanges(1000);
      const checkpoints = this.db.getAllSyncCheckpoints(this.options.deviceId);
      const checkpointMap = {};
      for (const cp of checkpoints) {
        checkpointMap[cp.table_name] = cp.last_seq;
      }

      const payload = {
        deviceId: this.options.deviceId,
        instanceId: this.db.getInstanceId(),
        changes: localChanges,
        checkpoints: checkpointMap,
        timestamp: new Date().toISOString()
      };

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`Sync peer returned ${response.status}`);
      }

      const result = await response.json();
      await this._applyRemoteChanges(result);

      if (localChanges.length > 0) {
        const ids = localChanges.map(c => c.id);
        this.db.markChangesSynced(ids);
      }

      for (const [tableName, lastSeq] of Object.entries(result.checkpoints || {})) {
        this.db.updateSyncCheckpoint(this.options.deviceId, tableName, lastSeq);
      }

      if (this.options.onSyncComplete) {
        this.options.onSyncComplete({
          sentChanges: localChanges.length,
          receivedChanges: (result.changes || []).length,
          resolvedConflicts: (result.conflicts || []).length,
          timestamp: new Date().toISOString()
        });
      }

      return { ok: true, result };
    } catch (err) {
      if (err.name === "AbortError") {
        return { ok: false, reason: "timeout" };
      }
      return { ok: false, reason: err.message };
    }
  }

  async _applyRemoteChanges(result) {
    const changes = result.changes || [];
    if (changes.length === 0) return;

    const tx = this.db.db.transaction(() => {
      for (const change of changes) {
        try {
          this._applyChange(change);
        } catch (err) {
          this._handleConflict(change, err);
        }
      }
    });
    tx();
  }

  _applyChange(change) {
    const { table_name, record_id, operation, data_after } = change;
    if (operation === "delete") {
      const idCol = this._getIdColumn(table_name);
      this.db.db.prepare(`DELETE FROM ${table_name} WHERE ${idCol} = ?`).run(record_id);
      return;
    }
    if (!data_after) return;
    const data = JSON.parse(data_after);
    const columns = Object.keys(data);
    const placeholders = columns.map(() => "?").join(", ");
    const idCol = this._getIdColumn(table_name);
    const insertCols = [idCol, ...columns.filter(c => c !== idCol)].join(", ");
    const insertVals = [record_id, ...columns.filter(c => c !== idCol).map(c => data[c])];
    const upsertCols = columns.filter(c => c !== idCol).map(c => `${c} = excluded.${c}`).join(", ");

    this.db.db.prepare(
      `INSERT INTO ${table_name} (${insertCols}) VALUES (${placeholders})
       ON CONFLICT(${idCol}) DO UPDATE SET ${upsertCols}`
    ).run(...insertVals);
  }

  _handleConflict(change, err) {
    const dataAfter = change.data_after ? JSON.parse(change.data_after) : null;
    const existing = this.db.db.prepare(
      `SELECT * FROM ${change.table_name} WHERE ${this._getIdColumn(change.table_name)} = ?`
    ).get(change.record_id);
    this.db.logConflict(change.table_name, change.record_id, existing, dataAfter);
    if (this.options.onConflict) {
      this.options.onConflict({
        table: change.table_name,
        recordId: change.record_id,
        local: existing,
        remote: dataAfter,
        error: err.message
      });
    }
  }

  _getIdColumn(tableName) {
    const idMap = {
      devices: "device_id",
      user_settings: "id",
      user_preferences: "id",
      communication_profile: "id",
      automation_history: "id",
      schedule_events: "id",
      connected_accounts: "id",
      authorized_integrations: "id",
      conversation_history: "id",
      yami_persona_state: "id",
      yami_friends: "id",
      behavioral_learnings: "id",
      pending_bootstrap_tokens: "token",
      pending_pairing_requests: "request_id"
    };
    return idMap[tableName] || "id";
  }

  async serveSyncRequest(body) {
    const { changes, checkpoints, deviceId } = body;

    const responseChanges = [];
    for (const tableName of SYNC_TABLES) {
      const lastSeq = (checkpoints && checkpoints[tableName]) || 0;
      const tableChanges = this.db.getChangesSince(deviceId, tableName, lastSeq);
      for (const change of tableChanges) {
        responseChanges.push({
          id: change.id,
          table_name: change.table_name,
          record_id: change.record_id,
          operation: change.operation,
          data_before: change.data_before,
          data_after: change.data_after,
          changed_at: change.changed_at,
          device_id: change.device_id
        });
      }
    }

    if (changes && changes.length > 0) {
      await this._applyRemoteChanges({ changes });
      const changeIds = changes.map(c => c.id).filter(Boolean);
      if (changeIds.length > 0) {
        this.db.markChangesSynced(changeIds);
      }
    }

    const responseCheckpoints = {};
    for (const tableName of SYNC_TABLES) {
      const maxRow = this.db.db.prepare(
        `SELECT MAX(id) as max_seq FROM sync_change_log WHERE table_name = ?`
      ).get(tableName);
      responseCheckpoints[tableName] = maxRow && maxRow.max_seq ? maxRow.max_seq : 0;
    }

    const pendingConflicts = this.db.getPendingConflicts();

    return {
      ok: true,
      instanceId: this.db.getInstanceId(),
      changes: responseChanges,
      checkpoints: responseCheckpoints,
      conflicts: pendingConflicts,
      timestamp: new Date().toISOString()
    };
  }
}

export function createSyncEngine(db, options) {
  return new SyncEngine(db, options);
}
