import db from "../config/db.js";
import { deductFromWallet } from "./walletController.js";
import notificationService from "../services/notificationService.js";
import { autoGenerateInvoice } from "./billingController.js";

// Form rates cache
const FORM_RATES = {
  basic: () => parseFloat(process.env.BASIC_FORM_RATE) || 5,
  realtime: () => parseFloat(process.env.REALTIME_VALIDATION_RATE) || 50
};

// Common form submission handler
const submitForm = async (req, res, formType) => {
  const userId = req.user.id;
  const rate = FORM_RATES[formType]();
  const formName = formType === 'basic' ? 'Basic Form' : 'Realtime Validation';
  const dbFormType = formType === 'basic' ? 'basic' : 'realtime_validation';

  try {
    const txnRef = `${formType.toUpperCase()}_${Date.now()}_${userId}`;
    let amountCharged = 0;
    
    // Only deduct from wallet if using wallet access (not subscription)
    if (req.accessType === 'wallet') {
      await deductFromWallet(userId, rate, txnRef, formName);
      amountCharged = rate;
    }

    // Save form submission
    const [formResult] = await db.query(
      `INSERT INTO applications (user_id, form_type, amount_charged) VALUES (?, ?, ?)`,
      [userId, dbFormType, amountCharged]
    );

    const [userData] = await db.query(
      `SELECT u.mobile, w.balance FROM users u 
       LEFT JOIN wallets w ON u.user_id = w.user_id 
       WHERE u.user_id = ?`,
      [userId]
    );

    // Auto-generate invoice only for wallet transactions
    if (amountCharged > 0) {
      autoGenerateInvoice(userId, dbFormType, amountCharged, `FORM_${formResult.insertId}`)
        .catch(err => console.error("Invoice generation failed:", err));
    }

    // Send notification (non-blocking)
    if (userData[0]?.mobile) {
      notificationService.sendFormSubmitted(userData[0].mobile, formName, userId)
        .catch(err => console.error("Notification failed:", err));
    }

    res.json({
      success: true,
      message: `${formName} submitted successfully`,
      accessType: req.accessType,
      amountDeducted: amountCharged,
      remainingBalance: userData[0]?.balance || 0,
      applicationId: `APP_${formResult.insertId}`
    });
  } catch (error) {
    console.error("Form submission error:", error);
    
    if (error.message === 'Insufficient balance') {
      return res.status(403).json({ 
        success: false,
        message: "Insufficient wallet balance",
        code: 'INSUFFICIENT_BALANCE'
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: "Form submission failed" 
    });
  }
};

export const submitBasicForm = (req, res) => submitForm(req, res, 'basic');
export const submitRealtimeForm = (req, res) => submitForm(req, res, 'realtime');

// Get form submission history
export const getFormHistory = async (req, res) => {
  try {
    const [applications] = await db.query(
      `SELECT app_id, form_type, amount_charged, status, submitted_at 
       FROM applications 
       WHERE user_id = ? 
       ORDER BY submitted_at DESC 
       LIMIT 50`,
      [req.user.id]
    );

    res.json({
      success: true,
      applications: applications.map(app => ({
        ...app,
        applicationId: `APP_${app.app_id}`,
        formType: app.form_type === 'basic' ? 'Basic Form' : 'Realtime Validation'
      }))
    });
  } catch (error) {
    console.error("Get form history error:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch form history" 
    });
  }
};

// Get form statistics
export const getFormStats = async (req, res) => {
  try {
    const [stats] = await db.query(
      `SELECT 
         form_type,
         COUNT(*) as count,
         SUM(amount_charged) as total_spent,
         AVG(amount_charged) as avg_cost
       FROM applications 
       WHERE user_id = ? 
       GROUP BY form_type`,
      [req.user.id]
    );

    const [totalStats] = await db.query(
      `SELECT 
         COUNT(*) as total_forms,
         SUM(amount_charged) as total_amount
       FROM applications 
       WHERE user_id = ?`,
      [req.user.id]
    );

    res.json({
      success: true,
      stats: {
        byType: stats,
        total: totalStats[0] || { total_forms: 0, total_amount: 0 }
      }
    });
  } catch (error) {
    console.error("Get form stats error:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch form statistics" 
    });
  }
};