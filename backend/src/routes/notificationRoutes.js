const express = require('express');
const { query, body, param } = require('express-validator');
const notificationController = require('../controllers/notificationController');
const { validate } = require('../utils/validation');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/', notificationController.getNotifications);
router.get('/unread-count', notificationController.getUnreadCount);
router.get('/preferences', notificationController.getPreferences);

router.patch(
  '/preferences',
  [
    body('email').optional().isObject().withMessage('Email preferences must be an object'),
    body('push').optional().isObject().withMessage('Push preferences must be an object'),
    body('inApp').optional().isObject().withMessage('In-app preferences must be an object'),
  ],
  validate,
  notificationController.updatePreferences
);

router.get('/:id', notificationController.getNotification);

router.patch('/:id/read', notificationController.markAsRead);
router.patch('/:id/unread', notificationController.markAsUnread);

router.post('/mark-all-read', notificationController.markAllAsRead);

router.delete('/read', notificationController.deleteReadNotifications);

router.delete('/:id', notificationController.deleteNotification);

module.exports = router;