-- Fix subscription schema by adding missing plan_name column
USE saas_base;

-- Add plan_name column to subscriptions table if it doesn't exist
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS plan_name VARCHAR(100) AFTER plan_id;

-- Update existing subscriptions with plan names
UPDATE subscriptions s 
JOIN subscription_plans sp ON s.plan_id = sp.plan_id 
SET s.plan_name = sp.plan_name 
WHERE s.plan_name IS NULL;

-- Add processed_payments table for payment idempotency
CREATE TABLE IF NOT EXISTS processed_payments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    payment_id VARCHAR(255) UNIQUE NOT NULL,
    user_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    txn_ref VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_payment_id (payment_id),
    INDEX idx_user_id (user_id)
);