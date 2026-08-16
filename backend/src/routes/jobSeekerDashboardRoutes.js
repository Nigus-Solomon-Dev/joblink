const express = require('express');
const { query } = require('express-validator');
const jobSeekerDashboardController = require('../controllers/jobSeekerDashboardController');
const { validate } = require('../utils/validation');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

router.use(protect, restrictTo('job_seeker'));

router.get('/stats', jobSeekerDashboardController.getDashboardStats);
router.get('/applications', jobSeekerDashboardController.getApplications);
router.get('/saved-jobs', jobSeekerDashboardController.getSavedJobs);
router.get('/recommended-jobs', jobSeekerDashboardController.getRecommendedJobs);
router.get('/application-timeline', jobSeekerDashboardController.getApplicationTimeline);
router.get('/skill-gap', jobSeekerDashboardController.getSkillGapAnalysis);
router.get('/salary-insights', jobSeekerDashboardController.getSalaryInsights);
router.get('/activity-heatmap', jobSeekerDashboardController.getActivityHeatmap);
router.get('/profile-completeness', jobSeekerDashboardController.getProfileCompleteness);

module.exports = router;