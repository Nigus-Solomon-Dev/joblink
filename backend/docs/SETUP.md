# Developer Setup Guide

## Overview

This guide covers setting up a local development environment for JobLink.

## Prerequisites

- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **Git**: v2.0.0 or higher
- **MongoDB**: v6.0 or higher (local or Atlas)

## Installation

### 1. Clone Repository

```bash
git clone <repository-url>
cd joblink
```

### 2. Install Dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 3. Environment Configuration

#### Backend

```bash
cd backend
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Server
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/joblink

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# Cloudinary (optional)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Email (optional)
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=your-email@example.com
EMAIL_PASS=your-password
EMAIL_FROM=noreply@joblink.et
FRONTEND_URL=http://localhost:3000

# Telegram Bot (optional)
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_WEBHOOK_URL=http://localhost:5000/api/v1/telegram/webhook
```

#### Frontend

```bash
cd frontend
cp .env.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_WS_URL=ws://localhost:5000
```

### 4. Database Setup

#### Local MongoDB

```bash
# Start MongoDB
mongod --dbpath /data/db

# Or using Docker
docker run -d -p 27017:27017 --name mongodb mongo:6
```

#### MongoDB Atlas (Recommended)

1. Create account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Add IP address to whitelist
4. Create database user
5. Copy connection string to `MONGODB_URI`

## Running the Application

### Development Mode

```bash
# Terminal 1: Start backend
cd backend
npm run dev

# Terminal 2: Start frontend
cd frontend
npm run dev
```

### Production Mode

```bash
# Build frontend
cd frontend
npm run build

# Start backend
cd ../backend
npm start
```

## Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/health

## Project Structure

```
joblink/
├── backend/
│   ├── src/
│   │   ├── config/          # Configuration files
│   │   ├── constants/       # Application constants
│   │   ├── controllers/     # Request handlers
│   │   ├── middleware/      # Express middleware
│   │   ├── models/          # Mongoose models
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   ├── utils/           # Utility functions
│   │   └── server.js        # Server entry point
│   ├── test/                # Test files
│   ├── docs/                # Documentation
│   ├── package.json
│   └── jest.config.js
│
├── frontend/
│   ├── src/
│   │   ├── app/             # Next.js App Router
│   │   ├── components/      # React components
│   │   ├── hooks/           # Custom hooks
│   │   ├── lib/             # Utilities
│   │   └── styles/          # Global styles
│   ├── public/              # Static assets
│   ├── package.json
│   └── next.config.js
│
├── docs/                    # Project documentation
├── .env.example
├── ROADMAP.md
├── PROJECT.md
└── CURRENT_TASK.md
```

## API Endpoints (Development)

All endpoints return JSON responses:

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Health check |
| POST | /api/v1/auth/login | User login |
| POST | /api/v1/auth/register | User registration |
| GET | /api/v1/jobs | List jobs |
| POST | /api/v1/jobs | Create job |
| GET | /api/v1/jobs/:id | Get job details |

## Testing

### Run Tests

```bash
cd backend
npm test
```

### Run Tests with Coverage

```bash
npm run test:coverage
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

## Code Style

- Use meaningful variable and function names
- Follow existing patterns in the codebase
- Keep functions small and focused
- Use async/await for asynchronous operations
- Always use try/catch for error handling

## Git Workflow

```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes
git add .
git commit -m "feat: Add new feature"

# Push to remote
git push origin feature/new-feature

# Create pull request
```

## Common Issues

### Port Already in Use

```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Or change port in .env
PORT=5001
```

### MongoDB Connection Failed

1. Ensure MongoDB is running
2. Check MONGODB_URI in .env
3. Verify network connectivity

### CORS Errors

1. Check CORS_ORIGIN in backend .env
2. Ensure it matches frontend URL

### Email Not Sending

1. Check EMAIL_HOST, EMAIL_USER, EMAIL_PASS
2. Verify SMTP configuration
3. Check email provider allows connections

## Useful Commands

```bash
# Backend
npm run dev           # Development server
npm start             # Production server
npm test              # Run tests
npm run lint          # Check linting

# Frontend
npm run dev           # Development server
npm run build         # Production build
npm start             # Start production server

# Database
# Show all databases
mongosh --eval "show db()"

# Show collection
mongosh joblink --eval "db.jobs.find().pretty()"

# Drop collection
mongosh joblink --eval "db.jobs.drop()"
```

## Next Steps

1. Review the API documentation
2. Check the architecture documentation
3. Read the roadmap for upcoming features
4. Start building features based on CURRENT_TASK.md