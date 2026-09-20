const express = require('express');
const { 
  registerAdmin, 
  loginAdmin, 
  getAdminMe,
  updateAdminProfile,
  updateAdminPassword,
  getPendingSellers,
  getActiveSellers,
  approveSeller,
  deleteSeller,
  downloadSellerAgreementPDF,
  suspendSeller,
  unsuspendSeller,
  getDashboardStats,
  getStockStatus,
  getAssistants,
  createAssistant,
  updateAssistant,
  deleteAssistant,
  getUsers,
  updateUser,
  deleteUser,
  getCashCollections,
  confirmCashDeposit,
  getSellerTransactions,
  searchOrders,
  getActivityLogs,
  adjustStock,
  batchAdjustStock,
  getProductInventoryHistory,
  getActiveReservations
} = require('../controllers/adminController');
const { protect, authorize, checkPermission } = require('../middleware/auth');
const { check } = require('express-validator');
const { validate } = require('../middleware/validationMiddleware');

const router = express.Router();

router.post('/register', registerAdmin);
router.post('/login', [
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Password is required').exists(),
  validate
], loginAdmin);
router.get('/me', protect, getAdminMe);
router.put('/profile', protect, updateAdminProfile);
router.put('/password', protect, updateAdminPassword);

// Search suggestions
router.get('/orders/search', protect, authorize('admin'), checkPermission('orders'), searchOrders);

// Seller Management routes (Admin only)
router.get('/sellers/pending', protect, authorize('admin'), checkPermission('sellers'), getPendingSellers);
router.get('/sellers/active', protect, authorize('admin'), checkPermission('sellers'), getActiveSellers);
router.get('/sellers/:id/pdf', protect, authorize('admin'), checkPermission('sellers'), downloadSellerAgreementPDF);
router.put('/sellers/:id/approve', protect, authorize('admin'), checkPermission('sellers'), approveSeller);
router.delete('/sellers/:id', protect, authorize('admin'), checkPermission('sellers'), deleteSeller);
router.put('/sellers/:id/suspend', protect, authorize('admin'), checkPermission('sellers'), suspendSeller);
router.put('/sellers/:id/unsuspend', protect, authorize('admin'), checkPermission('sellers'), unsuspendSeller);
router.get('/dashboard-stats', protect, authorize('admin'), checkPermission('dashboard'), getDashboardStats);
router.get('/stock-status', protect, authorize('admin'), checkPermission('products'), getStockStatus);

// Advanced Inventory Management routes
router.put('/inventory/adjust/:id', protect, authorize('admin'), checkPermission('products'), adjustStock);
router.post('/inventory/batch-adjust', protect, authorize('admin'), checkPermission('products'), batchAdjustStock);
router.get('/inventory/history/:id', protect, authorize('admin'), checkPermission('products'), getProductInventoryHistory);
router.get('/inventory/reservations', protect, authorize('admin'), checkPermission('products'), getActiveReservations);

// Assistant Management routes (Superadmin only or restricted)
router.get('/assistants', protect, authorize('admin'), checkPermission('team'), getAssistants);
router.post('/assistants', protect, authorize('admin'), checkPermission('team'), createAssistant);
router.put('/assistants/:id', protect, authorize('admin'), checkPermission('team'), updateAssistant);
router.delete('/assistants/:id', protect, authorize('admin'), checkPermission('team'), deleteAssistant);
router.get('/users', protect, authorize('admin'), checkPermission('customers'), getUsers);
router.put('/users/:id', protect, authorize('admin'), checkPermission('customers'), updateUser);
router.delete('/users/:id', protect, authorize('admin'), checkPermission('customers'), deleteUser);

// Payment Management
router.get('/payments/delivery', protect, authorize('admin'), checkPermission('payments'), getCashCollections);
router.put('/payments/delivery/confirm/:deliveryBoyId', protect, authorize('admin'), checkPermission('payments'), confirmCashDeposit);
router.get('/payments/sellers', protect, authorize('admin'), checkPermission('payments'), getSellerTransactions);

// Activity Logs route
router.get('/activity-logs', protect, authorize('admin'), checkPermission('team'), getActivityLogs);

module.exports = router;
