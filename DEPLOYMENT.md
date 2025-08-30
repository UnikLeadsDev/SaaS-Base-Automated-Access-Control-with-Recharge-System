# Deployment Guide

## 🚀 Render Deployment (Recommended)

### Backend Deployment on Render

1. **Create Render Account**: Sign up at [render.com](https://render.com)

2. **Connect GitHub**: Link your GitHub repository

3. **Create Web Service**:
   - Service Type: Web Service
   - Repository: Your GitHub repo
   - Root Directory: `backend`
   - Environment: Node
   - Build Command: `npm install`
   - Start Command: `npm start`

4. **Environment Variables** (Add in Render Dashboard):
   ```
   NODE_ENV=production
   DB_HOST=your-mysql-host
   DB_USER=your-mysql-user
   DB_PASSWORD=your-mysql-password
   DB_NAME=saas_base
   JWT_SECRET=your-jwt-secret
   RAZORPAY_KEY_ID=your-razorpay-key
   RAZORPAY_KEY_SECRET=your-razorpay-secret
   MSG91_AUTH_KEY=438526AUfQIwYfEzQo68a75157P1
   FRONTEND_URL=https://your-frontend-url.netlify.app
   ```

### Frontend Deployment on Netlify

1. **Create Netlify Account**: Sign up at [netlify.com](https://netlify.com)

2. **Deploy from GitHub**:
   - Connect GitHub repository
   - Base directory: `frontend`
   - Build command: `npm run build`
   - Publish directory: `dist`

3. **Environment Variables**:
   ```
   VITE_API_URL=https://your-backend-url.onrender.com/api
   ```

## ☁️ AWS Deployment

### Database Setup (AWS RDS)

1. **Create RDS MySQL Instance**:
   - Engine: MySQL 8.0
   - Instance Class: db.t3.micro (free tier)
   - Storage: 20GB
   - Enable public access for initial setup

2. **Run Database Script**:
   ```bash
   mysql -h your-rds-endpoint.amazonaws.com -u admin -p saas_base < backend/database/deploy.sql
   ```

### Backend Deployment (AWS ECS/Fargate)

1. **Build and Push Docker Image**:
   ```bash
   cd backend
   docker build -t saas-base-backend .
   docker tag saas-base-backend:latest your-ecr-repo-uri:latest
   docker push your-ecr-repo-uri:latest
   ```

2. **Create ECS Service**:
   - Task Definition: Use your Docker image
   - Service: Fargate launch type
   - Load Balancer: Application Load Balancer

### Frontend Deployment (AWS S3 + CloudFront)

1. **Build Frontend**:
   ```bash
   cd frontend
   npm run build
   ```

2. **Upload to S3**:
   ```bash
   aws s3 sync dist/ s3://your-organization-saas-frontend-prod --delete
   ```

3. **Configure CloudFront**:
   - Origin: Your S3 bucket
   - Default Root Object: index.html
   - Error Pages: 404 → /index.html (for SPA routing)

## 🔧 Environment Variables

### Backend (.env)
```env
NODE_ENV=production
PORT=5000
DB_HOST=your-database-host
DB_USER=your-database-user
DB_PASSWORD=your-database-password
DB_NAME=saas_base
JWT_SECRET=your-jwt-secret
RAZORPAY_KEY_ID=your-razorpay-key
RAZORPAY_KEY_SECRET=your-razorpay-secret
MSG91_AUTH_KEY=438526AUfQIwYfEzQo68a75157P1
FRONTEND_URL=https://your-frontend-domain.com
```

### Frontend (.env)
```env
VITE_API_URL=https://your-backend-domain.com/api
```

## 📋 Pre-Deployment Checklist

- [ ] Database schema deployed
- [ ] Environment variables configured
- [ ] CORS origins updated
- [ ] Razorpay keys (live/test) configured
- [ ] MSG91 integration tested
- [ ] SSL certificates configured
- [ ] Domain names configured
- [ ] Health checks working

## 🔍 Post-Deployment Testing

1. **Health Check**: `GET /health`
2. **User Registration**: Test SMS notifications
3. **Payment Flow**: Test Razorpay integration
4. **Form Submission**: Test wallet deduction
5. **Admin Panel**: Verify admin access

## 🚨 Security Notes

- Use strong JWT secrets in production
- Enable HTTPS only
- Configure proper CORS origins
- Use environment variables for all secrets
- Enable database SSL connections
- Set up monitoring and logging