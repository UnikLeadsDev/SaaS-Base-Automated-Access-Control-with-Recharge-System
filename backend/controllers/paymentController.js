import Razorpay from "razorpay";
import crypto from "crypto";
import { addToWallet } from "./walletController.js";
import db from "../config/db.js";
import https from "https";
import PaytmChecksum from "paytmchecksum";
import nodemailer from "nodemailer";



const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create payment order
export const createPaymentOrder = async (req, res) => {
  const { amount } = req.body;

  if (!amount || amount < 1) {
    return res.status(400).json({ message: "Invalid amount" });
  }

  try {
    const options = {
      amount: amount * 100, // Convert to paise
      currency: "INR",
      receipt: `receipt_${req.user.id}_${Date.now()}`,
      notes: {
        user_id: req.user.id,
        email: req.user.email
      }
    };

    const order = await razorpay.orders.create(options);
    
    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    console.error("Payment Order Error:", error);
    res.status(500).json({ message: "Failed to create payment order" });
  }
};

// Verify payment and update wallet
export const verifyPayment = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  try {
    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: "Invalid payment signature" });
    }

    // Get payment details
    const payment = await razorpay.payments.fetch(razorpay_payment_id);
    const amount = payment.amount / 100; // Convert from paise
   console.log("payment details:",req.user);
    // Add to wallet
    const walletResult = await addToWallet(req.user.id, amount, razorpay_payment_id, 'razorpay');

    // Try to create receipt (ignore errors)
    try {
      const [user] = await db.query('SELECT name, email FROM users WHERE user_id = ?', [req.user.id]);
      await db.query(`
        INSERT IGNORE INTO receipts (user_id, txn_ref, amount, payment_mode, status)
        VALUES (?, ?, ?, 'razorpay', 'success')
      `, [req.user.id, razorpay_payment_id, amount]);
    } catch (receiptError) {
      console.log('Receipt creation failed:', receiptError.message);
    }

    res.json({ 
      success: true,
      message: "Payment verified and wallet updated", 
      amount,
      newBalance: walletResult.newBalance
    });
  } catch (error) {
    console.error("Payment Verification Error:", error);
    res.status(500).json({ message: "Payment verification failed: " + error.message });
  }
};

