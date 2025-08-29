import db from "../config/db.js";

// Create support ticket
import { sendMail } from "../utils/mailer.js";

export const createSupportTicket = async (req, res) => {
  const { category, subject, description } = req.body;

  if (!category || !subject || !description) {
    return res.status(400).json({ message: "Category, subject, and description are required" });
  }

  try {
    const [result] = await db.query(
      `INSERT INTO support_tickets (user_id, category, subject, description, priority, status) 
       VALUES (?, ?, ?, ?, 'medium', 'open')`,
      [req.user.id, category, subject, description]
    );

    // ✅ fetch user email from DB
    const [user] = await db.query("SELECT email FROM users WHERE user_id = ?", [req.user.id]);

    // ✅ send confirmation email & we need to chnage the frontend url after hosting the frontend and backend
     await sendMail(
      user[0].email,
      "Support Ticket Created",
      `
        <h3>Your support ticket has been created successfully</h3>
        <p><b>Ticket ID:</b> #${result.insertId}</p>
        <p><b>Subject:</b> ${subject}</p>
        <p><b>Status:</b> Open</p>
        <p>You can track your ticket here: 
           <a href="https://yourfrontend.com/tickets/${result.insertId}">
             Track Ticket
           </a>
        </p>
        <p>We will get back to you soon.</p>
      `
    );

    res.json({
      message: "Support ticket created successfully",
      ticketId: result.insertId,
    });
  } catch (error) {
    console.error("Create Ticket Error:", error);
    res.status(500).json({ message: "Failed to create support ticket" });
  }
};


// Get user tickets
export const getUserTickets = async (req, res) => {
  try {
    const [tickets] = await db.query(
      `SELECT ticket_id, category, subject, description, status, priority, created_at 
       FROM support_tickets 
       WHERE user_id = ? 
       ORDER BY created_at DESC`,
      [req.user.id]
    );

    res.json(tickets);
  } catch (error) {
    console.error("Get Tickets Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update ticket status (admin only)
export const updateTicketStatus = async (req, res) => {
  const { ticketId } = req.params;
  const { status, priority } = req.body;

  const validStatuses = ["open", "in_progress", "resolved", "closed"];
  const validPriorities = ["low", "medium", "high", "urgent"];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  if (priority && !validPriorities.includes(priority)) {
    return res.status(400).json({ message: "Invalid priority" });
  }

  try {
    const fieldsToUpdate = [];
    const values = [];

    fieldsToUpdate.push("status = ?");
    values.push(status);

    if (priority) {
      fieldsToUpdate.push("priority = ?");
      values.push(priority);
    }

    values.push(ticketId);

    // ✅ Update ticket
    await db.query(
      `UPDATE support_tickets 
       SET ${fieldsToUpdate.join(", ")}, updated_at = NOW() 
       WHERE ticket_id = ?`,
      values
    );

    // ✅ Fetch user email who raised the ticket
    const [ticket] = await db.query(
      `SELECT u.email, u.firstname, t.subject 
       FROM support_tickets t
       JOIN users u ON t.user_id = u.user_id
       WHERE t.ticket_id = ?`,
      [ticketId]
    );

    if (ticket.length === 0) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    const { email, firstname, subject } = ticket[0];

    // ✅ Setup nodemailer
    const transporter = nodemailer.createTransport({
      service: "gmail", // or SMTP config
      auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS, 
      },
    });

    const mailOptions = {
      from: `"Support Team" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Ticket #${ticketId} Status Updated`,
      html: `
        <p>Hi ${firstname},</p>
        <p>The status of your ticket <b>${subject}</b> has been updated to <b>${status}</b>.</p>
        <p>Priority: ${priority || "unchanged"}</p>
        <p>Thank you,<br/>Support Team</p>
      `,
    };

    // ✅ Send email
    await transporter.sendMail(mailOptions);

    res.json({ message: "Ticket updated & email sent successfully" });
  } catch (error) {
    console.error("Update Ticket Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
