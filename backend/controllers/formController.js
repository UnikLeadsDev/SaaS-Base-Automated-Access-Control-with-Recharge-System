import db from "../config/db.js";
import { deductFromWallet } from "./walletController.js";
import notificationService from "../services/notificationService.js";
import { autoGenerateInvoice } from "./billingController.js";

// Submit basic form
export const submitBasicForm = async (req, res) => {
  const { applicantName, loanAmount, purpose } = req.body;
  const userId = req.user.id;  // ✅ logged-in userId
  const rate = parseFloat(process.env.BASIC_FORM_RATE) || 5;

  try {
    // Generate unique transaction reference
    const txnRef = `BASIC_${Date.now()}_${userId}`;
    
    // Deduct amount from wallet
    await deductFromWallet(userId, rate, txnRef, "Basic Form");

    // Save form submission (use applications table as per schema)
    const [formResult] = await db.query(
      `INSERT INTO applications 
        (user_id, form_type, amount_charged) 
       VALUES (?, 'basic', ?)`,
      [userId, rate]
    );

    // Auto-generate invoice
    try {
      await autoGenerateInvoice(
        userId,
        "basic",
        rate,
        `FORM_${formResult.insertId}`
      );
    } catch (invoiceError) {
      console.error("Invoice generation failed:", invoiceError);
    }

    // Get user mobile & wallet balance
    const [user] = await db.query("SELECT mobile FROM users WHERE user_id = ?", [userId]);
    const [wallet] = await db.query("SELECT balance FROM wallets WHERE user_id = ?", [userId]);

    // Send notification
    if (user[0]?.mobile) {
      await notificationService.sendFormSubmitted(
        user[0].mobile,
        "Basic Form",
        userId // ✅ fixed
      );
    }

    res.json({
      success: true,
      message: "Basic form submitted successfully",
      amountDeducted: rate,
      remainingBalance: wallet[0].balance
    });
  } catch (error) {
    console.error("Form submission error:", error);
    res.status(500).json({ message: "Form submission failed" });
  }
};

// Submit realtime validation form
export const submitRealtimeForm = async (req, res) => {
  const { applicantName, loanAmount, purpose, aadhaar, pan, bankAccount } = req.body;
  const userId = req.user.id;
  const rate = parseFloat(process.env.REALTIME_VALIDATION_RATE) || 50;

  try {
    // Generate unique transaction reference
    const txnRef = `REALTIME_${Date.now()}_${userId}`;
    
    // Deduct amount from wallet
    await deductFromWallet(userId, rate, txnRef, "Realtime Validation");

    // Save form submission (use applications table as per schema)
    const [formResult] = await db.query(
      `INSERT INTO applications 
        (user_id, form_type, amount_charged) 
       VALUES (?, 'realtime_validation', ?)`,
      [userId, rate]
    );

    // Auto-generate invoice
    try {
      await autoGenerateInvoice(
        userId,
        "realtime_validation",
        rate,
        `FORM_${formResult.insertId}`
      );
    } catch (invoiceError) {
      console.error("Invoice generation failed:", invoiceError);
    }

    // Get user mobile & wallet balance
    const [user] = await db.query("SELECT mobile FROM users WHERE user_id = ?", [userId]);
    const [wallet] = await db.query("SELECT balance FROM wallets WHERE user_id = ?", [userId]);

    // Send notification
    if (user[0]?.mobile) {
      await notificationService.sendFormSubmitted(
        user[0].mobile,
        "Realtime Validation",
        userId // ✅ fixed
      );
    }

    res.json({
      success: true,
      message: "Realtime validation form submitted successfully",
      amountDeducted: rate,
      remainingBalance: wallet[0].balance
    });
  } catch (error) {
    console.error("Form submission error:", error);
    res.status(500).json({ message: "Form submission failed" });
  }
};
