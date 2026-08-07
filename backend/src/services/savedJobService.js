const { AppError, NotFoundError } = require('../utils/errors');
const { paginate } = require('../utils/helpers');

class SavedJobService {
  async saveJob(userId, jobId, notes = '') {
    const Job = require('../models').Job;
    const SavedJob = require('../models').SavedJob;
    const User = require('../models').User;
    const Notification = require('../models').Notification;

    const job = await Job.findById(jobId);
    if (!job) {
      throw new NotFoundError('Job not found');
    }

    if (job.status !== 'published') {
      throw new AppError('Can only save published jobs', 400);
    }

    const existing = await SavedJob.findOne({ userId, jobId });
    if (existing) {
      throw new AppError('Job already saved', 400);
    }

    const savedJob = await SavedJob.create({
      userId,
      jobId,
      notes,
    });

    await job.incrementSaves();

    await User.findByIdAndUpdate(userId, { $addToSet: { savedJobs: jobId } });

    return savedJob;
  }

  async unsaveJob(userId, jobId) {
    const Job = require('../models').Job;
    const SavedJob = require('../models').SavedJob;
    const User = require('../models').User;

    const savedJob = await SavedJob.findOneAndDelete({ userId, jobId });
    if (!savedJob) {
      throw new NotFoundError('Saved job not found');
    }

    await Job.findByIdAndUpdate(jobId, { $inc: { savesCount: -1 } });
    await User.findByIdAndUpdate(userId, { $pull: { savedJobs: jobId } });

    return true;
  }

  async isSaved(userId, jobId) {
    const SavedJob = require('../models').SavedJob;
    const saved = await SavedJob.findOne({ userId, jobId });
    return !!saved;
  }

  async getSavedJobs(userId, filters = {}, options = {}) {
    const SavedJob = require('../models').SavedJob;

    const { page = 1, limit = 20, sort = '-createdAt' } = options;
    const { status, search, tags } = filters;

    const query = { userId };

    const pagination = paginate(page, limit, await SavedJob.countDocuments(query));

    let savedJobsQuery = SavedJob.find(query)
      .populate({
        path: 'jobId',
        populate: [
          { path: 'companyId', select: 'name slug logo isVerified' },
          { path: 'categoryId', select: 'name slug' },
          { path: 'skills', select: 'name slug' },
        ],
      })
      .sort(sort)
      .skip(pagination.skip)
      .limit(pagination.limit);

    const savedJobs = await savedJobsQuery.lean();

    let jobs = savedJobs.map(s => s.jobId).filter(Boolean);

    if (status) {
      jobs = jobs.filter(j => j.status === status);
    }
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      jobs = jobs.filter(j => 
        searchRegex.test(j.title) || 
        searchRegex.test(j.companyId?.name) || 
        searchRegex.test(j.description)
      );
    }

    return {
      data: jobs,
      meta: pagination,
    };
  }

  async getSavedJobCount(userId) {
    const SavedJob = require('../models').SavedJob;
    return SavedJob.countDocuments({ userId });
  }

  async updateSavedJobNotes(userId, jobId, notes) {
    const SavedJob = require('../models').SavedJob;
    const savedJob = await SavedJob.findOneAndUpdate(
      { userId, jobId },
      { notes },
      { new: true }
    );

    if (!savedJob) {
      throw new NotFoundError('Saved job not found');
    }

    return savedJob;
  }

  async addTags(userId, jobId, tags) {
    const SavedJob = require('../models').SavedJob;
    const savedJob = await SavedJob.findOneAndUpdate(
      { userId, jobId },
      { $addToSet: { tags: { $each: tags } } },
      { new: true }
    );

    if (!savedJob) {
      throw new NotFoundError('Saved job not found');
    }

    return savedJob;
  }

  async removeTags(userId, jobId, tags) {
    const SavedJob = require('../models').SavedJob;
    const savedJob = await SavedJob.findOneAndUpdate(
      { userId, jobId },
      { $pull: { tags: { $in: tags } } },
      { new: true }
    );

    if (!savedJob) {
      throw new NotFoundError('Saved job not found');
    }

    return savedJob;
  }

  async checkExpiringSavedJobs() {
    const Job = require('../models').Job;
    const SavedJob = require('../models').SavedJob;
    const Notification = require('../models').Notification;

    const expiringJobs = await Job.find({
      status: 'published',
      applicationDeadline: { 
        $gte: new Date(), 
        $lte: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) 
      },
    }).select('_id title applicationDeadline');

    for (const job of expiringJobs) {
      const savedJobs = await SavedJob.find({ jobId: job._id }).populate('userId', '_id');
      
      for (const saved of savedJobs) {
        await Notification.create({
          userId: saved.userId._id,
          type: 'system',
          title: 'Saved Job Expiring Soon',
          message: `The job "${job.title}" you saved expires in 3 days`,
          data: { jobId: job._id, deadline: job.applicationDeadline },
          relatedEntity: { entityType: 'job', entityId: job._id },
          priority: 'high',
        });
      }
    }

    return expiringJobs.length;
  }
}

module.exports = new SavedJobService();