import express from "express";
import { generateCSRFToken } from "../middleware/csrf.js";

const router = express.Router();

// Get CSRF token endpoint
router.get("/csrf-token", generateCSRFToken);

export default router;