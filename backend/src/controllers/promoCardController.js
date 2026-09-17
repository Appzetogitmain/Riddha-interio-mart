const PromoCard = require('../models/PromoCard');

const defaultPromos = [
  {
    title: "Contractor Benefits",
    items: ["Special Pricing", "Bulk Deals", "Priority Support"],
    btnText: "Join Now",
    bg: "bg-[#F4F9F8]",
    textColor: "text-[#28a399]",
    btnColor: "text-[#28a399]",
    img: "https://res.cloudinary.com/drtq1k4ls/image/upload/v1726588663/riddha_mart/images/3_png_1726588661793.png",
    link: "/contractor-registration",
    order: 1
  },
  {
    title: "Interior Designer Zone",
    items: ["Premium Materials", "For Your Projects"],
    btnText: "Join Now",
    bg: "bg-[#FFF4F7]",
    textColor: "text-[#D81B60]",
    btnColor: "text-[#D81B60]",
    img: "https://res.cloudinary.com/drtq1k4ls/image/upload/v1726588663/riddha_mart/images/2_png_1726588661793.png",
    link: "/designer-registration",
    order: 2
  },
  {
    title: "Builder Benefits",
    items: ["Reliable Supplies", "At Best Prices"],
    btnText: "Join Now",
    bg: "bg-[#FFF8F2]",
    textColor: "text-[#F57C00]",
    btnColor: "text-[#F57C00]",
    img: "https://res.cloudinary.com/drtq1k4ls/image/upload/v1726588663/riddha_mart/images/4_png_1726588661793.png",
    link: "/builder-registration",
    order: 3
  },
  {
    title: "Refer & Earn",
    items: ["Refer Your Friends", "& Earn Rewards"],
    btnText: "Know More",
    bg: "bg-[#F8F4FF]",
    textColor: "text-[#7E57C2]",
    btnColor: "text-[#7E57C2]",
    img: "https://res.cloudinary.com/drtq1k4ls/image/upload/v1726588663/riddha_mart/images/1_png_1726588661793.png",
    link: "/referral",
    order: 4
  }
];

// @desc    Get all promo cards (ordered)
// @route   GET /api/promo-cards
// @access  Public
exports.getPromoCards = async (req, res) => {
  try {
    const isAdmin = req.user && req.user.role === 'admin';
    const filter = isAdmin ? {} : { isActive: true };
    let cards = await PromoCard.find(filter).sort({ order: 1 });
    
    // Auto-seed if empty
    if (cards.length === 0) {
      await PromoCard.insertMany(defaultPromos);
      cards = await PromoCard.find(filter).sort({ order: 1 });
    }

    res.json({ success: true, count: cards.length, data: cards });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error fetching promo cards' });
  }
};

// @desc    Create a new promo card
// @route   POST /api/promo-cards
// @access  Private/Admin
exports.createPromoCard = async (req, res) => {
  try {
    const cardsCount = await PromoCard.countDocuments();
    req.body.order = req.body.order || cardsCount;
    
    const card = await PromoCard.create(req.body);
    res.status(201).json({ success: true, data: card });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Update a promo card
// @route   PUT /api/promo-cards/:id
// @access  Private/Admin
exports.updatePromoCard = async (req, res) => {
  try {
    let card = await PromoCard.findById(req.params.id);
    if (!card) {
      return res.status(404).json({ success: false, error: 'Promo card not found' });
    }

    card = await PromoCard.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.json({ success: true, data: card });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Delete a promo card
// @route   DELETE /api/promo-cards/:id
// @access  Private/Admin
exports.deletePromoCard = async (req, res) => {
  try {
    const card = await PromoCard.findById(req.params.id);
    if (!card) {
      return res.status(404).json({ success: false, error: 'Promo card not found' });
    }

    await card.deleteOne();
    res.json({ success: true, data: {} });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Reorder promo cards
// @route   PUT /api/promo-cards/reorder
// @access  Private/Admin
exports.reorderPromoCards = async (req, res) => {
  try {
    const { orderData } = req.body; // Array of { id, order }

    if (!orderData || !Array.isArray(orderData)) {
      return res.status(400).json({ success: false, error: 'Please provide order data array' });
    }

    for (const item of orderData) {
      await PromoCard.findByIdAndUpdate(item.id, { order: item.order });
    }

    res.json({ success: true, message: 'Reordered successfully' });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};
