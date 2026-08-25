const TermsCondition = require('../models/TermsCondition');

// @desc    Get terms and conditions by type
// @route   GET /api/terms/:type
// @access  Public
exports.getTermsByType = async (req, res) => {
  try {
    const { type } = req.params;
    const validTypes = ['user', 'seller', 'delivery', 'user_privacy', 'seller_privacy', 'delivery_privacy', 'product_purchase'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ success: false, error: 'Invalid terms or privacy type' });
    }

    const terms = await TermsCondition.findOne({ type }).populate('updatedBy', 'fullName email');

    if (!terms) {
      // Return a placeholder structure instead of 404 so UI doesn't crash on initial load
      const readableType = type.replace(/_/g, ' ');
      return res.status(200).json({
        success: true,
        data: {
          type,
          content: type.endsWith('_privacy')
            ? `Welcome to Riddha Interior Mart. This is the default ${readableType.replace(' privacy', '')} privacy policy. Please edit this text in the Admin control panel.`
            : `Welcome to Riddha Interior Mart. These are the default ${readableType} terms and conditions. Please edit this text in the Admin control panel.`,
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

    const validTypes = ['user', 'seller', 'delivery', 'user_privacy', 'seller_privacy', 'delivery_privacy', 'product_purchase'];
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

// @desc    Preview the signed Terms & Conditions / Privacy Policy agreement PDF
//          (header/footer + current saved content), no signature — admin only.
// @route   GET /api/terms/agreement-preview/:role
// @access  Private/Admin
exports.previewAgreementPdf = async (req, res) => {
  try {
    const { role } = req.params;
    const validRoles = ['user', 'seller', 'delivery'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ success: false, error: 'Invalid role' });
    }

    const terms = await TermsCondition.findOne({ type: role });
    const termsText = terms ? terms.content : `Welcome to Riddha Interior Mart. These are the default ${role} terms and conditions.`;

    const privacy = await TermsCondition.findOne({ type: `${role}_privacy` });
    const privacyText = privacy ? privacy.content : `Welcome to Riddha Interior Mart. This is the default ${role} privacy policy.`;

    const SystemSettings = require('../models/SystemSettings');
    const settings = await SystemSettings.findOne();

    const { generateAgreementPDF } = require('../utils/documentPdfGenerator');
    const pdfBuffer = await generateAgreementPDF(role, termsText, privacyText, '', '', settings?.documentTemplateSettings);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename=agreement-preview.pdf');
    return res.send(pdfBuffer);
  } catch (error) {
    console.error('Preview agreement PDF error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
