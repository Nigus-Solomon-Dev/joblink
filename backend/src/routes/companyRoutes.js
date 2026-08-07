const express = require('express');
const { body, param, query } = require('express-validator');
const companyController = require('../controllers/companyController');
const { validate } = require('../utils/validation');
const { protect, restrictTo } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// Public routes
router.get('/', companyController.getAllCompanies);
router.get('/search', companyController.searchCompanies);
router.get('/slug/:slug', companyController.getCompanyBySlug);
router.get('/:id', companyController.getCompany);
router.get('/:id/stats', protect, companyController.getCompanyStats);

// Protected routes (require authentication)
router.use(protect);

router.post(
  '/',
  [
    body('name')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Company name must be between 2 and 100 characters'),
    body('description')
      .trim()
      .isLength({ min: 10, max: 2000 })
      .withMessage('Description must be between 10 and 2000 characters'),
    body('website')
      .optional()
      .isURL()
      .withMessage('Please provide a valid URL'),
    body('industry')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Industry cannot exceed 100 characters'),
    body('size')
      .optional()
      .isIn(['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'])
      .withMessage('Invalid company size'),
    body('location')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Location cannot exceed 100 characters'),
    body('foundedYear')
      .optional()
      .isInt({ min: 1900, max: new Date().getFullYear() })
      .withMessage('Invalid founded year'),
  ],
  validate,
  companyController.createCompany
);

router.get('/my-companies', companyController.getMyCompanies);

router.patch(
  '/:id',
  [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Company name must be between 2 and 100 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 2000 })
      .withMessage('Description cannot exceed 2000 characters'),
    body('website')
      .optional()
      .isURL()
      .withMessage('Please provide a valid URL'),
    body('industry')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Industry cannot exceed 100 characters'),
    body('size')
      .optional()
      .isIn(['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'])
      .withMessage('Invalid company size'),
    body('location')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Location cannot exceed 100 characters'),
    body('foundedYear')
      .optional()
      .isInt({ min: 1900, max: new Date().getFullYear() })
      .withMessage('Invalid founded year'),
    body('benefits')
      .optional()
      .isArray()
      .withMessage('Benefits must be an array'),
    body('socialLinks.linkedin')
      .optional()
      .matches(/^https?:\/\/(www\.)?linkedin\.com\/.*/)
      .withMessage('Please provide a valid LinkedIn URL'),
    body('socialLinks.twitter')
      .optional()
      .matches(/^https?:\/\/(www\.)?(twitter\.com|x\.com)\/.*/)
      .withMessage('Please provide a valid Twitter/X URL'),
    body('socialLinks.facebook')
      .optional()
      .matches(/^https?:\/\/(www\.)?facebook\.com\/.*/)
      .withMessage('Please provide a valid Facebook URL'),
  ],
  validate,
  companyController.updateCompany
);

router.delete('/:id', companyController.deleteCompany);

router.post(
  '/:id/logo',
  upload.single('logo'),
  companyController.uploadLogo
);

router.post(
  '/:id/cover',
  upload.single('coverImage'),
  companyController.uploadCoverImage
);

// Member management
router.post(
  '/:id/members',
  [
    body('userId')
      .isMongoId()
      .withMessage('Valid user ID is required'),
    body('role')
      .optional()
      .isIn(['admin', 'recruiter', 'viewer'])
      .withMessage('Invalid role'),
  ],
  validate,
  companyController.addMember
);

router.delete('/:id/members/:memberId', companyController.removeMember);

router.patch(
  '/:id/members/:memberId',
  [
    body('role')
      .isIn(['admin', 'recruiter', 'viewer'])
      .withMessage('Invalid role'),
  ],
  validate,
  companyController.updateMemberRole
);

// Admin routes
router.use('/admin', restrictTo('admin'));

router.get('/admin', companyController.adminGetAllCompanies);
router.get('/admin/:id', companyController.adminGetCompany);

router.patch(
  '/admin/:id',
  [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Company name must be between 2 and 100 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 2000 })
      .withMessage('Description cannot exceed 2000 characters'),
    body('website')
      .optional()
      .isURL()
      .withMessage('Please provide a valid URL'),
    body('industry')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Industry cannot exceed 100 characters'),
    body('size')
      .optional()
      .isIn(['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'])
      .withMessage('Invalid company size'),
    body('location')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Location cannot exceed 100 characters'),
    body('foundedYear')
      .optional()
      .isInt({ min: 1900, max: new Date().getFullYear() })
      .withMessage('Invalid founded year'),
    body('isVerified')
      .optional()
      .isBoolean()
      .withMessage('isVerified must be a boolean'),
    body('verificationDocuments')
      .optional()
      .isArray()
      .withMessage('Verification documents must be an array'),
  ],
  validate,
  companyController.adminUpdateCompany
);

router.delete('/admin/:id', companyController.adminDeleteCompany);

router.patch(
  '/admin/:id/verify',
  [
    body('isVerified')
      .isBoolean()
      .withMessage('isVerified must be a boolean'),
  ],
  validate,
  companyController.adminVerifyCompany
);

module.exports = router;