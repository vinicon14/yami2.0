/**
 * Status Monitor
 * 
 * Monitora e broadcast do status do computador principal e YAMI
 */

import { EventEmitter } from 'events';
import os from 'os';

class StatusMonitor extends EventEmitter {
  constructor(yamiHome, logger) {
    super();
    this.yamiHome = yamiHome;
    this.logger = logger;
    
    this.status = {
      computer: {
        hostname: os.hostname(),
        platform: process.platform,
        uptime: 0,
        isOnline: true,
        lastOnlineAt: new Date().toISOString()
      },
      yami: {
        isRunning: true,
        version: '2026.6.2',
        uptime: 0,
        cpuUsage: 0,
        memoryUsage: 0,
        isRecording: false,
        isBusy: false,
        startedAt: new Date().toISOString()
      },
      tasks: {
        total: 0,
        running: 0,
        completed: 0,
        failed: 0,
        pending: 0
      },
      notifications: {
        unreadCount: 0,
        lastNotification: null
      }
    };

    this.lastStatusCheck = Date.now();
    this.monitoringInterval = null;
  }

  /**
   * Initialize monitor
   */
  async initialize() {
    try {
      this.startMonitoring();
      this.logger.info('Status Monitor initialized');
    } catch (err) {
      this.logger.error('Failed to initialize Status Monitor:', err);
      throw err;
    }
  }

  /**
   * Start monitoring system status
   */
  startMonitoring() {
    this.monitoringInterval = setInterval(() => {
      this.updateStatus();
    }, 10000); // Update every 10 seconds

    // Initial update
    this.updateStatus();
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  /**
   * Update system status
   */
  updateStatus() {
    const previousStatus = { ...this.status };

    // Update computer status
    this.status.computer.uptime = os.uptime();
    this.status.computer.isOnline = true;
    this.status.computer.lastOnlineAt = new Date().toISOString();

    // Update YAMI uptime
    this.status.yami.uptime = process.uptime();

    // Update memory usage
    const memUsage = process.memoryUsage();
    this.status.yami.memoryUsage = Math.round(memUsage.heapUsed / 1024 / 1024); // MB

    // Update CPU usage (simplified)
    const cpus = os.cpus();
    const avgLoad = os.loadavg()[0];
    this.status.yami.cpuUsage = Math.round((avgLoad / cpus.length) * 100);

    // Check if status changed significantly
    if (this.hasSignificantChanges(previousStatus, this.status)) {
      this.emit('status:changed', this.status);
      this.logger.debug('Status changed', this.status);
    }

    this.lastStatusCheck = Date.now();
  }

  /**
   * Check if there are significant changes
   */
  hasSignificantChanges(prev, current) {
    // Check if online status changed
    if (prev.computer.isOnline !== current.computer.isOnline) return true;

    // Check if YAMI running status changed
    if (prev.yami.isRunning !== current.yami.isRunning) return true;

    // Check if tasks changed significantly
    if (prev.tasks.total !== current.tasks.total) return true;
    if (prev.tasks.running !== current.tasks.running) return true;

    // Check if recording/busy status changed
    if (prev.yami.isRecording !== current.yami.isRecording) return true;
    if (prev.yami.isBusy !== current.yami.isBusy) return true;

    return false;
  }

  /**
   * Get current status
   */
  getCurrentStatus() {
    return {
      ...this.status,
      monitoredAt: new Date().toISOString()
    };
  }

  /**
   * Update YAMI status (called from main runtime)
   */
  updateYamiStatus(yamiStatus) {
    const previousYamiStatus = { ...this.status.yami };

    this.status.yami = {
      ...this.status.yami,
      ...yamiStatus,
      lastUpdatedAt: new Date().toISOString()
    };

    // Check if significant change
    if (JSON.stringify(previousYamiStatus) !== JSON.stringify(this.status.yami)) {
      this.emit('status:changed', this.status);
    }
  }

  /**
   * Update tasks summary
   */
  updateTasksSummary(tasksSummary) {
    const previousTasks = { ...this.status.tasks };

    this.status.tasks = {
      ...this.status.tasks,
      ...tasksSummary,
      lastUpdatedAt: new Date().toISOString()
    };

    if (JSON.stringify(previousTasks) !== JSON.stringify(this.status.tasks)) {
      this.emit('status:changed', this.status);
    }
  }

  /**
   * Update notifications count
   */
  updateNotifications(count, lastNotification = null) {
    const previousNotifications = { ...this.status.notifications };

    this.status.notifications = {
      unreadCount: count,
      lastNotification: lastNotification || this.status.notifications.lastNotification
    };

    if (JSON.stringify(previousNotifications) !== JSON.stringify(this.status.notifications)) {
      this.emit('status:changed', this.status);
    }
  }

  /**
   * Set YAMI as busy
   */
  setYamiBusy(isBusy) {
    if (this.status.yami.isBusy !== isBusy) {
      this.status.yami.isBusy = isBusy;
      this.emit('status:changed', this.status);
    }
  }

  /**
   * Set YAMI as recording
   */
  setYamiRecording(isRecording) {
    if (this.status.yami.isRecording !== isRecording) {
      this.status.yami.isRecording = isRecording;
      this.emit('status:changed', this.status);
    }
  }

  /**
   * Get system info
   */
  getSystemInfo() {
    return {
      platform: process.platform,
      arch: process.arch,
      hostname: os.hostname(),
      cpuCount: os.cpus().length,
      totalMemory: Math.round(os.totalmem() / 1024 / 1024 * 100) / 100, // GB
      freeMemory: Math.round(os.freemem() / 1024 / 1024 * 100) / 100, // GB
      uptime: os.uptime()
    };
  }

  /**
   * Get memory info
   */
  getMemoryInfo() {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;

    return {
      total: Math.round(totalMem / 1024 / 1024),
      used: Math.round(usedMem / 1024 / 1024),
      free: Math.round(freeMem / 1024 / 1024),
      percentage: Math.round((usedMem / totalMem) * 100)
    };
  }

  /**
   * Get CPU info
   */
  getCPUInfo() {
    const cpus = os.cpus();
    const loadAvg = os.loadavg();

    return {
      count: cpus.length,
      model: cpus[0]?.model || 'Unknown',
      speed: cpus[0]?.speed || 0,
      load: {
        avg1: loadAvg[0],
        avg5: loadAvg[1],
        avg15: loadAvg[2]
      }
    };
  }
}

export default StatusMonitor;
