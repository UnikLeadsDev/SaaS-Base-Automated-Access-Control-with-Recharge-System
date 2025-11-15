import express from "express";
import { getProfile,saveCompanyProfile,updatePassword ,getCompanyProfile} from "../controllers/profileController.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// Get profile (user + company)
router.get("/profile", verifyToken, getProfile);

// Save / Update company profile
router.post("/profile/company", verifyToken,saveCompanyProfile);
//password update
router.post("/update-password", verifyToken, updatePassword);

router.get("/profile/company", verifyToken, getCompanyProfile);

export default router;
