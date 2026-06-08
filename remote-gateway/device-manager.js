/**
 * Device Manager
 * 
 * Gerencia pairing, autenticação e autorização de dispositivos remotos
 */

import { randomBytes } from 'crypto';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { EventEmitter } from 'events';

class DeviceManager extends EventEmitter {
  constructor(yamiHome, logger) {
    super();
    this.yamiHome = yamiHome;
    this.logger = logger;
    this.pairedDevicesFile = join(yamiHome, 'devices', 'pairing-remote.json');
    this.pendingPairingFile = join(yamiHome, 'devices', 'pending-remote.json');
    
    this.pairedDevices = new Map();
    this.pendingPairings = new Map();
    this.pairingCodes = new Map(); // Temporary pairing codes
  }

  /**
   * Initialize manager
   */
  async initialize() {
    try {
      this.loadPairedDevices();
      this.loadPendingPairings();
      this.logger.info('Device Manager initialized');
    } catch (err) {
      this.logger.error('Failed to initialize Device Manager:', err);
      throw err;
    }
  }

  /**
   * Load paired devices from storage
   */
  loadPairedDevices() {
    try {
      const data = readFileSync(this.pairedDevicesFile, 'utf8');
      const devices = JSON.parse(data);
      
      Object.values(devices).forEach(device => {
        this.pairedDevices.set(device.deviceId, device);
      });

      this.logger.info(`Loaded ${this.pairedDevices.size} paired devices`);
    } catch (err) {
      if (err.code !== 'ENOENT') {
        this.logger.warn('Failed to load paired devices:', err);
      }
    }
  }

  /**
   * Load pending pairings from storage
   */
  loadPendingPairings() {
    try {
      const data = readFileSync(this.pendingPairingFile, 'utf8');
      const pairings = JSON.parse(data);
      
      Object.values(pairings).forEach(pairing => {
        this.pendingPairings.set(pairing.pairingCode, pairing);
      });

      this.logger.info(`Loaded ${this.pendingPairings.size} pending pairings`);
    } catch (err) {
      if (err.code !== 'ENOENT') {
        this.logger.warn('Failed to load pending pairings:', err);
      }
    }
  }

  /**
   * Save paired devices to storage
   */
  savePairedDevices() {
    try {
      const devices = {};
      this.pairedDevices.forEach((device, id) => {
        devices[id] = device;
      });
      writeFileSync(this.pairedDevicesFile, JSON.stringify(devices, null, 2), 'utf8');
    } catch (err) {
      this.logger.error('Failed to save paired devices:', err);
    }
  }

  /**
   * Save pending pairings to storage
   */
  savePendingPairings() {
    try {
      const pairings = {};
      this.pendingPairings.forEach((pairing, code) => {
        pairings[code] = pairing;
      });
      writeFileSync(this.pendingPairingFile, JSON.stringify(pairings, null, 2), 'utf8');
    } catch (err) {
      this.logger.error('Failed to save pending pairings:', err);
    }
  }

  /**
   * Initiate device pairing
   * Returns a temporary pairing code
   */
  initiatePairing(deviceInfo) {
    const pairingCode = this.generatePairingCode();
    const expiresAt = Date.now() + (5 * 60 * 1000); // 5 minutes

    const pending = {
      pairingCode,
      displayName: deviceInfo.displayName || 'Unknown Device',
      platform: deviceInfo.platform || 'unknown',
      clientId: deviceInfo.clientId || 'unknown',
      initiatedAt: Date.now(),
      expiresAt
    };

    this.pendingPairings.set(pairingCode, pending);
    this.pairingCodes.set(pairingCode, pending);
    this.savePendingPairings();

    // Clean up expired codes periodically
    setTimeout(() => {
      if (this.pairingCodes.has(pairingCode)) {
        this.pairingCodes.delete(pairingCode);
      }
    }, 5 * 60 * 1000);

    this.logger.info(`Pairing initiated: ${pairingCode} for ${deviceInfo.displayName}`);
    return pairingCode;
  }

