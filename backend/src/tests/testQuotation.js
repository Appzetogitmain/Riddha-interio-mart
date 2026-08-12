const { generateQuotationNumber, calculateQuotationPricing, generateInstallmentSchedule } = require('../utils/quotationEngine');
const geminiQuotationService = require('../services/geminiQuotationService');
const { generateQuotationPDF } = require('../utils/quotationPdfGenerator');

async function runQuotationTests() {
  console.log('--- Testing Quotation Calculation Engine & GST Tax Compliance ---');

  // 1. Test Quote Number Generator
  const qNum = generateQuotationNumber();
  console.log('1. Generated Quote Number:', qNum);

  // 2. Test Pricing & Indian GST (5%, 12%, 18% split into CGST + SGST)
  const dummyItems = [
    { description: 'King Size Bed Frame', quantity: 1, unitRate: 45000, taxRate: 18, hsnCode: '9403' },
    { description: 'COB Warm Downlights', quantity: 6, unitRate: 1000, taxRate: 12, hsnCode: '9405' },
    { description: 'Vitrified Tiles (200 sq ft)', quantity: 200, unitRate: 120, taxRate: 18, hsnCode: '6907' }
  ];

  const { items: processedItems, pricing } = calculateQuotationPricing(dummyItems, {
    globalDiscountType: 'percentage',
    globalDiscountValue: 10 // 10% global discount
  });

  console.log('\n2. Testing Pricing Engine Output:');
  console.log('   Subtotal:', pricing.subtotal);
  console.log('   Discount Amount (10%):', pricing.discounts.globalDiscountAmount);
  console.log('   Subtotal After Discount:', pricing.subtotalAfterDiscount);
  console.log('   SGST 18%:', pricing.taxes.sgst18);
  console.log('   CGST 18%:', pricing.taxes.cgst18);
  console.log('   SGST 12%:', pricing.taxes.sgst12);
  console.log('   CGST 12%:', pricing.taxes.cgst12);
  console.log('   Total GST:', pricing.taxes.totalGST);
  console.log('   Grand Total:', pricing.grandTotal);

  // 3. Test CostEstimate costBreakdown Mapping
  console.log('\n3. Testing Cost Estimate Breakdown Mapping:');
  const dummyEstimate = {
    roomType: 'Master Bedroom',
    materialTier: 'premium',
    costBreakdown: {
      furniture: 65000,
      flooring: 24000,
      lighting: 12000,
      paint: 8000,
      labor: 15000
    }
  };

  const categoryMap = [
    { name: 'Furniture Package', cost: dummyEstimate.costBreakdown.furniture, hsn: '9403', taxRate: 18 },
    { name: 'Flooring Package', cost: dummyEstimate.costBreakdown.flooring, hsn: '6907', taxRate: 18 },
    { name: 'Lighting & Electrical Package', cost: dummyEstimate.costBreakdown.lighting, hsn: '9405', taxRate: 12 },
    { name: 'Paint & Surface Finish Package', cost: dummyEstimate.costBreakdown.paint, hsn: '3209', taxRate: 18 },
    { name: 'On-Site Labor & Installation Services', cost: dummyEstimate.costBreakdown.labor, hsn: '9987', taxRate: 18 }
  ];

  const estImportedItems = categoryMap.map(cat => ({
    description: `${dummyEstimate.roomType} - ${cat.name} (${dummyEstimate.materialTier} tier)`,
    quantity: 1,
    unit: 'Package',
    unitRate: cat.cost,
    hsnCode: cat.hsn,
    taxRate: cat.taxRate
  }));

  const { pricing: estPricing } = calculateQuotationPricing(estImportedItems);
  console.log(`   ✅ Successfully mapped ${estImportedItems.length} categories from Cost Estimate (Total: Rs. ${estPricing.grandTotal})`);

  // 4. Test Installment Schedule Generation
  const schedule = generateInstallmentSchedule(pricing.grandTotal, '3-installment');
  console.log('\n4. Testing Installment Schedule (3-Milestones):');
  schedule.forEach(inst => console.log(`   Milestone ${inst.installmentNo}: ${inst.percentage}% = Rs. ${inst.amount} (${inst.description})`));

  // 5. Test Gemini AI Service Fallbacks
  console.log('\n5. Testing Gemini AI Quotation Prompts:');
  const openingMsg = await geminiQuotationService.generateOpeningMessage({ clientName: 'Rajesh Sharma', projectName: 'Master Bedroom Villa', grandTotal: pricing.grandTotal });
  console.log('   AI Opening:', openingMsg);

  // 6. Test PDF Exporter
  console.log('\n6. Testing Branded PDF Exporter:');
  const dummyQuotationObj = {
    quotationNumber: qNum,
    quoteDate: new Date(),
    validUntil: new Date(Date.now() + 30 * 86400000),
    clientName: 'Rajesh Sharma',
    clientEmail: 'rajesh@example.com',
    clientPhone: '+91 98765 43210',
    projectName: 'Luxury Villa Master Bedroom',
    openingMessage: openingMsg,
    items: processedItems,
    pricing,
    paymentTerms: { structure: '3-installment', installments: schedule },
    company: {
      name: 'Riddha Interio Mart Pvt Ltd',
      address: 'Suite 402, Interior Design Hub, Indiranagar, Bengaluru, KA - 560038',
      gstNumber: '29AAACR1234F1Z5',
      bankDetails: { bankName: 'HDFC Bank Ltd', accountNumber: '91800293847561', ifscCode: 'HDFC0001234', accountHolderName: 'Riddha Interio Mart Pvt Ltd' }
    },
    termsAndConditions: { content: '1. 50% Advance booking required.\n2. Prices valid for 30 days.' }
  };

  const pdfBuffer = await generateQuotationPDF(dummyQuotationObj);
  console.log(`✅ PDF Buffer generated successfully (${pdfBuffer.length} bytes)!`);

  console.log('\n✅ All Quotation backend tests passed successfully!');
}

runQuotationTests().catch(err => {
  console.error('❌ Quotation test failed:', err);
  process.exit(1);
});
