const { AppError, NotFoundError } = require('../utils/errors');
const { paginate } = require('../utils/helpers');
const { JOB_STATUS, APPLICATION_STATUS } = require('../constants');

class EmployerDashboardService {
  async getDashboardStats(userId) {
    const Job = require('../models').Job;
    const Application = require('../models').Application;
    const Company = require('../models').Company;
    const SavedJob = require('../models').SavedJob;

    const userCompanies = await Company.find({ ownerId: userId }).select('_id');
    const companyIds = userCompanies.map(c => c._id);

    const [
      totalJobs,
      activeJobs,
      draftJobs,
      closedJobs,
      totalApplications,
      pendingApplications,
      interviewedApplications,
      hiredApplications,
      totalViews,
      totalSaves,
      companiesCount,
    ] = await Promise.all([
      Job.countDocuments({ companyId: { $in: companyIds } }),
      Job.countDocuments({ companyId: { $in: companyIds }, status: JOB_STATUS.PUBLISHED }),
      Job.countDocuments({ companyId: { $in: companyIds }, status: JOB_STATUS.DRAFT }),
      Job.countDocuments({ companyId: { $in: companyIds }, status: { $in: [JOB_STATUS.CLOSED, JOB_STATUS.EXPIRED, JOB_STATUS.ARCHIVED] } }),
      Application.countDocuments({ companyId: { $in: companyIds } }),
      Application.countDocuments({ companyId: { $in: companyIds }, status: APPLICATION_STATUS.PENDING }),
      Application.countDocuments({ companyId: { $in: companyIds }, status: APPLICATION_STATUS.INTERVIEWED }),
      Application.countDocuments({ companyId: { $in: companyIds }, status: APPLICATION_STATUS.ACCEPTED }),
      Job.aggregate([
        { $match: { companyId: { $in: companyIds } } },
        { $group: { _id: null, total: { $sum: '$viewsCount' } } },
      ]),
      Job.aggregate([
        { $match: { companyId: { $in: companyIds } } },
        { $group: { _id: null, total: { $sum: '$savesCount' } } },
      ]),
      userCompanies.length,
    ]);

    const recentApplications = await Application.find({ companyId: { $in: companyIds } })
      .populate('jobId', 'title')
      .populate('applicantId', 'name avatar email')
      .sort('-createdAt')
      .limit(5)
      .lean();

    const topJobs = await Job.find({ companyId: { $in: companyIds } })
      .sort('-viewsCount')
      .limit(5)
      .select('title viewsCount applicationsCount status')
      .lean();

    return {
      overview: {
        totalJobs,
        activeJobs,
        draftJobs,
        closedJobs,
        totalApplications,
        pendingApplications,
        interviewedApplications,
        hiredApplications,
        totalViews: totalViews[0]?.total || 0,
        totalSaves: totalSaves[0]?.total || 0,
        companiesCount,
      },
      recentApplications,
      topJobs,
    };
  }

