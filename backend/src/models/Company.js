const mongoose = require('mongoose');
const { slugify } = require('../utils/helpers');

const companySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
      maxlength: [100, 'Company name cannot exceed 100 characters'],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Company description is required'],
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    logo: {
      type: String,
      default: null,
    },
    coverImage: {
      type: String,
      default: null,
    },
    website: {
      type: String,
      trim: true,
      match: [/^https?:\/\/.+/, 'Please provide a valid URL'],
      default: '',
    },
    industry: {
      type: String,
      trim: true,
      maxlength: [100, 'Industry cannot exceed 100 characters'],
      default: '',
    },
    size: {
      type: String,
      enum: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'],
      default: '1-10',
    },
    location: {
      type: String,
      trim: true,
      maxlength: [100, 'Location cannot exceed 100 characters'],
      default: '',
    },
    foundedYear: {
      type: Number,
      min: [1900, 'Invalid year'],
      max: [new Date().getFullYear(), 'Invalid year'],
      default: null,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationDocuments: [{
      type: String,
    }],
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      role: {
        type: String,
        enum: ['owner', 'admin', 'recruiter', 'viewer'],
        default: 'viewer',
      },
      joinedAt: {
        type: Date,
        default: Date.now,
      },
    }],
    socialLinks: {
      linkedin: {
        type: String,
        trim: true,
        match: [/^https?:\/\/(www\.)?linkedin\.com\/.*$|^[a-zA-Z0-9](?:[a-zA-Z0-9\-]{2,})$/, 'Please provide a valid LinkedIn URL'],
        default: '',
      },
      twitter: {
        type: String,
        trim: true,
        match: [/^https?:\/\/(www\.)?(twitter\.com|x\.com)\/.*/, 'Please provide a valid Twitter/X URL'],
        default: '',
      },
      facebook: {
        type: String,
        trim: true,
        match: [/^https?:\/\/(www\.)?facebook\.com\/.*/, 'Please provide a valid Facebook URL'],
        default: '',
      },
    },
    benefits: [{
      type: String,
      trim: true,
    }],
    culture: {
      type: String,
      maxlength: [1000, 'Culture description cannot exceed 1000 characters'],
      default: '',
    },
    viewsCount: {
      type: Number,
      default: 0,
    },
    jobsCount: {
      type: Number,
      default: 0,
    },
    followersCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

companySchema.index({ name: 'text', description: 'text', industry: 'text' });
companySchema.index({ slug: 1 }, { unique: true });
companySchema.index({ ownerId: 1 });
companySchema.index({ industry: 1 });
companySchema.index({ size: 1 });
companySchema.index({ location: 1 });
companySchema.index({ isVerified: 1 });
companySchema.index({ createdAt: -1 });

companySchema.virtual('jobs', {
  ref: 'Job',
  localField: '_id',
  foreignField: 'companyId',
});

companySchema.virtual('openJobsCount', {
  ref: 'Job',
  localField: '_id',
  foreignField: 'companyId',
  count: true,
  match: { status: 'published' },
});

companySchema.pre('validate', function (next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = slugify(this.name);
  }
  next();
});

companySchema.pre('save', async function () {
  if (this.isModified('name') || this.isModified('slug')) {
    const baseSlug = this.slug || slugify(this.name);
    let uniqueSlug = baseSlug;
    let counter = 1;
    
    while (await this.constructor.findOne({ slug: uniqueSlug, _id: { $ne: this._id } })) {
      uniqueSlug = `${baseSlug}-${counter}`;
      counter++;
    }
    this.slug = uniqueSlug;
  }
});

companySchema.methods.incrementViews = async function () {
  return this.updateOne({ $inc: { viewsCount: 1 } });
};

companySchema.methods.incrementJobsCount = async function () {
  return this.updateOne({ $inc: { jobsCount: 1 } });
};

companySchema.methods.decrementJobsCount = async function () {
  return this.updateOne({ $inc: { jobsCount: -1 } });
};

companySchema.methods.toPublicJSON = function () {
  const obj = this.toObject();
  delete obj.verificationDocuments;
  return obj;
};

module.exports = mongoose.model('Company', companySchema);