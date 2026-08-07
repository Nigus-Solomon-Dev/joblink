const { paginate } = require('../utils/helpers');
const { JOB_STATUS } = require('../constants');

class SearchService {
  async searchJobs(filters = {}, options = {}) {
    const Job = require('../models').Job;

    const { page = 1, limit = 20, sort = 'relevance' } = options;
    const { 
      query, categoryId, location, type, experienceLevel, 
      salaryMin, salaryMax, isRemote, companyId, featured, 
      skills, postedWithin, companySize, industry,
      workArrangement
    } = filters;

    const queryObj = {
      status: JOB_STATUS.PUBLISHED,
    };

    let textSearch = false;
    if (query) {
      queryObj.$text = { $search: query };
      textSearch = true;
    }
    
    if (categoryId) queryObj.categoryId = categoryId;
    if (location) queryObj.location = { $regex: location, $options: 'i' };
    if (type) queryObj.type = type;
    if (experienceLevel) queryObj.experienceLevel = experienceLevel;
    if (isRemote !== undefined) queryObj.isRemote = isRemote === 'true';
    if (companyId) queryObj.companyId = companyId;
    if (featured !== undefined) queryObj.featured = featured === 'true';
    if (skills && skills.length > 0) queryObj.skills = { $in: skills };
    if (workArrangement) {
      if (workArrangement === 'remote') {
        queryObj.isRemote = true;
      } else if (workArrangement === 'hybrid') {
        queryObj.remoteType = 'hybrid';
      } else if (workArrangement === 'onsite') {
        queryObj.isRemote = false;
        queryObj.remoteType = { $ne: 'fully_remote' };
      }
    }

    if (postedWithin) {
      const days = parseInt(postedWithin);
      if (!isNaN(days)) {
        queryObj.publishedAt = { $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) };
      }
    }

    if (salaryMin || salaryMax) {
      queryObj.$and = [];
      if (salaryMin) {
        queryObj.$and.push({ 
          $or: [
            { salaryMax: { $gte: salaryMin } }, 
            { salaryMin: { $gte: salaryMin } }
          ] 
        });
      }
      if (salaryMax) {
        queryObj.$and.push({ 
          $or: [
            { salaryMin: { $lte: salaryMax } }, 
            { salaryMax: { $lte: salaryMax } }
          ] 
        });
      }
      if (queryObj.$and.length === 0) delete queryObj.$and;
    }

    if (companySize) {
      const Company = require('../models').Company;
      const companies = await Company.find({ size: companySize }).select('_id');
      queryObj.companyId = { $in: companies.map(c => c._id) };
    }

    if (industry) {
      const Company = require('../models').Company;
      const companies = await Company.find({ industry: { $regex: industry, $options: 'i' } }).select('_id');
      queryObj.companyId = queryObj.companyId 
        ? { $in: queryObj.companyId.$in.filter(id => companies.some(c => c._id.equals(id))) }
        : { $in: companies.map(c => c._id) };
    }

    const pagination = paginate(page, limit, await Job.countDocuments(queryObj));

    let sortObj = {};
    switch (sort) {
      case 'newest': sortObj = { publishedAt: -1 }; break;
      case 'oldest': sortObj = { publishedAt: 1 }; break;
      case 'salary_high': sortObj = { salaryMax: -1 }; break;
      case 'salary_low': sortObj = { salaryMin: 1 }; break;
      case 'most_viewed': sortObj = { viewsCount: -1 }; break;
      case 'most_applications': sortObj = { applicationsCount: -1 }; break;
      case 'relevance':
      default: 
        if (textSearch) {
          sortObj = { score: { $meta: 'textScore' }, publishedAt: -1 };
        } else {
          sortObj = { publishedAt: -1 };
        }
    }

    let jobsQuery = Job.find(queryObj)
      .populate('companyId', 'name slug logo isVerified size industry')
      .populate('categoryId', 'name slug')
      .populate('skills', 'name slug')
      .sort(sortObj)
      .skip(pagination.skip)
      .limit(pagination.limit);

