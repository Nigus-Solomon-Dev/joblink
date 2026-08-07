const { AppError, NotFoundError } = require('../utils/errors');
const { APPLICATION_STATUS, JOB_STATUS } = require('../constants');
const { paginate } = require('../utils/helpers');

class ApplicationService {
  async applyToJob(jobId, applicantId, applicationData) {
    const Job = require('../models').Job;
    const Application = require('../models').Application;
    const Company = require('../models').Company;
    const Notification = require('../models').Notification;

    const job = await Job.findById(jobId).populate('companyId');
    if (!job) {
      throw new NotFoundError('Job not found');
    }

    if (job.status !== JOB_STATUS.PUBLISHED) {
      throw new AppError('This job is not accepting applications', 400);
    }

    if (job.applicationDeadline && new Date() > job.applicationDeadline) {
      throw new AppError('Application deadline has passed', 400);
    }

    const existingApplication = await Application.findOne({ jobId, applicantId });
    if (existingApplication) {
      throw new AppError('You have already applied to this job', 400);
    }

    const application = await Application.create({
      jobId,
      applicantId,
      companyId: job.companyId._id,
      coverLetter: applicationData.coverLetter || '',
      resume: applicationData.resume || '',
      portfolio: applicationData.portfolio || '',
      expectedSalary: applicationData.expectedSalary,
      availabilityDate: applicationData.availabilityDate,
    });

    await job.incrementApplications();
    await Notification.create({
      userId: job.postedById,
      type: 'job_application',
      title: 'New Job Application',
      message: `New application received for ${job.title}`,
      data: { jobId: job._id, applicationId: application._id },
      relatedEntity: { entityType: 'application', entityId: application._id },
    });

    return application;
  }

  async getApplicationById(applicationId, userId, isAdmin = false) {
    const Application = require('../models').Application;
    const application = await Application.findById(applicationId)
      .populate('jobId', 'title slug companyId status')
      .populate('applicantId', 'name email avatar phone location skills')
      .populate('companyId', 'name slug logo')
      .populate('reviewedBy', 'name email');

    if (!application) {
      throw new NotFoundError('Application not found');
    }

    const isApplicant = application.applicantId._id.toString() === userId.toString();
    const isEmployer = application.companyId._id.toString() === userId.toString();
    const isReviewer = application.reviewedBy && application.reviewedBy._id.toString() === userId.toString();

    if (!isAdmin && !isApplicant && !isEmployer && !isReviewer) {
      throw new AppError('Not authorized to view this application', 403);
    }

    return application;
  }

