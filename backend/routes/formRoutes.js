import express from "express";
import { verifyToken } from "../middleware/auth.js";
import { checkSubscriptionAccess } from "../middleware/accessControl.js";
import { submitBasicForm, submitRealtimeForm } from "../controllers/formController.js";

const router = express.Router();

router.post("/basic", verifyToken, submitBasicForm);
router.post("/realtime", verifyToken, submitRealtimeForm);

export default router;