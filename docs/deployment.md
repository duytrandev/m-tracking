# Deployment Guide

**Version:** 1.0
**Last Updated:** 2026-01-18
**Status:** Active

---

## Overview

This guide covers deployment strategies for M-Tracking across different environments: local development, staging, and production.

**Architecture:**
- **Backend**: NestJS Monolith (Port 4000)
- **Analytics**: FastAPI Service (Port 5000)
- **Frontend**: Next.js Application (Port 3000)
- **Database**: Supabase PostgreSQL (managed)
- **Cache**: Redis 7 (self-hosted via Docker)

---

## Table of Contents

- [Local Development](#local-development)
- [Docker Deployment](#docker-deployment)
- [Production Deployment (AWS EC2)](#production-deployment-aws-ec2)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [CI/CD Pipeline](#cicd-pipeline)
- [Health Checks](#health-checks)
- [Monitoring & Logging](#monitoring--logging)
- [Rollback Strategy](#rollback-strategy)

---

## Local Development

### Prerequisites

- Node.js >= 20.10.0
- pnpm >= 8.0.0
- Python >= 3.12 with uv
- Docker Desktop
- Docker Compose

### Setup Steps

1. **Clone repository**:
   ```bash
   git clone <repository-url>
   cd m-tracking
   ```

2. **Install dependencies**:
   ```bash
   # Node.js dependencies
   pnpm install

   # Python dependencies (analytics service)
   cd services/analytics
   uv sync
   cd ../..
   ```

3. **Setup environment variables**:
   ```bash
   # Root environment
   cp .env.example .env

   # Backend service
   cp services/backend/.env.example services/backend/.env

   # Frontend app
   cp apps/frontend/.env.example apps/frontend/.env
   ```

4. **Start infrastructure** (PostgreSQL, Redis):
   ```bash
   pnpm run docker:up
   ```

5. **Run database migrations** (when available):
   ```bash
   pnpm run migrate
   ```

6. **Start development servers**:
   ```bash
   # All services
   pnpm run dev

   # Or individually
   pnpm run dev:backend    # NestJS on :4000
   pnpm run dev:analytics  # FastAPI on :5000
   pnpm run dev:frontend   # Next.js on :3000
   ```

### Accessing Services

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000
- **API Docs (Swagger)**: http://localhost:4000/api/docs
- **Analytics API**: http://localhost:5000
- **Analytics Docs**: http://localhost:5000/docs
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

---

## Docker Deployment

### Build Docker Images

```bash
# Build all services
docker compose build

# Build specific service
docker compose build backend
docker compose build analytics
docker compose build frontend
```

### Run with Docker Compose

```bash
# Start all services
docker compose up -d

# View logs
docker compose logs -f

# Stop services
docker compose down

# Stop and remove volumes (WARNING: deletes data)
docker compose down -v
```

### Docker Compose Configuration

The `docker-compose.yml` includes:

- **backend**: NestJS service (port 4000)
- **analytics**: FastAPI service (port 5000)
- **frontend**: Next.js app (port 3000)
- **postgres**: PostgreSQL 15 (port 5432)
- **redis**: Redis 7 (port 6379)

### Production Docker Build

```bash
# Build optimized production images
docker compose -f docker-compose.prod.yml build

# Run production stack
docker compose -f docker-compose.prod.yml up -d
```

---

## Production Deployment (AWS EC2)

### Infrastructure Requirements

**Recommended Setup (10K users):**
- **2x EC2 t3.medium** (4 vCPU, 4GB RAM each) - $120/month
- **Supabase Pro** (PostgreSQL + TimescaleDB) - $50/month
- **AWS ALB** (Application Load Balancer) - $20/month
- **CloudWatch** (monitoring) - $10/month
- **CloudFront** (CDN) - $5/month
- **Route 53** (DNS) - $2/month
- **Total**: ~$207/month (~$0.02/user/month)

### EC2 Setup

#### 1. Launch EC2 Instances

```bash
# Instance specifications
- AMI: Ubuntu 22.04 LTS
- Instance Type: t3.medium
- Storage: 50GB gp3 SSD
- Security Group: Allow ports 22, 80, 443, 4000, 5000
```

#### 2. SSH into EC2

```bash
ssh -i your-key.pem ubuntu@ec2-xx-xxx-xxx-xx.compute.amazonaws.com
```

#### 3. Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Node.js (for CLI tools)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install pnpm
npm install -g pnpm

# Logout and login to apply docker group
exit
```

#### 4. Deploy Application

```bash
# Clone repository
git clone <repository-url>
cd m-tracking

# Setup environment
cp .env.example .env
nano .env  # Edit with production values

cp services/backend/.env.example services/backend/.env
nano services/backend/.env

cp apps/frontend/.env.example apps/frontend/.env
nano apps/frontend/.env

# Build and start services
docker compose -f docker-compose.prod.yml up -d

# Verify services are running
docker compose ps
```

#### 5. Setup Nginx Reverse Proxy

```bash
# Install Nginx
sudo apt install nginx -y

# Configure Nginx
sudo nano /etc/nginx/sites-available/mtracking
```

**Nginx Configuration**:
```nginx
# Frontend
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Backend API
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Analytics API
server {
    listen 80;
    server_name analytics.yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/mtracking /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 6. Setup SSL with Let's Encrypt

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain SSL certificates
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com -d analytics.yourdomain.com

# Auto-renewal (cron job)
sudo systemctl enable certbot.timer
```

---

## Environment Variables

### Backend Service (.env)

```bash
# Application
NODE_ENV=production
PORT=4000
API_PREFIX=api

# Database (Supabase)
DATABASE_URL=postgresql://user:pass@host:5432/dbname
DATABASE_HOST=db.supabase.co
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=your-secure-password
DATABASE_NAME=mtracking

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password

# JWT
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Analytics Service
ANALYTICS_SERVICE_URL=http://localhost:5000

# CORS
CORS_ORIGIN=https://yourdomain.com

# External APIs
PLAID_CLIENT_ID=your-plaid-client-id
PLAID_SECRET=your-plaid-secret
PLAID_ENV=production
```

### Frontend App (.env)

```bash
# Environment
NEXT_PUBLIC_ENV=production

# API URLs
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_WS_URL=wss://api.yourdomain.com

# OAuth (if applicable)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-secret
```

### Analytics Service (.env)

```bash
# Environment
ENVIRONMENT=production

# Database
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# Redis
REDIS_URL=redis://localhost:6379

# LLM APIs
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key
```

---

## Database Setup

### Supabase Configuration

1. **Create Supabase Project**:
   - Go to https://supabase.com
   - Create new project
   - Note: Database URL, API keys

2. **Enable Extensions**:
   ```sql
   -- TimescaleDB for time-series data
   CREATE EXTENSION IF NOT EXISTS timescaledb;

   -- UUID support
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
   ```

3. **Run Migrations**:
   ```bash
   # From local machine
   pnpm run migrate:production

   # Or manually via psql
   psql $DATABASE_URL -f migrations/001_initial_schema.sql
   ```

### Backup Strategy

```bash
# Daily automated backups (cron job on EC2)
0 2 * * * pg_dump $DATABASE_URL > /backups/mtracking_$(date +\%Y\%m\%d).sql

# Weekly full backup
0 3 * * 0 pg_dump $DATABASE_URL | gzip > /backups/weekly/mtracking_$(date +\%Y\%m\%d).sql.gz

# Upload to S3
0 4 * * * aws s3 cp /backups/ s3://your-backup-bucket/ --recursive
```

---

## CI/CD Pipeline

### GitHub Actions Workflow

`.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: pnpm install
      - run: pnpm run lint
      - run: pnpm run test
      - run: pnpm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to EC2
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.EC2_HOST }}
          username: ubuntu
          key: ${{ secrets.EC2_SSH_KEY }}
          script: |
            cd /home/ubuntu/m-tracking
            git pull origin main
            docker compose -f docker-compose.prod.yml down
            docker compose -f docker-compose.prod.yml build
            docker compose -f docker-compose.prod.yml up -d
```

---

## Health Checks

### Backend Health Endpoint

```typescript
// src/health/health.controller.ts
@Get('health')
healthCheck() {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  };
}
```

### Monitoring Script

```bash
#!/bin/bash
# healthcheck.sh

# Check backend
curl -f http://localhost:4000/api/health || exit 1

# Check analytics
curl -f http://localhost:5000/health || exit 1

# Check Redis
redis-cli ping || exit 1

echo "All services healthy"
```

---

## Monitoring & Logging

### CloudWatch Setup

```bash
# Install CloudWatch agent on EC2
wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
sudo dpkg -i amazon-cloudwatch-agent.deb

# Configure CloudWatch
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
  -a fetch-config \
  -m ec2 \
  -s \
  -c file:/opt/aws/cloudwatch-config.json
```

### Application Logs

```bash
# View container logs
docker compose logs -f backend
docker compose logs -f analytics

# Export logs to file
docker compose logs --tail=1000 > logs/application.log
```

---

## Rollback Strategy

### Quick Rollback

```bash
# Rollback to previous Git commit
git log --oneline  # Find previous commit hash
git checkout <previous-commit-hash>

# Rebuild and restart
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d
```

### Database Rollback

```bash
# Restore from backup
psql $DATABASE_URL < /backups/mtracking_20260117.sql
```

---

## Troubleshooting

See [troubleshooting.md](./troubleshooting.md) for common deployment issues.

---

## Support

- **Deployment Issues**: Create GitHub issue
- **Infrastructure Questions**: See [infrastructure-architecture/index.md](./infrastructure-architecture/index.md)
- **Security Concerns**: See [SECURITY.md](../SECURITY.md)

---

**Last Updated:** 2026-01-18
