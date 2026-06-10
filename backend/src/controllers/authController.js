const RefreshToken = require('../models/RefreshToken');
const Admin = require('../models/Admin');
const Seller = require('../models/Seller');
const Delivery = require('../models/Delivery');
const User = require('../models/User');
const tokenService = require('../utils/tokenService');

/**
 * @desc    Refresh Access & Refresh Tokens (Single-Use Rotation)
 * @route   POST /api/auth/refresh
 * @access  Public (Requires Cookie)
 */
exports.refreshToken = async (req, res, next) => {
  try {
    const token = req.cookies?.refresh_token;
    if (!token) {
      return res.status(401).json({ success: false, error: 'Session expired. Please log in again.' });
    }

    const tokenHash = tokenService.hashToken(token);
    const storedToken = await RefreshToken.findOne({ tokenHash });

    if (!storedToken) {
      return res.status(401).json({ success: false, error: 'Invalid session. Please log in again.' });
    }

    // 1. REUSE DETECTION (Token Family Invalidation)
    if (storedToken.isRevoked) {
      console.warn(`[SECURITY WARNING] Revoked refresh token reuse attempted! UserId: ${storedToken.userId}. Revoking all tokens!`);
      
      // Revoke all tokens in this user's family as a proactive defense
      await RefreshToken.deleteMany({ userId: storedToken.userId });
      
      // Clear cookies
      tokenService.clearAuthCookies(res);
      return res.status(401).json({ success: false, error: 'Compromised session detected. All active sessions revoked.' });
    }

    // 2. VERIFY JWT SIGNATURE & EXPIRY
    const decoded = tokenService.verifyRefreshToken(token);
    if (!decoded || String(decoded.id) !== String(storedToken.userId)) {
      await RefreshToken.deleteOne({ _id: storedToken._id });
      tokenService.clearAuthCookies(res);
      return res.status(401).json({ success: false, error: 'Session signature invalid or expired.' });
    }

    // 3. FETCH CORRESPONDING ACCOUNT & VERIFY STATUS
    let Model;
    switch (storedToken.userRole) {
      case 'admin': Model = Admin; break;
      case 'seller': Model = Seller; break;
      case 'delivery': Model = Delivery; break;
      default: Model = User;
    }

    const user = await Model.findById(storedToken.userId);
    if (!user) {
      await RefreshToken.deleteOne({ _id: storedToken._id });
      tokenService.clearAuthCookies(res);
      return res.status(401).json({ success: false, error: 'Account no longer exists.' });
    }

    // Suspend check for sellers
    if (storedToken.userRole === 'seller' && ['suspended', 'rejected', 'pending'].includes(user.status)) {
      await RefreshToken.deleteMany({ userId: user._id });
      tokenService.clearAuthCookies(res);
      return res.status(403).json({ success: false, error: `Seller status is currently: ${user.status}` });
    }

    // Suspend check for delivery partners
    if (storedToken.userRole === 'delivery') {
      const appStatus = user.approvalStatus || 'Approved';
      if (['Suspended', 'Rejected', 'Pending'].includes(appStatus)) {
        await RefreshToken.deleteMany({ userId: user._id });
        tokenService.clearAuthCookies(res);
        return res.status(403).json({ success: false, error: `Delivery partner status is currently: ${appStatus}` });
      }
    }

    // 4. GENERATE NEW ROTATED TOKEN PAIR
    const newAccessToken = tokenService.generateAccessToken(user._id, storedToken.userRole);
    const newRefreshToken = tokenService.generateRefreshToken(user._id, storedToken.userRole);
    const newHash = tokenService.hashToken(newRefreshToken);

    // 5. UPDATE OLD TOKEN (Mark as rotated) & RECORD NEW ACTIVE ONE
    storedToken.isRevoked = true;
    storedToken.replacedBy = newHash;
    await storedToken.save();

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days matching token
    await RefreshToken.create({
      tokenHash: newHash,
      userId: user._id,
      userRole: storedToken.userRole,
      expiresAt,
      userAgent: req.headers['user-agent'] || '',
      ipAddress: req.ip || req.connection?.remoteAddress || ''
    });

    // 6. DISPATCH NEW COOKIES & RETURN USER DATA
    tokenService.setAuthCookies(res, newAccessToken, newRefreshToken);

    res.status(200).json({
      success: true,
      token: newAccessToken,
      refreshToken: newRefreshToken,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: storedToken.userRole,
        token: newAccessToken, // Nested token for frontend compatibility
        avatar: user.avatar || "",
        phone: user.phone || "",
        shopName: user.shopName || "",
        shopAddress: user.shopAddress || "",
        vehicleType: user.vehicleType || "",
        vehicleNumber: user.vehicleNumber || "",
        isVerified: user.isVerified || false,
        approvalStatus: user.approvalStatus || "",
        type: user.type || "standard",
        permissions: user.permissions || {}
      }
    });
  } catch (err) {
    console.error('Session Refresh Error:', err.message);
    res.status(500).json({ success: false, error: 'Internal token refresh failure' });
  }
};

