/**
 * Sync Engine
 * 
 * Implementa sincronização bidirecional em tempo real
 */

import { EventEmitter } from 'events';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

class SyncEngine extends EventEmitter {
  constructor(yamiHome, logger) {
    super();
    this.yamiHome = yamiHome;
    this.logger = logger;
    this.stateDir = join(yamiHome, 'remote-gateway', 'state');
    
    this.tasks = new Map();
    this.automations = new Map();
    this.activities = [];
    this.syncQueue = [];
    this.maxActivities = 10000; // Keep last 10k activities
  }

  /**
   * Initialize engine
   */
  async initialize() {
    try {
      mkdirSync(this.stateDir, { recursive: true });
      this.loadState();
      this.logger.info('Sync Engine initialized');
    } catch (err) {
      this.logger.error('Failed to initialize Sync Engine:', err);
      throw err;
    }
  }

  /**
   * Load state from storage
   */
  loadState() {
    try {
      // Load tasks
      try {
        const tasksFile = join(this.stateDir, 'tasks.json');
        const tasksData = JSON.parse(readFileSync(tasksFile, 'utf8'));
        Object.values(tasksData).forEach(task => {
          this.tasks.set(task.id, task);
        });
        this.logger.debug(`Loaded ${this.tasks.size} tasks`);
      } catch (err) {
        if (err.code !== 'ENOENT') {
          this.logger.warn('Failed to load tasks:', err);
        }
      }

      // Load automations
      try {
        const automationsFile = join(this.stateDir, 'automations.json');
        const automationsData = JSON.parse(readFileSync(automationsFile, 'utf8'));
        Object.values(automationsData).forEach(auto => {
          this.automations.set(auto.id, auto);
        });
        this.logger.debug(`Loaded ${this.automations.size} automations`);
      } catch (err) {
        if (err.code !== 'ENOENT') {
          this.logger.warn('Failed to load automations:', err);
        }
      }
    } catch (err) {
      this.logger.error('Error loading state:', err);
    }
  }

  /**
   * Save state to storage
   */
  saveState() {
    try {
      const tasks = {};
      this.tasks.forEach((task, id) => {
        tasks[id] = task;
      });
      writeFileSync(join(this.stateDir, 'tasks.json'), JSON.stringify(tasks, null, 2), 'utf8');

      const automations = {};
      this.automations.forEach((auto, id) => {
        automations[id] = auto;
      });
      writeFileSync(join(this.stateDir, 'automations.json'), JSON.stringify(automations, null, 2), 'utf8');
    } catch (err) {
      this.logger.error('Error saving state:', err);
    }
  }

  /**
   * Create or update task
   */
  updateTask(taskId, taskData) {
    const existingTask = this.tasks.get(taskId);
    const previousState = existingTask ? { ...existingTask } : null;

    const task = {
      id: taskId,
      ...taskData,
      updatedAt: new Date().toISOString()
    };

    this.tasks.set(taskId, task);
    this.saveState();

    const update = {
      taskId,
      action: existingTask ? 'updated' : 'created',
      task,
      timestamp: Date.now(),
      previousState
    };

    this.emit('task:updated', update);
    this.logActivity('TASK_UPDATED', { taskId, action: update.action, task });

    return task;
  }

  /**
   * Get task by ID
   */
  getTask(taskId) {
    return this.tasks.get(taskId);
  }

  /**
   * List all tasks
   */
  listTasks(filter = null) {
    let tasks = Array.from(this.tasks.values());

    if (filter) {
      if (filter.status) {
        tasks = tasks.filter(t => t.status === filter.status);
      }
      if (filter.priority) {
        tasks = tasks.filter(t => t.priority === filter.priority);
      }
      if (filter.assignee) {
        tasks = tasks.filter(t => t.assignee === filter.assignee);
      }
    }

    return tasks;
  }

  /**
   * Get current summary of all tasks
   */
  getCurrentTasks() {
    const tasks = this.listTasks();
    return {
      total: tasks.length,
      running: tasks.filter(t => t.status === 'running').length,
      completed: tasks.filter(t => t.status === 'completed').length,
      failed: tasks.filter(t => t.status === 'failed').length,
      pending: tasks.filter(t => t.status === 'pending').length,
      tasks
    };
  }

