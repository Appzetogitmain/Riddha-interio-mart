const Seller = require('../models/Seller');
const sendTokenResponse = require('../utils/sendTokenResponse');
const checkEmailExists = require('../utils/checkEmailExists');
const { notifyAdminNewSeller } = require('../socket');

// @desc    Register Seller
// @route   POST /api/auth/seller/register
// @access  Public
exports.registerSeller = async (req, res, next) => {
  try {
    const { fullName, email, phone, shopName, shopAddress, password, gstNumber, panNumber, hsnNumber, termsSignature, termsVersion } = req.body;

    // Sent as a JSON string (multipart form fields are always strings) — array of Category ids.
    let sellingCategories = [];
    if (req.body.sellingCategories) {
      try {
        const parsed = JSON.parse(req.body.sellingCategories);
        if (Array.isArray(parsed)) sellingCategories = parsed;
      } catch (e) {
        console.error('Failed to parse sellingCategories on seller registration:', e.message);
      }
    }

    // Handle uploaded documents
    const gstDoc = req.files && req.files.gstDoc ? req.files.gstDoc[0].path : undefined;
    const panDoc = req.files && req.files.panDoc ? req.files.panDoc[0].path : undefined;
    const shopDoc = req.files && req.files.shopDoc ? req.files.shopDoc[0].path : undefined;

    const sellerExists = await Seller.findOne({ email });
    if (sellerExists) {
      return res.status(400).json({ success: false, error: 'Seller already exists' });
    }

    const seller = await Seller.create({
      fullName,
      email,
      phone,
      shopName,
      shopAddress,
      password,
      gstNumber,
      panNumber,
      hsnNumber,
      gstDoc,
      panDoc,
      shopDoc,
      sellingCategories,
      status: 'pending',
      termsSignature: termsSignature || '',
      termsAgreedAt: termsSignature ? new Date() : undefined,
      termsVersion: termsVersion || ''
    });

    const otp = seller.getVerificationOtp();
    await seller.save({ validateBeforeSave: false });

    // Notify Admin about new seller registration
    try {
      notifyAdminNewSeller({
        id: seller._id,
        fullName: seller.fullName,
        email: seller.email,
        phone: seller.phone,
        shopName: seller.shopName
      });
    } catch (e) {
      console.error('Failed to send admin notification for new seller registration:', e);
    }

    try {
      const emailService = require('../services/emailService');
      await emailService.queueEmail(seller.email, 'Riddha Mart - Verify Your Registration', 'otp', { otp });
      
      // Send Terms & Conditions & Privacy Policy PDF (with embedded signature)
      emailService.sendRegistrationDocuments(seller.email, seller.fullName, 'seller', termsSignature || '').catch(err => {
        console.error('Error sending registration documents to seller:', err);
      });
    } catch (e) {
      console.error('Failed to queue seller verification email:', e);
    }

    res.status(201).json({
      success: true,
      message: 'Registration successful! Please verify using the OTP sent to your email.'
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Verify Seller OTP
// @route   POST /api/auth/seller/verify-otp
// @access  Public
exports.verifySellerOtp = async (req, res, next) => {
  try {
    const { phone, otp } = req.body;
    
    if (!phone || !otp) {
      return res.status(400).json({ success: false, error: 'Please provide phone number and OTP' });
    }

    const seller = await Seller.findOne({ phone });
    if (!seller) {
      return res.status(404).json({ success: false, error: 'Seller account not found' });
    }

    const crypto = require('crypto');
    const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');

    // STATIC OTP BYPASS: allow 123456 for testing
    const isStaticBypass = otp === '123456';

    if (!isStaticBypass && (seller.phoneVerificationOtp !== hashedOtp || !seller.phoneVerificationOtpExpire || seller.phoneVerificationOtpExpire < Date.now())) {
      return res.status(400).json({ success: false, error: 'Invalid or expired OTP' });
    }

    seller.isVerified = true;
    seller.phoneVerificationOtp = undefined;
    seller.phoneVerificationOtpExpire = undefined;
    await seller.save();

    res.status(200).json({
      success: true,
      message: 'Phone number verified successfully! Your account is pending admin approval.'
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Login Seller
// @route   POST /api/auth/seller/login
// @access  Public
exports.loginSeller = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, error: 'Please provide email and password' });

    const seller = await Seller.findOne({ email }).select('+password');
    if (!seller || !(await seller.matchPassword(password))) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    // Check Seller Status
    if (seller.status === 'pending') {
      return res.status(403).json({ 
        success: false, 
        error: 'Your seller account is pending admin approval. Please check back later.' 
      });
    }
    if (seller.status === 'rejected') {
      return res.status(403).json({ 
        success: false, 
        error: 'Your seller registration was rejected. Please contact support if you believe this is an error.' 
      });
    }
    if (seller.status === 'suspended') {
      return res.status(403).json({ 
        success: false, 
        error: 'Your seller account has been suspended for policy violations. Access denied.' 
      });
    }

    sendTokenResponse(seller, 200, res);
  } catch (err) {
    next(err);
  }
};

// @desc    Get current logged in Seller
exports.getSellerMe = async (req, res, next) => {
  try {
    const seller = await Seller.findById(req.user.id);
    res.status(200).json({ success: true, data: seller });
  } catch (err) {
    next(err);
  }
};

// @desc    Update Seller Profile
exports.updateSellerProfile = async (req, res, next) => {
  try {
    const { fullName, email, phone, shopName, shopAddress, avatar, gstNumber, panNumber, hsnNumber, bankDetails, signatureImage, sellingCategories } = req.body;

    const seller = await Seller.findById(req.user.id);
    if (!seller) return res.status(404).json({ success: false, error: 'Seller not found' });

    // Check if email is being changed and if new email is already taken
    if (email && email !== seller.email) {
      const emailExists = await checkEmailExists(email);
      if (emailExists) {
        return res.status(400).json({ success: false, error: 'Email already in use by another account' });
      }
    }

    const fieldsToUpdate = {
      fullName: fullName || seller.fullName,
      email: email || seller.email,
      phone: phone || seller.phone,
      shopName: shopName || seller.shopName,
      shopAddress: shopAddress || seller.shopAddress,
      avatar: avatar || seller.avatar,
      gstNumber: gstNumber !== undefined ? gstNumber : seller.gstNumber,
      panNumber: panNumber !== undefined ? panNumber : seller.panNumber,
      hsnNumber: hsnNumber !== undefined ? hsnNumber : seller.hsnNumber,
      signatureImage: signatureImage !== undefined ? signatureImage : seller.signatureImage
    };

    if (Array.isArray(sellingCategories)) {
      fieldsToUpdate.sellingCategories = sellingCategories;
    }

    // Merge bankDetails fields individually to allow partial updates
    if (bankDetails) {
      fieldsToUpdate.bankDetails = {
        accountHolderName: bankDetails.accountHolderName !== undefined ? bankDetails.accountHolderName : (seller.bankDetails && seller.bankDetails.accountHolderName) || '',
        accountNumber: bankDetails.accountNumber !== undefined ? bankDetails.accountNumber : (seller.bankDetails && seller.bankDetails.accountNumber) || '',
        ifscCode: bankDetails.ifscCode !== undefined ? bankDetails.ifscCode : (seller.bankDetails && seller.bankDetails.ifscCode) || '',
        bankName: bankDetails.bankName !== undefined ? bankDetails.bankName : (seller.bankDetails && seller.bankDetails.bankName) || ''
      };
    }

    const updatedSeller = await Seller.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true
    });

    res.status(200).json({ success: true, data: updatedSeller });
  } catch (err) {
    next(err);
  }
};


// @desc    Get seller's stock management report
// @route   GET /api/auth/seller/stock-status
// @access  Private/Seller
exports.getSellerStockStatus = async (req, res, next) => {
  try {
    const Product = require('../models/Product');
    const products = await Product.find({ seller: req.user.id })
      .populate('brand', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (err) {
    next(err);
  }
};
// @desc    Get seller's customers (Unique users who placed orders)
// @route   GET /api/auth/seller/customers
// @access  Private/Seller
exports.getSellerCustomers = async (req, res, next) => {
  try {
    const mongoose = require('mongoose');
    const Order = require('../models/Order');

    const sellerId = new mongoose.Types.ObjectId(req.user.id);
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50; // Prevent memory overload with safe pagination limit
    const skip = (page - 1) * limit;

    const pipeline = [
      { $match: { seller: sellerId } },
      {
        $group: {
          _id: '$user',
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: '$totalPrice' },
          lastOrderDate: { $max: '$createdAt' }
        }
      },
      // Exclude null/undefined users (e.g. deleted accounts)
      { $match: { _id: { $ne: null } } },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userDetails'
        }
      },
      { $unwind: '$userDetails' },
      {
        $project: {
          _id: 1,
          totalOrders: 1,
          totalSpent: 1,
          lastOrderDate: 1,
          fullName: '$userDetails.fullName',
          email: '$userDetails.email',
          phone: '$userDetails.phone',
          avatar: '$userDetails.avatar',
          memberSince: '$userDetails.createdAt'
        }
      },
      { $sort: { totalOrders: -1 } },
      { $skip: skip },
      { $limit: limit }
    ];

    const customers = await Order.aggregate(pipeline);

    res.status(200).json({
      success: true,
      count: customers.length,
      data: customers
    });
  } catch (err) {
    next(err);
  }
};
