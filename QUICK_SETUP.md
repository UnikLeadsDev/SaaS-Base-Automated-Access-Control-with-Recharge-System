# Quick Setup Guide

## Database Setup (MySQL)

### 1. Install MySQL
```bash
# Windows: Download from https://dev.mysql.com/downloads/mysql/
# Or use XAMPP/WAMP for easy setup
```

### 2. Create Database
```sql
-- Connect to MySQL as root (no password for local dev)
mysql -u root

-- Create database
CREATE DATABASE saas_base;

-- Create user (optional)
CREATE USER 'saas_user'@'localhost' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON saas_base.* TO 'saas_user'@'localhost';
FLUSH PRIVILEGES;
```

### 3. Update .env file
```env
# For root user with no password (local dev)
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=saas_base

# Or for custom user
DB_HOST=localhost
DB_USER=saas_user
DB_PASSWORD=password
DB_NAME=saas_base
```

### 4. Import Schema
```bash
cd backend
mysql -u root saas_base < database/schema.sql
```

## Quick Start (No Database)
The server will start without database connection for development. All features will work with mock data.

## Environment Variables Fixed
✅ SESSION_SECRET - Added to .env
✅ DB_PASSWORD - Set to empty for local development

## Next Steps
1. Install MySQL and create database
2. Update DB_PASSWORD in .env if needed
3. Import schema from database/schema.sql
4. Restart server with `npm run dev`