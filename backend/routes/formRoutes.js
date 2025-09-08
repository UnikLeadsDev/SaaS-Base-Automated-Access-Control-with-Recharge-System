import express from "express";
import { verifyToken } from "../middleware/auth.js";
import { checkFormAccess } from "../middleware/accessControl.js";
import { 
  submitBasicForm, 
  submitRealtimeForm, 
  getFormHistory, 
  getFormStats 
} from "../controllers/formController.js";

const router = express.Router();

// Form submission routes with access control
router.post("/basic", verifyToken, checkFormAccess('basic'), submitBasicForm);
router.post("/realtime", verifyToken, checkFormAccess('realtime'), submitRealtimeForm);

// Form history and statistics
router.get("/history", verifyToken, getFormHistory);
router.get("/stats", verifyToken, getFormStats);

export default router;