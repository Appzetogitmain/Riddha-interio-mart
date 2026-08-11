const mongoose = require('mongoose');
const Product = require('../models/Product');
const { getRoomCompletion, ROOM_TEMPLATES } = require('../utils/roomCompletion');

// @desc    Get "Complete the Room" suggestions for a starting product
// @route   GET /api/rooms/complete-suggestions
// @access  Public
exports.getCompleteSuggestions = async (req, res) => {
  try {
    const { productId, roomType } = req.query;

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ success: false, error: 'A valid productId is required' });
    }
    if (roomType && !ROOM_TEMPLATES[roomType]) {
      return res.status(400).json({ success: false, error: `Invalid roomType. Expected one of: ${Object.keys(ROOM_TEMPLATES).join(', ')}` });
    }

    const product = await Product.findById(productId).populate('category', 'name').lean();
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    const roomCompletion = await getRoomCompletion(product, { roomType });

    return res.json({
      success: true,
      data: {
        roomCompletion: {
          primaryProduct: {
            id: product._id,
            name: product.name,
            price: product.price,
            image: product.images?.[0] || null
          },
          ...roomCompletion
        }
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
