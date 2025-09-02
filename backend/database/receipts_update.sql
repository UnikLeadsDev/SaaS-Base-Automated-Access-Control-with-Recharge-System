-- Update receipts table to include missing columns
ALTER TABLE receipts 
ADD COLUMN IF NOT EXISTS user_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS email VARCHAR(255),
ADD COLUMN IF NOT EXISTS receipt_id INT AUTO_INCREMENT UNIQUE AFTER id;