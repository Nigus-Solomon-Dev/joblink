const express = require('express');
const { body, param } = require('express-validator');
const savedJobController = require('../controllers/savedJobController');
const { validate } = require('../utils/validation');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/', savedJobController.getSavedJobs);
router.get('/count', savedJobController.getSavedJobCount);

router.post(
  '/:jobId',
  [
    body('notes').optional().trim().isLength({ max: 500 }).withMessage('Notes cannot exceed 500 characters'),
  ],
  validate,
  savedJobController.saveJob
);

router.delete('/:jobId', savedJobController.unsaveJob);
router.get('/:jobId/is-saved', savedJobController.isSaved);

router.patch(
  '/:jobId/notes',
  [
    body('notes').optional({ nullable: true }).trim().isLength({ max: 500 }).withMessage('Notes cannot exceed 500 characters'),
  ],
  validate,
  savedJobController.updateNotes
);

router.post(
  '/:jobId/tags',
  [
    body('tags').isArray().withMessage('Tags must be an array'),
    body('tags.*').trim().isLength({ min: 1, max: 30 }).withMessage('Each tag must be 1-30 characters'),
  ],
  validate,
  savedJobController.addTags
);

router.delete(
  '/:jobId/tags',
  [
    body('tags').isArray().withMessage('Tags must be an array'),
  ],
  validate,
  savedJobController.removeTags
);

module.exports = router;