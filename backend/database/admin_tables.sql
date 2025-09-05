-- Admin Panel Enhanced Tables

-- Login History Table
CREATE TABLE IF NOT EXISTS login_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    browser VARCHAR(255),
    login_method ENUM('email', 'otp', 'google', 'sso') DEFAULT 'email',
    is_suspicious BOOLEAN DEFAULT FALSE,
    location VARCHAR(255),
    device_info TEXT,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user_login (user_id, login_time),
    INDEX idx_suspicious (is_suspicious),
    INDEX idx_login_time (login_time)
);

-- User Sessions Table
CREATE TABLE IF NOT EXISTS user_sessions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    ip_address VARCHAR(45),
    browser VARCHAR(255),
    location VARCHAR(255),
    device_info TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user_session (user_id),
    INDEX idx_expires (expires_at),
    INDEX idx_token (session_token)
);

-- Admin Audit Log Table
CREATE TABLE IF NOT EXISTS admin_audit (
    id INT PRIMARY KEY AUTO_INCREMENT,
    admin_id INT NOT NULL,
    action VARCHAR(100) NOT NULL,
    target_user_id INT,
    amount DECIMAL(10,2),
    txn_ref VARCHAR(255),
    reason TEXT,
    details JSON,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (target_user_id) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_admin_action (admin_id, action),
    INDEX idx_target_user (target_user_id),
    INDEX idx_created_at (created_at)
);

-- API Keys Table
CREATE TABLE IF NOT EXISTS api_keys (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    key_hash VARCHAR(255) UNIQUE NOT NULL,
    permissions JSON,
    is_active BOOLEAN DEFAULT TRUE,
    last_used TIMESTAMP NULL,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user_keys (user_id),
    INDEX idx_key_hash (key_hash),
    INDEX idx_active (is_active)
);

-- User Roles and Permissions Table
CREATE TABLE IF NOT EXISTS user_permissions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    permission VARCHAR(100) NOT NULL,
    granted_by INT NOT NULL,
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (granted_by) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_permission (user_id, permission),
    INDEX idx_user_perms (user_id),
    INDEX idx_permission (permission)
);

-- Communication Limits Table
CREATE TABLE IF NOT EXISTS communication_limits (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    limit_type ENUM('sms', 'email', 'whatsapp') NOT NULL,
    daily_limit INT DEFAULT 100,
    monthly_limit INT DEFAULT 3000,
    current_daily_count INT DEFAULT 0,
    current_monthly_count INT DEFAULT 0,
    last_reset_date DATE DEFAULT (CURDATE()),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_limit_type (user_id, limit_type),
    INDEX idx_user_limits (user_id)
);

-- Blocked Users Table
CREATE TABLE IF NOT EXISTS blocked_users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    blocked_by INT NOT NULL,
    reason TEXT,
    blocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    unblocked_at TIMESTAMP NULL,
    unblocked_by INT NULL,
    is_permanent BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (blocked_by) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (unblocked_by) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_blocked_user (user_id),
    INDEX idx_blocked_by (blocked_by),
    INDEX idx_blocked_at (blocked_at)
);

-- System Alerts Table
CREATE TABLE IF NOT EXISTS system_alerts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    alert_type ENUM('security', 'billing', 'system', 'user_activity') NOT NULL,
    severity ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    user_id INT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_alert_type (alert_type),
    INDEX idx_severity (severity),
    INDEX idx_unread (is_read),
    INDEX idx_created_at (created_at)
);

-- Add missing columns to existing tables
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS login_attempts INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS invitation_token VARCHAR(255) NULL,
ADD COLUMN IF NOT EXISTS invitation_sent_at TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS invitation_accepted_at TIMESTAMP NULL;

-- Add indexes for better performance
ALTER TABLE users ADD INDEX IF NOT EXISTS idx_status (status);
ALTER TABLE users ADD INDEX IF NOT EXISTS idx_role (role);
ALTER TABLE users ADD INDEX IF NOT EXISTS idx_last_login (last_login);

ALTER TABLE transactions ADD INDEX IF NOT EXISTS idx_user_type (user_id, type);
ALTER TABLE transactions ADD INDEX IF NOT EXISTS idx_created_at (created_at);

ALTER TABLE wallets ADD INDEX IF NOT EXISTS idx_balance (balance);
ALTER TABLE wallets ADD INDEX IF NOT EXISTS idx_user_balance (user_id, balance);