  /**
   * Complete device pairing
   */
  completePairing(pairingCode, publicKey) {
    const pending = this.pairingCodes.get(pairingCode);
    if (!pending) {
      throw new Error('Invalid or expired pairing code');
    }

    if (pending.expiresAt < Date.now()) {
      this.pairingCodes.delete(pairingCode);
      this.pendingPairings.delete(pairingCode);
      throw new Error('Pairing code has expired');
    }

    const deviceId = this.generateDeviceId();
    const sessionToken = this.generateSessionToken();

    const device = {
      deviceId,
      displayName: pending.displayName,
      platform: pending.platform,
      clientId: pending.clientId,
      publicKey,
      role: 'operator',
      roles: ['operator'],
      scopes: [
        'remote.status.read',
        'remote.tasks.read',
        'remote.chat.write',
        'remote.voice.write',
        'remote.activities.read',
        'remote.automation.monitor'
      ],
      tokens: {
        session: {
          token: sessionToken,
          role: 'operator',
          scopes: [
            'remote.status.read',
            'remote.tasks.read',
            'remote.chat.write',
            'remote.voice.write',
            'remote.activities.read',
            'remote.automation.monitor'
          ],
          createdAtMs: Date.now(),
          expiresAtMs: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
        }
      },
      createdAtMs: Date.now(),
      approvedAtMs: Date.now(),
      lastSeenAtMs: Date.now(),
      connectionStatus: 'offline',
      isActive: true
    };

    this.pairedDevices.set(deviceId, device);
    this.pairingCodes.delete(pairingCode);
    this.pendingPairings.delete(pairingCode);
    this.savePairedDevices();
    this.savePendingPairings();

    this.logger.info(`Device paired: ${deviceId} (${device.displayName})`);
    this.emit('device:paired', { deviceId, device });

    return {
      deviceId,
      token: sessionToken,
      expiresAt: device.tokens.session.expiresAtMs,
      message: 'Device paired successfully'
    };
  }

  /**
   * Validate device authentication
   */
  validateDevice(deviceId, token, publicKey) {
    const device = this.pairedDevices.get(deviceId);
    
    if (!device) {
      return { valid: false, reason: 'Device not found' };
    }

    if (!device.isActive) {
      return { valid: false, reason: 'Device is disabled' };
    }

    // Check session token
    const sessionToken = device.tokens.session;
    if (!sessionToken || sessionToken.token !== token) {
      return { valid: false, reason: 'Invalid token' };
    }

    if (sessionToken.expiresAtMs && sessionToken.expiresAtMs < Date.now()) {
      return { valid: false, reason: 'Token expired' };
    }

    // Check public key matches
    if (device.publicKey !== publicKey) {
      return { valid: false, reason: 'Public key mismatch' };
    }

    return { valid: true, device };
  }

  /**
   * Set device connection status
   */
  setDeviceStatus(deviceId, status) {
    const device = this.pairedDevices.get(deviceId);
    if (!device) return;

    device.connectionStatus = status;
    device.lastSeenAtMs = Date.now();

    if (status === 'online') {
      device.lastOnlineAt = new Date().toISOString();
    }

    this.savePairedDevices();
    this.emit('device:status-changed', { deviceId, status });
  }

  /**
   * Get device info
   */
  getDevice(deviceId) {
    return this.pairedDevices.get(deviceId);
  }

  /**
   * List all paired devices
   */
  listDevices() {
    return Array.from(this.pairedDevices.values());
  }

  /**
   * List active/online devices
   */
  listActiveDevices() {
    return Array.from(this.pairedDevices.values()).filter(d => d.connectionStatus === 'online');
  }

  /**
   * Remove device pairing
   */
  removeDevice(deviceId) {
    const device = this.pairedDevices.get(deviceId);
    if (!device) return false;

    this.pairedDevices.delete(deviceId);
    this.savePairedDevices();
    this.logger.info(`Device removed: ${deviceId}`);
    this.emit('device:removed', { deviceId });
    return true;
  }

  /**
   * Disable device (revoke access)
   */
  disableDevice(deviceId) {
    const device = this.pairedDevices.get(deviceId);
    if (!device) return false;

    device.isActive = false;
    this.savePairedDevices();
    this.logger.info(`Device disabled: ${deviceId}`);
    this.emit('device:disabled', { deviceId });
    return true;
  }

  /**
   * Enable device
   */
  enableDevice(deviceId) {
    const device = this.pairedDevices.get(deviceId);
    if (!device) return false;

    device.isActive = true;
    this.savePairedDevices();
    this.logger.info(`Device enabled: ${deviceId}`);
    this.emit('device:enabled', { deviceId });
    return true;
  }

  /**
   * Rotate session token for a device
   */
  rotateSessionToken(deviceId) {
    const device = this.pairedDevices.get(deviceId);
    if (!device) return null;

    const newToken = this.generateSessionToken();
    device.tokens.session.token = newToken;
    device.tokens.session.rotatedAtMs = Date.now();
    device.tokens.session.expiresAtMs = Date.now() + (24 * 60 * 60 * 1000);

    this.savePairedDevices();
    this.logger.info(`Token rotated for device: ${deviceId}`);
    return newToken;
  }

  /**
   * Generate a random pairing code
   */
  generatePairingCode() {
    return randomBytes(6).toString('hex').toUpperCase();
  }

  /**
   * Generate a device ID
   */
  generateDeviceId() {
    return randomBytes(32).toString('hex');
  }

  /**
   * Generate a session token
   */
  generateSessionToken() {
    return randomBytes(32).toString('base64').replace(/[+/=]/g, '');
  }
}

export default DeviceManager;
