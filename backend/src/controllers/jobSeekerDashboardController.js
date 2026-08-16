const jobSeekerDashboardService = require('../services/jobSeekerDashboardService');
const ApiResponse = require('../utils/apiResponse');
const catchAsync = require('../utils/catchAsync');
const { AppError } = require('../utils/errors');
const { protect, restrictTo } = require('../middleware/auth');

class JobSeekerDashboardController {
  getDashboardStats = catchAsync(async (req, res, next) => {
    const stats = await jobSeekerDashboardService.getDashboardStats(req.user.id);
    
    const response = ApiResponse.success(stats, 'Dashboard stats fetched successfully');
    res.status(200).json(response);
  });

  getApplications = catchAsync(async (req, res, next) => {
    const { page, limit, status, sort } = req.query;
    
    const result = await jobSeekerDashboardService.getApplications(req.user.id, {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      status,
      sort: sort || '-createdAt',
    });
    
    const response = ApiResponse.success(result.data, 'Applications fetched successfully', 200, result.meta);
    res.status(200).json(response);
  });

  getSavedJobs = catchAsync(async (req, res, next) => {
    const { page, limit, sort, status, search } = req.query;
    
    const result = await jobSeekerDashboardService.getSavedJobs(req.user.id, {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      sort: sort || '-createdAt',
      status,
      search,
    });
    
    const response = ApiResponse.success(result.data, 'Saved jobs fetched successfully', 200, result.meta);
    res.status(200).json(response);
  });

  getRecommendedJobs = catchAsync(async (req, res, next) => {
    const limit = parseInt(req.query.limit) || 10;
    const jobs = await jobSeekerDashboardService.getRecommendedJobs(req.user.id, limit);
    
    const response = ApiResponse.success({ jobs }, 'Recommended jobs fetched successfully');
    res.status(200).json(response);
  });

  getApplicationTimeline = catchAsync(async (req, res, next) => {
    const timeline = await jobSeekerDashboardService.getApplicationTimeline(req.user.id);
    
    const response = ApiResponse.success({ timeline }, 'Application timeline fetched successfully');
    res.status(200).json(response);
  });

  getSkillGapAnalysis = catchAsync(async (req, res, next) => {
    const skills = await jobSeekerDashboardService.getSkillGapAnalysis(req.user.id);
    
    const response = ApiResponse.success({ skills }, 'Skill gap analysis fetched successfully');
    res.status(200).json(response);
  });

  getSalaryInsights = catchAsync(async (req, res, next) => {
    const insights = await jobSeekerDashboardService.getSalaryInsights(req.user.id);
    
    const response = ApiResponse.success(insights, 'Salary insights fetched successfully');
    res.status(200).json(response);
  });

  getActivityHeatmap = catchAsync(async (req, res, next) => {
    const heatmap = await jobSeekerDashboardService.getActivityHeatmap(req.user.id);
    
    const response = ApiResponse.success({ heatmap }, 'Activity heatmap fetched successfully');
    res.status(200).json(response);
  });

  getProfileCompleteness = catchAsync(async (req, res, next) => {
    const User = require('../models').User;
    const user = await User.findById(req.user.id).select('name email avatar phone bio location website linkedin skills').lean();
    
    const fields = [
      { field: 'name', label: 'Full Name', weight: 15 },
      { field: 'email', label: 'Email', weight: 10 },
      { field: 'avatar', label: 'Profile Photo', weight: 10 },
      { field: 'phone', label: 'Phone Number', weight: 10 },
      { field: 'bio', label: 'Bio', weight: 15 },
      { field: 'location', label: 'Location', weight: 10 },
      { field: 'website', label: 'Website/Portfolio', weight: 5 },
      { field: 'linkedin', label: 'LinkedIn Profile', weight: 5 },
      { field: 'skills', label: 'Skills', weight: 20 },
    ];

    const completeness = fields.map(({ field, label, weight }) => {
      const value = user[field];
      let completed = false;
      if (Array.isArray(value)) {
        completed = value.length > 0;
      } else {
        completed = value && value.toString().trim() !== '';
      }
      return { field, label, weight, completed };
    });

    const totalWeight = completeness.reduce((sum, f) => sum + f.weight, 0);
    const completedWeight = completeness.filter(f => f.completed).reduce((sum, f) => sum + f.weight, 0);
    const percentage = Math.round((completedWeight / totalWeight) * 100);

    const response = ApiResponse.success({ 
      fields: completeness, 
      percentage,
      totalWeight,
      completedWeight 
    }, 'Profile completeness fetched successfully');
    res.status(200).json(response);
  });
}

module.exports = new JobSeekerDashboardController();