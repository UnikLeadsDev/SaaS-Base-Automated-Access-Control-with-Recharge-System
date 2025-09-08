import db from '../config/db.js';

const fixSubscriptionsTable = async () => {
  try {
    console.log('Fixing subscriptions table structure...');

    // Add grace_end_date column as nullable first
    try {
      await db.query(`ALTER TABLE subscriptions ADD COLUMN grace_end_date DATE NULL AFTER end_date`);
      console.log('✅ Added grace_end_date column');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('✅ grace_end_date column already exists');
      } else {
        throw error;
      }
    }

    // Update existing records with grace_end_date
    await db.query(`
      UPDATE subscriptions 
      SET grace_end_date = DATE_ADD(end_date, INTERVAL 7 DAY) 
      WHERE grace_end_date IS NULL
    `);
    console.log('✅ Updated existing records with grace_end_date');

    // Now make it NOT NULL
    try {
      await db.query(`ALTER TABLE subscriptions MODIFY COLUMN grace_end_date DATE NOT NULL`);
      console.log('✅ Made grace_end_date NOT NULL');
    } catch (error) {
      console.log('⚠️ Could not make grace_end_date NOT NULL:', error.message);
    }

    // Update status enum to include 'grace'
    try {
      await db.query(`
        ALTER TABLE subscriptions 
        MODIFY COLUMN status ENUM('active', 'expired', 'cancelled', 'grace') DEFAULT 'active'
      `);
      console.log('✅ Updated status enum to include grace');
    } catch (error) {
      console.log('⚠️ Could not update status enum:', error.message);
    }

    console.log('✅ Subscriptions table structure fixed successfully!');
    
    // Show final structure
    const [columns] = await db.query("DESCRIBE subscriptions");
    console.log('Final table structure:');
    columns.forEach(col => {
      console.log(`  ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Fix failed:', error);
    process.exit(1);
  }
};

fixSubscriptionsTable();