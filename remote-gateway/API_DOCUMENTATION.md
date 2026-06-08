# YAMI Remote Gateway - API Documentation

## Overview

The YAMI Remote Gateway provides RESTful HTTP API and WebSocket real-time communication for multi-platform remote access to YAMI.

**Base URLs**:
- HTTP/REST: `http://localhost:18790/api`
- WebSocket: `ws://localhost:18790/socket`

## Authentication

All requests require device authentication using pairing tokens.

### Device Pairing Flow

#### 1. Initiate Pairing

```http
POST /api/devices/initiate-pairing
Content-Type: application/json

{
  "displayName": "iPhone 13",
  "platform": "ios",
  "clientId": "mobile-app"
}
```

**Response** (200 OK):
```json
{
  "pairingCode": "A7F3C2E9",
  "expiresIn": 300
}
```

#### 2. Complete Pairing

```http
POST /api/devices/complete-pairing
Content-Type: application/json

{
  "pairingCode": "A7F3C2E9",
  "publicKey": "UiOECIdy9XYrdAyXuEe_UaO-20l-OuZRqqZ-t-cWO4Q"
}
```

**Response** (200 OK):
```json
{
  "deviceId": "fa0adda703b67da705184765c90ec4067ac80dde161eb4490bd4077b7ff9033e",
  "token": "wMW6-UYzxqOfjvVWsltVh7cmSqFr2H0HVLtPiooNkJA",
  "expiresAt": 1717948800000,
  "message": "Device paired successfully"
}
```

## HTTP REST API

### Health Check

```http
GET /api/health
```

**Response** (200 OK):
```json
{
  "status": "ok",
  "timestamp": "2026-06-08T14:30:00.000Z",
  "uptime": 3600,
  "connectedClients": 5
}
```

### Status Endpoints

#### Get Current Status

```http
GET /api/status
```

**Response** (200 OK):
```json
{
  "server": {
    "uptime": 3600,
    "memory": {
      "rss": 52428800,
      "heapTotal": 41943040,
      "heapUsed": 20971520
    },
    "connectedClients": 5
  },
  "yami": {
    "isRunning": true,
    "version": "2026.6.2",
    "uptime": 3600,
    "cpuUsage": 15.2,
    "memoryUsage": 1024,
    "isRecording": false,
    "isBusy": false,
    "startedAt": "2026-06-08T10:30:00.000Z"
  },
  "tasks": {
    "total": 5,
    "running": 2,
    "completed": 3,
    "failed": 0,
    "pending": 0
  },
  "notifications": {
    "unreadCount": 3,
    "lastNotification": "2026-06-08T14:25:00.000Z"
  },
  "timestamp": "2026-06-08T14:30:00.000Z"
}
```

### Conversations

#### List Conversations

```http
GET /api/conversations
```

**Response** (200 OK):
```json
[
  {
    "id": "conv_a1b2c3d4e5f6",
    "title": "Setup Configuration",
    "messageCount": 12,
    "createdAt": "2026-06-08T10:00:00.000Z",
    "updatedAt": "2026-06-08T14:30:00.000Z",
    "lastMessage": {
      "id": "msg_xyz123",
      "role": "assistant",
      "content": "Configuration saved successfully",
      "timestamp": "2026-06-08T14:30:00.000Z"
    }
  }
]
```

#### Get Conversation

```http
GET /api/conversations/:id
```

**Response** (200 OK):
```json
{
  "id": "conv_a1b2c3d4e5f6",
  "createdAt": "2026-06-08T10:00:00.000Z",
  "updatedAt": "2026-06-08T14:30:00.000Z",
  "messages": [
    {
      "id": "msg_1",
      "role": "user",
      "content": "Configure the system",
      "timestamp": "2026-06-08T10:05:00.000Z",
      "device": "device_id_1",
      "platform": "ios"
    },
    {
      "id": "msg_2",
      "role": "assistant",
      "content": "Starting configuration process...",
      "timestamp": "2026-06-08T10:06:00.000Z"
    }
  ],
  "metadata": {
    "title": "Setup Configuration",
    "tags": ["setup", "config"],
    "resolved": false
  }
}
```

### Activities

#### Get Activities

```http
GET /api/activities?limit=50&offset=0
```

**Query Parameters**:
- `limit` (default: 50) - Number of activities to return
- `offset` (default: 0) - Number of activities to skip

**Response** (200 OK):
```json
[
  {
    "id": "activity_1717862400000_abc123",
    "type": "TASK_UPDATED",
    "data": {
      "taskId": "task_123",
      "action": "updated",
      "task": {
        "id": "task_123",
        "title": "Setup Configuration",
        "status": "completed",
        "priority": "high"
      }
    },
    "timestamp": "2026-06-08T14:30:00.000Z"
  }
]
```

### Notifications

