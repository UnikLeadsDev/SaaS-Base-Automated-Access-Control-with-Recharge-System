// Database consistency checker
import db from '../config/db.js';

export const checkDatabaseConsistency = async () => {
  // Skip database checks in development mode
  if (process.env.NODE_ENV === 'development') {
    console.log('📝 Database consistency check skipped in development mode');
    return true;
  }
  
  try {
    // Check if users table has correct primary key
    const [columns] = await db.query(`
      SELECT COLUMN_NAME, COLUMN_KEY 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'users' 
      AND COLUMN_KEY = 'PRI'
    `);
    
    if (columns.length === 0 || columns[0].COLUMN_NAME !== 'user_id') {
      console.error('❌ Database inconsistency: users table primary key should be user_id');
      return false;
    }
    
    console.log('✅ Database schema consistency check passed');
    return true;
  } catch (error) {
    console.error('❌ Database consistency check failed:', error.message);
    return false;
  }
};