import db from '../config/db.js';

const checkDatabaseStructure = async () => {
  try {
    console.log('Checking database structure...');

    // Check if subscriptions table exists
    const [tables] = await db.query("SHOW TABLES LIKE 'subscriptions'");
    if (tables.length === 0) {
      console.log('❌ subscriptions table does not exist');
      
      // Check if subscription_plans exists
      const [planTables] = await db.query("SHOW TABLES LIKE 'subscription_plans'");
      if (planTables.length === 0) {
        console.log('❌ subscription_plans table does not exist');
        console.log('Creating subscription tables...');
        
        // Create subscription_plans table
        await db.query(`
          CREATE TABLE subscription_plans (
            plan_id INT PRIMARY KEY AUTO_INCREMENT,
            plan_name VARCHAR(100) UNIQUE NOT NULL,
            amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
            duration_days INT NOT NULL CHECK (duration_days > 0),
            grace_period_days INT DEFAULT 7 CHECK (grace_period_days >= 0),
            basic_form_limit INT DEFAULT -1 COMMENT '-1 means unlimited',
            realtime_form_limit INT DEFAULT -1 COMMENT '-1 means unlimited',
            api_access BOOLEAN DEFAULT FALSE,
            priority_support BOOLEAN DEFAULT FALSE,
            status ENUM('active', 'inactive') DEFAULT 'active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);
        console.log('✅ Created subscription_plans table');
        
        // Insert default plans
        await db.query(`
          INSERT INTO subscription_plans (plan_name, amount, duration_days, grace_period_days, basic_form_limit, realtime_form_limit, api_access, priority_support) VALUES
          ('Basic Monthly', 999.00, 30, 7, -1, 100, FALSE, FALSE),
          ('Premium Monthly', 1999.00, 30, 7, -1, -1, TRUE, TRUE),
          ('Basic Yearly', 9999.00, 365, 15, -1, 1200, FALSE, FALSE)
        `);
        console.log('✅ Inserted default subscription plans');
      }
      
      // Create subscriptions table
      await db.query(`
        CREATE TABLE subscriptions (
          sub_id INT PRIMARY KEY AUTO_INCREMENT,
          user_id INT NOT NULL,
          plan_id INT NOT NULL,
          plan_name VARCHAR(100),
          amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
          start_date DATE NOT NULL,
          end_date DATE NOT NULL,
          grace_end_date DATE NOT NULL,
          status ENUM('active', 'expired', 'cancelled', 'grace') DEFAULT 'active',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
          FOREIGN KEY (plan_id) REFERENCES subscription_plans(plan_id),
          INDEX idx_user_status (user_id, status, end_date),
          INDEX idx_status_dates (status, end_date, grace_end_date)
        )
      `);
      console.log('✅ Created subscriptions table');
    } else {
      console.log('✅ subscriptions table exists');
      
      // Check columns
      const [columns] = await db.query("DESCRIBE subscriptions");
      const columnNames = columns.map(col => col.Field);
      console.log('Columns:', columnNames);
      
      if (!columnNames.includes('plan_name')) {
        await db.query("ALTER TABLE subscriptions ADD COLUMN plan_name VARCHAR(100) AFTER plan_id");
        console.log('✅ Added plan_name column');
      }
    }

    // Create processed_payments table
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
    console.log('✅ Created/verified processed_payments table');

    console.log('✅ Database structure setup completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
};

checkDatabaseStructure();