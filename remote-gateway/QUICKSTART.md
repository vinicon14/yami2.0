# YAMI Remote Gateway - Quick Start Guide

## Installation

### 1. Install Dependencies

```bash
cd C:\Users\vinim\.yami\remote-gateway
npm install
```

### 2. Start the Server

```bash
npm start
```

The server will start on `http://localhost:18790`

**Output**:
```
[YAMI] Remote Gateway listening on localhost:18790
[YAMI] WebSocket server initialized
[YAMI] Device Manager initialized
[YAMI] Session Manager initialized
[YAMI] Sync Engine initialized
[YAMI] Status Monitor initialized
[YAMI] Conversation Cache initialized
[YAMI] Notification Hub initialized
[YAMI] Remote Gateway started successfully
```

## Basic Usage

### 1. Check Server Health

```bash
curl http://localhost:18790/api/health
```

**Response**:
```json
{
  "status": "ok",
  "timestamp": "2026-06-08T14:30:00.000Z",
  "uptime": 3600,
  "connectedClients": 0
}
```

### 2. Initiate Device Pairing

```bash
curl -X POST http://localhost:18790/api/devices/initiate-pairing \
  -H "Content-Type: application/json" \
  -d '{
    "displayName": "My iPhone",
    "platform": "ios",
    "clientId": "mobile-app"
  }'
```

**Response**:
```json
{
  "pairingCode": "A7F3C2E9",
  "expiresIn": 300
}
```

### 3. Complete Device Pairing

```bash
curl -X POST http://localhost:18790/api/devices/complete-pairing \
  -H "Content-Type: application/json" \
  -d '{
    "pairingCode": "A7F3C2E9",
    "publicKey": "UiOECIdy9XYrdAyXuEe_UaO-20l-OuZRqqZ-t-cWO4Q"
  }'
```

**Response**:
```json
{
  "deviceId": "fa0adda703b67da705184765c90ec4067ac80dde161eb4490bd4077b7ff9033e",
  "token": "wMW6-UYzxqOfjvVWsltVh7cmSqFr2H0HVLtPiooNkJA",
  "expiresAt": 1717948800000,
  "message": "Device paired successfully"
}
```

### 4. Connect via WebSocket

```javascript
const ws = new WebSocket('ws://localhost:18790/socket');

ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'auth.init',
    payload: {
      deviceId: 'fa0adda703b67da705184765c90ec4067ac80dde161eb4490bd4077b7ff9033e',
      token: 'wMW6-UYzxqOfjvVWsltVh7cmSqFr2H0HVLtPiooNkJA',
      publicKey: 'UiOECIdy9XYrdAyXuEe_UaO-20l-OuZRqqZ-t-cWO4Q'
    }
  }));
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('Received:', message);
};
```

### 5. Send a Chat Message

```javascript
ws.send(JSON.stringify({
  id: 'msg_1',
  type: 'chat.send',
  payload: {
    conversationId: 'conv_new',
    content: 'Hello YAMI!'
  }
}));
```

### 6. Request Full Sync

```javascript
ws.send(JSON.stringify({
  id: 'sync_1',
  type: 'sync.request'
}));
```

## Development

### Run in Watch Mode

```bash
npm run dev
```

### Run Tests

```bash
npm test
```

### Check Logs

```bash
tail -f C:\Users\vinim\.yami\remote-gateway.log
```

## Architecture Overview

```
┌─────────────────────────────────────────┐
│      YAMI Remote Gateway Server         │
│                                         │
│  WebSocket Server (ws://localhost:18790)│
│  REST API (http://localhost:18790/api)  │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │  Core Managers                   │  │
│  │  - Device Manager                │  │
│  │  - Session Manager               │  │
│  │  - Sync Engine                   │  │
│  │  - Status Monitor                │  │
│  │  - Conversation Cache            │  │
│  │  - Notification Hub              │  │
│  └──────────────────────────────────┘  │
│                                         │
└─────────────────────────────────────────┘
         ▲                        ▲
    Connected Devices      Broadcasts
    (Multiple Platforms)   (Real-time)
```

## Key Files

- `server.js` - Main gateway server
- `device-manager.js` - Device pairing & authentication
- `session-manager.js` - Session & continuity management
- `sync-engine.js` - Real-time synchronization
- `status-monitor.js` - Status monitoring
- `conversation-cache.js` - Conversation persistence
- `notification-hub.js` - Notification management
- `utils/logger.js` - Logging utility

## Common Tasks

### Create a Task

```javascript
ws.send(JSON.stringify({
  type: 'chat.send',
  payload: {
    conversationId: 'conv_tasks',
    content: 'Create a task to configure the system'
  }
}));
```

### Get Conversations

```bash
curl http://localhost:18790/api/conversations
```

### Get Current Status

```bash
curl http://localhost:18790/api/status
```

### View Notifications

```bash
curl http://localhost:18790/api/notifications/history?limit=20
```

## Troubleshooting

### Server won't start

1. Check if port 18790 is in use:
   ```bash
   netstat -ano | findstr :18790
   ```

2. Kill the process using the port:
   ```bash
   taskkill /PID <PID> /F
   ```

3. Try a different port in `server.js`

### Connection refused

1. Ensure the server is running:
   ```bash
   curl http://localhost:18790/api/health
   ```

2. Check firewall settings

3. Verify the correct host/port

### Authentication failed

1. Verify the device token is correct
2. Check the pairing code hasn't expired (5 minute expiry)
3. Complete the pairing process again

### WebSocket connection drops

1. Implement reconnection logic with exponential backoff
2. Send ping messages every 30 seconds to keep connection alive
3. Check logs for error messages

## Environment Variables

Create a `.env` file in the `remote-gateway` directory:

```env
NODE_ENV=development
LOG_LEVEL=debug
PORT=18790
HOST=localhost
YAMI_HOME=C:\Users\vinim\.yami
```

## Next Steps

1. Create a web client (React) at `clients/web-ui`
2. Create a mobile client (React Native) at `clients/mobile-framework`
3. Implement encryption for sensitive data
4. Add database persistence for sessions
5. Deploy to production with Tailscale

## Documentation

- **Architecture**: `../REMOTE_ACCESS_ARCHITECTURE.md`
- **API Documentation**: `API_DOCUMENTATION.md`
- **Device Pairing**: See authentication section in API docs

## Support

For issues:
1. Check the server logs at `~/.yami/remote-gateway.log`
2. Review the API documentation
3. Test with `curl` or Postman
4. Enable debug logging: `LOG_LEVEL=debug npm start`

## Performance Considerations

- **Max concurrent connections**: 100 (configurable)
- **Message queue**: Unlimited
- **Activity retention**: Last 10,000 activities
- **Notification retention**: Last 10,000 notifications
- **Memory usage**: ~50MB base + 1MB per 100 devices

## Security Notes

- All tokens expire after 24 hours
- Devices must be explicitly paired
- Public key validation on every message
- Rate limiting on HTTP endpoints
- WebSocket connections authenticated

## Production Deployment

For production:

1. Enable HTTPS/WSS
2. Set up proper authentication backend
3. Use database for persistent storage
4. Configure load balancing
5. Implement monitoring and alerting
6. Deploy with PM2 or similar process manager
7. Set up log rotation

See deployment guide: `../DEPLOYMENT.md` (coming soon)
