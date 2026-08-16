const mongoose = require('mongoose');
const { slugify } = require('../utils/helpers');
const { JOB_STATUS, JOB_TYPE } = require('../constants');

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
      maxlength: [100, 'Job title cannot exceed 100 characters'],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Job description is required'],
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
    },
    requirements: {
      type: String,
      required: [true, 'Requirements are required'],
      maxlength: [3000, 'Requirements cannot exceed 3000 characters'],
    },
    responsibilities: {
      type: String,
      required: [true, 'Responsibilities are required'],
      maxlength: [3000, 'Responsibilities cannot exceed 3000 characters'],
    },
    benefits: {
      type: String,
      maxlength: [2000, 'Benefits cannot exceed 2000 characters'],
      default: '',
    },
    type: {
      type: String,
      enum: Object.values(JOB_TYPE),
      required: [true, 'Job type is required'],
    },
    status: {
      type: String,
      enum: Object.values(JOB_STATUS),
      default: JOB_STATUS.DRAFT,
      required: true,
    },
    experienceLevel: {
      type: String,
      enum: ['entry', 'junior', 'mid', 'senior', 'lead', 'executive'],
      default: 'mid',
    },
    educationLevel: {
      type: String,
      enum: ['high_school', 'diploma', 'bachelor', 'master', 'phd', 'any'],
      default: 'any',
    },
    salaryMin: {
      type: Number,
      min: [0, 'Salary cannot be negative'],
      default: null,
    },
    salaryMax: {
      type: Number,
      min: [0, 'Salary cannot be negative'],
      default: null,
    },
    salaryCurrency: {
      type: String,
      default: 'ETB',
      uppercase: true,
      maxlength: [3, 'Currency code must be 3 characters'],
    },
    salaryPeriod: {
      type: String,
      enum: ['monthly', 'yearly', 'hourly'],
      default: 'monthly',
    },
    location: {
      type: String,
      trim: true,
      maxlength: [100, 'Location cannot exceed 100 characters'],
      default: '',
    },
    isRemote: {
      type: Boolean,
      default: false,
    },
    remoteType: {
      type: String,
      enum: ['fully_remote', 'hybrid', 'on_site'],
      default: 'on_site',
    },
    applicationDeadline: {
      type: Date,
      default: null,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
    },
    skills: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Skill',
    }],
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company is required'],
    },
    postedById: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Posted by user is required'],
    },
    viewsCount: {
      type: Number,
      default: 0,
    },
    applicationsCount: {
      type: Number,
      default: 0,
    },
    savesCount: {
      type: Number,
      default: 0,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    featuredUntil: {
      type: Date,
      default: null,
    },
    publishedAt: {
      type: Date,
      default: null,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

jobSchema.index({ title: 'text', description: 'text', requirements: 'text', responsibilities: 'text' });
jobSchema.index({ slug: 1 }, { unique: true });
jobSchema.index({ status: 1, publishedAt: -1 });
jobSchema.index({ companyId: 1, status: 1 });
jobSchema.index({ categoryId: 1, status: 1 });
jobSchema.index({ postedById: 1 });
jobSchema.index({ type: 1, status: 1 });
jobSchema.index({ experienceLevel: 1, status: 1 });
jobSchema.index({ location: 1, status: 1 });
jobSchema.index({ isRemote: 1, status: 1 });
jobSchema.index({ salaryMin: 1, salaryMax: 1, status: 1 });
jobSchema.index({ applicationDeadline: 1, status: 1 });
jobSchema.index({ featured: 1, featuredUntil: 1 }, { expireAfterSeconds: 0 });
jobSchema.index({ applicationDeadline: 1 }, { expireAfterSeconds: 0 });

jobSchema.virtual('company', {
  ref: 'Company',
  localField: 'companyId',
  foreignField: '_id',
  justOne: true,
});

jobSchema.virtual('category', {
  ref: 'Category',
  localField: 'categoryId',
  foreignField: '_id',
  justOne: true,
});

jobSchema.virtual('postedBy', {
  ref: 'User',
  localField: 'postedById',
  foreignField: '_id',
  justOne: true,
});

jobSchema.virtual('applications', {
  ref: 'Application',
  localField: '_id',
  foreignField: 'jobId',
});

jobSchema.virtual('salaryRange').get(function () {
  if (this.salaryMin && this.salaryMax) {
    return `${this.salaryCurrency} ${this.salaryMin.toLocaleString()} - ${this.salaryMax.toLocaleString()} / ${this.salaryPeriod}`;
  }
  if (this.salaryMin) {
    return `${this.salaryCurrency} ${this.salaryMin.toLocaleString()}+ / ${this.salaryPeriod}`;
  }
  if (this.salaryMax) {
    return `Up to ${this.salaryCurrency} ${this.salaryMax.toLocaleString()} / ${this.salaryPeriod}`;
  }
  return 'Negotiable';
});

jobSchema.virtual('isExpired').get(function () {
  if (this.applicationDeadline) {
    return new Date() > this.applicationDeadline;
  }
  if (this.expiresAt) {
    return new Date() > this.expiresAt;
  }
  return false;
});

jobSchema.virtual('daysUntilDeadline').get(function () {
  if (!this.applicationDeadline) return null;
  const diff = this.applicationDeadline - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
});

jobSchema.pre('validate', function (next) {
  if (this.isModified('title') && !this.slug) {
    this.slug = slugify(this.title);
  }
  next();
});

jobSchema.pre('save', async function () {
  if (this.isModified('title') || this.isModified('slug')) {
    const baseSlug = this.slug || slugify(this.title);
    let uniqueSlug = baseSlug;
    let counter = 1;
    
    while (await this.constructor.findOne({ slug: uniqueSlug, _id: { $ne: this._id } })) {
      uniqueSlug = `${baseSlug}-${counter}`;
      counter++;
    }
    this.slug = uniqueSlug;
  }
  
  if (this.isModified('status') && this.status === JOB_STATUS.PUBLISHED && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  
  if (this.isModified('status') && this.status === JOB_STATUS.PUBLISHED && !this.expiresAt) {
    this.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  }
});

jobSchema.methods.incrementViews = async function () {
  return this.updateOne({ $inc: { viewsCount: 1 } });
};

jobSchema.methods.incrementApplications = async function () {
  return this.updateOne({ $inc: { applicationsCount: 1 } });
};

jobSchema.methods.decrementApplications = async function () {
  return this.updateOne({ $inc: { applicationsCount: -1 } });
};

jobSchema.methods.incrementSaves = async function () {
  return this.updateOne({ $inc: { savesCount: 1 } });
};

jobSchema.methods.decrementSaves = async function () {
  return this.updateOne({ $inc: { savesCount: -1 } });
};

jobSchema.methods.publish = async function () {
  this.status = JOB_STATUS.PUBLISHED;
  this.publishedAt = new Date();
  this.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  return this.save();
};

jobSchema.methods.close = async function () {
  this.status = JOB_STATUS.CLOSED;
  return this.save();
};

jobSchema.methods.archive = async function () {
  this.status = JOB_STATUS.ARCHIVED;
  return this.save();
};

jobSchema.methods.toPublicJSON = function () {
  const obj = this.toObject();
  return obj;
};

module.exports = mongoose.model('Job', jobSchema);