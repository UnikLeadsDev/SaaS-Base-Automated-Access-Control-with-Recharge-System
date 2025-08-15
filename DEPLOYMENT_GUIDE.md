# SaaS Base - Complete Deployment Guide

## 🚀 System Overview

**SaaS Base** is a fully automated hybrid prepaid + subscription loan origination system with instant access control, zero manual intervention, and real-time payment processing.

### Key Features ✅
- **Instant Access Control**: Automatic blocking/unblocking based on wallet balance
- **Hybrid Payment Model**: Pay-per-form (₹5 basic, ₹50 realtime) + subscription options
- **Razorpay Integration**: Automated payment processing with webhooks
- **MSG91 Notifications**: SMS, WhatsApp, and email alerts
- **Real-time Validation**: Aadhaar, PAN, bank account verification
- **Automated Alerts**: Low balance and expiry notifications via cron jobs
- **RBAC**: Role-based access for DSA, NBFC, Co-op Bank users
- **Manual Payment Support**: Admin can update payments via transaction ID

## 📋 Prerequisites

### System Requirements
- **Node.js**: v18+ 
- **MySQL**: v8.0+
- **PM2**: For production deployment
- **SSL Certificate**: For HTTPS (recommended)

### Third-Party Services
- **Razorpay Account**: Payment gateway
- **MSG91 Account**: SMS/WhatsApp/Email notifications
- **AWS Account**: For hosting (optional)

## 🛠️ Installation Steps

### 1. Clone and Setup
```bash
git clone <your-repo-url>
cd "Saas - Internship"

# Backend setup
cd backend
npm install

# Frontend setup  
cd ../frontend
npm install
```

### 2. Database Setup
```bash
# Login to MySQL
mysql -u root -p

# Create database and import schema
source backend/database/schema.sql
```

### 3. Environment Configuration

Create `backend/.env`:
```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=saas_base

# JWT Secret (generate a strong secret)
JWT_SECRET=your_super_secret_jwt_key_here

# Razorpay Configuration
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

# MSG91 Configuration
MSG91_AUTH_KEY=your_msg91_auth_key
MSG91_TEMPLATE_ID=your_template_id
MSG91_WHATSAPP_NUMBER=your_whatsapp_number
FROM_EMAIL=noreply@yourdomain.com

# Server Configuration
PORT=5000
NODE_ENV=production
FRONTEND_URL=http://localhost:3000

# Form Pricing (in INR)
BASIC_FORM_RATE=5
REALTIME_VALIDATION_RATE=50

# Alert Thresholds
LOW_BALANCE_THRESHOLD=100
EXPIRY_ALERT_DAYS=7
```

### 4. Razorpay Setup

1. **Create Razorpay Account**: https://razorpay.com
2. **Get API Keys**: Dashboard → Settings → API Keys
3. **Setup Webhooks**: 
   - URL: `https://yourdomain.com/api/payment/webhook`
   - Events: `payment.captured`, `payment.failed`
   - Secret: Generate and add to `.env`

### 5. MSG91 Setup

1. **Create MSG91 Account**: https://msg91.com
2. **Get Auth Key**: Dashboard → API Keys
3. **Setup Templates**: Create SMS templates for notifications
4. **WhatsApp Setup**: Enable WhatsApp API if needed

## 🚀 Deployment Options

### Option 1: Local Development
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

### Option 2: Production with PM2
```bash
# Install PM2 globally
npm install -g pm2

# Start backend with PM2
cd backend
pm2 start ecosystem.config.js --env production

# Build and serve frontend
cd ../frontend
npm run build
# Serve build folder with nginx or serve
```

### Option 3: AWS Deployment

#### EC2 Setup
```bash
# Launch EC2 instance (Ubuntu 20.04+)
# Install Node.js, MySQL, PM2, Nginx

# Clone repository
git clone <your-repo>
cd "Saas - Internship"

# Setup as above
# Configure nginx reverse proxy
```

#### Nginx Configuration
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
    # Frontend
    location / {
        root /path/to/frontend/dist;
        try_files $uri $uri/ /index.html;
    }
    
    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🔧 Configuration Details

### Database Schema
The system uses 8 main tables:
- `users`: User accounts with roles
- `wallets`: Balance and subscription tracking  
- `transactions`: All payment/deduction records
- `applications`: Form submissions
- `notifications`: Alert history
- `subscriptions`: Subscription plans
- `support_tickets`: Help desk
- `invoices`: Billing records

