import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import db from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function setupDatabase() {
  try {
    console.log('Setting up database tables...');
    
    const sqlFile = path.join(__dirname, '../database/setup_sessions.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = sql.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        await db.query(statement);
        console.log('✓ Executed:', statement.substring(0, 50) + '...');
      }
    }
    
    console.log('✅ Database setup completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
}

setupDatabase();