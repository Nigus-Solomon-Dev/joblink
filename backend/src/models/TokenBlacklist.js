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

module.exports = mongoose.model('TokenBlacklist', tokenBlacklistSchema);