const { AppError, NotFoundError } = require('../utils/errors');
const { paginate } = require('../utils/helpers');
const { NOTIFICATION_TYPES } = require('../constants');

class NotificationService {
  async createNotification(data) {
    const Notification = require('../models').Notification;
    
    const notification = await Notification.create({
      userId: data.userId,
      type: data.type,
      title: data.title,
      message: data.message,
      data: data.data || {},
      relatedEntity: data.relatedEntity,
      priority: data.priority || 'normal',
      expiresAt: data.expiresAt,
    });

    return notification;
  }

  async createBulkNotifications(notifications) {
    const Notification = require('../models').Notification;
    return Notification.insertMany(notifications);
  }

  async getNotifications(userId, filters = {}, options = {}) {
    const Notification = require('../models').Notification;

    const { page = 1, limit = 20, sort = '-createdAt' } = options;
    const { type, isRead, priority, startDate, endDate } = filters;

    const query = { userId };

    if (type) query.type = type;
    if (isRead !== undefined) query.isRead = isRead === 'true';
    if (priority) query.priority = priority;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const pagination = paginate(page, limit, await Notification.countDocuments(query));

    const notifications = await Notification.find(query)
      .sort(sort)
      .skip(pagination.skip)
      .limit(pagination.limit)
      .lean();

    return {
      data: notifications,
      meta: pagination,
    };
  }

  async getUnreadCount(userId) {
    const Notification = require('../models').Notification;
    return Notification.countDocuments({ userId, isRead: false });
  }

  async markAsRead(userId, notificationId) {
    const Notification = require('../models').Notification;
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { isRead: true, readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      throw new NotFoundError('Notification not found');
    }

    return notification;
  }

  async markAsUnread(userId, notificationId) {
    const Notification = require('../models').Notification;
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { isRead: false, readAt: null },
      { new: true }
    );

    if (!notification) {
      throw new NotFoundError('Notification not found');
    }

    return notification;
  }

  async markAllAsRead(userId) {
    const Notification = require('../models').Notification;
    const result = await Notification.updateMany(
      { userId, isRead: false },
      { $set: { isRead: true, readAt: new Date() } }
    );

    return { modifiedCount: result.modifiedCount };
  }

  async deleteNotification(userId, notificationId) {
    const Notification = require('../models').Notification;
    const notification = await Notification.findOneAndDelete({ _id: notificationId, userId });

    if (!notification) {
      throw new NotFoundError('Notification not found');
    }

    return true;
  }

  async deleteReadNotifications(userId) {
    const Notification = require('../models').Notification;
    const result = await Notification.deleteMany({ userId, isRead: true });
    return { deletedCount: result.deletedCount };
  }

  async getNotificationById(userId, notificationId) {
    const Notification = require('../models').Notification;
    const notification = await Notification.findOne({ _id: notificationId, userId });

    if (!notification) {
      throw new NotFoundError('Notification not found');
    }

    return notification;
  }

  async updatePreferences(userId, preferences) {
    const User = require('../models').User;
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { notificationPreferences: preferences } },
      { new: true }
    );

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return user.notificationPreferences;
  }

  async getPreferences(userId) {
    const User = require('../models').User;
    const user = await User.findById(userId).select('notificationPreferences');
    
    if (!user) {
      throw new NotFoundError('User not found');
    }

    return user.notificationPreferences || this.getDefaultPreferences();
  }

  getDefaultPreferences() {
    return {
      email: {
        jobApplication: true,
        applicationStatusUpdate: true,
        newJobMatch: true,
        message: true,
        system: true,
        marketing: false,
      },
      push: {
        jobApplication: true,
        applicationStatusUpdate: true,
        newJobMatch: true,
        message: true,
        system: true,
      },
      inApp: {
        jobApplication: true,
        applicationStatusUpdate: true,
        newJobMatch: true,
        message: true,
        system: true,
      },
    };
  }

  async shouldSendNotification(userId, type, channel) {
    const preferences = await this.getPreferences(userId);
    return preferences[channel]?.[type] === true;
  }

  async sendNotification(userId, type, title, message, data = {}, options = {}) {
    const { relatedEntity, priority = 'normal', expiresAt, channels = ['inApp'] } = options;

    const results = {};

    if (channels.includes('inApp')) {
      const shouldSendInApp = await this.shouldSendNotification(userId, type, 'inApp');
      if (shouldSendInApp) {
        const notification = await this.createNotification({
          userId,
          type,
          title,
          message,
          data,
          relatedEntity,
          priority,
          expiresAt,
        });
        results.inApp = notification;
      }
    }

    if (channels.includes('email')) {
      const shouldSendEmail = await this.shouldSendNotification(userId, type, 'email');
      if (shouldSendEmail) {
        results.email = await this.sendEmailNotification(userId, type, title, message, data);
      }
    }

    if (channels.includes('push')) {
      const shouldSendPush = await this.shouldSendNotification(userId, type, 'push');
      if (shouldSendPush) {
        results.push = await this.sendPushNotification(userId, title, message, data);
      }
    }

    return results;
  }

  async sendEmailNotification(userId, type, title, message, data) {
    const User = require('../models').User;
    const EmailService = require('./emailService');
    
    const user = await User.findById(userId).select('email name');
    if (!user || !user.email) {
      return { success: false, reason: 'No email' };
    }

    try {
      await EmailService.sendEmail({
        to: user.email,
        subject: title,
        html: this.getEmailTemplate(type, message, data, user.name),
        text: message,
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async sendPushNotification(userId, title, message, data) {
    // Placeholder for push notification service (Firebase, OneSignal, etc.)
    return { success: true, message: 'Push notification queued' };
  }

  getEmailTemplate(type, message, data, userName) {
    const baseTemplate = (content) => `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">JobLink</h1>
          <p style="color: #bfdbfe; margin: 10px 0 0;">Ethiopia's Leading Job Marketplace</p>
        </div>
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px;">
          ${content}
        </div>
      </body>
      </html>
    `;

    return baseTemplate(`
      <h2 style="color: #1f2937; margin-top: 0;">Hi ${userName},</h2>
      <p style="color: #4b5563;">${message}</p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
      <p style="color: #9ca3af; font-size: 12px;">You're receiving this because you have notifications enabled for ${type.replace('_', ' ')}.</p>
    `);
  }

  async cleanupExpiredNotifications() {
    const Notification = require('../models').Notification;
    const result = await Notification.deleteMany({ 
      expiresAt: { $lt: new Date() } 
    });
    return { deletedCount: result.deletedCount };
  }
}

module.exports = new NotificationService();