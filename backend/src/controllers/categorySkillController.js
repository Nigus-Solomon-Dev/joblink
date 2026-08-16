const categoryService = require('../services/categoryService');
const skillService = require('../services/skillService');
const ApiResponse = require('../utils/apiResponse');
const catchAsync = require('../utils/catchAsync');
const { AppError, NotFoundError } = require('../utils/errors');
const { protect, restrictTo } = require('../middleware/auth');

class CategoryController {
  getAllCategories = catchAsync(async (req, res, next) => {
    const { page, limit, sort, parentId, isActive, search } = req.query;
    
    const result = await categoryService.getCategories(
      { parentId, isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined, search },
      { page: parseInt(page) || 1, limit: parseInt(limit) || 50, sort: sort || 'order' }
    );
    
    const response = ApiResponse.success(result.data, 'Categories fetched successfully', 200, result.meta);
    res.status(200).json(response);
  });

  getCategoryTree = catchAsync(async (req, res, next) => {
    const tree = await categoryService.getCategoryTree();
    
    const response = ApiResponse.success({ categories: tree }, 'Category tree fetched successfully');
    res.status(200).json(response);
  });

  getCategoriesWithJobCounts = catchAsync(async (req, res, next) => {
    const categories = await categoryService.getCategoriesWithJobCounts();
    
    const response = ApiResponse.success({ categories }, 'Categories with job counts fetched successfully');
    res.status(200).json(response);
  });

  getCategory = catchAsync(async (req, res, next) => {
    const category = await categoryService.getCategoryById(req.params.id);
    
    const response = ApiResponse.success({ category }, 'Category fetched successfully');
    res.status(200).json(response);
  });

  getCategoryBySlug = catchAsync(async (req, res, next) => {
    const category = await categoryService.getCategoryBySlug(req.params.slug);
    
    const response = ApiResponse.success({ category }, 'Category fetched successfully');
    res.status(200).json(response);
  });

  createCategory = catchAsync(async (req, res, next) => {
    const category = await categoryService.createCategory(req.body);
    
    const response = ApiResponse.created({ category }, 'Category created successfully');
    res.status(201).json(response);
  });

  updateCategory = catchAsync(async (req, res, next) => {
    const category = await categoryService.updateCategory(req.params.id, req.body);
    
    const response = ApiResponse.success({ category }, 'Category updated successfully');
    res.status(200).json(response);
  });

  deleteCategory = catchAsync(async (req, res, next) => {
    await categoryService.deleteCategory(req.params.id);
    
    const response = ApiResponse.success(null, 'Category deleted successfully');
    res.status(200).json(response);
  });
}

class SkillController {
  getAllSkills = catchAsync(async (req, res, next) => {
    const { page, limit, sort, category, isActive, search } = req.query;
    
    const result = await skillService.getSkills(
      { category, isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined, search },
      { page: parseInt(page) || 1, limit: parseInt(limit) || 50, sort: sort || 'name' }
    );
    
    const response = ApiResponse.success(result.data, 'Skills fetched successfully', 200, result.meta);
    res.status(200).json(response);
  });

  getSkillsGroupedByCategory = catchAsync(async (req, res, next) => {
    const grouped = await skillService.getAllSkillsGroupedByCategory();
    
    const response = ApiResponse.success({ skills: grouped }, 'Skills grouped by category fetched successfully');
    res.status(200).json(response);
  });

  getSkillsByCategory = catchAsync(async (req, res, next) => {
    const skills = await skillService.getSkillsByCategory(req.params.category);
    
    const response = ApiResponse.success({ skills }, 'Skills fetched successfully');
    res.status(200).json(response);
  });

  getTopSkills = catchAsync(async (req, res, next) => {
    const limit = parseInt(req.query.limit) || 20;
    const skills = await skillService.getTopSkills(limit);
    
    const response = ApiResponse.success({ skills }, 'Top skills fetched successfully');
    res.status(200).json(response);
  });

  searchSkills = catchAsync(async (req, res, next) => {
    const { q, page, limit } = req.query;
    
    if (!q || q.trim().length < 2) {
      throw new AppError('Search query must be at least 2 characters', 400);
    }
    
    const result = await skillService.searchSkills(q.trim(), { 
      page: parseInt(page) || 1, 
      limit: parseInt(limit) || 20 
    });
    
    const response = ApiResponse.success(result.data, 'Skills fetched successfully', 200, result.meta);
    res.status(200).json(response);
  });

  getSkill = catchAsync(async (req, res, next) => {
    const skill = await skillService.getSkillById(req.params.id);
    
    const response = ApiResponse.success({ skill }, 'Skill fetched successfully');
    res.status(200).json(response);
  });

  getSkillBySlug = catchAsync(async (req, res, next) => {
    const skill = await skillService.getSkillBySlug(req.params.slug);
    
    const response = ApiResponse.success({ skill }, 'Skill fetched successfully');
    res.status(200).json(response);
  });

  createSkill = catchAsync(async (req, res, next) => {
    const skill = await skillService.createSkill(req.body);
    
    const response = ApiResponse.created({ skill }, 'Skill created successfully');
    res.status(201).json(response);
  });

  updateSkill = catchAsync(async (req, res, next) => {
    const skill = await skillService.updateSkill(req.params.id, req.body);
    
    const response = ApiResponse.success({ skill }, 'Skill updated successfully');
    res.status(200).json(response);
  });

  deleteSkill = catchAsync(async (req, res, next) => {
    await skillService.deleteSkill(req.params.id);
    
    const response = ApiResponse.success(null, 'Skill deleted successfully');
    res.status(200).json(response);
  });
}

module.exports = {
  categoryController: new CategoryController(),
  skillController: new SkillController(),
};