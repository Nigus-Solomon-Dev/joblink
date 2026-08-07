const jwt = require('jsonwebtoken');
const { JWT_SECRET, JWT_REFRESH_SECRET } = require('../config/env');
const { AppError, AuthenticationError, AuthorizationError } = require('../utils/errors');
const TokenBlacklist = require('../services/tokenBlacklist');

const protect = async (req, res, next) => {
  try {
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      throw new AuthenticationError('You are not logged in. Please log in to access this resource.');
    }

    const isBlacklisted = await TokenBlacklist.isBlacklisted(token);
    if (isBlacklisted) {
      throw new AuthenticationError('Token has been revoked. Please log in again.');
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        throw new AuthenticationError('Your session has expired. Please log in again.');
      }
      throw new AuthenticationError('Invalid token. Please log in again.');
    }

    const User = require('../models').User;
    const user = await User.findById(decoded.id);
    
    if (!user) {
      throw new AuthenticationError('User no longer exists.');
    }

    if (user.status !== 'active') {
      throw new AuthenticationError('Your account is not active.');
    }

    req.user = user;
    req.token = token;
    next();
  } catch (err) {
    next(err);
  }
};

const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AuthenticationError('You are not logged in.'));
    }
    
    if (!roles.includes(req.user.role)) {
      return next(new AuthorizationError('You do not have permission to perform this action.'));
    }
    
    next();
  };
};

const optionalAuth = async (req, res, next) => {
  try {
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      return next();
    }

    const isBlacklisted = await TokenBlacklist.isBlacklisted(token);
    if (isBlacklisted) {
      return next();
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return next();
    }

    const User = require('../models').User;
    const user = await User.findById(decoded.id);
    
    if (user && user.status === 'active') {
      req.user = user;
      req.token = token;
    }
    
    next();
  } catch (err) {
    next();
  }
};

const verifyRefreshToken = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!refreshToken) {
      throw new AuthenticationError('Refresh token is required');
    }

    const isBlacklisted = await TokenBlacklist.isBlacklisted(refreshToken);
    if (isBlacklisted) {
      throw new AuthenticationError('Token has been revoked');
    }

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    } catch (err) {
      throw new AuthenticationError('Invalid or expired refresh token');
    }

    const User = require('../models').User;
    const user = await User.findById(decoded.id);
    
    if (!user || user.status !== 'active') {
      throw new AuthenticationError('User not found or inactive');
    }

    req.user = user;
    req.refreshToken = refreshToken;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = {
  protect,
  restrictTo,
  optionalAuth,
  verifyRefreshToken,
};