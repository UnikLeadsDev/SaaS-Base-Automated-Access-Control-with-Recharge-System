-- OTP verification table for MSG91 integration
CREATE TABLE IF NOT EXISTS otp_verifications (
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