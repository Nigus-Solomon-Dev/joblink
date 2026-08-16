const fileUploadService = require('../services/fileUploadService');
const ApiResponse = require('../utils/apiResponse');
const catchAsync = require('../utils/catchAsync');
const upload = require('../middleware/upload');
const { protect, restrictTo } = require('../middleware/auth');

class FileUploadController {
  uploadFile = catchAsync(async (req, res, next) => {
    if (!req.file) {
      return next(new Error('No file uploaded'));
    }

    const { folder, useFileName } = req.query;
    const result = await fileUploadService.uploadFile(req.file, {
      folder: folder || 'uploads',
      useFileName: useFileName === 'true'
    });

    const response = ApiResponse.created(result.data, result.message);
    res.status(201).json(response);
  });

  uploadMultipleFiles = catchAsync(async (req, res, next) => {
    if (!req.files || req.files.length === 0) {
      return next(new Error('No files uploaded'));
    }

    const { folder } = req.query;
    const result = await fileUploadService.uploadMultipleFiles(req.files, {
      folder: folder || 'uploads'
    });

    const response = ApiResponse.created(result.data, result.message);
    res.status(201).json(response);
  });

  uploadMiddleware = [
    upload.single('file'),
    this.uploadFile
  ];

  uploadMultipleMiddleware = [
    upload.array('files', 10),
    this.uploadMultipleFiles
  ];

  deleteFile = catchAsync(async (req, res, next) => {
    const { publicId } = req.params;
    const { resourceType } = req.query;

    const result = await fileUploadService.deleteFile(publicId, { resourceType });

    const response = ApiResponse.success(result.data, result.message);
    res.status(200).json(response);
  });

  getFileInfo = catchAsync(async (req, res, next) => {
    const { publicId } = req.params;

    const result = await fileUploadService.getFileInfo(publicId);

    const response = ApiResponse.success(result.data);
    res.status(200).json(response);
  });

  getUploadSignature = catchAsync(async (req, res, next) => {
    const { folder } = req.query;

    const signatureData = fileUploadService.generateSignature({
      folder,
      allowed_formats: 'jpg,png,pdf',
      transformation: 'w_1000',
      eager: 'w_800,h_800,c_fill',
    });

    const response = ApiResponse.success(signatureData);
    res.status(200).json(response);
  });
}

module.exports = new FileUploadController();