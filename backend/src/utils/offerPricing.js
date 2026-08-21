/**
 * Offer Pricing Utilities
 * Handles price computation when offers are applied
 */

/**
 * Compute the discounted price based on offer details
 * @param {number} basePrice - Original product price
 * @param {Object} offer - Offer object { discountType, discountValue, comboPrice }
 * @returns {number} Computed price after discount
 */
function computeOfferPrice(basePrice, offer) {
  const base = Number(basePrice) || 0;

  if (!offer) return base;

  if (offer.discountType === 'percentage') {
    return Math.max(0, base - (base * offer.discountValue) / 100);
  }

  if (offer.discountType === 'flat') {
    return Math.max(0, base - offer.discountValue);
  }

  if (offer.discountType === 'fixedPrice') {
    return Math.max(0, offer.discountValue);
  }

  return base;
}

/**
 * Pick the best offer (lowest price) from multiple applicable offers
 * Excludes Combo Offers since they apply to bundles, not individual products
 * @param {number} basePrice - Original product price
 * @param {Array<Object>} offers - Array of applicable offer objects
 * @returns {Object|null} { offer, price } or null if no applicable offers
 */
function pickBestOffer(basePrice, offers) {
  if (!offers || offers.length === 0) return null;

  return offers
    .filter((o) => o.type !== 'Combo Offers')
    .reduce((best, o) => {
      const price = computeOfferPrice(basePrice, o);
      return !best || price < best.price ? { offer: o, price } : best;
    }, null);
}

/**
 * Attach offer pricing to products (in-memory only, no DB write)
 * Used in product listing and detail endpoints
 * @param {Array<Object>|Object} products - Single product or array of products
 * @param {Array<Object>} applicableOffers - Array of all active/approved offers
 * @returns {Array<Object>|Object} Products with computed discountPrice and appliedOffer
 */
function attachOfferPricing(products, applicableOffers = []) {
  const list = Array.isArray(products) ? products : [products];
  const isArray = Array.isArray(products);

  for (const product of list) {
    const applicable = applicableOffers.filter((o) =>
      o.products.some((id) => id.toString() === product._id.toString())
    );

    if (!applicable.length) continue;

    const best = pickBestOffer(product.price, applicable);
    if (best && best.price < (product.discountPrice || product.price)) {
      product.discountPrice = Math.round(best.price);
      product.appliedOffer = {
        id: best.offer._id,
        type: best.offer.type,
        title: best.offer.title,
        discountValue: best.offer.discountValue,
        discountType: best.offer.discountType
      };
    }
  }

  return isArray ? list : list[0];
}

module.exports = {
  computeOfferPrice,
  pickBestOffer,
  attachOfferPricing
};
