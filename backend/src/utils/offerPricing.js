function computeOfferPrice(basePrice, offer) {
  const base = Number(basePrice) || 0;
  if (offer.discountType === 'percentage') return Math.max(0, base - (base * offer.discountValue / 100));
  if (offer.discountType === 'flat') return Math.max(0, base - offer.discountValue);
  if (offer.discountType === 'fixedPrice') return Math.max(0, offer.discountValue);
  return base;
}

// Given a list of active/approved offers touching one product, pick the one that
// yields the best (lowest) price for the customer. Combo Offers are excluded — their
// discount applies to the bundle as a whole, not to a single product's displayed price.
function pickBestOffer(basePrice, offers) {
  return offers
    .filter(o => o.type !== 'Combo Offers')
    .reduce((best, o) => {
      const price = computeOfferPrice(basePrice, o);
      return (!best || price < best.price) ? { offer: o, price } : best;
    }, null);
}

module.exports = { computeOfferPrice, pickBestOffer };
