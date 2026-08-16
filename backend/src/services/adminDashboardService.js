const { AppError, NotFoundError } = require('../utils/errors');
const { paginate } = require('../utils/helpers');
const { USER_ROLES, USER_STATUS, JOB_STATUS, APPLICATION_STATUS } = require('../constants');

class AdminDashboardService {
  async getSystemOverview() {
    const User = require('../models').User;
    const Company = require('../models').Company;
    const Job = require('../models').Job;
    const Application = require('../models').Application;
    const Notification = require('../models').Notification;

    const [
      totalUsers,
      totalCompanies,
      totalJobs,
      totalApplications,
      usersByRole,
      usersByStatus,
      jobsByStatus,
      applicationsByStatus,
      recentUsers,
      recentCompanies,
      recentJobs,
    ] = await Promise.all([
      User.countDocuments(),
      Company.countDocuments(),
      Job.countDocuments(),
      Application.countDocuments(),
      User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
      User.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Job.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Application.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      User.find().sort('-createdAt').limit(5).select('name email role status createdAt').lean(),
      Company.find().sort('-createdAt').limit(5).select('name slug isVerified createdAt').lean(),
      Job.find().sort('-createdAt').limit(5).select('title status companyId').populate('companyId', 'name').lean(),
    ]);

    return {
      overview: {
        totalUsers,
        totalCompanies,
        totalJobs,
        totalApplications,
        verifiedCompanies: await Company.countDocuments({ isVerified: true }),
        pendingVerificationCompanies: await Company.countDocuments({ isVerified: false }),
      },
      usersByRole: usersByRole.reduce((acc, item) => ({ ...acc, [item._id]: item.count }), {}),
      usersByStatus: usersByStatus.reduce((acc, item) => ({ ...acc, [item._id]: item.count }), {}),
      jobsByStatus: jobsByStatus.reduce((acc, item) => ({ ...acc, [item._id]: item.count }), {}),
      applicationsByStatus: applicationsByStatus.reduce((acc, item) => ({ ...acc, [item._id]: item.count }), {}),
      recentActivity: {
        users: recentUsers,
        companies: recentCompanies,
        jobs: recentJobs,
      },
    };
  }

