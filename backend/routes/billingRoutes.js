import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { requireRole } from '../middleware/accessControl.js';
import {
  generateInvoice,
  getInvoice,
  getUserInvoices,
  getBillingReport,
  calculateGST,
  markInvoicePaid,
  getBillingSummary,
  downloadInvoicePDF,
  getMonthlyStatement
} from '../controllers/billingController.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Generate invoice
router.post('/invoice', generateInvoice);

// Get specific invoice
router.get('/invoice/:invoiceId', getInvoice);

// Get user invoices
router.get('/invoices', getUserInvoices);

// Get billing report
router.get('/report', getBillingReport);

// Calculate GST
router.post('/calculate-gst', calculateGST);

// Get billing summary
router.get('/summary', getBillingSummary);

// Download invoice PDF
router.get('/invoice/:invoiceId/pdf', downloadInvoicePDF);

// Get monthly statement
router.get('/statement', getMonthlyStatement);

// Admin only routes
router.patch('/invoice/:invoiceId/paid', requireRole(['admin']), markInvoicePaid);

export default router;