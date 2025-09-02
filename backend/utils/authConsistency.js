// Authentication field consistency checker
export const validateAuthFields = (req, res, next) => {
  if (req.user) {
    // Ensure both user_id and id are available for backward compatibility
    if (req.user.user_id && !req.user.id) {
      req.user.id = req.user.user_id;
    } else if (req.user.id && !req.user.user_id) {
      req.user.user_id = req.user.id;
    }
    
    // Validate that user_id is a valid number
    if (!req.user.user_id || isNaN(parseInt(req.user.user_id))) {
      return res.status(401).json({ message: 'Invalid user authentication data' });
    }
  }
  
  next();
};

// Helper function to get user ID consistently
export const getUserId = (req) => {
  return req.user?.user_id || req.user?.id;
};