    if (textSearch) {
      jobsQuery = jobsQuery.select({ score: { $meta: 'textScore' } });
    }

    const jobs = await jobsQuery.lean();

    return {
      data: jobs,
      meta: pagination,
    };
  }

  async getFacets(filters = {}) {
    const Job = require('../models').Job;
    const Company = require('../models').Company;
    const Category = require('../models').Category;
    const Skill = require('../models').Skill;

    const baseQuery = { status: JOB_STATUS.PUBLISHED };
    
    if (filters.query) baseQuery.$text = { $search: filters.query };
    if (filters.categoryId) baseQuery.categoryId = filters.categoryId;
    if (filters.location) baseQuery.location = { $regex: filters.location, $options: 'i' };
    if (filters.type) baseQuery.type = filters.type;
    if (filters.experienceLevel) baseQuery.experienceLevel = filters.experienceLevel;
    if (filters.isRemote !== undefined) baseQuery.isRemote = filters.isRemote === 'true';
    if (filters.featured !== undefined) baseQuery.featured = filters.featured === 'true';
    if (filters.skills && filters.skills.length > 0) baseQuery.skills = { $in: filters.skills };
    if (filters.companySize) {
      const companies = await Company.find({ size: filters.companySize }).select('_id');
      baseQuery.companyId = { $in: companies.map(c => c._id) };
    }
    if (filters.industry) {
      const companies = await Company.find({ industry: { $regex: filters.industry, $options: 'i' } }).select('_id');
      baseQuery.companyId = { $in: companies.map(c => c._id) };
    }

    const [
      categories,
      types,
      experienceLevels,
      locations,
      companies,
      skills,
      salaryRanges,
      remoteOptions,
      workArrangements,
    ] = await Promise.all([
      Job.aggregate([
        { $match: baseQuery },
        { $group: { _id: '$categoryId', count: { $sum: 1 } } },
        { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'category' } },
        { $unwind: '$category' },
        { $project: { _id: 1, count: 1, name: '$category.name', slug: '$category.slug' } },
        { $sort: { count: -1 } },
      ]),
      Job.aggregate([
        { $match: baseQuery },
        { $group: { _id: '$type', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Job.aggregate([
        { $match: baseQuery },
        { $group: { _id: '$experienceLevel', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Job.aggregate([
        { $match: { ...baseQuery, location: { $ne: '', $exists: true } } },
        { $group: { _id: '$location', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 20 },
      ]),
      Job.aggregate([
        { $match: baseQuery },
        { $lookup: { from: 'companies', localField: 'companyId', foreignField: '_id', as: 'company' } },
        { $unwind: '$company' },
        { $group: { _id: '$companyId', count: { $sum: 1 }, name: { $first: '$company.name' }, slug: { $first: '$company.slug' }, logo: { $first: '$company.logo' }, isVerified: { $first: '$company.isVerified' } } },
        { $sort: { count: -1 } },
        { $limit: 20 },
      ]),
      Job.aggregate([
        { $match: baseQuery },
        { $unwind: '$skills' },
        { $group: { _id: '$skills', count: { $sum: 1 } } },
        { $lookup: { from: 'skills', localField: '_id', foreignField: '_id', as: 'skill' } },
        { $unwind: '$skill' },
        { $project: { _id: 1, count: 1, name: '$skill.name', slug: '$skill.slug', category: '$skill.category' } },
        { $sort: { count: -1 } },
        { $limit: 30 },
      ]),
      Job.aggregate([
        { $match: { ...baseQuery, salaryMin: { $exists: true, $ne: null }, salaryMax: { $exists: true, $ne: null } } },
        { $bucket: {
          groupBy: '$salaryMax',
          boundaries: [0, 5000, 10000, 20000, 30000, 50000, 100000, Infinity],
          default: '100000+',
          output: { count: { $sum: 1 } },
        }},
      ]),
      Job.aggregate([
        { $match: baseQuery },
        { $group: { _id: '$isRemote', count: { $sum: 1 } } },
      ]),
      Job.aggregate([
        { $match: baseQuery },
        { $group: { _id: '$remoteType', count: { $sum: 1 } } },
      ]),
    ]);

    return {
      categories: categories.map(c => ({ id: c._id, name: c.name, slug: c.slug, count: c.count })),
      types: types.map(t => ({ type: t._id, count: t.count })),
      experienceLevels: experienceLevels.map(e => ({ level: e._id, count: e.count })),
      locations: locations.map(l => ({ location: l._id, count: l.count })),
      companies: companies.map(c => ({ id: c._id, name: c.name, slug: c.slug, logo: c.logo, isVerified: c.isVerified, count: c.count })),
      skills: skills.map(s => ({ id: s._id, name: s.name, slug: s.slug, category: s.category, count: s.count })),
      salaryRanges: salaryRanges.map(s => ({ range: s._id, count: s.count })),
      remoteOptions: remoteOptions.map(r => ({ isRemote: r._id, count: r.count })),
      workArrangements: workArrangements.map(w => ({ type: w._id, count: w.count })),
    };
  }

  async getSuggestions(query, limit = 10) {
    const Job = require('../models').Job;
    const Category = require('../models').Category;
    const Skill = require('../models').Skill;
    const Company = require('../models').Company;

    if (!query || query.length < 2) {
      return { jobs: [], categories: [], skills: [], companies: [] };
    }

    const searchRegex = { $regex: query, $options: 'i' };

    const [jobs, categories, skills, companies] = await Promise.all([
      Job.find({ 
        status: JOB_STATUS.PUBLISHED,
        $or: [
          { title: searchRegex },
          { description: searchRegex },
        ],
      })
        .select('title slug')
        .limit(limit)
        .lean(),
      Category.find({ 
        isActive: true,
        name: searchRegex,
      })
        .select('name slug')
        .limit(5)
        .lean(),
      Skill.find({ 
        isActive: true,
        name: searchRegex,
      })
        .select('name slug category')
        .limit(5)
        .lean(),
      Company.find({ 
        name: searchRegex,
      })
        .select('name slug logo')
        .limit(5)
        .lean(),
    ]);

    return { jobs, categories, skills, companies };
  }

  async saveSearch(userId, searchData) {
    const User = require('../models').User;
    const SavedSearch = require('../models').SavedSearch;

    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (!user.savedSearches) {
      user.savedSearches = [];
    }

    const search = {
      name: searchData.name || 'Untitled Search',
      filters: searchData.filters,
      createdAt: new Date(),
    };

    user.savedSearches.push(search);
    await user.save();

    return search;
  }

  async getSavedSearches(userId) {
    const User = require('../models').User;
    const user = await User.findById(userId).select('savedSearches');
    
    if (!user) {
      throw new Error('User not found');
    }

    return user.savedSearches || [];
  }

  async deleteSavedSearch(userId, searchIndex) {
    const User = require('../models').User;
    const user = await User.findById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }

    if (!user.savedSearches || searchIndex >= user.savedSearches.length) {
      throw new Error('Saved search not found');
    }

    user.savedSearches.splice(searchIndex, 1);
    await user.save();

    return true;
  }

  async getSearchHistory(userId, limit = 20) {
    const User = require('../models').User;
    const user = await User.findById(userId).select('searchHistory');
    
    if (!user) {
      throw new Error('User not found');
    }

    return user.searchHistory?.slice(-limit).reverse() || [];
  }

  async addToSearchHistory(userId, searchQuery) {
    const User = require('../models').User;
    const user = await User.findById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }

    if (!user.searchHistory) {
      user.searchHistory = [];
    }

    user.searchHistory.push({
      query: searchQuery,
      searchedAt: new Date(),
    });

    if (user.searchHistory.length > 50) {
      user.searchHistory = user.searchHistory.slice(-50);
    }

    await user.save();

    return user.searchHistory;
  }
}

module.exports = new SearchService();