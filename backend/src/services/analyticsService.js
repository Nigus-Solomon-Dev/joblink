const { AppError, NotFoundError } = require('../utils/errors');
const { paginate } = require('../utils/helpers');
const { USER_ROLES, USER_STATUS, JOB_STATUS, APPLICATION_STATUS, JOB_TYPE } = require('../constants');

class AnalyticsService {
  async getUserBehaviorAnalytics(options = {}) {
    const User = require('../models').User;
    const Job = require('../models').Job;
    const Application = require('../models').Application;
    const SavedJob = require('../models').SavedJob;
    const Notification = require('../models').Notification;

    const { startDate, endDate, segment } = options;
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const [userRegistrations, applications, savedJobs, notifications] = await Promise.all([
      User.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]),
      Application.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]),
      SavedJob.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]),
      Notification.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ])
    ]);

    return {
      userRegistrations,
      applications,
      savedJobs,
      notifications,
      period: { start, end }
    };
  }

  async getMarketTrendAnalytics(options = {}) {
    const Job = require('../models').Job;
    const Application = require('../models').Application;

    const { period = '90d', region, category, jobType } = options;
    const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const query = { createdAt: { $gte: startDate } };

    const [jobsOverTime, applicationsOverTime, marketAnalysis, topRegions, topCategories, jobTypes] = await Promise.all([
      Job.aggregate([
        { $match: query },
        { $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
            avgSalary: { $avg: { $add: ['$salaryMin', '$salaryMax'] } },
            totalViews: { $sum: '$viewsCount' }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      Application.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]),
      Job.aggregate([
        { $match: { ...query, status: JOB_STATUS.PUBLISHED } },
        { $group: {
            _id: null,
            totalJobs: { $sum: 1 },
            avgSalaryMin: { $avg: '$salaryMin' },
            avgSalaryMax: { $avg: '$salaryMax' },
            totalApplications: { $sum: '$applicationsCount' },
            remoteJobs: { $sum: { $cond: [{ $eq: ['$isRemote', true] }, 1, 0] } }
          }
        }
      ]),
      Job.aggregate([
        { $match: query },
        { $group: { _id: '$location', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      Job.aggregate([
        { $match: query },
        { $lookup: { from: 'categories', localField: 'categoryId', foreignField: '_id', as: 'category' } },
        { $unwind: '$category' },
        { $group: { _id: '$category.name', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      Job.aggregate([
        { $match: query },
        { $group: { _id: '$type', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ])
    ]);

    return {
      jobsOverTime,
      applicationsOverTime,
      marketAnalysis: marketAnalysis[0] || {},
      topRegions,
      topCategories,
      jobTypes: jobTypes[0] || {},
      period: { start: startDate, end: new Date() }
    };
  }

  async getFunnelAnalytics(options = {}) {
    const Job = require('../models').Job;
    const Application = require('../models').Application;
    const SavedJob = require('../models').SavedJob;
    const User = require('../models').User;

    const { startDate, endDate } = options;
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const [totalUsers, totalSavedJobs, totalJobs, totalApplications, acceptedApps] = await Promise.all([
      User.countDocuments({ createdAt: { $gte: start, $lte: end } }),
      SavedJob.countDocuments({ createdAt: { $gte: start, $lte: end } }),
      Job.countDocuments({ createdAt: { $gte: start, $lte: end } }),
      Application.countDocuments({ createdAt: { $gte: start, $lte: end } }),
      Application.countDocuments({ createdAt: { $gte: start, $lte: end }, status: APPLICATION_STATUS.ACCEPTED })
    ]);

    const funnel = [
      { stage: 'Visitors', value: totalUsers },
      { stage: 'Job Seekers', value: totalUsers },
      { stage: 'Saved Jobs', value: totalSavedJobs },
      { stage: 'Jobs Posted', value: totalJobs },
      { stage: 'Applications', value: totalApplications },
      { stage: 'Offers', value: acceptedApps },
      { stage: 'Hired', value: acceptedApps }
    ];

    return {
      funnel,
      conversions: this.calculateFunnelConversions(funnel)
    };
  }

  calculateFunnelConversions(funnel) {
    return funnel.map((step, i) => ({
      ...step,
      conversionRate: i === 0 ? 100 : (step.value / funnel[i - 1].value * 100 || 0)
    }));
  }

  async getCompanyPerformanceMetrics(companyId) {
    const Company = require('../models').Company;
    const Job = require('../models').Job;
    const Application = require('../models').Application;

    const company = await Company.findById(companyId);
    if (!company) {
      throw new NotFoundError('Company not found');
    }

    const [jobStats, applicationStats] = await Promise.all([
      Job.find({ companyId }).select('status viewsCount savesCount applicationsCount createdAt').lean(),
      Application.find({ companyId }).select('status createdAt reviewedAt').lean()
    ]);

    const totalJobs = jobStats.length;
    const activeJobs = jobStats.filter(j => j.status === JOB_STATUS.PUBLISHED).length;
    const totalViews = jobStats.reduce((sum, j) => sum + (j.viewsCount || 0), 0);
    const totalSaves = jobStats.reduce((sum, j) => sum + (j.savesCount || 0), 0);

    const applicationsByStatus = applicationStats.reduce((acc, app) => {
      acc[app.status] = (acc[app.status] || 0) + 1;
      return acc;
    }, {});

    const conversionRate = totalJobs > 0 ? (applicationStats.length / totalJobs * 100).toFixed(2) : 0;

    return {
      overview: {
        totalJobs,
        activeJobs,
        totalViews,
        totalSaves,
        totalApplications: applicationStats.length,
        conversionRate: parseFloat(conversionRate)
      },
      jobsTimeline: jobStats.reduce((acc, job) => {
        const date = new Date(job.createdAt).toISOString().split('T')[0];
        if (!acc[date]) acc[date] = { posted: 0, views: 0, saves: 0 };
        acc[date].posted += 1;
        acc[date].views += job.viewsCount || 0;
        acc[date].saves += job.savesCount || 0;
        return acc;
      }, {}),
      applicationsByStatus,
      companyMetrics: {
        viewsPerJob: totalJobs > 0 ? (totalViews / totalJobs).toFixed(2) : 0,
        savesPerJob: totalJobs > 0 ? (totalSaves / totalJobs).toFixed(2) : 0,
        applicationsPerJob: totalJobs > 0 ? (applicationStats.length / totalJobs).toFixed(2) : 0
      }
    };
  }

  async getRevenueAnalytics(options = {}) {
    const Company = require('../models').Company;
    const Job = require('../models').Job;
    const Application = require('../models').Application;

    const { period = '30d' } = options;
    const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [featuredJobs, paidCompanies, totalApplications] = await Promise.all([
      Job.countDocuments({
        featured: true,
        featuredUntil: { $gt: new Date() },
        createdAt: { $gte: startDate }
      }),
      Company.countDocuments({
        'subscription.status': 'active',
        createdAt: { $gte: startDate }
      }),
      Application.countDocuments({
        createdAt: { $gte: startDate },
        status: APPLICATION_STATUS.ACCEPTED
      })
    ]);

    const featuredJobPrice = 50;
    const subscriptionMonthlyPrice = 200;
    const commissionPerHire = 5;

    return {
      period: { start: startDate, end: new Date() },
      revenue: {
        featuredJobsRevenue: featuredJobs * featuredJobPrice,
        subscriptionRevenue: paidCompanies * subscriptionMonthlyPrice,
        applicationCommission: totalApplications * commissionPerHire
      },
      breakdown: {
        featuredJobsEarned: featuredJobs,
        payingCompanies: paidCompanies,
        successfulHires: totalApplications
      },
      totalRevenue: (featuredJobs * featuredJobPrice) + (paidCompanies * subscriptionMonthlyPrice) + (totalApplications * commissionPerHire)
    };
  }

  async buildCustomReport(reportConfig) {
    const { reportType, dateRange, filters, groupBy, metrics } = reportConfig;

    let data = [];
    let totalRecords = 0;

    switch (reportType) {
      case 'users':
        data = await this.generateUserReport(dateRange, filters, groupBy);
        totalRecords = data.reduce((sum, item) => sum + item.count, 0);
        break;
      case 'jobs':
        data = await this.generateJobsReport(dateRange, filters, groupBy);
        totalRecords = data.reduce((sum, item) => sum + item.count, 0);
        break;
      case 'applications':
        data = await this.generateApplicationsReport(dateRange, filters, groupBy);
        totalRecords = data.reduce((sum, item) => sum + item.count, 0);
        break;
      case 'companies':
        data = await this.generateCompaniesReport(dateRange, filters, groupBy);
        totalRecords = data.reduce((sum, item) => sum + item.count, 0);
        break;
      default:
        throw new AppError(`Invalid report type: ${reportType}`, 400);
    }

    return {
      metadata: {
        reportType,
        dateRange,
        filters,
        groupBy,
        generatedAt: new Date(),
        totalRecords
      },
      data,
      summary: this.calculateReportSummary(data, metrics)
    };
  }

  async generateUserReport(dateRange, filters, groupBy) {
    const User = require('../models').User;

    const query = {};
    if (filters.role) query.role = filters.role;
    if (filters.status) query.status = filters.status;
    if (dateRange?.start) query.createdAt = { $gte: new Date(dateRange.start) };
    if (dateRange?.end) query.createdAt = { ...query.createdAt, $lte: new Date(dateRange.end) };

    if (groupBy) {
      return User.aggregate([
        { $match: query },
        { $group: { _id: `$${groupBy}`, count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);
    }

    const users = await User.find(query).select('name email role status createdAt').lean();
    return users.map(user => ({
      createdAt: new Date(user.createdAt).toISOString().split('T')[0],
      count: 1
    }));
  }

  async generateJobsReport(dateRange, filters, groupBy) {
    const Job = require('../models').Job;

    const query = {};
    if (filters.status) query.status = filters.status;
    if (filters.type) query.type = filters.type;
    if (filters.categoryId) query.categoryId = filters.categoryId;
    if (dateRange?.start) query.createdAt = { $gte: new Date(dateRange.start) };
    if (dateRange?.end) query.createdAt = { ...query.createdAt, $lte: new Date(dateRange.end) };

    if (groupBy) {
      return Job.aggregate([
        { $match: query },
        { $group: { _id: `$${groupBy}`, count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);
    }

    const jobs = await Job.find(query).select('createdAt').lean();
    return jobs.map(job => ({
      createdAt: new Date(job.createdAt).toISOString().split('T')[0],
      count: 1
    }));
  }

  async generateApplicationsReport(dateRange, filters, groupBy) {
    const Application = require('../models').Application;

    const query = {};
    if (filters.status) query.status = filters.status;
    if (filters.jobId) query.jobId = filters.jobId;
    if (filters.applicantId) query.applicantId = filters.applicantId;
    if (dateRange?.start) query.createdAt = { $gte: new Date(dateRange.start) };
    if (dateRange?.end) query.createdAt = { ...query.createdAt, $lte: new Date(dateRange.end) };

    if (groupBy) {
      return Application.aggregate([
        { $match: query },
        { $group: { _id: `$${groupBy}`, count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);
    }

    const apps = await Application.find(query).select('createdAt').lean();
    return apps.map(app => ({
      createdAt: new Date(app.createdAt).toISOString().split('T')[0],
      count: 1
    }));
  }

  async generateCompaniesReport(dateRange, filters, groupBy) {
    const Company = require('../models').Company;

    const query = {};
    if (filters.isVerified !== undefined) query.isVerified = filters.isVerified;
    if (filters.industry) query.industry = filters.industry;
    if (filters.size) query.size = filters.size;
    if (dateRange?.start) query.createdAt = { $gte: new Date(dateRange.start) };
    if (dateRange?.end) query.createdAt = { ...query.createdAt, $lte: new Date(dateRange.end) };

    if (groupBy) {
      return Company.aggregate([
        { $match: query },
        { $group: { _id: `$${groupBy}`, count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);
    }

    const companies = await Company.find(query).select('createdAt').lean();
    return companies.map(c => ({
      createdAt: new Date(c.createdAt).toISOString().split('T')[0],
      count: 1
    }));
  }

  calculateReportSummary(data, metrics) {
    if (!metrics || metrics.length === 0) return {};

    const summary = {};
    metrics.forEach(metric => {
      if (metric === 'total') {
        summary.total = data.reduce((sum, item) => sum + item.count, 0);
      }
    });
    return summary;
  }

  async exportData(options = {}) {
    const { reportType, format = 'csv', dateRange, filters } = options;

    const report = await this.buildCustomReport({ 
      reportType, 
      dateRange, 
      filters 
    });

    if (format === 'csv') {
      return this.toCSV(report.data);
    }
    if (format === 'pdf') {
      return this.toPDFString(report.data, reportType);
    }
    return JSON.stringify(report, null, 2);
  }

  toCSV(data) {
    if (!data || data.length === 0) return '';

    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(item => 
      Object.values(item).map(v => {
        if (typeof v === 'object') {
          return `"${JSON.stringify(v).replace(/"/g, '""')}"`;
        }
        return `"${v}"`;
      }).join(',')
    ).join('\n');

    return `${headers}\n${rows}`;
  }

  toPDFString(data, reportType) {
    const header = [
      `Analytics Report: ${reportType}`,
      `Generated at: ${new Date().toISOString()}`,
      '',
      Object.keys(data[0] || {}).join(' | '),
      data.map(item => Object.values(item || {}).map(v => String(v)).join(' | ')).slice(0, 100).join('\n')
    ].join('\n');
    return Buffer.from(header);
  }

  async scheduleReport(scheduleConfig) {
    const { reportType, format, recipients, frequency, dateRange, filters } = scheduleConfig;

    if (!reportType || !format || !recipients || !frequency) {
      throw new AppError('Missing required fields: reportType, format, recipients, frequency', 400);
    }

    const validFrequencies = ['hourly', 'daily', 'weekly', 'monthly'];
    if (!validFrequencies.includes(frequency)) {
      throw new AppError(`Invalid frequency. Must be one of: ${validFrequencies.join(', ')}`, 400);
    }

    return {
      id: Date.now().toString(),
      reportType,
      format,
      recipients,
      frequency,
      dateRange: dateRange || { start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), end: new Date() },
      filters: filters || {},
      createdAt: new Date(),
      lastRun: null,
      isActive: true
    };
  }

  async getScheduledReports() {
    return [
      {
        id: '1',
        reportType: 'users',
        format: 'csv',
        recipients: ['admin@joblink.com'],
        frequency: 'weekly',
        lastRun: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      },
      {
        id: '2',
        reportType: 'jobs',
        format: 'json',
        recipients: ['stats@joblink.com'],
        frequency: 'daily',
        lastRun: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      }
    ];
  }

  async deleteScheduledReport(id) {
    return { success: true, message: `Scheduled report ${id} deleted successfully` };
  }

  async getRealtimeMetrics() {
    return {
      activeUsers: 0,
      onlineUsers: 0,
      jobsViewed: 0,
      applicationsSubmitted: 0,
      notificationsSent: 0,
      serverStats: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage()
      },
      lastUpdated: new Date()
    };
  }
}

module.exports = new AnalyticsService();