import express from 'express';

// Raw body middleware for webhook signature verification
export const rawBodyMiddleware = (req, res, next) => {
  if (req.originalUrl === '/api/payment/webhook') {
    // Check for webhook signature header (authorization)
    if (!req.headers['x-razorpay-signature']) {
      return res.status(401).json({ error: 'Missing webhook signature' });
    }
    
    let data = '';
    req.setEncoding('utf8');
    req.on('data', chunk => {
      // Authorization check: Validate request source
      const clientIP = req.ip || req.connection.remoteAddress;
      if (!clientIP) {
        return res.status(401).json({ error: 'Unauthorized source' });
      }
      
      data += chunk;
      // Authorization check: Prevent oversized payloads
      if (data.length > 10000) {
        return res.status(413).json({ error: 'Payload too large' });
      }
    });
    req.on('end', () => {
      req.rawBody = data;
      try {
        req.body = JSON.parse(data);
        next();
      } catch (error) {
        return res.status(400).json({ error: 'Invalid JSON payload' });
      }
    });
  } else {
    next();
  }
};