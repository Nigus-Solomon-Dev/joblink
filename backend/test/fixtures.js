const mongoose = require('mongoose');
const User = require('../src/models/User');
const Company = require('../src/models/Company');
const Job = require('../src/models/Job');
const Application = require('../src/models/Application');
const Category = require('../src/models/Category');
const Skill = require('../src/models/Skill');
const SavedJob = require('../src/models/SavedJob');

const mockUser = {
  name: 'Test User',
  email: 'test@test.com',
  password: 'Password123!',
  role: 'job_seeker',
  status: 'active',
  emailVerified: true,
};

const mockEmployer = {
  name: 'Test Employer',
  email: 'employer@test.com',
  password: 'Password123!',
  role: 'employer',
  status: 'active',
  emailVerified: true,
};

const mockCompany = {
  name: 'Test Company',
  slug: 'test-company',
  email: 'company@test.com',
  location: 'Addis Ababa',
  size: 'medium',
  industry: 'Technology',
  website: 'https://test.com',
  description: 'Test company description',
  ownerId: null,
  isVerified: true,
  subscription: {
    plan: 'pro',
    status: 'active',
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  },
};

const mockCategory = {
  name: 'Software Engineering',
  slug: 'software-engineering',
  description: 'Software development jobs',
};

const mockSkill = {
  name: 'JavaScript',
  slug: 'javascript',
  category: null,
};

const mockJob = {
  title: 'Software Engineer',
  slug: 'software-engineer',
  description: 'Test job description',
  requirements: 'JavaScript, Node.js',
  responsibilities: 'Build software',
  type: 'full_time',
  status: 'published',
  experienceLevel: 'mid',
  salaryMin: 10000,
  salaryMax: 30000,
  salaryCurrency: 'ETB',
  salaryPeriod: 'monthly',
  location: 'Addis Ababa',
  isRemote: false,
  categoryId: null,
  skills: [],
  companyId: null,
  postedById: null,
  viewsCount: 100,
  applicationsCount: 10,
  savesCount: 20,
  publishedAt: new Date(),
  expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
};

const mockApplication = {
  jobId: null,
  applicantId: null,
  companyId: null,
  status: 'pending',
  coverLetter: 'Test cover letter',
};

const createTestUser = async (overrides = {}) => {
  const userData = { ...mockUser, ...overrides };
  const user = new User(userData);
  await user.save();
  return user;
};

const createTestEmployer = async (overrides = {}) => {
  const userData = { ...mockEmployer, ...overrides, role: 'employer' };
  const user = new User(userData);
  await user.save();
  return user;
};

const createTestCompany = async (overrides = {}) => {
  const companyData = { ...mockCompany, ...overrides };
  if (companyData.ownerId && typeof companyData.ownerId === 'string') {
    companyData.ownerId = mongoose.Types.ObjectId(companyData.ownerId);
  }
  const company = new Company(companyData);
  await company.save();
  return company;
};

const createTestCategory = async (overrides = {}) => {
  const categoryData = { ...mockCategory, ...overrides };
  const category = new Category(categoryData);
  await category.save();
  return category;
};

const createTestSkill = async (overrides = {}) => {
  const skillData = { ...mockSkill, ...overrides };
  const skill = new Skill(skillData);
  await skill.save();
  return skill;
};

const createTestJob = async (overrides = {}) => {
  const jobData = { ...mockJob, ...overrides };
  jobData.categoryId = jobData.categoryId || (await createTestCategory())._id;
  if (jobData.companyId && typeof jobData.companyId === 'string') {
    jobData.companyId = mongoose.Types.ObjectId(jobData.companyId);
  }
  jobData.postedById = jobData.postedById || (await createTestEmployer())._id;
  jobData.skills = jobData.skills || [];
  const job = new Job(jobData);
  await job.save();
  return job;
};

const createTestApplication = async (overrides = {}) => {
  const appData = { ...mockApplication, ...overrides };
  if (appData.jobId && typeof appData.jobId === 'string') {
    appData.jobId = mongoose.Types.ObjectId(appData.jobId);
  }
  if (appData.applicantId && typeof appData.applicantId === 'string') {
    appData.applicantId = mongoose.Types.ObjectId(appData.applicantId);
  }
  if (appData.companyId && typeof appData.companyId === 'string') {
    appData.companyId = mongoose.Types.ObjectId(appData.companyId);
  }
  const app = new Application(appData);
  await app.save();
  return app;
};

const createTestSavedJob = async (userId = null, jobId = null) => {
  const user = userId || (await createTestUser())._id;
  const job = jobId || (await createTestJob())._id;
  
  const savedJob = new SavedJob({
    userId: typeof user === 'string' ? mongoose.Types.ObjectId(user) : user,
    jobId: typeof job === 'string' ? mongoose.Types.ObjectId(job) : job,
  });
  await savedJob.save();
  return savedJob;
};

module.exports = {
  mockUser,
  mockEmployer,
  mockCompany,
  mockCategory,
  mockSkill,
  mockJob,
  mockApplication,
  createTestUser,
  createTestEmployer,
  createTestCompany,
  createTestCategory,
  createTestSkill,
  createTestJob,
  createTestApplication,
  createTestSavedJob,
};