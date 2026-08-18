const { AppError, NotFoundError } = require('../utils/errors');
const { USER_ROLES, USER_STATUS } = require('../constants');
const { paginate } = require('../utils/helpers');
const crypto = require('crypto');

const TELEGRAM_LINK_CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const TELEGRAM_LINK_CODE_LENGTH = 8;
const TELEGRAM_LINK_CODE_TTL_MS = 15 * 60 * 1000;

class UserService {
  async generateTelegramLinkCode(userId) {
    const User = require('../models').User;
    const user = await User.findById(userId);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    let code = '';
    const bytes = crypto.randomBytes(TELEGRAM_LINK_CODE_LENGTH);
    for (let i = 0; i < TELEGRAM_LINK_CODE_LENGTH; i += 1) {
      code += TELEGRAM_LINK_CODE_ALPHABET[bytes[i] % TELEGRAM_LINK_CODE_ALPHABET.length];
    }

    const expiresAt = new Date(Date.now() + TELEGRAM_LINK_CODE_TTL_MS);
    user.telegramLinkToken = code;
    user.telegramLinkTokenExpiresAt = expiresAt;
    await user.save();

    return { code, expiresAt };
  }

  async unlinkTelegram(userId) {
    const User = require('../models').User;
    const user = await User.findById(userId);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    user.telegramId = null;
    user.telegramSubscribed = false;
    user.telegramLinkToken = null;
    user.telegramLinkTokenExpiresAt = null;
    await user.save();

    return user.toPublicJSON();
  }

  async getUserById(userId, includePrivate = false) {
    const User = require('../models').User;
    const user = await User.findById(userId);
    
    if (!user) {
      throw new NotFoundError('User not found');
    }
    
    return includePrivate ? user : user.toPublicJSON();
  }

  async getUserByEmail(email) {
    const User = require('../models').User;
    return User.findOne({ email: email.toLowerCase() });
  }

  async updateUser(userId, updateData, isAdmin = false) {
    const User = require('../models').User;
    
    const allowedFields = ['name', 'phone', 'bio', 'location', 'website', 'linkedin', 'avatar', 'skills'];
    const adminFields = ['role', 'status', 'emailVerified'];
    
    const updates = {};
    const allowed = isAdmin ? [...allowedFields, ...adminFields] : allowedFields;
    
    Object.keys(updateData).forEach(key => {
      if (allowed.includes(key)) {
        updates[key] = updateData[key];
      }
    });

    if (updates.email) {
      updates.email = updates.email.toLowerCase();
    }

    const user = await User.findByIdAndUpdate(userId, updates, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return user.toPublicJSON();
  }

  async changePassword(userId, currentPassword, newPassword) {
    const User = require('../models').User;
    const user = await User.findById(userId).select('+password');

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      throw new AppError('Current password is incorrect', 401);
    }

    user.password = newPassword;
    await user.save();

    const TokenBlacklist = require('../models').TokenBlacklist;
    await TokenBlacklist.deleteMany({ userId });

    return user.toPublicJSON();
  }

  async updateAvatar(userId, avatarUrl) {
    const User = require('../models').User;
    const user = await User.findByIdAndUpdate(
      userId,
      { avatar: avatarUrl },
      { new: true, runValidators: true }
    );

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return user.toPublicJSON();
  }

  async deleteUser(userId) {
    const User = require('../models').User;
    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const TokenBlacklist = require('../models').TokenBlacklist;
    await TokenBlacklist.deleteMany({ userId });

    return true;
  }

  async getUsers(filters = {}, options = {}) {
    const User = require('../models').User;
    
    const { page = 1, limit = 20, sort = '-createdAt' } = options;
    const { role, status, search, emailVerified } = filters;

    const query = {};

    if (role) query.role = role;
    if (status) query.status = status;
    if (emailVerified !== undefined) query.emailVerified = emailVerified;
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const pagination = paginate(page, limit, await User.countDocuments(query));

    const users = await User.find(query)
      .sort(sort)
      .skip(pagination.skip)
      .limit(pagination.limit)
      .lean();

    return {
      data: users.map(u => u.toPublicJSON ? u.toPublicJSON() : u),
      meta: pagination,
    };
  }

  async getUserStats() {
    const User = require('../models').User;
    
    const [total, byRole, byStatus, recent] = await Promise.all([
      User.countDocuments(),
      User.aggregate([
        { $group: { _id: '$role', count: { $sum: 1 } } }
      ]),
      User.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      User.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      }),
    ]);

    return {
      total,
      byRole: byRole.reduce((acc, item) => ({ ...acc, [item._id]: item.count }), {}),
      byStatus: byStatus.reduce((acc, item) => ({ ...acc, [item._id]: item.count }), {}),
      recentSignups: recent,
    };
  }

  async searchUsers(searchTerm, options = {}) {
    const User = require('../models').User;
    
    const { page = 1, limit = 20 } = options;
    
    const query = {
      $or: [
        { name: { $regex: searchTerm, $options: 'i' } },
        { email: { $regex: searchTerm, $options: 'i' } },
        { location: { $regex: searchTerm, $options: 'i' } },
      ],
      status: 'active',
    };

    const pagination = paginate(page, limit, await User.countDocuments(query));

    const users = await User.find(query)
      .select('name email avatar role location bio')
      .sort('-createdAt')
      .skip(pagination.skip)
      .limit(pagination.limit)
      .lean();

    return {
      data: users,
      meta: pagination,
    };
  }
}

module.exports = new UserService();