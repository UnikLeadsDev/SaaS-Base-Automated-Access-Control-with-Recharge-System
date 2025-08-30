-- Database Schema Consistency Fixes
-- Fix column naming inconsistencies and add missing constraints

-- 1. Standardize primary key naming to 'id' across all tables
ALTER TABLE users CHANGE user_id id INT PRIMARY KEY AUTO_INCREMENT;
ALTER TABLE wallets CHANGE wallet_id id INT PRIMARY KEY AUTO_INCREMENT;
ALTER TABLE wallets CHANGE user_id user_id INT NOT NULL UNIQUE;
ALTER TABLE transactions CHANGE txn_id id INT PRIMARY KEY AUTO_INCREMENT;
ALTER TABLE subscription_plans CHANGE plan_id id INT PRIMARY KEY AUTO_INCREMENT;
ALTER TABLE subscriptions CHANGE sub_id id INT PRIMARY KEY AUTO_INCREMENT;
ALTER TABLE applications CHANGE app_id id INT PRIMARY KEY AUTO_INCREMENT;
ALTER TABLE notification_queue CHANGE queue_id id INT PRIMARY KEY AUTO_INCREMENT;
ALTER TABLE support_tickets CHANGE ticket_id id INT PRIMARY KEY AUTO_INCREMENT;
ALTER TABLE receipts CHANGE receipt_id id INT PRIMARY KEY AUTO_INCREMENT;
ALTER TABLE webhook_events CHANGE event_id id INT PRIMARY KEY AUTO_INCREMENT;
ALTER TABLE user_preferences CHANGE pref_id id INT PRIMARY KEY AUTO_INCREMENT;
ALTER TABLE usage_tracking CHANGE usage_id id INT PRIMARY KEY AUTO_INCREMENT;

-- 2. Add missing foreign key constraints with proper naming
ALTER TABLE transactions 
ADD CONSTRAINT fk_transactions_user 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE subscriptions 
ADD CONSTRAINT fk_subscriptions_user 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
ADD CONSTRAINT fk_subscriptions_plan 
FOREIGN KEY (plan_id) REFERENCES subscription_plans(id);

ALTER TABLE applications 
ADD CONSTRAINT fk_applications_user 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE notification_queue 
ADD CONSTRAINT fk_notifications_user 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE support_tickets 
ADD CONSTRAINT fk_tickets_user 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE receipts 
ADD CONSTRAINT fk_receipts_user 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE user_preferences 
ADD CONSTRAINT fk_preferences_user 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
ADD CONSTRAINT fk_preferences_plan 
FOREIGN KEY (preferred_plan_id) REFERENCES subscription_plans(id);

ALTER TABLE usage_tracking 
ADD CONSTRAINT fk_usage_user 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
ADD CONSTRAINT fk_usage_subscription 
FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE CASCADE;

-- 3. Add proper indexes for performance
CREATE INDEX idx_transactions_user_date ON transactions(user_id, created_at DESC);
CREATE INDEX idx_subscriptions_status_dates ON subscriptions(status, end_date, grace_end_date);
CREATE INDEX idx_applications_user_type ON applications(user_id, form_type, submitted_at DESC);

-- 4. Add check constraints for data integrity
ALTER TABLE wallets ADD CONSTRAINT chk_balance_positive CHECK (balance >= 0);
ALTER TABLE transactions ADD CONSTRAINT chk_amount_positive CHECK (amount > 0);
ALTER TABLE subscription_plans ADD CONSTRAINT chk_plan_amount_positive CHECK (amount > 0);
ALTER TABLE subscriptions ADD CONSTRAINT chk_sub_amount_positive CHECK (amount > 0);

-- 5. Update triggers to use new column names
DROP TRIGGER IF EXISTS create_wallet_after_user_insert;
DROP TRIGGER IF EXISTS update_subscription_status;

DELIMITER //
CREATE TRIGGER create_wallet_after_user_insert
AFTER INSERT ON users
FOR EACH ROW
BEGIN
    INSERT INTO wallets (user_id) VALUES (NEW.id);
    INSERT INTO user_preferences (user_id) VALUES (NEW.id);
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