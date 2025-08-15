import express from "express";
import { verifyToken, checkRole } from "../middleware/auth.js";
import { updateManualPayment } from "../controllers/paymentController.js";
import { getAllUsers, getUserDetails, blockUser, unblockUser } from "../controllers/adminController.js";

const router = express.Router();

// Admin only routes
router.use(verifyToken);
router.use(checkRole(['admin'])); // Add admin role to your system

router.post("/manual-payment", updateManualPayment);
router.get("/users", getAllUsers);
router.get("/users/:id", getUserDetails);
router.put("/users/:id/block", blockUser);
router.put("/users/:id/unblock", unblockUser);

export default router;