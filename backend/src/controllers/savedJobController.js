const savedJobService = require('../services/savedJobService');
const { ApiResponse } = require('../utils/apiResponse');
const catchAsync = require('../utils/catchAsync');
const { AppError, NotFoundError } = require('../utils/errors');
const { protect } = require('../middleware/auth');

class SavedJobController {
  saveJob = catchAsync(async (req, res, next) => {
    const { jobId } = req.params;
    const { notes } = req.body;
    
    const savedJob = await savedJobService.saveJob(req.user.id, jobId, notes);
    
    const response = ApiResponse.created({ savedJob }, 'Job saved successfully');
    res.status(201).json(response);
  });

  unsaveJob = catchAsync(async (req, res, next) => {
    const { jobId } = req.params;
    
    await savedJobService.unsaveJob(req.user.id, jobId);
    
    const response = ApiResponse.success(null, 'Job removed from saved jobs');
    res.status(200).json(response);
  });

  isSaved = catchAsync(async (req, res, next) => {
    const { jobId } = req.params;
    
    const isSaved = await savedJobService.isSaved(req.user.id, jobId);
    
    const response = ApiResponse.success({ isSaved }, 'Saved status checked');
    res.status(200).json(response);
  });

  getSavedJobs = catchAsync(async (req, res, next) => {
    const { page, limit, sort, status, search } = req.query;
    
    const result = await savedJobService.getSavedJobs(req.user.id,
      { status, search },
      { page: parseInt(page) || 1, limit: parseInt(limit) || 20, sort: sort || '-createdAt' }
    );
    
    const response = ApiResponse.success(result.data, 'Saved jobs fetched successfully', 200, result.meta);
    res.status(200).json(response);
  });

  getSavedJobCount = catchAsync(async (req, res, next) => {
    const count = await savedJobService.getSavedJobCount(req.user.id);
    
    const response = ApiResponse.success({ count }, 'Saved jobs count fetched');
    res.status(200).json(response);
  });

  updateNotes = catchAsync(async (req, res, next) => {
    const { jobId } = req.params;
    const { notes } = req.body;
    
    if (!notes && notes !== '') {
      throw new AppError('Notes are required', 400);
    }
    
    const savedJob = await savedJobService.updateSavedJobNotes(req.user.id, jobId, notes);
    
    const response = ApiResponse.success({ savedJob }, 'Notes updated successfully');
    res.status(200).json(response);
  });

  addTags = catchAsync(async (req, res, next) => {
    const { jobId } = req.params;
    const { tags } = req.body;
    
    if (!tags || !Array.isArray(tags)) {
      throw new AppError('Tags array is required', 400);
    }
    
    const savedJob = await savedJobService.addTags(req.user.id, jobId, tags);
    
    const response = ApiResponse.success({ savedJob }, 'Tags added successfully');
    res.status(200).json(response);
  });

  removeTags = catchAsync(async (req, res, next) => {
    const { jobId } = req.params;
    const { tags } = req.body;
    
    if (!tags || !Array.isArray(tags)) {
      throw new AppError('Tags array is required', 400);
    }
    
    const savedJob = await savedJobService.removeTags(req.user.id, jobId, tags);
    
    const response = ApiResponse.success({ savedJob }, 'Tags removed successfully');
    res.status(200).json(response);
  });
}

module.exports = new SavedJobController();