CREATE TABLE IF NOT EXISTS meta (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

INSERT INTO meta (key, value) VALUES ('schema_version', '1');
INSERT INTO meta (key, value) VALUES ('db_instance_id', lower(hex(randomblob(16))));

CREATE TABLE IF NOT EXISTS user_settings (
  id         TEXT PRIMARY KEY,
  category   TEXT NOT NULL DEFAULT 'general',
  key        TEXT NOT NULL,
  value_json TEXT NOT NULL DEFAULT '{}',
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_by TEXT,
  UNIQUE(category, key)
);

CREATE TABLE IF NOT EXISTS user_preferences (
  id         TEXT PRIMARY KEY,
  namespace  TEXT NOT NULL DEFAULT 'general',
  key        TEXT NOT NULL,
  value_json TEXT NOT NULL DEFAULT '{}',
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_by TEXT,
  UNIQUE(namespace, key)
);

CREATE TABLE IF NOT EXISTS communication_profile (
  id         TEXT PRIMARY KEY,
  channel    TEXT NOT NULL,
  profile    TEXT NOT NULL DEFAULT '{}',
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE(channel)
);

CREATE TABLE IF NOT EXISTS automation_history (
  id          TEXT PRIMARY KEY,
  automation  TEXT NOT NULL,
  trigger     TEXT,
  status      TEXT NOT NULL DEFAULT 'completed',
  input_json  TEXT,
  output_json TEXT,
  started_at  TEXT,
  finished_at TEXT,
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
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
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
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
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE(provider, account_id)
);

CREATE TABLE IF NOT EXISTS authorized_integrations (
  id              TEXT PRIMARY KEY,
  integration     TEXT NOT NULL,
  provider_id     TEXT,
  access_level    TEXT NOT NULL DEFAULT 'read',
  config_json     TEXT,
  enabled         INTEGER NOT NULL DEFAULT 1,
  last_used_at    TEXT,
  created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE(integration)
);

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
  created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
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
  created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_conversation_session ON conversation_history(session_id, created_at);
CREATE INDEX IF NOT EXISTS idx_conversation_contact ON conversation_history(contact_id, created_at);

CREATE TABLE IF NOT EXISTS yami_persona_state (
  id          TEXT PRIMARY KEY,
  state_key   TEXT NOT NULL UNIQUE,
  value_json  TEXT NOT NULL DEFAULT '{}',
  updated_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS yami_friends (
  id          TEXT PRIMARY KEY,
  friend_id   TEXT NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url  TEXT,
  bio         TEXT,
  tags        TEXT DEFAULT '[]',
  metadata_json TEXT,
  added_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS behavioral_learnings (
  id          TEXT PRIMARY KEY,
  category    TEXT NOT NULL,
  pattern     TEXT NOT NULL,
  insight     TEXT,
  confidence  REAL NOT NULL DEFAULT 0.0,
  source      TEXT,
  metadata_json TEXT,
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_behavioral_category ON behavioral_learnings(category);

CREATE TABLE IF NOT EXISTS sync_change_log (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  table_name    TEXT NOT NULL,
  record_id     TEXT NOT NULL,
  operation     TEXT NOT NULL CHECK(operation IN ('insert', 'update', 'delete')),
  data_before   TEXT,
  data_after    TEXT,
  changed_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  changed_by    TEXT,
  device_id     TEXT,
  change_hash   TEXT,
  synced        INTEGER NOT NULL DEFAULT 0,
  synced_at     TEXT
);

CREATE INDEX IF NOT EXISTS idx_sync_unsynced ON sync_change_log(synced, changed_at);
CREATE INDEX IF NOT EXISTS idx_sync_table ON sync_change_log(table_name, changed_at);

CREATE TABLE IF NOT EXISTS sync_checkpoints (
  device_id   TEXT NOT NULL,
  table_name  TEXT NOT NULL,
  last_seq    INTEGER NOT NULL DEFAULT 0,
  last_sync_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
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
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS pending_bootstrap_tokens (
  token       TEXT PRIMARY KEY,
  profile_json TEXT NOT NULL,
  issued_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
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
  created_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
