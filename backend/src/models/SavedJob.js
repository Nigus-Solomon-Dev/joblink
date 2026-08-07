const mongoose = require('mongoose');

const savedJobSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: [true, 'Job is required'],
    },
    notes: {
      type: String,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
      default: '',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

savedJobSchema.index({ userId: 1, jobId: 1 }, { unique: true });
savedJobSchema.index({ userId: 1, createdAt: -1 });
savedJobSchema.index({ jobId: 1 });

savedJobSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true,
});

savedJobSchema.virtual('job', {
  ref: 'Job',
  localField: 'jobId',
  foreignField: '_id',
  justOne: true,
});

savedJobSchema.statics.isSaved = async function (userId, jobId) {
  const saved = await this.findOne({ userId, jobId });
  return !!saved;
};

savedJobSchema.statics.getSavedJobs = async function (userId, options = {}) {
  const { page = 1, limit = 20, sort = '-createdAt' } = options;
  const skip = (page - 1) * limit;
  
  const [jobs, total] = await Promise.all([
    this.find({ userId })
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate({
        path: 'jobId',
        populate: [
          { path: 'companyId', select: 'name slug logo' },
          { path: 'categoryId', select: 'name slug' },
        ],
      })
      .lean(),
    this.countDocuments({ userId }),
  ]);
  
  return {
    data: jobs.map(j => j.jobId).filter(Boolean),
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1,
    },
  };
};

module.exports = mongoose.model('SavedJob', savedJobSchema);