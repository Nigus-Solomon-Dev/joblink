const { AppError, NotFoundError } = require('../utils/errors');
const { JOB_STATUS, JOB_TYPE } = require('../constants');
const { paginate } = require('../utils/helpers');

class JobService {
  async createJob(postedById, jobData) {
    const Job = require('../models').Job;
    const Company = require('../models').Company;
    const Category = require('../models').Category;
    const Skill = require('../models').Skill;

    const company = await Company.findById(jobData.companyId);
    if (!company) {
      throw new NotFoundError('Company not found');
    }

    const isMember = company.members.some(m => m.userId.toString() === postedById.toString() && ['owner', 'admin', 'recruiter'].includes(m.role));
    if (!isMember && company.ownerId.toString() !== postedById.toString()) {
      throw new AppError('You are not authorized to post jobs for this company', 403);
    }

    const category = await Category.findById(jobData.categoryId);
    if (!category || !category.isActive) {
      throw new NotFoundError('Category not found or inactive');
    }

    if (jobData.skills && jobData.skills.length > 0) {
      const skills = await Skill.find({ _id: { $in: jobData.skills }, isActive: true });
      if (skills.length !== jobData.skills.length) {
        throw new AppError('One or more skills not found or inactive', 400);
      }
    }

    const job = await Job.create({
      ...jobData,
      postedById,
    });

    await company.incrementJobsCount();
    await category.incrementJobsCount();
    
    if (jobData.skills) {
      for (const skillId of jobData.skills) {
        await Skill.findByIdAndUpdate(skillId, { $inc: { jobsCount: 1 } });
      }
    }

    return job;
  }

  async getJobById(jobId, includePrivate = false) {
    const Job = require('../models').Job;
    const job = await Job.findById(jobId)
      .populate('companyId', 'name slug logo description industry size location isVerified')
      .populate('categoryId', 'name slug')
      .populate('postedById', 'name avatar')
      .populate('skills', 'name slug');

    if (!job) {
      throw new NotFoundError('Job not found');
    }

    if (!includePrivate && job.status !== JOB_STATUS.PUBLISHED) {
      throw new NotFoundError('Job not found');
    }

    return job;
  }

  async getPublicJob(jobId) {
    const job = await this.getJobById(jobId);
    await job.incrementViews();
    return job.toPublicJSON();
  }

