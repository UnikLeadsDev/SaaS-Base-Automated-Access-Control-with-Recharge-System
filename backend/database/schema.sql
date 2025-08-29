-- SaaS Base Database Schema
CREATE DATABASE IF NOT EXISTS saas_base;
USE saas_base;

-- Users table
CREATE TABLE users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    mobile VARCHAR(15),
    password VARCHAR(255) NOT NULL,
    role ENUM('DSA', 'NBFC', 'Co-op', 'admin') NOT NULL,
    status ENUM('active', 'blocked') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Wallets table
CREATE TABLE wallets (
    wallet_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL UNIQUE,
    balance DECIMAL(10,2) DEFAULT 0.00 CHECK (balance >= 0),
    valid_until DATE NULL,
    status ENUM('active', 'expired') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Transactions table
CREATE TABLE transactions (
    txn_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    type ENUM('credit', 'debit') NOT NULL,
    payment_mode VARCHAR(50) DEFAULT 'razorpay',
    txn_ref VARCHAR(255) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_user_date (user_id, created_at),
    INDEX idx_txn_ref (txn_ref)
);

-- Applications table
CREATE TABLE applications (
    app_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    form_type ENUM('basic', 'realtime_validation') NOT NULL,
    amount_charged DECIMAL(10,2) NOT NULL CHECK (amount_charged >= 0),
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_user_submitted (user_id, submitted_at)
);

-- Notifications table
CREATE TABLE notifications (
    notif_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    channel ENUM('sms', 'whatsapp', 'email') NOT NULL,
    message_type ENUM('expiry_alert', 'low_balance', 'payment_success') NOT NULL,
    message TEXT NOT NULL,
    status ENUM('sent', 'failed') DEFAULT 'sent',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_user_created (user_id, created_at)
);

-- Notification queue for reliable delivery
CREATE TABLE notification_queue (
    queue_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    channel ENUM('sms', 'whatsapp', 'email') NOT NULL,
    message_type VARCHAR(50) NOT NULL,
    recipient VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    template_id VARCHAR(100),
    status ENUM('pending', 'processing', 'sent', 'failed') DEFAULT 'pending',
    retry_count INT DEFAULT 0,
    max_retries INT DEFAULT 3,
    next_retry_at TIMESTAMP NULL,
    sent_at TIMESTAMP NULL,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_status_retry (status, next_retry_at),
    INDEX idx_user_type (user_id, message_type)
);

-- Subscription plans metadata
CREATE TABLE subscription_plans (
    plan_id INT PRIMARY KEY AUTO_INCREMENT,
    plan_name VARCHAR(100) UNIQUE NOT NULL,
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    duration_days INT NOT NULL CHECK (duration_days > 0),
    grace_period_days INT DEFAULT 7 CHECK (grace_period_days >= 0),
    basic_form_rate DECIMAL(10,2) DEFAULT 0.00,
    realtime_form_rate DECIMAL(10,2) DEFAULT 0.00,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default plans
INSERT INTO subscription_plans (plan_name, amount, duration_days, grace_period_days, basic_form_rate, realtime_form_rate) VALUES
('Basic Monthly', 999.00, 30, 7, 0.00, 0.00),
('Premium Monthly', 1999.00, 30, 7, 0.00, 0.00),
('Basic Yearly', 9999.00, 365, 15, 0.00, 0.00);

-- Subscriptions table for subscription model
CREATE TABLE subscriptions (
    sub_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    plan_id INT NOT NULL,
    plan_name VARCHAR(100) NOT NULL,
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    grace_end_date DATE,
    status ENUM('active', 'expired', 'cancelled', 'grace') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (plan_id) REFERENCES subscription_plans(plan_id),
    INDEX idx_user_end_date (user_id, end_date),
    INDEX idx_status_end_date (status, end_date)
);

-- Support tickets table
CREATE TABLE support_tickets (
    ticket_id INT PRIMARY KEY AUTO_INCREMENT,
    category VARCHAR(100) NULL,
    user_id INT NOT NULL,
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status ENUM('open', 'in_progress', 'resolved', 'closed') DEFAULT 'open',
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE
);
-- Receipts table
CREATE TABLE receipts (
    receipt_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    txn_id VARCHAR(100) UNIQUE NOT NULL,
    user_name VARCHAR(100),
    email VARCHAR(150),
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    payment_mode ENUM('upi', 'card', 'netbanking', 'wallet', 'cash', 'other') NOT NULL,
    status ENUM('success', 'failed', 'pending') DEFAULT 'success',
    receipt_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_user_receipt_date (user_id, receipt_date)
);

-- Webhook events table for audit and idempotency
CREATE TABLE webhook_events (
    event_id INT PRIMARY KEY AUTO_INCREMENT,
    webhook_id VARCHAR(255) UNIQUE NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    payment_id VARCHAR(255),
    amount DECIMAL(10,2),
    user_id INT,
    processed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_webhook_id (webhook_id),
    INDEX idx_payment_id (payment_id),
    INDEX idx_processed (processed, created_at)
);

-- Processed payments for idempotency
CREATE TABLE processed_payments (
    payment_id VARCHAR(255) PRIMARY KEY,
    user_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    txn_ref VARCHAR(255),
    processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_processed (user_id, processed_at)
);

-- OTP verification table for MSG91 integration
CREATE TABLE otp_verifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    mobile VARCHAR(15) NOT NULL,
    otp VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    attempts INT DEFAULT 0,
    status ENUM('pending', 'verified', 'expired', 'blocked') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_mobile_pending (mobile, status),
    INDEX idx_mobile_status (mobile, status),
    INDEX idx_expires_at (expires_at)
);

-- Create wallet for each user after registration
DELIMITER //
CREATE TRIGGER create_wallet_after_user_insert
AFTER INSERT ON users
FOR EACH ROW
BEGIN
    INSERT INTO wallets (user_id, balance, status) VALUES (NEW.user_id, 0.00, 'active');
END//
DELIMITER ;