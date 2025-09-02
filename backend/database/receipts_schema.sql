-- Receipts table schema
CREATE TABLE IF NOT EXISTS receipts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  txn_id VARCHAR(255) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_mode VARCHAR(50) DEFAULT 'razorpay',
  status VARCHAR(20) DEFAULT 'success',
  receipt_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_txn_id (txn_id),
  INDEX idx_user_id (user_id),
  INDEX idx_receipt_date (receipt_date),
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);