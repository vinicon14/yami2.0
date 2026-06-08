# YAMI Central Database System

**Rule 3: Central Database and Universal Synchronization**

This is the implementation of the central database architecture for YAMI that provides:
- **Single Source of Truth**: All YAMI instances use the same database
- **Universal Synchronization**: Automatic sync across all authorized devices
- **Continuous Experience**: Settings, history, and state follow users between devices
- **Conflict Resolution**: Handles conflicts when changes occur offline
- **Recovery Mechanisms**: Transaction logs and change tracking for data consistency

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    YAMI Database System                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  YamiDB (Core Database)                              │   │
│  │  - SQLite via sql.js (pure JavaScript)               │   │
│  │  - Schema: 20+ tables covering all YAMI data         │   │
│  │  - CRUD operations for all entity types              │   │
│  │  - Change log with sync tracking                     │   │
│  └──────────────────────────────────────────────────────┘   │
│                             ▲                                 │
│                             │                                 │
│  ┌──────────────────────────┴──────────────────────────────┐ │
│  │          Sync Engine (Multi-Device Sync)               │ │
│  │  - Tracks changes on each device                       │ │
│  │  - Polls peer devices for remote changes              │ │
│  │  - Resolves conflicts (last-write-wins)               │ │
│  │  - Partial sync (only changed records)                │ │
│  │  - Recovery via transaction logs                      │ │
│  └──────────────────────────────────────────────────────────┘ │
│                             ▲                                  │
│                             │                                  │
│  ┌──────────────────────────┴──────────────────────────────┐  │
│  │           Sync API (HTTP Server)                        │  │
│  │  - Exposes sync endpoints on port 18900                │  │
│  │  - POST /sync - bidirectional sync                     │  │
│  │  - GET /sync/snapshot - export all data                │  │
│  │  - GET /health - check instance status                 │  │
│  │  - Authentication via X-YAMI-Sync-Key header           │  │
│  └──────────────────────────────────────────────────────────┘ │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Key Components

### 1. YamiDB (yami-db.mjs)

The core database class providing:
- Database initialization and schema setup
- CRUD operations for all YAMI data types
- Change log tracking for sync
- Import/export snapshots

**Supported Tables:**
- `user_settings` - Configuration (key-value pairs)
- `user_preferences` - Personal preferences
- `communication_profile` - Channel settings
- `automation_history` - Automation logs
- `schedule_events` - Calendar/appointments
- `connected_accounts` - OAuth accounts
- `authorized_integrations` - Integration settings
- `devices` - Paired devices registry
- `conversation_history` - Chat history
- `yami_persona_state` - Character state
- `yami_friends` - Friend list
- `behavioral_learnings` - Learning data
- `sync_change_log` - Change tracking
- `conflict_log` - Conflict resolution
- `pending_bootstrap_tokens` - Device provisioning
- `pending_pairing_requests` - Pending device approvals

### 2. SyncEngine (sync-engine.mjs)

Manages synchronization between devices:
- **Automatic Polling**: Checks peer devices at regular intervals (default 30s)
- **Change Tracking**: Tracks all changes with timestamps and device IDs
- **Conflict Detection**: Identifies conflicting changes
- **Partial Sync**: Only syncs changed records since last checkpoint
- **Error Handling**: Graceful degradation on network failure

### 3. SyncAPI (sync-api.mjs)

HTTP API server for device-to-device sync:
- **Bidirectional Sync**: Sends local changes, receives remote changes
- **Snapshot Export**: Full data export for new devices
- **Conflict Management**: Endpoint to resolve conflicts
- **Authentication**: API key-based security
- **Status Monitoring**: Health checks and diagnostics

## Installation & Setup

### Prerequisites
- Node.js v22+ (already available in your environment)
- No additional native dependencies (sql.js is pure JavaScript)

### Installation

```bash
cd ~/.yami/database
npm install
```

### Database Initialization

**In auto-panel (server.js):**

