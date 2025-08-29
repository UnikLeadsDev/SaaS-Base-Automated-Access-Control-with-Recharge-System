-- Enhanced Subscription System Implementation
USE saas_base;

-- User subscription preferences table
CREATE TABLE IF NOT EXISTS user_subscription_preferences (
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

-- Subscription usage tracking
CREATE TABLE IF NOT EXISTS subscription_usage (
    usage_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    subscription_id INT NOT NULL,
    form_type ENUM('basic', 'realtime_validation') NOT NULL,
    forms_used INT DEFAULT 0,
    usage_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (subscription_id) REFERENCES subscriptions(sub_id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_sub_date_type (user_id, subscription_id, usage_date, form_type),
    INDEX idx_usage_date (usage_date),
    INDEX idx_user_sub (user_id, subscription_id)
);

-- Subscription billing history
CREATE TABLE IF NOT EXISTS subscription_billing (
    billing_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    subscription_id INT NOT NULL,
    plan_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    billing_period_start DATE NOT NULL,
    billing_period_end DATE NOT NULL,
    payment_status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
    payment_id VARCHAR(255),
    payment_date TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (subscription_id) REFERENCES subscriptions(sub_id) ON DELETE CASCADE,
    FOREIGN KEY (plan_id) REFERENCES subscription_plans(plan_id),
    INDEX idx_billing_status (payment_status, billing_period_end),
    INDEX idx_user_billing (user_id, billing_period_start)
);

-- Enhanced subscription plans with feature limits
ALTER TABLE subscription_plans 
ADD COLUMN IF NOT EXISTS basic_form_limit INT DEFAULT -1 COMMENT '-1 means unlimited',
ADD COLUMN IF NOT EXISTS realtime_form_limit INT DEFAULT -1 COMMENT '-1 means unlimited',
ADD COLUMN IF NOT EXISTS api_access BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS priority_support BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS analytics_access BOOLEAN DEFAULT FALSE;

-- Update existing plans with feature limits
UPDATE subscription_plans SET 
    basic_form_limit = -1,
    realtime_form_limit = -1,
    api_access = TRUE,
    priority_support = TRUE,
    analytics_access = TRUE
WHERE plan_name IN ('Premium Monthly');

UPDATE subscription_plans SET 
    basic_form_limit = -1,
    realtime_form_limit = 100,
    api_access = FALSE,
    priority_support = FALSE,
    analytics_access = FALSE
WHERE plan_name IN ('Basic Monthly', 'Basic Yearly');

-- Subscription renewal queue for automated processing
CREATE TABLE IF NOT EXISTS subscription_renewal_queue (
    queue_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    subscription_id INT NOT NULL,
    plan_id INT NOT NULL,
    renewal_date DATE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
    retry_count INT DEFAULT 0,
    max_retries INT DEFAULT 3,
    next_retry_at TIMESTAMP NULL,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (subscription_id) REFERENCES subscriptions(sub_id) ON DELETE CASCADE,
    FOREIGN KEY (plan_id) REFERENCES subscription_plans(plan_id),
    INDEX idx_renewal_status (status, renewal_date),
    INDEX idx_retry_queue (status, next_retry_at)
);

-- Function to check subscription access
DELIMITER //
CREATE FUNCTION IF NOT EXISTS check_subscription_access(p_user_id INT, p_form_type VARCHAR(50))
RETURNS BOOLEAN
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE v_has_access BOOLEAN DEFAULT FALSE;
    DECLARE v_subscription_count INT DEFAULT 0;
    
    -- Check for active subscription
    SELECT COUNT(*) INTO v_subscription_count
    FROM subscriptions s
    JOIN subscription_plans sp ON s.plan_id = sp.plan_id
    WHERE s.user_id = p_user_id 
    AND s.status IN ('active', 'grace')
    AND (s.end_date >= CURDATE() OR s.grace_end_date >= CURDATE())
    AND sp.status = 'active'
    AND (
        (p_form_type = 'basic' AND (sp.basic_form_limit = -1 OR sp.basic_form_limit > 0))
        OR 
        (p_form_type = 'realtime_validation' AND (sp.realtime_form_limit = -1 OR sp.realtime_form_limit > 0))
    );
    
    IF v_subscription_count > 0 THEN
        SET v_has_access = TRUE;
    END IF;
    
    RETURN v_has_access;
END//
DELIMITER ;

-- Trigger to create subscription preferences after user registration
DELIMITER //
CREATE TRIGGER IF NOT EXISTS create_subscription_preferences_after_user_insert
AFTER INSERT ON users
FOR EACH ROW
BEGIN
    INSERT INTO user_subscription_preferences (user_id) VALUES (NEW.user_id);
END//
DELIMITER ;

-- Trigger to update subscription status based on dates
DELIMITER //
CREATE TRIGGER IF NOT EXISTS update_subscription_status_daily
BEFORE UPDATE ON subscriptions
FOR EACH ROW
BEGIN
    DECLARE current_date DATE DEFAULT CURDATE();
    
    IF NEW.end_date < current_date AND NEW.grace_end_date >= current_date THEN
        SET NEW.status = 'grace';
    ELSEIF NEW.grace_end_date < current_date THEN
        SET NEW.status = 'expired';
    END IF;
END//
DELIMITER ;