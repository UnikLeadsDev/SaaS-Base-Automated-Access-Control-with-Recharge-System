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
    
    // Deduct from wallet
    await deductFromWallet(userId, rate, txnRef, formName);

    // Save form and get user data in single query
    const [formResult] = await db.query(
      `INSERT INTO applications (user_id, form_type, amount_charged) VALUES (?, ?, ?)`,
      [userId, dbFormType, rate]
    );

    const [userData] = await db.query(
      `SELECT u.mobile, w.balance FROM users u 
       LEFT JOIN wallets w ON u.user_id = w.user_id 
       WHERE u.user_id = ?`,
      [userId]
    );

    // Auto-generate invoice (non-blocking)
    autoGenerateInvoice(userId, dbFormType, rate, `FORM_${formResult.insertId}`)
      .catch(err => console.error("Invoice generation failed:", err));

    // Send notification (non-blocking)
    if (userData[0]?.mobile) {
      notificationService.sendFormSubmitted(userData[0].mobile, formName, userId)
        .catch(err => console.error("Notification failed:", err));
    }

    res.json({
      success: true,
      message: `${formName} submitted successfully`,
      amountDeducted: rate,
      remainingBalance: userData[0]?.balance || 0
    });
  } catch (error) {
    console.error("Form submission error:", error);
    res.status(500).json({ message: "Form submission failed" });
  }
};

export const submitBasicForm = (req, res) => submitForm(req, res, 'basic');
export const submitRealtimeForm = (req, res) => submitForm(req, res, 'realtime');