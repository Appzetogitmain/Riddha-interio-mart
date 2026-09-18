const mongoose = require('mongoose');
const ServiceRequest = require('../models/ServiceRequest');
const User = require('../models/User');
const Razorpay = require('razorpay');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'dummy_key',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_secret'
});

// @desc    Get professionals by category
// @route   GET /api/v1/service-requests/professionals/:category
// @access  Private (Customer)
exports.getProfessionalsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    let professionals = await User.find({
      'professionalProfile.isProfessional': true,
      'professionalProfile.category': category
    }).select('fullName email avatar professionalProfile');

    if (professionals.length === 0) {
      const B2BLead = require('../models/B2BLead');
      const categoryToProfessions = {
        'Designer': ['Interior Designer', 'Designer'],
        'Contractor': ['Contractor'],
        'Architect': ['Architect', 'Builder']
      };

      const professions = categoryToProfessions[category] || [category];
      const leads = await B2BLead.find({ profession: { $in: professions } });

      for (const lead of leads) {
        if (!lead.email) continue;
        const existingUser = await User.findOne({ email: lead.email });
        if (existingUser) {
          existingUser.professionalProfile = {
            isProfessional: true,
            category: category,
            rating: existingUser.professionalProfile?.rating || 5.0,
            availabilityStatus: true
          };
          await existingUser.save();
        } else {
          try {
            await User.create({
              fullName: lead.fullName || 'Professional',
              email: lead.email,
              password: 'Password123!',
              phone: lead.phone || '',
              userType: 'customer',
              isEmailVerified: true,
              professionalProfile: {
                isProfessional: true,
                category: category,
                rating: 5.0,
                availabilityStatus: true
              }
            });
          } catch (createErr) {
            console.warn(`[Auto-Sync] Skip ${lead.email}: ${createErr.message}`);
          }
        }
      }

      professionals = await User.find({
        'professionalProfile.isProfessional': true,
        'professionalProfile.category': category
      }).select('fullName email avatar professionalProfile');
    }

    res.status(200).json({ success: true, count: professionals.length, data: professionals });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Create a service request (broadcast to professionals)
