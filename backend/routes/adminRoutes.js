import express from "express";
import { verifyToken, checkRole } from "../middleware/auth.js";
import { updateManualPayment } from "../controllers/paymentController.js";
import { getAdminStats, getAllUsers, updateUserStatus, searchTransaction, updatePaymentByTransactionId } from "../controllers/adminController.js";

const router = express.Router();

// Admin only routes
router.use(verifyToken);
router.use(checkRole(['admin'])); // Add admin role to your system

router.get("/stats", getAdminStats);
router.post("/manual-payment", updateManualPayment);
router.get("/users", getAllUsers);
router.put("/users/:userId/status", updateUserStatus);
router.get("/transaction/:transactionId", searchTransaction);
router.put("/transaction/:transactionId", updatePaymentByTransactionId);

export default router;