  async updateJob(jobId, userId, updateData, isAdmin = false) {
    const Job = require('../models').Job;
    const Category = require('../models').Category;
    const Skill = require('../models').Skill;

    const job = await Job.findById(jobId);
    if (!job) {
      throw new NotFoundError('Job not found');
    }

    const isOwner = job.postedById.toString() === userId.toString();
    if (!isOwner && !isAdmin) {
      throw new AppError('You are not authorized to update this job', 403);
    }

    if (job.status === JOB_STATUS.ARCHIVED && !isAdmin) {
      throw new AppError('Cannot update archived job', 400);
    }

    const allowedFields = [
      'title', 'description', 'requirements', 'responsibilities', 'benefits',
      'type', 'experienceLevel', 'educationLevel', 'salaryMin', 'salaryMax',
      'salaryCurrency', 'salaryPeriod', 'location', 'isRemote', 'remoteType',
      'applicationDeadline', 'categoryId', 'skills'
    ];
    const adminFields = ['status', 'featured', 'featuredUntil'];
    const ownerFields = [...allowedFields, 'status'];

    const allowed = isAdmin ? [...ownerFields, ...adminFields] : ownerFields;

    const updates = {};
    Object.keys(updateData).forEach(key => {
      if (allowed.includes(key)) {
        updates[key] = updateData[key];
      }
    });

    if (updates.categoryId) {
      const category = await Category.findById(updates.categoryId);
      if (!category || !category.isActive) {
        throw new NotFoundError('Category not found or inactive');
      }
      
      if (updates.categoryId.toString() !== job.categoryId.toString()) {
        await Category.findByIdAndUpdate(job.categoryId, { $inc: { jobsCount: -1 } });
        await category.incrementJobsCount();
      }
    }

    if (updates.skills) {
      const skills = await Skill.find({ _id: { $in: updates.skills }, isActive: true });
      if (skills.length !== updates.skills.length) {
        throw new AppError('One or more skills not found or inactive', 400);
      }

      const oldSkills = job.skills.map(s => s.toString());
      const newSkills = updates.skills.map(s => s.toString());
      
      const removedSkills = oldSkills.filter(s => !newSkills.includes(s));
      const addedSkills = newSkills.filter(s => !oldSkills.includes(s));

      for (const skillId of removedSkills) {
        await Skill.findByIdAndUpdate(skillId, { $inc: { jobsCount: -1 } });
      }
      for (const skillId of addedSkills) {
        await Skill.findByIdAndUpdate(skillId, { $inc: { jobsCount: 1 } });
      }
    }

    if (updates.status === JOB_STATUS.PUBLISHED && job.status !== JOB_STATUS.PUBLISHED) {
      updates.publishedAt = new Date();
      if (!job.expiresAt) {
        updates.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      }
    }

    const updatedJob = await Job.findByIdAndUpdate(jobId, updates, {
      new: true,
      runValidators: true,
    }).populate('companyId', 'name slug logo')
      .populate('categoryId', 'name slug')
      .populate('skills', 'name slug');

    if (updates.status === JOB_STATUS.PUBLISHED && job.status !== JOB_STATUS.PUBLISHED) {
      await this._notifyTelegramSubscribers(updatedJob);
    }

    return updatedJob;
  }

  async deleteJob(jobId, userId, isAdmin = false) {
    const Job = require('../models').Job;
    const Company = require('../models').Company;
    const Category = require('../models').Category;
    const Skill = require('../models').Skill;
    const Application = require('../models').Application;

    const job = await Job.findById(jobId);
    if (!job) {
      throw new NotFoundError('Job not found');
    }

    const isOwner = job.postedById.toString() === userId.toString();
    if (!isOwner && !isAdmin) {
      throw new AppError('You are not authorized to delete this job', 403);
    }

    await Application.deleteMany({ jobId });
    await Job.findByIdAndDelete(jobId);

    await Company.findByIdAndUpdate(job.companyId, { $inc: { jobsCount: -1 } });
    await Category.findByIdAndUpdate(job.categoryId, { $inc: { jobsCount: -1 } });

    for (const skillId of job.skills) {
      await Skill.findByIdAndUpdate(skillId, { $inc: { jobsCount: -1 } });
    }

    return true;
  }

  async publishJob(jobId, userId) {
    const Job = require('../models').Job;
    const job = await Job.findById(jobId);
    
    if (!job) {
      throw new NotFoundError('Job not found');
    }

    const isOwner = job.postedById.toString() === userId.toString();
    if (!isOwner) {
      throw new AppError('You are not authorized to publish this job', 403);
    }

    await job.publish();
    await job.populate('companyId', 'name');
    await this._notifyTelegramSubscribers(job);

    return job;
  }

  async _notifyTelegramSubscribers(job) {
    try {
      const telegramBotService = require('./telegramBotService');
      await telegramBotService.notifySubscribedUsers(job);
    } catch (error) {
      const Logger = require('../utils/logger');
      Logger.error('Failed to notify Telegram subscribers about job', { error: error.message });
    }
  }

  async closeJob(jobId, userId) {
    const Job = require('../models').Job;
    const job = await Job.findById(jobId);
    
    if (!job) {
      throw new NotFoundError('Job not found');
    }

    const isOwner = job.postedById.toString() === userId.toString();
    if (!isOwner) {
      throw new AppError('You are not authorized to close this job', 403);
    }

    return job.close();
  }

