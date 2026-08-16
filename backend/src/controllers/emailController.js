const emailService = require('../services/emailService');
const ApiResponse = require('../utils/apiResponse');
const catchAsync = require('../utils/catchAsync');
const { protect, restrictTo } = require('../middleware/auth');

class EmailController {
  sendTestEmail = catchAsync(async (req, res, next) => {
    const { to, subject, html, text } = req.body;

    if (!to) {
      return next(new Error('Recipient email is required'));
    }

    const result = await emailService.sendEmail({
      to,
      subject: subject || 'Test Email - JobLink',
      html: html || '<p>This is a test email from JobLink.</p>',
      text: text || 'This is a test email from JobLink.'
    });

    const response = ApiResponse.success(result, 'Test email sent successfully');
    res.status(200).json(response);
  });

  sendVerificationEmail = catchAsync(async (req, res, next) => {
    const { email, name, token } = req.body;

    if (!email || !token) {
      return next(new Error('Email and token are required'));
    }

    const result = await emailService.sendVerificationEmail(email, token, name || 'User');

    const response = ApiResponse.success(result, 'Verification email sent successfully');
    res.status(200).json(response);
  });

  sendPasswordReset = catchAsync(async (req, res, next) => {
    const { email, name, token } = req.body;

    if (!email || !token) {
      return next(new Error('Email and token are required'));
    }

    const result = await emailService.sendPasswordResetEmail(email, token, name || 'User');

    const response = ApiResponse.success(result, 'Password reset email sent successfully');
    res.status(200).json(response);
  });

  sendWelcomeEmail = catchAsync(async (req, res, next) => {
    const { email, name } = req.body;

    if (!email) {
      return next(new Error('Email is required'));
    }

    const result = await emailService.sendWelcomeEmail(email, name || 'User');

    const response = ApiResponse.success(result, 'Welcome email sent successfully');
    res.status(200).json(response);
  });

  queueEmail = catchAsync(async (req, res, next) => {
    const { to, subject, html, text, attempts, delay } = req.body;

    if (!to) {
      return next(new Error('Recipient email is required'));
    }

    const result = await emailService.queueEmail({
      to,
      subject,
      html,
      text
    }, attempts, delay);

    const response = ApiResponse.success(result, 'Email queued successfully');
    res.status(201).json(response);
  });

  sendBatchEmails = catchAsync(async (req, res, next) => {
    const { emails, batchSize } = req.body;

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return next(new Error('Emails array is required'));
    }

    const emailOptions = emails.map(({ to, subject, html, text }) => ({
      to,
      subject: subject || 'Email from JobLink',
      html,
      text
    }));

    const result = await emailService.sendBatchEmails(emailOptions, batchSize);

    const response = ApiResponse.success(result, 'Batch emails processed');
    res.status(200).json(response);
  });

  scheduleEmail = catchAsync(async (req, res, next) => {
    const { to, subject, html, text, scheduledTime } = req.body;

    if (!to || !scheduledTime) {
      return next(new Error('Recipient email and scheduled time are required'));
    }

    const result = await emailService.scheduleEmail({
      to,
      subject,
      html,
      text
    }, scheduledTime);

    const response = ApiResponse.success(result, 'Email scheduled successfully');
    res.status(201).json(response);
  });

  getQueueStatus = catchAsync(async (req, res, next) => {
    const status = emailService.getQueueStatus();
    const response = ApiResponse.success(status, 'Email queue status retrieved');
    res.status(200).json(response);
  });

  clearQueue = catchAsync(async (req, res, next) => {
    const result = emailService.clearQueue();
    const response = ApiResponse.success(result, result.message);
    res.status(200).json(response);
  });

  getAnalytics = catchAsync(async (req, res, next) => {
    const analytics = emailService.getAnalytics();
    const response = ApiResponse.success(analytics, 'Email analytics retrieved');
    res.status(200).json(response);
  });
}

module.exports = new EmailController();