```javascript
import { initPanelDatabase, getPanelState, savePanelState } from './database/integration-auto-panel.mjs';

// At startup
const { db, syncEngine, syncAPI } = await initPanelDatabase({
  syncApiPort: 18900,
  peerUrl: process.env.YAMI_SYNC_PEER_URL, // e.g., http://other-device:18900/sync
  autoSync: true
});

// Replace readState() with:
const state = getPanelState(db);

// Replace saveState(next) with:
savePanelState(db, next);

// On shutdown
await db.close();
syncEngine.stop();
syncAPI.stop();
```

**In core runtime (yami.mjs):**

```javascript
import { initializeDatabase } from './database/index.mjs';

const { db, syncEngine, syncAPI } = await initializeDatabase({
  autoSync: true,
  peerUrl: process.env.YAMI_SYNC_PEER_URL
});

// Database is now ready for use
```

## API Examples

### Settings Management

```javascript
// Get a setting
const theme = db.getSetting('ui', 'theme');

// Set a setting
db.setSetting('ui', 'theme', 'dark', 'user-action');

// Get all settings in category
const allUiSettings = db.getAllSettings('ui');

// Delete a setting
db.deleteSetting('ui', 'theme');
```

### Device Management

```javascript
// Add/update a device
db.addDevice({
  deviceId: 'device-123',
  displayName: 'My iPhone',
  platform: 'ios',
  roles: ['operator'],
  scopes: ['read', 'write'],
  tokens: { operator: { token: 'abc...' } }
});

// Get all devices
const devices = db.getAllDevices();

// Get specific device
const device = db.getDevice('device-123');

// Mark device as current
db.setCurrentDevice('device-123');

// Track device activity
db.updateDeviceSeen('device-123', 'manual-sync');
```

### Conversation/Chat

```javascript
// Add message
const msgId = db.addMessage({
  sessionId: 'session-1',
  role: 'user',
  content: 'Hello YAMI',
  channel: 'whatsapp',
  contactId: '+5535996209...'
});

// Get conversation
const messages = db.getConversation('session-1', limit = 50);

// Get all messages from a contact
const contactChat = db.getContactConversation('+5535996209...');

// Clear conversation
db.deleteConversation('session-1');
```

### Schedule Management

```javascript
// Add event
const eventId = db.addEvent({
  title: 'Team Meeting',
  eventDate: '2026-06-15',
  startTime: '10:00',
  endTime: '11:00',
  reminders: ['15min', '1hour']
});

// Get upcoming events
const upcoming = db.getUpcomingEvents(limit = 10);

// Get events in date range
const events = db.getEvents('2026-06-01', '2026-06-30');

// Update event
db.updateEvent(eventId, { status: 'completed' });

// Delete event
db.deleteEvent(eventId);
```

### Automation History

```javascript
// Record automation
const id = db.addAutomationEntry({
  automation: 'send-notification',
  trigger: 'user-request',
  status: 'completed',
  input: { message: 'Hello' },
  output: { sent: true },
  startedAt: new Date().toISOString(),
  finishedAt: new Date().toISOString()
});

// Get history
const history = db.getAutomationHistory(limit = 50, offset = 0);
```

### Sync Management

```javascript
// Manual sync with peer
const syncResult = await syncEngine.syncWithPeer('http://other-device:18900/sync');

// Get unsynced changes
const changes = db.getUnsyncedChanges(limit = 500);

// Mark changes as synced
db.markChangesSynced([1, 2, 3, 4, 5]);

// Get sync checkpoint for a device
const checkpoint = db.getSyncCheckpoint('device-123', 'user_settings');

// Export snapshot
const snapshot = db.exportSnapshot();

// Import snapshot
db.importSnapshot(snapshot, 'source-instance-id');
```

## Synchronization Flow

### Automatic Sync (Every 30 seconds)