  async archiveJob(jobId, userId) {
    const Job = require('../models').Job;
    const job = await Job.findById(jobId);
    
    if (!job) {
      throw new NotFoundError('Job not found');
    }

    const isOwner = job.postedById.toString() === userId.toString();
    if (!isOwner) {
      throw new AppError('You are not authorized to archive this job', 403);
    }

    return job.archive();
  }

  async getJobs(filters = {}, options = {}) {
    const Job = require('../models').Job;

    const { page = 1, limit = 20, sort = '-publishedAt' } = options;
    const { 
      query, categoryId, location, type, experienceLevel, 
      salaryMin, salaryMax, isRemote, companyId, postedById,
      status, featured, skills 
    } = filters;

    const queryObj = {};

    if (status) {
      queryObj.status = status;
    } else {
      queryObj.status = JOB_STATUS.PUBLISHED;
    }

    if (query) {
      queryObj.$text = { $search: query };
    }
    if (categoryId) queryObj.categoryId = categoryId;
    if (location) queryObj.location = { $regex: location, $options: 'i' };
    if (type) queryObj.type = type;
    if (experienceLevel) queryObj.experienceLevel = experienceLevel;
    if (isRemote !== undefined) queryObj.isRemote = isRemote === 'true';
    if (companyId) queryObj.companyId = companyId;
    if (postedById) queryObj.postedById = postedById;
    if (featured !== undefined) queryObj.featured = featured === 'true';
    if (skills && skills.length > 0) queryObj.skills = { $in: skills };

    if (salaryMin || salaryMax) {
      queryObj.$and = [];
      if (salaryMin) {
        queryObj.$and.push({ $or: [{ salaryMax: { $gte: salaryMin } }, { salaryMin: { $gte: salaryMin } }] });
      }
      if (salaryMax) {
        queryObj.$and.push({ $or: [{ salaryMin: { $lte: salaryMax } }, { salaryMax: { $lte: salaryMax } }] });
      }
      if (queryObj.$and.length === 0) delete queryObj.$and;
    }

    const pagination = paginate(page, limit, await Job.countDocuments(queryObj));

    let sortObj = {};
    switch (sort) {
      case 'newest': sortObj = { publishedAt: -1 }; break;
      case 'oldest': sortObj = { publishedAt: 1 }; break;
      case 'salary_high': sortObj = { salaryMax: -1 }; break;
      case 'salary_low': sortObj = { salaryMin: 1 }; break;
      case 'relevance': sortObj = { score: { $meta: 'textScore' } }; break;
      default: sortObj = { publishedAt: -1 };
    }

    let jobsQuery = Job.find(queryObj)
      .populate('companyId', 'name slug logo isVerified')
      .populate('categoryId', 'name slug')
      .populate('skills', 'name slug')
      .sort(sortObj)
      .skip(pagination.skip)
      .limit(pagination.limit);

    if (query) {
      jobsQuery = jobsQuery.select({ score: { $meta: 'textScore' } });
    }

    const jobs = await jobsQuery.lean();

    return {
      data: jobs,
      meta: pagination,
    };
  }

  async getMyJobs(userId, filters = {}, options = {}) {
    return this.getJobs({ ...filters, postedById: userId }, options);
  }

  async getCompanyJobs(companyId, filters = {}, options = {}) {
    return this.getJobs({ ...filters, companyId }, options);
  }

  async searchJobs(searchTerm, options = {}) {
    const Job = require('../models').Job;

    const { page = 1, limit = 20 } = options;

    const queryObj = {
      $text: { $search: searchTerm },
      status: JOB_STATUS.PUBLISHED,
    };

    const pagination = paginate(page, limit, await Job.countDocuments(queryObj));

    const jobs = await Job.find(queryObj)
      .populate('companyId', 'name slug logo isVerified')
      .populate('categoryId', 'name slug')
      .select({ score: { $meta: 'textScore' } })
      .sort({ score: { $meta: 'textScore' } })
      .skip(pagination.skip)
      .limit(pagination.limit)
      .lean();

    return {
      data: jobs,
      meta: pagination,
    };
  }

