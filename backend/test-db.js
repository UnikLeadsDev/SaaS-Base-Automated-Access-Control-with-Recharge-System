import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

async function testDatabase() {
  try {
    // First try to connect without database to create it
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT || 3306
    });

    console.log("✅ MySQL connection successful");

    // Create database if it doesn't exist
    await connection.execute(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`);
    console.log(`✅ Database '${process.env.DB_NAME}' created/verified`);

    await connection.end();

    // Now connect to the specific database
    const db = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT || 3306
    });

    // Create users table if it doesn't exist
    await db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        user_id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        mobile VARCHAR(20),
        role ENUM('DSA', 'NBFC', 'Co-op', 'Admin') DEFAULT 'DSA',
        status ENUM('active', 'inactive', 'blocked') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Create wallets table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS wallets (
        wallet_id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        balance DECIMAL(10,2) DEFAULT 0.00,
        status ENUM('active', 'inactive') DEFAULT 'active',
        currency VARCHAR(3) DEFAULT 'INR',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
      )
    `);

    console.log("✅ Database tables created/verified");

    // Insert a test user
    const [existing] = await db.execute(
      'SELECT * FROM users WHERE email = ?',
      ['test@example.com']
    );

    if (existing.length === 0) {
      const [result] = await db.execute(`
        INSERT INTO users (name, email, password, role) 
        VALUES (?, ?, ?, ?)
      `, ['Test User', 'test@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'DSA']);

      // Create wallet for test user
      await db.execute(`
        INSERT INTO wallets (user_id, balance) VALUES (?, ?)
      `, [result.insertId, 1000.00]);

      console.log("✅ Test user created with wallet");
    } else {
      console.log("✅ Test user already exists");
    }

    await db.end();
    console.log("✅ Database setup complete");

  } catch (error) {
    console.error("❌ Database error:", error.message);
    process.exit(1);
  }
}

testDatabase();