  async updateApplicationStatus(applicationId, status, reviewedBy, notes = '') {
    const Application = require('../models').Application;
    const Job = require('../models').Job;
    const Notification = require('../models').Notification;

    const application = await Application.findById(applicationId)
      .populate('jobId')
      .populate('applicantId', 'name email');

    if (!application) {
      throw new NotFoundError('Application not found');
    }

    const validTransitions = {
      [APPLICATION_STATUS.PENDING]: [APPLICATION_STATUS.UNDER_REVIEW, APPLICATION_STATUS.REJECTED, APPLICATION_STATUS.WITHDRAWN],
      [APPLICATION_STATUS.UNDER_REVIEW]: [APPLICATION_STATUS.SHORTLISTED, APPLICATION_STATUS.REJECTED, APPLICATION_STATUS.INTERVIEW_SCHEDULED, APPLICATION_STATUS.WITHDRAWN],
      [APPLICATION_STATUS.SHORTLISTED]: [APPLICATION_STATUS.INTERVIEW_SCHEDULED, APPLICATION_STATUS.REJECTED, APPLICATION_STATUS.WITHDRAWN],
      [APPLICATION_STATUS.INTERVIEW_SCHEDULED]: [APPLICATION_STATUS.INTERVIEWED, APPLICATION_STATUS.REJECTED, APPLICATION_STATUS.WITHDRAWN],
      [APPLICATION_STATUS.INTERVIEWED]: [APPLICATION_STATUS.OFFERED, APPLICATION_STATUS.REJECTED, APPLICATION_STATUS.WITHDRAWN],
      [APPLICATION_STATUS.OFFERED]: [APPLICATION_STATUS.ACCEPTED, APPLICATION_STATUS.REJECTED, APPLICATION_STATUS.WITHDRAWN],
    };

    const currentStatus = application.status;
    if (validTransitions[currentStatus] && !validTransitions[currentStatus].includes(status)) {
      throw new AppError(`Cannot transition from ${currentStatus} to ${status}`, 400);
    }

    application.status = status;
    application.reviewedBy = reviewedBy;
    application.reviewedAt = new Date();
    
    if (notes) {
      application.statusHistory.push({
        status,
        changedBy: reviewedBy,
        changedAt: new Date(),
        notes,
      });
    }

    await application.save();

    await Notification.create({
      userId: application.applicantId._id,
      type: 'application_status_update',
      title: 'Application Status Updated',
      message: `Your application for ${application.jobId.title} has been updated to ${status.replace('_', ' ')}`,
      data: { jobId: application.jobId._id, applicationId: application._id, status },
      relatedEntity: { entityType: 'application', entityId: application._id },
    });

    if (status === APPLICATION_STATUS.REJECTED || status === APPLICATION_STATUS.ACCEPTED) {
      await application.jobId.decrementApplications();
    }

    return application;
  }

  async scheduleInterview(applicationId, interviewDetails, scheduledBy) {
    const Application = require('../models').Application;
    const Notification = require('../models').Notification;

    const application = await Application.findById(applicationId)
      .populate('jobId')
      .populate('applicantId', 'name email');

    if (!application) {
      throw new NotFoundError('Application not found');
    }

    if (![APPLICATION_STATUS.UNDER_REVIEW, APPLICATION_STATUS.SHORTLISTED].includes(application.status)) {
      throw new AppError('Can only schedule interview for under review or shortlisted applications', 400);
    }

    application.status = APPLICATION_STATUS.INTERVIEW_SCHEDULED;
    application.interviewDetails = interviewDetails;
    application.reviewedBy = scheduledBy;
    application.reviewedAt = new Date();
    application.statusHistory.push({
      status: APPLICATION_STATUS.INTERVIEW_SCHEDULED,
      changedBy: scheduledBy,
      changedAt: new Date(),
      notes: `Interview scheduled for ${interviewDetails.date}`,
    });

    await application.save();

    await Notification.create({
      userId: application.applicantId._id,
      type: 'application_status_update',
      title: 'Interview Scheduled',
      message: `Interview scheduled for ${application.jobId.title} on ${new Date(interviewDetails.date).toLocaleDateString()}`,
      data: { jobId: application.jobId._id, applicationId: application._id, interviewDetails },
      relatedEntity: { entityType: 'application', entityId: application._id },
    });

    return application;
  }

  async makeOffer(applicationId, offerDetails, offeredBy) {
    const Application = require('../models').Application;
    const Notification = require('../models').Notification;

    const application = await Application.findById(applicationId)
      .populate('jobId')
      .populate('applicantId', 'name email');

    if (!application) {
      throw new NotFoundError('Application not found');
    }

    if (application.status !== APPLICATION_STATUS.INTERVIEWED) {
      throw new AppError('Can only make offer after interview', 400);
    }

    application.status = APPLICATION_STATUS.OFFERED;
    application.offerDetails = offerDetails;
    application.reviewedBy = offeredBy;
    application.reviewedAt = new Date();
    application.statusHistory.push({
      status: APPLICATION_STATUS.OFFERED,
      changedBy: offeredBy,
      changedAt: new Date(),
      notes: 'Job offer made',
    });

    await application.save();

    await Notification.create({
      userId: application.applicantId._id,
      type: 'application_status_update',
      title: 'Job Offer Received',
      message: `You received a job offer for ${application.jobId.title}`,
      data: { jobId: application.jobId._id, applicationId: application._id, offerDetails },
      relatedEntity: { entityType: 'application', entityId: application._id },
      priority: 'high',
    });

    return application;
  }

