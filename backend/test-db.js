import db from './config/db.js';

async function testDatabase() {
  try {
    console.log('Testing database connection...');
    
    // Test connection
    const [result] = await db.query('SELECT 1 as test');
    console.log('✓ Database connection successful');
    
    // Check if receipts table exists
    const [tables] = await db.query("SHOW TABLES LIKE 'receipts'");
    console.log('Receipts table exists:', tables.length > 0);
    
    if (tables.length > 0) {
      // Show table structure
      const [columns] = await db.query('DESCRIBE receipts');
      console.log('Receipt table columns:');
      columns.forEach(col => {
        console.log(`  ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'}`);
      });
    } else {
      console.log('❌ Receipts table does not exist');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Database error:', error.message);
    process.exit(1);
  }
}

testDatabase();