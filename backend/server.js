import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import db from "./config/db.js";
import authRoutes from "./routes/authRoutes.js"; // <-- Import here

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// Mount authentication routes
app.use("/", authRoutes); // Now your routes will be /api/auth/register & /api/auth/login

// Test API
app.get("/", (req, res) => {
    res.send("API is running...");
});

// Example: fetch users
app.get("/users", (req, res) => {
    db.query("SELECT * FROM users", (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
