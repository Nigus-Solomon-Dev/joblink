const express = require('express');
const { body, param, query } = require('express-validator');
const jobController = require('../controllers/jobController');
const { validate } = require('../utils/validation');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.get('/', jobController.getAllJobs);
router.get('/search', jobController.searchJobs);
router.get('/featured', jobController.getFeaturedJobs);
router.get('/:id', jobController.getJob);
router.get('/:id/stats', protect, jobController.getJobStats);

// Protected routes
router.use(protect);

router.get('/recommended', jobController.getRecommendedJobs);
router.get('/my-jobs', jobController.getMyJobs);
router.get('/company/:companyId', jobController.getCompanyJobs);

router.post(
  '/',
  [
    body('title')
      .trim()
      .isLength({ min: 5, max: 100 })
      .withMessage('Job title must be between 5 and 100 characters'),
    body('description')
      .trim()
      .isLength({ min: 50, max: 5000 })
      .withMessage('Description must be between 50 and 5000 characters'),
    body('requirements')
      .trim()
      .isLength({ min: 20, max: 3000 })
      .withMessage('Requirements must be between 20 and 3000 characters'),
    body('responsibilities')
      .trim()
      .isLength({ min: 20, max: 3000 })
      .withMessage('Responsibilities must be between 20 and 3000 characters'),
    body('benefits')
      .optional()
      .trim()
      .isLength({ max: 2000 })
      .withMessage('Benefits cannot exceed 2000 characters'),
    body('type')
      .isIn(['full_time', 'part_time', 'contract', 'internship', 'remote', 'hybrid'])
      .withMessage('Invalid job type'),
    body('experienceLevel')
      .optional()
      .isIn(['entry', 'junior', 'mid', 'senior', 'lead', 'executive'])
      .withMessage('Invalid experience level'),
    body('educationLevel')
      .optional()
      .isIn(['high_school', 'diploma', 'bachelor', 'master', 'phd', 'any'])
      .withMessage('Invalid education level'),
    body('salaryMin')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Salary min must be a positive number'),
    body('salaryMax')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Salary max must be a positive number'),
    body('salaryCurrency')
      .optional()
      .isLength({ min: 3, max: 3 })
      .withMessage('Currency must be 3 characters'),
    body('salaryPeriod')
      .optional()
      .isIn(['monthly', 'yearly', 'hourly'])
      .withMessage('Invalid salary period'),
    body('location')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Location cannot exceed 100 characters'),
    body('isRemote')
      .optional()
      .isBoolean()
      .withMessage('isRemote must be a boolean'),
    body('remoteType')
      .optional()
      .isIn(['fully_remote', 'hybrid', 'on_site'])
      .withMessage('Invalid remote type'),
    body('applicationDeadline')
      .optional()
      .isISO8601()
      .withMessage('Invalid date format'),
    body('categoryId')
      .isMongoId()
      .withMessage('Valid category ID is required'),
    body('companyId')
      .isMongoId()
      .withMessage('Valid company ID is required'),
    body('skills')
      .optional()
      .isArray()
      .withMessage('Skills must be an array'),
  ],
  validate,
  jobController.createJob
);

