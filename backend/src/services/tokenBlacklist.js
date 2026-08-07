const mongoose = require('mongoose');

const tokenBlacklistSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      required: true,
      unique: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    tokenType: {
      type: String,
      enum: ['access', 'refresh'],
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

tokenBlacklistSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
tokenBlacklistSchema.index({ userId: 1 });
tokenBlacklistSchema.index({ token: 1 }, { unique: true });

const TokenBlacklist = mongoose.model('TokenBlacklist', tokenBlacklistSchema);

class TokenBlacklistService {
  async add(token, userId, tokenType = 'refresh') {
    try {
      const decoded = require('jsonwebtoken').decode(token);
      if (!decoded || !decoded.exp) {
        return false;
      }

      const expiresAt = new Date(decoded.exp * 1000);
      
      await TokenBlacklist.create({
        token,
        userId,
        tokenType,
        expiresAt,
      });
      
      return true;
    } catch (err) {
      if (err.code === 11000) {
        return true;
      }
      throw err;
    }
  }

  async isBlacklisted(token) {
    const entry = await TokenBlacklist.findOne({ token });
    return !!entry;
  }

  async blacklistAllUserTokens(userId) {
    return TokenBlacklist.deleteMany({ userId });
  }

  async blacklistUserAccessTokens(userId) {
    return TokenBlacklist.deleteMany({ userId, tokenType: 'access' });
  }

  async blacklistUserRefreshTokens(userId) {
    return TokenBlacklist.deleteMany({ userId, tokenType: 'refresh' });
  }

  async cleanup() {
    return TokenBlacklist.deleteMany({ expiresAt: { $lt: new Date() } });
  }
}

module.exports = new TokenBlacklistService();