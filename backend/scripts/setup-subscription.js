import db from '../config/db.js';

const setupSubscriptionModel = async () => {
  try {
    console.log('Setting up subscription model...');

    // Add plan_name column to subscriptions table if it doesn't exist
    try {
      await db.query(`
        ALTER TABLE subscriptions 
        ADD COLUMN plan_name VARCHAR(100) AFTER plan_id
      `);
      console.log('Added plan_name column to subscriptions table');
    } catch (error) {
      if (error.code !== 'ER_DUP_FIELDNAME') {
        throw error;
      }
      console.log('plan_name column already exists');
    }

    // Update existing subscriptions with plan names
    try {
      await db.query(`
        UPDATE subscriptions s 
        JOIN subscription_plans sp ON s.plan_id = sp.plan_id 
        SET s.plan_name = sp.plan_name 
        WHERE s.plan_name IS NULL OR s.plan_name = ''
      `);
      console.log('Updated existing subscriptions with plan names');
    } catch (error) {
      console.log('No existing subscriptions to update or update failed:', error.message);
    }

    // Create processed_payments table for payment idempotency
    await db.query(`
      CREATE TABLE IF NOT EXISTS processed_payments (
        id INT PRIMARY KEY AUTO_INCREMENT,
        payment_id VARCHAR(255) UNIQUE NOT NULL,
        user_id INT NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        txn_ref VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_payment_id (payment_id),
        INDEX idx_user_id (user_id)
      )
    `);

    console.log('Subscription model setup completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Setup failed:', error);
    process.exit(1);
  }
};

setupSubscriptionModel();