  async getJobAnalytics(userId, options = {}) {
    const Job = require('../models').Job;
    const Application = require('../models').Application;
    const Company = require('../models').Company;

    const userCompanies = await Company.find({ ownerId: userId }).select('_id');
    const companyIds = userCompanies.map(c => c._id);

    const { period = '30d' } = options;
    const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [
      jobsOverTime,
      applicationsOverTime,
      applicationsByStatus,
      jobsByType,
      jobsByCategory,
      avgTimeToHire,
      conversionRates,
    ] = await Promise.all([
      Job.aggregate([
        { $match: { companyId: { $in: companyIds }, createdAt: { $gte: startDate } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Application.aggregate([
        { $match: { companyId: { $in: companyIds }, createdAt: { $gte: startDate } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Application.aggregate([
        { $match: { companyId: { $in: companyIds } } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Job.aggregate([
        { $match: { companyId: { $in: companyIds } } },
        { $group: { _id: '$type', count: { $sum: 1 } } },
      ]),
      Job.aggregate([
        { $match: { companyId: { $in: companyIds } } },
        { $lookup: { from: 'categories', localField: 'categoryId', foreignField: '_id', as: 'category' } },
        { $unwind: '$category' },
        { $group: { _id: '$category.name', count: { $sum: 1 } } },
      ]),
      Application.aggregate([
        { $match: { companyId: { $in: companyIds }, status: APPLICATION_STATUS.ACCEPTED, reviewedAt: { $exists: true } } },
        { $project: { daysToHire: { $divide: [{ $subtract: ['$reviewedAt', '$createdAt'] }, 1000 * 60 * 60 * 24] } } },
        { $group: { _id: null, avgDays: { $avg: '$daysToHire' } } },
      ]),
      Job.aggregate([
        { $match: { companyId: { $in: companyIds } } },
        { $project: { views: '$viewsCount', applications: '$applicationsCount', conversionRate: { $cond: [{ $gt: ['$viewsCount', 0] }, { $multiply: [{ $divide: ['$applicationsCount', '$viewsCount'] }, 100] }, 0] } } },
        { $group: { _id: null, avgConversion: { $avg: '$conversionRate' } } },
      ]),
    ]);

    return {
      jobsOverTime,
      applicationsOverTime,
      applicationsByStatus: applicationsByStatus.reduce((acc, item) => ({ ...acc, [item._id]: item.count }), {}),
      jobsByType: jobsByType.reduce((acc, item) => ({ ...acc, [item._id]: item.count }), {}),
      jobsByCategory: jobsByCategory.reduce((acc, item) => ({ ...acc, [item._id]: item.count }), {}),
      avgTimeToHire: avgTimeToHire[0]?.avgDays || 0,
      avgConversionRate: conversionRates[0]?.avgConversion || 0,
    };
  }

  async getApplicationPipeline(userId, options = {}) {
    const Application = require('../models').Application;
    const Company = require('../models').Company;
    const Job = require('../models').Job;

    const userCompanies = await Company.find({ ownerId: userId }).select('_id');
    const companyIds = userCompanies.map(c => c._id);

    const { page = 1, limit = 20, status, jobId } = options;

    const query = { companyId: { $in: companyIds } };
    if (status) query.status = status;
    if (jobId) query.jobId = jobId;

    const pagination = paginate(page, limit, await Application.countDocuments(query));

    const applications = await Application.find(query)
      .populate('jobId', 'title slug companyId')
      .populate('applicantId', 'name email avatar phone location skills')
      .populate('companyId', 'name slug logo')
      .sort('-createdAt')
      .skip(pagination.skip)
      .limit(pagination.limit)
      .lean();

    return {
      data: applications,
      meta: pagination,
    };
  }

  async getCompanyOverview(userId) {
    const Company = require('../models').Company;
    const Job = require('../models').Job;
    const Application = require('../models').Application;

    const companies = await Company.find({ ownerId: userId })
      .populate('ownerId', 'name email')
      .lean();

    const enrichedCompanies = await Promise.all(companies.map(async (company) => {
      const [jobsCount, openJobsCount, applicationsCount, viewsCount] = await Promise.all([
        Job.countDocuments({ companyId: company._id }),
        Job.countDocuments({ companyId: company._id, status: JOB_STATUS.PUBLISHED }),
        Application.countDocuments({ companyId: company._id }),
        Job.aggregate([
          { $match: { companyId: company._id } },
          { $group: { _id: null, total: { $sum: '$viewsCount' } } },
        ]),
      ]);

      return {
        ...company,
        stats: {
          jobsCount,
          openJobsCount,
          applicationsCount,
          viewsCount: viewsCount[0]?.total || 0,
        },
      };
    }));

    return enrichedCompanies;
  }

  async getTeamMembers(userId, companyId) {
    const Company = require('../models').Company;
    const User = require('../models').User;

    const company = await Company.findById(companyId);
    if (!company) {
      throw new NotFoundError('Company not found');
    }

    if (company.ownerId.toString() !== userId.toString()) {
      throw new AppError('Not authorized to view team members', 403);
    }

    const memberDetails = await Promise.all(company.members.map(async (member) => {
      const user = await User.findById(member.userId).select('name email avatar role createdAt').lean();
      return {
        ...member.toObject(),
        user,
      };
    }));

    return memberDetails;
  }

  async getSubscriptionInfo(userId) {
    const User = require('../models').User;
    const Company = require('../models').Company;

    const user = await User.findById(userId).select('subscription').lean();
    const companies = await Company.find({ ownerId: userId }).select('subscription').lean();

    return {
      user: user?.subscription || { plan: 'free', status: 'active' },
      companies: companies.map(c => c.subscription || { plan: 'free', status: 'active' }),
    };
  }
}

module.exports = new EmployerDashboardService();