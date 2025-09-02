-- Optimized SaaS Base Database Schema
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
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email_status (email, status),
    INDEX idx_role_status (role, status)
);

-- Wallets table
CREATE TABLE wallets (
    wallet_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL UNIQUE,
    balance DECIMAL(10,2) DEFAULT 0.00 CHECK (balance >= 0),
    status ENUM('active', 'expired') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user_balance (user_id, balance)
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
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user_date (user_id, created_at),
    INDEX idx_type_date (type, created_at),
    INDEX idx_txn_ref (txn_ref)
);

-- Subscription plans
CREATE TABLE subscription_plans (
    plan_id INT PRIMARY KEY AUTO_INCREMENT,
    plan_name VARCHAR(100) UNIQUE NOT NULL,
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    duration_days INT NOT NULL CHECK (duration_days > 0),
    grace_period_days INT DEFAULT 7 CHECK (grace_period_days >= 0),
    basic_form_limit INT DEFAULT -1 COMMENT '-1 means unlimited',
    realtime_form_limit INT DEFAULT -1 COMMENT '-1 means unlimited',
    api_access BOOLEAN DEFAULT FALSE,
    priority_support BOOLEAN DEFAULT FALSE,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Subscriptions table
CREATE TABLE subscriptions (
    sub_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    plan_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    grace_end_date DATE NOT NULL,
    status ENUM('active', 'expired', 'cancelled', 'grace') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (plan_id) REFERENCES subscription_plans(plan_id),
    INDEX idx_user_status (user_id, status, end_date),
    INDEX idx_status_dates (status, end_date, grace_end_date)
);

-- Applications table
CREATE TABLE applications (
    app_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    form_type ENUM('basic', 'realtime_validation') NOT NULL,
    amount_charged DECIMAL(10,2) NOT NULL CHECK (amount_charged >= 0),
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user_submitted (user_id, submitted_at),
    INDEX idx_status_date (status, submitted_at)
);

-- Notifications queue (consolidated)
CREATE TABLE notification_queue (
    queue_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    channel ENUM('sms', 'whatsapp', 'email') NOT NULL,
    message_type VARCHAR(50) NOT NULL,
    recipient VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status ENUM('pending', 'sent', 'failed') DEFAULT 'pending',
    retry_count INT DEFAULT 0,
    max_retries INT DEFAULT 3,
    sent_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_status_retry (status, retry_count),
    INDEX idx_user_type (user_id, message_type)
);

-- Support tickets
CREATE TABLE support_tickets (
    ticket_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    category VARCHAR(100) NOT NULL DEFAULT 'general',
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status ENUM('open', 'in_progress', 'resolved', 'closed') DEFAULT 'open',
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_status_priority (status, priority)
);

-- Payment receipts
CREATE TABLE receipts (
    receipt_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    txn_ref VARCHAR(255) UNIQUE NOT NULL,
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    payment_mode ENUM('upi', 'card', 'netbanking', 'wallet', 'razorpay') NOT NULL,
    status ENUM('success', 'failed', 'pending') DEFAULT 'success',
    receipt_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user_date (user_id, receipt_date)
);

-- Webhook events for idempotency
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
    INDEX idx_processed (processed, created_at)
);

-- User preferences
CREATE TABLE user_preferences (
    pref_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL UNIQUE,
    auto_renewal BOOLEAN DEFAULT FALSE,
    preferred_plan_id INT,
    notification_days_before INT DEFAULT 7,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (preferred_plan_id) REFERENCES subscription_plans(plan_id)
);

-- Usage tracking
CREATE TABLE usage_tracking (
    usage_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    subscription_id INT NOT NULL,
    form_type ENUM('basic', 'realtime_validation') NOT NULL,
    forms_used INT DEFAULT 1,
    usage_date DATE NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (subscription_id) REFERENCES subscriptions(sub_id) ON DELETE CASCADE,
    UNIQUE KEY unique_daily_usage (user_id, subscription_id, usage_date, form_type),
    INDEX idx_usage_date (usage_date)
);

-- Insert default subscription plans
INSERT INTO subscription_plans (plan_name, amount, duration_days, grace_period_days, basic_form_limit, realtime_form_limit, api_access, priority_support) VALUES
('Basic Monthly', 999.00, 30, 7, -1, 100, FALSE, FALSE),
('Premium Monthly', 1999.00, 30, 7, -1, -1, TRUE, TRUE),
('Basic Yearly', 9999.00, 365, 15, -1, 1200, FALSE, FALSE);

-- Function to check subscription access
DELIMITER //
CREATE FUNCTION check_subscription_access(p_user_id INT, p_form_type VARCHAR(50))
RETURNS BOOLEAN
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE v_has_access BOOLEAN DEFAULT FALSE;
    
    SELECT COUNT(*) > 0 INTO v_has_access
    FROM subscriptions s
    JOIN subscription_plans sp ON s.plan_id = sp.plan_id
    WHERE s.user_id = p_user_id 
    AND s.status IN ('active', 'grace')
    AND CURDATE() <= COALESCE(s.grace_end_date, s.end_date)
    AND sp.status = 'active'
    AND (
        (p_form_type = 'basic' AND sp.basic_form_limit != 0)
        OR 
        (p_form_type = 'realtime_validation' AND sp.realtime_form_limit != 0)
    );
    
    RETURN v_has_access;
END//
DELIMITER ;

-- Triggers
DELIMITER //
CREATE TRIGGER create_wallet_after_user_insert
AFTER INSERT ON users
FOR EACH ROW
BEGIN
    INSERT INTO wallets (user_id) VALUES (NEW.user_id);
    INSERT INTO user_preferences (user_id) VALUES (NEW.user_id);
END//

CREATE TRIGGER update_subscription_status
BEFORE UPDATE ON subscriptions
FOR EACH ROW
BEGIN
    IF NEW.end_date < CURDATE() AND NEW.grace_end_date >= CURDATE() THEN
        SET NEW.status = 'grace';
    ELSEIF NEW.grace_end_date < CURDATE() THEN
        SET NEW.status = 'expired';
    END IF;
END//
DELIMITER ;