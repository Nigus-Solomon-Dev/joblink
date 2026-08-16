const express = require('express');
const { query } = require('express-validator');
const adminDashboardController = require('../controllers/adminDashboardController');
const { validate } = require('../utils/validation');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

router.use(protect, restrictTo('admin'));

router.get('/overview', adminDashboardController.getSystemOverview);
router.get('/analytics/users', adminDashboardController.getUserAnalytics);
router.get('/analytics/companies', adminDashboardController.getCompanyAnalytics);
router.get('/analytics/jobs', adminDashboardController.getJobAnalytics);
router.get('/analytics/revenue', adminDashboardController.getRevenueAnalytics);
router.get('/health', adminDashboardController.getSystemHealth);
router.get('/audit-logs', adminDashboardController.getAuditLogs);
router.get('/settings', adminDashboardController.getSettings);
router.patch('/settings', adminDashboardController.updateSettings);

module.exports = router;