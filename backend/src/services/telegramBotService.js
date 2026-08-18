const { AppError, NotFoundError } = require('../utils/errors');
const { TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_URL, BASE_URL } = require('../config/env');
const { JOB_STATUS } = require('../constants');
const Logger = require('../utils/logger');
const { Telegraf } = require('telegraf');
const Job = require('../models').Job;

class TelegramBotService {
  constructor() {
    this.bot = null;
    this.isConfigured = false;
    this.started = false;
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
      this.bot.catch((err) => {
        Logger.error('Telegram bot error', { error: err?.message || err });
      });
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

Link your account to receive job alerts:
1. Open https://${BASE_URL || 'localhost:3000'} → Profile → Telegram notifications
2. Tap "Generate link code"
3. Send that code here: /link <code>

Available commands:
/link <code> - Link your JobLink account
/search - Search for jobs
/new - Get latest job postings
/status - Check your application status
/subscribe - Subscribe to job notifications
/unsubscribe - Unsubscribe from notifications

Send /help for more information.`);
    });

    this.bot.command('help', (ctx) => {
      ctx.reply(`JobLink Bot Help

🔗 Linking:
  /link <code> - Link your JobLink account (get a code from your profile)
  /subscribe - Enable job notifications
  /unsubscribe - Disable job notifications

📁 Job Search Commands:
  /search <query> - Search jobs by keyword
  /new - View latest job postings
  /categories - View available job categories

📊 Other:
  /status - Check your application status
  /help - Show this help message`);
    });

    this.bot.command('link', async (ctx) => {
      const userId = ctx.from?.id;
      if (!userId) {
        ctx.reply('Unable to identify your Telegram account.');
        return;
      }

      const code = String(ctx.message?.text?.split(/\s+/)[1] || '')
        .trim()
        .toUpperCase();

      if (!code) {
        ctx.reply('Usage: /link <code>\n\nGet a code from your JobLink profile → Telegram notifications.');
        return;
      }

      try {
        const User = require('../models').User;
        const user = await User.findOne({ telegramLinkToken: code });

        if (!user || !user.telegramLinkTokenExpiresAt || user.telegramLinkTokenExpiresAt < Date.now()) {
          ctx.reply('That link code is invalid or has expired. Generate a new one from your profile.');
          return;
        }

        user.telegramId = String(userId);
        user.telegramSubscribed = true;
        user.telegramLinkToken = null;
        user.telegramLinkTokenExpiresAt = null;
        await user.save();

        ctx.reply('✅ Account linked! You will now receive job notifications here.\n\nUse /unsubscribe to turn them off.');
        Logger.info('Telegram account linked', { userId, telegramId: String(userId) });
      } catch (error) {
        Logger.error('Failed to link Telegram account', { error: error.message });
        ctx.reply('Something went wrong while linking. Please try again.');
      }
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

      const User = require('../models').User;
      const Application = require('../models').Application;
      const user = await User.findOne({ telegramId: String(ctx.from?.id || '') });

      if (!user) {
        ctx.reply('Your Telegram account is not linked. Link it with /link <code> first.');
        return;
      }

      const [appsCount, pendingApps, acceptedApps] = await Promise.all([
        Application.countDocuments({ applicantId: user._id }),
        Application.countDocuments({ applicantId: user._id, status: 'pending' }),
        Application.countDocuments({ applicantId: user._id, status: 'accepted' }),
      ]);

      ctx.reply(`Your Application Status:

📊 Total Applications: ${appsCount}
⏳ Pending: ${pendingApps}
✅ Accepted: ${acceptedApps}

For detailed status, visit your dashboard on the web app.`);
    });

    this.bot.command('subscribe', async (ctx) => {
      await this.handleSubscribe(ctx);
    });

    this.bot.command('unsubscribe', async (ctx) => {
      await this.handleUnsubscribe(ctx);
    });

    this.bot.command('search', async (ctx) => {
      const raw = ctx.message?.text || '';
      const query = raw.replace(/^\/search(?:@\w+)?\s*/i, '').trim();

      if (!query) {
        ctx.reply('Usage: /search <keyword>\n\nExample: /search developer');
        return;
      }

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

    this.bot.on('polling_error', (err) => {
      Logger.error('Telegram bot polling error', { error: err?.message || err });
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
    const User = require('../models').User;
    const user = await User.findOne({ telegramId: String(userId || '') });

    if (!user) {
      ctx.reply('Your Telegram account is not linked to any JobLink account.\n\nLink it first:\n1. Open your JobLink profile → Telegram notifications\n2. Generate a link code\n3. Send it here: /link <code>');
      return;
    }

    if (user.telegramSubscribed) {
      ctx.reply('You are already subscribed to job notifications!');
      return;
    }

    user.telegramSubscribed = true;
    await user.save();

    ctx.reply('✅ Successfully subscribed to job notifications!');
    ctx.reply('You will receive notifications about new jobs in your area.');
  }

  async handleUnsubscribe(ctx) {
    const userId = ctx.from?.id;
    const User = require('../models').User;
    const user = await User.findOne({ telegramId: String(userId || '') });

    if (!user) {
      ctx.reply('Your Telegram account is not linked to any JobLink account.');
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

  async sendNotification(userId, message, parseMode = null) {
    if (!this.isConfigured) {
      Logger.warn('Cannot send Telegram notification - bot not configured');
      return { success: false, message: 'Bot not configured' };
    }

    try {
      const User = require('../models').User;
      const user = await User.findById(userId);
      if (!user || !user.telegramId || !user.telegramSubscribed) {
        return { success: false, message: 'User not subscribed' };
      }

      const options = parseMode ? { parse_mode: parseMode } : {};
      await this.bot.telegram.sendMessage(user.telegramId, message, options);
      Logger.info('Telegram notification sent', { userId, telegramId: user.telegramId });
      return { success: true };
    } catch (error) {
      Logger.error('Failed to send Telegram notification', { userId, error: error.message });
      return { success: false, error: error.message };
    }
  }

  async sendJobAlert(userId, job) {
    const message = this.buildJobAlertMessage(job);
    return this.sendNotification(userId, message, 'HTML');
  }

  buildJobAlertMessage(job) {
    const companyName = job.companyId && typeof job.companyId === 'object'
      ? (job.companyId.name || 'N/A')
      : 'N/A';
    const location = job.location || 'Remote';

    return `🎉 NEW JOB ALERT!

📍 <b>${this.htmlEscape(job.title || 'Job post')}</b>
🏢 Company: ${this.htmlEscape(companyName)}
📊 Type: ${this.htmlEscape(job.type || 'N/A')}
💰 Salary: ${this.htmlEscape(job.salaryRange || 'Negotiable')}
📍 Location: ${this.htmlEscape(location)}

${job.description ? this.htmlEscape(job.description.substring(0, 150)) + '...' : ''}

Apply now: ${BASE_URL}/jobs/${job.slug || job._id}`;
  }

  htmlEscape(text) {
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  async notifySubscribedUsers(job) {
    if (!this.isConfigured) return { success: false, message: 'Bot not configured' };

    const User = require('../models').User;
    const subscribedUsers = await User.find({
      telegramSubscribed: true,
      telegramId: { $exists: true, $ne: null },
    });

    const results = await Promise.all(
      subscribedUsers.map(user => this.sendJobAlert(user._id, job))
    );

    const successful = results.filter(r => r.success).length;
    const failed = results.length - successful;

    return { success: true, total: results.length, successful, failed };
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

  async start() {
    if (!this.bot || !this.isConfigured || this.started) {
      return { started: false, reason: 'not-configured' };
    }

    if (TELEGRAM_WEBHOOK_URL) {
      try {
        await this.bot.telegram.setWebhook(`${TELEGRAM_WEBHOOK_URL}/bot`);
        Logger.info('Telegram webhook configured', { url: TELEGRAM_WEBHOOK_URL });
        this.started = true;
        return { mode: 'webhook', started: true };
      } catch (error) {
        Logger.error('Failed to setup webhook - falling back to polling', { error: error.message });
      }
    }

    try {
      this.bot.launch({ dropPendingUpdates: true });
      this.started = true;
      Logger.info('Telegram bot started in polling mode');
      return { mode: 'polling', started: true };
    } catch (error) {
      Logger.error('Failed to launch Telegram bot', { error: error.message });
      return { started: false, error: error.message };
    }
  }

  async stop() {
    if (this.bot && this.started) {
      this.bot.stop();
      this.started = false;
      Logger.info('Telegram bot stopped');
    }
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

  async getBotInfo() {
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