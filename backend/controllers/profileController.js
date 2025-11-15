import db from "../config/db.js"; // your MySQL connection
import bcrypt from "bcryptjs";

// Fetch user profile (basic info + company if exists)
export const getProfile = async (req, res) => {
  try {
    const userId = req.user.id; // assuming JWT middleware sets req.user

    // Get basic user details
    const [user] = await db.query(
      "SELECT name, email, mobile FROM users WHERE user_id = ?",
      [userId]
    );

    if (!user.length) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get company details linked to this user
    const [company] = await db.query(
      "SELECT * FROM company_details WHERE user_id = ?",
      [userId]
    );

    res.json({
      user: user[0],
      company: company.length ? company[0] : null,
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Create or Update company profile
export const saveCompanyProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      company_name,
      industry,
      address,
      city,
      state,
      pincode,
      gstin,
      pan,
      website,
      logo_url,
    } = req.body;

    // Check if company already exists for this user
    const [existing] = await db.query(
      "SELECT id FROM company_details WHERE user_id = ?",
      [userId]
    );

    if (existing.length) {
      // Update existing company
      await db.query(
        `UPDATE company_details 
         SET company_name=?, industry=?, address=?, city=?, state=?, pincode=?, gstin=?, pan=?, website=?, logo_url=? 
         WHERE user_id=?`,
        [
          company_name,
          industry,
          address,
          city,
          state,
          pincode,
          gstin,
          pan,
          website,
          logo_url,
          userId,
        ]
      );
      return res.json({ message: "Company profile updated successfully" });
    } else {
      // Insert new company (pull email + mobile from users table)
      const [[user]] = await db.query(
        "SELECT email, mobile FROM users WHERE user_id=?",
        [userId]
      );

      await db.query(
        `INSERT INTO company_details 
         (user_id, company_name, industry, address, city, state, pincode, gstin, pan, email, phone, website, logo_url, is_active) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [
          userId,
          company_name,
          industry,
          address,
          city,
          state,
          pincode,
          gstin,
          pan,
          user.email,
          user.mobile,
          website,
          logo_url,
        ]
      );
      return res.json({ message: "Company profile created successfully" });
    }
  } catch (error) {
    console.error("Error saving company profile:", error);
    res.status(500).json({ message: "Server error" });
  }
};



export const updatePassword = async (req, res) => {
  try {
    const userId = req.user.id; // coming from JWT middleware
    console.log("🔒 Updating password for user ID:", userId);
    const { oldPassword, newPassword, confirmPassword } = req.body;

    if (!oldPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    // Fetch user
    const [rows] = await db.query("SELECT password FROM users WHERE user_id = ?", [userId]);
    if (!rows.length) {
      return res.status(404).json({ message: "User not found" });
    }

    const hashedPassword = rows[0].password;

    // Compare old password
    const isMatch = await bcrypt.compare(oldPassword, hashedPassword);
    if (!isMatch) {
      return res.status(401).json({ message: "Old password is incorrect" });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const newHashedPassword = await bcrypt.hash(newPassword, salt);

    // Update in DB
    await db.query("UPDATE users SET password = ? WHERE user_id = ?", [newHashedPassword, userId]);
    console.log("✅ Password updated for user ID:", userId);

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("❌ Error updating password:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};



export const getCompanyProfile = async (req, res) => {
  const userId = req.user.id;

  try {
    const [rows] = await db.query(
      `SELECT 
         company_name, industry, address, city, state, pincode,
         gstin, pan, email, phone, website, logo_url, is_active
       FROM company_details
       WHERE user_id = ?`,
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Company details not found for this user.",
      });
    }

    return res.json({
      success: true,
      company: rows[0],
    });
  } catch (error) {
    console.error("❌ Error fetching company profile:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching company details.",
    });
  }
};


