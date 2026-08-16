const jobService = require('../services/jobService');
const ApiResponse = require('../utils/apiResponse');
const catchAsync = require('../utils/catchAsync');
const { AppError, NotFoundError } = require('../utils/errors');
const { protect, restrictTo } = require('../middleware/auth');

class JobController {
  createJob = catchAsync(async (req, res, next) => {
    const job = await jobService.createJob(req.user.id, req.body);
    
    const response = ApiResponse.created({ job }, 'Job created successfully');
    res.status(201).json(response);
  });

  getJob = catchAsync(async (req, res, next) => {
    const job = await jobService.getPublicJob(req.params.id);
    
    const response = ApiResponse.success({ job }, 'Job fetched successfully');
    res.status(200).json(response);
  });

  updateJob = catchAsync(async (req, res, next) => {
    const job = await jobService.updateJob(req.params.id, req.user.id, req.body);
    
    const response = ApiResponse.success({ job }, 'Job updated successfully');
    res.status(200).json(response);
  });

  deleteJob = catchAsync(async (req, res, next) => {
    await jobService.deleteJob(req.params.id, req.user.id);
    
    const response = ApiResponse.success(null, 'Job deleted successfully');
    res.status(200).json(response);
  });

  publishJob = catchAsync(async (req, res, next) => {
    const job = await jobService.publishJob(req.params.id, req.user.id);
    
    const response = ApiResponse.success({ job }, 'Job published successfully');
    res.status(200).json(response);
  });

  closeJob = catchAsync(async (req, res, next) => {
    const job = await jobService.closeJob(req.params.id, req.user.id);
    
    const response = ApiResponse.success({ job }, 'Job closed successfully');
    res.status(200).json(response);
  });

  archiveJob = catchAsync(async (req, res, next) => {
    const job = await jobService.archiveJob(req.params.id, req.user.id);
    
    const response = ApiResponse.success({ job }, 'Job archived successfully');
    res.status(200).json(response);
  });

  getMyJobs = catchAsync(async (req, res, next) => {
    const { page, limit, sort, status, type } = req.query;
    
    const result = await jobService.getMyJobs(req.user.id,
      { status, type },
      { page: parseInt(page) || 1, limit: parseInt(limit) || 20, sort: sort || '-createdAt' }
    );
    
    const response = ApiResponse.success(result.data, 'Jobs fetched successfully', 200, result.meta);
    res.status(200).json(response);
  });

  getCompanyJobs = catchAsync(async (req, res, next) => {
    const { page, limit, sort, status, type } = req.query;
    
    const result = await jobService.getCompanyJobs(req.params.companyId,
      { status, type },
      { page: parseInt(page) || 1, limit: parseInt(limit) || 20, sort: sort || '-createdAt' }
    );
    
    const response = ApiResponse.success(result.data, 'Jobs fetched successfully', 200, result.meta);
    res.status(200).json(response);
  });

  getJobStats = catchAsync(async (req, res, next) => {
    const stats = await jobService.getJobStats(req.params.id);
    
    const response = ApiResponse.success(stats, 'Job stats fetched successfully');
    res.status(200).json(response);
  });

  // Public routes
  getAllJobs = catchAsync(async (req, res, next) => {
    const { 
      page, limit, sort, query, categoryId, location, type, 
      experienceLevel, salaryMin, salaryMax, isRemote, 
      companyId, featured, skills 
    } = req.query;

    const skillsArray = skills ? (Array.isArray(skills) ? skills : skills.split(',')) : undefined;

    const result = await jobService.getJobs(
      { 
        query, categoryId, location, type, experienceLevel, 
        salaryMin: salaryMin ? parseInt(salaryMin) : undefined,
        salaryMax: salaryMax ? parseInt(salaryMax) : undefined,
        isRemote, companyId, featured: featured === 'true' ? true : featured === 'false' ? false : undefined,
        skills: skillsArray 
      },
      { page: parseInt(page) || 1, limit: parseInt(limit) || 20, sort: sort || 'newest' }
    );
    
    const response = ApiResponse.success(result.data, 'Jobs fetched successfully', 200, result.meta);
    res.status(200).json(response);
  });

  searchJobs = catchAsync(async (req, res, next) => {
    const { q, page, limit } = req.query;
    
    if (!q || q.trim().length < 2) {
      throw new AppError('Search query must be at least 2 characters', 400);
    }
    
    const result = await jobService.searchJobs(q.trim(), { 
      page: parseInt(page) || 1, 
      limit: parseInt(limit) || 20 
    });
    
    const response = ApiResponse.success(result.data, 'Jobs fetched successfully', 200, result.meta);
    res.status(200).json(response);
  });

  getFeaturedJobs = catchAsync(async (req, res, next) => {
    const limit = parseInt(req.query.limit) || 10;
    const jobs = await jobService.getFeaturedJobs(limit);
    
    const response = ApiResponse.success({ jobs }, 'Featured jobs fetched successfully');
    res.status(200).json(response);
  });

  getRecommendedJobs = catchAsync(async (req, res, next) => {
    const limit = parseInt(req.query.limit) || 10;
    const jobs = await jobService.getRecommendedJobs(req.user.id, limit);
    
    const response = ApiResponse.success({ jobs }, 'Recommended jobs fetched successfully');
    res.status(200).json(response);
  });

  // Admin routes
  adminGetAllJobs = catchAsync(async (req, res, next) => {
    const { 
      page, limit, sort, query, categoryId, location, type, 
      experienceLevel, salaryMin, salaryMax, isRemote, 
      companyId, postedById, status, featured, skills 
    } = req.query;

    const skillsArray = skills ? (Array.isArray(skills) ? skills : skills.split(',')) : undefined;

    const result = await jobService.getJobs(
      { 
        query, categoryId, location, type, experienceLevel, 
        salaryMin: salaryMin ? parseInt(salaryMin) : undefined,
        salaryMax: salaryMax ? parseInt(salaryMax) : undefined,
        isRemote, companyId, postedById, 
        status, featured: featured === 'true' ? true : featured === 'false' ? false : undefined,
        skills: skillsArray 
      },
      { page: parseInt(page) || 1, limit: parseInt(limit) || 20, sort: sort || '-createdAt' }
    );
    
    const response = ApiResponse.success(result.data, 'Jobs fetched successfully', 200, result.meta);
    res.status(200).json(response);
  });

  adminGetJob = catchAsync(async (req, res, next) => {
    const job = await jobService.getJobById(req.params.id, true);
    
    const response = ApiResponse.success({ job }, 'Job fetched successfully');
    res.status(200).json(response);
  });

  adminUpdateJob = catchAsync(async (req, res, next) => {
    const job = await jobService.updateJob(req.params.id, req.user.id, req.body, true);
    
    const response = ApiResponse.success({ job }, 'Job updated successfully');
    res.status(200).json(response);
  });

  adminDeleteJob = catchAsync(async (req, res, next) => {
    await jobService.deleteJob(req.params.id, req.user.id, true);
    
    const response = ApiResponse.success(null, 'Job deleted successfully');
    res.status(200).json(response);
  });

  adminFeatureJob = catchAsync(async (req, res, next) => {
    const { featured, featuredUntil } = req.body;
    const job = await jobService.updateJob(req.params.id, req.user.id, { featured, featuredUntil }, true);
    
    const response = ApiResponse.success({ job }, `Job ${featured ? 'featured' : 'unfeatured'} successfully`);
    res.status(200).json(response);
  });
}

module.exports = new JobController();