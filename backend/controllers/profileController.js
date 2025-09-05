import db from "../config/db.js"; // your MySQL connection

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