```
Device A (Primary)
├─ Collect unsynced changes
├─ Get sync checkpoints for each table
└─ POST to Device B's /sync endpoint
   ├─ Send: local changes + checkpoints
   └─ Receive: remote changes + conflicts
      ├─ Apply remote changes
      ├─ Resolve conflicts
      └─ Mark changes as synced
```

### Conflict Resolution

When two devices change the same record:

1. **Detection**: Record exists in both local and remote with different `updated_at`
2. **Resolution Strategy**:
   - **Last-Write-Wins**: Remote change with later timestamp overwrites local
   - **Logging**: Conflict is logged for review
   - **Notification**: `onConflict` callback is triggered
3. **User Action**: Manual resolution via `/sync/resolve` endpoint

### Checkpoints

Each device maintains a checkpoint for each table:

```javascript
{
  deviceId: 'device-123',
  tableName: 'user_settings',
  lastSeq: 42,           // Last change ID synced
  lastSyncAt: '2026-06-08T18:30:00Z'
}
```

On next sync, only changes with `id > lastSeq` are fetched.

## Multi-Device Synchronization Scenarios

### Scenario 1: Settings Sync Across Devices

```
Device A (Desktop)        Device B (Mobile)
│                         │
├─ User changes theme     │
├─ DB: SET theme='dark'   │
├─ Change log entry       │
│                         │ Auto sync (30s)
│ Receive sync request ◄──┤
├─ Send changes (theme)   │
│                         ├─ Apply theme='dark'
│                         ├─ DB updated
│                         └─ UI reflects immediately
```

### Scenario 2: Offline Changes & Merge

```
Device A                  Device B
├─ Offline mode           │ Online
├─ Change: event time     ├─ Change: event title
├─ DB: time=14:00         ├─ DB: title='New Title'
│                         │
│ Reconnect (online)      │
├─ Sync triggered         │
│                         ├─ Send: title change
├─ Receive: title='New'   │
├─ Apply title='New'      │ Receive: time=14:00
├─ Send: time=14:00       │
├─ DB merged:             ├─ DB merged:
│  title='New'            │  title='New'
│  time=14:00             │  time=14:00
└─ ✓ Consistent           └─ ✓ Consistent
```

### Scenario 3: New Device Bootstrap

```
Device A (existing)       Device C (new phone)
│                         │
│ Generate bootstrap      │
├─ Bootstrap token        │
│   + provisioning rules   │
│                         │
│                         ├─ Use bootstrap token
│                         ├─ Request snapshot
├─ Receive bootstrap      │
├─ Validate + approve     │
├─ Send full snapshot      ├─ Receive data
│  all tables             ├─ Import to local DB
│  all contacts           ├─ Populate UI
│  all events             └─ Ready to use
└─ New device synced      
```

## API Endpoints (Sync API - Port 18900)

### POST /sync
Bidirectional device sync

**Request:**
```json
{
  "deviceId": "device-123",
  "instanceId": "uuid",
  "changes": [
    {
      "id": 1,
      "table_name": "user_settings",
      "record_id": "setting-1",
      "operation": "insert",
      "data_after": "{...}",
      "changed_at": "2026-06-08T18:30:00Z"
    }
  ],
  "checkpoints": {
    "user_settings": 42,
    "schedule_events": 15
  }
}
```

**Response:**
```json
{
  "ok": true,
  "instanceId": "uuid",
  "changes": [...],
  "checkpoints": {...},
  "conflicts": [],
  "timestamp": "2026-06-08T18:30:00Z"
}
```

### GET /sync/snapshot
Export all data as snapshot

**Response:**
```json
{
  "user_settings": [...],
  "schedule_events": [...],
  "devices": [...],
  "_meta": {
    "instanceId": "uuid",
    "exportedAt": "2026-06-08T18:30:00Z",
    "schemaVersion": 1
  }
}
```

### POST /sync/snapshot
Import snapshot from another device

**Request:**
```json
{
  "user_settings": [...],
  "devices": [...],
  "_meta": {...}
}
```

### GET /health
Check sync API status

