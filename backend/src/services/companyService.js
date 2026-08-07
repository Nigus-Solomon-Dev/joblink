const { AppError, NotFoundError } = require('../utils/errors');
const { paginate } = require('../utils/helpers');

class CompanyService {
  async createCompany(ownerId, companyData) {
    const Company = require('../models').Company;
    const User = require('../models').User;

    const existingCompany = await Company.findOne({ ownerId });
    if (existingCompany) {
      throw new AppError('You already have a company. Each user can only own one company.', 400);
    }

    const company = await Company.create({
      ...companyData,
      ownerId,
      members: [{ userId: ownerId, role: 'owner' }],
    });

    await User.findByIdAndUpdate(ownerId, { role: 'employer' });

    return company.toPublicJSON();
  }

  async getCompanyById(companyId) {
    const Company = require('../models').Company;
    const company = await Company.findById(companyId)
      .populate('ownerId', 'name email avatar')
      .populate('members.userId', 'name email avatar role');

    if (!company) {
      throw new NotFoundError('Company not found');
    }

    return company;
  }

  async getPublicCompany(companyId) {
    const Company = require('../models').Company;
    const company = await Company.findById(companyId)
      .populate('ownerId', 'name avatar')
      .select('-verificationDocuments -members');

    if (!company) {
      throw new NotFoundError('Company not found');
    }

    await company.incrementViews();

    return company.toPublicJSON();
  }

  async getCompanyBySlug(slug) {
    const Company = require('../models').Company;
    const company = await Company.findOne({ slug })
      .populate('ownerId', 'name email avatar')
      .populate('members.userId', 'name email avatar role');

    if (!company) {
      throw new NotFoundError('Company not found');
    }

    return company;
  }

  async updateCompany(companyId, userId, updateData, isAdmin = false) {
    const Company = require('../models').Company;
    const company = await Company.findById(companyId);

    if (!company) {
      throw new NotFoundError('Company not found');
    }

    const isOwner = company.ownerId.toString() === userId.toString();
    const isMember = company.members.some(m => m.userId.toString() === userId.toString() && ['owner', 'admin'].includes(m.role));

    if (!isOwner && !isMember && !isAdmin) {
      throw new AppError('You are not authorized to update this company', 403);
    }

    const allowedFields = ['description', 'website', 'industry', 'size', 'location', 'foundedYear', 'socialLinks', 'benefits', 'culture'];
    const adminFields = ['isVerified', 'verificationDocuments'];
    const ownerFields = [...allowedFields, 'name'];

    const allowed = isAdmin ? [...ownerFields, ...adminFields] : (isOwner ? ownerFields : allowedFields);

    const updates = {};
    Object.keys(updateData).forEach(key => {
      if (allowed.includes(key)) {
        updates[key] = updateData[key];
      }
    });

    if (updates.name && updates.name !== company.name) {
      const baseSlug = require('../utils/helpers').slugify(updates.name);
      let uniqueSlug = baseSlug;
      let counter = 1;
      while (await Company.findOne({ slug: uniqueSlug, _id: { $ne: companyId } })) {
        uniqueSlug = `${baseSlug}-${counter}`;
        counter++;
      }
      updates.slug = uniqueSlug;
    }

    const updatedCompany = await Company.findByIdAndUpdate(companyId, updates, {
      new: true,
      runValidators: true,
    });

    return updatedCompany.toPublicJSON();
  }

  async deleteCompany(companyId, userId, isAdmin = false) {
    const Company = require('../models').Company;
    const Job = require('../models').Job;
    const company = await Company.findById(companyId);

    if (!company) {
      throw new NotFoundError('Company not found');
    }

    const isOwner = company.ownerId.toString() === userId.toString();

    if (!isOwner && !isAdmin) {
      throw new AppError('You are not authorized to delete this company', 403);
    }

    await Job.deleteMany({ companyId });
    await Company.findByIdAndDelete(companyId);

    return true;
  }

