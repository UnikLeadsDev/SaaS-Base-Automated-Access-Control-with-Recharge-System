# SaaS Base – Automated Access Control with Recharge System

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen)](https://nodejs.org/)
[![React Version](https://img.shields.io/badge/react-18.3.1-blue)](https://reactjs.org/)
[![MySQL](https://img.shields.io/badge/mysql-8.0+-orange)](https://www.mysql.com/)

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Installation](#installation)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Environment Variables](#environment-variables)
- [Usage](#usage)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

## 🚀 Overview

A fully automated hybrid prepaid + subscription system for loan origination with instant access control based on payment status. The system provides real-time wallet management, automated billing, and role-based access control for financial service providers.

### Key Benefits
- **Zero Manual Intervention** - Instant activation/deactivation based on payment status
- **Real-time Access Control** - Blocks form submissions when balance reaches zero
- **Atomic Transactions** - Prevents billing disputes with rollback protection
- **Multi-channel Notifications** - SMS, WhatsApp, and Email alerts
- **Scalable Architecture** - Ready for enterprise deployment

## ✨ Features

### Core System
- ✅ JWT Authentication with role-based access (DSA, NBFC, Co-op, Admin)
- ✅ Instant access control middleware
- ✅ Atomic wallet transactions with rollback protection
- ✅ Pay-per-form model: Basic (₹5), Realtime Validation (₹50)
- ✅ Subscription model with unlimited access
- ✅ Razorpay payment gateway integration
- ✅ MSG91 multi-channel notifications
- ✅ Automated cron alerts for low balance & expiry
- ✅ Complete admin dashboard

### Security Features
- 🔐 JWT token authentication
- 🔐 HMAC webhook verification
- 🔐 Role-based access control (RBAC)
- 🔐 SQL injection protection
- 🔐 Input validation & sanitization

## 🛠 Tech Stack

### Backend
- **Runtime**: Node.js 16+
- **Framework**: Express.js 5.1.0
- **Database**: MySQL 8.0+
- **Authentication**: JWT (jsonwebtoken)
- **Payment**: Razorpay SDK
- **Notifications**: MSG91 API
- **Security**: bcryptjs, CORS
- **Scheduling**: node-cron

### Frontend
- **Framework**: React 18.3.1
- **Routing**: React Router DOM 6.8.1
- **Styling**: Tailwind CSS 3.4.17
- **HTTP Client**: Axios 1.6.2
- **Icons**: Lucide React
- **Notifications**: React Hot Toast
- **Build Tool**: Vite 7.1.2

### Database
- **Primary**: MySQL 8.0+
- **ORM**: Native MySQL2 driver
- **Migration**: SQL schema files

## 🏗 Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Client  │────│   Express API   │────│   MySQL DB      │
│   (Frontend)    │    │   (Backend)     │    │   (Database)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐              │
         │              │   Razorpay      │              │
         └──────────────│   (Payments)    │──────────────┘
                        └─────────────────┘
                        ┌─────────────────┐
                        │   MSG91         │
                        │   (Notifications)│
                        └─────────────────┘
```

## 📦 Installation

### Prerequisites
- Node.js 16+ and npm
- MySQL 8.0+
- Git

### 1. Clone Repository
```bash
git clone https://github.com/UnikLeadsDev/SaaS-Base-Automated-Access-Control-with-Recharge-System.git
cd SaaS-Base-Automated-Access-Control-with-Recharge-System
```

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Configure your .env file (see Environment Variables section)
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### 4. Database Setup
```bash
# Create database
mysql -u root -p -e "CREATE DATABASE saas_base;"

# Import schema
mysql -u root -p saas_base < backend/database/schema.sql
```

## 📚 API Documentation

### Base URL
```
Development: http://localhost:5000/api
Production: https://your-domain.com/api
```

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "9876543210",
  "role": "DSA"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "token": "jwt_token_here",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "DSA"
  }
}
```

#### Login User
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

### Wallet Endpoints

#### Get Wallet Balance
```http
GET /api/wallet/balance
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "balance": 500.00,
  "currency": "INR"
}
```

#### Get Transaction History
```http
GET /api/wallet/transactions?page=1&limit=10
Authorization: Bearer <jwt_token>
```

### Payment Endpoints

#### Create Razorpay Order
```http
POST /api/payment/create-order
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "amount": 1000,
  "currency": "INR"
}
```

**Response:**
```json
{
  "success": true,
  "orderId": "order_xyz123",
  "amount": 1000,
  "currency": "INR",
  "key": "rzp_test_key"
}
```

#### Verify Payment
```http
POST /api/payment/verify
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "razorpay_order_id": "order_xyz123",
  "razorpay_payment_id": "pay_abc456",
  "razorpay_signature": "signature_hash"
}
```

#### Webhook Handler
```http
POST /api/payment/webhook
X-Razorpay-Signature: <webhook_signature>
Content-Type: application/json

{
  "event": "payment.captured",
  "payload": {
    "payment": {
      "entity": {
        "id": "pay_abc456",
        "amount": 100000,
        "status": "captured"
      }
    }
  }
}
```

### Form Submission Endpoints

#### Submit Basic Form
```http
POST /api/forms/basic
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "applicantName": "John Doe",
  "loanAmount": 100000,
  "purpose": "Business",
  "documents": ["aadhaar", "pan"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Form submitted successfully",
  "applicationId": "APP123456",
  "amountDeducted": 5,
  "remainingBalance": 495
}
```

#### Submit Realtime Validation Form
```http
POST /api/forms/realtime
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "applicantName": "John Doe",
  "aadhaarNumber": "1234-5678-9012",
  "panNumber": "ABCDE1234F",
  "bankAccount": "1234567890",
  "loanAmount": 500000
}
```

### Admin Endpoints

#### Get Dashboard Stats
```http
GET /api/admin/stats
Authorization: Bearer <admin_jwt_token>
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalUsers": 150,
    "activeUsers": 120,
    "totalRevenue": 25000,
    "monthlyRevenue": 5000,
    "totalTransactions": 500,
    "pendingTickets": 5
  }
}
```

#### Get All Users
```http
GET /api/admin/users?page=1&limit=10&role=DSA&status=active
Authorization: Bearer <admin_jwt_token>
```

#### Manual Payment Update
```http
POST /api/payment/manual-update
Authorization: Bearer <admin_jwt_token>
Content-Type: application/json

{
  "userId": 123,
  "amount": 1000,
  "type": "credit",
  "description": "Manual recharge by admin"
}
```

### Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error information"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden (Insufficient balance/permissions)
- `404` - Not Found
- `500` - Internal Server Error

## 🗄 Database Schema

### Core Tables

#### users
```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  role ENUM('DSA', 'NBFC', 'Co-op', 'Admin') DEFAULT 'DSA',
  status ENUM('active', 'inactive', 'blocked') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### wallets
```sql
CREATE TABLE wallets (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  balance DECIMAL(10,2) DEFAULT 0.00,
  currency VARCHAR(3) DEFAULT 'INR',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

#### transactions
```sql
CREATE TABLE transactions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  wallet_id INT NOT NULL,
  type ENUM('credit', 'debit') NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  reference_id VARCHAR(255),
  status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (wallet_id) REFERENCES wallets(id) ON DELETE CASCADE
);
```

## 🔧 Environment Variables

Create a `.env` file in the backend directory:

```env
# Database Configuration
DB_HOST=127.0.0.1
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=saas_base

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here_2024

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
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Pricing Configuration (in INR)
BASIC_FORM_RATE=5
REALTIME_VALIDATION_RATE=50

# Alert Thresholds
LOW_BALANCE_THRESHOLD=100
EXPIRY_ALERT_DAYS=7

#email credentials
EMAIL_USER=organization_email
EMAIL_PASS=organization_Email_passkey
```

## 🚀 Usage

### For DSA/NBFC Users
1. **Register/Login** to access the dashboard
2. **Recharge Wallet** using Razorpay integration
3. **Submit Forms** - Basic (₹5) or Realtime Validation (₹50)
4. **Monitor Balance** - Real-time updates after each transaction
5. **Receive Alerts** - Low balance and expiry notifications

### For Admins
1. **Access Admin Panel** with admin credentials
2. **Monitor Users** - View all registered users and their status
3. **Manual Recharge** - Add credits to user wallets
4. **View Analytics** - Dashboard with revenue and usage stats
5. **Manage Support** - Handle user tickets and queries

## 🌐 Deployment

### Production Deployment

#### 1. Server Setup (Ubuntu/CentOS)
```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install MySQL
sudo apt-get install mysql-server

# Install PM2 for process management
npm install -g pm2
```

#### 2. Application Deployment
```bash
# Clone and setup
git clone <repository-url>
cd SaaS-Base-Automated-Access-Control-with-Recharge-System

# Backend deployment
cd backend
npm install --production
cp .env.example .env
# Configure production environment variables
pm2 start ecosystem.config.js

# Frontend deployment
cd ../frontend
npm install
npm run build
# Serve build files using nginx or apache
```

#### 3. Database Setup
```bash
mysql -u root -p -e "CREATE DATABASE saas_base;"
mysql -u root -p saas_base < backend/database/schema.sql
```

#### 4. Nginx Configuration
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

### Docker Deployment

#### docker-compose.yml
```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
    depends_on:
      - mysql

  frontend:
    build: ./frontend
    ports:
      - "80:80"

  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: rootpassword
      MYSQL_DATABASE: saas_base
    volumes:
      - mysql_data:/var/lib/mysql
      - ./backend/database/schema.sql:/docker-entrypoint-initdb.d/schema.sql

volumes:
  mysql_data:
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines
- Follow ESLint configuration
- Write unit tests for new features
- Update documentation for API changes
- Ensure backward compatibility

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support and queries:
- Email: support@yourdomain.com
- Documentation: [Wiki](https://github.com/UnikLeadsDev/SaaS-Base-Automated-Access-Control-with-Recharge-System/wiki)
- Issues: [GitHub Issues](https://github.com/UnikLeadsDev/SaaS-Base-Automated-Access-Control-with-Recharge-System/issues)

---

**Built with ❤️ for the fintech industry**
