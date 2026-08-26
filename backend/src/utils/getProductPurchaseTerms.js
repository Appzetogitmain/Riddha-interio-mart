const TermsCondition = require("../models/TermsCondition");

// Shown on the customer invoice PDF whenever the admin hasn't configured custom
// "Product Purchase T&C" content yet (Admin → Terms → Product Purchase T&C tab) — so the
// invoice's Terms & Conditions section is never silently blank.
const DEFAULT_PRODUCT_PURCHASE_TERMS = `1. Goods once sold are covered under Riddha Interio Mart's standard return and refund policy.
2. Please inspect all items at the time of delivery and report any damage or discrepancy within 48 hours.
3. This is a digitally generated GST tax invoice issued in compliance with applicable Indian tax regulations.
4. For invoice or order queries, contact support@riddhamart.com.`;

// Admin-configured content wins when present; otherwise falls back to the default above.
async function getProductPurchaseTermsContent() {
  const terms = await TermsCondition.findOne({ type: "product_purchase" });
  return terms?.content || DEFAULT_PRODUCT_PURCHASE_TERMS;
}

module.exports = { getProductPurchaseTermsContent, DEFAULT_PRODUCT_PURCHASE_TERMS };
