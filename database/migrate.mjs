import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

export async function migrateExistingData(db) {
  const yamiHome = process.env.YAMI_HOME || join(process.env.USERPROFILE || ".", ".yami");
  const results = { migrated: [], skipped: [], errors: [] };

  await _migrateYamiConfig(db, yamiHome, results);
  await _migratePanelState(db, yamiHome, results);
  await _migrateTtsSettings(db, yamiHome, results);
  await _migrateDevices(db, yamiHome, results);
  await _migratePendingDevices(db, yamiHome, results);
  await _migrateBootstrapTokens(db, yamiHome, results);

  return results;
}

function _readJson(filePath) {
  try {
    if (!existsSync(filePath)) return null;
    return JSON.parse(readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

async function _migrateYamiConfig(db, yamiHome, results) {
  const configPath = join(yamiHome, "yami.json");
  const config = _readJson(configPath);
  if (!config) {
    results.skipped.push("yami.json (not found)");
    return;
  }

  const existing = db.getSetting("yami_config", "full");
  if (existing) {
    results.skipped.push("yami.json (already migrated)");
    return;
  }

  db.setSetting("yami_config", "full", config, "migration");
  db.setSetting("yami_config", "gateway", config.gateway || {}, "migration");
  db.setSetting("yami_config", "skills", config.skills || {}, "migration");
  db.setSetting("yami_config", "plugins", config.plugins || {}, "migration");
  db.setSetting("yami_config", "channels", config.channels || {}, "migration");
  db.setSetting("yami_config", "messages", config.messages || {}, "migration");
  db.setSetting("yami_config", "session", config.session || {}, "migration");
  db.setSetting("yami_config", "talk", config.talk || {}, "migration");
  db.setSetting("yami_config", "agents", config.agents || {}, "migration");

  results.migrated.push("yami.json");
}

async function _migratePanelState(db, yamiHome, results) {
  const statePath = join(yamiHome, "auto-panel", "state.json");
  const state = _readJson(statePath);
  if (!state) {
    results.skipped.push("auto-panel/state.json (not found)");
    return;
  }

  const existing = db.getPreference("panel", "state");
  if (existing) {
    results.skipped.push("auto-panel/state.json (already migrated)");
    return;
  }

  db.setPreference("panel", "enabled", state.enabled !== false, "migration");
  db.setPreference("panel", "blockedContacts", state.blockedContacts || [], "migration");
  db.setPreference("panel", "voice", state.voice || {}, "migration");
  db.setPreference("panel", "updatedAt", state.updatedAt || null, "migration");
  db.setPreference("panel", "state", state, "migration");

  results.migrated.push("auto-panel/state.json");
}

async function _migrateTtsSettings(db, yamiHome, results) {
  const ttsPath = join(yamiHome, "settings", "tts.json");
  const tts = _readJson(ttsPath);
  if (!tts) {
    results.skipped.push("settings/tts.json (not found)");
    return;
  }

  const existing = db.getSetting("tts", "settings");
  if (existing) {
    results.skipped.push("settings/tts.json (already migrated)");
    return;
  }

  if (tts.tts) {
    db.setSetting("tts", "settings", tts.tts, "migration");
  } else {
    db.setSetting("tts", "settings", tts, "migration");
  }

  results.migrated.push("settings/tts.json");
}

async function _migrateDevices(db, yamiHome, results) {
  const devicesPath = join(yamiHome, "devices", "paired.json");
  const devices = _readJson(devicesPath);
  if (!devices) {
    results.skipped.push("devices/paired.json (not found)");
    return;
  }

  const count = db.getAllDevices().length;
  if (count > 0) {
    results.skipped.push("devices/paired.json (already migrated, devices exist)");
    return;
  }

  let migrated = 0;
  for (const [deviceId, device] of Object.entries(devices)) {
    db.addDevice({
      deviceId: device.deviceId,
      displayName: device.displayName || null,
      platform: device.platform || null,
      clientId: device.clientId || null,
      clientMode: device.clientMode || null,
      roles: device.roles || [],
      scopes: device.approvedScopes || device.scopes || [],
      publicKey: device.publicKey || null,
      tokens: device.tokens || null,
      lastSeenAt: device.lastSeenAtMs ? new Date(device.lastSeenAtMs).toISOString() : null,
      lastSeenReason: device.lastSeenReason || null,
      approvedAt: device.approvedAtMs ? new Date(device.approvedAtMs).toISOString() : null
    });
    migrated++;
  }

  results.migrated.push(`devices/paired.json (${migrated} devices)`);
}

async function _migratePendingDevices(db, yamiHome, results) {
  const pendingPath = join(yamiHome, "devices", "pending.json");
  const pending = _readJson(pendingPath);
  if (!pending) {
    results.skipped.push("devices/pending.json (not found)");
    return;
  }

  let migrated = 0;
  for (const [requestId, request] of Object.entries(pending)) {
    db.addPairingRequest({
      requestId: request.requestId || requestId,
      deviceId: request.deviceId,
      displayName: request.displayName || null,
      platform: request.platform || null,
      roles: request.roles || [],
      scopes: request.scopes || [],
      publicKey: request.publicKey || null,
      isRepair: request.isRepair || false
    });
    migrated++;
  }

  if (migrated > 0) {
    results.migrated.push(`devices/pending.json (${migrated} requests)`);
  } else {
    results.skipped.push("devices/pending.json (no entries)");
  }
}

async function _migrateBootstrapTokens(db, yamiHome, results) {
  const bootstrapPath = join(yamiHome, "devices", "bootstrap.json");
  const tokens = _readJson(bootstrapPath);
  if (!tokens) {
    results.skipped.push("devices/bootstrap.json (not found)");
    return;
  }

  let migrated = 0;
  for (const [token, entry] of Object.entries(tokens)) {
    if (entry.redeemedProfile && entry.redeemedProfile.roles && entry.redeemedProfile.roles.length > 0) {
      continue;
    }
    db.addBootstrapToken(token, entry.profile || entry);
    migrated++;
  }

  if (migrated > 0) {
    results.migrated.push(`devices/bootstrap.json (${migrated} tokens)`);
  } else {
    results.skipped.push("devices/bootstrap.json (already redeemed or no tokens)");
  }
}
