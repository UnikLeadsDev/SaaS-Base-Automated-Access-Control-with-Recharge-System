-- Ensure all admin tables exist for dashboard functionality

-- Add status column to transactions if not exists
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS status ENUM('pending', 'completed', 'failed') DEFAULT 'completed';

-- Add description column to transactions if not exists  
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS description TEXT NULL;

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

-- Add missing columns to existing tables
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS login_attempts INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP NULL;

-- Add indexes for better performance
ALTER TABLE users ADD INDEX IF NOT EXISTS idx_status (status);
ALTER TABLE users ADD INDEX IF NOT EXISTS idx_role (role);
ALTER TABLE users ADD INDEX IF NOT EXISTS idx_last_login (last_login);

ALTER TABLE transactions ADD INDEX IF NOT EXISTS idx_user_type (user_id, type);
ALTER TABLE transactions ADD INDEX IF NOT EXISTS idx_created_at (created_at);
ALTER TABLE transactions ADD INDEX IF NOT EXISTS idx_status (status);

ALTER TABLE wallets ADD INDEX IF NOT EXISTS idx_balance (balance);