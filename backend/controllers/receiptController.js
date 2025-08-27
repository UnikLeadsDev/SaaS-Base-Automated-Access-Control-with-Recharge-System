import nodemailer from "nodemailer";

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
