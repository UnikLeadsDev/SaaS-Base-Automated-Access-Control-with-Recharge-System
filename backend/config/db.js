import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

let db;

async function connectDB() {
    try {
        db = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });
        console.log("✅ MySQL Connected");
    } catch (err) {
        console.error("❌ MySQL Connection Failed:", err.message);
    }
}

await connectDB();

export default db;
