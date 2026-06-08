/**
 * Conversation Cache
 * 
 * Persiste conversas para continuidade entre dispositivos
 */

import { randomBytes } from 'crypto';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { EventEmitter } from 'events';

class ConversationCache extends EventEmitter {
  constructor(yamiHome, logger) {
    super();
    this.yamiHome = yamiHome;
    this.logger = logger;
    this.conversationsDir = join(yamiHome, 'database', 'conversations');
    this.conversations = new Map();
    this.maxConversations = 1000;
  }

  /**
   * Initialize cache
   */
  async initialize() {
    try {
      mkdirSync(this.conversationsDir, { recursive: true });
      this.loadConversations();
      this.logger.info('Conversation Cache initialized');
    } catch (err) {
      this.logger.error('Failed to initialize Conversation Cache:', err);
      throw err;
    }
  }

  /**
   * Load conversations from storage
   */
  loadConversations() {
    try {
      // For now, conversations are in-memory
      // In production, would load from files/database
      this.logger.debug('Conversations loaded');
    } catch (err) {
      this.logger.warn('Failed to load conversations:', err);
    }
  }

  /**
   * Create a new conversation
   */
  createConversation(metadata = {}) {
    const conversationId = `conv_${randomBytes(12).toString('hex')}`;

    const conversation = {
      id: conversationId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
      metadata: {
        title: metadata.title || 'Untitled',
        tags: metadata.tags || [],
        resolved: metadata.resolved || false,
        ...metadata
      }
    };

    this.conversations.set(conversationId, conversation);
    this.saveConversation(conversation);

    this.logger.info(`Conversation created: ${conversationId}`);
    this.emit('conversation:created', { conversationId, conversation });

    return conversationId;
  }

  /**
   * Get conversation by ID
   */
  getConversation(conversationId) {
    return this.conversations.get(conversationId);
  }

  /**
   * Add message to conversation
   */
  addMessage(conversationId, message) {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      this.logger.warn(`Conversation not found: ${conversationId}`);
      return null;
    }

    const messageId = message.id || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const msg = {
      id: messageId,
      role: message.role || 'user',
      content: message.content,
      timestamp: message.timestamp || new Date().toISOString(),
      device: message.device || null,
      platform: message.platform || null,
      attachments: message.attachments || [],
      metadata: message.metadata || {}
    };

    conversation.messages.push(msg);
    conversation.updatedAt = new Date().toISOString();

    this.saveConversation(conversation);

    this.logger.debug(`Message added to conversation ${conversationId}`);
    this.emit('message:added', {
      conversationId,
      message: msg
    });

