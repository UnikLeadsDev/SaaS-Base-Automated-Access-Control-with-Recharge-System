import express from 'express';
import { verifyToken, checkRole } from '../middleware/auth.js';
import {
  getDailyTransactionReport,
  getMRRReport,
  getOutstandingBalancesByRole,
  getTransactionHistory,
  getReceiptHistory
} from '../controllers/reportController.js';

const router = express.Router();

// Admin-only reports
router.get('/daily-transactions', verifyToken, checkRole(['admin']), getDailyTransactionReport);
router.get('/mrr', verifyToken, checkRole(['admin']), getMRRReport);
router.get('/balances-by-role', verifyToken, checkRole(['admin']), getOutstandingBalancesByRole);

// Enhanced transaction and receipt endpoints with pagination
router.get('/transactions', verifyToken, getTransactionHistory);
router.get('/receipts', verifyToken, getReceiptHistory);

export default router;