const adminDashboardService = require('../services/adminDashboardService');
const ApiResponse = require('../utils/apiResponse');
const catchAsync = require('../utils/catchAsync');
const { protect, restrictTo } = require('../middleware/auth');

class AdminDashboardController {
  getSystemOverview = catchAsync(async (req, res, next) => {
    const overview = await adminDashboardService.getSystemOverview();
    
    const response = ApiResponse.success(overview, 'System overview fetched successfully');
    res.status(200).json(response);
  });

  getUserAnalytics = catchAsync(async (req, res, next) => {
    const { period } = req.query;
    const analytics = await adminDashboardService.getUserAnalytics({ period });
    
    const response = ApiResponse.success(analytics, 'User analytics fetched successfully');
    res.status(200).json(response);
  });

  getCompanyAnalytics = catchAsync(async (req, res, next) => {
    const { period } = req.query;
    const analytics = await adminDashboardService.getCompanyAnalytics({ period });
    
    const response = ApiResponse.success(analytics, 'Company analytics fetched successfully');
    res.status(200).json(response);
  });

  getJobAnalytics = catchAsync(async (req, res, next) => {
    const { period } = req.query;
    const analytics = await adminDashboardService.getJobAnalytics({ period });
    
    const response = ApiResponse.success(analytics, 'Job analytics fetched successfully');
    res.status(200).json(response);
  });

  getRevenueAnalytics = catchAsync(async (req, res, next) => {
    const analytics = await adminDashboardService.getRevenueAnalytics();
    
    const response = ApiResponse.success(analytics, 'Revenue analytics fetched successfully');
    res.status(200).json(response);
  });

  getSystemHealth = catchAsync(async (req, res, next) => {
    const health = await adminDashboardService.getSystemHealth();
    
    const response = ApiResponse.success(health, 'System health fetched successfully');
    res.status(200).json(response);
  });

  getAuditLogs = catchAsync(async (req, res, next) => {
    const { page, limit, action, entityType, userId, startDate, endDate } = req.query;
    
    const result = await adminDashboardService.getAuditLogs({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 50,
      action,
      entityType,
      userId,
      startDate,
      endDate,
    });
    
    const response = ApiResponse.success(result.data, 'Audit logs fetched successfully', 200, result.meta);
    res.status(200).json(response);
  });

  getSettings = catchAsync(async (req, res, next) => {
    const settings = await adminDashboardService.getSettings();
    
    const response = ApiResponse.success(settings, 'Settings fetched successfully');
    res.status(200).json(response);
  });

  updateSettings = catchAsync(async (req, res, next) => {
    const result = await adminDashboardService.updateSettings(req.body);
    
    const response = ApiResponse.success(result, 'Settings updated successfully');
    res.status(200).json(response);
  });
}

module.exports = new AdminDashboardController();