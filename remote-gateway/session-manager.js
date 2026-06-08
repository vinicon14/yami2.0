/**
 * Session Manager
 * 
 * Gerencia sessões e continuidade entre dispositivos
 */

import { randomBytes } from 'crypto';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { EventEmitter } from 'events';

class SessionManager extends EventEmitter {
  constructor(yamiHome, logger) {
    super();
    this.yamiHome = yamiHome;
    this.logger = logger;
    this.sessionsDir = join(yamiHome, 'remote-gateway', 'sessions');
    this.sessions = new Map();
  }

  /**
   * Initialize manager
   */
  async initialize() {
    try {
      mkdirSync(this.sessionsDir, { recursive: true });
      this.loadSessions();
      this.logger.info('Session Manager initialized');
    } catch (err) {
      this.logger.error('Failed to initialize Session Manager:', err);
      throw err;
    }
  }

  /**
   * Load sessions from storage
   */
  loadSessions() {
    try {
      // For now, sessions are in-memory only
      // In production, they could be loaded from disk/database
      this.logger.debug('Sessions loaded from storage');
    } catch (err) {
      this.logger.warn('Failed to load sessions:', err);
    }
  }

  /**
   * Create a new session for a device
   */
  createSession(deviceId, device) {
    const sessionId = this.generateSessionId();
    
    const session = {
      sessionId,
      userId: 'default', // TODO: extract from device or config
      deviceId,
      createdAt: new Date().toISOString(),
      lastActivityAt: new Date().toISOString(),
      devices: [deviceId],
      primaryDevice: deviceId,
      conversationContext: {
        lastMessageId: null,
        threadId: null,
        summary: null,
        variables: {}
      },
      state: {
        activeTask: null,
        selectedFilter: null,
        viewMode: 'grid'
      },
      isActive: true
    };

    this.sessions.set(sessionId, session);
    this.logger.info(`Session created: ${sessionId} for device ${deviceId}`);
    this.emit('session:created', { sessionId, deviceId });

    return sessionId;
  }

  /**
   * Get session by ID
   */
  getSession(sessionId) {
    return this.sessions.get(sessionId);
  }

  /**
   * Get session by device ID
   */
  getSessionByDevice(deviceId) {
    for (const session of this.sessions.values()) {
      if (session.devices.includes(deviceId)) {
        return session;
      }
    }
    return null;
  }

  /**
   * Add device to session (multi-device support)
   */
  addDeviceToSession(sessionId, deviceId) {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    if (!session.devices.includes(deviceId)) {
      session.devices.push(deviceId);
      session.lastActivityAt = new Date().toISOString();
      this.logger.info(`Device ${deviceId} added to session ${sessionId}`);
      this.emit('device:added-to-session', { sessionId, deviceId });
    }

    return true;
  }

  /**
   * Remove device from session
   */
  removeDeviceFromSession(sessionId, deviceId) {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    const index = session.devices.indexOf(deviceId);
    if (index > -1) {
      session.devices.splice(index, 1);
      this.logger.info(`Device ${deviceId} removed from session ${sessionId}`);
      this.emit('device:removed-from-session', { sessionId, deviceId });

      // If no devices left, close session
      if (session.devices.length === 0) {
        this.closeSession(sessionId);
      }
    }

    return true;
  }

  /**
   * Update conversation context in session
   */
  updateConversationContext(sessionId, context) {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    session.conversationContext = {
      ...session.conversationContext,
      ...context,
      lastUpdatedAt: new Date().toISOString()
    };

    this.logger.debug(`Conversation context updated for session ${sessionId}`);
    this.emit('session:context-updated', { sessionId, context: session.conversationContext });

    return true;
  }

  /**
   * Update session state (UI state, filters, etc)
   */
  updateSessionState(sessionId, stateUpdate) {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    session.state = {
      ...session.state,
      ...stateUpdate
    };
    session.lastActivityAt = new Date().toISOString();

    this.logger.debug(`State updated for session ${sessionId}`);
    this.emit('session:state-updated', { sessionId, state: session.state });

    return true;
  }

  /**
   * Get conversation context
   */
  getConversationContext(sessionId) {
    const session = this.sessions.get(sessionId);
    return session ? session.conversationContext : null;
  }

  /**
   * Get session state
   */
  getSessionState(sessionId) {
    const session = this.sessions.get(sessionId);
    return session ? session.state : null;
  }

  /**
   * Record activity in session
   */
  recordActivity(sessionId, activityType, data = {}) {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    session.lastActivityAt = new Date().toISOString();
    session.lastActivityType = activityType;
    session.lastActivityData = data;

    this.emit('session:activity', { sessionId, type: activityType, data });
    return true;
  }

  /**
   * Get all active sessions
   */
  getActiveSessions() {
    return Array.from(this.sessions.values()).filter(s => s.isActive);
  }

  /**
   * Close session
   */
  closeSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    session.isActive = false;
    session.closedAt = new Date().toISOString();

    this.logger.info(`Session closed: ${sessionId}`);
    this.emit('session:closed', { sessionId });

    // Remove after 1 hour of inactivity
    setTimeout(() => {
      this.sessions.delete(sessionId);
    }, 60 * 60 * 1000);

    return true;
  }

  /**
   * Synchronize session state across devices
   */
  syncSessionStateToAllDevices(sessionId, state) {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.state = {
      ...session.state,
      ...state
    };

    this.emit('session:sync-to-devices', {
      sessionId,
      devices: session.devices,
      state: session.state
    });

    this.logger.debug(`Session state synced to ${session.devices.length} devices`);
  }

  /**
   * Get session summary for a device
   */
  getSessionSummary(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    return {
      sessionId: session.sessionId,
      devices: session.devices.length,
      primaryDevice: session.primaryDevice,
      conversationContext: session.conversationContext,
      state: session.state,
      lastActivity: session.lastActivityAt,
      isActive: session.isActive
    };
  }

  /**
   * List all sessions
   */
  listSessions() {
    return Array.from(this.sessions.values());
  }

  /**
   * Cleanup inactive sessions
   */
  cleanupInactiveSessions(maxInactivityMs = 24 * 60 * 60 * 1000) {
    const now = Date.now();
    let cleanedCount = 0;

    this.sessions.forEach((session, sessionId) => {
      const lastActivityTime = new Date(session.lastActivityAt).getTime();
      if (now - lastActivityTime > maxInactivityMs) {
        this.sessions.delete(sessionId);
        cleanedCount++;
      }
    });

    if (cleanedCount > 0) {
      this.logger.info(`Cleaned up ${cleanedCount} inactive sessions`);
    }
  }

  /**
   * Generate a session ID
   */
  generateSessionId() {
    return `session_${randomBytes(16).toString('hex')}`;
  }
}

export default SessionManager;
