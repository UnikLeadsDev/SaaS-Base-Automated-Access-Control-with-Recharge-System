import PDFDocument from 'pdfkit';
import fs from 'fs';

class PDFGenerator {
generateInvoicePDF(invoice, outputPath, stampPath) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const stream = fs.createWriteStream(outputPath);
      doc.pipe(stream);

      // ----- Header -----
      doc.fontSize(24).font('Helvetica-Bold').text('TAX INVOICE', 50, 50);

      // Company Info (Left side)
      doc.fontSize(11).font('Helvetica')
        .text(invoice.company_name, 50, 100)
        .text(invoice.address, 50, 115, { width: 250 })
        .text(`${invoice.city}, ${invoice.state} - ${invoice.pincode}`, 50, 145);

      // Invoice Info (Right side)
      const rightX = 400;
      const invoiceDate = new Date(invoice.invoice_date);
      const createdAt = new Date(invoice.created_at);

      doc.fontSize(11)
        .text(`Invoice No.: ${invoice.invoice_number}`, rightX, 100)
        .text(`Date: ${invoiceDate.toLocaleDateString('en-GB')}`, rightX, 115)
        .text(`Time: ${createdAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}`, rightX, 130);
      
      doc.fontSize(11).font('Helvetica-Bold')
        .text('Bill To:', 50, 205);

      doc.font('Helvetica')
        .text(invoice.user_name, 50, 220)
        .text(invoice.email, 50, 235)
        .text(invoice.mobile, 50, 250);

      const tableTop = 290;
      const colX = {
        srNo: 50,
        srNoWidth: 40,
        description: 100,
        descWidth: 220,
        qty: 330,
        qtyWidth: 30,
        amount: 365,
        amountWidth: 70,
        gst: 440,
        gstWidth: 45,
        total: 490,
        totalWidth: 60
      };

      // Table headers - centered
      doc.fontSize(12).font('Helvetica-Bold')
        .text('Sr. No.', colX.srNo, tableTop, { width: colX.srNoWidth, align: 'center' })
        .text('Description', colX.description, tableTop, { width: colX.descWidth, align: 'center' })
        .text('Qty', colX.qty, tableTop, { width: colX.qtyWidth, align: 'center' })
        .text('Amount', colX.amount, tableTop, { width: colX.amountWidth, align: 'center' })
        .text('GST', colX.gst, tableTop, { width: colX.gstWidth, align: 'center' })
        .text('Total', colX.total, tableTop, { width: colX.totalWidth, align: 'center' });

      // Horizontal line under headers
      doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

      let y = tableTop + 25;

      // Hardcoded item values
      const subtotal = Number(invoice.subtotal) || 0;
      const gstAmount = Number(invoice.gst_amount) || 0;
      const total = Number(invoice.total_amount) || 0;

      // Single hardcoded item - centered
      doc.font('Helvetica').fontSize(10)
        .text('1', colX.srNo, y, { width: colX.srNoWidth, align: 'center' })
        .text('Wallet Recharge Payment for SAAS Services', colX.description, y, { width: colX.descWidth, align: 'center' })
        .text('1', colX.qty, y, { width: colX.qtyWidth, align: 'center' })
        .text(`Rs. ${subtotal.toFixed(2)}`, colX.amount, y, { width: colX.amountWidth, align: 'center' })
        .text('18%', colX.gst, y, { width: colX.gstWidth, align: 'center' })
        .text(`Rs. ${total.toFixed(2)}`, colX.total, y, { width: colX.totalWidth, align: 'center' });

      y += 40;

      // ----- Totals Section -----
      y += 20;

      // Horizontal line above totals
      doc.moveTo(340, y).lineTo(550, y).stroke();
      y += 10;

      const gstRate = Number(invoice.gst_rate) || 0;

      // Subtotal
      doc.fontSize(11).font('Helvetica')
        .text('Subtotal:', 340, y)
        .text(`Rs. ${subtotal.toFixed(2)}`, 480, y, { align: 'right' });

      // GST
      y += 20;
      doc.text(`GST (${gstRate.toFixed(2)}%):`, 340, y)
        .text(`Rs. ${gstAmount.toFixed(2)}`, 480, y, { align: 'right' });

      // Total
      y += 25;
      doc.fontSize(12).font('Helvetica-Bold')
        .text('Total:', 340, y)
        .text(`Rs. ${total.toFixed(2)}`, 480, y, { align: 'right' });

      // ✅ Add Stamp (bottom left, below totals)
      if (stampPath && fs.existsSync(stampPath)) {
        doc.image(stampPath, 160, y - 60, { width: 100, height: 100 });
      }

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