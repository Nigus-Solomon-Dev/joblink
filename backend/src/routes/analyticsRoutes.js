const express = require('express');
const { query, body, param } = require('express-validator');
const analyticsController = require('../controllers/analyticsController');
const { validate } = require('../utils/validation');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

router.use(protect);
router.use(restrictTo('admin', 'employer', 'job_seeker'));

router.get('/user-behavior', 
  analyticsController.getUserBehaviorAnalytics
);

router.get('/market-trends', 
  analyticsController.getMarketTrendAnalytics
);

router.get('/funnel', 
  analyticsController.getFunnelAnalytics
);

router.get('/company/:companyId/performance', 
  param('companyId').isMongoId().withMessage('Invalid company ID'),
  validate,
  analyticsController.getCompanyPerformanceMetrics
);

router.get('/revenue', 
  analyticsController.getRevenueAnalytics
);

router.post('/reports/custom', 
  body('reportType').isIn(['users', 'jobs', 'applications', 'companies']).withMessage('Invalid report type'),
  body('dateRange').optional().isObject().withMessage('dateRange must be an object'),
  body('filters').optional().isObject().withMessage('filters must be an object'),
  body('groupBy').optional().isString().withMessage('groupBy must be a string'),
  body('metrics').optional().isArray().withMessage('metrics must be an array'),
  validate,
  analyticsController.buildCustomReport
);

router.get('/export', 
  query('reportType').isIn(['users', 'jobs', 'applications', 'companies']).withMessage('Invalid report type'),
  query('format').optional().isIn(['csv', 'json', 'pdf']).withMessage('Format must be csv, json or pdf'),
  validate,
  analyticsController.exportData
);

router.post('/reports/schedule', 
  body('reportType').isIn(['users', 'jobs', 'applications', 'companies']).withMessage('Invalid report type'),
  body('format').isIn(['csv', 'json', 'pdf']).withMessage('Format must be csv, json or pdf'),
  body('recipients').isArray({ min: 1 }).withMessage('At least one recipient is required'),
  body('frequency').isIn(['hourly', 'daily', 'weekly', 'monthly']).withMessage('Invalid frequency'),
  body('dateRange').optional().isObject().withMessage('dateRange must be an object'),
  body('filters').optional().isObject().withMessage('filters must be an object'),
  validate,
  analyticsController.scheduleReport
);

router.get('/reports/scheduled', 
  analyticsController.getScheduledReports
);

router.delete('/reports/scheduled/:id', 
  param('id').isMongoId().withMessage('Invalid report ID'),
  validate,
  analyticsController.deleteScheduledReport
);

router.get('/realtime', 
  analyticsController.getRealtimeMetrics
);

module.exports = router;