import express from "express";
import { verifyToken, checkRole } from "../middleware/auth.js";
import { 
  createSupportTicket, 
  getUserTickets, 
  getAllTickets, 
  updateTicketStatus 
} from "../controllers/supportController.js";

const router = express.Router();

router.post("/create", verifyToken, createSupportTicket);
router.post("/ticket", verifyToken, createSupportTicket);
router.get("/tickets", verifyToken, getUserTickets);
router.get("/my-tickets", verifyToken, getUserTickets);
router.get("/all-tickets", verifyToken, checkRole(['admin']), getAllTickets);
router.put("/ticket/:id/status", verifyToken, checkRole(['admin']), updateTicketStatus);

export default router;