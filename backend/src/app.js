const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const path = require('path');
const http = require('http');
const helmet = require('helmet');
const { limiter, authLimiter } = require('./middleware/rateLimiter');

const connectDB = require('./config/db');

// Load env vars
dotenv.config();

// Route files
const productRoutes = require('./routes/productRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const sellerRoutes = require('./routes/sellerRoutes');
const deliveryRoutes = require('./routes/deliveryRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const cartRoutes = require('./routes/cartRoutes');
const addressRoutes = require('./routes/addressRoutes');
const orderRoutes = require('./routes/orderRoutes');
const homeBannerRoutes = require('./routes/homeBannerRoutes');
const promoBannerRoutes = require('./routes/promoBannerRoutes');
const sectionRoutes = require('./routes/sectionRoutes');
const favouriteSectionRoutes = require('./routes/favouriteSectionRoutes');
const brandRoutes = require('./routes/brandRoutes');
const catalogRoutes = require('./routes/catalogRoutes');
const bulkOrderRoutes = require('./routes/bulkOrderRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const returnRoutes = require('./routes/returnRoutes');
const referralRoutes = require('./routes/referralRoutes');
const taxRoutes = require('./routes/taxRoutes');
const walletRoutes = require('./routes/walletRoutes');
const marketingRoutes = require('./routes/marketingRoutes');
const supportRoutes = require('./routes/supportRoutes');
const dispatchRoutes = require('./routes/dispatchRoutes');
const b2bLeadRoutes = require('./routes/b2bLeadRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const errorHandler = require('./middleware/errorMiddleware');
const authRoutes = require('./routes/authRoutes');
const { initSocket } = require('./socket');

const uploadRoutes = require('./routes/uploadRoutes');

const mongoSanitize = require('express-mongo-sanitize');

const app = express();

// Body parser
app.use(express.json({
  limit: '50mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Protect against NoSQL injection
app.use((req, res, next) => {
  // In Express 5, req.query is a getter. We need to make it writable
  // so express-mongo-sanitize can reassign it.
  Object.defineProperty(req, 'query', {
    value: { ...req.query },
    writable: true,
    configurable: true,
    enumerable: true,
  });
  next();
});
app.use(mongoSanitize());

// Enable Cookies
app.use(cookieParser(process.env.COOKIE_SECRET));

// Enable CORS
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim()) : [];
    if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Set security HTTP headers
app.use(helmet());

// Apply rate limiting to all routes
app.use('/api', limiter);

// Apply stricter rate limiting only to credential/OTP entry points.
// Authenticated admin/seller/user reads under /api/auth/* should not share the
// tiny login-attempt quota.
app.use([
  '/api/auth/admin/login',
  '/api/auth/admin/register',
  '/api/auth/user/login',
  '/api/auth/user/register',
  '/api/auth/user/verify-email',
  '/api/auth/user/forgotpassword',
  '/api/auth/user/resetpassword',
  '/api/auth/seller/login',
  '/api/auth/seller/register',
  '/api/auth/seller/verify-otp',
  '/api/auth/delivery/login',
  '/api/auth/delivery/register'
], authLimiter);

// Dev logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Set static folder for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/auth/user', userRoutes);
app.use('/api/auth/admin', adminRoutes);

// Test route
const { protect } = require('./middleware/auth');
const { getSellerCustomers } = require('./controllers/sellerController');
app.get('/api/auth/seller/customers', protect, getSellerCustomers);
app.get('/api/seller/customers', protect, getSellerCustomers);

app.use('/api/auth/seller', sellerRoutes);
app.use('/api/seller', sellerRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/auth/delivery', deliveryRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/address', addressRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/home-banner', homeBannerRoutes);
app.use('/api/promo-banner', promoBannerRoutes);
app.use('/api/sections', sectionRoutes);
app.use('/api/favourite-section', favouriteSectionRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/catalog', catalogRoutes);
app.use('/api/bulk-orders', bulkOrderRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/returns', returnRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/tax', taxRoutes);
app.use('/api/wallets', walletRoutes);
app.use('/api/marketing', marketingRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/dispatch', dispatchRoutes);
app.use('/api/b2b-leads', b2bLeadRoutes);
app.use('/api/settings', settingsRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Riddha Mart API' });
});

app.get('/api/config/razorpay', (req, res) => {
  res.json({ key: process.env.RAZORPAY_KEY_ID });
});




app.use(errorHandler);

// Port configuration
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    // Initialize Firebase Admin SDK for FCM push notifications
    // (no-op / mock-mode if FIREBASE_SERVICE_ACCOUNT_JSON or _PATH are not set)
    const { initFirebase } = require('./services/firebaseAdmin');
    initFirebase();

    // Start background email queue processor daemon
    const emailService = require('./services/emailService');
    emailService.startDaemon();

    // Start background stock reservation queue daemon
    const inventoryService = require('./services/inventoryService');
    inventoryService.startReservationDaemon();

    const server = http.createServer(app);
    initSocket(server);
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Stop other backend instances and restart.`);
      } else {
        console.error(`Server startup error: ${error.message}`);
      }
      process.exit(1);
    });

    server.listen(PORT, () => {
      console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    });
  } catch (error) {
    console.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

startServer();

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  // server.close(() => process.exit(1));
});

module.exports = app;
