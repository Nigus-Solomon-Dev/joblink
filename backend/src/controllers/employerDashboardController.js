const employerDashboardService = require('../services/employerDashboardService');
const ApiResponse = require('../utils/apiResponse');
const catchAsync = require('../utils/catchAsync');
const { AppError, NotFoundError } = require('../utils/errors');
const { protect, restrictTo } = require('../middleware/auth');

class EmployerDashboardController {
  getDashboardStats = catchAsync(async (req, res, next) => {
    const stats = await employerDashboardService.getDashboardStats(req.user.id);
    
    const response = ApiResponse.success(stats, 'Dashboard stats fetched successfully');
    res.status(200).json(response);
  });

  getJobAnalytics = catchAsync(async (req, res, next) => {
    const { period } = req.query;
    
    const analytics = await employerDashboardService.getJobAnalytics(req.user.id, { period });
    
    const response = ApiResponse.success(analytics, 'Job analytics fetched successfully');
    res.status(200).json(response);
  });

  getApplicationPipeline = catchAsync(async (req, res, next) => {
    const { page, limit, status, jobId } = req.query;
    
    const result = await employerDashboardService.getApplicationPipeline(req.user.id, {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      status,
      jobId,
    });
    
    const response = ApiResponse.success(result.data, 'Application pipeline fetched successfully', 200, result.meta);
    res.status(200).json(response);
  });

  getCompanyOverview = catchAsync(async (req, res, next) => {
    const companies = await employerDashboardService.getCompanyOverview(req.user.id);
    
    const response = ApiResponse.success({ companies }, 'Company overview fetched successfully');
    res.status(200).json(response);
  });

  getTeamMembers = catchAsync(async (req, res, next) => {
    const { companyId } = req.params;
    
    const members = await employerDashboardService.getTeamMembers(req.user.id, companyId);
    
    const response = ApiResponse.success({ members }, 'Team members fetched successfully');
    res.status(200).json(response);
  });

  getSubscriptionInfo = catchAsync(async (req, res, next) => {
    const subscription = await employerDashboardService.getSubscriptionInfo(req.user.id);
    
    const response = ApiResponse.success(subscription, 'Subscription info fetched successfully');
    res.status(200).json(response);
  });
}

module.exports = new EmployerDashboardController();