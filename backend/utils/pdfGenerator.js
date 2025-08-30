import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

class PDFGenerator {
  generateInvoicePDF(invoice, outputPath) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const stream = fs.createWriteStream(outputPath);
        doc.pipe(stream);

        // Header
        doc.fontSize(20).text('INVOICE', 50, 50);
        doc.fontSize(12).text(invoice.company_name, 50, 80);
        doc.text(invoice.address, 50, 95);
        doc.text(`${invoice.city}, ${invoice.state} - ${invoice.pincode}`, 50, 110);
        doc.text(`GSTIN: ${invoice.gstin}`, 50, 125);

        // Invoice details
        doc.text(`Invoice #: ${invoice.invoice_number}`, 400, 80);
        doc.text(`Date: ${new Date(invoice.invoice_date).toLocaleDateString()}`, 400, 95);
        doc.text(`Due Date: ${new Date(invoice.due_date).toLocaleDateString()}`, 400, 110);

        // Bill to
        doc.text('Bill To:', 50, 160);
        doc.text(invoice.user_name, 50, 175);
        doc.text(invoice.email, 50, 190);
        doc.text(invoice.mobile, 50, 205);

        // Items table
        const tableTop = 250;
        doc.text('Description', 50, tableTop);
        doc.text('Qty', 300, tableTop);
        doc.text('Rate', 350, tableTop);
        doc.text('Amount', 450, tableTop);
        
        let y = tableTop + 20;
        invoice.items.forEach(item => {
          doc.text(item.description, 50, y);
          doc.text(item.quantity.toString(), 300, y);
          doc.text(`₹${item.unit_price}`, 350, y);
          doc.text(`₹${item.line_total}`, 450, y);
          y += 20;
        });

        // Totals
        y += 20;
        doc.text(`Subtotal: ₹${invoice.subtotal}`, 350, y);
        y += 15;
        doc.text(`GST (${invoice.gst_rate}%): ₹${invoice.gst_amount}`, 350, y);
        y += 15;
        doc.fontSize(14).text(`Total: ₹${invoice.total_amount}`, 350, y);

        doc.end();
        stream.on('finish', () => resolve(outputPath));
        stream.on('error', reject);
      } catch (error) {
        reject(error);
      }
    });
  }
}

export default new PDFGenerator();