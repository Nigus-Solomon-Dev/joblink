const express = require('express');
const { query, param, body } = require('express-validator');
const searchController = require('../controllers/searchController');
const { validate } = require('../utils/validation');
const { protect, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Public search routes
router.get('/', searchController.searchJobs);
router.get('/facets', searchController.getFacets);
router.get('/suggestions', searchController.getSuggestions);

// Protected routes
router.use(protect);

router.post(
  '/saved',
  [
    body('filters').isObject().withMessage('Filters must be an object'),
    body('name').optional().trim().isLength({ max: 100 }).withMessage('Name cannot exceed 100 characters'),
  ],
  validate,
  searchController.saveSearch
);

router.get('/saved', searchController.getSavedSearches);
router.delete('/saved/:index', searchController.deleteSavedSearch);

router.get('/history', searchController.getSearchHistory);
router.post(
  '/history',
  [
    body('query').trim().isLength({ min: 1 }).withMessage('Query is required'),
  ],
  validate,
  searchController.addToSearchHistory
);

module.exports = router;