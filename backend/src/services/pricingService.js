const Product = require('../models/Product');

/**
 * Calculates secure pricing breakdowns and validates cart items from database records.
 * Prevents price tampering by completely ignoring frontend-supplied prices.
 *
 * @param {Array} items - Cart items to calculate [{ product: 'productId', quantity: 2 }]
 * @param {String} userType - The role/type of the user (e.g. 'customer', 'enterpriser')
 * @returns {Promise<Object>} Pricing breakdown containing subtotal, taxAmount, shippingPrice, discountAmount, totalPrice, and enrichedItems
 */
exports.calculateCartPricing = async (items, userType = 'customer') => {
  let subtotal = 0; // sum of original price * quantity
  let discountAmount = 0; // sum of (original - display) * quantity
  let taxAmount = 0; // sum of inclusive GST based on product.gstRate
  let shippingPrice = 0;

  const enrichedItems = [];

  for (const item of items) {
    const productId = item.product || item._id;
    if (!productId) {
      console.error('[pricingService] Item missing productId:', item);
      throw new Error('Invalid cart item: missing product ID');
    }
    
    let product;
    try {
      product = await Product.findById(productId);
    } catch (err) {
      console.error(`[pricingService] Invalid Product ID format: ${productId}`, err.message);
      throw new Error(`Invalid Product ID format: ${productId}`);
    }

    if (!product) {
      console.error(`[pricingService] Product not found in database: ${productId}`);
      throw new Error(`Product not found with ID: ${productId}`);
    }

    const qty = Number(item.quantity) || 1;
    const originalPrice = Number(product.price) || 0;
    const discountPrice = Number(product.discountPrice) || 0;
    const gstRate = Number(product.gstRate) || 18; // Default to 18% if not configured

    // Selling price logic
    let displayPrice = originalPrice;
    
    // Check if eligible for B2B pricing
    const b2bMinQty = product.b2bMinQty || 1;
    const isB2bEligible = userType === 'enterpriser' && 
                          product.b2bPrice && 
                          product.b2bPrice > 0 && 
                          qty >= b2bMinQty;

    if (isB2bEligible) {
      displayPrice = Number(product.b2bPrice);
    } else if (discountPrice > 0 && discountPrice < originalPrice) {
      displayPrice = discountPrice;
    }

    const lineOriginal = originalPrice * qty;
    const lineDiscount = (originalPrice - displayPrice) * qty;
    const lineSellingTotal = displayPrice * qty;

    // Mathematical reverse-calculated inclusive GST:
    // Tax Amount = Selling Price - (Selling Price / (1 + gstRate/100))
    const gstFactor = 1 + (gstRate / 100);
    const lineTax = lineSellingTotal - (lineSellingTotal / gstFactor);

    subtotal += lineOriginal;
    discountAmount += lineDiscount;
    taxAmount += lineTax;

    enrichedItems.push({
      product: product._id,
      name: product.name,
      quantity: qty,
      image: product.images && product.images.length > 0 ? product.images[0] : (product.image || ''),
      price: displayPrice, // Persisted selling price validated from DB
      seller: product.seller,
      sellerType: product.sellerType || 'Seller',
      gstRate,
      lineTax: Number(lineTax.toFixed(2))
    });
  }

  // Real-world shipping fee logic:
  // Complimentary delivery for cart orders above ₹500, else ₹50 fee
  const sellingTotal = subtotal - discountAmount;
  if (sellingTotal > 0 && sellingTotal < 500) {
    shippingPrice = 50;
  }

  const grandTotal = sellingTotal + shippingPrice;

  return {
    subtotal: Number(subtotal.toFixed(2)),
    discountAmount: Number(discountAmount.toFixed(2)),
    taxAmount: Number(taxAmount.toFixed(2)),
    shippingPrice: Number(shippingPrice.toFixed(2)),
    totalPrice: Number(grandTotal.toFixed(2)),
    enrichedItems
  };
};
