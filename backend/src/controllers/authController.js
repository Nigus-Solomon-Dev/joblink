const authService = require('../services/authService');
const { ApiResponse } = require('../utils/apiResponse');
const catchAsync = require('../utils/catchAsync');
const { AppError } = require('../utils/errors');
const EmailService = require('../services/emailService');

class AuthController {
  register = catchAsync(async (req, res, next) => {
    const { name, email, password, role, confirmPassword } = req.body;

    if (password !== confirmPassword) {
      throw new AppError('Passwords do not match', 400);
    }

    const { user, emailVerificationToken } = await authService.register({
      name,
      email,
      password,
      role: role || 'job_seeker',
    });

    await EmailService.sendVerificationEmail(user.email, emailVerificationToken);

    const response = ApiResponse.created({
      user: user.toPublicJSON(),
    }, 'Registration successful. Please check your email to verify your account.');

    res.status(201).json(response);
  });

  login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new AppError('Please provide email and password', 400);
    }

    const { user, accessToken, refreshToken } = await authService.login(email, password);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    const response = ApiResponse.success({
      user: user.toPublicJSON(),
      accessToken,
    }, 'Login successful');

    res.status(200).json(response);
  });

  refresh = catchAsync(async (req, res, next) => {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!refreshToken) {
      throw new AppError('Refresh token is required', 401);
    }

    const { accessToken, refreshToken: newRefreshToken } = await authService.refreshTokens(refreshToken);

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    const response = ApiResponse.success({
      accessToken,
    }, 'Token refreshed successfully');

    res.status(200).json(response);
  });

  logout = catchAsync(async (req, res, next) => {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

    await authService.logout(refreshToken);

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    const response = ApiResponse.success(null, 'Logged out successfully');
    res.status(200).json(response);
  });

  logoutAll = catchAsync(async (req, res, next) => {
    await authService.logoutAll(req.user.id);

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    const response = ApiResponse.success(null, 'Logged out from all devices');
    res.status(200).json(response);
  });

  verifyEmail = catchAsync(async (req, res, next) => {
    const { token } = req.params;

    if (!token) {
      throw new AppError('Verification token is required', 400);
    }

    await authService.verifyEmail(token);

    const response = ApiResponse.success(null, 'Email verified successfully. You can now log in.');
    res.status(200).json(response);
  });

  resendVerification = catchAsync(async (req, res, next) => {
    const { email } = req.body;

    if (!email) {
      throw new AppError('Email is required', 400);
    }

    const { emailVerificationToken } = await authService.resendVerificationEmail(email);

    await EmailService.sendVerificationEmail(email, emailVerificationToken);

    const response = ApiResponse.success(null, 'Verification email sent. Please check your inbox.');
    res.status(200).json(response);
  });

  forgotPassword = catchAsync(async (req, res, next) => {
    const { email } = req.body;

    if (!email) {
      throw new AppError('Email is required', 400);
    }

    const { resetToken } = await authService.forgotPassword(email);

    await EmailService.sendPasswordResetEmail(email, resetToken);

    const response = ApiResponse.success(null, 'Password reset email sent. Please check your inbox.');
    res.status(200).json(response);
  });

  resetPassword = catchAsync(async (req, res, next) => {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;

    if (!token) {
      throw new AppError('Reset token is required', 400);
    }

    if (!password || !confirmPassword) {
      throw new AppError('Password and confirm password are required', 400);
    }

    if (password !== confirmPassword) {
      throw new AppError('Passwords do not match', 400);
    }

    await authService.resetPassword(token, password);

    const response = ApiResponse.success(null, 'Password reset successful. You can now log in.');
    res.status(200).json(response);
  });

  changePassword = catchAsync(async (req, res, next) => {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      throw new AppError('All fields are required', 400);
    }

    if (newPassword !== confirmPassword) {
      throw new AppError('Passwords do not match', 400);
    }

    await authService.changePassword(req.user.id, currentPassword, newPassword);

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    const response = ApiResponse.success(null, 'Password changed successfully. Please log in again.');
    res.status(200).json(response);
  });

  getMe = catchAsync(async (req, res, next) => {
    const response = ApiResponse.success({
      user: req.user.toPublicJSON(),
    }, 'User fetched successfully');

    res.status(200).json(response);
  });

  updateProfile = catchAsync(async (req, res, next) => {
    const user = await authService.updateProfile(req.user.id, req.body);

    const response = ApiResponse.success({
      user: user.toPublicJSON(),
    }, 'Profile updated successfully');

    res.status(200).json(response);
  });
}

module.exports = new AuthController();