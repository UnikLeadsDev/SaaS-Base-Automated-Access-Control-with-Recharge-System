import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

// Validate required environment variables
const requiredEnvVars = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ Missing required environment variable: ${envVar}`);
    console.log('Available env vars:', Object.keys(process.env).filter(key => key.startsWith('DB_')));
    process.exit(1);
  }
}

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

try {
  const connection = await db.getConnection();
  console.log("✅ Database connected successfully");
  connection.release();
} catch (error) {
  console.error("❌ Database connection failed:", error);
  console.log('Connection config:', {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306
  });
  // Don't exit in production, let the app start without DB for now
  if (process.env.NODE_ENV !== 'production') {
    process.exit(1);
  }
}

export default db;
