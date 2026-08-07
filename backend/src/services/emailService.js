const nodemailer = require('nodemailer');
const { 
  EMAIL_HOST, 
  EMAIL_PORT, 
  EMAIL_USER, 
  EMAIL_PASS, 
  EMAIL_FROM,
  FRONTEND_URL,
  NODE_ENV 
} = require('../config/env');
const Logger = require('../utils/logger');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  initializeTransporter() {
    if (!EMAIL_HOST || !EMAIL_USER || !EMAIL_PASS) {
      Logger.warn('Email configuration not complete. Email service will not work.');
      return;
    }

    this.transporter = nodemailer.createTransport({
      host: EMAIL_HOST,
      port: EMAIL_PORT || 587,
      secure: EMAIL_PORT === 465,
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: NODE_ENV === 'production',
      },
    });

    this.transporter.verify((err) => {
      if (err) {
        Logger.error('Email service verification failed', { error: err.message });
      } else {
        Logger.info('Email service is ready');
      }
    });
  }

  async sendEmail({ to, subject, html, text }) {
    if (!this.transporter) {
      Logger.warn('Email service not configured. Skipping email send.', { to, subject });
      return { success: false, message: 'Email service not configured' };
    }

    try {
      const info = await this.transporter.sendMail({
        from: `"JobLink" <${EMAIL_FROM}>`,
        to,
        subject,
        html,
        text,
      });

      Logger.info('Email sent successfully', { to, subject, messageId: info.messageId });
      return { success: true, messageId: info.messageId };
    } catch (err) {
      Logger.error('Failed to send email', { to, subject, error: err.message });
      throw err;
    }
  }

  getVerificationEmailTemplate(token, userName) {
    const verificationUrl = `${FRONTEND_URL}/verify-email/${token}`;
    
    return {
      subject: 'Verify Your Email - JobLink',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">JobLink</h1>
            <p style="color: #bfdbfe; margin: 10px 0 0;">Ethiopia's Leading Job Marketplace</p>
          </div>
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px;">
            <h2 style="color: #1f2937; margin-top: 0;">Welcome to JobLink, ${userName}!</h2>
            <p style="color: #4b5563;">Thank you for registering. Please verify your email address to activate your account.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" style="background: #2563eb; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">
                Verify Email Address
              </a>
            </div>
            <p style="color: #6b7280; font-size: 14px;">Or copy this link: <br><a href="${verificationUrl}" style="color: #2563eb; word-break: break-all;">${verificationUrl}</a></p>
            <p style="color: #6b7280; font-size: 14px;">This link expires in 24 hours.</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
            <p style="color: #9ca3af; font-size: 12px;">If you didn't create an account, you can safely ignore this email.</p>
          </div>
        </body>
        </html>
      `,
      text: `
Welcome to JobLink, ${userName}!

Thank you for registering. Please verify your email address to activate your account.

Verify your email: ${verificationUrl}

This link expires in 24 hours.

If you didn't create an account, you can safely ignore this email.
      `,
    };
  }

  getPasswordResetEmailTemplate(token, userName) {
    const resetUrl = `${FRONTEND_URL}/reset-password/${token}`;
    
    return {
      subject: 'Reset Your Password - JobLink',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">JobLink</h1>
            <p style="color: #bfdbfe; margin: 10px 0 0;">Ethiopia's Leading Job Marketplace</p>
          </div>
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px;">
            <h2 style="color: #1f2937; margin-top: 0;">Password Reset Request</h2>
            <p style="color: #4b5563;">Hi ${userName},</p>
            <p style="color: #4b5563;">We received a request to reset your password. Click the button below to create a new password.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background: #dc2626; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">
                Reset Password
              </a>
            </div>
            <p style="color: #6b7280; font-size: 14px;">Or copy this link: <br><a href="${resetUrl}" style="color: #dc2626; word-break: break-all;">${resetUrl}</a></p>
            <p style="color: #6b7280; font-size: 14px;">This link expires in 10 minutes.</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
            <p style="color: #9ca3af; font-size: 12px;">If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.</p>
          </div>
        </body>
        </html>
      `,
      text: `
Password Reset Request

Hi ${userName},

We received a request to reset your password. Click the link below to create a new password.

Reset your password: ${resetUrl}

This link expires in 10 minutes.

If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.
      `,
    };
  }

  async sendVerificationEmail(email, token, userName = 'User') {
    const template = this.getVerificationEmailTemplate(token, userName);
    return this.sendEmail({ to: email, ...template });
  }

  async sendPasswordResetEmail(email, token, userName = 'User') {
    const template = this.getPasswordResetEmailTemplate(token, userName);
    return this.sendEmail({ to: email, ...template });
  }

  async sendWelcomeEmail(email, userName) {
    return this.sendEmail({
      to: email,
      subject: 'Welcome to JobLink!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">JobLink</h1>
            <p style="color: #bfdbfe; margin: 10px 0 0;">Ethiopia's Leading Job Marketplace</p>
          </div>
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px;">
            <h2 style="color: #1f2937; margin-top: 0;">Welcome to JobLink, ${userName}!</h2>
            <p style="color: #4b5563;">Your email has been verified and your account is now active.</p>
            <p style="color: #4b5563;">Start exploring job opportunities or posting jobs today.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${FRONTEND_URL}" style="background: #2563eb; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">
                Go to JobLink
              </a>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Welcome to JobLink, ${userName}!

Your email has been verified and your account is now active.

Start exploring job opportunities or posting jobs today at ${FRONTEND_URL}
      `,
    });
  }
}

module.exports = new EmailService();