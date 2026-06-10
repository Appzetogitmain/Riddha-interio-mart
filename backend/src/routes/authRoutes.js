const express = require('express');
const { refreshToken, logout, getMe, forgotPassword, resetPassword } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/refresh', refreshToken);
router.post('/logout', logout);
router.get('/me', protect, getMe);
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword', resetPassword);

module.exports = router;
