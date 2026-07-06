const TermsCondition = require('../models/TermsCondition');

// @desc    Get terms and conditions by type
// @route   GET /api/terms/:type
// @access  Public
exports.getTermsByType = async (req, res) => {
  try {
    const { type } = req.params;
    const validTypes = ['user', 'seller', 'delivery', 'user_privacy', 'seller_privacy', 'delivery_privacy'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ success: false, error: 'Invalid terms or privacy type' });
    }

    const terms = await TermsCondition.findOne({ type }).populate('updatedBy', 'fullName email');
    
    if (!terms) {
      // Return a placeholder structure instead of 404 so UI doesn't crash on initial load
      return res.status(200).json({
        success: true,
        data: {
          type,
          content: type.endsWith('_privacy')
            ? `Welcome to Riddha Interior Mart. This is the default ${type.replace('_privacy', '')} privacy policy. Please edit this text in the Admin control panel.`
            : `Welcome to Riddha Interior Mart. These are the default ${type} terms and conditions. Please edit this text in the Admin control panel.`,
          updatedAt: new Date()
        }
      });
    }

    res.status(200).json({
      success: true,
      data: terms
    });
  } catch (error) {
    console.error('Get terms error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Create or update terms and conditions by type
// @route   PUT /api/terms/:type
// @access  Private/Admin
exports.updateTermsByType = async (req, res) => {
  try {
    const { type } = req.params;
    const { content } = req.body;

    const validTypes = ['user', 'seller', 'delivery', 'user_privacy', 'seller_privacy', 'delivery_privacy'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ success: false, error: 'Invalid terms or privacy type' });
    }

    if (!content || content.trim() === '') {
      return res.status(400).json({ success: false, error: 'Terms content cannot be empty' });
    }

    let terms = await TermsCondition.findOne({ type });

    if (terms) {
      terms.content = content;
      terms.updatedBy = req.user.id;
      await terms.save();
    } else {
      terms = await TermsCondition.create({
        type,
        content,
        updatedBy: req.user.id
      });
    }

    // Populate updatedBy details
    const populatedTerms = await TermsCondition.findById(terms._id).populate('updatedBy', 'fullName email');

    res.status(200).json({
      success: true,
      data: populatedTerms
    });
  } catch (error) {
    console.error('Update terms error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
