-- Add category column to support_tickets table
USE saas_base;
ALTER TABLE support_tickets ADD COLUMN category VARCHAR(100) NOT NULL DEFAULT 'general' AFTER user_id;