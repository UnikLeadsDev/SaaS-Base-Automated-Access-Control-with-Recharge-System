import db from '../config/db.js';

export const initializeReceiptsTable = async () => {
  try {
    // Create receipts table with all required columns
    await db.query(`
      CREATE TABLE IF NOT EXISTS receipts (
        receipt_id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        txn_id VARCHAR(255) NOT NULL,
        user_name VARCHAR(255),
        email VARCHAR(255),
        amount DECIMAL(10,2) NOT NULL,
        payment_mode VARCHAR(50) DEFAULT 'razorpay',
        status VARCHAR(20) DEFAULT 'success',
        receipt_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_txn_id (txn_id),
        INDEX idx_user_id (user_id),
        INDEX idx_receipt_date (receipt_date)
      )
    `);
    
    console.log('Receipts table initialized successfully');
  } catch (error) {
    console.error('Error initializing receipts table:', error);
  }
};

export default { initializeReceiptsTable };