/**
 * Notification Hub
 * 
 * Gerencia notificações push para todos os clientes
 */

import { randomBytes } from 'crypto';
import { EventEmitter } from 'events';

class NotificationHub extends EventEmitter {
  constructor(yamiHome, logger) {
    super();
    this.yamiHome = yamiHome;
    this.logger = logger;
    
    this.notifications = [];
    this.deviceSubscriptions = new Map(); // device_id -> [notification_ids]
    this.maxNotifications = 10000;
  }

  /**
   * Initialize hub
   */
  async initialize() {
    try {
      this.logger.info('Notification Hub initialized');
    } catch (err) {
      this.logger.error('Failed to initialize Notification Hub:', err);
      throw err;
    }
  }

  /**
   * Create notification
   */
  createNotification(type, title, message, options = {}) {
    const notificationId = `notif_${randomBytes(12).toString('hex')}`;

    const notification = {
      id: notificationId,
      type, // 'task', 'automation', 'alert', 'info', 'warning', 'error'
      title,
      message,
      timestamp: new Date().toISOString(),
      timestampMs: Date.now(),
      isRead: false,
      priority: options.priority || 'normal', // 'low', 'normal', 'high'
      actions: options.actions || [],
      data: options.data || {},
      targetDevices: options.targetDevices || 'all', // 'all' or array of device_ids
      link: options.link || null,
      imageUrl: options.imageUrl || null
    };

    this.notifications.push(notification);

    // Keep only recent notifications
    if (this.notifications.length > this.maxNotifications) {
      this.notifications = this.notifications.slice(-this.maxNotifications);
    }

    this.logger.info(`Notification created: ${notificationId} (${type})`);
    this.emit('notification:created', notification);

    return notification;
  }

  /**
   * Get notification by ID
   */
  getNotification(notificationId) {
    return this.notifications.find(n => n.id === notificationId);
  }

  /**
   * Mark notification as read
   */
  markAsRead(notificationId, deviceId = null) {
    const notification = this.getNotification(notificationId);
    if (!notification) return false;

    notification.isRead = true;
    notification.readAt = new Date().toISOString();
    notification.readByDevice = deviceId;

    this.emit('notification:read', { notificationId, deviceId });
    return true;
  }

  /**
   * Mark all notifications as read
   */
  markAllAsRead(deviceId = null) {
    let markedCount = 0;
    this.notifications.forEach(notif => {
      if (!notif.isRead) {
        this.markAsRead(notif.id, deviceId);
        markedCount++;
      }
    });

    return markedCount;
  }

  /**
   * Get unread notifications for device
   */
  getUnread(deviceId = null, limit = 50) {
    let unread = this.notifications.filter(n => !n.isRead);

    // Filter by device if specified
    if (deviceId) {
      unread = unread.filter(n => {
        if (n.targetDevices === 'all') return true;
        if (Array.isArray(n.targetDevices)) {
          return n.targetDevices.includes(deviceId);
        }
        return false;
      });
    }

    // Sort by timestamp (newest first) and limit
    return unread
      .sort((a, b) => b.timestampMs - a.timestampMs)
      .slice(0, limit);
  }

  /**
   * Get notifications history
   */
  getHistory(limit = 100, deviceId = null) {
    let filtered = this.notifications;

    if (deviceId) {
      filtered = filtered.filter(n => {
        if (n.targetDevices === 'all') return true;
        if (Array.isArray(n.targetDevices)) {
          return n.targetDevices.includes(deviceId);
        }
        return false;
      });
    }

    return filtered
      .sort((a, b) => b.timestampMs - a.timestampMs)
      .slice(0, limit);
  }

  /**
   * Subscribe device to notifications
   */
  subscribeDevice(deviceId) {
    if (!this.deviceSubscriptions.has(deviceId)) {
      this.deviceSubscriptions.set(deviceId, []);
    }
    this.logger.debug(`Device subscribed to notifications: ${deviceId}`);
  }