    return msg;
  }

  /**
   * Get messages from conversation
   */
  getMessages(conversationId, limit = null) {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) return [];

    let messages = conversation.messages;
    if (limit) {
      messages = messages.slice(-limit);
    }

    return messages;
  }

  /**
   * Get recent messages from all conversations
   */
  getRecentMessages(limit = 50) {
    const allMessages = [];

    this.conversations.forEach((conv) => {
      conv.messages.forEach((msg) => {
        allMessages.push({
          ...msg,
          conversationId: conv.id,
          conversationTitle: conv.metadata.title
        });
      });
    });

    // Sort by timestamp and get last N
    return allMessages
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);
  }

  /**
   * List all conversations
   */
  listConversations() {
    return Array.from(this.conversations.values()).map(conv => ({
      id: conv.id,
      title: conv.metadata.title,
      messageCount: conv.messages.length,
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt,
      lastMessage: conv.messages.length > 0 
        ? conv.messages[conv.messages.length - 1]
        : null
    }));
  }

  /**
   * List recent conversations
   */
  listRecentConversations(limit = 10) {
    return Array.from(this.conversations.values())
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .slice(0, limit)
      .map(conv => ({
        id: conv.id,
        title: conv.metadata.title,
        messageCount: conv.messages.length,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
        messages: conv.messages.slice(-5) // Last 5 messages
      }));
  }

  /**
   * Update conversation metadata
   */
  updateConversationMetadata(conversationId, metadata) {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) return null;

    conversation.metadata = {
      ...conversation.metadata,
      ...metadata
    };
    conversation.updatedAt = new Date().toISOString();

    this.saveConversation(conversation);

    this.logger.debug(`Conversation metadata updated: ${conversationId}`);
    this.emit('conversation:updated', { conversationId, metadata: conversation.metadata });

    return conversation;
  }

  /**
   * Delete conversation
   */
  deleteConversation(conversationId) {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) return false;

    this.conversations.delete(conversationId);

    this.logger.info(`Conversation deleted: ${conversationId}`);
    this.emit('conversation:deleted', { conversationId });

    return true;
  }

  /**
   * Search conversations
   */
  searchConversations(query) {
    const results = [];
    const lowerQuery = query.toLowerCase();

    this.conversations.forEach((conv) => {
      if (conv.metadata.title.toLowerCase().includes(lowerQuery)) {
        results.push(conv);
        return;
      }

      // Search in messages
      const hasMatch = conv.messages.some(msg =>
        msg.content.toLowerCase().includes(lowerQuery)
      );

      if (hasMatch) {
        results.push(conv);
      }
    });

    return results;
  }

  /**
   * Get activities (for compatibility with activity log)
   */
  getActivities(limit = 50, offset = 0) {
    const activities = [];

    this.conversations.forEach((conv) => {
      conv.messages.forEach((msg) => {
        activities.push({
          id: msg.id,
          type: 'MESSAGE',
          conversationId: conv.id,
          conversationTitle: conv.metadata.title,
          message: msg.content,
          role: msg.role,
          device: msg.device,
          timestamp: msg.timestamp,
          timestampMs: new Date(msg.timestamp).getTime()
        });
      });
    });

    // Sort by timestamp descending
    activities.sort((a, b) => b.timestampMs - a.timestampMs);

    // Apply pagination
    const start = offset;
    const end = offset + limit;

    return activities.slice(start, end);
  }

  /**
   * Save conversation to storage
   */
  saveConversation(conversation) {
    try {
      const filePath = join(this.conversationsDir, `${conversation.id}.json`);
      writeFileSync(filePath, JSON.stringify(conversation, null, 2), 'utf8');
    } catch (err) {
      this.logger.error(`Failed to save conversation ${conversation.id}:`, err);
    }
  }

  /**
   * Get conversation statistics
   */
  getStatistics() {
    let totalMessages = 0;
    let totalDevices = new Set();

    this.conversations.forEach((conv) => {
      totalMessages += conv.messages.length;
      conv.messages.forEach((msg) => {
        if (msg.device) totalDevices.add(msg.device);
      });
    });

    return {
      totalConversations: this.conversations.size,
      totalMessages,
      devicesWithMessages: totalDevices.size,
      averageMessagesPerConversation: totalMessages / Math.max(1, this.conversations.size),
      oldestConversation: Array.from(this.conversations.values())
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))[0]?.createdAt || null,
      newestConversation: Array.from(this.conversations.values())
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0]?.createdAt || null
    };
  }

  /**
   * Cleanup old conversations
   */
  cleanupOldConversations(maxAgeMs = 30 * 24 * 60 * 60 * 1000) { // 30 days
    const now = Date.now();
    let deletedCount = 0;

    this.conversations.forEach((conv, id) => {
      const conversationAge = now - new Date(conv.createdAt).getTime();
      if (conversationAge > maxAgeMs && conv.messages.length === 0) {
        this.conversations.delete(id);
        deletedCount++;
      }
    });

    if (deletedCount > 0) {
      this.logger.info(`Cleaned up ${deletedCount} old conversations`);
    }

    return deletedCount;
  }
}

export default ConversationCache;
