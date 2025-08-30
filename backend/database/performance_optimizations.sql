-- Performance Optimizations for SaaS Base Database
-- Add missing indexes for better query performance

USE saas_base;

-- Performance indexes for wallets table
CREATE INDEX IF NOT EXISTS idx_user_balance ON wallets(user_id, balance);
CREATE INDEX IF NOT EXISTS idx_wallet_status ON wallets(status, valid_until);

-- Performance indexes for transactions table  
CREATE INDEX IF NOT EXISTS idx_txn_date ON transactions(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_txn_type_date ON transactions(type, created_at);
CREATE INDEX IF NOT EXISTS idx_txn_amount ON transactions(amount, created_at);

-- Performance indexes for applications table
CREATE INDEX IF NOT EXISTS idx_app_status_date ON applications(status, submitted_at);
CREATE INDEX IF NOT EXISTS idx_app_form_type ON applications(form_type, submitted_at);

-- Performance indexes for users table
CREATE INDEX IF NOT EXISTS idx_user_role_status ON users(role, status);
CREATE INDEX IF NOT EXISTS idx_user_email_status ON users(email, status);

-- Performance indexes for subscriptions table
CREATE INDEX IF NOT EXISTS idx_sub_status_dates ON subscriptions(status, end_date, grace_end_date);
CREATE INDEX IF NOT EXISTS idx_sub_user_active ON subscriptions(user_id, status, end_date);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_wallet_user_balance_status ON wallets(user_id, balance, status);
CREATE INDEX IF NOT EXISTS idx_txn_user_type_date ON transactions(user_id, type, created_at);