const express = require('express');
const { body, param, query } = require('express-validator');
const { messageController, conversationController } = require('../controllers/messagingController');
const { validate } = require('../utils/validation');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.use(protect);

// Conversation routes
router.post(
  '/conversations/direct',
  [
    body('userId').isMongoId().withMessage('Valid user ID is required'),
  ],
  validate,
  conversationController.createDirectConversation
);

router.post(
  '/conversations/group',
  [
    body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Group name must be 2-100 characters'),
    body('participantIds').isArray({ min: 2 }).withMessage('At least 2 participant IDs required'),
    body('participantIds.*').isMongoId().withMessage('Valid participant IDs required'),
    body('avatar').optional().isURL().withMessage('Avatar must be a valid URL'),
  ],
  validate,
  conversationController.createGroupConversation
);

router.get('/conversations', conversationController.getConversations);
router.get('/conversations/:id', conversationController.getConversation);

router.patch(
  '/conversations/:id',
  [
    body('groupName').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Group name must be 2-100 characters'),
    body('groupAvatar').optional().isURL().withMessage('Avatar must be a valid URL'),
  ],
  validate,
  conversationController.updateConversation
);

router.post(
  '/conversations/:id/participants',
  [
    body('participantIds').isArray({ min: 1 }).withMessage('At least 1 participant ID required'),
    body('participantIds.*').isMongoId().withMessage('Valid participant IDs required'),
  ],
  validate,
  conversationController.addParticipants
);

router.delete('/conversations/:id/participants/:participantId', conversationController.removeParticipant);
router.post('/conversations/:id/leave', conversationController.leaveConversation);
router.post('/conversations/:id/archive', conversationController.archiveConversation);
router.post('/conversations/:id/unarchive', conversationController.unarchiveConversation);
router.delete('/conversations/:id', conversationController.deleteConversation);

// Message routes
router.post(
  '/conversations/:conversationId/messages',
  [
    body('content').trim().isLength({ min: 1, max: 5000 }).withMessage('Message content is required (1-5000 characters)'),
    body('attachments').optional().isArray().withMessage('Attachments must be an array'),
  ],
  validate,
  messageController.sendMessage
);

router.get('/conversations/:conversationId/messages', messageController.getMessages);
router.get('/messages/:id', messageController.getMessage);

router.patch('/messages/:id/read', messageController.markAsRead);
router.post('/conversations/:conversationId/read', messageController.markConversationAsRead);

router.patch(
  '/messages/:id',
  [
    body('content').trim().isLength({ min: 1, max: 5000 }).withMessage('Message content is required (1-5000 characters)'),
  ],
  validate,
  messageController.editMessage
);

router.delete('/messages/:id', messageController.deleteMessage);

router.get('/messages/search', messageController.searchMessages);

router.post(
  '/conversations/:conversationId/attachments',
  upload.single('file'),
  messageController.uploadAttachment
);

module.exports = router;