router.patch(
  '/:id',
  [
    body('title')
      .optional()
      .trim()
      .isLength({ min: 5, max: 100 })
      .withMessage('Job title must be between 5 and 100 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 5000 })
      .withMessage('Description cannot exceed 5000 characters'),
    body('requirements')
      .optional()
      .trim()
      .isLength({ max: 3000 })
      .withMessage('Requirements cannot exceed 3000 characters'),
    body('responsibilities')
      .optional()
      .trim()
      .isLength({ max: 3000 })
      .withMessage('Responsibilities cannot exceed 3000 characters'),
    body('benefits')
      .optional()
      .trim()
      .isLength({ max: 2000 })
      .withMessage('Benefits cannot exceed 2000 characters'),
    body('type')
      .optional()
      .isIn(['full_time', 'part_time', 'contract', 'internship', 'remote', 'hybrid'])
      .withMessage('Invalid job type'),
    body('experienceLevel')
      .optional()
      .isIn(['entry', 'junior', 'mid', 'senior', 'lead', 'executive'])
      .withMessage('Invalid experience level'),
    body('educationLevel')
      .optional()
      .isIn(['high_school', 'diploma', 'bachelor', 'master', 'phd', 'any'])
      .withMessage('Invalid education level'),
    body('salaryMin')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Salary min must be a positive number'),
    body('salaryMax')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Salary max must be a positive number'),
    body('salaryCurrency')
      .optional()
      .isLength({ min: 3, max: 3 })
      .withMessage('Currency must be 3 characters'),
    body('salaryPeriod')
      .optional()
      .isIn(['monthly', 'yearly', 'hourly'])
      .withMessage('Invalid salary period'),
    body('location')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Location cannot exceed 100 characters'),
    body('isRemote')
      .optional()
      .isBoolean()
      .withMessage('isRemote must be a boolean'),
    body('remoteType')
      .optional()
      .isIn(['fully_remote', 'hybrid', 'on_site'])
      .withMessage('Invalid remote type'),
    body('applicationDeadline')
      .optional()
      .isISO8601()
      .withMessage('Invalid date format'),
    body('categoryId')
      .optional()
      .isMongoId()
      .withMessage('Valid category ID required'),
    body('skills')
      .optional()
      .isArray()
      .withMessage('Skills must be an array'),
    body('status')
      .optional()
      .isIn(['draft', 'published', 'closed', 'expired', 'archived'])
      .withMessage('Invalid job status'),
  ],
  validate,
  jobController.updateJob
);

router.delete('/:id', jobController.deleteJob);

router.post('/:id/publish', jobController.publishJob);
router.post('/:id/close', jobController.closeJob);
router.post('/:id/archive', jobController.archiveJob);

// Admin routes
router.use('/admin', restrictTo('admin'));

router.get('/admin', jobController.adminGetAllJobs);
router.get('/admin/:id', jobController.adminGetJob);

router.patch(
  '/admin/:id',
  [
    body('title')
      .optional()
      .trim()
      .isLength({ min: 5, max: 100 })
      .withMessage('Job title must be between 5 and 100 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 5000 })
      .withMessage('Description cannot exceed 5000 characters'),
    body('requirements')
      .optional()
      .trim()
      .isLength({ max: 3000 })
      .withMessage('Requirements cannot exceed 3000 characters'),
    body('responsibilities')
      .optional()
      .trim()
      .isLength({ max: 3000 })
      .withMessage('Responsibilities cannot exceed 3000 characters'),
    body('benefits')
      .optional()
      .trim()
      .isLength({ max: 2000 })
      .withMessage('Benefits cannot exceed 2000 characters'),
    body('type')
      .optional()
      .isIn(['full_time', 'part_time', 'contract', 'internship', 'remote', 'hybrid'])
      .withMessage('Invalid job type'),
    body('experienceLevel')
      .optional()
      .isIn(['entry', 'junior', 'mid', 'senior', 'lead', 'executive'])
      .withMessage('Invalid experience level'),
    body('educationLevel')
      .optional()
      .isIn(['high_school', 'diploma', 'bachelor', 'master', 'phd', 'any'])
      .withMessage('Invalid education level'),
    body('salaryMin')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Salary min must be a positive number'),
    body('salaryMax')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Salary max must be a positive number'),
    body('salaryCurrency')
      .optional()
      .isLength({ min: 3, max: 3 })
      .withMessage('Currency must be 3 characters'),
    body('salaryPeriod')
      .optional()
      .isIn(['monthly', 'yearly', 'hourly'])
      .withMessage('Invalid salary period'),
    body('location')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Location cannot exceed 100 characters'),
    body('isRemote')
      .optional()
      .isBoolean()
      .withMessage('isRemote must be a boolean'),
    body('remoteType')
      .optional()
      .isIn(['fully_remote', 'hybrid', 'on_site'])
      .withMessage('Invalid remote type'),
    body('applicationDeadline')
      .optional()
      .isISO8601()
      .withMessage('Invalid date format'),
    body('categoryId')
      .optional()
      .isMongoId()
      .withMessage('Valid category ID required'),
    body('skills')
      .optional()
      .isArray()
      .withMessage('Skills must be an array'),
    body('status')
      .optional()
      .isIn(['draft', 'published', 'closed', 'expired', 'archived'])
      .withMessage('Invalid job status'),
    body('featured')
      .optional()
      .isBoolean()
      .withMessage('Featured must be a boolean'),
    body('featuredUntil')
      .optional()
      .isISO8601()
      .withMessage('Invalid date format'),
  ],
  validate,
  jobController.adminUpdateJob
);

router.delete('/admin/:id', jobController.adminDeleteJob);

router.patch(
  '/admin/:id/feature',
  [
    body('featured')
      .isBoolean()
      .withMessage('Featured must be a boolean'),
    body('featuredUntil')
      .optional()
      .isISO8601()
      .withMessage('Invalid date format'),
  ],
  validate,
  jobController.adminFeatureJob
);

module.exports = router;