// Webhook handler for automatic payment updates
export const handleWebhook = async (req, res) => {
  const webhookSignature = req.headers["x-razorpay-signature"];
  const webhookBody = req.rawBody || JSON.stringify(req.body);

  try {
    // Verify webhook signature using raw body
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(webhookBody)
      .digest("hex");

    if (expectedSignature !== webhookSignature) {
      console.warn('Webhook signature mismatch');
      return res.status(400).json({ message: "Invalid webhook signature" });
    }

    const { event, payload } = req.body;
    const webhookId = req.headers['x-razorpay-event-id'] || `webhook_${Date.now()}`;

    // Check if webhook already processed
    const [existing] = await db.query(
      'SELECT event_id FROM webhook_events WHERE webhook_id = ?',
      [webhookId]
    );
    
    if (existing.length > 0) {
      console.log('Webhook already processed:', webhookId);
      return res.json({ status: "ok", message: "already processed" });
    }

    if (event === "payment.captured") {
      const payment = payload.payment.entity;
      const userId = payment.notes?.user_id;
      const amount = payment.amount / 100;
      const paymentId = payment.id;

      // Validate required fields
      if (!userId || !amount || !paymentId) {
        console.error('Missing required webhook data:', { userId, amount, paymentId });
        return res.status(400).json({ message: "Missing required payment data" });
      }

      // Check payment idempotency
      const [processed] = await db.query(
        'SELECT payment_id FROM processed_payments WHERE payment_id = ?',
        [paymentId]
      );
      
      if (processed.length > 0) {
        console.log('Payment already processed:', paymentId);
        return res.json({ status: "ok", message: "payment already processed" });
      }

      // Process payment in transaction
      const connection = await db.getConnection();
      try {
        await connection.beginTransaction();

        // Record webhook event
        await connection.query(
          'INSERT INTO webhook_events (webhook_id, event_type, payment_id, amount, user_id, processed) VALUES (?, ?, ?, ?, ?, TRUE)',
          [webhookId, event, paymentId, amount, userId]
        );

        // Record processed payment
        await connection.query(
          'INSERT INTO processed_payments (payment_id, user_id, amount, txn_ref) VALUES (?, ?, ?, ?)',
          [paymentId, userId, amount, paymentId]
        );

        // Add to wallet
        await addToWallet(userId, amount, paymentId, 'razorpay');

        await connection.commit();
        console.log('Payment processed successfully:', { paymentId, userId, amount });
        
        // Generate receipt (outside transaction)
        const receiptService = (await import('../services/receiptService.js')).default;
        await receiptService.generateReceipt(userId, amount, 'razorpay', paymentId);
        
        // Send notification (outside transaction)
        await sendPaymentNotification(userId, amount, "payment_success");
        
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } else {
      // Log other webhook events without processing
      await db.query(
        'INSERT INTO webhook_events (webhook_id, event_type, processed) VALUES (?, ?, TRUE)',
        [webhookId, event]
      );
    }

    res.json({ status: "ok" });
  } catch (error) {
    console.error("Webhook Error:", { 
      error: error.message, 
      webhookId: req.headers['x-razorpay-event-id'],
      event: req.body?.event 
    });
    res.status(500).json({ message: "Webhook processing failed" });
  }
};

// Manual payment update (admin only)
export const updateManualPayment = async (req, res) => {
  const { userId, amount, txnRef, source, reason, userName, email, receiptDate } = req.body;

  // Validate required fields
  if (!userId || isNaN(parseInt(userId, 10))) {
    return res.status(400).json({ message: "Valid userId is required" });
  }
  if (amount === undefined || amount === null || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
    return res.status(400).json({ message: "Valid positive amount is required" });
  }
  if (!txnRef || typeof txnRef !== 'string' || txnRef.trim().length < 4) {
    return res.status(400).json({ message: "Valid txnRef is required" });
  }
  const allowedSources = ['cash', 'upi', 'card', 'netbanking', 'wallet', 'other'];
  if (!source || !allowedSources.includes(source)) {
    return res.status(400).json({ message: `source must be one of: ${allowedSources.join(', ')}` });
  }

  const adminId = req.user?.id;
  if (!adminId) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const amt = parseFloat(amount);
  const txRef = txnRef.trim();
  const receipt_date = receiptDate ? new Date(receiptDate) : new Date();

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Ensure target user exists and active
    const [userRows] = await connection.query(
      "SELECT user_id, status, name, email FROM users WHERE user_id = ?",
      [userId]
    );
    if (userRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "User not found" });
    }
    if (userRows[0].status !== 'active') {
      await connection.rollback();
      return res.status(400).json({ message: "Target user account is not active" });
    }

    // Upsert receipt using txnRef as txn_id
    const [existingReceipt] = await connection.query(
      "SELECT receipt_id FROM receipts WHERE txn_id = ?",
      [txRef]
    );
    if (existingReceipt.length > 0) {
      await connection.query(
        "UPDATE receipts SET user_id = ?, user_name = ?, email = ?, amount = ?, payment_mode = ?, status = 'success', receipt_date = ? WHERE txn_id = ?",
        [userId, userName || userRows[0].name || null, email || userRows[0].email || null, amt, source, receipt_date, txRef]
      );
    } else {
      await connection.query(
        "INSERT INTO receipts (user_id, txn_id, user_name, email, amount, payment_mode, status, receipt_date) VALUES (?, ?, ?, ?, ?, ?, 'success', ?)",
        [userId, txRef, userName || userRows[0].name || null, email || userRows[0].email || null, amt, source, receipt_date]
      );
    }

    // Credit wallet and record transaction with payment_mode = 'manual'
    // addToWallet enforces idempotency on txn_ref
    await addToWallet(userId, amt, txRef, 'manual');

    // Admin audit table (create if not exists) and insert audit record
    await connection.query(
      "CREATE TABLE IF NOT EXISTS admin_audit (\n        audit_id INT PRIMARY KEY AUTO_INCREMENT,\n        admin_id INT NOT NULL,\n        action VARCHAR(100) NOT NULL,\n        target_user_id INT NOT NULL,\n        amount DECIMAL(10,2) NULL,\n        txn_ref VARCHAR(255) NULL,\n        reason TEXT NULL,\n        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n        INDEX idx_admin_created (admin_id, created_at)\n      )"
    );
    await connection.query(
      "INSERT INTO admin_audit (admin_id, action, target_user_id, amount, txn_ref, reason) VALUES (?, 'manual_payment_credit', ?, ?, ?, ?)",
      [adminId, userId, amt, txRef, reason || null]
    );

    await connection.commit();

    // Notify user
    await sendPaymentNotification(userId, amt, "payment_success");

    const [wallet] = await db.query('SELECT balance FROM wallets WHERE user_id = ?', [userId]);
    return res.json({
      success: true,
      message: "Manual payment credited successfully",
      newBalance: wallet[0]?.balance || 0,
      txnRef: txRef
    });
  } catch (error) {
    try { await connection.rollback(); } catch {}
    console.error("Manual Payment Error:", error);
    if (String(error.message).includes('Transaction already processed')) {
      return res.status(409).json({ message: "Transaction already processed" });
    }
    return res.status(500).json({ message: "Failed to update manual payment" });
  } finally {
    connection.release();
  }
};

// Helper function to send payment notifications
const sendPaymentNotification = async (userId, amount, type) => {
  try {
    const [user] = await db.query('SELECT mobile FROM users WHERE user_id = ?', [userId]);
    if (user[0]?.mobile) {
      const notificationService = (await import('../services/notificationService.js')).default;
      await notificationService.sendPaymentSuccess(user[0].mobile, amount, null, userId);
    }
  } catch (error) {
    console.error("Notification Error:", error);
  }
};



