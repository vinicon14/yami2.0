/**
 * Logging utility for Remote Gateway
 */

import { appendFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';

class Logger {
  constructor(context = 'YAMI', options = {}) {
    this.context = context;
    this.logFile = options.logFile || null;
    this.level = options.level || 'info'; // debug, info, warn, error
    this.colors = {
      reset: '\x1b[0m',
      debug: '\x1b[36m',    // cyan
      info: '\x1b[32m',     // green
      warn: '\x1b[33m',     // yellow
      error: '\x1b[31m'     // red
    };

    if (this.logFile) {
      const dir = dirname(this.logFile);
      mkdirSync(dir, { recursive: true });
    }
  }

  /**
   * Format log message
   */
  format(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const context = `[${this.context}]`;
    const levelStr = level.toUpperCase().padEnd(5);
    
    let msg = `${timestamp} ${levelStr} ${context} ${message}`;
    if (data) {
      msg += ` ${JSON.stringify(data)}`;
    }
    return msg;
  }

  /**
   * Log to console with color
   */
  logToConsole(level, message, data) {
    const color = this.colors[level] || '';
    const msg = this.format(level, message, data);
    console.log(`${color}${msg}${this.colors.reset}`);
  }

  /**
   * Log to file
   */
  logToFile(level, message, data) {
    if (!this.logFile) return;
    const msg = this.format(level, message, data);
    try {
      appendFileSync(this.logFile, msg + '\n', 'utf8');
    } catch (err) {
      console.error('Failed to write to log file:', err);
    }
  }

  /**
   * Log message (level: debug)
   */
  debug(message, data = null) {
    if (['debug'].includes(this.level) || this.level === 'debug') {
      this.logToConsole('debug', message, data);
      this.logToFile('debug', message, data);
    }
  }

  /**
   * Log message (level: info)
   */
  info(message, data = null) {
    if (['debug', 'info'].includes(this.level)) {
      this.logToConsole('info', message, data);
      this.logToFile('info', message, data);
    }
  }

  /**
   * Log message (level: warn)
   */
  warn(message, data = null) {
    if (['debug', 'info', 'warn'].includes(this.level)) {
      this.logToConsole('warn', message, data);
      this.logToFile('warn', message, data);
    }
  }

  /**
   * Log message (level: error)
   */
  error(message, data = null) {
    this.logToConsole('error', message, data);
    this.logToFile('error', message, data);
  }
}

export default Logger;