  /**
   * Delete task
   */
  deleteTask(taskId) {
    const task = this.tasks.get(taskId);
    if (!task) return false;

    this.tasks.delete(taskId);
    this.saveState();

    this.emit('task:deleted', { taskId, task });
    this.logActivity('TASK_DELETED', { taskId });

    return true;
  }

  /**
   * Create or update automation
   */
  updateAutomation(automationId, automationData) {
    const existingAuto = this.automations.get(automationId);

    const automation = {
      id: automationId,
      ...automationData,
      updatedAt: new Date().toISOString()
    };

    this.automations.set(automationId, automation);
    this.saveState();

    const update = {
      automationId,
      action: existingAuto ? 'updated' : 'created',
      automation,
      timestamp: Date.now()
    };

    this.emit('automation:updated', update);
    this.logActivity('AUTOMATION_UPDATED', { automationId, action: update.action });

    return automation;
  }

  /**
   * Get automation by ID
   */
  getAutomation(automationId) {
    return this.automations.get(automationId);
  }

  /**
   * List all automations
   */
  listAutomations() {
    return Array.from(this.automations.values());
  }

  /**
   * Get current summary of automations
   */
  getCurrentAutomations() {
    const automations = this.listAutomations();
    return {
      total: automations.length,
      active: automations.filter(a => a.enabled).length,
      inactive: automations.filter(a => !a.enabled).length,
      automations
    };
  }

  /**
   * Update automation progress
   */
  updateAutomationProgress(automationId, progress) {
    const automation = this.automations.get(automationId);
    if (!automation) return null;

    automation.progress = {
      ...automation.progress,
      ...progress,
      lastUpdatedAt: new Date().toISOString()
    };

    this.emit('automation:progress', {
      automationId,
      progress: automation.progress,
      timestamp: Date.now()
    });

    this.logActivity('AUTOMATION_PROGRESS', {
      automationId,
      progress: automation.progress
    });

    return automation;
  }

  /**
   * Log activity
   */
  logActivity(type, data = {}) {
    const activity = {
      id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      data,
      timestamp: new Date().toISOString(),
      timestampMs: Date.now()
    };

    this.activities.push(activity);

    // Keep only recent activities
    if (this.activities.length > this.maxActivities) {
      this.activities = this.activities.slice(-this.maxActivities);
    }

    this.emit('activity:logged', activity);
    return activity;
  }

  /**
   * Get recent activities
   */
  getActivities(limit = 50, offset = 0) {
    const start = Math.max(0, this.activities.length - offset - limit);
    const end = Math.max(0, this.activities.length - offset);
    return this.activities.slice(start, end).reverse();
  }

  /**
   * Get activities of specific type
   */
  getActivitiesByType(type, limit = 50) {
    return this.activities
      .filter(a => a.type === type)
      .slice(-limit)
      .reverse();
  }

  /**
   * Clear activities (useful for cleanup)
   */
  clearActivities() {
    this.activities = [];
    this.logger.info('Activities cleared');
  }

  /**
   * Queue a sync message
   */
  queueSync(message) {
    this.syncQueue.push({
      ...message,
      queuedAt: Date.now()
    });
  }

  /**
   * Get and clear sync queue
   */
  drainSyncQueue() {
    const queue = this.syncQueue;
    this.syncQueue = [];
    return queue;
  }

  /**
   * Get sync queue size
   */
  getSyncQueueSize() {
    return this.syncQueue.length;
  }

  /**
   * Get engine statistics
   */
  getStatistics() {
    return {
      tasks: {
        total: this.tasks.size,
        summary: this.getCurrentTasks()
      },
      automations: {
        total: this.automations.size,
        summary: this.getCurrentAutomations()
      },
      activities: {
        total: this.activities.length,
        recent: this.getActivities(10)
      },
      queue: {
        size: this.syncQueue.length
      }
    };
  }
}

export default SyncEngine;
