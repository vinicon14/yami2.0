/**
 * YAMI Remote Gateway Server
 * 
 * Gerencia acesso remoto multiplataforma ao YAMI
 * - WebSocket real-time communication
 * - Device pairing e autenticação
 * - State synchronization entre dispositivos
 * - Notificações push
 * - Session continuity
 */

import express from 'express';
import compression from 'compression';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { EventEmitter } from 'events';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import Logger from './utils/logger.js';
import DeviceManager from './device-manager.js';
import SessionManager from './session-manager.js';
import SyncEngine from './sync-engine.js';
import StatusMonitor from './status-monitor.js';
import ConversationCache from './conversation-cache.js';
import NotificationHub from './notification-hub.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class RemoteGatewayServer extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      port: config.port || 18790,
      portBackup: config.portBackup || 18791,
      host: config.host || 'localhost',
      yamiHome: config.yamiHome || join(__dirname, '..'),
      tlsKey: config.tlsKey || null,
      tlsCert: config.tlsCert || null,
      ...config
    };

    this.logger = new Logger('RemoteGateway', {
      logFile: join(this.config.yamiHome, 'remote-gateway.log')
    });

    this.app = express();
    this.httpServer = null;
    this.wss = null;
    
    this.deviceManager = null;
    this.sessionManager = null;
    this.syncEngine = null;
    this.statusMonitor = null;
    this.conversationCache = null;
    this.notificationHub = null;

    this.clients = new Map(); // Map<device_id, WebSocket>
    this.setupMiddleware();
    this.setupRoutes();
    this.setupEventBus();
  }

  /**
   * Setup Express middleware
   */
  setupMiddleware() {
    // Security
    this.app.use(helmet());
    this.app.use(cors({
      origin: [
        'http://localhost:3000',
        'http://localhost:8080',
        'https://pcvini.tail585c88.ts.net',
        ...(this.config.allowedOrigins || [])
      ],
      credentials: true
    }));

    // Compression
    this.app.use(compression());

    // Parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ limit: '10mb', extended: true }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100,
      message: 'Too many requests from this IP'
    });
    this.app.use('/api/', limiter);

    // Request logging
    this.app.use((req, res, next) => {
      this.logger.debug(`${req.method} ${req.path}`);
      next();
    });
  }

  /**
   * Setup API routes
   */
  setupRoutes() {
    const router = express.Router();

    // Health check
    router.get('/health', (req, res) => {
      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        connectedClients: this.clients.size
      });
    });

    // Status endpoints
    router.get('/status', (req, res) => {
      const status = {
        server: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          connectedClients: this.clients.size
        },
        yami: this.statusMonitor?.getCurrentStatus() || null,
        timestamp: new Date().toISOString()
      };
      res.json(status);
    });

    // Device pairing endpoints
    router.post('/devices/initiate-pairing', (req, res) => {
      try {
        const { displayName, platform, clientId } = req.body;
        const pairingCode = this.deviceManager.initiatePairing({
          displayName,
          platform,
          clientId
        });
        res.json({ pairingCode, expiresIn: 300 });
      } catch (err) {
        this.logger.error('Pairing error:', err);
        res.status(400).json({ error: err.message });
      }
    });

    router.post('/devices/complete-pairing', (req, res) => {
      try {
        const { pairingCode, publicKey } = req.body;
        const result = this.deviceManager.completePairing(pairingCode, publicKey);
        res.json(result);
      } catch (err) {
        this.logger.error('Pairing completion error:', err);
        res.status(400).json({ error: err.message });
      }
    });

    // Conversation endpoints
    router.get('/conversations', (req, res) => {
      try {
        const conversations = this.conversationCache.listConversations();
        res.json(conversations);
      } catch (err) {
        this.logger.error('Conversation listing error:', err);
        res.status(500).json({ error: err.message });
      }
    });

    router.get('/conversations/:id', (req, res) => {
      try {
        const conversation = this.conversationCache.getConversation(req.params.id);
        if (!conversation) {
          return res.status(404).json({ error: 'Conversation not found' });
        }
        res.json(conversation);
      } catch (err) {
        this.logger.error('Conversation fetch error:', err);
        res.status(500).json({ error: err.message });
      }
    });

    // Activity log endpoints
    router.get('/activities', (req, res) => {
      try {
        const { limit = 50, offset = 0 } = req.query;
        const activities = this.conversationCache.getActivities(
          parseInt(limit),
          parseInt(offset)
        );
        res.json(activities);
      } catch (err) {
        this.logger.error('Activity fetch error:', err);
        res.status(500).json({ error: err.message });
      }
    });

    // Notifications endpoints
    router.get('/notifications/history', (req, res) => {
      try {
        const { limit = 20 } = req.query;
        const notifications = this.notificationHub.getHistory(parseInt(limit));
        res.json(notifications);
      } catch (err) {
        this.logger.error('Notifications fetch error:', err);
        res.status(500).json({ error: err.message });
      }
    });

    this.app.use('/api', router);

    // 404 handler
    this.app.use((req, res) => {
      res.status(404).json({ error: 'Not found' });
    });

    // Error handler
    this.app.use((err, req, res, next) => {
      this.logger.error('Request error:', err);
      res.status(500).json({ error: 'Internal server error' });
    });
  }

  /**
   * Setup WebSocket server
   */
  setupWebSocketServer() {
    this.wss = new WebSocketServer({ server: this.httpServer });

    this.wss.on('connection', (ws, req) => {
      this.handleWebSocketConnection(ws, req);
    });

    this.logger.info('WebSocket server initialized');
  }

  /**
   * Handle new WebSocket connection
   */
  handleWebSocketConnection(ws, req) {
    const remoteAddr = req.socket.remoteAddress;
    this.logger.debug(`New WebSocket connection from ${remoteAddr}`);

    let deviceId = null;
    let device = null;

    // Message handler
    ws.on('message', (data) => {
      this.handleWebSocketMessage(ws, data, { deviceId, device });
    });

    // Close handler
    ws.on('close', () => {
      this.logger.debug(`Connection closed for device ${deviceId}`);
      if (deviceId) {
        this.clients.delete(deviceId);
        this.deviceManager.setDeviceStatus(deviceId, 'offline');
        this.emit('device:disconnected', { deviceId });
      }
    });

    // Error handler
    ws.on('error', (err) => {
      this.logger.error(`WebSocket error for device ${deviceId}:`, err);
    });

    // Authenticate on first message
    ws.once('message', (data) => {
      try {
        const message = JSON.parse(data);
        if (message.type === 'auth.init') {
          const { deviceId: id, token, publicKey } = message.payload;
          
          // Validate device
          const validation = this.deviceManager.validateDevice(id, token, publicKey);
          if (!validation.valid) {
            ws.close(1008, 'Authentication failed');
            return;
          }

          deviceId = id;
          device = validation.device;
          this.clients.set(deviceId, ws);
          this.deviceManager.setDeviceStatus(deviceId, 'online');

          // Send auth success
          ws.send(JSON.stringify({
            id: message.id,
            type: 'auth.success',
            payload: {
              sessionId: this.sessionManager.createSession(deviceId, device),
              deviceId,
              timestamp: Date.now()
            }
          }));

          this.logger.info(`Device authenticated: ${deviceId}`);
          this.emit('device:connected', { deviceId, device });

          // Send initial status
          this.sendInitialStatus(ws, deviceId);
        }
      } catch (err) {
        this.logger.error('Authentication error:', err);
        ws.close(1011, 'Server error');
      }
    });
  }

  /**
   * Handle WebSocket message
   */
  handleWebSocketMessage(ws, data, context) {
    const { deviceId, device } = context;

    if (!deviceId) {
      this.logger.warn('Received message from unauthenticated connection');
      ws.close(1008, 'Not authenticated');
      return;
    }

    try {
      const message = JSON.parse(data);
      this.logger.debug(`Message from ${deviceId}: ${message.type}`);

      // Route message based on type
      switch (message.type) {
        case 'chat.send':
          this.handleChatMessage(deviceId, device, message);
          break;
        case 'voice.send':
          this.handleVoiceMessage(deviceId, device, message);
          break;
        case 'sync.request':
          this.handleSyncRequest(deviceId, device, message);
          break;
        case 'status.ping':
          this.handlePing(ws, deviceId, message);
          break;
        case 'task.acknowledge':
          this.handleTaskAcknowledge(deviceId, device, message);
          break;
        case 'automation.subscribe':
          this.handleAutomationSubscribe(deviceId, device, message);
          break;
        default:
          this.logger.warn(`Unknown message type: ${message.type}`);
          ws.send(JSON.stringify({
            id: message.id,
            type: 'error.unknown',
            payload: { error: 'Unknown message type' }
          }));
      }
    } catch (err) {
      this.logger.error('Message handling error:', err);
      ws.send(JSON.stringify({
        type: 'error.validation',
        payload: { error: 'Invalid message format' }
      }));
    }
  }

  /**
   * Handle chat message from remote device
   */
  handleChatMessage(deviceId, device, message) {
    const { payload, id } = message;
    
    // Validate scopes
    if (!device.scopes.includes('remote.chat.write')) {
      this.logger.warn(`Device ${deviceId} lacks chat.write scope`);
      return;
    }

    // Store in conversation cache
    const conversationId = payload.conversationId || this.conversationCache.createConversation();
    this.conversationCache.addMessage(conversationId, {
      id: payload.id || `msg_${Date.now()}`,
      role: 'user',
      content: payload.content,
      timestamp: new Date(),
      device: deviceId,
      platform: device.platform
    });

    // Emit event for YAMI runtime to process
    this.emit('chat:message', {
      deviceId,
      conversationId,
      message: payload.content,
      metadata: payload.metadata || {}
    });

    this.logger.info(`Chat message from ${deviceId} in conversation ${conversationId}`);
  }

  /**
   * Handle voice message from remote device
   */
  handleVoiceMessage(deviceId, device, message) {
    const { payload, id } = message;

    // Validate scopes
    if (!device.scopes.includes('remote.voice.write')) {
      this.logger.warn(`Device ${deviceId} lacks voice.write scope`);
      return;
    }

    // Emit event for voice processing
    this.emit('voice:message', {
      deviceId,
      audioData: payload.audioData,
      format: payload.format || 'wav',
      language: payload.language || 'pt-BR'
    });

    this.logger.info(`Voice message from ${deviceId}`);
  }

  /**
   * Handle sync request
   */
  handleSyncRequest(deviceId, device, message) {
    const { id } = message;
    const ws = this.clients.get(deviceId);
    if (!ws) return;

    // Send complete state
    const state = {
      tasks: this.syncEngine.getCurrentTasks(),
      automations: this.syncEngine.getCurrentAutomations(),
      notifications: this.notificationHub.getUnread(deviceId),
      conversations: this.conversationCache.listRecentConversations(5),
      status: this.statusMonitor.getCurrentStatus()
    };

    ws.send(JSON.stringify({
      id,
      type: 'sync.full',
      payload: state,
      timestamp: Date.now()
    }));

    this.logger.debug(`Sent full sync to ${deviceId}`);
  }

  /**
   * Handle ping
   */
  handlePing(ws, deviceId, message) {
    const { id } = message;
    ws.send(JSON.stringify({
      id,
      type: 'status.pong',
      timestamp: Date.now()
    }));
  }

  /**
   * Handle task acknowledge
   */
  handleTaskAcknowledge(deviceId, device, message) {
    const { taskId } = message.payload;
    this.logger.debug(`Task ${taskId} acknowledged by ${deviceId}`);
  }

  /**
   * Handle automation subscribe
   */
  handleAutomationSubscribe(deviceId, device, message) {
    const { automationId } = message.payload;
    this.logger.info(`Device ${deviceId} subscribed to automation ${automationId}`);
  }

  /**
   * Send initial status to newly connected device
   */
  sendInitialStatus(ws, deviceId) {
    const status = {
      timestamp: Date.now(),
      server: {
        time: new Date().toISOString(),
        version: '1.0.0'
      },
      yami: this.statusMonitor.getCurrentStatus(),
      connectedDevices: this.clients.size
    };

    ws.send(JSON.stringify({
      type: 'status.initial',
      payload: status
    }));
  }

  /**
   * Setup event bus for internal communication
   */
  setupEventBus() {
    // When a task is updated, broadcast to all clients
    this.syncEngine.on('task:updated', (taskUpdate) => {
      this.broadcastToAllClients({
        type: 'task.updated',
        payload: taskUpdate,
        timestamp: Date.now()
      });
    });

    // When activity is logged
    this.syncEngine.on('activity:logged', (activity) => {
      this.broadcastToAllClients({
        type: 'activity.log',
        payload: activity,
        timestamp: Date.now()
      });
    });

    // When automation progresses
    this.syncEngine.on('automation:progress', (progress) => {
      this.broadcastToAllClients({
        type: 'automation.progress',
        payload: progress,
        timestamp: Date.now()
      });
    });

    // When status changes
    this.statusMonitor.on('status:changed', (newStatus) => {
      this.broadcastToAllClients({
        type: 'status.update',
        payload: newStatus,
        timestamp: Date.now()
      });
    });

    // When notification is created
    this.notificationHub.on('notification:created', (notification) => {
      this.broadcastToAllClients({
        type: 'notification.push',
        payload: notification,
        timestamp: Date.now()
      });
    });

    this.logger.info('Event bus initialized');
  }

  /**
   * Broadcast message to all connected clients
   */
  broadcastToAllClients(message) {
    if (this.clients.size === 0) return;

    const data = JSON.stringify(message);
    let successCount = 0;
    let failureCount = 0;

    this.clients.forEach((ws, deviceId) => {
      if (ws.readyState === 1) { // WebSocket.OPEN
        ws.send(data, (err) => {
          if (err) {
            failureCount++;
            this.logger.error(`Failed to send to ${deviceId}:`, err);
          } else {
            successCount++;
          }
        });
      }
    });

    if (failureCount > 0) {
      this.logger.warn(`Broadcast: ${successCount} success, ${failureCount} failures`);
    }
  }

  /**
   * Send message to specific device
   */
  sendToDevice(deviceId, message) {
    const ws = this.clients.get(deviceId);
    if (!ws) {
      this.logger.warn(`Device ${deviceId} not connected`);
      return false;
    }

    ws.send(JSON.stringify(message), (err) => {
      if (err) {
        this.logger.error(`Failed to send to ${deviceId}:`, err);
        return false;
      }
    });

    return true;
  }

  /**
   * Initialize all modules
   */
  async initialize() {
    try {
      this.logger.info('Initializing Remote Gateway...');

      // Initialize managers
      this.deviceManager = new DeviceManager(this.config.yamiHome, this.logger);
      this.sessionManager = new SessionManager(this.config.yamiHome, this.logger);
      this.syncEngine = new SyncEngine(this.config.yamiHome, this.logger);
      this.statusMonitor = new StatusMonitor(this.config.yamiHome, this.logger);
      this.conversationCache = new ConversationCache(this.config.yamiHome, this.logger);
      this.notificationHub = new NotificationHub(this.config.yamiHome, this.logger);

      // Initialize each manager
      await this.deviceManager.initialize();
      await this.sessionManager.initialize();
      await this.syncEngine.initialize();
      await this.statusMonitor.initialize();
      await this.conversationCache.initialize();
      await this.notificationHub.initialize();

      this.logger.info('All modules initialized successfully');
    } catch (err) {
      this.logger.error('Initialization error:', err);
      throw err;
    }
  }

  /**
   * Start the server
   */
  async start() {
    try {
      await this.initialize();

      this.httpServer = createServer(this.app);
      this.setupWebSocketServer();

      await new Promise((resolve, reject) => {
        this.httpServer.listen(this.config.port, this.config.host, () => {
          this.logger.info(
            `Remote Gateway listening on ${this.config.host}:${this.config.port}`
          );
          resolve();
        }).on('error', reject);
      });

      this.logger.info('Remote Gateway started successfully');
    } catch (err) {
      this.logger.error('Failed to start Remote Gateway:', err);
      process.exit(1);
    }
  }

  /**
   * Stop the server gracefully
   */
  async stop() {
    try {
      this.logger.info('Stopping Remote Gateway...');

      // Close all WebSocket connections
      this.wss?.clients.forEach((ws) => {
        ws.close(1001, 'Server shutting down');
      });

      // Close HTTP server
      await new Promise((resolve) => {
        this.httpServer?.close(resolve);
      });

      this.logger.info('Remote Gateway stopped');
    } catch (err) {
      this.logger.error('Error during shutdown:', err);
    }
  }
}

// Start server if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new RemoteGatewayServer();
  
  server.start().catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });

  process.on('SIGINT', () => {
    server.stop().then(() => process.exit(0));
  });

  process.on('SIGTERM', () => {
    server.stop().then(() => process.exit(0));
  });
}

export default RemoteGatewayServer;
