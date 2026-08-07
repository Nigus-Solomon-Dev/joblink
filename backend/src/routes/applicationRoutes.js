const express = require('express');
const { body, param, query } = require('express-validator');
const applicationController = require('../controllers/applicationController');
const { validate } = require('../utils/validation');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Apply to job
router.post(
  '/jobs/:jobId/apply',
  [
    body('coverLetter').optional().trim().isLength({ max: 2000 }).withMessage('Cover letter cannot exceed 2000 characters'),
    body('resume').optional().trim(),
    body('portfolio').optional().trim().isURL().withMessage('Portfolio must be a valid URL'),
    body('expectedSalary').optional().isInt({ min: 0 }).withMessage('Expected salary must be a positive number'),
    body('availabilityDate').optional().isISO8601().withMessage('Invalid date format'),
  ],
  validate,
  applicationController.applyToJob
);

// Get my applications
router.get('/my-applications', applicationController.getMyApplications);

// Get application by ID
router.get('/:id', applicationController.getApplication);

// Update application status (employer/admin)
router.patch(
  '/:id/status',
  [
    body('status').isIn([
      'pending', 'under_review', 'shortlisted', 'interview_scheduled', 
      'interviewed', 'offered', 'accepted', 'rejected', 'withdrawn'
    ]).withMessage('Invalid status'),
    body('notes').optional().trim().isLength({ max: 500 }).withMessage('Notes cannot exceed 500 characters'),
  ],
  validate,
  applicationController.updateStatus
);

// Schedule interview
router.post(
  '/:id/interview',
  [
    body('date').isISO8601().withMessage('Valid date is required'),
    body('time').optional().trim(),
    body('location').optional().trim(),
    body('meetingLink').optional().isURL().withMessage('Meeting link must be a valid URL'),
    body('type').optional().isIn(['phone', 'video', 'in_person']).withMessage('Invalid interview type'),
    body('notes').optional().trim(),
  ],
  validate,
  applicationController.scheduleInterview
);

// Make offer
router.post(
  '/:id/offer',
  [
    body('salary').isInt({ min: 0 }).withMessage('Salary must be a positive number'),
    body('currency').optional().isLength({ min: 3, max: 3 }).withMessage('Currency must be 3 characters'),
    body('startDate').isISO8601().withMessage('Valid start date is required'),
    body('benefits').optional().trim(),
    body('notes').optional().trim(),
  ],
  validate,
  applicationController.makeOffer
);

// Accept offer
router.post('/:id/accept', applicationController.acceptOffer);

// Withdraw application
router.post(
  '/:id/withdraw',
  [
    body('reason').optional().trim().isLength({ max: 500 }).withMessage('Reason cannot exceed 500 characters'),
  ],
  validate,
  applicationController.withdrawApplication
);

// Company routes
router.get('/company/:companyId', applicationController.getCompanyApplications);
router.get('/company/:companyId/stats', applicationController.getApplicationStats);

// Job applications (for job posters)
router.get('/job/:jobId', applicationController.getJobApplications);

// Bulk update
router.post(
  '/bulk-update',
  [
    body('applicationIds').isArray({ min: 1 }).withMessage('At least one application ID is required'),
    body('status').isIn([
      'pending', 'under_review', 'shortlisted', 'interview_scheduled', 
      'interviewed', 'offered', 'accepted', 'rejected', 'withdrawn'
    ]).withMessage('Invalid status'),
    body('notes').optional().trim().isLength({ max: 500 }).withMessage('Notes cannot exceed 500 characters'),
  ],
  validate,
  applicationController.bulkUpdateStatus
);

module.exports = router;