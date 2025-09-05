import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function createAdminTables() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    console.log('🚀 Creating admin tables...');

    // Add missing columns to transactions
    await connection.execute(`ALTER TABLE transactions ADD COLUMN IF NOT EXISTS status ENUM('pending', 'completed', 'failed') DEFAULT 'completed'`);
    await connection.execute(`ALTER TABLE transactions ADD COLUMN IF NOT EXISTS description TEXT NULL`);

    // Create login_history table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS login_history (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ip_address VARCHAR(45),
        browser VARCHAR(255),
        login_method ENUM('email', 'otp', 'google', 'sso') DEFAULT 'email',
        is_suspicious BOOLEAN DEFAULT FALSE,
        location VARCHAR(255),
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
      )
    `);

    // Create user_sessions table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        session_token VARCHAR(255) UNIQUE NOT NULL,
        ip_address VARCHAR(45),
        browser VARCHAR(255),
        location VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP NULL,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
      )
    `);

    // Create api_keys table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS api_keys (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        key_hash VARCHAR(255) UNIQUE NOT NULL,
        permissions JSON,
        is_active BOOLEAN DEFAULT TRUE,
        last_used TIMESTAMP NULL,
        created_by INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
        FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE CASCADE
      )
    `);

    // Add last_login column
    await connection.execute(`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP NULL`);

    // Create admin user
    const [existing] = await connection.execute(`SELECT COUNT(*) as count FROM users WHERE role = 'admin'`);
    if (existing[0].count === 0) {
      await connection.execute(`
        INSERT INTO users (name, email, password, role, status) 
        VALUES ('Admin User', 'admin@saasbase.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'active')
      `);
      console.log('✅ Admin user created: admin@saasbase.com / password');
    }

    console.log('✅ All admin tables created successfully!');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

createAdminTables();