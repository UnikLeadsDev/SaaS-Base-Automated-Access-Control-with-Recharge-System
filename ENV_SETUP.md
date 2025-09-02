# Environment Variables Setup Guide

## Security Notice
⚠️ **NEVER commit actual environment variables to version control**
⚠️ **Always use .env.example files with placeholder values**

## Backend Environment Variables

### Required Variables (Application will not start without these)
```bash
# JWT Authentication
JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters

# Razorpay Payment Gateway
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_key

# Production Only - Frontend URL for CORS
FRONTEND_URL=https://yourdomain.com (required in production)
```

### Important Variables (Application will warn if missing)
```bash
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_NAME=saas_base
SESSION_SECRET=your_session_secret_different_from_jwt
```

### Optional Variables (Have fallback defaults)
```bash
# Database
DB_PASSWORD=your_mysql_password
DB_PORT=3306

# Server Configuration
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Pricing Configuration
BASIC_FORM_RATE=5
REALTIME_VALIDATION_RATE=50

# Notifications
MSG91_AUTH_KEY=your_msg91_key
EMAIL_USER=your_email@domain.com
EMAIL_PASS=your_email_password
```

## Frontend Environment Variables

### Required Variables
```bash
# API Configuration
VITE_API_URL=http://localhost:5000/api
```

### Optional Variables
```bash
# Authentication (if using Clerk)
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_key
```

## Setup Instructions

1. **Backend Setup:**
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with your actual values
   ```

2. **Frontend Setup:**
   ```bash
   cd frontend
   cp .env.example .env
   # Edit .env with your actual values
   ```

3. **Security Best Practices:**
   - Use strong, unique secrets for JWT_SECRET and SESSION_SECRET
   - Never use production credentials in development
   - Rotate secrets regularly in production
   - Use environment-specific configuration files

## Environment-Specific Configurations

### Development
- Use localhost URLs
- Enable debug logging
- Use test payment gateway keys
- CORS allows multiple localhost origins

### Production
- Use production domain URLs
- Disable debug logging
- Use production payment gateway keys
- Enable SSL/HTTPS
- Use secure session cookies
- **CORS restricted to single FRONTEND_URL only**
- **FRONTEND_URL is required in production**