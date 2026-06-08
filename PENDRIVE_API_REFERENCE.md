# YAMI Pendrive — REST API Reference

## Base URL

```
http://127.0.0.1:18808
```

---

## Core Endpoints

### 1. Get Full Status

```http
GET /api/pendrive
```

**Description:** Get complete pendrive status and metrics

**Response:**
```json
{
  "ok": true,
  "initialized": true,
  "pendrivePath": "C:\\Users\\vinim\\.yami\\pendrive",
  "identity": {
    "yamiId": "ymi-mq5kti8l-8846c0baae22bad1",
    "instanceName": "Yami",
    "generation": 1,
    "createdAt": "2026-06-08T19:00:50.708Z"
  },
  "profile": {
    "displayName": "Meu Yami",
    "userName": "",
    "theme": "dark-neon"
  },
  "appearance": {
    "glowColor": "85, 230, 255",
    "eyeStyle": "default",
    "accessory": null,
    "themePreset": "dark-neon"
  },
  "evolution": {
    "generation": 1,
    "totalEvolutions": 2,
    "currentStage": "primordial",
    "lastEvolutionAt": "2026-06-08T19:15:22.345Z",
    "recentHistory": [/* array of recent evolution events */]
  },
  "modules": {
    "native": 12,
    "custom": 0,
    "shared": 0
  },
  "voice": {
    "backend": "powershell",
    "voice": "Microsoft Maria Desktop",
    "rate": 0,
    "volume": 100
  },
  "sync": {
    "lastSyncAt": "2026-06-08T19:00:50.708Z",
    "lastHostName": "COMPUTER-NAME",
    "dirty": {/* dirty flags */}
  },
  "social": {
    "friends": {
      "total": 1,
      "incoming": 0,
      "outgoing": 0
    },
    "profileCard": {/* profile card data */},
    "messages": {
      "totalConversations": 1,
      "totalMessages": 0,
      "unreadCount": 0
    }
  },
  "memory": {
    "totalEntries": 1
  }
}
```

---

### 2. Initialize Pendrive

```http
POST /api/pendrive/init
```

**Description:** Initialize pendrive if not already initialized

**Request Body:** (empty)

**Response:**
```json
{
  "ok": true,
  "initialized": true,
  "identity": {
    "yamiId": "ymi-new-id-123456789",
    "instanceName": "Yami",
    "generation": 1,
    "createdAt": "2026-06-08T20:00:00.000Z"
  }
  // ... full status object
}
```

**Error Responses:**
```json
{
  "ok": false,
  "message": "Identidade YAMI nao inicializada."
}
```

---

## Identity Endpoints

### 3. Get Identity

```http
GET /api/pendrive/identity
```

**Response:**
```json
{
  "ok": true,
  "identity": {
    "yamiId": "ymi-mq5kti8l-8846c0baae22bad1",
    "instanceName": "Yami",
    "createdAt": "2026-06-08T19:00:50.708Z",
    "generation": 1,
    "version": "1.0.0-pendrive",
    "publicKey": ""
  }
}
```

---

## Profile Endpoints

### 4. Get Profile

```http
GET /api/pendrive/profile
```

**Response:**
```json
{
  "ok": true,
  "profile": {
    "displayName": "Meu Yami",
    "userName": "",
    "avatar": "default",
    "bio": "Assistente inteligente",
    "timezone": "America/Sao_Paulo",
    "language": "pt-BR",
    "theme": "dark-neon"
  }
}
```

### 5. Update Profile

```http
POST /api/pendrive/profile
Content-Type: application/json

{
  "displayName": "Novo Nome",
  "bio": "Nova bio",
  "theme": "violet-haze",
  "socialHandle": "@novo-handle"
}
```

**Response:**
```json
{
  "ok": true,
  "profile": {
    "displayName": "Novo Nome",
    "bio": "Nova bio",
    // ... updated profile
  }
}
```

---

## Appearance Endpoints

### 6. Get Appearance

```http
GET /api/pendrive/appearance
```

**Response:**
```json
{
  "ok": true,
  "appearance": {
    "bodyColor": "#03070b",
    "glowColor": "85, 230, 255",
    "accentColor": "#55e6ff",
    "eyeStyle": "default",
    "eyeColor": "#6ab",
    "mouthStyle": "default",
    "accessory": null,
    "animationSet": "default",
    "themePreset": "dark-neon",
    "bgEffect": "grid-scanlines",
    "particles": true,
    "scale": 1,
    "brightness": 1
  }
}
```

### 7. Update Appearance

```http
POST /api/pendrive/appearance
Content-Type: application/json

{
  "key": "themePreset",
  "value": "violet-haze"
}
```

Or update multiple properties:

```http
POST /api/pendrive/appearance
Content-Type: application/json

{
  "themePreset": "sunset-amber",
  "eyeStyle": "cyborg",
  "glowColor": "255, 209, 102",
  "accessory": "crown"
}
```

