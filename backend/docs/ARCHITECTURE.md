# JobLink Architecture Documentation

## Overview

JobLink is a job marketplace platform built with a clean, scalable architecture following industry best practices. This document describes the system architecture, data flow, and component interaction.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        User Devices                          │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐      │
│  │   Browser   │    │   Mobile    │    │   Desktop   │      │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘      │
└─────────┼────────────────┼────────────────┼────────────────┘
          │                │                │
          ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                        │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  React Components  │  Tailwind CSS  │  TanStack Query   ││
│  └─────────────────────────────────────────────────────────┘│
└───────────────────────┬─────────────────────────────────────┘
                        │ API
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend (Express.js)                        │
│  ┌─────────────────────────────────────────────────────────┐│
│  │              API Routes & Controllers                   ││
│  ├─────────────────────────────────────────────────────────┤│
│  │              Services (Business Logic)                  ││
│  ├─────────────────────────────────────────────────────────┤│
│  │                 Models & Schemas                        ││
│  └─────────────────────────────────────────────────────────┘│
└───────────────────────┬─────────────────────────────────────┘
                        │ Database
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                   MongoDB Database                           │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                    Collections                          ││
│  │  users, companies, jobs, applications, messages, etc.    ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

## Component Layers

### 1. Presentation Layer (Frontend)

**Technology**: Next.js 16 (App Router)

**Responsibilities**:
- User interfaces
- Routing
- Data fetching
- Form handling
- State management

**Structure**:
```
/app/
├── layout.tsx          # Root layout
├── page.tsx            # Home page
├── components/         # Reusable UI components
├── hooks/              # Custom React hooks
└── lib/                # Utilities and API clients
```

### 2. Application Layer (Backend)

**Technology**: Express.js

**Responsibilities**:
- HTTP request routing
- Authentication & authorization
- Input validation
- Error handling

**Structure**:
```
src/
├── routes/             # API route definitions
├── controllers/        # Request handlers
├── middleware/         # Custom middleware
├── utils/              # Helper functions
└── app.js              # Express app configuration
```

### 3. Business Logic Layer (Services)

**Technology**: JavaScript modules

**Responsibilities**:
- Business rules
- Data processing
- External API integrations

**Structure**:
```
src/
├── services/           # All service modules
│   ├── authService.js
│   ├── jobService.js
│   ├── applicationService.js
│   ├── emailService.js
│   ├── fileUploadService.js
│   ├── analyticsService.js
│   ├── telegramBotService.js
│   └── ...
```

### 4. Data Access Layer (Models)

**Technology**: Mongoose ODM

**Responsibilities**:
- Schema definitions
- Database relationships
- Query building
- Indexes

**Structure**:
```
src/
├── models/
│   ├── User.js
│   ├── Company.js
│   ├── Job.js
│   ├── Application.js
│   ├── Category.js
│   ├── Skill.js
│   ├── ...
```

## Data Flow

### Request Flow

```
1. User Request →
2. Express Router →
3. Auth Middleware (JWT verification) →
4. Validation Middleware →
5. Controller →
6. Service →
7. Model →
8. Database →
9. Response back through chain
```

### Response Flow

```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed",
  "meta": { ... },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Database Design

### Key Collections

#### Users
```
users: {
  _id: ObjectId,
  email: String (unique),
  password: String (hashed),
  name: String,
  role: Enum (job_seeker, employer, admin),
  status: Enum (active, inactive, suspended),
  avatar: String,
  telegramId: String,
  telegramSubscribed: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

#### Companies
```
companies: {
  _id: ObjectId,
  ownerId: ObjectId (ref: User),
  name: String,
  email: String,
  description: String,
  location: String,
  size: Enum,
  industry: String,
  website: String,
  logo: String,
  isVerified: Boolean,
  subscription: {
    plan: Enum,
    status: String,
    startDate: Date,
    endDate: Date
  },
  createdAt: Date
}
```

#### Jobs
```
jobs: {
  _id: ObjectId,
  title: String,
  slug: String (unique),
  description: String,
  requirements: String,
  companyId: ObjectId (ref: Company),
  postedById: ObjectId (ref: User),
  categoryId: ObjectId (ref: Category),
  type: Enum,
  status: Enum,
  location: String,
  isRemote: Boolean,
  salaryMin: Number,
  salaryMax: Number,
  viewsCount: Number,
  applicationsCount: Number,
  createdAt: Date
}
```

#### Applications
```
applications: {
  _id: ObjectId,
  jobId: ObjectId (ref: Job),
  applicantId: ObjectId (ref: User),
  companyId: ObjectId (ref: Company),
  status: Enum,
  coverLetter: String,
  resume: String,
  statusHistory: [{
    status: Enum,
    changedBy: ObjectId,
    changedAt: Date,
    notes: String
  }],
  createdAt: Date
}
```

## Security

### Authentication Flow

1. User logs in with email/password
2. Backend verifies credentials
3. JWT token generated and returned
4. Token stored in localStorage
5. Included in subsequent requests
6. Middleware verifies token validity

### Authorization

- JWT middleware validates tokens
- Role-based access control (job_seeker, employer, admin)
- Resource ownership verification

### Data Protection

- Passwords hashed with bcrypt
- Sensitive data excluded from responses
- Input sanitization and validation
- Rate limiting on sensitive endpoints

## Performance Optimizations

### Caching

- HTTP caching for GET requests
- Cache-Control headers
- ETag support

### Database Indexes

- Compound indexes for frequent queries
- TTL indexes for automatic cleanup
- Sparse indexes for optional fields

### Compression

- GZIP compression for responses
- Compression threshold: 1KB

### Monitoring

- Response time tracking
- Error rate monitoring
- Database query performance

## External Services

| Service | Purpose | Integration |
|---------|---------|-------------|
| Cloudinary | File uploads | SDK |
| Nodemailer | Email sending | SMTP |
| Telegraf | Telegram bot | Bot API |
| Socket.IO | Real-time | WebSocket |

## Environment Configuration

```bash
# Development
NODE_ENV=development
PORT=5000

# Production
NODE_ENV=production
PORT=5000
```

## Error Handling

### Error Types

1. **ValidationError** - Invalid input
2. **NotFoundError** - Resource not found
3. **AppError** - Application errors
4. **CastError** - Invalid ObjectId

### Error Response Format

```json
{
  "success": false,
  "message": "Error description",
  "error": "Specific error",
  "stack": "Error stack (dev only)"
}
```

## Deployment Architecture

```
Internet
    │
    ▼
┌─────────────────┐
│   Load Balancer │
│    (Nginx)      │
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌─────────┐ ┌─────────┐
│Backend 1│ │Backend 2│
│(PM2)    │ │(PM2)    │
└────┬────┘ └────┬────┘
     │           │
     └─────┬─────┘
           ▼
    ┌─────────────┐
    │  MongoDB    │
    │   (Replica  │
    │   Set)      │
    └─────────────┘
```

## Scalability

### Horizontal Scaling

- Multiple backend instances behind load balancer
- Stateless application design
- Shared session storage (Redis if needed)

### Database Scaling

- MongoDB Atlas clusters
- Read replicas for analytics queries
- Sharding for large datasets

## Monitoring & Observability

### Metrics Collected

- Request count
- Response time
- Error rate
- Memory usage
- CPU usage

### Endpoints

- `GET /health` - Health check
- `GET /metrics` - Performance metrics