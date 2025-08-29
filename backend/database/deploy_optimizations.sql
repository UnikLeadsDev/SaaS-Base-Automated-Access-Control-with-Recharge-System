-- Deploy all database optimizations
-- Run this file to apply performance indexes and subscription enhancements

USE saas_base;

-- Source the optimization files
SOURCE performance_optimizations.sql;
SOURCE subscription_enhancements.sql;

-- Verify indexes were created
SHOW INDEX FROM wallets WHERE Key_name IN ('idx_user_balance', 'idx_wallet_status');
SHOW INDEX FROM transactions WHERE Key_name IN ('idx_txn_date', 'idx_txn_type_date');
SHOW INDEX FROM subscriptions WHERE Key_name IN ('idx_sub_status_dates', 'idx_sub_user_active');

-- Verify new tables were created
SHOW TABLES LIKE '%subscription%';
SHOW TABLES LIKE '%user_subscription_preferences%';

SELECT 'Database optimizations deployed successfully!' as status;