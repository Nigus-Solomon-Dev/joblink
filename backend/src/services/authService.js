const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { JWT_SECRET, JWT_EXPIRES_IN, JWT_REFRESH_SECRET, JWT_REFRESH_EXPIRES_IN, REQUIRE_EMAIL_VERIFICATION } = require('../config/env');
const { AppError } = require('../utils/errors');
const TokenBlacklist = require('./tokenBlacklist');
const EmailService = require('./emailService');

class AuthService {
  generateAccessToken(user) {
    return jwt.sign(
      { 
        id: user._id, 
        email: user.email, 
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
  }

  generateRefreshToken(user) {
    return jwt.sign(
      { 
        id: user._id, 
        type: 'refresh' 
      },
      JWT_REFRESH_SECRET,
      { expiresIn: JWT_REFRESH_EXPIRES_IN }
    );
  }

  generateTokens(user) {
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);
    return { accessToken, refreshToken };
  }

  verifyAccessToken(token) {
    return jwt.verify(token, JWT_SECRET);
  }

  verifyRefreshToken(token) {
    return jwt.verify(token, JWT_REFRESH_SECRET);
  }

  generateEmailVerificationToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  generatePasswordResetToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  async register(userData) {
    const User = require('../models').User;
    
    const existingUser = await User.findOne({ email: userData.email.toLowerCase() });
    if (existingUser) {
      throw new AppError('Email already registered', 400);
    }

    let emailVerificationToken = null;
    const verificationFields = REQUIRE_EMAIL_VERIFICATION
      ? {
          emailVerified: false,
          status: 'pending_verification',
          emailVerificationToken: null,
        }
      : {
          emailVerified: true,
          status: 'active',
        };

    if (REQUIRE_EMAIL_VERIFICATION) {
      emailVerificationToken = this.generateEmailVerificationToken();
      verificationFields.emailVerificationToken = this.hashToken(emailVerificationToken);
      verificationFields.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    }

    const user = await User.create({
      ...userData,
      email: userData.email.toLowerCase(),
      ...verificationFields,
    });

    if (REQUIRE_EMAIL_VERIFICATION) {
      await EmailService.sendVerificationEmail(user.email, emailVerificationToken, user.name);
    }

    return { user };
  }

  async login(email, password) {
    const User = require('../models').User;
    
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    let autoActivate = false;
    if (user.status !== 'active') {
      if (user.status === 'pending_verification' && !REQUIRE_EMAIL_VERIFICATION) {
        autoActivate = true;
      } else if (user.status === 'pending_verification') {
        throw new AppError('Please verify your email before logging in', 401);
      }
      if (user.status === 'suspended') {
        throw new AppError('Your account has been suspended', 401);
      }
      if (!autoActivate && user.status !== 'active') {
        throw new AppError('Account is not active', 401);
      }
    }

    if (user.isLocked) {
      throw new AppError('Account temporarily locked due to failed login attempts. Try again later.', 401);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      await user.incrementLoginAttempts();
      throw new AppError('Invalid email or password', 401);
    }

    await user.resetLoginAttempts();

    if (autoActivate) {
      user.status = 'active';
      user.emailVerified = true;
      user.emailVerificationToken = undefined;
      user.emailVerificationExpires = undefined;
      await user.save();
    }

    const tokens = this.generateTokens(user);
    
    return {
      user,
      ...tokens,
    };
  }

  async refreshTokens(refreshToken) {
    if (!refreshToken) {
      throw new AppError('Refresh token is required', 401);
    }

    const isBlacklisted = await TokenBlacklist.isBlacklisted(refreshToken);
    if (isBlacklisted) {
      throw new AppError('Token has been revoked', 401);
    }

    let decoded;
    try {
      decoded = this.verifyRefreshToken(refreshToken);
    } catch (err) {
      throw new AppError('Invalid or expired refresh token', 401);
    }

    const User = require('../models').User;
    const user = await User.findById(decoded.id);
    if (!user || user.status !== 'active') {
      throw new AppError('User not found or inactive', 401);
    }

    await TokenBlacklist.add(refreshToken);

    const tokens = this.generateTokens(user);
    return tokens;
  }

  async logout(refreshToken) {
    if (refreshToken) {
      await TokenBlacklist.add(refreshToken);
    }
    return true;
  }

  async logoutAll(userId) {
    const TokenBlacklist = require('./tokenBlacklist');
    await TokenBlacklist.blacklistAllUserTokens(userId);
    return true;
  }

  async verifyEmail(token) {
    const User = require('../models').User;
    const hashedToken = this.hashToken(token);

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() },
    });

    if (!user) {
      throw new AppError('Invalid or expired verification token', 400);
    }

    user.emailVerified = true;
    user.status = 'active';
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    return user;
  }

  async resendVerificationEmail(email) {
    const User = require('../models').User;
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      throw new AppError('No account found with this email', 404);
    }

    if (user.emailVerified) {
      throw new AppError('Email is already verified', 400);
    }

    const emailVerificationToken = this.generateEmailVerificationToken();
    user.emailVerificationToken = this.hashToken(emailVerificationToken);
    user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000;
    await user.save();

    await EmailService.sendVerificationEmail(user.email, emailVerificationToken, user.name);

    return { user };
  }

  async forgotPassword(email) {
    const User = require('../models').User;
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      throw new AppError('No account found with this email', 404);
    }

    const resetToken = this.generatePasswordResetToken();
    user.passwordResetToken = this.hashToken(resetToken);
    user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    await EmailService.sendPasswordResetEmail(user.email, resetToken, user.name);

    return { user };
  }

  async resetPassword(token, newPassword) {
    const User = require('../models').User;
    const hashedToken = this.hashToken(token);

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    }).select('+password');

    if (!user) {
      throw new AppError('Invalid or expired reset token', 400);
    }

    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    await TokenBlacklist.blacklistAllUserTokens(user._id);

    return user;
  }

  async changePassword(userId, currentPassword, newPassword) {
    const User = require('../models').User;
    const user = await User.findById(userId).select('+password');

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      throw new AppError('Current password is incorrect', 401);
    }

    user.password = newPassword;
    await user.save();

    await TokenBlacklist.blacklistAllUserTokens(userId);

    return user;
  }

  async updateProfile(userId, updateData) {
    const User = require('../models').User;
    const allowedFields = ['name', 'phone', 'bio', 'location', 'website', 'linkedin', 'avatar', 'skills'];
    const updates = {};
    
    Object.keys(updateData).forEach(key => {
      if (allowedFields.includes(key)) {
        updates[key] = updateData[key];
      }
    });

    const user = await User.findByIdAndUpdate(userId, updates, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return user;
  }
}

module.exports = new AuthService();