**Response:**
```json
{
  "ok": true,
  "appearance": {
    // ... updated appearance
  }
}
```

---

## Evolution Endpoints

### 8. Get Evolution

```http
GET /api/pendrive/evolution
```

**Response:**
```json
{
  "ok": true,
  "evolution": {
    "generation": 1,
    "totalEvolutions": 2,
    "currentStage": "primordial",
    "lastEvolutionAt": "2026-06-08T19:15:22.345Z",
    "recentHistory": [
      {
        "id": "ev-birth-mq5kti8l",
        "yamiId": "ymi-mq5kti8l-8846c0baae22bad1",
        "type": "nascimento",
        "description": "Yami foi inicializado",
        "timestamp": "2026-06-08T19:00:50.708Z",
        "generation": 1
      }
    ]
  }
}
```

### 9. Register Evolution

```http
POST /api/pendrive/evolution
Content-Type: application/json

{
  "type": "user-action",
  "description": "Usuário aprendeu novo comando",
  "details": {
    "command": "relatorio",
    "complexity": "medium"
  }
}
```

**Response:**
```json
{
  "ok": true,
  "evolution": {
    "totalEvolutions": 3,
    "lastEvolutionAt": "2026-06-08T20:30:45.123Z",
    // ... full evolution
  }
}
```

---

## Voice Endpoints

### 10. Get Voice Settings

```http
GET /api/pendrive/voice
```

**Response:**
```json
{
  "ok": true,
  "voice": {
    "backend": "powershell",
    "voice": "Microsoft Maria Desktop",
    "model": "",
    "rate": 0,
    "volume": 100,
    "wakeWord": "acorda",
    "restWord": "descansa",
    "language": "pt-BR",
    "autoTts": false,
    "ttsEnabled": false
  }
}
```

### 11. Update Voice Settings

```http
POST /api/pendrive/voice
Content-Type: application/json

{
  "backend": "pyttsx3",
  "voice": "Victoria",
  "rate": 2,
  "volume": 85
}
```

---

## Sync Endpoints

### 12. Record Synchronization

```http
POST /api/pendrive/sync
```

**Description:** Records sync timestamp and host information

**Response:**
```json
{
  "ok": true,
  "sync": {
    "yamiId": "ymi-mq5kti8l-8846c0baae22bad1",
    "lastSyncAt": "2026-06-08T20:35:12.456Z",
    "lastHostName": "MY-COMPUTER",
    "lastHostPlatform": "win32",
    "lastHostUser": "vinim",
    "syncHistory": [
      {
        "at": "2026-06-08T20:35:12.456Z",
        "host": "MY-COMPUTER",
        "platform": "win32"
      }
    ]
  }
}
```

### 13. Get Sync Status

```http
GET /api/pendrive/sync
```

---

## Friends Endpoints

### 14. Get Friends

```http
GET /api/pendrive/social/friends
```

**Response:**
```json
{
  "ok": true,
  "friends": {
    "friends": [
      {
        "yamiId": "ymi-amigo-001",
        "displayName": "Amigo Teste",
        "handle": "",
        "addedAt": "2026-06-08T19:30:00.000Z",
        "status": "active",
        "sharedModules": [],
        "sharedCustomizations": []
      }
    ],
    "pendingIncoming": [],
    "pendingOutgoing": [
      {
        "yamiId": "ymi-outro-001",
        "sentAt": "2026-06-08T19:40:00.000Z",
        "message": "Oi! Quer ser meu amigo?"
      }
    ],
    "blocked": [],
    "total": 1
  }
}
```

### 15. Manage Friends

```http
POST /api/pendrive/social/friends
Content-Type: application/json
```

**Add Friend:**
```json
{
  "action": "add",
  "yamiId": "ymi-novo-amigo-001",
  "name": "Novo Amigo"
}
```

**Remove Friend:**
```json
{
  "action": "remove",
  "yamiId": "ymi-amigo-001"
}
```

**Send Invitation:**
```json
{
  "action": "invite",
  "yamiId": "ymi-outro-001",
  "message": "Oi! Quer conectar?"
}
```

**Accept Invitation:**
```json
{
  "action": "accept",
  "yamiId": "ymi-outro-001"
}
```

---

## Profile Card Endpoints

### 16. Get Profile Card

```http
GET /api/pendrive/social/card
```

**Response:**
```json
{
  "ok": true,
  "card": {
    "yamiId": "ymi-mq5kti8l-8846c0baae22bad1",
    "displayName": "Meu Yami",
    "handle": "@meu-yami",
    "bio": "Assistente inteligente",
    "avatarStyle": "default",
    "glowColor": "85, 230, 255",
    "theme": "dark-neon",
    "generation": 1,
    "evolutionStage": "primordial",
    "badges": ["pendrive-nucleus"],
    "shareTimestamp": "2026-06-08T20:40:00.000Z",
    "cardVersion": 1
  }
}
```

