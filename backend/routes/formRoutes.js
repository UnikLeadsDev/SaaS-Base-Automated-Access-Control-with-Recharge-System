import express from "express";
import { verifyToken } from "../middleware/auth.js";
import { checkFormAccess } from "../middleware/accessControl.js";
import { submitBasicForm, submitRealtimeForm } from "../controllers/formController.js";

const router = express.Router();

router.post("/basic", verifyToken, checkFormAccess('basic'), submitBasicForm);
router.post("/realtime", verifyToken, checkFormAccess('realtime_validation'), submitRealtimeForm);

export default router;