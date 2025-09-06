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
    if (token.startsWith('mock_jwt_token_')) {
      // Extract user info from request headers or use default admin
      const userEmail = req.headers['x-user-email'] || req.headers['user-email'] || 'admin@demo.com';
      const isAdmin = userEmail.toLowerCase().includes('admin');
      
      req.user = {
        id: 1,
        email: userEmail,
        role: isAdmin ? 'admin' : 'DSA'
      };
      console.log('Mock token auth - User:', req.user);
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
    console.log('Checking role access - User role:', req.user.role, 'Allowed roles:', allowedRoles);
    if (!allowedRoles.includes(req.user.role)) {
      console.log('Access denied - role mismatch');
      return res.status(403).json({ message: "Access denied for your role" });
    }
    next();
  };
};

export const checkAdmin = (req, res, next) => {
  console.log('Checking admin access for user:', req.user);
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};