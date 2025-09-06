-- Session tracking tables for admin dashboard

-- User sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  session_token VARCHAR(255) NOT NULL,
  ip_address VARCHAR(45),
  browser VARCHAR(255),
  location VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NULL,
  is_active BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  INDEX idx_user_sessions_user_id (user_id),
  INDEX idx_user_sessions_expires (expires_at)
);

-- Login history table
CREATE TABLE IF NOT EXISTS login_history (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(45),
  browser VARCHAR(255),
  login_method VARCHAR(50) DEFAULT 'email',
  is_suspicious BOOLEAN DEFAULT FALSE,
  location VARCHAR(255),
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  INDEX idx_login_history_user_id (user_id),
  INDEX idx_login_history_time (login_time)
);

-- API keys table
CREATE TABLE IF NOT EXISTS api_keys (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  key_hash VARCHAR(255) NOT NULL,
  permissions JSON,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_used TIMESTAMP NULL,
  created_by INT,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL,
  INDEX idx_api_keys_user_id (user_id),
  INDEX idx_api_keys_hash (key_hash)
);

-- Applications table (if not exists)
CREATE TABLE IF NOT EXISTS applications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  applicant_name VARCHAR(255),
  loan_amount DECIMAL(10,2),
  purpose VARCHAR(255),
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  INDEX idx_applications_user_id (user_id)
);