import nodemailer from "nodemailer";
import db from "../config/db.js";

// Nodemailer config
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,   // your gmail
    pass: process.env.EMAIL_PASS,   // your app password
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
          filename: `Recharge Wallet Receipt.pdf`,
          content: pdfBase64.split("base64,")[1], // remove data prefix
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




// Create receipt
// Create receipt
export const createReceipt = async (req, res) => {
  const { userName, userEmail, txnId, amount, paymentMode, date } = req.body;

  if (!txnId || !amount || !paymentMode || !userName || !userEmail) {
    return res.status(400).json({ 
      message: "Username, User Email, Transaction ID, amount, and payment mode are required" 
    });
  }

  try {
    const [result] = await db.query(
      `INSERT INTO receipts (user_id, txn_id, user_name, email, amount, payment_mode, receipt_date) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, txnId, userName, userEmail, amount, paymentMode, date || new Date()]
    );

    res.status(201).json({
      message: "Receipt created successfully",
      receiptId: result.insertId,
    });
  } catch (error) {
    console.error("Create Receipt Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};


// Get all receipts of logged-in user
export const getUserReceipts = async (req, res) => {
  try {
    const [receipts] = await db.query(
      "SELECT * FROM receipts WHERE user_id = ? ORDER BY created_at DESC",
      [req.user.id]
    );
    res.json(receipts);
  } catch (error) {
    console.error("Get Receipts Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get single receipt details
export const getReceiptDetails = async (req, res) => {
  const { id } = req.params;

  try {
    const [receipt] = await db.query(`
      SELECT r.*, u.name, u.email 
      FROM receipts r 
      JOIN users u ON r.user_id = u.user_id 
      WHERE r.receipt_id = ? AND r.user_id = ?
    `, [id, req.user.id]);

    if (receipt.length === 0) {
      return res.status(404).json({ message: "Receipt not found" });
    }

    res.json(receipt[0]);
  } catch (error) {
    console.error("Get Receipt Details Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Reports (admin)
export const getReceiptsReport = async (req, res) => {
  try {
    const [totalRevenue] = await db.query(
      "SELECT SUM(amount) as total FROM receipts"
    );

    const [monthlyRevenue] = await db.query(`
      SELECT MONTH(created_at) as month, YEAR(created_at) as year, SUM(amount) as revenue
      FROM receipts 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
      GROUP BY YEAR(created_at), MONTH(created_at)
      ORDER BY year DESC, month DESC
    `);

    res.json({
      totalRevenue: totalRevenue[0].total || 0,
      monthlyRevenue,
    });
  } catch (error) {
    console.error("Get Receipts Report Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