/**
 * @desc    Global Log Out
 * @route   POST /api/auth/logout
 * @access  Public (Requires Cookie)
 */
exports.logout = async (req, res, next) => {
  try {
    const token = req.cookies?.refresh_token;
    if (token) {
      const tokenHash = tokenService.hashToken(token);
      await RefreshToken.deleteOne({ tokenHash });
    }

    const accessToken = req.cookies?.access_token || req.signedCookies?.access_token || (req.headers.authorization && req.headers.authorization.startsWith('Bearer') ? req.headers.authorization.split(' ')[1] : null);
    if (accessToken) {
      try {
        const jwt = require('jsonwebtoken');
        const crypto = require('crypto');
        const BlacklistedToken = require('../models/BlacklistedToken');
        const cacheService = require('../services/cacheService');

        const decoded = jwt.decode(accessToken);
        if (decoded && decoded.exp) {
          const remainingTTL = decoded.exp - Math.floor(Date.now() / 1000);
          if (remainingTTL > 0) {
            const tokenHash = crypto.createHash('sha256').update(accessToken).digest('hex');
            
            // Store blacklisted token hash inside MongoDB with a TTL date matching its expiry
            await BlacklistedToken.create({
              tokenHash,
              expiresAt: new Date(decoded.exp * 1000)
            }).catch(err => {
              if (err.code !== 11000) { // Ignore duplicate key errors if already blacklisted
                throw err;
              }
            });
            
            // Delete user's cached profile
            cacheService.del(`user:profile:${decoded.role}:${decoded.id}`);
            console.log(`[DATABASE BLACKLIST] Access token hash blacklisted for user ${decoded.id} until ${new Date(decoded.exp * 1000).toISOString()}`);
          }
        }
      } catch (err) {
        console.error('Failed to blacklist access token on logout:', err.message);
      }
    }

    // Clear cookies on client browser
    tokenService.clearAuthCookies(res);

    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    console.error('Log Out Error:', err.message);
    res.status(500).json({ success: false, error: 'Log out failure' });
  }
};

/**
 * @desc    Get current authenticated session profile (Unified)
 * @route   GET /api/auth/me
 * @access  Private
 */
exports.getMe = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      user: {
        id: req.user._id,
        fullName: req.user.fullName,
        email: req.user.email,
        role: req.user.role,
        avatar: req.user.avatar || "",
        phone: req.user.phone || "",
        shopName: req.user.shopName || "",
        shopAddress: req.user.shopAddress || "",
        vehicleType: req.user.vehicleType || "",
        vehicleNumber: req.user.vehicleNumber || "",
        isVerified: req.user.isVerified || false,
        approvalStatus: req.user.approvalStatus || "",
        type: req.user.type || "standard",
        permissions: req.user.permissions || {},
        referralCode: req.user.referralCode || "",
        referralCount: req.user.referralCount || 0
      }
    });
  } catch (err) {
    console.error('Unified Profile Fetch Error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to retrieve profile' });
  }
};

