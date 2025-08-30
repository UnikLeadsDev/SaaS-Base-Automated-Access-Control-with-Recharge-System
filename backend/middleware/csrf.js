import crypto from 'crypto';

// CSRF Protection Middleware
export const csrfProtection = (req, res, next) => {
  // Skip CSRF for GET, HEAD, OPTIONS requests and webhook endpoints
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method) || req.path.includes('/webhook')) {
    return next();
  }

  const token = req.headers['x-csrf-token'];
  const sessionToken = req.session?.csrfToken;

  if (!token || !sessionToken || !crypto.timingSafeEqual(
    Buffer.from(token, 'hex'), 
    Buffer.from(sessionToken, 'hex')
  )) {
    return res.status(403).json({ 
      message: 'Invalid CSRF token',
      code: 'CSRF_INVALID'
    });
  }

  next();
};

// Generate CSRF token endpoint
export const generateCSRFToken = (req, res) => {
  const token = crypto.randomBytes(32).toString('hex');
  
  if (req.session) {
    req.session.csrfToken = token;
  }
  
  res.json({ csrfToken: token });
};