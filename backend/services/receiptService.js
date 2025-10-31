// import db from '../config/db.js';
// import notificationService from './notificationService.js';

// class ReceiptService {
//   // Generate receipt for successful payment
//   async generateReceipt(userId, amount, paymentMode, txnRef) {
//     try {
//       // Get user details
//       const [user] = await db.query(
//         'SELECT name, email FROM users WHERE user_id = ?',
//         [userId]
//       );

//       if (user.length === 0) {
//         throw new Error('User not found');
//       }

//       // Create receipt
//       const [result] = await db.query(`
//         INSERT INTO receipts (user_id, txn_id, user_name, email, amount, payment_mode, receipt_date)
//         VALUES (?, ?, ?, ?, ?, ?, CURDATE())
//       `, [userId, txnRef, user[0].name, user[0].email, amount, paymentMode]);

//       const receiptId = result.insertId;

//       // Email receipt if email exists
//       if (user[0].email && process.env.ENABLE_EMAIL === 'true') {
//         const receiptData = {
//           receiptId,
//           userName: user[0].name,
//           amount,
//           paymentMode,
//           txnRef,
//           date: new Date().toLocaleDateString()
//         };

//         await this.emailReceipt(user[0].email, receiptData, userId);
//       }

//       return { receiptId, success: true };
//     } catch (error) {
//       console.error('Receipt generation error:', error);
//       throw error;
//     }
//   }

//   // Email receipt to user
//   async emailReceipt(email, receiptData, userId) {
//     const message = `Receipt #${receiptData.receiptId}: Payment of ₹${receiptData.amount} received via ${receiptData.paymentMode}. Txn: ${receiptData.txnRef}`;
    
//     await notificationService.queueNotification(
//       userId, 
//       'email', 
//       'receipt', 
//       email, 
//       message
//     );
//   }
// }

// export default new ReceiptService();

// services/receiptService.js
import db from "../config/db.js";

export const createReceipt = async ({ userId, txnRef, amount, paymentMode }) => {
  const [result] = await db.query(
    `INSERT INTO receipts (user_id, txn_id, amount, payment_mode, status, receipt_date, created_at) 
     VALUES (?, ?, ?, ?, 'success', NOW(), NOW())`,
    [userId, txnRef, amount, paymentMode]
  );
  return result.insertId;
};

export const getUserReceipts = async (userId) => {
  const [rows] = await db.query(
    `SELECT * FROM receipts WHERE user_id = ? ORDER BY created_at DESC`,
    [userId]
  );
  return rows;
};
