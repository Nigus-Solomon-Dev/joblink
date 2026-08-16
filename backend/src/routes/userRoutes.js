const express = require('express');
const { body, param, query } = require('express-validator');
const userController = require('../controllers/userController');
const { validate } = require('../utils/validation');
const { protect, restrictTo } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// All routes below require authentication
router.use(protect);

// Current user routes
router.get('/me', userController.getMe);

router.patch(
  '/me',
  [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Name must be between 2 and 100 characters'),
    body('phone')
      .optional()
      .matches(/^\+?[1-9]\d{1,14}$/)
      .withMessage('Please provide a valid phone number'),
    body('bio')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Bio cannot exceed 500 characters'),
    body('location')
      .optional()
      .isLength({ max: 100 })
      .withMessage('Location cannot exceed 100 characters'),
    body('website')
      .optional()
      .isURL()
      .withMessage('Please provide a valid URL'),
    body('linkedin')
      .optional()
      .matches(/^https?:\/\/(www\.)?linkedin\.com\/.*/)
      .withMessage('Please provide a valid LinkedIn URL'),
  ],
  validate,
  userController.updateProfile
);

router.post(
  '/me/change-password',
  [
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('Password must contain uppercase, lowercase, number, and special character'),
    body('confirmPassword')
      .notEmpty()
      .withMessage('Confirm password is required'),
  ],
  validate,
  userController.changePassword
);

router.post(
  '/me/avatar',
  upload.single('avatar'),
  userController.uploadAvatar
);

router.delete('/me', userController.deleteAccount);

// Admin stats/search routes (registered before /:id to avoid being shadowed)
router.get('/stats', restrictTo('admin'), userController.getUserStats);
// Search is available to any authenticated user so they can find people to message.
router.get('/search', userController.searchUsers);

// Public profile route (no auth required for viewing)
router.get('/:id', userController.getPublicProfile);

// Admin routes
router.use(restrictTo('admin'));

router.get('/', userController.getAllUsers);

router.get('/:id', userController.getUserById);

router.patch(
  '/:id',
  [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Name must be between 2 and 100 characters'),
    body('phone')
      .optional()
      .matches(/^\+?[1-9]\d{1,14}$/)
      .withMessage('Please provide a valid phone number'),
    body('bio')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Bio cannot exceed 500 characters'),
    body('location')
      .optional()
      .isLength({ max: 100 })
      .withMessage('Location cannot exceed 100 characters'),
    body('website')
      .optional()
      .isURL()
      .withMessage('Please provide a valid URL'),
    body('linkedin')
      .optional()
      .matches(/^https?:\/\/(www\.)?linkedin\.com\/.*/)
      .withMessage('Please provide a valid LinkedIn URL'),
    body('role')
      .optional()
      .isIn(['job_seeker', 'employer', 'admin'])
      .withMessage('Invalid role'),
    body('status')
      .optional()
      .isIn(['active', 'inactive', 'suspended', 'pending_verification'])
      .withMessage('Invalid status'),
    body('emailVerified')
      .optional()
      .isBoolean()
      .withMessage('emailVerified must be a boolean'),
  ],
  validate,
  userController.updateUser
);

router.delete('/:id', userController.deleteUser);

module.exports = router;