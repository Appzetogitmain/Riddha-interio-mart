const RefreshToken = require('../models/RefreshToken');
const tokenService = require('./tokenService');

// Get token from model, create cookie and send response
const sendTokenResponse = async (user, statusCode, res) => {
  try {
    const role = user.role || 'user';
    const userId = user._id;

    // Generate access and refresh tokens
    const accessToken = tokenService.generateAccessToken(userId, role);
    const refreshToken = tokenService.generateRefreshToken(userId, role);
    const tokenHash = tokenService.hashToken(refreshToken);

    // Save refresh token to database
    const req = res.req;
    const userAgent = req ? (req.headers['user-agent'] || '') : '';
    const ipAddress = req ? (req.ip || req.connection?.remoteAddress || '') : '';
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await RefreshToken.create({
      tokenHash,
      userId,
      userRole: role,
      expiresAt,
      userAgent,
      ipAddress
    });

    // Set access_token and refresh_token in httpOnly cookies
    tokenService.setAuthCookies(res, accessToken, refreshToken);

    // Process FCM Token if provided in request body
    const { token: fcmToken, platform = 'web' } = req ? (req.body || {}) : {};
    if (fcmToken) {
      try {
        const FCMToken = require('../models/FCMToken');
        let userModel = 'User';
        if (role === 'admin') userModel = 'Admin';
        else if (role === 'seller') userModel = 'Seller';
        else if (role === 'delivery') userModel = 'Delivery';

        let tokenDoc = await FCMToken.findOne({ token: fcmToken });
        if (tokenDoc) {
          tokenDoc.user = userId;
          tokenDoc.userModel = userModel;
          tokenDoc.platform = platform;
          tokenDoc.lastUsedAt = Date.now();
          await tokenDoc.save();
        } else {
          await FCMToken.create({
            user: userId,
            userModel,
            token: fcmToken,
            platform,
            lastUsedAt: Date.now()
          });
        }
        
        const userTokensCount = await FCMToken.countDocuments({ user: userId, userModel });
        if (userTokensCount > 10) {
          const oldestTokens = await FCMToken.find({ user: userId, userModel })
            .sort({ lastUsedAt: 1 })
            .limit(userTokensCount - 10);
          const oldestIds = oldestTokens.map(doc => doc._id);
          await FCMToken.deleteMany({ _id: { $in: oldestIds } });
        }
      } catch (fcmErr) {
        console.error('FCM Token registration error during login:', fcmErr.message);
      }
    }

    // Fetch Wallet Balance based on role
    let walletAmount = 0;
    try {
      if (role === 'user') {
        const Wallet = require('../models/Wallet');
        const wallet = await Wallet.findOne({ user: userId });
        if (wallet) walletAmount = wallet.balance;
      } else if (role === 'seller') {
        const SellerWallet = require('../models/SellerWallet');
        const wallet = await SellerWallet.findOne({ seller: userId });
        if (wallet) walletAmount = wallet.balance;
      } else if (role === 'delivery') {
        const DeliveryWallet = require('../models/DeliveryWallet');
        const wallet = await DeliveryWallet.findOne({ deliveryPersonnel: userId });
        if (wallet) walletAmount = wallet.balance;
      }
    } catch (walletErr) {
      console.error('Wallet fetch error:', walletErr.message);
    }

    // Send response in the requested format
    res.status(statusCode).json({
      success: true,
      message: "Login successful",
      data: {
        token: accessToken,
        refreshToken: refreshToken, // keeping refresh token in data
        user: {
          id: user._id,
          name: user.fullName || user.name || "",
          phone: user.phone || "",
          email: user.email,
          walletAmount: walletAmount,
          refCode: user.referralCode || "",
          status: user.isBlocked ? "Blocked" : (user.status || "Active"),
          // Including other role-specific and common fields for compatibility
          role: role,
          avatar: user.avatar || "",
          shopName: user.shopName || "",
          shopAddress: user.shopAddress || "",
          vehicleType: user.vehicleType || "",
          vehicleNumber: user.vehicleNumber || "",
          isVerified: user.isVerified || false,
          approvalStatus: user.approvalStatus || "",
          type: user.type || "standard",
          permissions: user.permissions || {}
        }
      }
    });
  } catch (err) {
    console.error('sendTokenResponse Error:', err.message);
    res.status(500).json({ success: false, error: 'Authentication dispatch error' });
  }
};

module.exports = sendTokenResponse;
