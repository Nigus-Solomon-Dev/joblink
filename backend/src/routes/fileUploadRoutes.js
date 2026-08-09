const express = require('express');
const { query, param } = require('express-validator');
const fileUploadController = require('../controllers/fileUploadController');
const { validate } = require('../utils/validation');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.post('/upload', 
  fileUploadController.uploadMiddleware,
  (req, res, next) => next()
);

router.post('/upload-multiple', 
  fileUploadController.uploadMultipleMiddleware,
  (req, res, next) => next()
);

router.delete('/:publicId', 
  param('publicId')
    .notEmpty()
    .withMessage('Public ID is required')
    .isMongoId()
    .optional()
    .withMessage('Invalid public ID format'),
  validate,
  fileUploadController.deleteFile
);

router.get('/:publicId', 
  param('publicId')
    .notEmpty()
    .withMessage('Public ID is required'),
  validate,
  fileUploadController.getFileInfo
);

router.get('/signature', 
  query('folder').optional().isString().withMessage('Folder must be a string'),
  validate,
  fileUploadController.getUploadSignature
);

module.exports = router;