### Access Control Flow
1. **User Login** → JWT token issued
2. **Form Access** → Middleware checks:
   - Valid JWT token
   - Active user status
   - Subscription OR sufficient wallet balance
3. **Form Submission** → Atomic transaction:
   - Deduct from wallet (if prepaid)
   - Store application
   - Send confirmation

### Payment Flow
1. **User Initiates** → Frontend calls create-order API
2. **Razorpay Checkout** → User completes payment
3. **Webhook Received** → Instant wallet update
4. **Notification Sent** → SMS/Email confirmation

### Automated Alerts
- **Cron Job**: Runs every hour
- **Low Balance**: When balance < threshold
- **Expiry Alert**: N days before subscription ends
- **Channels**: SMS + Email simultaneously

## 🔒 Security Features

### Implemented
- ✅ JWT Authentication
- ✅ Input Sanitization  
- ✅ SQL Injection Prevention
- ✅ XSS Protection
- ✅ Webhook Signature Verification
- ✅ Rate Limiting (via middleware)
- ✅ Environment Variable Protection

### Recommended Additions
- CSRF Protection (implement csrf middleware)
- API Rate Limiting (express-rate-limit)
- Request Validation (express-validator)
- HTTPS Enforcement
- Database Connection Encryption

## 📊 Monitoring & Maintenance

### Health Checks
```bash
# API Health
curl http://localhost:5000/health

# Database Connection
curl http://localhost:5000/api/auth/test
```

### Log Monitoring
```bash
# PM2 Logs
pm2 logs

# Application Logs
tail -f backend/logs/app.log
```

### Database Maintenance
```sql
-- Check wallet balances
SELECT u.name, w.balance, w.status FROM users u JOIN wallets w ON u.user_id = w.user_id;

-- Transaction summary
SELECT DATE(date) as day, SUM(amount) as total, type FROM transactions GROUP BY DATE(date), type;

-- Active subscriptions
SELECT u.name, s.plan_name, s.end_date FROM users u JOIN subscriptions s ON u.user_id = s.user_id WHERE s.status = 'active';
```

## 🐛 Troubleshooting

### Common Issues

**1. Payment Webhook Not Working**
- Check webhook URL is accessible
- Verify webhook secret matches
- Check Razorpay dashboard for failed webhooks

**2. Notifications Not Sending**
- Verify MSG91 credentials
- Check template IDs
- Ensure mobile numbers are in correct format

**3. Database Connection Errors**
- Check MySQL service status
- Verify connection credentials
- Check firewall settings

**4. Frontend API Calls Failing**
- Check CORS configuration
- Verify API endpoints
- Check network connectivity

### Debug Commands
```bash
# Check PM2 status
pm2 status

# View application logs
pm2 logs saas-base

# Restart application
pm2 restart saas-base

# Check database connection
mysql -u root -p -e "SELECT 1"
```

## 📈 Scaling Considerations

### Performance Optimization
- Database indexing on frequently queried columns
- Redis caching for session management
- CDN for static assets
- Load balancing for multiple instances

### High Availability
- Database replication (Master-Slave)
- Multiple EC2 instances with load balancer
- Automated backups and disaster recovery
- Health check monitoring with alerts

## 🔄 Backup Strategy

### Database Backup
```bash
# Daily backup script
mysqldump -u root -p saas_base > backup_$(date +%Y%m%d).sql

# Automated backup with cron
0 2 * * * /path/to/backup_script.sh
```

### File Backup
- Application code (Git repository)
- Environment files (secure storage)
- SSL certificates
- Log files (if needed)

## 📞 Support & Maintenance

### Regular Tasks
- Monitor system health daily
- Review transaction logs weekly  
- Update dependencies monthly
- Security patches as needed
- Database optimization quarterly

### Emergency Contacts
- Database Admin: [contact]
- DevOps Team: [contact]  
- Payment Gateway Support: Razorpay
- Notification Service: MSG91

---

## 🎯 Quick Start Checklist

- [ ] Clone repository
- [ ] Install dependencies (backend + frontend)
- [ ] Setup MySQL database
- [ ] Configure environment variables
- [ ] Setup Razorpay account and webhooks
- [ ] Setup MSG91 account and templates
- [ ] Test payment flow
- [ ] Test notification system
- [ ] Deploy to production
- [ ] Setup monitoring and alerts
- [ ] Configure automated backups

**Your SaaS Base system is now ready for production! 🚀**