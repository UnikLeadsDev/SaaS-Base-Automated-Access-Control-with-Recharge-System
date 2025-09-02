-- Fix receipts table
CREATE TABLE IF NOT EXISTS receipts (
  receipt_id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  txn_id VARCHAR(255) NOT NULL UNIQUE,
  user_name VARCHAR(255),
  email VARCHAR(255),
  amount DECIMAL(10,2) NOT NULL,
  payment_mode VARCHAR(50) DEFAULT 'razorpay',
  status VARCHAR(20) DEFAULT 'success',
  receipt_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_receipt_date (receipt_date)
);