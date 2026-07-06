const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Admin = require('../models/Admin');
const Seller = require('../models/Seller');
const Delivery = require('../models/Delivery');

// Protect routes
exports.protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.access_token) {
    token = req.cookies.access_token;
  } else if (req.signedCookies?.access_token) {
    token = req.signedCookies.access_token;
  }

  // Make sure token exists
  if (!token) {
    return res.status(401).json({ success: false, error: 'No token provided. Access denied.' });
  }

  const secret = process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET;
  if (!secret) {
    console.error('[SECURITY CRITICAL] JWT secret is not configured in the environment variables!');
    return res.status(500).json({ success: false, error: 'Server authentication configuration error.' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, secret);

    // 1. Blacklist check using MongoDB TTL collection
    const crypto = require('crypto');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const BlacklistedToken = require('../models/BlacklistedToken');
    const isBlacklisted = await BlacklistedToken.findOne({ tokenHash });
    if (isBlacklisted) {
      return res.status(401).json({ success: false, error: 'Session has been invalidated. Please log in again.' });
    }

    const cacheService = require('../services/cacheService');
    // Find user in the correct collection based on role in token
    let Model;
    switch (decoded.role) {
      case 'admin': Model = Admin; break;
      case 'seller': Model = Seller; break;
      case 'delivery': Model = Delivery; break;
      default: Model = User;
    }

    // 2. Profile Cache Check with Hydration
    const cacheKey = `user:profile:${decoded.role}:${decoded.id}`;
    let cachedUser = cacheService.get(cacheKey);
    if (cachedUser) {
      req.user = Model.hydrate(cachedUser);
    } else {
      req.user = await Model.findById(decoded.id);
      if (req.user) {
        cacheService.set(cacheKey, req.user.toObject(), 120); // 2 minutes profile cache
      }
    }
    
    if (!req.user) {
      return res.status(401).json({ success: false, error: `Account with role ${decoded.role} not found.` });
    }

    // Secure Middleware Check: prevent suspended/rejected/pending sellers from making requests
    if (decoded.role === 'seller') {
      if (req.user.status === 'suspended') {
        return res.status(403).json({ success: false, error: 'Your seller account has been suspended.' });
      }
      if (req.user.status === 'rejected') {
        return res.status(403).json({ success: false, error: 'Your seller registration was rejected.' });
      }
      if (req.user.status === 'pending') {
        return res.status(403).json({ success: false, error: 'Your seller registration is pending approval.' });
      }
    }

    // Secure Middleware Check: prevent suspended/rejected/pending delivery partners from making requests
    if (decoded.role === 'delivery') {
      const appStatus = req.user.approvalStatus || 'Approved';
      if (appStatus === 'Suspended') {
        return res.status(403).json({ success: false, error: 'Your delivery partner account has been suspended.' });
      }
      if (appStatus === 'Rejected') {
        return res.status(403).json({ success: false, error: 'Your delivery partner registration was rejected.' });
      }
      if (appStatus === 'Pending') {
        return res.status(403).json({ success: false, error: 'Your delivery partner registration is pending approval.' });
      }
    }

    // Safety: ensure role is available for authorize middleware
    if (!req.user.role) {
      req.user.role = decoded.role;
    }

    next();
  } catch (err) {
    console.error('Auth Error:', err.message);
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, error: 'Token expired. Please log in again.' });
    }
    return res.status(401).json({ success: false, error: 'Invalid token. Authorization failed.' });
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    const userRole = req.user.role ? req.user.role.toLowerCase() : '';
    const normalizedRoles = roles.map(r => r.toLowerCase());

    if (!normalizedRoles.includes(userRole)) {
      console.log(`[AUTH DEBUG] 403 Forbidden: User Role "${userRole}" not in Allowed Roles [${normalizedRoles.join(', ')}]`);
      return res.status(403).json({
        success: false,
        error: `User role ${userRole} is not authorized to access this route`
      });
    }
    next();
  };
};
// Optional protect: tries to find user but proceeds if not found
exports.tryProtect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.access_token) {
    token = req.cookies.access_token;
  } else if (req.signedCookies?.access_token) {
    token = req.signedCookies.access_token;
  }

  if (!token) {
    return next();
  }

  const secret = process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET;
  if (!secret) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, secret);
    
    // 1. Blacklist check
    const crypto = require('crypto');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const BlacklistedToken = require('../models/BlacklistedToken');
    const isBlacklisted = await BlacklistedToken.findOne({ tokenHash });
    if (isBlacklisted) {
      return next();
    }

    const cacheService = require('../services/cacheService');

    let Model;
    switch (decoded.role) {
      case 'admin': Model = Admin; break;
      case 'seller': Model = Seller; break;
      case 'delivery': Model = Delivery; break;
      default: Model = User;
    }

    // 2. Profile Cache Check with Hydration
    const cacheKey = `user:profile:${decoded.role}:${decoded.id}`;
    let cachedUser = cacheService.get(cacheKey);
    if (cachedUser) {
      req.user = Model.hydrate(cachedUser);
    } else {
      req.user = await Model.findById(decoded.id);
      if (req.user) {
        cacheService.set(cacheKey, req.user.toObject(), 120); // 2 minutes profile cache
      }
    }
    
    // Safety: ensure role is available
    if (req.user && !req.user.role) {
      req.user.role = decoded.role;
    }
    
    next();
  } catch (err) {
    next(); // Just proceed without user
  }
};

// Enforce granular RBAC permission validations for assistants
exports.checkPermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required for this operation.' });
    }

    // superadmin has full access
    if (req.user.type === 'superadmin') {
      return next();
    }

    // assistant check
    if (req.user.type === 'assistant') {
      const hasAccess = req.user.permissions && req.user.permissions.get(permission) === true;
      if (hasAccess) {
        return next();
      }
    }

    // Log administrative unauthorized access attempt
    try {
      const { logSystemActivity } = require('../utils/activityLogger');
      logSystemActivity({
        action: 'Unauthorized Access Attempt',
        target: `Route: ${req.originalUrl || req.url} | Missing Permission: ${permission}`,
        user: req.user.fullName || req.user.email,
        role: req.user.type === 'superadmin' ? 'Super Admin' : 'Admin',
        ipAddress: req.ip
      });
    } catch (e) {
      console.error('Failed to log security warning:', e.message);
    }

    return res.status(403).json({
      success: false,
      error: `Staff account is not authorized to perform this operation (missing permission: ${permission})`
    });
  };
};
