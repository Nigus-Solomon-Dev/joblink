const mongoose = require('mongoose');
const { slugify } = require('../utils/helpers');

const skillSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Skill name is required'],
      unique: true,
      trim: true,
      maxlength: [50, 'Skill name cannot exceed 50 characters'],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
    category: {
      type: String,
      trim: true,
      maxlength: [50, 'Category cannot exceed 50 characters'],
      default: '',
    },
    description: {
      type: String,
      maxlength: [200, 'Description cannot exceed 200 characters'],
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    jobsCount: {
      type: Number,
      default: 0,
    },
    usersCount: {
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

skillSchema.index({ slug: 1 }, { unique: true });
skillSchema.index({ category: 1 });
skillSchema.index({ isActive: 1, name: 1 });
skillSchema.index({ name: 'text', description: 'text' });

skillSchema.virtual('jobs', {
  ref: 'Job',
  localField: '_id',
  foreignField: 'skills',
});

skillSchema.virtual('users', {
  ref: 'User',
  localField: '_id',
  foreignField: 'skills',
});

skillSchema.pre('validate', function (next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = slugify(this.name);
  }
  next();
});

skillSchema.pre('save', async function (next) {
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
  next();
});

skillSchema.methods.incrementJobsCount = async function () {
  return this.updateOne({ $inc: { jobsCount: 1 } });
};

skillSchema.methods.decrementJobsCount = async function () {
  return this.updateOne({ $inc: { jobsCount: -1 } });
};

skillSchema.methods.incrementUsersCount = async function () {
  return this.updateOne({ $inc: { usersCount: 1 } });
};

skillSchema.methods.decrementUsersCount = async function () {
  return this.updateOne({ $inc: { usersCount: -1 } });
};

module.exports = mongoose.model('Skill', skillSchema);