/**
 * Quotation Calculation & Number Generation Engine
 * Handles Indian GST (0%, 5%, 12%, 18%) split into CGST & SGST, Discounts, and Grand Totals.
 */

const generateQuotationNumber = () => {
  const dateStr = new Date().getFullYear();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `QT-${dateStr}-${randomSuffix}`;
};

/**
 * Calculates complete Quotation pricing:
 * 1. Subtotal of items (Qty * UnitRate)
 * 2. Itemized & Global Discounts
 * 3. Tiered GST (5%, 12%, 18%) split into equal CGST (half rate) and SGST (half rate)
 * 4. Grand Total
 */
const calculateQuotationPricing = (items = [], discountOptions = {}) => {
  let subtotal = 0;
  let lineDiscounts = 0;

  const processedItems = items.map(item => {
    const qty = Number(item.quantity) || 1;
    const rate = Number(item.unitRate) || 0;
    const amount = qty * rate;
    const taxRate = Number(item.taxRate) || 18;

    // Calculate tax on amount
    const taxAmount = (amount * taxRate) / 100;
    const totalAmount = amount + taxAmount;

    subtotal += amount;

    return {
      ...item,
      quantity: qty,
      unitRate: rate,
      amount,
      taxRate,
      taxAmount: Math.round(taxAmount * 100) / 100,
      totalAmount: Math.round(totalAmount * 100) / 100
    };
  });

  // Calculate Global Discount
  const { globalDiscountType = 'percentage', globalDiscountValue = 0 } = discountOptions;
  let globalDiscountAmount = 0;

  if (globalDiscountType === 'percentage') {
    globalDiscountAmount = (subtotal * Number(globalDiscountValue)) / 100;
  } else {
    globalDiscountAmount = Number(globalDiscountValue);
  }

  globalDiscountAmount = Math.min(subtotal, Math.max(0, globalDiscountAmount));
  const subtotalAfterDiscount = subtotal - globalDiscountAmount;

  // Calculate GST Tax Breakdowns
  // Effective ratio factor for global discount distribution across tax rates
  const discountRatio = subtotal > 0 ? subtotalAfterDiscount / subtotal : 1;

  let totalGST5 = 0;
  let totalGST12 = 0;
  let totalGST18 = 0;

  processedItems.forEach(item => {
    const discountedItemAmount = item.amount * discountRatio;
    const itemTax = (discountedItemAmount * item.taxRate) / 100;

    if (item.taxRate === 5) totalGST5 += itemTax;
    else if (item.taxRate === 12) totalGST12 += itemTax;
    else if (item.taxRate === 18) totalGST18 += itemTax;
  });

  const sgst5 = Math.round((totalGST5 / 2) * 100) / 100;
  const cgst5 = Math.round((totalGST5 / 2) * 100) / 100;
  const sgst12 = Math.round((totalGST12 / 2) * 100) / 100;
  const cgst12 = Math.round((totalGST12 / 2) * 100) / 100;
  const sgst18 = Math.round((totalGST18 / 2) * 100) / 100;
  const cgst18 = Math.round((totalGST18 / 2) * 100) / 100;

  const totalGST = sgst5 + cgst5 + sgst12 + cgst12 + sgst18 + cgst18;
  const grandTotal = Math.round((subtotalAfterDiscount + totalGST) * 100) / 100;

  return {
    items: processedItems,
    pricing: {
      subtotal: Math.round(subtotal * 100) / 100,
      discounts: {
        lineItemDiscounts: Math.round(lineDiscounts * 100) / 100,
        globalDiscountType,
        globalDiscountValue: Number(globalDiscountValue),
        globalDiscountAmount: Math.round(globalDiscountAmount * 100) / 100
      },
      subtotalAfterDiscount: Math.round(subtotalAfterDiscount * 100) / 100,
      taxes: {
        sgst5,
        cgst5,
        sgst12,
        cgst12,
        sgst18,
        cgst18,
        totalGST: Math.round(totalGST * 100) / 100
      },
      grandTotal
    }
  };
};

/**
 * Calculates payment installment schedule dates & amounts
 */
const generateInstallmentSchedule = (grandTotal, structure = '2-installment', startDate = new Date()) => {
  const installments = [];
  const baseDate = new Date(startDate);

  if (structure === 'full') {
    installments.push({
      installmentNo: 1,
      percentage: 100,
      amount: grandTotal,
      dueDate: new Date(baseDate.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days
      description: '100% Full Payment on Order Confirmation',
      paymentMethod: 'Bank Transfer / UPI'
    });
  } else if (structure === '3-installment') {
    const p1 = Math.round(grandTotal * 0.5); // 50% advance
    const p2 = Math.round(grandTotal * 0.3); // 30% procurement
    const p3 = grandTotal - p1 - p2;          // 20% completion

    installments.push({
      installmentNo: 1,
      percentage: 50,
      amount: p1,
      dueDate: new Date(baseDate.getTime() + 7 * 24 * 60 * 60 * 1000),
      description: '50% Advance Booking & Procurement Mobilization',
      paymentMethod: 'Bank Transfer / UPI'
    });
    installments.push({
      installmentNo: 2,
      percentage: 30,
      amount: p2,
      dueDate: new Date(baseDate.getTime() + 25 * 24 * 60 * 60 * 1000),
      description: '30% Material Dispatch & On-Site Installation Start',
      paymentMethod: 'Bank Transfer / UPI'
    });
    installments.push({
      installmentNo: 3,
      percentage: 20,
      amount: p3,
      dueDate: new Date(baseDate.getTime() + 45 * 24 * 60 * 60 * 1000),
      description: '20% Final Handover & Quality Sign-Off',
      paymentMethod: 'Bank Transfer / UPI'
    });
  } else {
    // 2-installment default (50% - 50%)
    const p1 = Math.round(grandTotal * 0.5);
    const p2 = grandTotal - p1;

    installments.push({
      installmentNo: 1,
      percentage: 50,
      amount: p1,
      dueDate: new Date(baseDate.getTime() + 7 * 24 * 60 * 60 * 1000),
      description: '50% Advance Booking & Order Confirmation',
      paymentMethod: 'Bank Transfer / UPI'
    });
    installments.push({
      installmentNo: 2,
      percentage: 50,
      amount: p2,
      dueDate: new Date(baseDate.getTime() + 30 * 24 * 60 * 60 * 1000),
      description: '50% Final Delivery & Installation Handover',
      paymentMethod: 'Bank Transfer / UPI'
    });
  }

  return installments;
};

module.exports = {
  generateQuotationNumber,
  calculateQuotationPricing,
  generateInstallmentSchedule
};
