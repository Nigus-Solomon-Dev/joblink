const { AppError, NotFoundError } = require('../utils/errors');
const { paginate } = require('../utils/helpers');
const { APPLICATION_STATUS, JOB_STATUS } = require('../constants');

class JobSeekerDashboardService {
  async getDashboardStats(userId) {
    const Application = require('../models').Application;
    const SavedJob = require('../models').SavedJob;
    const Job = require('../models').Job;
    const User = require('../models').User;

    const [
      totalApplications,
      pendingApplications,
      underReviewApplications,
      interviewApplications,
      acceptedApplications,
      rejectedApplications,
      totalSavedJobs,
      profileCompleteness,
      recentApplications,
      upcomingInterviews,
    ] = await Promise.all([
      Application.countDocuments({ applicantId: userId }),
      Application.countDocuments({ applicantId: userId, status: APPLICATION_STATUS.PENDING }),
      Application.countDocuments({ applicantId: userId, status: APPLICATION_STATUS.UNDER_REVIEW }),
      Application.countDocuments({ applicantId: userId, status: APPLICATION_STATUS.INTERVIEW_SCHEDULED }),
      Application.countDocuments({ applicantId: userId, status: APPLICATION_STATUS.ACCEPTED }),
      Application.countDocuments({ applicantId: userId, status: APPLICATION_STATUS.REJECTED }),
      SavedJob.countDocuments({ userId }),
      this.calculateProfileCompleteness(userId),
      Application.find({ applicantId: userId })
        .populate('jobId', 'title companyId')
        .populate('jobId.companyId', 'name logo')
        .sort('-createdAt')
        .limit(5)
        .lean(),
      Application.find({ 
        applicantId: userId, 
        status: APPLICATION_STATUS.INTERVIEW_SCHEDULED,
        'interviewDetails.date': { $gte: new Date() }
      })
        .populate('jobId', 'title companyId')
        .populate('jobId.companyId', 'name logo')
        .sort('interviewDetails.date')
        .limit(3)
        .lean(),
    ]);

    return {
      overview: {
        totalApplications,
        pendingApplications,
        underReviewApplications,
        interviewApplications,
        acceptedApplications,
        rejectedApplications,
        totalSavedJobs,
        profileCompleteness,
      },
      recentApplications,
      upcomingInterviews,
    };
  }

  async calculateProfileCompleteness(userId) {
    const User = require('../models').User;
    const user = await User.findById(userId).select('name email avatar phone bio location website linkedin skills').lean();
    
    if (!user) return 0;

    const fields = [
      { field: 'name', weight: 15 },
      { field: 'email', weight: 10 },
      { field: 'avatar', weight: 10 },
      { field: 'phone', weight: 10 },
      { field: 'bio', weight: 15 },
      { field: 'location', weight: 10 },
      { field: 'website', weight: 5 },
      { field: 'linkedin', weight: 5 },
      { field: 'skills', weight: 20 },
    ];

    let score = 0;
    fields.forEach(({ field, weight }) => {
      const value = user[field];
      if (Array.isArray(value)) {
        if (value.length > 0) score += weight;
      } else if (value && value.toString().trim() !== '') {
        score += weight;
      }
    });

    return score;
  }

  async getApplications(userId, options = {}) {
    const Application = require('../models').Application;

    const { page = 1, limit = 20, status, sort = '-createdAt' } = options;

    const query = { applicantId: userId };
    if (status) query.status = status;

    const pagination = paginate(page, limit, await Application.countDocuments(query));

    const applications = await Application.find(query)
      .populate('jobId', 'title slug companyId status type location salaryMin salaryMax salaryCurrency salaryPeriod isRemote')
      .populate('jobId.companyId', 'name slug logo isVerified')
      .populate('jobId.categoryId', 'name slug')
      .sort(sort)
      .skip(pagination.skip)
      .limit(pagination.limit)
      .lean();

    return {
      data: applications,
      meta: pagination,
    };
  }

