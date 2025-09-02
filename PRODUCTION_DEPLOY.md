# Production Deployment Guide

## Pre-Deployment Security Checklist

### ✅ Files to Include
- `backend/` (production code)
- `frontend/dist/` (built assets)
- `.env.example` files (as templates)
- Documentation files

### ❌ Files to Exclude
- `dev-tools/` directory
- All `.env` files with real values
- `node_modules/`
- Mock server files
- Development dependencies

## Deployment Steps

### 1. Clean Build
```bash
# Frontend
cd frontend
npm run build

# Backend  
cd backend
npm install --production
```

### 2. Environment Setup
```bash
# Copy templates
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Configure production values
# Edit .env files with production credentials
```

### 3. Security Verification
```bash
# Verify no dev-tools in build
ls -la | grep -v dev-tools

# Verify .env files are not included
find . -name ".env" -not -path "./*/node_modules/*"

# Check .gitignore compliance
git status --ignored
```

### 4. Deploy
```bash
# Upload only production files
rsync -av --exclude='dev-tools' --exclude='.env' ./

# Or use Docker
docker build -t saas-base .
```

## Environment Variables (Production)

### Required
- `JWT_SECRET` - Strong secret key
- `RAZORPAY_KEY_ID` - Production Razorpay key
- `RAZORPAY_KEY_SECRET` - Production Razorpay secret
- `RAZORPAY_WEBHOOK_SECRET` - Webhook secret
- `FRONTEND_URL` - Production frontend URL

### Database
- `DB_HOST` - Production database host
- `DB_USER` - Database user
- `DB_PASSWORD` - Database password
- `DB_NAME` - Database name

## Security Notes

1. **Never deploy dev-tools/**
2. **Use environment-specific .env files**
3. **Rotate secrets regularly**
4. **Enable HTTPS in production**
5. **Use production database**