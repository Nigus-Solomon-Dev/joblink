export type UserRole = "job_seeker" | "employer" | "admin";
export type UserStatus =
  | "active"
  | "inactive"
  | "suspended"
  | "pending_verification";

export interface User {
  _id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  avatar: string | null;
  phone: string | null;
  bio?: string;
  location?: string;
  website?: string;
  linkedin?: string;
  skills?: string[];
  emailVerified: boolean;
  lastLogin?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  accessToken?: string;
}

export type CompanySize = "1-10" | "11-50" | "51-200" | "201-500" | "501-1000" | "1000+";
export type CompanyMemberRole = "owner" | "admin" | "recruiter" | "viewer";

export interface CompanyMember {
  userId: string;
  role: CompanyMemberRole;
  joinedAt: string;
}

export interface Company {
  _id: string;
  name: string;
  slug: string;
  description: string;
  logo: string | null;
  coverImage: string | null;
  website?: string;
  industry?: string;
  size: CompanySize;
  location?: string;
  foundedYear?: number | null;
  isVerified: boolean;
  ownerId: string;
  members?: CompanyMember[];
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
  };
  benefits?: string[];
  culture?: string;
  viewsCount?: number;
  jobsCount?: number;
  followersCount?: number;
  createdAt: string;
  updatedAt: string;
}

export type JobStatus = "draft" | "published" | "closed" | "expired" | "archived";
export type JobType =
  | "full_time"
  | "part_time"
  | "contract"
  | "internship"
  | "remote"
  | "hybrid";
export type ExperienceLevel = "entry" | "junior" | "mid" | "senior" | "lead" | "executive";
export type EducationLevel = "high_school" | "diploma" | "bachelor" | "master" | "phd" | "any";
export type RemoteType = "fully_remote" | "hybrid" | "on_site";
export type SalaryPeriod = "monthly" | "yearly" | "hourly";

export interface Job {
  _id: string;
  title: string;
  slug: string;
  description: string;
  requirements: string;
  responsibilities: string;
  benefits?: string;
  type: JobType;
  status: JobStatus;
  experienceLevel: ExperienceLevel;
  educationLevel: EducationLevel;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency?: string;
  salaryPeriod: SalaryPeriod;
  location?: string;
  isRemote: boolean;
  remoteType: RemoteType;
  applicationDeadline?: string | null;
  categoryId: string;
  skills: string[];
  companyId: string;
  postedById: string;
  viewsCount?: number;
  applicationsCount?: number;
  savesCount?: number;
  featured?: boolean;
  featuredUntil?: string | null;
  publishedAt?: string | null;
  expiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
  company?: Pick<Company, "_id" | "name" | "slug" | "logo">;
  category?: Pick<Category, "_id" | "name" | "slug">;
}

export interface JobDetail extends Job {
  postedBy?: Pick<User, "_id" | "name" | "avatar">;
  salaryRange?: string;
  isExpired?: boolean;
  daysUntilDeadline?: number | null;
}

/** Job detail as returned by `GET /jobs/:id` (populated refs + virtuals). */
export interface JobDetailResult
  extends Omit<JobDetail, "companyId" | "categoryId" | "skills" | "postedBy" | "postedById"> {
  companyId: PopulatedCompanyRef;
  categoryId: PopulatedCategoryRef;
  skills?: Skill[];
  postedById?: Pick<User, "_id" | "name" | "avatar">;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  parentId?: string | null;
  order?: number;
  isActive: boolean;
  jobsCount?: number;
}

export interface Skill {
  _id: string;
  name: string;
  slug: string;
  category?: string;
  description?: string;
  isActive: boolean;
  jobsCount?: number;
  usersCount?: number;
}

export type ApplicationStatus =
  | "pending"
  | "under_review"
  | "shortlisted"
  | "interview_scheduled"
  | "interviewed"
  | "offered"
  | "accepted"
  | "rejected"
  | "withdrawn";

