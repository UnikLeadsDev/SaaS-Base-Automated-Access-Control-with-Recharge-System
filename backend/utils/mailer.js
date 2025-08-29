// utils/mailer.js
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "Gmail", // Or configure SMTP
  auth: {
    user: process.env.EMAIL_USER, // your email
    pass: process.env.EMAIL_PASS, // app password
  },
});

export const sendMail = async (to, subject, html) => {
  try {
    await transporter.sendMail({
      from: `"Support Center" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log("Mail sent to:", to);
  } catch (err) {
    console.error("Mail send error:", err);
  }
};
