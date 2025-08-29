import db from '../config/db.js';

class BillingService {
  // Generate invoice for user transactions
  async generateInvoice(userId, items, options = {}) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // Get user details
      const [user] = await connection.query(
        'SELECT name, email, mobile FROM users WHERE user_id = ?',
        [userId]
      );

      if (user.length === 0) {
        throw new Error('User not found');
      }

      // Get current GST rates
      const [gstConfig] = await connection.query(
        'SELECT * FROM gst_config WHERE is_active = TRUE ORDER BY effective_from DESC LIMIT 1'
      );

      const gstRate = gstConfig[0]?.gst_rate || 18.00;
      
      // Calculate totals
      const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
      const gstAmount = (subtotal * gstRate) / 100;
      const totalAmount = subtotal + gstAmount;

      // Generate invoice number
      const invoiceNumber = await this.generateInvoiceNumber();
      
      const invoiceDate = new Date();
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30); // 30 days payment terms

      // Create invoice
      const [invoiceResult] = await connection.query(`
        INSERT INTO invoices (user_id, invoice_number, invoice_date, due_date, 
                            subtotal, gst_rate, gst_amount, total_amount, 
                            payment_terms, notes, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        userId, invoiceNumber, invoiceDate, dueDate,
        subtotal, gstRate, gstAmount, totalAmount,
        options.paymentTerms || 'Net 30',
        options.notes || null,
        options.status || 'sent'
      ]);

      const invoiceId = invoiceResult.insertId;

      // Add invoice items
      for (const item of items) {
        const lineTotal = item.quantity * item.unit_price;
        await connection.query(`
          INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, 
                                   line_total, item_type, reference_id)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
          invoiceId, item.description, item.quantity, item.unit_price,
          lineTotal, item.item_type || 'other', item.reference_id || null
        ]);
      }

      await connection.commit();

      return {
        invoiceId,
        invoiceNumber,
        subtotal,
        gstAmount,
        totalAmount,
        success: true
      };

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // Generate unique invoice number
  async generateInvoiceNumber() {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    
    const [result] = await db.query(
      'SELECT COUNT(*) as count FROM invoices WHERE YEAR(invoice_date) = ? AND MONTH(invoice_date) = ?',
      [year, month]
    );
    
    const sequence = String(result[0].count + 1).padStart(4, '0');
    return `INV-${year}${month}-${sequence}`;
  }

  // Get invoice details
  async getInvoice(invoiceId, userId = null) {
    let query = `
      SELECT i.*, u.name as user_name, u.email, u.mobile,
             c.company_name, c.address, c.city, c.state, c.pincode, 
             c.gstin, c.pan, c.email as company_email, c.phone as company_phone
      FROM invoices i
      JOIN users u ON i.user_id = u.user_id
      CROSS JOIN company_details c
      WHERE i.invoice_id = ?
    `;
    
    const params = [invoiceId];
    if (userId) {
      query += ' AND i.user_id = ?';
      params.push(userId);
    }

    const [invoice] = await db.query(query, params);
    
    if (invoice.length === 0) {
      throw new Error('Invoice not found');
    }

    // Get invoice items
    const [items] = await db.query(
      'SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY item_id',
      [invoiceId]
    );

    return {
      ...invoice[0],
      items
    };
  }

  // Generate billing report
  async generateBillingReport(userId, startDate, endDate) {
    const [transactions] = await db.query(`
      SELECT 
        DATE(t.created_at) as date,
        COUNT(CASE WHEN t.type = 'credit' THEN 1 END) as credits,
        COUNT(CASE WHEN t.type = 'debit' THEN 1 END) as debits,
        SUM(CASE WHEN t.type = 'credit' THEN t.amount ELSE 0 END) as total_credits,
        SUM(CASE WHEN t.type = 'debit' THEN t.amount ELSE 0 END) as total_debits
      FROM transactions t
      WHERE t.user_id = ? AND DATE(t.created_at) BETWEEN ? AND ?
      GROUP BY DATE(t.created_at)
      ORDER BY date DESC
    `, [userId, startDate, endDate]);

    const [formSubmissions] = await db.query(`
      SELECT 
        DATE(a.submitted_at) as date,
        a.form_type,
        COUNT(*) as count,
        SUM(a.amount_charged) as total_amount
      FROM applications a
      WHERE a.user_id = ? AND DATE(a.submitted_at) BETWEEN ? AND ?
      GROUP BY DATE(a.submitted_at), a.form_type
      ORDER BY date DESC
    `, [userId, startDate, endDate]);

    const [invoices] = await db.query(`
      SELECT 
        invoice_id, invoice_number, invoice_date, total_amount, status
      FROM invoices
      WHERE user_id = ? AND invoice_date BETWEEN ? AND ?
      ORDER BY invoice_date DESC
    `, [userId, startDate, endDate]);

    return {
      period: { startDate, endDate },
      transactions,
      formSubmissions,
      invoices,
      summary: {
        totalCredits: transactions.reduce((sum, t) => sum + parseFloat(t.total_credits || 0), 0),
        totalDebits: transactions.reduce((sum, t) => sum + parseFloat(t.total_debits || 0), 0),
        totalForms: formSubmissions.reduce((sum, f) => sum + parseInt(f.count || 0), 0),
        totalInvoiced: invoices.reduce((sum, i) => sum + parseFloat(i.total_amount || 0), 0)
      }
    };
  }

  // Calculate GST breakdown
  calculateGST(amount, gstRate = 18.00, isInterState = false) {
    const gstAmount = (amount * gstRate) / 100;
    
    if (isInterState) {
      return {
        igst: gstAmount,
        cgst: 0,
        sgst: 0,
        total_gst: gstAmount
      };
    } else {
      const cgst = gstAmount / 2;
      const sgst = gstAmount / 2;
      return {
        igst: 0,
        cgst,
        sgst,
        total_gst: gstAmount
      };
    }
  }

  // Mark invoice as paid
  async markInvoicePaid(invoiceId, paymentReference = null) {
    await db.query(
      'UPDATE invoices SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE invoice_id = ?',
      ['paid', invoiceId]
    );

    if (paymentReference) {
      await db.query(
        'UPDATE invoices SET notes = CONCAT(COALESCE(notes, ""), "\nPayment Ref: ", ?) WHERE invoice_id = ?',
        [paymentReference, invoiceId]
      );
    }

    return true;
  }

  // Get user billing summary
  async getUserBillingSummary(userId) {
    const [summary] = await db.query(`
      SELECT 
        COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_invoices,
        COUNT(CASE WHEN status = 'overdue' THEN 1 END) as overdue_invoices,
        COUNT(CASE WHEN status = 'sent' THEN 1 END) as pending_invoices,
        SUM(CASE WHEN status = 'paid' THEN total_amount ELSE 0 END) as total_paid,
        SUM(CASE WHEN status IN ('sent', 'overdue') THEN total_amount ELSE 0 END) as total_outstanding
      FROM invoices
      WHERE user_id = ?
    `, [userId]);

    return summary[0] || {
      paid_invoices: 0,
      overdue_invoices: 0,
      pending_invoices: 0,
      total_paid: 0,
      total_outstanding: 0
    };
  }

  // Get monthly billing statement
  async getMonthlyStatement(userId, year, month) {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];

    const [invoices] = await db.query(`
      SELECT invoice_id, invoice_number, invoice_date, total_amount, status,
             subtotal, gst_amount, gst_rate
      FROM invoices
      WHERE user_id = ? AND YEAR(invoice_date) = ? AND MONTH(invoice_date) = ?
      ORDER BY invoice_date DESC
    `, [userId, year, month]);

    const [transactions] = await db.query(`
      SELECT transaction_id, type, amount, description, created_at, status
      FROM transactions
      WHERE user_id = ? AND YEAR(created_at) = ? AND MONTH(created_at) = ?
      ORDER BY created_at DESC
    `, [userId, year, month]);

    const totalInvoiced = invoices.reduce((sum, inv) => sum + parseFloat(inv.total_amount || 0), 0);
    const totalGST = invoices.reduce((sum, inv) => sum + parseFloat(inv.gst_amount || 0), 0);

    return {
      period: { year: parseInt(year), month: parseInt(month), startDate, endDate },
      invoices,
      transactions,
      summary: { totalInvoiced, totalGST }
    };
  }

  // Generate tax report
  async generateTaxReport(userId, startDate, endDate) {
    const [taxData] = await db.query(`
      SELECT 
        MONTH(invoice_date) as month,
        YEAR(invoice_date) as year,
        SUM(subtotal) as total_taxable_amount,
        SUM(gst_amount) as total_gst,
        COUNT(*) as invoice_count
      FROM invoices
      WHERE user_id = ? AND invoice_date BETWEEN ? AND ? AND status = 'paid'
      GROUP BY YEAR(invoice_date), MONTH(invoice_date)
      ORDER BY year DESC, month DESC
    `, [userId, startDate, endDate]);

    return {
      period: { startDate, endDate },
      monthlyBreakdown: taxData,
      summary: {
        totalTaxableAmount: taxData.reduce((sum, row) => sum + parseFloat(row.total_taxable_amount || 0), 0),
        totalGST: taxData.reduce((sum, row) => sum + parseFloat(row.total_gst || 0), 0)
      }
    };
  }
}

export default new BillingService();