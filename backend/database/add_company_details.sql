-- Migration script to add company_details table to existing database
-- Run this if you already have the database set up without company_details table

USE saas_base;

-- Create company_details table if it doesn't exist
CREATE TABLE IF NOT EXISTS company_details (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL UNIQUE,
    company_name VARCHAR(255),
    industry VARCHAR(100),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(10),
    gstin VARCHAR(15),
    pan VARCHAR(10),
    email VARCHAR(255),
    phone VARCHAR(15),
    website VARCHAR(255),
    logo_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user_company (user_id),
    INDEX idx_company_active (is_active)
);

-- Verify table creation
SELECT 'company_details table created successfully' as status;