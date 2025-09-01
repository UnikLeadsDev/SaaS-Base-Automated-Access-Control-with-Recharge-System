import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

// Validate required environment variables (password can be empty for local dev)
const requiredEnvVars = ['DB_HOST', 'DB_USER', 'DB_NAME'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ Missing required environment variable: ${envVar}`);
    console.log('Available env vars:', Object.keys(process.env).filter(key => key.startsWith('DB_')));
    process.exit(1);
  }
}

// DB_PASSWORD can be empty for local development
if (process.env.DB_PASSWORD === undefined) {
  console.error(`❌ Missing required environment variable: DB_PASSWORD`);
  process.exit(1);
}

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Test database connection but don't exit if it fails in development
try {
  const connection = await db.getConnection();
  console.log("✅ Database connected successfully");
  connection.release();
} catch (error) {
  console.warn("⚠️ Database connection failed:", error.message);
  console.log('Connection config:', {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306
  });
  console.log('📝 Server will start without database connection for development');
  // Only exit in production if DB is critical
  // if (process.env.NODE_ENV === 'production') {
  //   process.exit(1);
  // }
}

export default db;
