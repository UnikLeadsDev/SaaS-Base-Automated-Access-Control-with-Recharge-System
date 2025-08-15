import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cron from "node-cron";
import db from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import formRoutes from "./routes/formRoutes.js";
import walletRoutes from "./routes/walletRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import subscriptionRoutes from "./routes/subscriptionRoutes.js";
import billingRoutes from "./routes/billingRoutes.js";
import supportRoutes from "./routes/supportRoutes.js";
import { checkLowBalanceAndExpiry } from "./controllers/notificationController.js";

dotenv.config();

// Validate critical environment variables
const requiredEnvVars = [
  'JWT_SECRET', 'BASIC_FORM_RATE', 'REALTIME_VALIDATION_RATE',
  'RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

const app = express();

app.use(cors({
  origin: [process.env.FRONTEND_URL || 'http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/forms", formRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/subscription", subscriptionRoutes);
app.use("/api/billing", billingRoutes);
app.use("/api/support", supportRoutes);

// Debug route to check wallet routes
app.get("/api/debug/routes", (req, res) => {
    res.json({ message: "Routes loaded", timestamp: new Date().toISOString() });
});

// Direct wallet routes as fallback
app.get("/api/wallet/balance", (req, res) => {
    res.json({ balance: 0, status: 'active', validUntil: null });
});

app.get("/api/wallet/balance-check", (req, res) => {
    res.json({ 
        balance: 0, 
        status: 'active', 
        validUntil: null,
        accessType: 'prepaid',
        canSubmitBasic: false,
        canSubmitRealtime: false,
        rates: { basic: 5, realtime: 50 }
    });
});

app.get("/api/wallet/transactions", (req, res) => {
    res.json([]);
});

app.get("/api/subscription/current", (req, res) => {
    res.json(null);
});

app.get("/api/support/tickets", (req, res) => {
    res.json([]);
});

// Test API
app.get("/", (req, res) => {
    res.json({ message: "SaaS Base API is running...", version: "1.0.0" });
});

// Health check
app.get("/health", (req, res) => {
    res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Cron job for automated alerts (runs every hour)
cron.schedule('0 * * * *', async () => {
    console.log('Running automated alerts check...');
    try {
        await checkLowBalanceAndExpiry();
    } catch (error) {
        console.error('Cron job error:', error);
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🔔 Automated alerts scheduled every hour`);
});