  async getSavedJobs(userId, options = {}) {
    const SavedJob = require('../models').SavedJob;

    const { page = 1, limit = 20, sort = '-createdAt', status, search } = options;

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

  async getRecommendedJobs(userId, limit = 10) {
    const Job = require('../models').Job;
    const User = require('../models').User;
    const Application = require('../models').Application;
    const SavedJob = require('../models').SavedJob;

    const user = await User.findById(userId).select('skills savedJobs').lean();
    if (!user) return [];

    const appliedJobIds = await Application.find({ applicantId: userId }).distinct('jobId');
    const savedJobIds = await SavedJob.find({ userId }).distinct('jobId');
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

  async getApplicationTimeline(userId) {
    const Application = require('../models').Application;

    const applications = await Application.find({ applicantId: userId })
      .populate('jobId', 'title companyId')
      .populate('jobId.companyId', 'name logo')
      .sort('-createdAt')
      .lean();

    const timeline = applications.reduce((acc, app) => {
      const date = new Date(app.createdAt).toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push({
        id: app._id,
        jobTitle: app.jobId?.title,
        companyName: app.jobId?.companyId?.name,
        companyLogo: app.jobId?.companyId?.logo,
        status: app.status,
        appliedAt: app.createdAt,
      });
      return acc;
    }, {});

    return Object.entries(timeline)
      .map(([date, applications]) => ({ date, applications }))
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  async getSkillGapAnalysis(userId) {
    const User = require('../models').User;
    const Job = require('../models').Job;
    const Skill = require('../models').Skill;

    const user = await User.findById(userId).select('skills').lean();
    if (!user) return [];

    const userSkillIds = user.skills || [];
    const userSkills = await Skill.find({ _id: { $in: userSkillIds } }).select('name category').lean();

    const recommendedJobs = await Job.find({
      status: JOB_STATUS.PUBLISHED,
      skills: { $nin: userSkillIds },
    })
      .select('skills')
      .limit(100)
      .lean();

    const skillFrequency = {};
    recommendedJobs.forEach(job => {
      job.skills.forEach(skillId => {
        const skillIdStr = skillId.toString();
        if (!userSkillIds.map(id => id.toString()).includes(skillIdStr)) {
          skillFrequency[skillIdStr] = (skillFrequency[skillIdStr] || 0) + 1;
        }
      });
    });

    const topMissingSkills = Object.entries(skillFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([skillId, count]) => ({ skillId, demand: count }));

    const missingSkillDetails = await Skill.find({ 
      _id: { $in: topMissingSkills.map(s => s.skillId) } 
    }).select('name category').lean();

    return missingSkillDetails.map(skill => ({
      ...skill,
      demand: topMissingSkills.find(s => s.skillId === skill._id.toString())?.demand || 0,
    }));
  }

  async getSalaryInsights(userId) {
    const Application = require('../models').Application;
    const Job = require('../models').Job;

    const userApplications = await Application.find({ applicantId: userId })
      .populate('jobId', 'salaryMin salaryMax salaryCurrency salaryPeriod')
      .lean();

    const appliedSalaries = userApplications
      .map(app => app.jobId)
      .filter(job => job && (job.salaryMin || job.salaryMax))
      .map(job => ({
        min: job.salaryMin,
        max: job.salaryMax,
        currency: job.salaryCurrency,
        period: job.salaryPeriod,
      }));

    const allJobs = await Job.find({ status: JOB_STATUS.PUBLISHED })
      .select('salaryMin salaryMax salaryCurrency salaryPeriod type experienceLevel')
      .lean();

    const marketSalaries = allJobs
      .filter(job => job.salaryMin || job.salaryMax)
      .map(job => ({
        min: job.salaryMin,
        max: job.salaryMax,
        currency: job.salaryCurrency,
        period: job.salaryPeriod,
        type: job.type,
        experienceLevel: job.experienceLevel,
      }));

    return {
      applied: appliedSalaries,
      market: marketSalaries,
    };
  }

  async getActivityHeatmap(userId) {
    const Application = require('../models').Application;
    const SavedJob = require('../models').SavedJob;

    const [applications, savedJobs] = await Promise.all([
      Application.find({ applicantId: userId }).select('createdAt').lean(),
      SavedJob.find({ userId }).select('createdAt').lean(),
    ]);

    const activity = {};

    applications.forEach(app => {
      const date = new Date(app.createdAt).toISOString().split('T')[0];
      activity[date] = (activity[date] || 0) + 1;
    });

    savedJobs.forEach(saved => {
      const date = new Date(saved.createdAt).toISOString().split('T')[0];
      activity[date] = (activity[date] || 0) + 1;
    });

    return Object.entries(activity)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }
}

module.exports = new JobSeekerDashboardService();