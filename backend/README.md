# JobLink Backend API

A modern job marketplace backend built with Node.js, Express, and MongoDB.

## Table of Contents

- [Features](#features)
- [Technologies](#technologies)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [API Endpoints](#api-endpoints)
- [Architecture](#architecture)
- [Testing](#testing)
- [Deployment](#deployment)

## Features

- **User Management**: Registration, authentication, profile management
- **Job Management**: Create, post, search, and filter jobs
- **Application System**: Apply to jobs, track application status
- **Messaging**: Real-time messaging between job seekers and employers
- **Analytics**: User behavior, market trends, funnel analytics
- **File Uploads**: Cloudinary integration for images and PDFs
- **Email Service**: Verification emails, password resets, notifications
- **Telegram Bot**: Job notifications via Telegram
- **Real-time**: WebSocket support for live updates

## Technologies

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose ODM)
- **Authentication**: JWT
- **Password Hashing**: Bcrypt
- **File Uploads**: Multer + Cloudinary
- **Email**: Nodemailer
- **Real-time**: Socket.IO
- **Telegram**: Telegraf

## Prerequisites

- Node.js >= 18.x
- npm >= 9.x
- MongoDB >= 6.x
- Cloudinary account (optional, for file uploads)

## Installation

```bash
# Clone repository
git clone <repository-url>
cd joblink/backend

# Install dependencies
npm install

# Environment setup
cp .env.example .env
# Edit .env with your configuration

# Start development server
npm run dev

# Start production server
npm start
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| PORT | Server port (default: 5000) | No |
| MONGODB_URI | MongoDB connection string | Yes |
| JWT_SECRET | JWT secret key | Yes |
| JWT_EXPIRES_IN | JWT expiration time | No |
| BCRYPT_SALT_ROUNDS | Salt rounds for hashing | No |
| CORS_ORIGIN | CORS origin | No |
| CLOUDINARY_CLOUD_NAME | Cloudinary cloud name | No |
| CLOUDINARY_API_KEY | Cloudinary API key | No |
| CLOUDINARY_API_SECRET | Cloudinary API secret | No |
| EMAIL_HOST | SMTP host | No |
| EMAIL_PORT | SMTP port | No |
| EMAIL_USER | SMTP username | No |
| EMAIL_PASS | SMTP password | No |
| EMAIL_FROM | Sender email | No |
| FRONTEND_URL | Frontend application URL | No |
| TELEGRAM_BOT_TOKEN | Telegram bot token | No |
| TELEGRAM_WEBHOOK_URL | Telegram webhook URL | No |

## API Endpoints

### Health Check
- `GET /health` - Check API health

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/auth/forgot-password` - Request password reset
- `POST /api/v1/auth/reset-password/:token` - Reset password

### Users
- `GET /api/v1/users` - List all users (admin)
- `GET /api/v1/users/:id` - Get user by ID
- `PATCH /api/v1/users/:id` - Update user

### Jobs
- `GET /api/v1/jobs` - List jobs
- `GET /api/v1/jobs/:id` - Get job by ID
- `POST /api/v1/jobs` - Create job (employer)
- `PATCH /api/v1/jobs/:id` - Update job
- `DELETE /api/v1/jobs/:id` - Delete job

### Applications
- `GET /api/v1/applications` - List applications
- `POST /api/v1/applications` - Apply to job
- `PATCH /api/v1/applications/:id` - Update application status

### Analytics
- `GET /api/v1/analytics/user-behavior` - User behavior analytics
- `GET /api/v1/analytics/market-trends` - Market trends
- `GET /api/v1/analytics/funnel` - Funnel analytics
- `GET /api/v1/analytics/revenue` - Revenue analytics
- `POST /api/v1/analytics/reports/custom` - Build custom report
- `GET /api/v1/analytics/export` - Export analytics data
- `GET /api/v1/analytics/realtime` - Real-time metrics

### File Uploads
- `POST /api/v1/uploads/upload` - Upload single file
- `POST /api/v1/uploads/upload-multiple` - Upload multiple files
- `DELETE /api/v1/uploads/:publicId` - Delete file
- `GET /api/v1/uploads/:publicId` - Get file info
- `GET /api/v1/uploads/signature` - Get Cloudinary upload signature

### Email
- `POST /api/v1/emails/test` - Send test email
- `POST /api/v1/emails/verification` - Send verification email
- `POST /api/v1/emails/password-reset` - Send password reset email
- `POST /api/v1/emails/welcome` - Send welcome email
- `POST /api/v1/emails/queue` - Queue email
- `POST /api/v1/emails/batch` - Send batch emails
- `POST /api/v1/emails/schedule` - Schedule email
- `GET /api/v1/emails/queue` - Get queue status
- `DELETE /api/v1/emails/queue` - Clear queue

### Telegram Bot
- `GET /api/v1/telegram/status` - Get bot status
- `POST /api/v1/telegram/broadcast` - Broadcast message
- `POST /api/v1/telegram/send` - Send message to user
- `POST /api/v1/telegram/job-alert` - Send job alert

## Architecture

```
src/
├── config/           # Configuration files
├── constants/        # Application constants
├── controllers/      # Request handlers
├── middleware/       # Express middleware
├── models/           # Mongoose models
├── routes/           # API routes
├── services/         # Business logic
├── utils/            # Utility functions
└── server.js         # Server entry point
```

## Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## Deployment

See [DEPLOYMENT.md](./docs/DEPLOYMENT.md) for detailed deployment instructions.

## License

ISC