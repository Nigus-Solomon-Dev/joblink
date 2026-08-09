const { AppError, NotFoundError } = require('../utils/errors');
const { FILE_UPLOAD } = require('../constants');
const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = require('../config/env');
const Logger = require('../utils/logger');
const cloudinary = require('cloudinary').v2;

class FileUploadService {
  constructor() {
    this.isConfigured = false;
    this.initializeCloudinary();
  }

  initializeCloudinary() {
    if (CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET) {
      cloudinary.config({
        cloud_name: CLOUDINARY_CLOUD_NAME,
        api_key: CLOUDINARY_API_KEY,
        api_secret: CLOUDINARY_API_SECRET,
      });
      this.isConfigured = true;
    } else {
      Logger.warn('Cloudinary configuration not complete. File upload service will use local storage.');
    }
  }

  async uploadFile(file, options = {}) {
    if (!file) {
      throw new AppError('No file provided', 400);
    }

    const { folder = 'general', useFileName } = options;

    if (!this.isConfigured) {
      throw new AppError('Cloudinary not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET', 500);
    }

    if (file.mimetype === 'application/pdf') {
      FILE_UPLOAD.ALLOWED_MIME_TYPES.includes(file.mimetype);
    }

    const uploadOptions = {
      folder,
      public_id: useFileName ? file.originalname.replace(/\.[^/.]+$/, "") : undefined,
      resource_type: file.mimetype === 'application/pdf' ? 'raw' : 'image',
      transformation: file.mimetype.startsWith('image/') ? this.getImageTransformations(file) : undefined,
    };

    try {
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            ...uploadOptions,
            public_id: uploadOptions.public_id || `file_${Date.now()}`,
            unique_filename: !useFileName,
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );

        stream.end(file.buffer);
      });

      Logger.info('File uploaded successfully', {
        filename: file.originalname,
        url: result.secure_url,
        public_id: result.public_id
      });

      return {
        success: true,
        message: 'File uploaded successfully',
        data: {
          url: result.secure_url,
          public_id: result.public_id,
          filename: result.original_filename || file.originalname,
          mimetype: file.mimetype,
          size: result.bytes,
          width: result.width,
          height: result.height,
          format: result.format,
        }
      };
    } catch (error) {
      Logger.error('File upload failed', { error: error.message });
      throw new AppError(`File upload failed: ${error.message}`, 500);
    }
  }

  async uploadMultipleFiles(files, options = {}) {
    if (!files || files.length === 0) {
      throw new AppError('No files provided', 400);
    }

    if (files.length > FILE_UPLOAD.MAX_FILES_PER_REQUEST) {
      throw new AppError(`Maximum ${FILE_UPLOAD.MAX_FILES_PER_REQUEST} files allowed per request`, 400);
    }

    const results = await Promise.all(
      files.map(file => this.uploadFile(file, options))
    );

    return {
      success: true,
      message: `${files.length} file(s) uploaded successfully`,
      data: results.map(r => r.data)
    };
  }

  getImageTransformations(file) {
    const isLargeImage = (file.size || 0) > 1024 * 1024;
    return isLargeImage ? { quality: 'auto', fetch_format: 'auto' } : undefined;
  }

  async deleteFile(publicId, options = {}) {
    if (!publicId) {
      throw new AppError('Public ID is required', 400);
    }

    if (!this.isConfigured) {
      throw new AppError('Cloudinary not configured', 500);
    }

    try {
      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: options.resourceType || 'image'
      });

      Logger.info('File deleted successfully', { publicId, result });

      return {
        success: true,
        message: 'File deleted successfully',
        data: { public_id: publicId, deleted: result.result === 'ok' }
      };
    } catch (error) {
      Logger.error('File deletion failed', { error: error.message, publicId });
      throw new AppError(`File deletion failed: ${error.message}`, 500);
    }
  }

  async getFileInfo(publicId) {
    if (!publicId) {
      throw new AppError('Public ID is required', 400);
    }

    try {
      const result = await cloudinary.api.resource(publicId);
      return {
        success: true,
        data: result
      };
    } catch (error) {
      if (error.message.includes('not found')) {
        throw new NotFoundError('File not found');
      }
      Logger.error('Failed to get file info', { error: error.message });
      throw new AppError(`Failed to get file info: ${error.message}`, 500);
    }
  }

  validateFile(file) {
    if (file.size > FILE_UPLOAD.MAX_SIZE) {
      throw new AppError(`File size exceeds maximum allowed size of ${FILE_UPLOAD.MAX_SIZE / 1024 / 1024}MB`, 400);
    }

    if (!FILE_UPLOAD.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new AppError('Invalid file type', 400);
    }

    return true;
  }

  generateSignature(options) {
    if (!this.isConfigured) {
      throw new AppError('Cloudinary not configured', 500);
    }

    const timestamp = Math.round(Date.now() / 1000);
    const api_key = CLOUDINARY_API_KEY;

    return {
      timestamp,
      api_key,
      signature: this.createSignature(timestamp, options),
    };
  }

  createSignature(timestamp, options) {
    return require('crypto')
      .createHash('sha256')
      .update(`${Object.entries(options)
        .filter(([k]) => k !== 'api_key' && k !== 'timestamp')
        .map(([k, v]) => `${k}=${v}`)
        .join('&')}&${CLOUDINARY_API_SECRET}`)
      .digest('hex');
  }
}

module.exports = new FileUploadService();