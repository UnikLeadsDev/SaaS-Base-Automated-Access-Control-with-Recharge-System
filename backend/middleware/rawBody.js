import express from 'express';

// Raw body middleware for webhook signature verification
export const rawBodyMiddleware = (req, res, next) => {
  if (req.originalUrl === '/api/payment/webhook') {
    let data = '';
    req.setEncoding('utf8');
    req.on('data', chunk => {
      data += chunk;
    });
    req.on('end', () => {
      req.rawBody = data;
      req.body = JSON.parse(data);
      next();
    });
  } else {
    next();
  }
};