// @route   POST /api/v1/service-requests
// @access  Private (Customer)
exports.createRequest = async (req, res) => {
  try {
    const { category, projectDetails } = req.body;
    
    if (!['Designer', 'Contractor', 'Architect'].includes(category)) {
      return res.status(400).json({ success: false, error: 'Invalid category' });
    }

    // Find all professionals matching the category and available
    let professionals = await User.find({
      'professionalProfile.isProfessional': true,
      'professionalProfile.category': category,
      'professionalProfile.availabilityStatus': true
    });

    if (professionals.length === 0) {
      const B2BLead = require('../models/B2BLead');
      const categoryToProfessions = {
        'Designer': ['Interior Designer', 'Designer'],
        'Contractor': ['Contractor'],
        'Architect': ['Architect', 'Builder']
      };

      const professions = categoryToProfessions[category] || [category];
      const leads = await B2BLead.find({ profession: { $in: professions } });

      for (const lead of leads) {
        if (!lead.email) continue;
        const existingUser = await User.findOne({ email: lead.email });
        if (existingUser) {
          existingUser.professionalProfile = {
            isProfessional: true,
            category: category,
            rating: existingUser.professionalProfile?.rating || 5.0,
            availabilityStatus: true
          };
          await existingUser.save();
        } else {
          try {
            await User.create({
              fullName: lead.fullName || 'Professional',
              email: lead.email,
              password: 'Password123!',
              phone: lead.phone || '',
              userType: 'customer',
              isEmailVerified: true,
              professionalProfile: {
                isProfessional: true,
                category: category,
                rating: 5.0,
                availabilityStatus: true
              }
            });
          } catch (createErr) {
            console.warn(`[Auto-Sync] Skip ${lead.email}: ${createErr.message}`);
          }
        }
      }

      professionals = await User.find({
        'professionalProfile.isProfessional': true,
        'professionalProfile.category': category,
        'professionalProfile.availabilityStatus': true
      });
    }

    if (professionals.length === 0) {
      return res.status(404).json({ success: false, error: `No available ${category}s found at the moment.` });
    }

    const broadcastedTo = professionals.map(p => p._id);

    const serviceRequest = await ServiceRequest.create({
      customerId: req.user.id,
      category,
      projectDetails,
      broadcastedTo
    });

    res.status(201).json({
      success: true,
      data: serviceRequest
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get requests broadcasted to a professional
// @route   GET /api/v1/service-requests/professional
// @access  Private (Professional)
exports.getRequestsForProfessional = async (req, res) => {
  try {
    const requests = await ServiceRequest.find({
      broadcastedTo: req.user.id,
      $or: [
        { status: 'Pending' }, // Available to accept
        { acceptedBy: req.user.id } // Already accepted by this professional
      ]
    }).populate('customerId', 'fullName email phone');

    res.status(200).json({
      success: true,
      count: requests.length,
      data: requests
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get requests created by customer
// @route   GET /api/v1/service-requests/my-requests
// @access  Private (Customer)
exports.getUserRequests = async (req, res) => {
  try {
    const requests = await ServiceRequest.find({ customerId: req.user.id })
      .populate('acceptedBy', 'fullName email phone professionalProfile');

    res.status(200).json({
      success: true,
      count: requests.length,
      data: requests
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Accept a broadcasted request (First Come, First Served)
// @route   PUT /api/v1/service-requests/:id/accept
// @access  Private (Professional)
exports.acceptRequest = async (req, res) => {
  try {
    const serviceRequest = await ServiceRequest.findById(req.params.id);

    if (!serviceRequest) {
      return res.status(404).json({ success: false, error: 'Request not found' });
    }

    if (!serviceRequest.broadcastedTo.includes(req.user.id)) {
      return res.status(403).json({ success: false, error: 'You are not authorized to accept this request' });
    }

    if (serviceRequest.status !== 'Pending') {
      return res.status(400).json({ success: false, error: 'This request has already been accepted or is no longer pending' });
    }

    // Atomic update to ensure first-come first-served
    const updatedRequest = await ServiceRequest.findOneAndUpdate(
      { _id: serviceRequest._id, status: 'Pending' },
      { 
        status: 'Consultancy',
        acceptedBy: req.user.id
      },
      { new: true }
    );

    if (!updatedRequest) {
       return res.status(400).json({ success: false, error: 'This request has already been accepted' });
    }

    res.status(200).json({
      success: true,
      data: updatedRequest
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Mark consultancy done and set amount
// @route   PUT /api/v1/service-requests/:id/consultancy-done
// @access  Private (Professional)
exports.markConsultancyDone = async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, error: 'Please provide a valid amount' });
    }

    const serviceRequest = await ServiceRequest.findById(req.params.id);

    if (!serviceRequest) {
      return res.status(404).json({ success: false, error: 'Request not found' });
    }

    if (serviceRequest.acceptedBy.toString() !== req.user.id.toString()) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    if (serviceRequest.status !== 'Consultancy') {
      return res.status(400).json({ success: false, error: 'Request is not in consultancy phase' });
    }

    serviceRequest.status = 'Pending Payment';
    serviceRequest.payment.amount = amount;
    await serviceRequest.save();

    res.status(200).json({
      success: true,
      data: serviceRequest
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Initiate Razorpay Payment
// @route   POST /api/v1/service-requests/:id/payment
// @access  Private (Customer)
exports.initiatePayment = async (req, res) => {
  try {
    const serviceRequest = await ServiceRequest.findById(req.params.id);

    if (!serviceRequest) {
      return res.status(404).json({ success: false, error: 'Request not found' });
    }

    if (serviceRequest.customerId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    if (serviceRequest.status !== 'Pending Payment') {
      return res.status(400).json({ success: false, error: 'Payment is not required at this stage' });
    }

    const amountInPaise = serviceRequest.payment.amount * 100;

    const options = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: `receipt_sr_${serviceRequest._id}`
    };

    const order = await razorpay.orders.create(options);

    serviceRequest.payment.razorpayOrderId = order.id;
    await serviceRequest.save();

    res.status(200).json({
      success: true,
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
