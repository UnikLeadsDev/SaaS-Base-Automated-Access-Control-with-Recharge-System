import db from '../config/db.js';

const fixSubscriptionsTable = async () => {
  try {
    console.log('Fixing subscriptions table structure...');

    // Add missing columns
    const columnsToAdd = [
      { name: 'plan_id', definition: 'INT NOT NULL AFTER user_id' },
      { name: 'grace_end_date', definition: 'DATE NOT NULL AFTER end_date' }
    ];

    for (const column of columnsToAdd) {
      try {
        await db.query(`ALTER TABLE subscriptions ADD COLUMN ${column.name} ${column.definition}`);
        console.log(`✅ Added ${column.name} column`);
      } catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME') {
          console.log(`✅ ${column.name} column already exists`);
        } else {
          throw error;
        }
      }
    }

    // Add foreign key constraint for plan_id if it doesn't exist
    try {
      await db.query(`
        ALTER TABLE subscriptions 
        ADD CONSTRAINT fk_subscriptions_plan_id 
        FOREIGN KEY (plan_id) REFERENCES subscription_plans(plan_id)
      `);
      console.log('✅ Added foreign key constraint for plan_id');
    } catch (error) {
      if (error.code === 'ER_DUP_KEY') {
        console.log('✅ Foreign key constraint already exists');
      } else {
        console.log('⚠️ Could not add foreign key constraint:', error.message);
      }
    }

    // Add indexes
    const indexesToAdd = [
      'CREATE INDEX IF NOT EXISTS idx_user_status ON subscriptions(user_id, status, end_date)',
      'CREATE INDEX IF NOT EXISTS idx_status_dates ON subscriptions(status, end_date, grace_end_date)'
    ];

    for (const indexQuery of indexesToAdd) {
      try {
        await db.query(indexQuery);
        console.log('✅ Added index');
      } catch (error) {
        console.log('⚠️ Index may already exist:', error.message);
      }
    }

    console.log('✅ Subscriptions table structure fixed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Fix failed:', error);
    process.exit(1);
  }
};

fixSubscriptionsTable();