  async getCompanies(filters = {}, options = {}) {
    const Company = require('../models').Company;

    const { page = 1, limit = 20, sort = '-createdAt' } = options;
    const { industry, size, location, isVerified, search, ownerId } = filters;

    const query = {};

    if (industry) query.industry = industry;
    if (size) query.size = size;
    if (location) query.location = { $regex: location, $options: 'i' };
    if (isVerified !== undefined) query.isVerified = isVerified;
    if (ownerId) query.ownerId = ownerId;
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { industry: { $regex: search, $options: 'i' } },
      ];
    }

    const pagination = paginate(page, limit, await Company.countDocuments(query));

    const companies = await Company.find(query)
      .populate('ownerId', 'name avatar')
      .sort(sort)
      .skip(pagination.skip)
      .limit(pagination.limit)
      .lean();

    return {
      data: companies.map(c => c.toPublicJSON ? c.toPublicJSON() : c),
      meta: pagination,
    };
  }

  async searchCompanies(searchTerm, options = {}) {
    const Company = require('../models').Company;

    const { page = 1, limit = 20 } = options;

    const query = {
      $or: [
        { name: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } },
        { industry: { $regex: searchTerm, $options: 'i' } },
        { location: { $regex: searchTerm, $options: 'i' } },
      ],
      isVerified: true,
    };

    const pagination = paginate(page, limit, await Company.countDocuments(query));

    const companies = await Company.find(query)
      .select('name slug logo description industry size location isVerified')
      .sort('-createdAt')
      .skip(pagination.skip)
      .limit(pagination.limit)
      .lean();

    return {
      data: companies,
      meta: pagination,
    };
  }

  async getCompanyStats(companyId) {
    const Company = require('../models').Company;
    const Job = require('../models').Job;
    const Application = require('../models').Application;

    const company = await Company.findById(companyId);
    if (!company) {
      throw new NotFoundError('Company not found');
    }

    const [jobsCount, openJobsCount, applicationsCount, viewsCount] = await Promise.all([
      Job.countDocuments({ companyId }),
      Job.countDocuments({ companyId, status: 'published' }),
      Application.countDocuments({ companyId }),
      company.viewsCount,
    ]);

    const jobsByStatus = await Job.aggregate([
      { $match: { companyId: company._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const applicationsByStatus = await Application.aggregate([
      { $match: { companyId: company._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    return {
      viewsCount,
      jobsCount,
      openJobsCount,
      applicationsCount,
      jobsByStatus: jobsByStatus.reduce((acc, item) => ({ ...acc, [item._id]: item.count }), {}),
      applicationsByStatus: applicationsByStatus.reduce((acc, item) => ({ ...acc, [item._id]: item.count }), {}),
    };
  }

  async addMember(companyId, userId, role = 'viewer', addedBy) {
    const Company = require('../models').Company;
    const User = require('../models').User;

    const company = await Company.findById(companyId);
    if (!company) {
      throw new NotFoundError('Company not found');
    }

    const isOwner = company.ownerId.toString() === addedBy.toString();
    const isAdmin = company.members.some(m => m.userId.toString() === addedBy.toString() && m.role === 'admin');

    if (!isOwner && !isAdmin) {
      throw new AppError('You are not authorized to add members', 403);
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const existingMember = company.members.find(m => m.userId.toString() === userId.toString());
    if (existingMember) {
      throw new AppError('User is already a member of this company', 400);
    }

    company.members.push({ userId, role, joinedAt: new Date() });
    await company.save();

    return company.toPublicJSON();
  }

  async removeMember(companyId, memberId, removedBy) {
    const Company = require('../models').Company;
    const company = await Company.findById(companyId);
    if (!company) {
      throw new NotFoundError('Company not found');
    }

    const isOwner = company.ownerId.toString() === removedBy.toString();
    const isSelfRemoval = memberId.toString() === removedBy.toString();

    if (!isOwner && !isSelfRemoval) {
      throw new AppError('You are not authorized to remove this member', 403);
    }

    if (memberId.toString() === company.ownerId.toString()) {
      throw new AppError('Cannot remove the company owner', 400);
    }

    company.members = company.members.filter(m => m.userId.toString() !== memberId.toString());
    await company.save();

    return company.toPublicJSON();
  }

  async updateMemberRole(companyId, memberId, role, updatedBy) {
    const Company = require('../models').Company;
    const company = await Company.findById(companyId);
    if (!company) {
      throw new NotFoundError('Company not found');
    }

    const isOwner = company.ownerId.toString() === updatedBy.toString();
    if (!isOwner) {
      throw new AppError('Only the owner can update member roles', 403);
    }

    if (memberId.toString() === company.ownerId.toString()) {
      throw new AppError('Cannot change the owner role', 400);
    }

    const member = company.members.find(m => m.userId.toString() === memberId.toString());
    if (!member) {
      throw new NotFoundError('Member not found');
    }

    member.role = role;
    await company.save();

    return company.toPublicJSON();
  }

  async getMyCompanies(userId) {
    const Company = require('../models').Company;
    const companies = await Company.find({ ownerId: userId })
      .populate('ownerId', 'name avatar')
      .lean();

    return companies.map(c => c.toPublicJSON ? c.toPublicJSON() : c);
  }
}

module.exports = new CompanyService();