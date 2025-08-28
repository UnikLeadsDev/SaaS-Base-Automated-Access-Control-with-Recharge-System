import express from "express";
import { verifyToken, checkRole } from "../middleware/auth.js";
import { 
  createSupportTicket, 
  getUserTickets, 
  updateTicketStatus 
} from "../controllers/supportController.js";
import multer from "multer";

// Configure multer (memory storage)
const storage = multer.memoryStorage();
const upload = multer({ storage });

const router = express.Router();

// Use multer for create ticket route
router.post("/create", verifyToken, upload.single("attachment"), createSupportTicket);
router.get("/tickets", verifyToken, getUserTickets);
router.put("/tickets/:ticketId/status", verifyToken, checkRole(['admin']), updateTicketStatus);

export default router;