  /**
   * Unsubscribe device from notifications
   */
  unsubscribeDevice(deviceId) {
    this.deviceSubscriptions.delete(deviceId);
    this.logger.debug(`Device unsubscribed from notifications: ${deviceId}`);
  }

  /**
   * Get notification statistics
   */
  getStatistics() {
    const byType = {};
    const byPriority = {};

    this.notifications.forEach(notif => {
      byType[notif.type] = (byType[notif.type] || 0) + 1;
      byPriority[notif.priority] = (byPriority[notif.priority] || 0) + 1;
    });

    return {
      total: this.notifications.length,
      unread: this.notifications.filter(n => !n.isRead).length,
      read: this.notifications.filter(n => n.isRead).length,
      byType,
      byPriority,
      subscribedDevices: this.deviceSubscriptions.size,
      oldestNotification: this.notifications.length > 0 
        ? this.notifications[0].timestamp
        : null,
      newestNotification: this.notifications.length > 0
        ? this.notifications[this.notifications.length - 1].timestamp
        : null
    };
  }

  /**
   * Delete notification
   */
  deleteNotification(notificationId) {
    const index = this.notifications.findIndex(n => n.id === notificationId);
    if (index === -1) return false;

    this.notifications.splice(index, 1);
    this.logger.debug(`Notification deleted: ${notificationId}`);
    this.emit('notification:deleted', { notificationId });

    return true;
  }

  /**
   * Clear all notifications
   */
  clearAll() {
    const count = this.notifications.length;
    this.notifications = [];
    this.logger.info(`Cleared ${count} notifications`);
    this.emit('notifications:cleared');
  }

  /**
   * Clear old notifications
   */
  clearOldNotifications(maxAgeMs = 7 * 24 * 60 * 60 * 1000) { // 7 days
    const now = Date.now();
    const before = this.notifications.length;

    this.notifications = this.notifications.filter(notif => {
      return (now - notif.timestampMs) < maxAgeMs;
    });

    const deleted = before - this.notifications.length;
    if (deleted > 0) {
      this.logger.info(`Cleared ${deleted} old notifications`);
    }

    return deleted;
  }

  /**
   * Search notifications
   */
  searchNotifications(query) {
    const lowerQuery = query.toLowerCase();
    return this.notifications.filter(notif =>
      notif.title.toLowerCase().includes(lowerQuery) ||
      notif.message.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Get notifications by type
   */
  getByType(type, limit = 50) {
    return this.notifications
      .filter(n => n.type === type)
      .sort((a, b) => b.timestampMs - a.timestampMs)
      .slice(0, limit);
  }

  /**
   * Get notifications by priority
   */
  getByPriority(priority, limit = 50) {
    return this.notifications
      .filter(n => n.priority === priority)
      .sort((a, b) => b.timestampMs - a.timestampMs)
      .slice(0, limit);
  }

  /**
   * Create task notification
   */
  createTaskNotification(taskId, status, title, message, options = {}) {
    return this.createNotification('task', title, message, {
      ...options,
      data: {
        taskId,
        status,
        ...(options.data || {})
      }
    });
  }

  /**
   * Create automation notification
   */
  createAutomationNotification(automationId, action, title, message, options = {}) {
    return this.createNotification('automation', title, message, {
      ...options,
      data: {
        automationId,
        action,
        ...(options.data || {})
      }
    });
  }

  /**
   * Create alert notification
   */
  createAlert(title, message, options = {}) {
    return this.createNotification('alert', title, message, {
      priority: 'high',
      ...options
    });
  }

  /**
   * Create error notification
   */
  createError(title, message, options = {}) {
    return this.createNotification('error', title, message, {
      priority: 'high',
      ...options
    });
  }

  /**
   * Create info notification
   */
  createInfo(title, message, options = {}) {
    return this.createNotification('info', title, message, {
      priority: 'low',
      ...options
    });
  }

  /**
   * Create warning notification
   */
  createWarning(title, message, options = {}) {
    return this.createNotification('warning', title, message, {
      priority: 'normal',
      ...options
    });
  }
}

export default NotificationHub;
