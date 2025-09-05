import db from '../config/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function initializeAdminTables() {
  try {
    console.log('🚀 Initializing admin tables...');
    
    // Create tables directly instead of reading from file
    const tables = [
      `ALTER TABLE transactions ADD COLUMN IF NOT EXISTS status ENUM('pending', 'completed', 'failed') DEFAULT 'completed'`,
      `ALTER TABLE transactions ADD COLUMN IF NOT EXISTS description TEXT NULL`,
      `CREATE TABLE IF NOT EXISTS login_history (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ip_address VARCHAR(45),
        browser VARCHAR(255),
        login_method ENUM('email', 'otp', 'google', 'sso') DEFAULT 'email',
        is_suspicious BOOLEAN DEFAULT FALSE,
        location VARCHAR(255),
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
      )`,
      `CREATE TABLE IF NOT EXISTS user_sessions (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        session_token VARCHAR(255) UNIQUE NOT NULL,
        ip_address VARCHAR(45),
        browser VARCHAR(255),
        location VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
      )`,
      `CREATE TABLE IF NOT EXISTS api_keys (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        key_hash VARCHAR(255) UNIQUE NOT NULL,
        permissions JSON,
        is_active BOOLEAN DEFAULT TRUE,
        last_used TIMESTAMP NULL,
        created_by INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
      )`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP NULL`
    ];
    
    for (const sql of tables) {
      try {
        await db.query(sql);
        console.log('✅ Table created/updated');
      } catch (error) {
        if (!error.message.includes('already exists') && !error.message.includes('Duplicate')) {
          console.warn('⚠️  SQL Warning:', error.message);
        }
      }
    }
    
    console.log('✅ Admin tables initialized successfully!');
    
    // Create a default admin user if none exists
    const [adminUsers] = await db.query("SELECT COUNT(*) as count FROM users WHERE role = 'admin'");
    
    if (adminUsers[0].count === 0) {
      console.log('👤 Creating default admin user...');
      const bcrypt = await import('bcryptjs');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      await db.query(
        "INSERT INTO users (name, email, password, role, status) VALUES (?, ?, ?, 'admin', 'active')",
        ['Admin User', 'admin@saasbase.com', hashedPassword]
      );
      
      console.log('🎉 Default admin user created!');
      console.log('📧 Email: admin@saasbase.com');
      console.log('🔑 Password: admin123');
      console.log('⚠️  Please change this password after first login!');
    } else {
      console.log('👤 Admin user already exists');
    }
    
  } catch (error) {
    console.error('❌ Error initializing admin tables:', error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeAdminTables().then(() => {
    console.log('Initialization complete!');
    process.exit(0);
  }).catch(error => {
    console.error('Initialization failed:', error);
    process.exit(1);
  });
}

export default initializeAdminTables;