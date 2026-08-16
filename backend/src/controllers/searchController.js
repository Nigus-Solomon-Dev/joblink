const searchService = require('../services/searchService');
const ApiResponse = require('../utils/apiResponse');
const catchAsync = require('../utils/catchAsync');
const { AppError } = require('../utils/errors');
const { protect, optionalAuth } = require('../middleware/auth');

class SearchController {
  searchJobs = catchAsync(async (req, res, next) => {
    const { 
      page, limit, sort, query, categoryId, location, type, 
      experienceLevel, salaryMin, salaryMax, isRemote, companyId, 
      featured, skills, postedWithin, companySize, industry,
      workArrangement 
    } = req.query;

    const skillsArray = skills ? (Array.isArray(skills) ? skills : skills.split(',')) : undefined;

    const result = await searchService.searchJobs(
      { 
        query, categoryId, location, type, experienceLevel, 
        salaryMin: salaryMin ? parseInt(salaryMin) : undefined,
        salaryMax: salaryMax ? parseInt(salaryMax) : undefined,
        isRemote, companyId, featured: featured === 'true' ? true : featured === 'false' ? false : undefined,
        skills: skillsArray,
        postedWithin,
        companySize,
        industry,
        workArrangement,
      },
      { page: parseInt(page) || 1, limit: parseInt(limit) || 20, sort: sort || 'relevance' }
    );
    
    const response = ApiResponse.success(result.data, 'Jobs fetched successfully', 200, result.meta);
    res.status(200).json(response);
  });

  getFacets = catchAsync(async (req, res, next) => {
    const { 
      query, categoryId, location, type, experienceLevel, 
      isRemote, featured, skills, companySize, industry 
    } = req.query;

    const skillsArray = skills ? (Array.isArray(skills) ? skills : skills.split(',')) : undefined;

    const facets = await searchService.getFacets(
      { query, categoryId, location, type, experienceLevel, isRemote, featured, skills: skillsArray, companySize, industry }
    );
    
    const response = ApiResponse.success(facets, 'Facets fetched successfully');
    res.status(200).json(response);
  });

  getSuggestions = catchAsync(async (req, res, next) => {
    const { q, limit } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.status(200).json(ApiResponse.success({ jobs: [], categories: [], skills: [], companies: [] }, 'Suggestions fetched'));
    }
    
    const suggestions = await searchService.getSuggestions(q.trim(), parseInt(limit) || 10);
    
    const response = ApiResponse.success(suggestions, 'Suggestions fetched successfully');
    res.status(200).json(response);
  });

  saveSearch = catchAsync(async (req, res, next) => {
    const { name, filters } = req.body;
    
    if (!filters) {
      throw new AppError('Filters are required', 400);
    }
    
    const search = await searchService.saveSearch(req.user.id, { name, filters });
    
    const response = ApiResponse.success({ search }, 'Search saved successfully');
    res.status(200).json(response);
  });

  getSavedSearches = catchAsync(async (req, res, next) => {
    const searches = await searchService.getSavedSearches(req.user.id);
    
    const response = ApiResponse.success({ searches }, 'Saved searches fetched successfully');
    res.status(200).json(response);
  });

  deleteSavedSearch = catchAsync(async (req, res, next) => {
    const { index } = req.params;
    
    await searchService.deleteSavedSearch(req.user.id, parseInt(index));
    
    const response = ApiResponse.success(null, 'Saved search deleted successfully');
    res.status(200).json(response);
  });

  getSearchHistory = catchAsync(async (req, res, next) => {
    const { limit } = req.query;
    const history = await searchService.getSearchHistory(req.user.id, parseInt(limit) || 20);
    
    const response = ApiResponse.success({ history }, 'Search history fetched successfully');
    res.status(200).json(response);
  });

  addToSearchHistory = catchAsync(async (req, res, next) => {
    const { query } = req.body;
    
    if (!query) {
      throw new AppError('Search query is required', 400);
    }
    
    await searchService.addToSearchHistory(req.user.id, query);
    
    const response = ApiResponse.success(null, 'Added to search history');
    res.status(200).json(response);
  });
}

module.exports = new SearchController();