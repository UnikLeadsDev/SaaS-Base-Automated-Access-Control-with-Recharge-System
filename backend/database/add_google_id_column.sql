-- Add google_id column to users table for Google OAuth support
ALTER TABLE users ADD COLUMN google_id VARCHAR(255) NULL AFTER email;
ALTER TABLE users ADD COLUMN last_login TIMESTAMP NULL AFTER updated_at;

-- Add index for google_id for faster lookups
CREATE INDEX idx_google_id ON users(google_id);