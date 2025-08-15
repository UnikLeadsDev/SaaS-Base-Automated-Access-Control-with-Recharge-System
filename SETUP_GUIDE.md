# SaaS Base - Setup Guide

## System Overview
Fully automated hybrid prepaid + subscription SaaS loan origination system with instant access control based on payment status.

## Features
- **Instant Access Control**: Zero manual intervention - access granted/blocked based on payment status
- **Hybrid Payment Model**: Pay-per-form (₹5 basic, ₹50 realtime validation) + subscription options
- **Real-time Notifications**: SMS/WhatsApp/Email alerts via MSG91
- **Automated Billing**: Razorpay integration with webhook support
- **Role-based Access**: DSA, NBFC, Co-op Bank specific features
- **Atomic Transactions**: Secure wallet operations with rollback support

## Prerequisites
- Node.js 18+
- MySQL 8.0+
- Razorpay Account
- MSG91 Account

## Installation

### 1. Database Setup
```sql
-- Run the schema file
mysql -u root -p < backend/database/schema.sql
```

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Configure your .env file (see below)
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## Environment Configuration

### Backend (.env)
```env
# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=saas_base

# JWT
JWT_SECRET=your_super_secret_jwt_key_here

# Razorpay
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

# MSG91
MSG91_AUTH_KEY=your_msg91_auth_key
MSG91_TEMPLATE_ID=your_template_id
MSG91_WHATSAPP_NUMBER=your_whatsapp_number
FROM_EMAIL=noreply@yourdomain.com

# Server
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Pricing
BASIC_FORM_RATE=5
REALTIME_VALIDATION_RATE=50

# Alerts
LOW_BALANCE_THRESHOLD=100
EXPIRY_ALERT_DAYS=7
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Wallet Management
- `GET /api/wallet/balance` - Get wallet balance
- `GET /api/wallet/balance-check` - Real-time balance check
- `GET /api/wallet/transactions` - Transaction history

### Payment Processing
- `POST /api/payment/create-order` - Create Razorpay order
- `POST /api/payment/verify` - Verify payment
- `POST /api/payment/webhook` - Razorpay webhook handler
- `POST /api/payment/manual-update` - Manual payment update (admin)

### Form Submission
- `POST /api/forms/basic` - Submit basic loan form (₹5)
- `POST /api/forms/realtime` - Submit realtime validation form (₹50)
- `GET /api/forms/applications` - Get user applications

## System Flow

1. **User Registration** → Automatic wallet creation
2. **Login** → JWT token generation
3. **Access Check** → Middleware validates balance/subscription
4. **Form Submission** → Atomic wallet deduction + application storage
5. **Payment** → Razorpay integration + instant wallet update
6. **Notifications** → Automated alerts for low balance/expiry

## Automated Features

### Access Control
- Instant blocking when balance < form rate
- Real-time balance validation before form submission
- Subscription vs prepaid model support

### Payment Processing
- Razorpay webhook for instant updates
- Manual payment option for admins
- Atomic transaction handling

### Notifications
- Hourly cron job for balance/expiry checks
- SMS/WhatsApp/Email via MSG91
- Payment confirmation alerts

## Security Features
- JWT authentication
- HMAC webhook verification
- SQL injection protection
- Role-based access control
- Atomic database transactions

## Deployment

### AWS Deployment
1. **EC2**: Backend API server
2. **RDS**: MySQL database
3. **S3**: Document storage
4. **CloudWatch**: Monitoring and logs

### Production Checklist
- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] SSL certificates installed
- [ ] Webhook URLs updated in Razorpay
- [ ] MSG91 production credentials
- [ ] Monitoring setup
- [ ] Backup strategy implemented

## Troubleshooting

### Common Issues
1. **Payment not updating**: Check webhook URL and signature
2. **SMS not sending**: Verify MSG91 credentials and template
3. **Access denied**: Check wallet balance and user status
4. **Database errors**: Verify connection and schema

### Logs
- Server logs: `console.log` outputs
- Payment logs: Razorpay dashboard
- SMS logs: MSG91 dashboard

## Support
For technical support, create a ticket through the support system or contact the development team.