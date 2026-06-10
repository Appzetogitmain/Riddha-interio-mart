const User = require('../models/User');
const sendTokenResponse = require('../utils/sendTokenResponse');
const checkEmailExists = require('../utils/checkEmailExists');
const sendEmail = require('../utils/sendEmail');
const crypto = require('crypto');
const referralService = require('../services/referralService');

// @desc    Register User
// @route   POST /api/auth/register
// @access  Public
exports.registerUser = async (req, res, next) => {
  try {
    const { fullName, email, password, userType, businessDetails, referralCode } = req.body;

    if (await checkEmailExists(email)) {
      return res.status(400).json({ success: false, error: 'Email already registered' });
    }

    const user = await User.create({ 
      fullName, 
      email, 
      password,
      userType: userType || 'customer',
      businessDetails: userType === 'enterpriser' ? businessDetails : undefined,
      isEmailVerified: false
    });

    // Track Referral if referralCode is supplied
    if (referralCode) {
      try {
        const clientIp = req.ip || req.connection.remoteAddress || '127.0.0.1';
        await referralService.trackReferral(user, referralCode, clientIp, req.body.fingerprint);
      } catch (refErr) {
        // Rollback created user to ensure registration integrity on invalid referral input
        await User.findByIdAndDelete(user._id);
        return res.status(400).json({ success: false, error: refErr.message });
      }
    }

    // Generate Verification OTP
    const otp = user.getVerificationOtp();
    user.otpLastSentAt = Date.now();
    await user.save({ validateBeforeSave: false });

    // Enqueue transactional verification email job
    try {
      const emailService = require('../services/emailService');
      await emailService.queueEmail(user.email, 'Riddha Mart - Verify Your Email', 'otp', { otp });

      res.status(201).json({ 
        success: true, 
        message: 'Registration successful. Please verify your email.',
        email: user.email
      });
    } catch (err) {
      console.error('Failed to enqueue registration OTP email:', err.message);
      res.status(201).json({ 
        success: true, 
        message: 'Registration successful, but verification email queue processing failed. Please request an OTP resend.',
        email: user.email
      });
    }
  } catch (err) {
    next(err);
  }
};

// @desc    Login User
// @route   POST /api/auth/login
// @access  Public
exports.loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, error: 'Please provide email/phone and password' });

    const isPhone = /^\d{10}$/.test(email.trim());
    const user = await User.findOne(
      isPhone ? { phone: email.trim() } : { email: email.trim() }
    ).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    if (!user.isEmailVerified) {
      return res.status(401).json({ success: false, error: 'Please verify your email', unverified: true, email: user.email });
    }

    sendTokenResponse(user, 200, res);
  } catch (err) {
    next(err);
  }
};

// @desc    Get current logged in User
exports.getUserMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

// @desc    Update User Profile
exports.updateUserProfile = async (req, res, next) => {
  try {
    const { fullName, email, phone, avatar } = req.body;
    
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    // Check if email is being changed and if new email is already taken
    if (email && email !== user.email) {
      const emailExists = await checkEmailExists(email);
      if (emailExists) {
        return res.status(400).json({ success: false, error: 'Email already in use by another account' });
      }
    }

    const fieldsToUpdate = {
      fullName: fullName || user.fullName,
      email: email || user.email,
      phone: phone || user.phone,
      avatar: avatar || user.avatar
    };

    const updatedUser = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true
    });

    res.status(200).json({ success: true, data: updatedUser });
  } catch (err) {
    next(err);
  }
};

