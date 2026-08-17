const userService = require('../services/userService');
const ApiResponse = require('../utils/apiResponse');
const catchAsync = require('../utils/catchAsync');
const { AppError, NotFoundError } = require('../utils/errors');
const { protect, restrictTo } = require('../middleware/auth');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError('Only JPEG, PNG, and WebP images are allowed', 400), false);
    }
  },
});

class UserController {
  getMe = catchAsync(async (req, res, next) => {
    const user = await userService.getUserById(req.user.id, true);
    
    const response = ApiResponse.success({ user }, 'User fetched successfully');
    res.status(200).json(response);
  });

  getPublicProfile = catchAsync(async (req, res, next) => {
    const user = await userService.getUserById(req.params.id);
    
    const publicProfile = {
      id: user._id,
      name: user.name,
      avatar: user.avatar,
      bio: user.bio,
      location: user.location,
      website: user.website,
      linkedin: user.linkedin,
      role: user.role,
      createdAt: user.createdAt,
    };
    
    const response = ApiResponse.success({ user: publicProfile }, 'Profile fetched successfully');
    res.status(200).json(response);
  });

  updateProfile = catchAsync(async (req, res, next) => {
    const user = await userService.updateUser(req.user.id, req.body);
    
    const response = ApiResponse.success({ user }, 'Profile updated successfully');
    res.status(200).json(response);
  });

  changePassword = catchAsync(async (req, res, next) => {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    
    if (newPassword !== confirmPassword) {
      throw new AppError('Passwords do not match', 400);
    }
    
    await userService.changePassword(req.user.id, currentPassword, newPassword);
    
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
    
    const response = ApiResponse.success(null, 'Password changed successfully. Please log in again.');
    res.status(200).json(response);
  });

  uploadAvatar = catchAsync(async (req, res, next) => {
    if (!req.file) {
      throw new AppError('No file uploaded', 400);
    }

    let avatarUrl;
    try {
      if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
        avatarUrl = await this._uploadToCloudinary(req.file.buffer);
      } else {
        avatarUrl = this._saveAvatarLocally(req);
      }
    } catch (error) {
      avatarUrl = this._saveAvatarLocally(req);
    }

    const user = await userService.updateAvatar(req.user.id, avatarUrl);

    const response = ApiResponse.success({ user }, 'Avatar uploaded successfully');
    res.status(200).json(response);
  });

  _uploadToCloudinary(buffer) {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'joblink/avatars',
          transformation: [
            { width: 400, height: 400, crop: 'fill', gravity: 'face' },
            { quality: 'auto' },
          ],
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result.secure_url);
        }
      );
      stream.end(buffer);
    });
  }

  _saveAvatarLocally(req) {
    const fs = require('fs');
    const path = require('path');
    const avatarsDir = path.join(__dirname, '..', '..', 'uploads', 'avatars');
    fs.mkdirSync(avatarsDir, { recursive: true });

    const ext = req.file.mimetype === 'image/png' ? 'png' : req.file.mimetype === 'image/webp' ? 'webp' : 'jpg';
    const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}.${ext}`;
    fs.writeFileSync(path.join(avatarsDir, filename), req.file.buffer);

    const baseUrl = process.env.PUBLIC_UPLOAD_BASE || `${req.protocol}://${req.get('host')}`;
    return `${baseUrl}/uploads/avatars/${filename}`;
  }

  deleteAccount = catchAsync(async (req, res, next) => {
    await userService.deleteUser(req.user.id);
    
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
    
    const response = ApiResponse.success(null, 'Account deleted successfully');
    res.status(200).json(response);
  });

  // Admin routes
  getAllUsers = catchAsync(async (req, res, next) => {
    const { page, limit, sort, role, status, search, emailVerified } = req.query;
    
    const result = await userService.getUsers(
      { role, status, search, emailVerified: emailVerified === 'true' ? true : emailVerified === 'false' ? false : undefined },
      { page: parseInt(page) || 1, limit: parseInt(limit) || 20, sort: sort || '-createdAt' }
    );
    
    const response = ApiResponse.success(result.data, 'Users fetched successfully', 200, result.meta);
    res.status(200).json(response);
  });

  getUserStats = catchAsync(async (req, res, next) => {
    const stats = await userService.getUserStats();
    
    const response = ApiResponse.success(stats, 'User stats fetched successfully');
    res.status(200).json(response);
  });

  getUserById = catchAsync(async (req, res, next) => {
    const user = await userService.getUserById(req.params.id, true);
    
    const response = ApiResponse.success({ user }, 'User fetched successfully');
    res.status(200).json(response);
  });

  updateUser = catchAsync(async (req, res, next) => {
    const user = await userService.updateUser(req.params.id, req.body, true);
    
    const response = ApiResponse.success({ user }, 'User updated successfully');
    res.status(200).json(response);
  });

  deleteUser = catchAsync(async (req, res, next) => {
    if (req.params.id === req.user.id.toString()) {
      throw new AppError('You cannot delete your own account through admin panel', 400);
    }
    
    await userService.deleteUser(req.params.id);
    
    const response = ApiResponse.success(null, 'User deleted successfully');
    res.status(200).json(response);
  });

  searchUsers = catchAsync(async (req, res, next) => {
    const { q, page, limit } = req.query;
    
    if (!q || q.trim().length < 2) {
      throw new AppError('Search query must be at least 2 characters', 400);
    }
    
    const result = await userService.searchUsers(q.trim(), { 
      page: parseInt(page) || 1, 
      limit: parseInt(limit) || 20 
    });
    
    const response = ApiResponse.success(result.data, 'Users fetched successfully', 200, result.meta);
    res.status(200).json(response);
  });
}

module.exports = new UserController();