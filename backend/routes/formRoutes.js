import express from "express";
import { verifyToken } from "../middleware/auth.js";
import { checkSubscriptionAccess } from "../middleware/accessControl.js";
import { submitBasicForm, submitRealtimeForm } from "../controllers/formController.js";

const router = express.Router();

router.post("/basic", verifyToken, checkSubscriptionAccess("basic"), submitBasicForm);
router.post("/realtime", verifyToken, checkSubscriptionAccess("realtime"), submitRealtimeForm);

export default router;