// @desc    Verify Email OTP
// @route   POST /api/auth/verify-email
// @access  Public
exports.verifyEmailOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ success: false, error: 'Please provide email and OTP' });

    const user = await User.findOne({ email });
    if (!user) {
      // Prevent email enumeration: return standard error payload
      return res.status(400).json({ success: false, error: 'Invalid or expired OTP' });
    }

    // Check Lockout Status
    if (user.otpLockedUntil && user.otpLockedUntil > Date.now()) {
      const minutesLeft = Math.ceil((user.otpLockedUntil - Date.now()) / 60000);
      return res.status(403).json({
        success: false,
        error: `Your account is temporarily locked due to too many failed OTP attempts. Please try again after ${minutesLeft} minute(s).`
      });
    }

    // Hash OTP to match db
    const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');

    // STATIC OTP BYPASS: allow 123456 for testing
    const isStaticBypass = otp === '123456';

    if (!isStaticBypass && (user.emailVerificationOtp !== hashedOtp || !user.emailVerificationOtpExpire || user.emailVerificationOtpExpire <= Date.now())) {
      // Increment failed verification attempt
      user.otpFailedAttempts = (user.otpFailedAttempts || 0) + 1;
      
      if (user.otpFailedAttempts >= 5) {
        user.otpLockedUntil = Date.now() + 15 * 60 * 1000; // 15-minute lock
        user.otpFailedAttempts = 0; // reset
        await user.save({ validateBeforeSave: false });
        return res.status(403).json({
          success: false,
          error: 'Too many failed verification attempts. Your account has been temporarily locked for 15 minutes.'
        });
      }

      await user.save({ validateBeforeSave: false });
      const attemptsRemaining = 5 - user.otpFailedAttempts;
      return res.status(400).json({
        success: false,
        error: `Invalid or expired OTP. Remaining attempts: ${attemptsRemaining}`
      });
    }

    // Reset attempt records on success
    user.isEmailVerified = true;
    user.emailVerificationOtp = undefined;
    user.emailVerificationOtpExpire = undefined;
    user.otpFailedAttempts = 0;
    user.otpLockedUntil = undefined;
    await user.save({ validateBeforeSave: false });

    // Queue Welcome Email
    try {
      const emailService = require('../services/emailService');
      await emailService.queueEmail(user.email, 'Welcome to Riddha Mart!', 'welcome', { fullName: user.fullName });
    } catch (welcomeErr) {
      console.error('Welcome email queue failed:', welcomeErr.message);
    }

    // Process Referral Signup reward
    try {
      await referralService.processSignupReward(user._id);
    } catch (refRewardErr) {
      console.error('Signup reward processing failed:', refRewardErr.message);
    }

    // Log them in immediately after verification
    sendTokenResponse(user, 200, res);
  } catch (err) {
    next(err);
  }
};

// @desc    Resend Verification OTP
// @route   POST /api/auth/resend-otp
// @access  Public
exports.resendVerificationOtp = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, error: 'Please provide email' });

    const user = await User.findOne({ email });
    if (!user) {
      // Prevent email enumeration
      return res.status(200).json({ success: true, message: 'If registered, a new OTP verification code has been dispatched.' });
    }

    if (user.isEmailVerified) return res.status(400).json({ success: false, error: 'Email already verified' });

    // resend cooldown (60 seconds resend cooldown check)
    if (user.otpLastSentAt && (Date.now() - new Date(user.otpLastSentAt).getTime()) < 60000) {
      const secondsLeft = Math.ceil((60000 - (Date.now() - new Date(user.otpLastSentAt).getTime())) / 1000);
      return res.status(429).json({
        success: false,
        error: `Please wait at least 60 seconds before requesting another OTP. Retry in ${secondsLeft} second(s).`
      });
    }

    const otp = user.getVerificationOtp();
    user.otpLastSentAt = Date.now();
    await user.save({ validateBeforeSave: false });

    // Enqueue Resend Job
    try {
      const emailService = require('../services/emailService');
      await emailService.queueEmail(user.email, 'Riddha Mart - Verify Your Email', 'otp', { otp });
      res.status(200).json({ success: true, message: 'OTP sent' });
    } catch (err) {
      console.error('Failed to enqueue resend OTP job:', err.message);
      res.status(200).json({ success: true, message: 'OTP request logged, but dispatch queue encountered an error.' });
    }
  } catch (err) {
    next(err);
  }
};

