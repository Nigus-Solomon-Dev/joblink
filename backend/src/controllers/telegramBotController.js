const telegramBotService = require('../services/telegramBotService');
const ApiResponse = require('../utils/apiResponse');
const catchAsync = require('../utils/catchAsync');
const { AppError } = require('../utils/errors');

class TelegramBotController {
  handleWebhook = catchAsync(async (req, res, next) => {
    await telegramBotService.getWebhookUpdate()(req, res);
  });

  getBotInfo = catchAsync(async (req, res, next) => {
    const info = await telegramBotService.getBotInfo();
    const response = ApiResponse.success(info);
    res.status(200).json(response);
  });

  broadcast = catchAsync(async (req, res, next) => {
    const { message } = req.body;

    if (!message) {
      return next(new AppError('Message is required', 400));
    }

    const result = await telegramBotService.broadcast(message);
    const response = ApiResponse.success(result, result.message);
    res.status(200).json(response);
  });

  sendToUser = catchAsync(async (req, res, next) => {
    const { userId, message } = req.body;

    if (!userId || !message) {
      return next(new AppError('userId and message are required', 400));
    }

    const result = await telegramBotService.sendNotification(userId, message);
    const response = ApiResponse.success(result, result.success ? 'Message sent' : result.message);
    res.status(200).json(response);
  });

  sendJobAlert = catchAsync(async (req, res, next) => {
    const { userId, jobId } = req.body;

    if (!userId || !jobId) {
      return next(new AppError('userId and jobId are required', 400));
    }

    const Job = require('../models').Job;
    const job = await Job.findById(jobId)
      .populate('companyId', 'name')
      .populate('categoryId', 'name')
      .lean();

    if (!job) {
      return next(new AppError('Job not found', 404));
    }

    const result = await telegramBotService.sendJobAlert(userId, job);
    const response = ApiResponse.success(result, result.success ? 'Job alert sent' : result.message);
    res.status(200).json(response);
  });

  getBotStatus = catchAsync(async (req, res, next) => {
    const status = {
      configured: telegramBotService.isReady(),
      isConfigured: telegramBotService.isConfigured
    };
    const response = ApiResponse.success(status);
    res.status(200).json(response);
  });
}

module.exports = new TelegramBotController();