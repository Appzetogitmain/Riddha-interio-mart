const express = require('express');
const c = require('../controllers/displayController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Only the Super Admin may change display settings / overrides (assistants and sellers get 403).
// Legacy admin records without a `type` are treated as super admin, matching checkPermission().
const superAdminOnly = (req, res, next) => {
  const t = req.user?.type;
  if (!t || t === 'superadmin') return next();
  return res.status(403).json({ success: false, error: 'Only the Super Admin can change rating and bestseller display settings.' });
};

router.get('/config', c.publicConfig); // public: storefront merges this with each product's real values

router.get('/settings', protect, authorize('admin'), c.getSettings);
router.put('/settings', protect, authorize('admin'), superAdminOnly, c.updateSettings);
router.get('/bestsellers', protect, authorize('admin'), c.bestsellerPreview);
router.get('/audit', protect, authorize('admin'), superAdminOnly, c.auditLog);

router.get('/products/:id', protect, authorize('admin'), c.getProductOverrides);
router.put('/products/:id', protect, authorize('admin'), superAdminOnly, c.updateProductOverrides);
router.post('/products/:id/reset', protect, authorize('admin'), superAdminOnly, c.resetProductOverrides);

module.exports = router;
