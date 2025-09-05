import express from "express";
import { verifyToken, checkRole } from "../middleware/auth.js";
import { updateManualPayment } from "../controllers/paymentController.js";
import { 
  getAdminStats, 
  getAllUsers, 
  createUser,
  updateUser,
  updateUserStatus, 
  deleteUser,
  resetUserPassword,
  getLoginHistory,
  markSuspiciousLogin,
  getActiveSessions,
  terminateSession,
  terminateAllUserSessions,
  getBillingHistory,
  manualBalanceUpdate,
  generateApiKey,
  getApiKeys,
  toggleApiKey,
  searchTransaction, 
  updatePaymentByTransactionId 
} from "../controllers/adminController.js";

const router = express.Router();

// Admin only routes
router.use(verifyToken);
router.use(checkRole(['admin']));

// Dashboard & Stats
router.get("/stats", getAdminStats);

// User Management
router.get("/users", getAllUsers);
router.post("/users", createUser);
router.put("/users/:userId", updateUser);
router.put("/users/:userId/status", updateUserStatus);
router.delete("/users/:userId", deleteUser);
router.post("/users/:userId/reset-password", resetUserPassword);

// Security & Login Tracking
router.get("/login-history", getLoginHistory);
router.put("/login-history/:loginId/suspicious", markSuspiciousLogin);

// Session Management
router.get("/sessions", getActiveSessions);
router.delete("/sessions/:sessionId", terminateSession);
router.delete("/users/:userId/sessions", terminateAllUserSessions);

// Billing & Transactions
router.get("/billing-history", getBillingHistory);
router.post("/manual-balance-update", manualBalanceUpdate);
router.post("/manual-payment", updateManualPayment);
router.get("/transaction/:transactionId", searchTransaction);
router.put("/transaction/:transactionId", updatePaymentByTransactionId);

// API Key Management
router.post("/api-keys", generateApiKey);
router.get("/api-keys", getApiKeys);
router.put("/api-keys/:keyId/toggle", toggleApiKey);

export default router;