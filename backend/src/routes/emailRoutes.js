const express = require('express');
const { body, query } = require('express-validator');
const emailController = require('../controllers/emailController');
const { validate } = require('../utils/validation');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

router.use(protect);
router.use(restrictTo('admin'));

router.post('/test', 
  body('to').isEmail().withMessage('Valid recipient email is required'),
  body('subject').optional().isString().withMessage('Subject must be a string'),
  validate,
  emailController.sendTestEmail
);

router.post('/verification', 
  body('email').isEmail().withMessage('Valid email is required'),
  body('token').notEmpty().withMessage('Token is required'),
  body('name').optional().isString().withMessage('Name must be a string'),
  validate,
  emailController.sendVerificationEmail
);

router.post('/password-reset', 
  body('email').isEmail().withMessage('Valid email is required'),
  body('token').notEmpty().withMessage('Token is required'),
  body('name').optional().isString().withMessage('Name must be a string'),
  validate,
  emailController.sendPasswordReset
);

router.post('/welcome', 
  body('email').isEmail().withMessage('Valid email is required'),
  body('name').optional().isString().withMessage('Name must be a string'),
  validate,
  emailController.sendWelcomeEmail
);

router.post('/queue', 
  body('to').isEmail().withMessage('Valid recipient email is required'),
  body('subject').optional().isString().withMessage('Subject must be a string'),
  body('html').optional().isString().withMessage('HTML content must be a string'),
  body('text').optional().isString().withMessage('Text content must be a string'),
  body('attempts').optional().isInt({ min: 1, max: 10 }).withMessage('Attempts must be between 1 and 10'),
  body('delay').optional().isInt({ min: 0 }).withMessage('Delay must be a non-negative integer'),
  validate,
  emailController.queueEmail
);

router.post('/batch', 
  body('emails').isArray({ min: 1 }).withMessage('At least one email is required'),
  body('batchSize').optional().isInt({ min: 1, max: 100 }).withMessage('Batch size must be between 1 and 100'),
  validate,
  emailController.sendBatchEmails
);

router.post('/schedule', 
  body('to').isEmail().withMessage('Valid recipient email is required'),
  body('subject').optional().isString().withMessage('Subject must be a string'),
  body('html').optional().isString().withMessage('HTML content must be a string'),
  body('text').optional().isString().withMessage('Text content must be a string'),
  body('scheduledTime').isISO8601().withMessage('Valid scheduled time is required'),
  validate,
  emailController.scheduleEmail
);

router.get('/queue', emailController.getQueueStatus);
router.get('/analytics', emailController.getAnalytics);
router.delete('/queue', emailController.clearQueue);

module.exports = router;