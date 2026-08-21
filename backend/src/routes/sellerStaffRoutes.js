const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { getStaff, createStaff, deleteStaff } = require('../controllers/sellerStaffController');

router.use(protect);
router.use(authorize('seller'));

router.route('/').get(getStaff).post(createStaff);
router.route('/:id').delete(deleteStaff);

module.exports = router;
