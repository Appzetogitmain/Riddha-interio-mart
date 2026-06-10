const rateLimit = require('express-rate-limit');

const isProd = process.env.NODE_ENV === 'production';

// General rate limiter for all API requests
exports.limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isProd ? 100 : 10000, // Limit each IP to 100 requests in production, 10000 in development
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again after 15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limiter for authentication routes
exports.authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isProd ? 10 : 1000, // Limit each IP to 10 auth requests in production, 1000 in development
  message: {
    success: false,
    error: 'Too many login or verification attempts from this IP, please try again after 15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

