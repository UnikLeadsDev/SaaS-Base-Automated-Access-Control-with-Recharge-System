import jwt from "jsonwebtoken";
import db from "../config/db.js";

// Verify JWT token
export const verifyToken = async (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ message: "Access denied. No token provided." });
  }

  try {
    // Handle mock tokens in development
    if (token.startsWith('mock_jwt_token_') && process.env.NODE_ENV !== 'production') {
      req.user = {
        id: 1,
        email: 'admin@demo.com',
        role: 'admin'
      };
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user still exists and is active
    const [user] = await db.query("SELECT * FROM users WHERE user_id = ? AND status = 'active'", [decoded.id]);
    
    if (user.length === 0) {
      return res.status(401).json({ message: "Invalid token or user inactive" });
    }

    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
};

// Role-based access control
export const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied for your role" });
    }
    next();
  };
};

export const checkAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};