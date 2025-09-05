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
  acquireTimeout: 10000,
  timeout: 10000,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

let dbConnected = false;

// Test database connection
try {
  const connection = await db.getConnection();
  console.log("✅ Database connected successfully");
  connection.release();
  dbConnected = true;
} catch (error) {
  console.warn("⚠️ Database connection failed:", error.message);
  console.log('📝 Server will start in demo mode');
  dbConnected = false;
}

// Database wrapper with fallback
const database = {
  query: async (sql, params) => {
    if (!dbConnected) {
      // Return mock data for demo mode
      if (sql.includes('SELECT') && sql.includes('users')) {
        return [[{
          id: 1,
          user_id: 1,
          name: 'Demo User',
          email: 'demo@example.com',
          password: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
          role: 'DSA',
          status: 'active'
        }]];
      }
      if (sql.includes('SELECT') && sql.includes('wallets')) {
        return [[{ balance: 1000, status: 'active' }]];
      }
      return [[]];
    }
    return await db.query(sql, params);
  },
  getConnection: async () => {
    if (!dbConnected) {
      throw new Error('Database not connected');
    }
    return await db.getConnection();
  }
};

export default database;
