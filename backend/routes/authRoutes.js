import express from "express";
import { registerUser, loginUser, getUserProfile } from "../controllers/authController.js";
import { sendLoginOTP, verifyLoginOTP, resendOTP } from "../controllers/otpController.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/send-otp", sendLoginOTP);
router.post("/verify-otp", verifyLoginOTP);
router.post("/resend-otp", resendOTP);
router.get("/profile", verifyToken, getUserProfile);

export default router;
