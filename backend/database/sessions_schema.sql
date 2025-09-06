-- Additional tables for session management and login tracking

-- User sessions table for active session tracking
CREATE TABLE IF NOT EXISTS user_sessions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    browser VARCHAR(100),
    location VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user_active (user_id, is_active),
    INDEX idx_token (session_token),
    INDEX idx_expires (expires_at)
);

-- Login history table for security tracking
CREATE TABLE IF NOT EXISTS login_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    browser VARCHAR(100),
    location VARCHAR(255),
    login_method VARCHAR(50) DEFAULT 'email',
    login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_suspicious BOOLEAN DEFAULT FALSE,
    session_id INT,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (session_id) REFERENCES user_sessions(id) ON DELETE SET NULL,
    INDEX idx_user_time (user_id, login_time),
    INDEX idx_suspicious (is_suspicious, login_time)
);

-- API keys table for API access management
CREATE TABLE IF NOT EXISTS api_keys (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    key_hash VARCHAR(255) UNIQUE NOT NULL,
    permissions JSON,
    is_active BOOLEAN DEFAULT TRUE,
    last_used TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INT,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_user_active (user_id, is_active),
    INDEX idx_key_hash (key_hash)
);

-- Add last_login column to users table if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP NULL;