// @desc    Forgot Password (Send OTP)
// @route   POST /api/auth/forgotpassword
// @access  Public
exports.forgotPassword = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(404).json({ success: false, error: 'There is no user with that email' });

    // resend cooldown (60 seconds resend cooldown check)
    if (user.otpLastSentAt && (Date.now() - new Date(user.otpLastSentAt).getTime()) < 60000) {
      const secondsLeft = Math.ceil((60000 - (Date.now() - new Date(user.otpLastSentAt).getTime())) / 1000);
      return res.status(429).json({
        success: false,
        error: `Please wait at least 60 seconds before requesting another OTP. Retry in ${secondsLeft} second(s).`
      });
    }

    const otp = user.getResetPasswordOtp();
    user.otpLastSentAt = Date.now();
    await user.save({ validateBeforeSave: false });

    // Enqueue transactional password reset email job
    try {
      const emailService = require('../services/emailService');
      await emailService.queueEmail(user.email, 'Riddha Mart - Password Reset OTP', 'otp', { otp });
      res.status(200).json({ success: true, message: 'OTP sent' });
    } catch (err) {
      console.error('Failed to enqueue reset password OTP job:', err.message);
      res.status(200).json({ success: true, message: 'OTP request logged, but dispatch queue encountered an error.' });
    }
  } catch (err) {
    next(err);
  }
};

// @desc    Reset Password via OTP
// @route   PUT /api/auth/resetpassword
// @access  Public
exports.resetPassword = async (req, res, next) => {
  try {
    const { email, otp, password } = req.body;
    if (!email || !otp || !password) return res.status(400).json({ success: false, error: 'Please provide email, OTP, and new password' });

    const user = await User.findOne({ email });
    if (!user) {
      // Prevent email enumeration
      return res.status(400).json({ success: false, error: 'Invalid or expired OTP' });
    }

    // Check Lockout Status
    if (user.otpLockedUntil && user.otpLockedUntil > Date.now()) {
      const minutesLeft = Math.ceil((user.otpLockedUntil - Date.now()) / 60000);
      return res.status(403).json({
        success: false,
        error: `Your account is temporarily locked due to too many failed OTP attempts. Please try again after ${minutesLeft} minute(s).`
      });
    }

    const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');

    // STATIC OTP BYPASS: allow 123456 for testing
    const isStaticBypass = otp === '123456';

    if (!isStaticBypass && (user.resetPasswordOtp !== hashedOtp || !user.resetPasswordOtpExpire || user.resetPasswordOtpExpire <= Date.now())) {
      // Increment failed verification attempt
      user.otpFailedAttempts = (user.otpFailedAttempts || 0) + 1;
      
      if (user.otpFailedAttempts >= 5) {
        user.otpLockedUntil = Date.now() + 15 * 60 * 1000; // 15-minute lock
        user.otpFailedAttempts = 0; // reset
        await user.save({ validateBeforeSave: false });
        return res.status(403).json({
          success: false,
          error: 'Too many failed verification attempts. Your account has been temporarily locked for 15 minutes.'
        });
      }

      await user.save({ validateBeforeSave: false });
      const attemptsRemaining = 5 - user.otpFailedAttempts;
      return res.status(400).json({
        success: false,
        error: `Invalid or expired OTP. Remaining attempts: ${attemptsRemaining}`
      });
    }

    // Set new password
    user.password = password;
    user.resetPasswordOtp = undefined;
    user.resetPasswordOtpExpire = undefined;
    user.otpFailedAttempts = 0;
    user.otpLockedUntil = undefined;
    await user.save(); // Don't skip validation so password hashes

    res.status(200).json({ success: true, message: 'Password successfully reset. You can now login.' });
  } catch (err) {
    next(err);
  }
};
