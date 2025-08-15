import db from "../config/db.js";
import { deductFromWallet } from "./walletController.js";

// Submit basic loan form
export const submitBasicForm = async (req, res) => {
  const { applicantName, loanAmount, purpose } = req.body;

  if (!applicantName || !loanAmount || !purpose) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const rate = req.formRate; // Set by checkAccess middleware
    const accessType = req.accessType;
    const txnRef = `form_basic_${Date.now()}`;
    
    // Deduct from wallet only for prepaid users (within transaction)
    if (accessType === 'prepaid' && rate > 0) {
      // Check balance and deduct atomically
      const [wallet] = await connection.query(
        "SELECT balance FROM wallets WHERE user_id = ? FOR UPDATE",
        [req.user.id]
      );
      
      if (wallet.length === 0 || wallet[0].balance < rate) {
        throw new Error("Insufficient balance");
      }
      
      await connection.query(
        "UPDATE wallets SET balance = balance - ?, updated_at = NOW() WHERE user_id = ?",
        [rate, req.user.id]
      );
      
      await connection.query(
        "INSERT INTO transactions (user_id, amount, type, txn_ref) VALUES (?, ?, 'debit', ?)",
        [req.user.id, rate, txnRef]
      );
    }

    // Store application
    const [result] = await connection.query(
      "INSERT INTO applications (user_id, form_type, amount_charged, status) VALUES (?, 'basic', ?, 'pending')",
      [req.user.id, rate]
    );

    await connection.commit();
    
    res.json({
      message: "Basic form submitted successfully",
      applicationId: result.insertId,
      amountCharged: rate
    });
  } catch (error) {
    await connection.rollback();
    console.error("Basic Form Error:", error);
    res.status(500).json({ message: "Form submission failed" });
  } finally {
    connection.release();
  }
};

// Submit realtime validation form
export const submitRealtimeForm = async (req, res) => {
  const { applicantName, loanAmount, purpose, aadhaar, pan, bankAccount } = req.body;

  if (!applicantName || !loanAmount || !purpose || !aadhaar || !pan || !bankAccount) {
    return res.status(400).json({ message: "All fields are required for realtime validation" });
  }

  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const rate = req.formRate; // Set by checkAccess middleware
    const accessType = req.accessType;
    const txnRef = `form_realtime_${Date.now()}`;
    
    // Deduct from wallet only for prepaid users (within transaction)
    if (accessType === 'prepaid' && rate > 0) {
      // Check balance and deduct atomically
      const [wallet] = await connection.query(
        "SELECT balance FROM wallets WHERE user_id = ? FOR UPDATE",
        [req.user.id]
      );
      
      if (wallet.length === 0 || wallet[0].balance < rate) {
        throw new Error("Insufficient balance");
      }
      
      await connection.query(
        "UPDATE wallets SET balance = balance - ?, updated_at = NOW() WHERE user_id = ?",
        [rate, req.user.id]
      );
      
      await connection.query(
        "INSERT INTO transactions (user_id, amount, type, txn_ref) VALUES (?, ?, 'debit', ?)",
        [req.user.id, rate, txnRef]
      );
    }

    // Store application
    const [result] = await connection.query(
      "INSERT INTO applications (user_id, form_type, amount_charged, status) VALUES (?, 'realtime_validation', ?, 'pending')",
      [req.user.id, rate]
    );

    await connection.commit();
    
    // Simulate realtime validation (replace with actual API calls)
    const validationResults = {
      aadhaarValid: true,
      panValid: true,
      bankAccountValid: true
    };

    res.json({
      message: "Realtime validation form submitted successfully",
      applicationId: result.insertId,
      amountCharged: rate,
      validationResults
    });
  } catch (error) {
    await connection.rollback();
    console.error("Realtime Form Error:", error);
    res.status(500).json({ message: "Form submission failed" });
  } finally {
    connection.release();
  }
};

// Get user applications
export const getApplications = async (req, res) => {
  try {
    const [applications] = await db.query(
      "SELECT * FROM applications WHERE user_id = ? ORDER BY submitted_at DESC",
      [req.user.id]
    );

    res.json(applications);
  } catch (error) {
    console.error("Get Applications Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};