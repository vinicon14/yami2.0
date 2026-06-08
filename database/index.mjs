import { YamiDB, createYamiDB, SCHEMA_SQL } from "./yami-db.mjs";
import { SyncEngine, createSyncEngine } from "./sync-engine.mjs";
import { SyncAPI, createSyncAPI } from "./sync-api.mjs";
import { migrateExistingData } from "./migrate.mjs";

let _db = null;
let _syncEngine = null;
let _syncAPI = null;

export async function initializeDatabase(options = {}) {
  const dbPath = options.dbPath || undefined;
  const db = await createYamiDB(dbPath);

  db.runSchema(SCHEMA_SQL);

  const migrationResults = await migrateExistingData(db);

  const deviceId = options.deviceId || db.getInstanceId();

  const syncEngine = createSyncEngine(db, {
    deviceId,
    peerUrl: options.peerUrl || null,
    apiKey: options.syncKey || null,
    syncIntervalMs: options.syncIntervalMs || 30000,
    autoSync: options.autoSync !== false,
    onSyncComplete: options.onSyncComplete || null,
    onConflict: options.onConflict || null,
    onError: options.onError || null
  });

  let syncAPI = null;
  if (options.startSyncApi !== false) {
    syncAPI = createSyncAPI(db, syncEngine, {
      port: options.syncApiPort || 18900,
      host: options.syncApiHost || "127.0.0.1",
      apiKey: options.syncKey || null
    });
    await syncAPI.start();
  }

  if (options.autoSync !== false && options.peerUrl) {
    syncEngine.start();
  }

  _db = db;
  _syncEngine = syncEngine;
  _syncAPI = syncAPI;

  return {
    db,
    syncEngine,
    syncAPI,
    migrationResults,
    deviceId
  };
}

export function getDatabase() {
  if (!_db) throw new Error("Database not initialized. Call initializeDatabase() first.");
  return _db;
}

export function getSyncEngine() {
  return _syncEngine;
}

export function getSyncAPI() {
  return _syncAPI;
}

export async function shutdownDatabase() {
  if (_syncAPI) { _syncAPI.stop(); _syncAPI = null; }
  if (_syncEngine) { _syncEngine.stop(); _syncEngine = null; }
  if (_db) { _db.close(); _db = null; }
}

export { YamiDB, SyncEngine, SyncAPI, migrateExistingData };
