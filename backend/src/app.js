// Express app setup
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const connectDB = require('./config/database');
const performanceMonitor = require('./utils/performanceMonitor');

const {
  securityHeaders,
  corsOptions,
  rateLimiter,
  requestLogger,
  notFound,
  errorHandler,
  optimization,
} = require('./middleware');

const config = require('./config/env');

const app = express();

// Connect to database
connectDB();

// Security headers
app.use(securityHeaders);

// CORS
app.use(cors(corsOptions));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parser
app.use(cookieParser());

// Request logging
if (config.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
app.use(requestLogger);

// Rate limiting
app.use(rateLimiter());

// Performance timing middleware
app.use((req, res, next) => {
  const start = process.hrtime.bigint();
  
  res.on('finish', () => {
    const statusCode = res.statusCode;
    performanceMonitor.recordRequest(start, statusCode, req.path);
  });
  
  next();
});

// Optimization middleware
app.use(optimization.compression);
app.use(optimization.cacheControl);
app.use(optimization.noSniff);
app.use(optimization.frameProtection);
app.use(optimization.removePoweredBy);
app.use(optimization.responseTime);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'JobLink API is running',
    timestamp: new Date().toISOString(),
    environment: config.NODE_ENV,
  });
});

// Metrics endpoint
app.get('/metrics', (req, res) => {
  res.json({
    success: true,
    metrics: performanceMonitor.getMetrics(),
  });
});

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const companyRoutes = require('./routes/companyRoutes');
const categorySkillRoutes = require('./routes/categorySkillRoutes');
const jobRoutes = require('./routes/jobRoutes');
const searchRoutes = require('./routes/searchRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const savedJobRoutes = require('./routes/savedJobRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const messagingRoutes = require('./routes/messagingRoutes');
const employerDashboardRoutes = require('./routes/employerDashboardRoutes');
const jobSeekerDashboardRoutes = require('./routes/jobSeekerDashboardRoutes');
const adminDashboardRoutes = require('./routes/adminDashboardRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const fileUploadRoutes = require('./routes/fileUploadRoutes');
const emailRoutes = require('./routes/emailRoutes');
const telegramBotRoutes = require('./routes/telegramBotRoutes');

// API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/companies', companyRoutes);
app.use('/api/v1', categorySkillRoutes);
app.use('/api/v1/jobs', jobRoutes);
app.use('/api/v1/search', searchRoutes);
app.use('/api/v1/applications', applicationRoutes);
app.use('/api/v1/saved-jobs', savedJobRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/messages', messagingRoutes);
app.use('/api/v1/employer/dashboard', employerDashboardRoutes);
app.use('/api/v1/jobseeker/dashboard', jobSeekerDashboardRoutes);
app.use('/api/v1/admin/dashboard', adminDashboardRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/uploads', fileUploadRoutes);
app.use('/api/v1/emails', emailRoutes);
app.use('/api/v1/telegram', telegramBotRoutes);

// 404 handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

module.exports = app;