### 17. Generate Profile Card

```http
POST /api/pendrive/social/card
```

**Response:** Updated profile card with new timestamp

---

## Messages Endpoints

### 18. Get Messages

```http
GET /api/pendrive/social/messages
GET /api/pendrive/social/messages?with=ymi-amigo-001
```

**List all conversations:**
```json
{
  "ok": true,
  "conversations": [
    {
      "withYamiId": "ymi-amigo-001",
      "displayName": "Amigo Teste",
      "messageCount": 5
    }
  ]
}
```

**Get messages with friend:**
```json
{
  "ok": true,
  "messages": [
    {
      "id": "msg-mq5kti8l-b1b07b4b",
      "direction": "outgoing",
      "text": "Oi!",
      "timestamp": "2026-06-08T19:45:00.000Z",
      "read": true
    }
  ]
}
```

### 19. Send/Receive Messages

```http
POST /api/pendrive/social/messages
Content-Type: application/json
```

**Send Message:**
```json
{
  "action": "send",
  "toYamiId": "ymi-amigo-001",
  "text": "Oi! Tudo bem?"
}
```

**Receive Message:**
```json
{
  "action": "receive",
  "fromYamiId": "ymi-amigo-001",
  "text": "Tudo certo! E voce?"
}
```

**Mark as Read:**
```json
{
  "action": "markRead",
  "toYamiId": "ymi-amigo-001"
}
```

---

## Memory Endpoints

### 20. Get Memory

```http
GET /api/pendrive/memory
GET /api/pendrive/memory?search=important
```

**Get all memories:**
```json
{
  "ok": true,
  "memory": {
    "version": 1,
    "entries": [
      {
        "id": "mem-mq5kti8l-b1b07b4b",
        "type": "note",
        "content": "Usuário prefere assistência matinal",
        "tags": ["preferences"],
        "createdAt": "2026-06-08T19:50:00.000Z",
        "accessCount": 3
      }
    ],
    "totalEntries": 1
  }
}
```

**Search memories:**
```json
{
  "ok": true,
  "results": [
    {
      "id": "mem-mq5kti8l-b1b07b4b",
      "type": "note",
      "content": "Usuário prefere assistência matinal",
      "tags": ["preferences"],
      "createdAt": "2026-06-08T19:50:00.000Z"
    }
  ]
}
```

### 21. Add Memory

```http
POST /api/pendrive/memory
Content-Type: application/json

{
  "type": "note",
  "content": "Importante: lembrar X",
  "tags": ["importante", "tarefas"]
}
```

**Response:**
```json
{
  "ok": true,
  "entry": {
    "id": "mem-new-id",
    "type": "note",
    "content": "Importante: lembrar X",
    "tags": ["importante", "tarefas"],
    "createdAt": "2026-06-08T21:00:00.000Z"
  }
}
```

---

## Export Endpoint

### 22. Export Identity Bundle

```http
GET /api/pendrive/export
```

**Response:**
```json
{
  "exportedAt": "2026-06-08T21:05:00.000Z",
  "origin": "ymi-mq5kti8l-8846c0baae22bad1",
  "bundle": {
    "identity": {/* full identity */},
    "profile": {/* full profile */},
    "appearance": {/* full appearance */},
    "evolution": {/* full evolution */},
    "modules": {/* full modules */},
    "voice": {/* full voice */},
    "socialProfileCard": {/* public card */}
  }
}
```

---

## Error Handling

All endpoints follow standard error format:

```json
{
  "ok": false,
  "message": "Error description"
}
```

### Common Errors

| Status | Error | Meaning |
|--------|-------|---------|
| 400 | Bad Request | Invalid JSON or parameters |
| 405 | Method Not Allowed | Wrong HTTP method |
| 500 | Internal Server Error | Processing error |

---

## Example Usage (JavaScript)

```javascript
// Get full status
const response = await fetch('http://127.0.0.1:18808/api/pendrive');
const data = await response.json();
console.log(data.identity.yamiId);

// Update profile
const updateResponse = await fetch('http://127.0.0.1:18808/api/pendrive/profile', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    displayName: 'Novo Nome',
    bio: 'Nova bio'
  })
});

// Add friend
const friendResponse = await fetch('http://127.0.0.1:18808/api/pendrive/social/friends', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'add',
    yamiId: 'ymi-friend-id',
    name: 'Friend Name'
  })
});

// Send message
const messageResponse = await fetch('http://127.0.0.1:18808/api/pendrive/social/messages', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'send',
    toYamiId: 'ymi-friend-id',
    text: 'Hello friend!'
  })
});
```

---

## Rate Limiting

No rate limits currently implemented. Use responsibly.

---

## Version

Current API Version: **1.0.0**

Last Updated: 2026-06-08
