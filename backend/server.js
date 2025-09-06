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
import supportRoutes from "./routes/supportRoutes.js";
import billingRoutes from "./routes/billingRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import { checkLowBalanceAndExpiry } from "./controllers/notificationController.js";
import { startCronJobs } from "./jobs/cronJobs.js";
import { rawBodyMiddleware } from "./middleware/rawBody.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { csrfProtection } from "./middleware/csrf.js";
import { securityHeaders, generalRateLimit } from "./middleware/security.js";
import { sanitizeInput } from "./middleware/validation.js";
import { i18nMiddleware } from "./utils/i18n.js";
import receiptRoutes from "./routes/receiptRoutes.js";
import csrfRoutes from "./routes/csrfRoutes.js";
import session from "express-session";
import { initializeReceiptsTable } from "./utils/initializeReceipts.js";

dotenv.config();

// Validate critical environment variables
const requiredEnvVars = [
  'JWT_SECRET',
  'RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

// Optional rate envs with sane fallbacks are validated in middleware/accessControl.js
// Log warnings here if provided but invalid.
const rateEnvPairs = [
  ['BASIC_FORM_RATE', process.env.BASIC_FORM_RATE],
  ['REALTIME_VALIDATION_RATE', process.env.REALTIME_VALIDATION_RATE]
];
for (const [key, value] of rateEnvPairs) {
  if (value !== undefined && value !== '' && isNaN(parseFloat(value))) {
    console.warn(`⚠️  ${key} is set but not a valid number: "${value}". Using fallback defaults.`);
  }
}

const app = express();

// Security middleware
app.use(securityHeaders);
// Temporarily disable rate limiting for development
// app.use(generalRateLimit);

// Session middleware for CSRF
app.use(session({
  secret: process.env.SESSION_SECRET || process.env.JWT_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === 'production', httpOnly: true }
}));

app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:5173',
    'http://localhost:3000',
    'https://saasfrontend123.netlify.app',
    'http://34.227.47.231:5173'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-user-email']
}));
app.use(rawBodyMiddleware);
app.use(express.json());

// Input sanitization and i18n
app.use(sanitizeInput);
app.use(i18nMiddleware);

// CSRF protection for state-changing requests (disabled for development)
// app.use(csrfProtection);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/forms", formRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/subscription", subscriptionRoutes);
app.use("/api/support", supportRoutes);
app.use("/api/billing", billingRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/receipts", receiptRoutes);
app.use("/api/security", csrfRoutes);
app.use("/api/profile", profileRoutes);



// Test API
app.get("/", (req, res) => {
    // Basic authorization check
    if (req.headers['user-agent']?.includes('bot') || req.headers['user-agent']?.includes('crawler')) {
        return res.status(403).json({ error: "Access denied" });
    }
    res.json({ message: "SaaS Base API is running...", version: "1.0.0" });
});

// Health check
app.get("/health", (req, res) => {
    res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Cron job for automated alerts (disabled for now)
// cron.schedule('0 * * * *', async () => {
//     console.log('Running automated alerts check...');
//     try {
//         await checkLowBalanceAndExpiry();
//         await checkSubscriptionExpiry();
//     } catch (error) {
//         console.error('Cron job error:', error);
//     }
// });

// Check and update subscription statuses
const checkSubscriptionExpiry = async () => {
    try {
        // Update expired subscriptions
        await db.query(`
            UPDATE subscriptions 
            SET status = 'expired' 
            WHERE status IN ('active', 'grace') 
            AND grace_end_date < CURDATE()
        `);
        
        // Update subscriptions in grace period
        await db.query(`
            UPDATE subscriptions 
            SET status = 'grace' 
            WHERE status = 'active' 
            AND end_date < CURDATE() 
            AND grace_end_date >= CURDATE()
        `);
        
        console.log('Subscription statuses updated');
    } catch (error) {
        console.error('Subscription expiry check error:', error);
    }
};

// Error handling middleware (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', async () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🔔 Automated alerts scheduled every hour`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    
    // Initialize receipts table
    await initializeReceiptsTable();
    
    // Start cron jobs (disabled for now)
    // startCronJobs();
});