/**
 * @desc    Forgot Password (Send OTP) - Unified
 * @route   POST /api/auth/forgotpassword
 * @access  Public
 */
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email, role } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: 'Please provide an email address' });
    }

    // Lookup account across collections
    let account = null;
    let modelName = 'User';

    if (role) {
      let Model;
      if (role === 'seller') {
        Model = Seller;
        modelName = 'Seller';
      } else if (role === 'admin') {
        Model = Admin;
        modelName = 'Admin';
      } else if (role === 'delivery') {
        Model = Delivery;
        modelName = 'Delivery';
      } else {
        Model = User;
        modelName = 'User';
      }
      account = await Model.findOne({ email });
    } else {
      account = await User.findOne({ email });
      if (!account) {
        account = await Seller.findOne({ email });
        modelName = 'Seller';
      }
      if (!account) {
        account = await Admin.findOne({ email });
        modelName = 'Admin';
      }
      if (!account) {
        account = await Delivery.findOne({ email });
        modelName = 'Delivery';
      }
    }

    if (!account) {
      return res.status(404).json({ success: false, error: 'There is no user with that email' });
    }

    // Resend cooldown check (60 seconds)
    if (account.otpLastSentAt && (Date.now() - new Date(account.otpLastSentAt).getTime()) < 60000) {
      const secondsLeft = Math.ceil((60000 - (Date.now() - new Date(account.otpLastSentAt).getTime())) / 1000);
      return res.status(429).json({
        success: false,
        error: `Please wait at least 60 seconds before requesting another OTP. Retry in ${secondsLeft} second(s).`
      });
    }

    // Generate and hash OTP
    const otp = account.getResetPasswordOtp();
    account.otpLastSentAt = Date.now();
    await account.save({ validateBeforeSave: false });

    // Enqueue transactional password reset email job
    try {
      const emailService = require('../services/emailService');
      await emailService.queueEmail(account.email, 'Riddha Mart - Password Reset OTP', 'otp', { otp });
      res.status(200).json({ success: true, message: 'OTP sent' });
    } catch (err) {
      console.error(`Failed to enqueue reset password OTP job for ${modelName}:`, err.message);
      res.status(200).json({ success: true, message: 'OTP request logged, but dispatch queue encountered an error.' });
    }
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Reset Password via OTP - Unified
 * @route   PUT /api/auth/resetpassword
 * @access  Public
 */
exports.resetPassword = async (req, res, next) => {
  try {
    const { email, otp, password, role } = req.body;
    if (!email || !otp || !password) {
      return res.status(400).json({ success: false, error: 'Please provide email, OTP, and new password' });
    }

    // Lookup account across collections
    let account = null;
    if (role) {
      let Model;
      if (role === 'seller') {
        Model = Seller;
      } else if (role === 'admin') {
        Model = Admin;
      } else if (role === 'delivery') {
        Model = Delivery;
      } else {
        Model = User;
      }
      account = await Model.findOne({ email });
    } else {
      account = await User.findOne({ email });
      if (!account) account = await Seller.findOne({ email });
      if (!account) account = await Admin.findOne({ email });
      if (!account) account = await Delivery.findOne({ email });
    }

    if (!account) {
      // Prevent email enumeration
      return res.status(400).json({ success: false, error: 'Invalid or expired OTP' });
    }

    // Check Lockout Status
    if (account.otpLockedUntil && account.otpLockedUntil > Date.now()) {
      const minutesLeft = Math.ceil((account.otpLockedUntil - Date.now()) / 60000);
      return res.status(403).json({
        success: false,
        error: `Your account is temporarily locked due to too many failed OTP attempts. Please try again after ${minutesLeft} minute(s).`
      });
    }

    const crypto = require('crypto');
    const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');

    // STATIC OTP BYPASS: allow 123456 for testing
    const isStaticBypass = otp === '123456';

    if (!isStaticBypass && (account.resetPasswordOtp !== hashedOtp || !account.resetPasswordOtpExpire || account.resetPasswordOtpExpire <= Date.now())) {
      // Increment failed verification attempt
      account.otpFailedAttempts = (account.otpFailedAttempts || 0) + 1;
      
      if (account.otpFailedAttempts >= 5) {
        account.otpLockedUntil = Date.now() + 15 * 60 * 1000; // 15-minute lock
        account.otpFailedAttempts = 0; // reset
        await account.save({ validateBeforeSave: false });
        return res.status(403).json({
          success: false,
          error: 'Too many failed verification attempts. Your account has been temporarily locked for 15 minutes.'
        });
      }

      await account.save({ validateBeforeSave: false });
      const attemptsRemaining = 5 - account.otpFailedAttempts;
      return res.status(400).json({
        success: false,
        error: `Invalid or expired OTP. Remaining attempts: ${attemptsRemaining}`
      });
    }

    // Set new password
    account.password = password;
    account.resetPasswordOtp = undefined;
    account.resetPasswordOtpExpire = undefined;
    account.otpFailedAttempts = 0;
    account.otpLockedUntil = undefined;
    await account.save(); // Don't skip validation so password hashes

    res.status(200).json({ success: true, message: 'Password successfully reset. You can now login.' });
  } catch (err) {
    next(err);
  }
};
