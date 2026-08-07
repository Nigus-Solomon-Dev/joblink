const express = require('express');
const { body, param, query } = require('express-validator');
const { categoryController, skillController } = require('../controllers/categorySkillController');
const { validate } = require('../utils/validation');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

// Public category routes
router.get('/categories', categoryController.getAllCategories);
router.get('/categories/tree', categoryController.getCategoryTree);
router.get('/categories/with-jobs', categoryController.getCategoriesWithJobCounts);
router.get('/categories/slug/:slug', categoryController.getCategoryBySlug);
router.get('/categories/:id', categoryController.getCategory);

// Public skill routes
router.get('/skills', skillController.getAllSkills);
router.get('/skills/grouped', skillController.getSkillsGroupedByCategory);
router.get('/skills/top', skillController.getTopSkills);
router.get('/skills/search', skillController.searchSkills);
router.get('/skills/category/:category', skillController.getSkillsByCategory);
router.get('/skills/slug/:slug', skillController.getSkillBySlug);
router.get('/skills/:id', skillController.getSkill);

// Protected admin routes
router.use(protect, restrictTo('admin'));

// Category admin routes
router.post(
  '/categories',
  [
    body('name')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Category name must be between 2 and 50 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Description cannot exceed 500 characters'),
    body('icon')
      .optional()
      .trim(),
    body('parentId')
      .optional()
      .isMongoId()
      .withMessage('Valid parent category ID required'),
    body('order')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Order must be a positive integer'),
    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive must be a boolean'),
  ],
  validate,
  categoryController.createCategory
);

router.patch(
  '/categories/:id',
  [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Category name must be between 2 and 50 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Description cannot exceed 500 characters'),
    body('icon')
      .optional()
      .trim(),
    body('parentId')
      .optional()
      .isMongoId()
      .withMessage('Valid parent category ID required'),
    body('order')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Order must be a positive integer'),
    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive must be a boolean'),
  ],
  validate,
  categoryController.updateCategory
);

router.delete('/categories/:id', categoryController.deleteCategory);

// Skill admin routes
router.post(
  '/skills',
  [
    body('name')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Skill name must be between 2 and 50 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage('Description cannot exceed 200 characters'),
    body('category')
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage('Category cannot exceed 50 characters'),
    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive must be a boolean'),
  ],
  validate,
  skillController.createSkill
);

router.patch(
  '/skills/:id',
  [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Skill name must be between 2 and 50 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage('Description cannot exceed 200 characters'),
    body('category')
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage('Category cannot exceed 50 characters'),
    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive must be a boolean'),
  ],
  validate,
  skillController.updateSkill
);

router.delete('/skills/:id', skillController.deleteSkill);

module.exports = router;