const companyService = require('../services/companyService');
const ApiResponse = require('../utils/apiResponse');
const catchAsync = require('../utils/catchAsync');
const { AppError, NotFoundError } = require('../utils/errors');
const { protect, restrictTo } = require('../middleware/auth');
const upload = require('../middleware/upload');

class CompanyController {
  createCompany = catchAsync(async (req, res, next) => {
    const company = await companyService.createCompany(req.user.id, req.body);
    
    const response = ApiResponse.created({ company }, 'Company created successfully');
    res.status(201).json(response);
  });

  getMyCompanies = catchAsync(async (req, res, next) => {
    const companies = await companyService.getMyCompanies(req.user.id);
    
    const response = ApiResponse.success({ companies }, 'Companies fetched successfully');
    res.status(200).json(response);
  });

  getCompany = catchAsync(async (req, res, next) => {
    const company = await companyService.getPublicCompany(req.params.id);
    
    const response = ApiResponse.success({ company }, 'Company fetched successfully');
    res.status(200).json(response);
  });

  getCompanyBySlug = catchAsync(async (req, res, next) => {
    const company = await companyService.getCompanyBySlug(req.params.slug);
    
    const response = ApiResponse.success({ company }, 'Company fetched successfully');
    res.status(200).json(response);
  });

  updateCompany = catchAsync(async (req, res, next) => {
    const company = await companyService.updateCompany(req.params.id, req.user.id, req.body);
    
    const response = ApiResponse.success({ company }, 'Company updated successfully');
    res.status(200).json(response);
  });

  deleteCompany = catchAsync(async (req, res, next) => {
    await companyService.deleteCompany(req.params.id, req.user.id);
    
    const response = ApiResponse.success(null, 'Company deleted successfully');
    res.status(200).json(response);
  });

  uploadLogo = catchAsync(async (req, res, next) => {
    if (!req.file) {
      throw new AppError('No file uploaded', 400);
    }

    const cloudinary = require('cloudinary').v2;
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'joblink/companies/logos',
          transformation: [
            { width: 400, height: 400, crop: 'fill' },
            { quality: 'auto' },
          ],
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      stream.end(req.file.buffer);
    });

    const company = await companyService.updateCompany(req.params.id, req.user.id, { logo: result.secure_url });
    
    const response = ApiResponse.success({ company }, 'Logo uploaded successfully');
    res.status(200).json(response);
  });

  uploadCoverImage = catchAsync(async (req, res, next) => {
    if (!req.file) {
      throw new AppError('No file uploaded', 400);
    }

    const cloudinary = require('cloudinary').v2;
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'joblink/companies/covers',
          transformation: [
            { width: 1200, height: 400, crop: 'fill' },
            { quality: 'auto' },
          ],
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      stream.end(req.file.buffer);
    });

    const company = await companyService.updateCompany(req.params.id, req.user.id, { coverImage: result.secure_url });
    
    const response = ApiResponse.success({ company }, 'Cover image uploaded successfully');
    res.status(200).json(response);
  });

  getCompanyStats = catchAsync(async (req, res, next) => {
    const stats = await companyService.getCompanyStats(req.params.id);
    
    const response = ApiResponse.success(stats, 'Company stats fetched successfully');
    res.status(200).json(response);
  });

  // Member management
  addMember = catchAsync(async (req, res, next) => {
    const { userId, role } = req.body;
    const company = await companyService.addMember(req.params.id, userId, role, req.user.id);
    
    const response = ApiResponse.success({ company }, 'Member added successfully');
    res.status(200).json(response);
  });

  removeMember = catchAsync(async (req, res, next) => {
    const company = await companyService.removeMember(req.params.id, req.params.memberId, req.user.id);
    
    const response = ApiResponse.success({ company }, 'Member removed successfully');
    res.status(200).json(response);
  });

  updateMemberRole = catchAsync(async (req, res, next) => {
    const { role } = req.body;
    const company = await companyService.updateMemberRole(req.params.id, req.params.memberId, role, req.user.id);
    
    const response = ApiResponse.success({ company }, 'Member role updated successfully');
    res.status(200).json(response);
  });

  // Public routes
  getAllCompanies = catchAsync(async (req, res, next) => {
    const { page, limit, sort, industry, size, location, isVerified, search } = req.query;
    
    const result = await companyService.getCompanies(
      { industry, size, location, isVerified: isVerified === 'true' ? true : isVerified === 'false' ? false : undefined, search },
      { page: parseInt(page) || 1, limit: parseInt(limit) || 20, sort: sort || '-createdAt' }
    );
    
    const response = ApiResponse.success(result.data, 'Companies fetched successfully', 200, result.meta);
    res.status(200).json(response);
  });

  searchCompanies = catchAsync(async (req, res, next) => {
    const { q, page, limit } = req.query;
    
    if (!q || q.trim().length < 2) {
      throw new AppError('Search query must be at least 2 characters', 400);
    }
    
    const result = await companyService.searchCompanies(q.trim(), { 
      page: parseInt(page) || 1, 
      limit: parseInt(limit) || 20 
    });
    
    const response = ApiResponse.success(result.data, 'Companies fetched successfully', 200, result.meta);
    res.status(200).json(response);
  });

  // Admin routes
  adminGetAllCompanies = catchAsync(async (req, res, next) => {
    const { page, limit, sort, industry, size, location, isVerified, search } = req.query;
    
    const result = await companyService.getCompanies(
      { industry, size, location, isVerified: isVerified === 'true' ? true : isVerified === 'false' ? false : undefined, search },
      { page: parseInt(page) || 1, limit: parseInt(limit) || 20, sort: sort || '-createdAt' }
    );
    
    const response = ApiResponse.success(result.data, 'Companies fetched successfully', 200, result.meta);
    res.status(200).json(response);
  });

  adminGetCompany = catchAsync(async (req, res, next) => {
    const company = await companyService.getCompanyById(req.params.id);
    
    const response = ApiResponse.success({ company }, 'Company fetched successfully');
    res.status(200).json(response);
  });

  adminUpdateCompany = catchAsync(async (req, res, next) => {
    const company = await companyService.updateCompany(req.params.id, req.user.id, req.body, true);
    
    const response = ApiResponse.success({ company }, 'Company updated successfully');
    res.status(200).json(response);
  });

  adminDeleteCompany = catchAsync(async (req, res, next) => {
    await companyService.deleteCompany(req.params.id, req.user.id, true);
    
    const response = ApiResponse.success(null, 'Company deleted successfully');
    res.status(200).json(response);
  });

  adminVerifyCompany = catchAsync(async (req, res, next) => {
    const { isVerified } = req.body;
    const company = await companyService.updateCompany(req.params.id, req.user.id, { isVerified }, true);
    
    const response = ApiResponse.success({ company }, `Company ${isVerified ? 'verified' : 'unverified'} successfully`);
    res.status(200).json(response);
  });
}

module.exports = new CompanyController();