**Response:**
```json
{
  "ok": true,
  "instance": "uuid",
  "uptime": 3600
}
```

### GET /sync/status
Get sync diagnostics

**Response:**
```json
{
  "instanceId": "uuid",
  "schemaVersion": 1,
  "unsyncedCount": 5,
  "conflictCount": 0,
  "deviceCount": 3,
  "lastSyncTime": "2026-06-08T18:30:00Z",
  "uptime": 3600
}
```

## Configuration

### Environment Variables

```bash
# Database location (default: ~/.yami/database/data/yami.db)
YAMI_DB_PATH=/path/to/db

# Sync peer URL (device to sync with)
YAMI_SYNC_PEER_URL=http://other-device.local:18900/sync

# Sync API key
YAMI_SYNC_KEY=secure-key-here

# Sync interval (ms)
YAMI_SYNC_INTERVAL=30000

# Sync API port
YAMI_SYNC_API_PORT=18900
```

## Data Continuity & Migration

### Automatic Migration

On first run, the database automatically migrates existing file-based data:

- ✓ `yami.json` → `user_settings` table
- ✓ `auto-panel/state.json` → `user_preferences` table
- ✓ `settings/tts.json` → `user_settings` table
- ✓ `devices/paired.json` → `devices` table
- ✓ `devices/pending.json` → `pending_pairing_requests` table
- ✓ `devices/bootstrap.json` → `pending_bootstrap_tokens` table

### Migration Results

```javascript
const { migrationResults } = await initializeDatabase();

console.log(migrationResults);
// {
//   migrated: ['yami.json', 'auto-panel/state.json', ...],
//   skipped: ['file-not-found.json', ...],
//   errors: []
// }
```

## Performance Characteristics

- **Database Size**: ~10-50 MB for typical user (with history)
- **Sync Time**: 500ms-2s depending on change volume
- **Memory**: ~50-100 MB (in-process)
- **Query Latency**: <10ms for single record queries

## Security Considerations

1. **Database Encryption** (future): Consider encrypting sensitive data at rest
2. **API Authentication**: All sync endpoints require `X-YAMI-Sync-Key` header
3. **Device Approval**: New devices require explicit approval before syncing
4. **Access Control**: Scopes control what each device can access
5. **Audit Trail**: All changes logged with device ID and timestamp

## Troubleshooting

### Database Not Initializing

```javascript
const db = await createYamiDB();
if (!db.ready) {
  console.error('Database failed to initialize');
}
```

### Sync Not Working

Check:
1. Sync API is running: `curl http://localhost:18900/health`
2. Peer URL is correct: `echo $YAMI_SYNC_PEER_URL`
3. API key matches: Check `X-YAMI-Sync-Key` header
4. Network connectivity: Can devices reach each other?

### Conflicts During Sync

```javascript
const conflicts = db.getPendingConflicts();
conflicts.forEach(c => {
  // Review conflict
  console.log(c);
  
  // Resolve (manual)
  db.resolveConflict(c.id, 'use-remote', 'user');
});
```

### Data Inconsistency

Export snapshot from all devices and compare:

```javascript
const snap1 = db1.exportSnapshot();
const snap2 = db2.exportSnapshot();

// Compare snapshots to find divergence
```

## Future Enhancements

1. **Encryption**: End-to-end encryption for sensitive data
2. **Compression**: Gzip compression for large sync payloads
3. **Selective Sync**: Choose which tables/devices to sync
4. **Conflict Strategies**: User-defined conflict resolution policies
5. **Cloud Backup**: Optional cloud backup of database
6. **Replication**: Read replicas for high-availability

## References

- **Module Location**: `C:\Users\vinim\.yami\database\`
- **Database File**: `~/.yami/database/data/yami.db`
- **Sync API Port**: 18900 (default)
- **Change Log Table**: `sync_change_log` (tracks all changes)
- **Conflict Log**: `conflict_log` (tracks resolved conflicts)
