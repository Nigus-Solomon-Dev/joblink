const express = require('express');
const { query, param } = require('express-validator');
const employerDashboardController = require('../controllers/employerDashboardController');
const { validate } = require('../utils/validation');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

router.use(protect, restrictTo('employer', 'admin'));

router.get('/stats', employerDashboardController.getDashboardStats);

router.get('/analytics', employerDashboardController.getJobAnalytics);

router.get('/applications', employerDashboardController.getApplicationPipeline);

router.get('/companies', employerDashboardController.getCompanyOverview);

router.get('/company/:companyId/team', employerDashboardController.getTeamMembers);

router.get('/subscription', employerDashboardController.getSubscriptionInfo);

module.exports = router;