#### Get Notification History

```http
GET /api/notifications/history?limit=20
```

**Query Parameters**:
- `limit` (default: 20) - Number of notifications to return

**Response** (200 OK):
```json
[
  {
    "id": "notif_a1b2c3d4e5f6",
    "type": "task",
    "title": "Task Completed",
    "message": "Your task has been completed successfully",
    "timestamp": "2026-06-08T14:30:00.000Z",
    "isRead": false,
    "priority": "normal",
    "data": {
      "taskId": "task_123",
      "status": "completed"
    }
  }
]
```

## WebSocket Real-Time API

### Connection

```javascript
const ws = new WebSocket('ws://localhost:18790/socket');

ws.onopen = () => {
  // Authenticate
  ws.send(JSON.stringify({
    type: 'auth.init',
    payload: {
      deviceId: 'device_id',
      token: 'session_token',
      publicKey: 'public_key_base64'
    }
  }));
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('Received:', message);
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};

ws.onclose = () => {
  console.log('Connection closed');
};
```

### Message Types

#### Client → Server

##### Authentication

```json
{
  "type": "auth.init",
  "payload": {
    "deviceId": "device_id",
    "token": "session_token",
    "publicKey": "public_key_base64"
  }
}
```

##### Send Chat Message

```json
{
  "id": "msg_xyz123",
  "type": "chat.send",
  "payload": {
    "conversationId": "conv_a1b2c3d4e5f6",
    "content": "How can I automate this task?",
    "metadata": {
      "language": "pt-BR"
    }
  }
}
```

##### Send Voice Message

```json
{
  "id": "msg_voice123",
  "type": "voice.send",
  "payload": {
    "audioData": "base64_encoded_audio",
    "format": "wav",
    "language": "pt-BR"
  }
}
```

##### Request Full Sync

```json
{
  "id": "sync_req_123",
  "type": "sync.request"
}
```

##### Keep-Alive Ping

```json
{
  "id": "ping_123",
  "type": "status.ping"
}
```

##### Acknowledge Task

```json
{
  "type": "task.acknowledge",
  "payload": {
    "taskId": "task_123"
  }
}
```

##### Subscribe to Automation

```json
{
  "type": "automation.subscribe",
  "payload": {
    "automationId": "auto_123"
  }
}
```

#### Server → Client

##### Authentication Success

```json
{
  "id": "msg_from_client",
  "type": "auth.success",
  "payload": {
    "sessionId": "session_id",
    "deviceId": "device_id",
    "timestamp": 1717862400000
  }
}
```

##### Initial Status

```json
{
  "type": "status.initial",
  "payload": {
    "timestamp": 1717862400000,
    "server": {
      "time": "2026-06-08T14:30:00.000Z",
      "version": "1.0.0"
    },
    "yami": {
      "isRunning": true,
      "version": "2026.6.2",
      "cpuUsage": 15.2,
      "memoryUsage": 1024
    },
    "connectedDevices": 5
  }
}
```

##### Full Sync (Response to sync.request)

```json
{
  "id": "sync_req_123",
  "type": "sync.full",
  "payload": {
    "tasks": {
      "total": 5,
      "running": 2,
      "completed": 3,
      "failed": 0,
      "pending": 0,
      "tasks": [...]
    },
    "automations": {
      "total": 3,
      "active": 2,
      "inactive": 1,
      "automations": [...]
    },
    "notifications": [...],
    "conversations": [...],
    "status": {...}
  },
  "timestamp": 1717862400000
}
```

##### Task Updated

```json
{
  "type": "task.updated",
  "payload": {
    "taskId": "task_123",
    "action": "updated",
    "task": {
      "id": "task_123",
      "title": "Setup Configuration",
      "status": "running",
      "progress": 65
    }
  },
  "timestamp": 1717862400000
}
```

##### Chat Message

```json
{
  "type": "chat.message",
  "payload": {
    "conversationId": "conv_a1b2c3d4e5f6",
    "message": {
      "id": "msg_xyz123",
      "role": "assistant",
      "content": "I can help you automate that task...",
      "timestamp": "2026-06-08T14:30:00.000Z"
    }
  },
  "timestamp": 1717862400000
}
```

##### Activity Log

```json
{
  "type": "activity.log",
  "payload": {
    "id": "activity_xyz123",
    "type": "TASK_UPDATED",
    "data": {...},
    "timestamp": "2026-06-08T14:30:00.000Z"
  },
  "timestamp": 1717862400000
}
```

##### Automation Progress

```json
{
  "type": "automation.progress",
  "payload": {
    "automationId": "auto_123",
    "progress": {
      "currentStep": 3,
      "totalSteps": 5,
      "percentage": 60,
      "status": "running",
      "lastUpdatedAt": "2026-06-08T14:30:00.000Z"
    }
  },
  "timestamp": 1717862400000
}
```

