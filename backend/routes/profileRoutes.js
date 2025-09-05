import express from "express";
import { getProfile,saveCompanyProfile } from "../controllers/profileController.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// Get profile (user + company)
router.get("/profile", verifyToken, getProfile);

// Save / Update company profile
router.post("/profile/company", verifyToken,saveCompanyProfile);

export default router;