  async getFeaturedJobs(limit = 10) {
    const Job = require('../models').Job;
    return Job.find({
      status: JOB_STATUS.PUBLISHED,
      featured: true,
      featuredUntil: { $gt: new Date() },
    })
      .populate('companyId', 'name slug logo isVerified')
      .populate('categoryId', 'name slug')
      .sort({ featuredUntil: 1 })
      .limit(limit)
      .lean();
  }

  async getRecommendedJobs(userId, limit = 10) {
    const Job = require('../models').Job;
    const User = require('../models').User;
    const Application = require('../models').Application;

    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const appliedJobIds = await Application.find({ applicantId: userId }).distinct('jobId');
    const savedJobIds = user.savedJobs || [];

    const excludedIds = [...appliedJobIds, ...savedJobIds];

    const match = {
      status: JOB_STATUS.PUBLISHED,
      _id: { $nin: excludedIds },
    };

    const userSkillIds = user.skills || [];

    let rankedIds = [];
    let skillMatchMap = new Map();
    if (userSkillIds.length === 0) {
      const recent = await Job.find(match)
        .sort({ featured: -1, publishedAt: -1 })
        .limit(limit)
        .select('_id')
        .lean();
      rankedIds = recent.map((job) => job._id);
    } else {
      const ranked = await Job.aggregate([
        { $match: { ...match, skills: { $in: userSkillIds } } },
        {
          $addFields: {
            skillMatchCount: { $size: { $setIntersection: ['$skills', userSkillIds] } },
          },
        },
        { $sort: { skillMatchCount: -1, featured: -1, publishedAt: -1 } },
        { $limit: limit },
        { $project: { _id: 1, skillMatchCount: 1 } },
      ]);
      rankedIds = ranked.map((job) => job._id);
      ranked.forEach((job) => skillMatchMap.set(job._id.toString(), job.skillMatchCount));
    }

    if (rankedIds.length === 0) {
      if (userSkillIds.length > 0) {
        const recent = await Job.find(match)
          .sort({ featured: -1, publishedAt: -1 })
          .limit(limit)
          .select('_id')
          .lean();
        rankedIds = recent.map((job) => job._id);
      }
      if (rankedIds.length === 0) return [];
    }

    const jobs = await Job.find({ _id: { $in: rankedIds } })
      .populate('companyId', 'name slug logo isVerified')
      .populate('categoryId', 'name slug')
      .populate('skills', 'name slug category')
      .lean();

    const rankOrder = new Map(rankedIds.map((id, index) => [id.toString(), index]));
    jobs.sort((a, b) => rankOrder.get(a._id.toString()) - rankOrder.get(b._id.toString()));

    return jobs.map((job) => ({
      ...job,
      skillMatchCount: skillMatchMap.get(job._id.toString()) ?? 0,
    }));
  }

  async getJobStats(jobId) {
    const Job = require('../models').Job;
    const Application = require('../models').Application;

    const job = await Job.findById(jobId);
    if (!job) {
      throw new NotFoundError('Job not found');
    }

    const applicationsCount = await Application.countDocuments({ jobId });
    const applicationsByStatus = await Application.aggregate([
      { $match: { jobId: job._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    return {
      viewsCount: job.viewsCount,
      applicationsCount,
      savesCount: job.savesCount,
      applicationsByStatus: applicationsByStatus.reduce((acc, item) => ({ ...acc, [item._id]: item.count }), {}),
    };
  }

  async incrementApplicationCount(jobId) {
    const Job = require('../models').Job;
    return Job.findByIdAndUpdate(jobId, { $inc: { applicationsCount: 1 } });
  }

  async decrementApplicationCount(jobId) {
    const Job = require('../models').Job;
    return Job.findByIdAndUpdate(jobId, { $inc: { applicationsCount: -1 } });
  }
}

module.exports = new JobService();