// export const verifyQRPayment = async (req, res) => {
//   try {
//     const { orderId } = req.body; // from frontend form (Transaction ID)

//     if (!orderId) {
//       return res.status(400).json({ error: "Order ID is required" });
//     }

//     const paytmParams = {
//       body: {
//         mid: process.env.PAYTM_MID,   // your MID
//         orderId: orderId,
//       },
//     };

//     // ✅ Generate checksum using merchant key
//     const checksum = await PaytmChecksum.generateSignature(
//       JSON.stringify(paytmParams.body),
//       process.env.PAYTM_MERCHANT_KEY
//     );

//     paytmParams.head = {
//       signature: checksum,
//     };

//     const post_data = JSON.stringify(paytmParams);

//     const options = {
//       hostname: "secure.paytm.in", // for Production (use securestage.paytm.in for staging)
//       port: 443,
//       path: "/v3/order/status",
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         "Content-Length": post_data.length,
//       },
//     };

//     // ✅ Make HTTPS request
//     let response = "";
//     const post_req = https.request(options, function (post_res) {
//       post_res.on("data", function (chunk) {
//         response += chunk;
//       });

//       post_res.on("end", function () {
//         try {
//           const parsed = JSON.parse(response);
//           console.log("Paytm Response:", parsed);

//           if (parsed?.body?.resultInfo?.resultStatus === "TXN_SUCCESS") {
//             res.json({
//               success: true,
//               status: parsed.body.resultInfo.resultStatus,
//               orderId: parsed.body.orderId,
//               txnId: parsed.body.txnId,
//               amount: parsed.body.txnAmount,
//               message: parsed.body.resultInfo.resultMsg,
//             });
//           } else {
//             res.json({
//               success: false,
//               status: parsed.body.resultInfo.resultStatus,
//               message: parsed.body.resultInfo.resultMsg,
//             });
//           }
//         } catch (err) {
//           console.error("Error parsing Paytm response:", err);
//           res.status(500).json({ error: "Invalid Paytm response" });
//         }
//       });
//     });

//     post_req.on("error", (err) => {
//       console.error("Paytm API request failed:", err);
//       res.status(500).json({ error: "Paytm request failed" });
//     });

//     post_req.write(post_data);
//     post_req.end();
//   } catch (error) {
//     console.error("Verification Error:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// };

export const requestVerificationOtp = async (req, res) => {
  try {
    const { txnId, txnAmount, upiId, txnDate } = req.body;
    const userEmail = req.user.email;
    const adminEmail = process.env.ADMIN_EMAIL;

    if (!txnId || !upiId || !txnAmount || !txnDate) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now

    // Save OTP record
    await db.query(
      `INSERT INTO otp_verifications (txn_id, otp, expires_at, status)
       VALUES (?, ?, ?, 'pending')`,
      [txnId, otp, expiresAt]
    );

    // Configure mailer
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Email to both user and admin
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: [userEmail, adminEmail],
      subject: "Paytm QR Payment Verification Request",
      html: `
        <h2>Payment Verification Request</h2>
        <p><b>Transaction ID:</b> ${txnId}</p>
        <p><b>UPI ID:</b> ${upiId}</p>
        <p><b>Amount:</b> ₹${txnAmount}</p>
        <p><b>Date:</b> ${txnDate}</p>
        <hr/>
        <p><b>One-Time Password (OTP):</b> 
        <span style="font-size:18px; color:blue;">${otp}</span></p>
        <p>This OTP is valid for 5 minutes.</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.json({
      success: true,
      message: "OTP sent successfully to user and admin email.",
    });
  } catch (error) {
    console.error("OTP Generation Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};




export const verifyOtp = async (req, res) => {
  try {
    const { txnId, txnDate, otp } = req.body;
    console.log("Verifying OTP:", { txnId, txnDate, otp });

    if (!txnId || !txnDate || !otp) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    // Fetch the latest pending OTP for this transaction
    const [rows] = await db.query(
      `SELECT * FROM otp_verifications 
       WHERE txn_id = ? AND status = 'pending' 
       ORDER BY created_at DESC LIMIT 1`,
      [txnId]
    );

    if (rows.length === 0) {
      return res.status(400).json({ success: false, message: "No pending OTP found for this transaction" });
    }

    const record = rows[0];

    // Check expiration
    if (new Date(record.expires_at) < new Date()) {
      await db.query(`UPDATE otp_verifications SET status = 'expired' WHERE otp_id = ?`, [record.otp_id]);
      return res.status(400).json({ success: false, message: "OTP has expired" });
    }

    // Check OTP match
    if (record.otp !== otp) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    // OTP valid → mark verified
    await db.query(`UPDATE otp_verifications SET status = 'verified' WHERE otp_id = ?`, [record.otp_id]);

    res.status(200).json({
      success: true,
      message: "OTP verified successfully",
      data: {
        txnId: record.txn_id,
        txnDate,
      },
    });
  } catch (error) {
    console.error("OTP Verify Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