export interface Application {
  _id: string;
  jobId: string;
  applicantId: string;
  companyId: string;
  status: ApplicationStatus;
  coverLetter?: string;
  resume?: string | null;
  portfolio?: string;
  expectedSalary?: number | null;
  availabilityDate?: string | null;
  notes?: string;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  interviewDetails?: {
    date?: string;
    time?: string;
    location?: string;
    meetingLink?: string;
    type?: "phone" | "video" | "in_person";
    notes?: string;
  } | null;
  offerDetails?: {
    salary?: number;
    currency?: string;
    startDate?: string;
    benefits?: string;
    notes?: string;
  } | null;
  rejectionReason?: string;
  withdrawalReason?: string;
  statusHistory?: Array<{
    status: ApplicationStatus;
    changedBy?: string;
    changedAt: string;
    notes?: string;
  }>;
  createdAt: string;
  updatedAt: string;
  job?: Pick<Job, "_id" | "title" | "slug" | "companyId">;
  applicant?: Pick<User, "_id" | "name" | "avatar" | "email">;
}

export type NotificationType =
  | "job_application"
  | "application_status_update"
  | "new_job_match"
  | "message"
  | "system";

export interface AppNotification {
  _id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  readAt?: string | null;
  relatedEntity?: {
    entityType: "job" | "application" | "company" | "user" | "message" | "conversation";
    entityId: string;
  } | null;
  priority?: "low" | "normal" | "high" | "urgent";
  createdAt: string;
  updatedAt: string;
}

/** Minimal populated sender/receiver shape returned by messaging endpoints. */
export interface MessageAuthorRef {
  _id: string;
  name?: string;
  avatar?: string | null;
  email?: string;
  role?: UserRole;
}

export interface MessageParticipantDetail {
  userId: string;
  unreadCount: number;
  lastReadAt?: string | null;
  isArchived?: boolean;
  archivedAt?: string | null;
}

export interface MessageAttachment {
  url: string;
  name: string;
  type: string;
  size: number;
}

