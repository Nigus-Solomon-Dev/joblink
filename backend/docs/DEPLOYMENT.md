# JobLink Deployment Guide

## Overview

This document provides instructions for deploying JobLink to production environments.

## Prerequisites

- Node.js 18+ installed
- MongoDB 6+ instance (local or Atlas)
- Cloudinary account
- Email service credentials
- Domain name (optional)

## Environment Setup

### Required Environment Variables

```bash
# Server
PORT=5000
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/joblink
JWT_SECRET=<your-secret-key>
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=https://yourdomain.com

# Cloudinary
CLOUDINARY_CLOUD_NAME=<your-cloud-name>
CLOUDINARY_API_KEY=<your-api-key>
CLOUDINARY_API_SECRET=<your-api-secret>

# Email
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=<your-email>
EMAIL_PASS=<your-password>
EMAIL_FROM=noreply@yourdomain.com
FRONTEND_URL=https://yourdomain.com

# Telegram Bot (optional)
TELEGRAM_BOT_TOKEN=<your-bot-token>
TELEGRAM_WEBHOOK_URL=https://yourdomain.com/api/v1/telegram/webhook
```

## Deployment Steps

### 1. Build the Application

```bash
# Navigate to backend
cd backend

# Install dependencies
npm ci --only=production

# Build (if using TypeScript)
npm run build
```

### 2. Start the Server

```bash
# Using PM2 for process management
npm install -g pm2
pm2 start src/server.js --name joblink-backend

# Or using systemd
sudo systemctl start joblink
```

### 3. Set Up Database Indexes

Indexes are automatically created on first run. For existing databases:

```javascript
// Run in MongoDB shell or via script
db.applications.createIndexes([
  { jobId: 1, applicantId: 1 }, { unique: true },
  { jobId: 1, status: 1 },
  { applicantId: 1, status: 1 },
  { companyId: 1, status: 1 }
])
```

### 4. Configure SSL

Use Let's Encrypt with Certbot:

```bash
sudo certbot --nginx -d yourdomain.com
```

### 5. Configure Reverse Proxy

Nginx configuration example:

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;
    
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location /socket.io/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

### 6. Deploy Frontend

```bash
# Navigate to frontend
cd frontend

# Build
npm run build

# Deploy to Vercel, Netlify, or your server
```

## Monitoring

### Health Check

```bash
curl https://yourdomain.com/health
```

Expected response:
```json
{
  "success": true,
  "message": "JobLink API is running",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "production"
}
```

### Metrics Endpoint

```bash
curl https://yourdomain.com/metrics
```

## Scaling

### Horizontal Scaling

Use a load balancer in front of multiple backend instances:

```bash
pm2 scale joblink-backend 3
```

### Database Scaling

Consider MongoDB Atlas for automatic scaling:
- Cluster tier selection based on traffic
- Read replicas for heavy read workloads
- Sharding for very large datasets

## Security Considerations

1. **Keep Node.js updated** - Regular security patches
2. **Use environment variables** - Never commit secrets
3. **Enable rate limiting** - Protects against abuse
4. **Use HTTPS** - Encrypt all traffic
5. **Regular backups** - Database backup schedule
6. **Update dependencies** - Run `npm audit` regularly

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check MONGODB_URI is correct
   - Verify network connectivity
   - Check MongoDB Atlas IP whitelist

2. **Email Not Sending**
   - Verify EMAIL_HOST, EMAIL_USER, EMAIL_PASS
   - Check SMTP server allows connections
   - Verify FRONTEND_URL is correct

3. **File Upload Failing**
   - Verify Cloudinary credentials
   - Check CLOUDINARY_CLOUD_NAME
   - Verify account has upload capabilities

### Logs

PM2 logs:
```bash
pm2 logs joblink-backend
```

Systemd logs:
```bash
journalctl -u joblink -f
```

## Backup Strategy

### Database Backup

```bash
# Manual backup
mongodump --uri "mongodb+srv://..." --out /path/to/backup

# Restore backup
mongorestore --uri "mongodb+srv://..." /path/to/backup
```

### Automated Backups

Use MongoDB Atlas backup service or cron job:

```bash
# Daily backup at 2am
0 2 * * * /usr/bin/mongodump --uri "mongodb+srv://..." --out /backup/%Y-%m-%d
```