  async acceptOffer(applicationId, userId) {
    const Application = require('../models').Application;
    const Notification = require('../models').Notification;

    const application = await Application.findById(applicationId)
      .populate('jobId')
      .populate('companyId')
      .populate('applicantId');

    if (!application) {
      throw new NotFoundError('Application not found');
    }

    if (application.applicantId._id.toString() !== userId.toString()) {
      throw new AppError('Only the applicant can accept the offer', 403);
    }

    if (application.status !== APPLICATION_STATUS.OFFERED) {
      throw new AppError('No offer to accept', 400);
    }

    application.status = APPLICATION_STATUS.ACCEPTED;
    application.statusHistory.push({
      status: APPLICATION_STATUS.ACCEPTED,
      changedBy: userId,
      changedAt: new Date(),
      notes: 'Offer accepted by applicant',
    });

    await application.save();

    await Notification.create({
      userId: application.companyId._id,
      type: 'application_status_update',
      title: 'Offer Accepted',
      message: `${application.applicantId.name} accepted the offer for ${application.jobId.title}`,
      data: { jobId: application.jobId._id, applicationId: application._id },
      relatedEntity: { entityType: 'application', entityId: application._id },
    });

    return application;
  }

  async withdrawApplication(applicationId, userId, reason = '') {
    const Application = require('../models').Application;
    const Job = require('../models').Job;
    const Notification = require('../models').Notification;

    const application = await Application.findById(applicationId)
      .populate('jobId')
      .populate('companyId');

    if (!application) {
      throw new NotFoundError('Application not found');
    }

    if (application.applicantId.toString() !== userId.toString()) {
      throw new AppError('Only the applicant can withdraw the application', 403);
    }

    if ([APPLICATION_STATUS.ACCEPTED, APPLICATION_STATUS.WITHDRAWN].includes(application.status)) {
      throw new AppError('Cannot withdraw this application', 400);
    }

    application.status = APPLICATION_STATUS.WITHDRAWN;
    application.withdrawalReason = reason;
    application.statusHistory.push({
      status: APPLICATION_STATUS.WITHDRAWN,
      changedBy: userId,
      changedAt: new Date(),
      notes: reason || 'Application withdrawn by applicant',
    });

    await application.save();
    await application.jobId.decrementApplications();

    await Notification.create({
      userId: application.companyId._id,
      type: 'application_status_update',
      title: 'Application Withdrawn',
      message: `An applicant withdrew their application for ${application.jobId.title}`,
      data: { jobId: application.jobId._id, applicationId: application._id },
      relatedEntity: { entityType: 'application', entityId: application._id },
    });

    return application;
  }

  async getApplications(filters = {}, options = {}) {
    const Application = require('../models').Application;

    const { page = 1, limit = 20, sort = '-createdAt' } = options;
    const { jobId, applicantId, companyId, status, reviewedBy } = filters;

    const query = {};
    if (jobId) query.jobId = jobId;
    if (applicantId) query.applicantId = applicantId;
    if (companyId) query.companyId = companyId;
    if (status) query.status = status;
    if (reviewedBy) query.reviewedBy = reviewedBy;

    const pagination = paginate(page, limit, await Application.countDocuments(query));

    const applications = await Application.find(query)
      .populate('jobId', 'title slug companyId')
      .populate('applicantId', 'name email avatar phone location skills')
      .populate('companyId', 'name slug logo')
      .populate('reviewedBy', 'name email')
      .sort(sort)
      .skip(pagination.skip)
      .limit(pagination.limit)
      .lean();

    return {
      data: applications,
      meta: pagination,
    };
  }