export interface Message {
  _id: string;
  conversationId: string;
  senderId: MessageAuthorRef | string;
  receiverId: MessageAuthorRef | string;
  content: string;
  attachments?: MessageAttachment[];
  isRead: boolean;
  readAt?: string | null;
  isEdited?: boolean;
  editedAt?: string | null;
  isDeleted?: boolean;
  deletedAt?: string | null;
  deletedBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  _id: string;
  participants: MessageAuthorRef[];
  participantDetails?: MessageParticipantDetail[];
  lastMessage?: Message | string | null;
  lastMessageAt: string;
  isGroup: boolean;
  groupName?: string;
  groupAvatar?: string | null;
  groupAdmin?: MessageAuthorRef | string | null;
  relatedEntity?: {
    entityType: "job" | "application" | "company";
    entityId: string;
  } | null;
  isActive: boolean;
  unreadCount?: number;
  isArchived?: boolean;
  otherParticipants?: MessageAuthorRef[];
  displayName?: string;
  displayAvatar?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SavedJob {
  _id: string;
  userId: string;
  jobId: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PopulatedCompanyRef {
  _id: string;
  name: string;
  slug: string;
  logo: string | null;
  isVerified: boolean;
  size?: CompanySize;
  industry?: string;
}

export interface PopulatedCategoryRef {
  _id: string;
  name: string;
  slug: string;
}

/** Job as returned by search/browse/saved list endpoints (populated refs). */
export interface JobListItem {
  _id: string;
  title: string;
  slug: string;
  description: string;
  type: JobType;
  status: JobStatus;
  experienceLevel: ExperienceLevel;
  educationLevel: EducationLevel;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency?: string;
  salaryPeriod: SalaryPeriod;
  location?: string;
  isRemote: boolean;
  remoteType: RemoteType;
  applicationDeadline?: string | null;
  categoryId: PopulatedCategoryRef;
  skills?: Skill[];
  companyId: PopulatedCompanyRef;
  featured?: boolean;
  featuredUntil?: string | null;
  publishedAt?: string | null;
  expiresAt?: string | null;
  viewsCount?: number;
  applicationsCount?: number;
  savesCount?: number;
  createdAt: string;
}

export interface FacetCategory {
  id: string;
  name: string;
  slug: string;
  count: number;
}

export interface FacetCompany {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  isVerified: boolean;
  count: number;
}

export interface FacetSkill {
  id: string;
  name: string;
  slug: string;
  category?: string;
  count: number;
}

export interface JobFacets {
  categories: FacetCategory[];
  types: { type: JobType | null; count: number }[];
  experienceLevels: { level: ExperienceLevel | null; count: number }[];
  locations: { location: string; count: number }[];
  companies: FacetCompany[];
  skills: FacetSkill[];
  salaryRanges: { range: string | number; count: number }[];
  remoteOptions: { isRemote: boolean; count: number }[];
  workArrangements: { type: RemoteType | null; count: number }[];
}

export interface SearchSuggestions {
  jobs: { _id: string; title: string; slug: string }[];
  categories: { _id: string; name: string; slug: string }[];
  skills: { _id: string; name: string; slug: string; category?: string }[];
  companies: { _id: string; name: string; slug: string; logo: string | null }[];
}

/** Application list item (my-applications): `job`/`jobId` are populated refs. */
export interface MyApplication {
  _id: string;
  status: ApplicationStatus;
  coverLetter?: string;
  expectedSalary?: number | null;
  availabilityDate?: string | null;
  createdAt: string;
  updatedAt: string;
  jobId?: string | { _id: string; title?: string; slug?: string };
  job?: { _id: string; title?: string; slug?: string; companyId?: PopulatedCompanyRef };
}

/** Populated job reference inside an application / saved-job list result. */
export interface ApplicationJobRef {
  _id: string;
  title: string;
  slug?: string;
  status?: JobStatus;
  type?: JobType;
  location?: string;
  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryCurrency?: string;
  salaryPeriod?: SalaryPeriod;
  isRemote?: boolean;
  companyId: PopulatedCompanyRef;
}

export interface InterviewDetails {
  date?: string;
  time?: string;
  location?: string;
  meetingLink?: string;
  type?: "phone" | "video" | "in_person";
  notes?: string;
}

export interface OfferDetails {
  salary?: number;
  currency?: string;
  startDate?: string;
  benefits?: string;
  notes?: string;
}

export interface StatusHistoryEntry {
  status: ApplicationStatus;
  changedBy?: string;
  changedAt: string;
  notes?: string;
}

/** Application list item as returned by the seeker endpoints (populated refs). */
export interface MyApplicationListItem {
  _id: string;
  status: ApplicationStatus;
  coverLetter?: string;
  resume?: string | null;
  portfolio?: string;
  expectedSalary?: number | null;
  availabilityDate?: string | null;
  notes?: string;
  rejectionReason?: string;
  withdrawalReason?: string;
  interviewDetails?: InterviewDetails | null;
  offerDetails?: OfferDetails | null;
  statusHistory?: StatusHistoryEntry[];
  createdAt: string;
  updatedAt: string;
  jobId: ApplicationJobRef;
}

export interface DashboardOverview {
  totalApplications: number;
  pendingApplications: number;
  underReviewApplications: number;
  interviewApplications: number;
  acceptedApplications: number;
  rejectedApplications: number;
  totalSavedJobs: number;
  profileCompleteness: number;
}

/** Recent application shown on the seeker dashboard. */
export interface RecentApplication {
  _id: string;
  status: ApplicationStatus;
  createdAt: string;
  jobId:
    | string
    | { _id: string; title?: string; companyId?: { _id: string; name?: string; logo?: string | null } };
  job?: { _id: string; title?: string; companyId?: { _id: string; name?: string; logo?: string | null } };
}

export interface UpcomingInterview {
  _id: string;
  status: ApplicationStatus;
  interviewDetails?: InterviewDetails | null;
  createdAt: string;
  jobId:
    | string
    | { _id: string; title?: string; companyId?: { _id: string; name?: string; logo?: string | null } };
}

export interface SeekerDashboardStats {
  overview: DashboardOverview;
  recentApplications: RecentApplication[];
  upcomingInterviews: UpcomingInterview[];
}

export interface RecommendedJobsResponse {
  jobs: JobListItem[];
}

export interface ApplicationTimelineEntry {
  date: string;
  applications: Array<{
    id: string;
    jobTitle?: string;
    companyName?: string;
    companyLogo?: string | null;
    status: ApplicationStatus;
    appliedAt: string;
  }>;
}

export interface ApplicationTimelineResponse {
  timeline: ApplicationTimelineEntry[];
}

export interface SkillGapSkill {
  _id: string;
  name: string;
  slug?: string;
  category?: string;
  demand: number;
}

export interface SkillGapResponse {
  skills: SkillGapSkill[];
}

export interface SalaryPoint {
  min?: number | null;
  max?: number | null;
  currency?: string;
  period?: SalaryPeriod;
  type?: JobType;
  experienceLevel?: ExperienceLevel;
}

export interface SalaryInsightsResponse {
  applied: SalaryPoint[];
  market: SalaryPoint[];
}

export type ActivityHeatmapEntry = { date: string; count: number };

export interface ActivityHeatmapResponse {
  heatmap: ActivityHeatmapEntry[];
}

export interface ProfileCompletenessField {
  field: string;
  label: string;
  weight: number;
  completed: boolean;
}

export interface ProfileCompletenessResponse {
  fields: ProfileCompletenessField[];
  percentage: number;
  totalWeight: number;
  completedWeight: number;
}

export interface NotificationPreferences {
  email: Record<string, boolean>;
  push: Record<string, boolean>;
  inApp: Record<string, boolean>;
}

export interface NotificationPreferencesResponse {
  preferences: NotificationPreferences;
}

/* ------------------------------------------------------------------ */
/* Phase 4: Employer experience                                        */
/* ------------------------------------------------------------------ */

export interface CompanyOverviewStats {
  jobsCount: number;
  openJobsCount: number;
  applicationsCount: number;
  viewsCount: number;
}

/** `GET /companies/:id/stats` */
export interface CompanyStats {
  viewsCount: number;
  jobsCount: number;
  openJobsCount: number;
  applicationsCount: number;
  jobsByStatus: Partial<Record<JobStatus, number>>;
  applicationsByStatus: Partial<Record<ApplicationStatus, number>>;
}

/** Company listing from the employer dashboards (`GET /employer/dashboard/companies`, `/companies/my-companies`). */
export interface CompanyWithStats extends Omit<Company, "ownerId" | "members"> {
  ownerId: string | { _id: string; name?: string; email?: string; avatar?: string | null };
  members?: CompanyTeamMember[];
  stats?: CompanyOverviewStats;
}

export interface EmployerDashboardOverview {
  totalJobs: number;
  activeJobs: number;
  draftJobs: number;
  closedJobs: number;
  totalApplications: number;
  pendingApplications: number;
  interviewedApplications: number;
  hiredApplications: number;
  totalViews: number;
  totalSaves: number;
  companiesCount: number;
}

export interface EmployerRecentApplication {
  _id: string;
  status: ApplicationStatus;
  createdAt: string;
  jobId: string | { _id: string; title: string };
  applicantId:
    | string
    | { _id: string; name: string; avatar: string | null; email: string };
}

export interface EmployerTopJob {
  _id: string;
  title: string;
  viewsCount?: number;
  applicationsCount?: number;
  status: JobStatus;
}

export interface EmployerDashboardStats {
  overview: EmployerDashboardOverview;
  recentApplications: EmployerRecentApplication[];
  topJobs: EmployerTopJob[];
}

export interface AnalyticsTimePoint {
  _id: string;
  count: number;
}

export interface EmployerAnalytics {
  jobsOverTime: AnalyticsTimePoint[];
  applicationsOverTime: AnalyticsTimePoint[];
  applicationsByStatus: Partial<Record<ApplicationStatus, number>>;
  jobsByType: Partial<Record<JobType, number>>;
  jobsByCategory: Record<string, number>;
  avgTimeToHire: number;
  avgConversionRate: number;
}

export type AnalyticsPeriod = "7d" | "30d" | "90d" | "365d";

export interface ApplicantRef {
  _id: string;
  name: string;
  email: string;
  avatar: string | null;
  phone?: string | null;
  location?: string;
  skills?: string[];
}

/** Application as listed for employers (pipeline, per-job, bulk). */
export interface EmployerApplicationListItem {
  _id: string;
  status: ApplicationStatus;
  coverLetter?: string;
  resume?: string | null;
  portfolio?: string;
  expectedSalary?: number | null;
  availabilityDate?: string | null;
  notes?: string;
  rejectionReason?: string;
  withdrawalReason?: string;
  interviewDetails?: InterviewDetails | null;
  offerDetails?: OfferDetails | null;
  statusHistory?: StatusHistoryEntry[];
  reviewedBy?: string | { _id: string; name?: string; email?: string } | null;
  reviewedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  jobId:
    | string
    | { _id: string; title: string; slug?: string; companyId?: string | { _id?: string } };
  applicantId: ApplicantRef | string;
  companyId: string | { _id: string; name?: string; slug?: string; logo?: string | null };
}

export interface CompanyApplicationStats {
  total: number;
  byStatus: Partial<Record<ApplicationStatus, number>>;
  recent: number;
  thisMonth: number;
}

export interface CompanyTeamMember {
  _id?: string;
  userId: string;
  role: CompanyMemberRole;
  joinedAt: string;
  user?: Pick<User, "_id" | "name" | "email" | "avatar" | "role" | "createdAt"> | null;
}

export interface SubscriptionInfo {
  plan: string;
  status: string;
}

export interface SubscriptionResponse {
  user: SubscriptionInfo;
  companies: SubscriptionInfo[];
}

export interface CompanyPerformanceMetrics {
  overview: {
    totalJobs: number;
    activeJobs: number;
    totalViews: number;
    totalSaves: number;
    totalApplications: number;
    conversionRate: number;
  };
  jobsTimeline: Record<string, { posted: number; views: number; saves: number }>;
  applicationsByStatus: Partial<Record<ApplicationStatus, number>>;
  companyMetrics: {
    viewsPerJob: number;
    savesPerJob: number;
    applicationsPerJob: number;
  };
}

/** Payload for `POST`/`PATCH /jobs` (mirrors the backend validators). */
export interface JobInput {
  title: string;
  description: string;
  requirements: string;
  responsibilities: string;
  benefits?: string;
  type: JobType;
  experienceLevel?: ExperienceLevel;
  educationLevel?: EducationLevel;
  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryCurrency?: string;
  salaryPeriod?: SalaryPeriod;
  location?: string;
  isRemote?: boolean;
  remoteType?: RemoteType;
  applicationDeadline?: string | null;
  categoryId: string;
  companyId: string;
  skills?: string[];
  status?: JobStatus;
}

/** Company profile fields editable by an employer (backed by the DSL owner fields). */
export type CompanyUpdateInput = Partial<{
  name: string;
  description: string;
  website: string;
  industry: string;
  size: CompanySize;
  location: string;
  foundedYear: number | null;
  benefits: string[];
  socialLinks: { linkedin?: string; twitter?: string; facebook?: string };
  culture: string;
}>;

export type AddCompanyMemberInput = {
  userId: string;
  role?: "admin" | "recruiter" | "viewer";
};

export interface InterviewInput {
  date: string;
  time?: string;
  location?: string;
  meetingLink?: string;
  type?: "phone" | "video" | "in_person";
  notes?: string;
}

export interface OfferInput {
  salary: number;
  currency?: string;
  startDate: string;
  benefits?: string;
  notes?: string;
}

export interface BulkUpdateResult {
  id: string;
  success: boolean;
  error?: string;
}

/** `GET /jobs/:id/stats` (protected). */
export interface JobStats {
  viewsCount: number;
  applicationsCount: number;
  savesCount: number;
  applicationsByStatus: Partial<Record<ApplicationStatus, number>>;
}

/**
 * Full job row returned by `GET /jobs/my-jobs` (lean documents carry
 * every field the edit form needs, beyond the public `JobListItem`).
 */
export interface EmployerJob extends JobListItem {
  requirements?: string;
  responsibilities?: string;
  benefits?: string;
  salaryCurrency?: string;
}

/* ------------------------------------------------------------------ */
/* Phase 6: Admin experience                                           */
/* ------------------------------------------------------------------ */

export interface AdminRecentUser {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
}

export interface AdminRecentCompany {
  _id: string;
  name: string;
  slug: string;
  isVerified: boolean;
  createdAt: string;
}

export interface AdminRecentJob {
  _id: string;
  title: string;
  status: JobStatus;
  companyId: string | { _id: string; name: string };
  createdAt: string;
}

export interface AdminSystemOverview {
  overview: {
    totalUsers: number;
    totalCompanies: number;
    totalJobs: number;
    totalApplications: number;
    verifiedCompanies: number;
    pendingVerificationCompanies: number;
  };
  usersByRole: Partial<Record<UserRole, number>>;
  usersByStatus: Partial<Record<UserStatus, number>>;
  jobsByStatus: Partial<Record<JobStatus, number>>;
  applicationsByStatus: Partial<Record<ApplicationStatus, number>>;
  recentActivity: {
    users: AdminRecentUser[];
    companies: AdminRecentCompany[];
    jobs: AdminRecentJob[];
  };
}

export interface AdminRegistrationsPoint {
  _id: string;
  count: number;
}

export interface AdminRoleOverTimePoint {
  _id: { date: string; role: string };
  count: number;
}

export interface AdminUserAnalytics {
  registrationsOverTime: AdminRegistrationsPoint[];
  usersByRoleOverTime: AdminRoleOverTimePoint[];
  verificationRate: Record<string, number>;
  activeUsersLast7Days: number;
}

export interface AdminCompanyAnalytics {
  companiesOverTime: AdminRegistrationsPoint[];
  companiesBySize: Record<string, number>;
  companiesByIndustry: Record<string, number>;
  verificationStats: Record<string, number>;
}

export interface AdminJobAnalytics {
  jobsOverTime: AdminRegistrationsPoint[];
  jobsByType: Partial<Record<JobType, number>>;
  jobsByCategory: Record<string, number>;
  featuredJobsCount: number;
  avgApplicationsPerJob: number;
}

/** `GET /admin/dashboard/analytics/revenue` — no monetary revenue is reported. */
export interface AdminRevenueAnalytics {
  revenueAvailable: false;
  activity: {
    totalCompanies: number;
    featuredJobs: number;
    totalApplications: number;
    successfulHires: number;
  };
}

export interface MemoryUsage {
  rss: number;
  heapTotal: number;
  heapUsed: number;
  external: number;
  arrayBuffers: number;
}

export interface AdminSystemHealth {
  uptime: number;
  memoryUsage: MemoryUsage;
  errorRate: number;
  avgResponseTime: number;
  database: {
    collections: number;
    dataSize: number;
    storageSize: number;
    indexes: number;
  };
  queue: {
    queueLength: number;
    isConfigured: boolean;
    pending: number;
    processing: number;
  };
}

export interface AuditLogEntry {
  action: string;
  entityType: string;
  entityId: string;
  userId: string;
  details: Record<string, unknown>;
  timestamp: string;
}

export interface AdminSubscriptionPlan {
  name: string;
  price: number;
  features: string[];
}

export interface AdminSettings {
  siteName: string;
  siteDescription: string;
  maintenanceMode: boolean;
  registrationEnabled: boolean;
  jobPostingEnabled: boolean;
  maxFileUploadSize: number;
  allowedFileTypes: string[];
  emailVerificationRequired: boolean;
  maxJobsPerCompany: number;
  featuredJobPrice: number;
  subscriptionPlans: AdminSubscriptionPlan[];
}

/** User row from `GET /users` (admin). */
export type AdminUserItem = User;

export interface AdminUserStats {
  total: number;
  byRole: Partial<Record<UserRole, number>>;
  byStatus: Partial<Record<UserStatus, number>>;
  recentSignups: number;
}

/** `GET /companies/admin` — lean company document. */
export type AdminCompanyItem = Company;

/** `GET /jobs/admin` — populated job row. */
export type AdminJobItem = JobListItem & {
  status: JobStatus;
  featured: boolean;
  featuredUntil?: string | null;
  applicationsCount?: number;
  viewsCount?: number;
  savesCount?: number;
};

export interface AdminUserUpdateInput {
  name?: string;
  role?: UserRole;
  status?: UserStatus;
  emailVerified?: boolean;
  bio?: string;
  location?: string;
  website?: string;
  phone?: string;
}

export interface AdminVerifyCompanyInput {
  isVerified: boolean;
}

export interface AdminFeatureJobInput {
  featured: boolean;
  featuredUntil?: string | null;
}

export interface CategoryInput {
  name: string;
  description?: string;
  icon?: string;
  parentId?: string;
  order?: number;
  isActive?: boolean;
}

export interface SkillInput {
  name: string;
  description?: string;
  category?: string;
  isActive?: boolean;
}

export interface EmailQueueStatus {
  queueLength: number;
  isConfigured: boolean;
  pending: number;
  processing: number;
}

export interface EmailAnalytics {
  isConfigured: boolean;
  transporterReady: boolean;
  queueLength: number;
  totalQueued: number;
}

export interface TelegramBotStatus {
  configured: boolean;
  isConfigured?: boolean;
}

export interface TelegramBotInfo {
  configured: boolean;
  info?: { id: number; is_bot?: boolean; first_name?: string; username?: string } | null;
  error?: string | null;
}

export type ReportType = "users" | "jobs" | "applications" | "companies";
export type ReportGroupBy = "status" | "type" | "role" | "industry" | "size" | "experienceLevel";

export interface ReportDateRange {
  start?: string;
  end?: string;
}

export interface CustomReportResponse {
  metadata: {
    reportType: ReportType;
    dateRange?: ReportDateRange;
    filters?: Record<string, unknown>;
    groupBy?: string;
    generatedAt: string;
    totalRecords: number;
  };
  data: Array<{ _id: string; count: number }>;
  summary: Record<string, number>;
}

export interface ScheduledReportItem {
  id: string;
  reportType: ReportType;
  format: string;
  recipients: string[];
  frequency: "hourly" | "daily" | "weekly" | "monthly";
  dateRange?: ReportDateRange;
  filters?: Record<string, unknown>;
  createdAt?: string;
  lastRun: string | null;
  isActive: boolean;
}

export interface MarketTrendAnalysis {
  totalJobs?: number;
  avgSalaryMin?: number | null;
  avgSalaryMax?: number | null;
  totalApplications?: number;
  remoteJobs?: number;
}

export interface MarketTrendResponse {
  jobsOverTime: Array<{ _id: string; count: number; avgSalary?: number; totalViews?: number }>;
  applicationsOverTime: AdminRegistrationsPoint[];
  marketAnalysis: MarketTrendAnalysis;
  topRegions: Array<{ _id: string; count: number }>;
  topCategories: Array<{ _id: string; count: number }>;
  jobTypes: Partial<Record<JobType, number>>;
  period: { start: string; end: string };
}

export interface FunnelStep {
  stage: string;
  value: number;
  conversionRate?: number;
}

export interface FunnelResponse {
  funnel: FunnelStep[];
  conversions: FunnelStep[];
}

export interface UserBehaviorResponse {
  userRegistrations: AdminRegistrationsPoint[];
  applications: AdminRegistrationsPoint[];
  savedJobs: AdminRegistrationsPoint[];
  notifications: AdminRegistrationsPoint[];
  period: { start: string; end: string };
}

export interface RealtimeMetrics {
  activeUsers: number;
  onlineUsers: number;
  jobsViewed: number;
  applicationsSubmitted: number;
  notificationsSent: number;
  serverStats: {
    uptime: number;
    memory: MemoryUsage;
    cpu: { user: number; system: number };
  };
  lastUpdated: string;
}