##### Status Update

```json
{
  "type": "status.update",
  "payload": {
    "computer": {
      "isOnline": true,
      "uptime": 3600
    },
    "yami": {
      "isRunning": true,
      "cpuUsage": 12.5,
      "memoryUsage": 1024,
      "isBusy": false
    },
    "tasks": {
      "total": 5,
      "running": 2,
      "completed": 3
    }
  },
  "timestamp": 1717862400000
}
```

##### Notification Push

```json
{
  "type": "notification.push",
  "payload": {
    "id": "notif_xyz123",
    "type": "task",
    "title": "Task Completed",
    "message": "Setup Configuration has been completed",
    "priority": "normal",
    "data": {
      "taskId": "task_123"
    }
  },
  "timestamp": 1717862400000
}
```

##### Keep-Alive Pong

```json
{
  "id": "ping_123",
  "type": "status.pong",
  "timestamp": 1717862400000
}
```

##### Error Response

```json
{
  "type": "error.auth",
  "payload": {
    "error": "Authentication failed"
  }
}
```

## Error Responses

### HTTP Errors

```json
{
  "error": "Error message here",
  "statusCode": 400
}
```

**Status Codes**:
- `200` - OK
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `500` - Internal Server Error

### WebSocket Errors

```json
{
  "type": "error.validation",
  "payload": {
    "error": "Invalid message format"
  }
}
```

**Error Types**:
- `error.auth` - Authentication failed
- `error.validation` - Invalid message format
- `error.unknown` - Unknown message type
- `error.permission` - Permission denied

## Rate Limiting

- HTTP requests: 100 requests per 15 minutes per IP
- WebSocket messages: No hard limit (monitored)

## Conventions

### Message Format

All WebSocket messages follow this structure:

```json
{
  "id": "unique-message-id (optional)",
  "type": "message-type",
  "payload": {},
  "metadata": {
    "source": "device-id (optional)",
    "priority": "normal|high (optional)",
    "requiresAck": true|false
  },
  "timestamp": 1717862400000
}
```

### Timestamps

- ISO 8601 format: `2026-06-08T14:30:00.000Z`
- Milliseconds since epoch: `1717862400000`

### Device IDs

Device IDs are 64-character hexadecimal strings:
```
fa0adda703b67da705184765c90ec4067ac80dde161eb4490bd4077b7ff9033e
```

### Session Tokens

Tokens are base64-encoded strings (no padding):
```
wMW6-UYzxqOfjvVWsltVh7cmSqFr2H0HVLtPiooNkJA
```

## Example Client Implementation

```javascript
class YAMIRemoteClient {
  constructor(host, port) {
    this.host = host;
    this.port = port;
    this.ws = null;
    this.deviceId = null;
    this.sessionId = null;
    this.messageId = 0;
  }

  async connect(deviceId, token, publicKey) {
    this.deviceId = deviceId;
    
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(`ws://${this.host}:${this.port}/socket`);

      this.ws.onopen = () => {
        this.send({
          type: 'auth.init',
          payload: { deviceId, token, publicKey }
        }).then(resolve).catch(reject);
      };

      this.ws.onerror = reject;
    });
  }

  send(message) {
    return new Promise((resolve, reject) => {
      const id = `msg_${++this.messageId}`;
      const fullMessage = { ...message, id };

      this.ws.send(JSON.stringify(fullMessage));
      resolve({ id, ...message });
    });
  }

  sendChat(conversationId, content) {
    return this.send({
      type: 'chat.send',
      payload: { conversationId, content }
    });
  }

  requestSync() {
    return this.send({
      type: 'sync.request'
    });
  }

  onMessage(callback) {
    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      callback(message);
    };
  }
}
```

## Best Practices

1. **Always authenticate** before sending other messages
2. **Use keep-alive pings** to detect connection drops
3. **Handle reconnection** gracefully with exponential backoff
4. **Serialize/deserialize** all data properly
5. **Validate message types** before processing
6. **Log all errors** for debugging
7. **Use appropriate priorities** for notifications
8. **Clean up subscriptions** when done

## Rate Limits

- POST /devices/initiate-pairing: 10/hour per IP
- POST /devices/complete-pairing: 10/hour per IP
- GET /api/* : 100/15min per IP
- WebSocket: Monitored (burst-friendly)

## Pagination

Endpoints that return lists support pagination:

```
GET /api/activities?limit=50&offset=0
```

- `limit`: Number of items to return (default: 50, max: 500)
- `offset`: Number of items to skip (default: 0)

## Support

For issues and questions:
- Check logs at `~/.yami/remote-gateway.log`
- Review architecture at `~/.yami/REMOTE_ACCESS_ARCHITECTURE.md`
- Test connectivity with `/api/health`
