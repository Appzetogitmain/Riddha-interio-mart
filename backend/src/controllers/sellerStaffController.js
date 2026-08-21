const SellerStaff = require('../models/SellerStaff');

// @desc    List the logged-in seller's delivery staff
// @route   GET /api/seller/staff
// @access  Private/Seller
exports.getStaff = async (req, res) => {
  try {
    const staff = await SellerStaff.find({ seller: req.user.id, isActive: true }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: staff });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Add a delivery staff member for the logged-in seller
// @route   POST /api/seller/staff
// @access  Private/Seller
exports.createStaff = async (req, res) => {
  try {
    const { name, phone, vehicleNumber, drivingLicense } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Staff name is required' });
    }
    if (!phone || !phone.trim()) {
      return res.status(400).json({ success: false, error: 'Staff phone number is required' });
    }

    const staff = await SellerStaff.create({
      seller: req.user.id,
      name: name.trim(),
      phone: phone.trim(),
      vehicleNumber: (vehicleNumber || '').trim(),
      drivingLicense: (drivingLicense || '').trim()
    });

    res.status(201).json({ success: true, data: staff });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Remove (deactivate) a delivery staff member
// @route   DELETE /api/seller/staff/:id
// @access  Private/Seller
exports.deleteStaff = async (req, res) => {
  try {
    const staff = await SellerStaff.findById(req.params.id);
    if (!staff) {
      return res.status(404).json({ success: false, error: 'Staff member not found' });
    }
    if (staff.seller.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    staff.isActive = false;
    await staff.save();

    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
