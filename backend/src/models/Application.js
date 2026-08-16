const mongoose = require('mongoose');
const { APPLICATION_STATUS } = require('../constants');

const applicationSchema = new mongoose.Schema(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: [true, 'Job is required'],
    },
    applicantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Applicant is required'],
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company is required'],
    },
    status: {
      type: String,
      enum: Object.values(APPLICATION_STATUS),
      default: APPLICATION_STATUS.PENDING,
      required: true,
    },
    coverLetter: {
      type: String,
      maxlength: [2000, 'Cover letter cannot exceed 2000 characters'],
      default: '',
    },
    resume: {
      type: String,
      default: null,
    },
    portfolio: {
      type: String,
      default: '',
    },
    expectedSalary: {
      type: Number,
      min: [0, 'Expected salary cannot be negative'],
      default: null,
    },
    availabilityDate: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
      default: '',
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    interviewDetails: {
      date: Date,
      time: String,
      location: String,
      meetingLink: String,
      type: {
        type: String,
        enum: ['phone', 'video', 'in_person'],
        default: 'video',
      },
      notes: String,
    },
    offerDetails: {
      salary: Number,
      currency: String,
      startDate: Date,
      benefits: String,
      notes: String,
    },
    rejectionReason: {
      type: String,
      maxlength: [500, 'Rejection reason cannot exceed 500 characters'],
      default: '',
    },
    withdrawalReason: {
      type: String,
      maxlength: [500, 'Withdrawal reason cannot exceed 500 characters'],
      default: '',
    },
    statusHistory: [{
      status: {
        type: String,
        enum: Object.values(APPLICATION_STATUS),
        required: true,
      },
      changedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      changedAt: {
        type: Date,
        default: Date.now,
      },
      notes: String,
    }],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

applicationSchema.index({ jobId: 1, applicantId: 1 }, { unique: true });
applicationSchema.index({ jobId: 1, status: 1 });
applicationSchema.index({ applicantId: 1, status: 1 });
applicationSchema.index({ companyId: 1, status: 1 });
applicationSchema.index({ reviewedBy: 1 });
applicationSchema.index({ status: 1, createdAt: -1 });
applicationSchema.index({ createdAt: -1 });
applicationSchema.index({ reviewedAt: 1 });
applicationSchema.index({ 'statusHistory.status': 1, 'statusHistory.changedAt': -1 });

applicationSchema.virtual('job', {
  ref: 'Job',
  localField: 'jobId',
  foreignField: '_id',
  justOne: true,
});

applicationSchema.virtual('applicant', {
  ref: 'User',
  localField: 'applicantId',
  foreignField: '_id',
  justOne: true,
});

applicationSchema.virtual('company', {
  ref: 'Company',
  localField: 'companyId',
  foreignField: '_id',
  justOne: true,
});

applicationSchema.virtual('reviewer', {
  ref: 'User',
  localField: 'reviewedBy',
  foreignField: '_id',
  justOne: true,
});

applicationSchema.pre('save', function (next) {
  if (this.isNew) {
    this.statusHistory.push({
      status: this.status,
      changedBy: this.applicantId,
      changedAt: new Date(),
      notes: 'Application submitted',
    });
  } else if (this.isModified('status')) {
    this.statusHistory.push({
      status: this.status,
      changedBy: this.reviewedBy,
      changedAt: new Date(),
      notes: `Status changed to ${this.status}`,
    });
  }
 
});

applicationSchema.methods.updateStatus = async function (newStatus, reviewedBy, notes = '') {
  this.status = newStatus;
  this.reviewedBy = reviewedBy;
  this.reviewedAt = new Date();
  
  if (notes) {
    this.statusHistory[this.statusHistory.length - 1].notes = notes;
  }
  
  return this.save();
};

applicationSchema.methods.scheduleInterview = async function (details) {
  this.status = APPLICATION_STATUS.INTERVIEW_SCHEDULED;
  this.interviewDetails = details;
  this.reviewedAt = new Date();
  return this.save();
};

applicationSchema.methods.makeOffer = async function (details) {
  this.status = APPLICATION_STATUS.OFFERED;
  this.offerDetails = details;
  this.reviewedAt = new Date();
  return this.save();
};

applicationSchema.methods.acceptOffer = async function () {
  this.status = APPLICATION_STATUS.ACCEPTED;
  return this.save();
};

applicationSchema.methods.reject = async function (reason, reviewedBy) {
  this.status = APPLICATION_STATUS.REJECTED;
  this.rejectionReason = reason;
  this.reviewedBy = reviewedBy;
  this.reviewedAt = new Date();
  return this.save();
};

applicationSchema.methods.withdraw = async function (reason) {
  this.status = APPLICATION_STATUS.WITHDRAWN;
  this.withdrawalReason = reason;
  return this.save();
};

module.exports = mongoose.model('Application', applicationSchema);