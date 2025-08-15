import express from "express";
import authRoutes from "./authRoutes.js";
import walletRoutes from "./walletRoutes.js";
import paymentRoutes from "./paymentRoutes.js";
import formRoutes from "./formRoutes.js";
import adminRoutes from "./adminRoutes.js";

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/wallet", walletRoutes);
router.use("/payment", paymentRoutes);
router.use("/forms", formRoutes);
router.use("/admin", adminRoutes);

export default router;