const analyticsService = require('../services/analyticsService');
const ApiResponse = require('../utils/apiResponse');
const catchAsync = require('../utils/catchAsync');
const { protect, restrictTo } = require('../middleware/auth');

class AnalyticsController {
  getUserBehaviorAnalytics = catchAsync(async (req, res, next) => {
    const { startDate, endDate, segment } = req.query;
    const analytics = await analyticsService.getUserBehaviorAnalytics({
      startDate,
      endDate,
      segment
    });

    const response = ApiResponse.success(analytics, 'User behavior analytics fetched successfully');
    res.status(200).json(response);
  });

  getMarketTrendAnalytics = catchAsync(async (req, res, next) => {
    const { period, region, category, jobType } = req.query;
    const analytics = await analyticsService.getMarketTrendAnalytics({
      period,
      region,
      category,
      jobType
    });

    const response = ApiResponse.success(analytics, 'Market trend analytics fetched successfully');
    res.status(200).json(response);
  });

  getFunnelAnalytics = catchAsync(async (req, res, next) => {
    const { startDate, endDate } = req.query;
    const analytics = await analyticsService.getFunnelAnalytics({
      startDate,
      endDate
    });

    const response = ApiResponse.success(analytics, 'Funnel analytics fetched successfully');
    res.status(200).json(response);
  });

  getCompanyPerformanceMetrics = catchAsync(async (req, res, next) => {
    const { companyId } = req.params;
    const metrics = await analyticsService.getCompanyPerformanceMetrics(companyId);

    const response = ApiResponse.success(metrics, 'Company performance metrics fetched successfully');
    res.status(200).json(response);
  });

  getRevenueAnalytics = catchAsync(async (req, res, next) => {
    const { period } = req.query;
    const analytics = await analyticsService.getRevenueAnalytics({ period });

    const response = ApiResponse.success(analytics, 'Revenue analytics fetched successfully');
    res.status(200).json(response);
  });

  buildCustomReport = catchAsync(async (req, res, next) => {
    const { reportType, dateRange, filters, groupBy, metrics } = req.body;
    const report = await analyticsService.buildCustomReport({
      reportType,
      dateRange,
      filters,
      groupBy,
      metrics
    });

    const response = ApiResponse.success(report, 'Custom report generated successfully');
    res.status(200).json(response);
  });

  exportData = catchAsync(async (req, res, next) => {
    const { reportType, format = 'csv', dateRange, filters } = req.query;
    const data = await analyticsService.exportData({
      reportType,
      format,
      dateRange: dateRange ? { start: dateRange.start, end: dateRange.end } : undefined,
      filters
    });

    if (format === 'pdf') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=${reportType}-report.pdf`);
      res.send(data);
    } else if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${reportType}-report.csv`);
      res.send(data);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.send(data);
    }
  });

  scheduleReport = catchAsync(async (req, res, next) => {
    const { reportType, format, recipients, frequency, dateRange, filters } = req.body;
    const scheduled = await analyticsService.scheduleReport({
      reportType,
      format,
      recipients,
      frequency,
      dateRange,
      filters
    });

    const response = ApiResponse.success(scheduled, 'Report scheduled successfully');
    res.status(201).json(response);
  });

  getScheduledReports = catchAsync(async (req, res, next) => {
    const reports = await analyticsService.getScheduledReports();

    const response = ApiResponse.success(reports, 'Scheduled reports fetched successfully');
    res.status(200).json(response);
  });

  deleteScheduledReport = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const result = await analyticsService.deleteScheduledReport(id);

    const response = ApiResponse.success(result, 'Scheduled report deleted successfully');
    res.status(200).json(response);
  });

  getRealtimeMetrics = catchAsync(async (req, res, next) => {
    const metrics = await analyticsService.getRealtimeMetrics();

    const response = ApiResponse.success(metrics, 'Realtime metrics fetched successfully');
    res.status(200).json(response);
  });
}

module.exports = new AnalyticsController();