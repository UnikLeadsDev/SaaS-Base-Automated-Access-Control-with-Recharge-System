import express from "express";
import { registerUser, loginUser, googleLogin, getUserProfile } from "../controllers/authController.js";
import { sendLoginOTP, verifyLoginOTP, resendOTP } from "../controllers/otpController.js";
import { verifyToken } from "../middleware/auth.js";
import { authRateLimit } from "../middleware/security.js";
import { validate } from "../middleware/validation.js";

const router = express.Router();

// Apply strict rate limiting to auth endpoints (disabled for development)
// router.use(authRateLimit);

router.post("/register", validate('register'), registerUser);
router.post("/login", validate('login'), loginUser);
router.post("/google-login", googleLogin);
router.post("/send-otp", sendLoginOTP);
router.post("/verify-otp", verifyLoginOTP);
router.post("/resend-otp", resendOTP);
router.get("/profile", verifyToken, getUserProfile);

export default router;