  async getUserAnalytics(options = {}) {
    const User = require('../models').User;

    const { period = '30d' } = options;
    const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [
      registrationsOverTime,
      usersByRoleOverTime,
      verificationRate,
      activeUsers,
    ] = await Promise.all([
      User.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      User.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $group: { _id: { date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, role: '$role' }, count: { $sum: 1 } } },
        { $sort: { '_id.date': 1 } },
      ]),
      User.aggregate([
        { $group: { _id: '$emailVerified', count: { $sum: 1 } } },
      ]),
      User.countDocuments({ lastLogin: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }),
    ]);

    return {
      registrationsOverTime,
      usersByRoleOverTime,
      verificationRate: verificationRate.reduce((acc, item) => ({ ...acc, [item._id]: item.count }), {}),
      activeUsersLast7Days: activeUsers,
    };
  }

  async getCompanyAnalytics(options = {}) {
    const Company = require('../models').Company;
    const Job = require('../models').Job;

    const { period = '30d' } = options;
    const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [
      companiesOverTime,
      companiesBySize,
      companiesByIndustry,
      verificationStats,
    ] = await Promise.all([
      Company.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Company.aggregate([{ $group: { _id: '$size', count: { $sum: 1 } } }]),
      Company.aggregate([{ $group: { _id: '$industry', count: { $sum: 1 } } }]),
      Company.aggregate([
        { $group: { _id: '$isVerified', count: { $sum: 1 } } },
      ]),
    ]);

    return {
      companiesOverTime,
      companiesBySize: companiesBySize.reduce((acc, item) => ({ ...acc, [item._id]: item.count }), {}),
      companiesByIndustry: companiesByIndustry.reduce((acc, item) => ({ ...acc, [item._id]: item.count }), {}),
      verificationStats: verificationStats.reduce((acc, item) => ({ ...acc, [item._id]: item.count }), {}),
    };
  }

  async getJobAnalytics(options = {}) {
    const Job = require('../models').Job;
    const Application = require('../models').Application;

    const { period = '30d' } = options;
    const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [
      jobsOverTime,
      jobsByType,
      jobsByCategory,
      featuredJobs,
      avgApplicationsPerJob,
    ] = await Promise.all([
      Job.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Job.aggregate([{ $group: { _id: '$type', count: { $sum: 1 } } }]),
      Job.aggregate([
        { $lookup: { from: 'categories', localField: 'categoryId', foreignField: '_id', as: 'category' } },
        { $unwind: '$category' },
        { $group: { _id: '$category.name', count: { $sum: 1 } } },
      ]),
      Job.countDocuments({ featured: true, featuredUntil: { $gt: new Date() } }),
      Job.aggregate([
        { $group: { _id: null, avgApps: { $avg: '$applicationsCount' } } },
      ]),
    ]);

    return {
      jobsOverTime,
      jobsByType: jobsByType.reduce((acc, item) => ({ ...acc, [item._id]: item.count }), {}),
      jobsByCategory: jobsByCategory.reduce((acc, item) => ({ ...acc, [item._id]: item.count }), {}),
      featuredJobsCount: featuredJobs,
      avgApplicationsPerJob: avgApplicationsPerJob[0]?.avgApps || 0,
    };
  }

  async getRevenueAnalytics() {
    const Company = require('../models').Company;
    const Job = require('../models').Job;
    const Application = require('../models').Application;

    // Monetary revenue is not reported here: no payment or subscription system
    // is implemented, so any dollar figure would be fabricated. Only real,
    // derivable activity metrics are returned.
    const [totalCompanies, featuredJobs, totalApplications, successfulHires] = await Promise.all([
      Company.countDocuments(),
      Job.countDocuments({ featured: true, featuredUntil: { $gt: new Date() } }),
      Application.countDocuments(),
      Application.countDocuments({ status: APPLICATION_STATUS.ACCEPTED }),
    ]);

    return {
      revenueAvailable: false,
      activity: {
        totalCompanies,
        featuredJobs,
        totalApplications,
        successfulHires,
      },
    };
  }

  async getSystemHealth() {
    const User = require('../models').User;
    const performanceMonitor = require('../utils/performanceMonitor');
    const EmailService = require('./emailService');

    const dbStats = await User.db.db.stats();
    const metrics = performanceMonitor.getMetrics();
    const errorRate = metrics.totalRequests > 0 ? metrics.totalErrors / metrics.totalRequests : 0;

    return {
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      errorRate,
      avgResponseTime: metrics.averageResponseTime,
      database: {
        collections: dbStats.collections,
        dataSize: dbStats.dataSize,
        storageSize: dbStats.storageSize,
        indexes: dbStats.indexes,
      },
      queue: EmailService.getQueueStatus(),
    };
  }

  async getAuditLogs(options = {}) {
    const User = require('../models').User;
    const Company = require('../models').Company;
    const Job = require('../models').Job;
    const Application = require('../models').Application;

    const { page = 1, limit = 50, action, entityType, userId, startDate, endDate } = options;

    // This would typically query a separate audit log collection
    // For now, we'll create a combined recent activity log
    const activities = [];

    const recentUsers = await User.find()
      .sort('-createdAt')
      .limit(20)
      .select('name email role createdAt')
      .lean();
    recentUsers.forEach(u => activities.push({
      action: 'user_registered',
      entityType: 'user',
      entityId: u._id,
      userId: u._id,
      details: { email: u.email, role: u.role },
      timestamp: u.createdAt,
    }));

    const recentCompanies = await Company.find()
      .sort('-createdAt')
      .limit(20)
      .select('name slug ownerId createdAt')
      .lean();
    recentCompanies.forEach(c => activities.push({
      action: 'company_created',
      entityType: 'company',
      entityId: c._id,
      userId: c.ownerId,
      details: { name: c.name },
      timestamp: c.createdAt,
    }));

    const recentJobs = await Job.find()
      .sort('-createdAt')
      .limit(20)
      .select('title companyId status createdAt')
      .populate('companyId', 'name')
      .lean();
    recentJobs.forEach(j => activities.push({
      action: 'job_created',
      entityType: 'job',
      entityId: j._id,
      userId: j.postedById,
      details: { title: j.title, company: j.companyId?.name },
      timestamp: j.createdAt,
    }));

    // Sort by timestamp
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    const pagination = paginate(page, limit, activities.length);
    return {
      data: activities.slice(pagination.skip, pagination.skip + pagination.limit),
      meta: pagination,
    };
  }

  async getSettings() {
    const SiteSetting = require('../models').SiteSetting;
    const stored = await SiteSetting.getSettings();

    return {
      ...DEFAULT_SETTINGS,
      ...stored,
    };
  }

  async updateSettings(settings) {
    const SiteSetting = require('../models').SiteSetting;

    if (!settings || typeof settings !== 'object' || Array.isArray(settings)) {
      throw new AppError('Settings must be an object', 400);
    }

    const updated = {};
    for (const [key, value] of Object.entries(settings)) {
      await SiteSetting.setSetting(key, value);
      updated[key] = value;
    }

    return { success: true, message: 'Settings updated successfully', updated };
  }
}

const DEFAULT_SETTINGS = {
  siteName: 'JobLink',
  siteDescription: 'Ethiopia\'s Leading Job Marketplace',
  maintenanceMode: false,
  registrationEnabled: true,
  jobPostingEnabled: true,
  maxFileUploadSize: 5 * 1024 * 1024,
  allowedFileTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
  emailVerificationRequired: true,
  maxJobsPerCompany: 100,
  featuredJobPrice: 50,
  subscriptionPlans: [
    { name: 'Free', price: 0, features: ['5 job posts', 'Basic analytics'] },
    { name: 'Pro', price: 200, features: ['Unlimited job posts', 'Advanced analytics', 'Featured jobs'] },
    { name: 'Enterprise', price: 500, features: ['Everything in Pro', 'API access', 'Custom branding'] },
  ],
};

module.exports = new AdminDashboardService();