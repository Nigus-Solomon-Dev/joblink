const { AppError, NotFoundError } = require('../utils/errors');
const { paginate } = require('../utils/helpers');

class CategoryService {
  async createCategory(categoryData) {
    const Category = require('../models').Category;
    
    const existingCategory = await Category.findOne({ name: categoryData.name });
    if (existingCategory) {
      throw new AppError('Category with this name already exists', 400);
    }

    if (categoryData.parentId) {
      const parent = await Category.findById(categoryData.parentId);
      if (!parent) {
        throw new NotFoundError('Parent category not found');
      }
    }

    const category = await Category.create(categoryData);
    return category;
  }

  async getCategoryById(categoryId) {
    const Category = require('../models').Category;
    const category = await Category.findById(categoryId);

    if (!category) {
      throw new NotFoundError('Category not found');
    }

    return category;
  }

  async getCategoryBySlug(slug) {
    const Category = require('../models').Category;
    const category = await Category.findOne({ slug });

    if (!category) {
      throw new NotFoundError('Category not found');
    }

    return category;
  }

  async updateCategory(categoryId, updateData) {
    const Category = require('../models').Category;
    const category = await Category.findById(categoryId);

    if (!category) {
      throw new NotFoundError('Category not found');
    }

    const allowedFields = ['name', 'description', 'icon', 'parentId', 'order', 'isActive'];
    const updates = {};
    
    Object.keys(updateData).forEach(key => {
      if (allowedFields.includes(key)) {
        updates[key] = updateData[key];
      }
    });

    if (updates.name && updates.name !== category.name) {
      const existingCategory = await Category.findOne({ name: updates.name, _id: { $ne: categoryId } });
      if (existingCategory) {
        throw new AppError('Category with this name already exists', 400);
      }
      
      const baseSlug = require('../utils/helpers').slugify(updates.name);
      let uniqueSlug = baseSlug;
      let counter = 1;
      while (await Category.findOne({ slug: uniqueSlug, _id: { $ne: categoryId } })) {
        uniqueSlug = `${baseSlug}-${counter}`;
        counter++;
      }
      updates.slug = uniqueSlug;
    }

    if (updates.parentId) {
      if (updates.parentId === categoryId) {
        throw new AppError('Category cannot be its own parent', 400);
      }
      const parent = await Category.findById(updates.parentId);
      if (!parent) {
        throw new NotFoundError('Parent category not found');
      }
    }

    const updatedCategory = await Category.findByIdAndUpdate(categoryId, updates, {
      new: true,
      runValidators: true,
    });

    return updatedCategory;
  }

  async deleteCategory(categoryId) {
    const Category = require('../models').Category;
    const Job = require('../models').Job;

    const category = await Category.findById(categoryId);
    if (!category) {
      throw new NotFoundError('Category not found');
    }

    const childrenCount = await Category.countDocuments({ parentId: categoryId });
    if (childrenCount > 0) {
      throw new AppError('Cannot delete category with subcategories. Delete subcategories first.', 400);
    }

    const jobsCount = await Job.countDocuments({ categoryId });
    if (jobsCount > 0) {
      throw new AppError('Cannot delete category with associated jobs. Reassign or delete jobs first.', 400);
    }

    await Category.findByIdAndDelete(categoryId);
    return true;
  }

  async getCategories(filters = {}, options = {}) {
    const Category = require('../models').Category;

    const { page = 1, limit = 50, sort = 'order' } = options;
    const { parentId, isActive, search } = filters;

    const query = {};

    if (parentId !== undefined) {
      query.parentId = parentId === 'null' || parentId === '' ? null : parentId;
    }
    if (isActive !== undefined) query.isActive = isActive === 'true';
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const pagination = paginate(page, limit, await Category.countDocuments(query));

    const categories = await Category.find(query)
      .sort(sort)
      .skip(pagination.skip)
      .limit(pagination.limit)
      .lean();

    return {
      data: categories,
      meta: pagination,
    };
  }

  async getCategoryTree() {
    const Category = require('../models').Category;
    
    const categories = await Category.find({ isActive: true })
      .sort({ order: 1, name: 1 })
      .lean();

    const categoryMap = {};
    const roots = [];

    categories.forEach(cat => {
      categoryMap[cat._id.toString()] = { ...cat, children: [] };
    });

    categories.forEach(cat => {
      if (cat.parentId) {
        const parent = categoryMap[cat.parentId.toString()];
        if (parent) {
          parent.children.push(categoryMap[cat._id.toString()]);
        } else {
          roots.push(categoryMap[cat._id.toString()]);
        }
      } else {
        roots.push(categoryMap[cat._id.toString()]);
      }
    });

    return roots;
  }

  async getCategoriesWithJobCounts() {
    const Category = require('../models').Category;
    const Job = require('../models').Job;

    const categories = await Category.find({ isActive: true })
      .sort({ order: 1, name: 1 })
      .lean();

    const categoryIds = categories.map(c => c._id);
    const jobCounts = await Job.aggregate([
      { $match: { categoryId: { $in: categoryIds }, status: 'published' } },
      { $group: { _id: '$categoryId', count: { $sum: 1 } } },
    ]);

    const countMap = {};
    jobCounts.forEach(jc => {
      countMap[jc._id.toString()] = jc.count;
    });

    return categories.map(cat => ({
      ...cat,
      jobsCount: countMap[cat._id.toString()] || 0,
    }));
  }

  async incrementJobsCount(categoryId) {
    const Category = require('../models').Category;
    return Category.findByIdAndUpdate(categoryId, { $inc: { jobsCount: 1 } });
  }

  async decrementJobsCount(categoryId) {
    const Category = require('../models').Category;
    return Category.findByIdAndUpdate(categoryId, { $inc: { jobsCount: -1 } });
  }
}

module.exports = new CategoryService();