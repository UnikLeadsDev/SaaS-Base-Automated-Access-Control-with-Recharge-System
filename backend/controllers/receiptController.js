import db from "../config/db.js";
import nodemailer from "nodemailer";

// List receipts for logged-in user
export const listReceipts = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT receipt_id, txn_id as txn_ref, amount, payment_mode, status, receipt_date, created_at FROM receipts WHERE user_id = ? ORDER BY created_at DESC",
      [req.user.id]
    );
    res.json(rows);
  } catch (error) {
    console.error("List Receipts Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Create a receipt after successful payment
export const createReceipt = async (req, res) => {
  try {
    const { txnId, amount, paymentMode, userName, userEmail } = req.body;
    

    if (!txnId || !amount || !paymentMode) {
      return res.status(400).json({ message: "txnId, amount and paymentMode are required" });
    }

    // Prevent duplicate receipts for same txn
    const [existing] = await db.query(
      "SELECT receipt_id FROM receipts WHERE txn_id = ?",
      [txnId]
    );
    if (existing.length > 0) {
      return res.status(200).json({ success: true, message: "Receipt already exists" });
    }

    const [user] = await db.query(
  "SELECT name, email FROM users WHERE user_id = ?",
  [req.user.id]
);


    await db.query(
  `INSERT INTO receipts (user_id, txn_id, user_name, email, amount, payment_mode, status, receipt_date)
   VALUES (?, ?, ?, ?, ?, ?, 'success', CURDATE())`,
  [req.user.id, txnId, user[0].name, user[0].email, amount, paymentMode]
);

    res.json({ success: true });
  } catch (error) {
    console.error("Create Receipt Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Optional: send receipt via email
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendReceipt = async (req, res) => {
  const { email, pdfBase64, txnId } = req.body;

  try {
    const mailOptions = {
      from: `"SaaS Base" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Your Receipt - Transaction ${txnId}`,
      text: "Thank you for your payment. Please find your receipt attached.",
      attachments: [
        {
          filename: `Recharge Wallet Receipt.pdf`,
          content: pdfBase64.split("base64,")[1],
          encoding: "base64",
        },
      ],
    };

    await transporter.sendMail(mailOptions);

    res.json({ success: true, message: "Receipt sent successfully!" });
  } catch (error) {
    console.error("Email error:", error);
    res.status(500).json({ success: false, message: "Failed to send email." });
  }
};

