const express = require('express');
const { body } = require('express-validator');
const telegramBotController = require('../controllers/telegramBotController');
const telegramBotService = require('../services/telegramBotService');
const { validate } = require('../utils/validation');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

// Telegram calls this endpoint directly (no app JWT), so it must stay public.
router.post('/webhook', (req, res, next) => {
  telegramBotController.handleWebhook(req, res, next);
});

// Everything below requires an authenticated admin.
router.use(protect, restrictTo('admin'));

router.get('/info', telegramBotController.getBotInfo);

router.get('/status', telegramBotController.getBotStatus);

router.post('/broadcast', 
  body('message').notEmpty().withMessage('Message is required'),
  validate,
  telegramBotController.broadcast
);

router.post('/send', 
  body('userId').notEmpty().withMessage('userId is required'),
  body('message').notEmpty().withMessage('message is required'),
  validate,
  telegramBotController.sendToUser
);

router.post('/job-alert', 
  body('userId').notEmpty().withMessage('userId is required'),
  body('jobId').notEmpty().withMessage('jobId is required'),
  validate,
  telegramBotController.sendJobAlert
);

module.exports = router;