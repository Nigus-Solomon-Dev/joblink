const notificationService = require('../services/notificationService');
const ApiResponse = require('../utils/apiResponse');
const catchAsync = require('../utils/catchAsync');
const { AppError, NotFoundError } = require('../utils/errors');
const { protect } = require('../middleware/auth');

class NotificationController {
  getNotifications = catchAsync(async (req, res, next) => {
    const { page, limit, sort, type, isRead, priority, startDate, endDate } = req.query;
    
    const result = await notificationService.getNotifications(req.user.id,
      { type, isRead, priority, startDate, endDate },
      { page: parseInt(page) || 1, limit: parseInt(limit) || 20, sort: sort || '-createdAt' }
    );
    
    const response = ApiResponse.success(result.data, 'Notifications fetched successfully', 200, result.meta);
    res.status(200).json(response);
  });

  getUnreadCount = catchAsync(async (req, res, next) => {
    const count = await notificationService.getUnreadCount(req.user.id);
    
    const response = ApiResponse.success({ count }, 'Unread count fetched');
    res.status(200).json(response);
  });

  getNotification = catchAsync(async (req, res, next) => {
    const notification = await notificationService.getNotificationById(req.user.id, req.params.id);
    
    const response = ApiResponse.success({ notification }, 'Notification fetched successfully');
    res.status(200).json(response);
  });

  markAsRead = catchAsync(async (req, res, next) => {
    const notification = await notificationService.markAsRead(req.user.id, req.params.id);
    
    const response = ApiResponse.success({ notification }, 'Notification marked as read');
    res.status(200).json(response);
  });

  markAsUnread = catchAsync(async (req, res, next) => {
    const notification = await notificationService.markAsUnread(req.user.id, req.params.id);
    
    const response = ApiResponse.success({ notification }, 'Notification marked as unread');
    res.status(200).json(response);
  });

  markAllAsRead = catchAsync(async (req, res, next) => {
    const result = await notificationService.markAllAsRead(req.user.id);
    
    const response = ApiResponse.success(result, 'All notifications marked as read');
    res.status(200).json(response);
  });

  deleteNotification = catchAsync(async (req, res, next) => {
    await notificationService.deleteNotification(req.user.id, req.params.id);
    
    const response = ApiResponse.success(null, 'Notification deleted successfully');
    res.status(200).json(response);
  });

  deleteReadNotifications = catchAsync(async (req, res, next) => {
    const result = await notificationService.deleteReadNotifications(req.user.id);
    
    const response = ApiResponse.success(result, 'Read notifications deleted successfully');
    res.status(200).json(response);
  });

  getPreferences = catchAsync(async (req, res, next) => {
    const preferences = await notificationService.getPreferences(req.user.id);
    
    const response = ApiResponse.success({ preferences }, 'Preferences fetched successfully');
    res.status(200).json(response);
  });

  updatePreferences = catchAsync(async (req, res, next) => {
    const { email, push, inApp } = req.body;
    
    const preferences = await notificationService.updatePreferences(req.user.id, { email, push, inApp });
    
    const response = ApiResponse.success({ preferences }, 'Preferences updated successfully');
    res.status(200).json(response);
  });
}

module.exports = new NotificationController();