const Cart = require('../models/Cart');
const Product = require('../models/Product');

const sameLine = (item, productId, variantId) =>
  item.product.toString() === String(productId) &&
  String(item.variantId || '') === String(variantId || '');

// Returns { variant, stock, error } for a product/variant pair. Products with
// variants must be added with a valid variantId; others must not carry one.
const resolveStock = (product, variantId) => {
  if (product.variants && product.variants.length > 0) {
    if (!variantId) return { error: 'Please select a variant.' };
    const variant = product.variants.id(variantId);
    if (!variant) return { error: 'Selected variant is no longer available.' };
    return { variant, stock: variant.countInStock };
  }
  return { variant: null, stock: product.countInStock };
};

// @desc    Get current user's cart
// @route   GET /api/cart
// @access  Private
exports.getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user.id }).populate('items.product');

    if (!cart) {
      cart = await Cart.create({ user: req.user.id, items: [] });
    }

    res.status(200).json({
      success: true,
      data: cart
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add product to cart
// @route   POST /api/cart
// @access  Private
exports.addToCart = async (req, res) => {
  const { productId, quantity } = req.body;
  const variantId = req.body.variantId || null;
  const requestedQuantity = quantity || 1;

  try {
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const { stock, error } = resolveStock(product, variantId);
    if (error) {
      return res.status(400).json({ success: false, message: error });
    }

    let cart = await Cart.findOne({ user: req.user.id });

    // Validate Stock
    let currentCartQuantity = 0;
    if (cart) {
      const existingItem = cart.items.find(item => sameLine(item, productId, variantId));
      if (existingItem) {
        currentCartQuantity = existingItem.quantity;
      }
    }

    if (stock < (currentCartQuantity + requestedQuantity)) {
      return res.status(400).json({
        success: false,
        message: `Only ${stock} items available in stock.`
      });
    }

    if (!cart) {
      cart = await Cart.create({
        user: req.user.id,
        items: [{ product: productId, variantId, quantity: requestedQuantity }]
      });
    } else {
      const itemIndex = cart.items.findIndex(item => sameLine(item, productId, variantId));

      if (itemIndex > -1) {
        // Same product + variant already in cart, update quantity
        cart.items[itemIndex].quantity += requestedQuantity;
      } else {
        // Not in cart, add new line
        cart.items.push({ product: productId, variantId, quantity: requestedQuantity });
      }
      await cart.save();
    }

    cart = await Cart.findById(cart._id).populate('items.product');

    res.status(200).json({
      success: true,
      data: cart
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update item quantity in cart
// @route   PUT /api/cart/:productId
// @access  Private
exports.updateQuantity = async (req, res) => {
  const { quantity } = req.body;
  const { productId } = req.params;
  const variantId = req.query.variantId || req.body.variantId || null;

  try {
    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    const itemIndex = cart.items.findIndex(item => sameLine(item, productId, variantId));

    if (itemIndex === -1) {
      return res.status(404).json({ success: false, message: 'Item not found in cart' });
    }

    if (quantity > 0) {
      const product = await Product.findById(productId);
      if (product) {
        const { stock, error } = resolveStock(product, variantId);
        if (error) {
          return res.status(400).json({ success: false, message: error });
        }
        if (stock < quantity) {
          return res.status(400).json({
            success: false,
            message: `Only ${stock} items available in stock.`
          });
        }
      }
    }

    if (quantity <= 0) {
      cart.items.splice(itemIndex, 1);
    } else {
      cart.items[itemIndex].quantity = quantity;
    }

    await cart.save();
    cart = await Cart.findById(cart._id).populate('items.product');

    res.status(200).json({
      success: true,
      data: cart
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Remove product from cart
// @route   DELETE /api/cart/:productId
// @access  Private
exports.removeFromCart = async (req, res) => {
  const { productId } = req.params;
  const variantId = req.query.variantId || null;

  try {
    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    cart.items = cart.items.filter(item => !sameLine(item, productId, variantId));
    await cart.save();
    cart = await Cart.findById(cart._id).populate('items.product');

    res.status(200).json({
      success: true,
      data: cart
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Clear cart
// @route   DELETE /api/cart
// @access  Private
exports.clearCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    cart.items = [];
    await cart.save();

    res.status(200).json({
      success: true,
      message: 'Cart cleared'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
