const mongoose = require('mongoose');
const { slugify } = require('../utils/helpers');

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      unique: true,
      trim: true,
      maxlength: [50, 'Category name cannot exceed 50 characters'],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      maxlength: [500, 'Description cannot exceed 500 characters'],
      default: '',
    },
    icon: {
      type: String,
      default: '',
    },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },
    order: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    jobsCount: {
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

categorySchema.index({ slug: 1 }, { unique: true });
categorySchema.index({ parentId: 1 });
categorySchema.index({ isActive: 1, order: 1 });
categorySchema.index({ name: 'text', description: 'text' });

categorySchema.virtual('children', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parentId',
});

categorySchema.virtual('jobs', {
  ref: 'Job',
  localField: '_id',
  foreignField: 'categoryId',
});

categorySchema.virtual('activeJobsCount', {
  ref: 'Job',
  localField: '_id',
  foreignField: 'categoryId',
  count: true,
  match: { status: 'published' },
});

categorySchema.pre('validate', function (next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = slugify(this.name);
  }
  next();
});

categorySchema.pre('save', async function (next) {
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

categorySchema.methods.incrementJobsCount = async function () {
  return this.updateOne({ $inc: { jobsCount: 1 } });
};

categorySchema.methods.decrementJobsCount = async function () {
  return this.updateOne({ $inc: { jobsCount: -1 } });
};

module.exports = mongoose.model('Category', categorySchema);