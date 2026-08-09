const { AppError, NotFoundError } = require('../utils/errors');
const { TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_URL, BASE_URL } = require('../config/env');
const { JOB_STATUS } = require('../constants');
const Logger = require('../utils/logger');
const { Telegraf } = require('telegraf');
const Job = require('../models').Job;
const Application = require('../models').Application;

class TelegramBotService {
  constructor() {
    this.bot = null;
    this.isConfigured = false;
    this.initialized = false;
    this.initializeBot();
  }

  initializeBot() {
    if (!TELEGRAM_BOT_TOKEN) {
      Logger.warn('Telegram bot token not configured. Telegram bot will not work.');
      return;
    }

    try {
      this.bot = new Telegraf(TELEGRAM_BOT_TOKEN);
      this.setupCommands();
      this.isConfigured = true;
      Logger.info('Telegram bot initialized successfully');
    } catch (error) {
      Logger.error('Failed to initialize Telegram bot', { error: error.message });
      this.isConfigured = false;
    }
  }

  setupCommands() {
    if (!this.bot) return;

    this.bot.start((ctx) => {
      ctx.reply(`Welcome to JobLink Bot! 🎉

Available commands:
/search - Search for jobs
/new - Get latest job postings
/status - Check your application status
/subscribe - Subscribe to job notifications
/unsubscribe - Unsubscribe from notifications

Send /help for more information.`);
    });

    this.bot.command('help', (ctx) => {
      ctx.reply(`JobLink Bot Help

📁 Job Search Commands:
  /search query - Search jobs by keyword
  /new - View latest job postings
  /categories - View available job categories

📤 Subscription:
  /subscribe - Enable job notifications
  /unsubscribe - Disable job notifications

📊 Other:
  /status - Check your application status
  /help - Show this help message`);
    });

    this.bot.command('categories', async (ctx) => {
      const Category = require('../models').Category;
      const categories = await Category.find().limit(10).lean();
      
      if (categories.length === 0) {
        ctx.reply('No categories available at the moment.');
        return;
      }

      const categoryList = categories.map(c => `• ${c.name}`).join('\n');
      ctx.reply(`Job Categories:\n${categoryList}`);
    });

    this.bot.command('new', async (ctx) => {
      const latestJobs = await Job.find({ status: JOB_STATUS.PUBLISHED })
        .sort('-createdAt')
        .limit(5)
        .populate('categoryId', 'name')
        .populate('companyId', 'name')
        .lean();

      if (latestJobs.length === 0) {
        ctx.reply('No new jobs available at the moment. Check back later!');
        return;
      }

      let message = '📢 Latest Jobs:\n\n';
      latestJobs.forEach(job => {
        message += `📍 ${job.title}\n`;
        message += `   Company: ${job.companyId?.name || 'N/A'}\n`;
        message += `   Category: ${job.categoryId?.name || 'General'}\n`;
        message += `   Salary: ${job.salaryRange || 'Negotiable'}\n\n`;
      });

      ctx.reply(message);
    });

    this.bot.command('status', async (ctx) => {
      ctx.replyWithChatAction('typing');
      
      const userId = ctx.from?.id;
      if (!userId) {
        ctx.reply('Unable to identify user. Please use the web app for detailed application status.');
        return;
      }

      const user = require('../models').User.findById(userId);
      if (!user) {
        ctx.reply('User not found. Please login through the web app first.');
        return;
      }

      const appsCount = await Application.countDocuments({ applicantId: userId });
      const pendingApps = await Application.countDocuments({ 
        applicantId: userId, 
        status: 'pending' 
      });
      const acceptedApps = await Application.countDocuments({ 
        applicantId: userId, 
        status: 'accepted' 
      });

      ctx.reply(`Your Application Status:

📊 Total Applications: ${appsCount}
⏳ Pending: ${pendingApps}
✅ Accepted: ${acceptedApps}

For detailed status, visit your dashboard on the web app.`);
    });

    this.bot.hears(/\/search (.+)/, async (ctx) => {
      const query = ctx.match[1];
      await this.searchJobs(ctx, query);
    });

    this.bot.hears(/(job|jobs)/i, async (ctx) => {
      await ctx.reply('For job search, use /search <keyword> or /new to see latest jobs');
    });

    this.bot.on('text', async (ctx) => {
      const text = ctx.message?.text?.toLowerCase() || '';
      
      if (text.includes('help') || text.includes('start')) {
        return;
      }
      
      if (text.includes('subscribe') || text.includes('notification')) {
        await this.handleSubscribe(ctx);
      } else if (text.includes('unsubscribe') || text.includes('stop')) {
        await this.handleUnsubscribe(ctx);
      } else {
        ctx.reply('I didn\'t understand that. Send /help for available commands.');
      }
    });

    this.on('polling_error', (err) => {
      Logger.error('Telegram bot polling error', { error: err.message });
    });
  }