  async getMyApplications(userId, filters = {}, options = {}) {
    return this.getApplications({ ...filters, applicantId: userId }, options);
  }

  async getCompanyApplications(companyId, filters = {}, options = {}) {
    return this.getApplications({ ...filters, companyId }, options);
  }

  async getJobApplications(jobId, userId, filters = {}, options = {}) {
    const Job = require('../models').Job;
    const job = await Job.findById(jobId);
    
    if (!job) {
      throw new NotFoundError('Job not found');
    }

    const isOwner = job.postedById.toString() === userId.toString();
    const isMember = job.companyId.members?.some(m => m.userId.toString() === userId.toString() && ['owner', 'admin', 'recruiter'].includes(m.role));

    if (!isOwner && !isMember) {
      throw new AppError('Not authorized to view applications for this job', 403);
    }

    return this.getApplications({ ...filters, jobId }, options);
  }

  async getApplicationStats(companyId) {
    const Application = require('../models').Application;

    const [total, byStatus, recent, thisMonth] = await Promise.all([
      Application.countDocuments({ companyId }),
      Application.aggregate([
        { $match: { companyId: require('mongoose').Types.ObjectId(companyId) } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Application.countDocuments({
        companyId,
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      }),
      Application.countDocuments({
        companyId,
        createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
      }),
    ]);

    return {
      total,
      byStatus: byStatus.reduce((acc, item) => ({ ...acc, [item._id]: item.count }), {}),
      recent,
      thisMonth,
    };
  }

  async bulkUpdateStatus(applicationIds, status, reviewedBy, notes = '') {
    const Application = require('../models').Application;
    const Notification = require('../models').Notification;

    const applications = await Application.find({ _id: { $in: applicationIds } })
      .populate('jobId')
      .populate('applicantId', 'name email');

    const results = [];
    for (const application of applications) {
      const validTransitions = {
        [APPLICATION_STATUS.PENDING]: [APPLICATION_STATUS.UNDER_REVIEW, APPLICATION_STATUS.REJECTED],
        [APPLICATION_STATUS.UNDER_REVIEW]: [APPLICATION_STATUS.SHORTLISTED, APPLICATION_STATUS.REJECTED, APPLICATION_STATUS.INTERVIEW_SCHEDULED],
        [APPLICATION_STATUS.SHORTLISTED]: [APPLICATION_STATUS.INTERVIEW_SCHEDULED, APPLICATION_STATUS.REJECTED],
        [APPLICATION_STATUS.INTERVIEW_SCHEDULED]: [APPLICATION_STATUS.INTERVIEWED, APPLICATION_STATUS.REJECTED],
        [APPLICATION_STATUS.INTERVIEWED]: [APPLICATION_STATUS.OFFERED, APPLICATION_STATUS.REJECTED],
        [APPLICATION_STATUS.OFFERED]: [APPLICATION_STATUS.ACCEPTED, APPLICATION_STATUS.REJECTED],
      };

      if (validTransitions[application.status] && validTransitions[application.status].includes(status)) {
        application.status = status;
        application.reviewedBy = reviewedBy;
        application.reviewedAt = new Date();
        if (notes) {
          application.statusHistory.push({
            status,
            changedBy: reviewedBy,
            changedAt: new Date(),
            notes,
          });
        }
        await application.save();

        await Notification.create({
          userId: application.applicantId._id,
          type: 'application_status_update',
          title: 'Application Status Updated',
          message: `Your application for ${application.jobId.title} has been updated to ${status.replace('_', ' ')}`,
          data: { jobId: application.jobId._id, applicationId: application._id, status },
          relatedEntity: { entityType: 'application', entityId: application._id },
        });

        results.push({ id: application._id, success: true });
      } else {
        results.push({ id: application._id, success: false, error: 'Invalid status transition' });
      }
    }

    return results;
  }
}

module.exports = new ApplicationService();