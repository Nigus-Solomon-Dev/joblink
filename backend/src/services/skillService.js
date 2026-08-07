const { AppError, NotFoundError } = require('../utils/errors');
const { paginate } = require('../utils/helpers');

class SkillService {
  async createSkill(skillData) {
    const Skill = require('../models').Skill;
    
    const existingSkill = await Skill.findOne({ name: skillData.name });
    if (existingSkill) {
      throw new AppError('Skill with this name already exists', 400);
    }

    const skill = await Skill.create(skillData);
    return skill;
  }

  async getSkillById(skillId) {
    const Skill = require('../models').Skill;
    const skill = await Skill.findById(skillId);

    if (!skill) {
      throw new NotFoundError('Skill not found');
    }

    return skill;
  }

  async getSkillBySlug(slug) {
    const Skill = require('../models').Skill;
    const skill = await Skill.findOne({ slug });

    if (!skill) {
      throw new NotFoundError('Skill not found');
    }

    return skill;
  }

  async updateSkill(skillId, updateData) {
    const Skill = require('../models').Skill;
    const skill = await Skill.findById(skillId);

    if (!skill) {
      throw new NotFoundError('Skill not found');
    }

    const allowedFields = ['name', 'description', 'category', 'isActive'];
    const updates = {};
    
    Object.keys(updateData).forEach(key => {
      if (allowedFields.includes(key)) {
        updates[key] = updateData[key];
      }
    });

    if (updates.name && updates.name !== skill.name) {
      const existingSkill = await Skill.findOne({ name: updates.name, _id: { $ne: skillId } });
      if (existingSkill) {
        throw new AppError('Skill with this name already exists', 400);
      }
      
      const baseSlug = require('../utils/helpers').slugify(updates.name);
      let uniqueSlug = baseSlug;
      let counter = 1;
      while (await Skill.findOne({ slug: uniqueSlug, _id: { $ne: skillId } })) {
        uniqueSlug = `${baseSlug}-${counter}`;
        counter++;
      }
      updates.slug = uniqueSlug;
    }

    const updatedSkill = await Skill.findByIdAndUpdate(skillId, updates, {
      new: true,
      runValidators: true,
    });

    return updatedSkill;
  }

  async deleteSkill(skillId) {
    const Skill = require('../models').Skill;
    const Job = require('../models').Job;
    const User = require('../models').User;

    const skill = await Skill.findById(skillId);
    if (!skill) {
      throw new NotFoundError('Skill not found');
    }

    const jobsCount = await Job.countDocuments({ skills: skillId });
    if (jobsCount > 0) {
      throw new AppError('Cannot delete skill with associated jobs. Remove skill from jobs first.', 400);
    }

    const usersCount = await User.countDocuments({ skills: skillId });
    if (usersCount > 0) {
      throw new AppError('Cannot delete skill associated with users. Remove skill from users first.', 400);
    }

    await Skill.findByIdAndDelete(skillId);
    return true;
  }

  async getSkills(filters = {}, options = {}) {
    const Skill = require('../models').Skill;

    const { page = 1, limit = 50, sort = 'name' } = options;
    const { category, isActive, search } = filters;

    const query = {};

    if (category) query.category = category;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const pagination = paginate(page, limit, await Skill.countDocuments(query));

    const skills = await Skill.find(query)
      .sort(sort)
      .skip(pagination.skip)
      .limit(pagination.limit)
      .lean();

    return {
      data: skills,
      meta: pagination,
    };
  }

  async getSkillsByCategory(category) {
    const Skill = require('../models').Skill;
    return Skill.find({ category, isActive: true })
      .sort({ name: 1 })
      .lean();
  }

  async getAllSkillsGroupedByCategory() {
    const Skill = require('../models').Skill;
    
    const skills = await Skill.find({ isActive: true })
      .sort({ category: 1, name: 1 })
      .lean();

    const grouped = {};
    skills.forEach(skill => {
      const cat = skill.category || 'Other';
      if (!grouped[cat]) {
        grouped[cat] = [];
      }
      grouped[cat].push(skill);
    });

    return grouped;
  }

  async searchSkills(searchTerm, options = {}) {
    const Skill = require('../models').Skill;

    const { page = 1, limit = 20 } = options;

    const query = {
      $or: [
        { name: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } },
      ],
      isActive: true,
    };

    const pagination = paginate(page, limit, await Skill.countDocuments(query));

    const skills = await Skill.find(query)
      .select('name slug category jobsCount usersCount')
      .sort('-jobsCount')
      .skip(pagination.skip)
      .limit(pagination.limit)
      .lean();

    return {
      data: skills,
      meta: pagination,
    };
  }

  async getTopSkills(limit = 20) {
    const Skill = require('../models').Skill;
    return Skill.find({ isActive: true })
      .sort({ jobsCount: -1, usersCount: -1 })
      .limit(limit)
      .select('name slug category jobsCount usersCount')
      .lean();
  }

  async incrementJobsCount(skillId) {
    const Skill = require('../models').Skill;
    return Skill.findByIdAndUpdate(skillId, { $inc: { jobsCount: 1 } });
  }

  async decrementJobsCount(skillId) {
    const Skill = require('../models').Skill;
    return Skill.findByIdAndUpdate(skillId, { $inc: { jobsCount: -1 } });
  }

  async incrementUsersCount(skillId) {
    const Skill = require('../models').Skill;
    return Skill.findByIdAndUpdate(skillId, { $inc: { usersCount: 1 } });
  }

  async decrementUsersCount(skillId) {
    const Skill = require('../models').Skill;
    return Skill.findByIdAndUpdate(skillId, { $inc: { usersCount: -1 } });
  }
}

module.exports = new SkillService();