  async searchJobs(ctx, query) {
    ctx.replyWithChatAction('typing');
    
    const searchResult = await Job.find({
      title: { $regex: query, $options: 'i' },
      status: JOB_STATUS.PUBLISHED
    })
      .sort('-createdAt')
      .limit(5)
      .populate('companyId', 'name')
      .lean();

    if (searchResult.length === 0) {
      ctx.reply(`No jobs found matching "${query}". Try a different search term.`);
      return;
    }

    let message = `🔍 Search results for "${query}":\n\n`;
    searchResult.forEach(job => {
      message += `📍 ${job.title}\n`;
      message += `   Company: ${job.companyId?.name || 'N/A'}\n`;
      message += `   Type: ${job.type}\n`;
      message += `   Salary: ${job.salaryRange || 'Negotiable'}\n\n`;
    });

    ctx.reply(message);
  }

  async handleSubscribe(ctx) {
    const userId = ctx.from?.id;
    const user = await require('../models').User.findById(userId);
    
    if (!user) {
      ctx.reply('Please login through the web app first.');
      return;
    }

    if (user.telegramSubscribed) {
      ctx.reply('You are already subscribed to job notifications!');
      return;
    }

    user.telegramSubscribed = true;
    user.telegramId = userId;
    await user.save();

    ctx.reply('✅ Successfully subscribed to job notifications!');
    ctx.reply('You will receive notifications about new jobs in your area.');
  }

  async handleUnsubscribe(ctx) {
    const userId = ctx.from?.id;
    const user = await require('../models').User.findById(userId);
    
    if (!user) {
      ctx.reply('User not found.');
      return;
    }

    if (!user.telegramSubscribed) {
      ctx.reply('You are not subscribed to notifications.');
      return;
    }

    user.telegramSubscribed = false;
    await user.save();

    ctx.reply('🔕 Successfully unsubscribed from job notifications.');
  }

  async sendNotification(userId, message) {
    if (!this.isConfigured) {
      Logger.warn('Cannot send Telegram notification - bot not configured');
      return { success: false, message: 'Bot not configured' };
    }

    try {
      const user = await require('../models').User.findById(userId);
      if (!user || !user.telegramId || !user.telegramSubscribed) {
        return { success: false, message: 'User not subscribed' };
      }

      await this.bot.telegram.sendMessage(user.telegramId, message, { parse_mode: 'Markdown' });
      Logger.info('Telegram notification sent', { userId, telegramId: user.telegramId });
      return { success: true };
    } catch (error) {
      Logger.error('Failed to send Telegram notification', { userId, error: error.message });
      return { success: false, error: error.message };
    }
  }

  async sendJobAlert(userId, job) {
    if (job.companyId) {
      const company = await require('../models').Company.findById(job.companyId).lean();
      
      const message = `🎉 NEW JOB ALERT!

📍 <b>${job.title}</b>
🏢 Company: ${company?.name || 'N/A'}
📊 Type: ${job.type}
💰 Salary: ${job.salaryRange || 'Negotiable'}
📍 Location: ${job.location || 'Remote'}

${job.description ? job.description.substring(0, 150) + '...' : ''}

Apply now: ${BASE_URL}/jobs/${job.slug}`;

      return this.sendNotification(userId, message);
    }
  }

  getWebhookUpdate() {
    if (!this.bot) {
      throw new AppError('Bot not initialized', 500);
    }
    return (req, res) => {
      try {
        this.bot.handleUpdate(req.body, res);
      } catch (error) {
        Logger.error('Webhook update error', { error: error.message });
        res.status(500).send('Error');
      }
    };
  }

  async setupWebhook() {
    if (!this.isConfigured || !TELEGRAM_WEBHOOK_URL) {
      Logger.warn('Webhooks not configured. Bot is running in polling mode.');
      return { polling: true, webhook: false };
    }

    try {
      await this.bot.telegram.setWebhook(`${TELEGRAM_WEBHOOK_URL}/bot`);
      Logger.info('Telegram webhook configured', { url: TELEGRAM_WEBHOOK_URL });
      return { polling: false, webhook: true };
    } catch (error) {
      Logger.error('Failed to setup webhook', { error: error.message });
      return { polling: true, webhook: false };
    }
  }

  async pollForNewJobs() {
    if (!this.isConfigured) return [];

    const recentJobs = await Job.find({
      status: JOB_STATUS.PUBLISHED,
      createdAt: { $gte: new Date(Date.now() - 5 * 60 * 1000) }
    })
      .sort('-createdAt')
      .lean();

    return recentJobs;
  }

  async broadcast(message) {
    if (!this.isConfigured) {
      return { success: false, message: 'Bot not configured' };
    }

    const subscribedUsers = await require('../models').User.find({
      telegramSubscribed: true,
      telegramId: { $exists: true, $ne: null }
    });

    const results = await Promise.all(
      subscribedUsers.map(user => this.sendNotification(user._id, message))
    );

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    return {
      success: true,
      message: 'Broadcast completed',
      total: results.length,
      successful,
      failed
    };
  }

  getBotInfo() {
    if (!this.isConfigured) {
      return { configured: false };
    }

    return this.bot.telegram.getMe()
      .then(info => ({ configured: true, info }))
      .catch(err => ({ configured: true, info: null, error: err.message }));
  }

  isReady() {
    return this.isConfigured && this.bot !== null;
  }
}

module.exports = new TelegramBotService();