import db from "../config/db.js";

// Create support ticket
export const createSupportTicket = async (req, res) => {
  const { category, subject, description } = req.body;

  if (!category || !subject || !description) {
    return res.status(400).json({ message: "Category, subject, and description are required" });
  }

  try {
    const [result] = await db.query(
      `INSERT INTO support_tickets (user_id, category, subject, description, priority, status) 
       VALUES (?, ?, ?, ?, 'medium', 'open')`, // priority default = 'medium'
      [req.user.id, category, subject, description]
    );

    res.json({
      message: "Support ticket created successfully",
      ticketId: result.insertId
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

  const validStatuses = ['open', 'in_progress', 'resolved', 'closed'];
  const validPriorities = ['low', 'medium', 'high', 'urgent'];

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

    await db.query(
      `UPDATE support_tickets SET ${fieldsToUpdate.join(", ")}, updated_at = NOW() WHERE ticket_id = ?`,
      values
    );

    res.json({ message: "Ticket updated successfully" });
  } catch (error) {
    console.error("Update Ticket Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
