import db from '../config/db.js';

// Transaction wrapper with automatic rollback
export const withTransaction = async (callback) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// Atomic wallet operations
export class WalletTransaction {
  constructor(connection) {
    this.connection = connection;
  }

  async lockWallet(userId) {
    const [wallet] = await this.connection.query(
      'SELECT balance FROM wallets WHERE user_id = ? FOR UPDATE',
      [userId]
    );
    
    if (wallet.length === 0) {
      throw new Error('Wallet not found');
    }
    
    return wallet[0];
  }

  async updateBalance(userId, amount, operation = 'add') {
    const operator = operation === 'add' ? '+' : '-';
    
    await this.connection.query(
      `UPDATE wallets SET balance = balance ${operator} ?, updated_at = NOW() WHERE user_id = ?`,
      [Math.abs(amount), userId]
    );
  }

  async recordTransaction(userId, amount, type, txnRef, paymentMode = 'system') {
    await this.connection.query(
      'INSERT INTO transactions (user_id, amount, type, txn_ref, payment_mode) VALUES (?, ?, ?, ?, ?)',
      [userId, amount, type, txnRef, paymentMode]
    );
  }

  async checkDuplicateTransaction(txnRef, type) {
    const [existing] = await this.connection.query(
      'SELECT id FROM transactions WHERE txn_ref = ? AND type = ?',
      [txnRef, type]
    );
    
    return existing.length > 0;
  }
}