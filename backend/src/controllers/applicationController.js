const applicationService = require('../services/applicationService');
const { ApiResponse } = require('../utils/apiResponse');
const catchAsync = require('../utils/catchAsync');
const { AppError, NotFoundError } = require('../utils/errors');
const { protect, restrictTo } = require('../middleware/auth');

class ApplicationController {
  applyToJob = catchAsync(async (req, res, next) => {
    const { jobId } = req.params;
    const application = await applicationService.applyToJob(jobId, req.user.id, req.body);
    
    const response = ApiResponse.created({ application }, 'Application submitted successfully');
    res.status(201).json(response);
  });

  getApplication = catchAsync(async (req, res, next) => {
    const application = await applicationService.getApplicationById(req.params.id, req.user.id);
    
    const response = ApiResponse.success({ application }, 'Application fetched successfully');
    res.status(200).json(response);
  });

  updateStatus = catchAsync(async (req, res, next) => {
    const { status, notes } = req.body;
    const application = await applicationService.updateApplicationStatus(req.params.id, status, req.user.id, notes);
    
    const response = ApiResponse.success({ application }, 'Application status updated successfully');
    res.status(200).json(response);
  });

  scheduleInterview = catchAsync(async (req, res, next) => {
    const { date, time, location, meetingLink, type, notes } = req.body;
    const application = await applicationService.scheduleInterview(req.params.id, { date, time, location, meetingLink, type, notes }, req.user.id);
    
    const response = ApiResponse.success({ application }, 'Interview scheduled successfully');
    res.status(200).json(response);
  });

  makeOffer = catchAsync(async (req, res, next) => {
    const { salary, currency, startDate, benefits, notes } = req.body;
    const application = await applicationService.makeOffer(req.params.id, { salary, currency, startDate, benefits, notes }, req.user.id);
    
    const response = ApiResponse.success({ application }, 'Offer made successfully');
    res.status(200).json(response);
  });

  acceptOffer = catchAsync(async (req, res, next) => {
    const application = await applicationService.acceptOffer(req.params.id, req.user.id);
    
    const response = ApiResponse.success({ application }, 'Offer accepted successfully');
    res.status(200).json(response);
  });

  withdrawApplication = catchAsync(async (req, res, next) => {
    const { reason } = req.body;
    const application = await applicationService.withdrawApplication(req.params.id, req.user.id, reason);
    
    const response = ApiResponse.success({ application }, 'Application withdrawn successfully');
    res.status(200).json(response);
  });

  getMyApplications = catchAsync(async (req, res, next) => {
    const { page, limit, sort, status } = req.query;
    
    const result = await applicationService.getMyApplications(req.user.id,
      { status },
      { page: parseInt(page) || 1, limit: parseInt(limit) || 20, sort: sort || '-createdAt' }
    );
    
    const response = ApiResponse.success(result.data, 'Applications fetched successfully', 200, result.meta);
    res.status(200).json(response);
  });

  getCompanyApplications = catchAsync(async (req, res, next) => {
    const { page, limit, sort, status, jobId } = req.query;
    
    const result = await applicationService.getCompanyApplications(req.params.companyId,
      { status, jobId },
      { page: parseInt(page) || 1, limit: parseInt(limit) || 20, sort: sort || '-createdAt' }
    );
    
    const response = ApiResponse.success(result.data, 'Applications fetched successfully', 200, result.meta);
    res.status(200).json(response);
  });

  getJobApplications = catchAsync(async (req, res, next) => {
    const { page, limit, sort, status } = req.query;
    
    const result = await applicationService.getJobApplications(req.params.jobId, req.user.id,
      { status },
      { page: parseInt(page) || 1, limit: parseInt(limit) || 20, sort: sort || '-createdAt' }
    );
    
    const response = ApiResponse.success(result.data, 'Applications fetched successfully', 200, result.meta);
    res.status(200).json(response);
  });

  getApplicationStats = catchAsync(async (req, res, next) => {
    const stats = await applicationService.getApplicationStats(req.params.companyId);
    
    const response = ApiResponse.success(stats, 'Application stats fetched successfully');
    res.status(200).json(response);
  });

  bulkUpdateStatus = catchAsync(async (req, res, next) => {
    const { applicationIds, status, notes } = req.body;
    
    if (!applicationIds || !Array.isArray(applicationIds) || applicationIds.length === 0) {
      throw new AppError('Application IDs are required', 400);
    }
    
    const results = await applicationService.bulkUpdateStatus(applicationIds, status, req.user.id, notes);
    
    const response = ApiResponse.success({ results }, 'Bulk status update completed');
    res.status(200).json(response);
  });
}

module.exports = new ApplicationController();