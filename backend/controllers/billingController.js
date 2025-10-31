import billingService from '../services/billingService.js';
import db from '../config/db.js';
import pdfGenerator from '../utils/pdfGenerator.js';
import path from 'path';
import fs from 'fs';

// Generate invoice for user
// routes/billing.js
export const createInvoiceDirect = async (req, res) => {
  try {
    const {
      userId,
      userName,
      userEmail,
      // invoiceNumber,
      invoiceDate,
      dueDate,
      subtotal,
      gstRate,
      gstAmount,
      totalAmount,
      status,
      paymentTerms,
      notes
    } = req.body;

    if (
      !userId ||
      !userName ||
      !userEmail ||
      // !invoiceNumber ||
      !invoiceDate ||
      !subtotal ||
      !gstRate ||
      !gstAmount ||
      !totalAmount
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required invoice fields"
      });
    }

    const connection = await db.getConnection();
    await connection.beginTransaction();

    const [lastInvoice] = await connection.query(
      `SELECT invoice_number FROM invoices ORDER BY invoice_id DESC LIMIT 1`
    );
    let newInvoiceNumber;
    if (lastInvoice.length > 0) {
      // Extract the numeric part from the last invoice number (e.g., "IN000001" -> 1)
      const lastNumber = parseInt(lastInvoice[0].invoice_number.replace('IN', ''));
      // Increment and pad with zeros
      newInvoiceNumber = `IN${String(lastNumber + 1).padStart(6, '0')}`;
    } else {
      // First invoice
      newInvoiceNumber = 'IN000001';
    }

    const [invoiceResult] = await connection.query(
      `
      INSERT INTO invoices 
      (user_id, invoice_number, invoice_date, due_date, subtotal, gst_rate, gst_amount, total_amount, status, payment_terms, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        userId,
        newInvoiceNumber,
        new Date(invoiceDate),
        new Date(dueDate),
        subtotal,
        gstRate,
        gstAmount,
        totalAmount,
        status || "draft",
        paymentTerms || "Net 30",
        notes || null
      ]
    );

    const invoiceId = invoiceResult.insertId;

    await connection.commit();

    res.json({
      success: true,
      message: "Invoice created successfully",
      invoice: {
        invoiceId,
        userId,
        userName,
        userEmail,
        invoiceNumber: newInvoiceNumber,
        invoiceDate,
        dueDate,
        subtotal,
        gstRate,
        gstAmount,
        totalAmount,
        status,
        paymentTerms,
        notes
      }
    });
  } catch (error) {
    console.error("Direct Invoice Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create invoice",
      error: error.message
    });
  }
};

// Get invoice details
export const getInvoice = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const userId = req.user.role === 'admin' ? null : req.user.id;

    const invoice = await billingService.getInvoice(invoiceId, userId);

    res.json({
      success: true,
      invoice
    });

  } catch (error) {
    console.error('Get Invoice Error:', error);
    if (error.message === 'Invoice not found') {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve invoice'
    });
  }
};

// Get user invoices
export const getUserInvoices = async (req, res) => {
  try {
    const userId = req.user.role === 'admin' ? req.query.userId : req.user.id;
    const { page = 1, limit = 10, status } = req.query;

    let query = `
      SELECT invoice_id, invoice_number, invoice_date, due_date, 
             total_amount, status, created_at
      FROM invoices 
      WHERE user_id = ?
    `;
    const params = [userId];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY invoice_date DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

    const [invoices] = await db.query(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM invoices WHERE user_id = ?';
    const countParams = [userId];
    if (status) {
      countQuery += ' AND status = ?';
      countParams.push(status);
    }

    const [countResult] = await db.query(countQuery, countParams);
    const total = countResult[0].total;

    res.json({
      success: true,
      invoices,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Get User Invoices Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve invoices'
    });
  }
};

// Generate billing report
export const getBillingReport = async (req, res) => {
  try {
    const userId = req.user.role === 'admin' ? req.query.userId : req.user.id;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    const report = await billingService.generateBillingReport(userId, startDate, endDate);

    res.json({
      success: true,
      report
    });

  } catch (error) {
    console.error('Billing Report Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate billing report'
    });
  }
};

// Calculate GST for amount
export const calculateGST = async (req, res) => {
  try {
    const { amount, isInterState = false } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid amount is required'
      });
    }

    // Get current GST rate
    const [gstConfig] = await db.query(
      'SELECT gst_rate FROM gst_config WHERE is_active = TRUE ORDER BY effective_from DESC LIMIT 1'
    );

    const gstRate = gstConfig[0]?.gst_rate || 18.00;
    const gstBreakdown = billingService.calculateGST(amount, gstRate, isInterState);

    res.json({
      success: true,
      amount: parseFloat(amount),
      gst_rate: gstRate,
      ...gstBreakdown,
      total_with_gst: parseFloat(amount) + gstBreakdown.total_gst
    });

  } catch (error) {
    console.error('GST Calculation Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate GST'
    });
  }
};

// Mark invoice as paid (admin only)
export const markInvoicePaid = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const { paymentReference } = req.body;

    await billingService.markInvoicePaid(invoiceId, paymentReference);

    res.json({
      success: true,
      message: 'Invoice marked as paid'
    });

  } catch (error) {
    console.error('Mark Invoice Paid Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update invoice status'
    });
  }
};

// Get billing summary
export const getBillingSummary = async (req, res) => {
  try {
    const userId = req.user.role === 'admin' ? req.query.userId : req.user.id;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const summary = await billingService.getUserBillingSummary(userId);

    res.json({
      success: true,
      summary
    });

  } catch (error) {
    console.error('Billing Summary Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve billing summary'
    });
  }
};

// Download invoice PDF
export const downloadInvoicePDF = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const userId = req.user.role === 'admin' ? null : req.user.id;

    const invoice = await billingService.getInvoice(invoiceId, userId);
    const pdfPath = path.join(process.cwd(), 'temp', `invoice-${invoiceId}.pdf`);

    // Ensure temp directory exists
    const tempDir = path.dirname(pdfPath);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
const stampPath = path.join(process.cwd(), 'NexargeStamp.png');

    await pdfGenerator.generateInvoicePDF(invoice, pdfPath, stampPath);

    // res.download(pdfPath, `Invoice-${invoice.invoice_number}.pdf`, (err) => {
    //   if (err) {
    //     console.error('PDF Download Error:', err);
    //   }
    //   // Clean up temp file
    //   fs.unlink(pdfPath, () => {});
    // });
    res.download(pdfPath, `${invoice.invoice_number}.pdf`, (err) => {
      if (err) {
        console.error('PDF Download Error:', err);
      }
      // Clean up temp file
      fs.unlink(pdfPath, () => { });
    });

  } catch (error) {
    console.error('Download Invoice PDF Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate PDF'
    });
  }
};

// Get monthly billing statement
export const getMonthlyStatement = async (req, res) => {
  try {
    const userId = req.user.role === 'admin' ? req.query.userId : req.user.id;
    const { year, month } = req.query;

    if (!year || !month) {
      return res.status(400).json({
        success: false,
        message: 'Year and month are required'
      });
    }

    const statement = await billingService.getMonthlyStatement(userId, year, month);

    res.json({
      success: true,
      statement
    });

  } catch (error) {
    console.error('Monthly Statement Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate monthly statement'
    });
  }
};

// Auto-generate invoice for form submissions (internal use)
export const autoGenerateInvoice = async (userId, formType, amount, referenceId) => {
  try {
    const items = [{
      description: `${formType === 'basic' ? 'Basic' : 'Realtime Validation'} Form Submission`,
      quantity: 1,
      unit_price: amount,
      item_type: 'form_submission',
      reference_id: referenceId
    }];

    const invoice = await billingService.generateInvoice(userId, items, {
      notes: `Auto-generated invoice for form submission ${referenceId}`,
      status: 'paid' // Mark as paid since amount is already deducted
    });

    return invoice;
  } catch (error) {
    console.error('Auto Generate Invoice Error:', error);
    throw error;
  }
};