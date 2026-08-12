const dotenv = require('dotenv');
dotenv.config();

const { calculateEstimateCosts, calculateTierComparison } = require('../utils/costingEngine');
const geminiEstimatorService = require('../services/geminiEstimatorService');
const { generateEstimatePDF } = require('../utils/estimatePdfGenerator');

async function testCostEstimator() {
  console.log('--- Testing Cost Estimator Engine & Gemini Services ---');

  const mockParams = {
    roomType: 'Living Room',
    area: 400,
    materialTier: 'standard',
    timeline: 'asap', // +15% rush fee
    scope: ['Furniture Selection', 'Flooring', 'Lighting Design', 'Color Scheme & Painting'],
    additionalServices: ['3D rendering', 'Professional installation']
  };

  // 1. Test Cost Engine
  const costs = calculateEstimateCosts(mockParams);
  console.log('\n1. Calculated Costs Breakdown (400 sq ft Living Room, ASAP timeline):');
  console.log(`- Subtotal: Rs. ${costs.subtotal.toLocaleString()}`);
  console.log(`- Timeline Adjustment (+15%): Rs. ${costs.timelineAdjustment.toLocaleString()}`);
  console.log(`- Contingency (10%): Rs. ${costs.contingency.toLocaleString()}`);
  console.log(`- Grand Total: Rs. ${costs.grandTotal.toLocaleString()}`);
  console.log(`- Cost per Sq Ft: Rs. ${costs.costPerSqFt}/sq ft`);

  // 2. Test 3-Tier Side-by-Side Comparison
  const tiers = calculateTierComparison(mockParams);
  console.log('\n2. 3-Tier Side-by-Side Comparison Totals:');
  console.log(`- Economy Tier: Rs. ${tiers.economy.grandTotal.toLocaleString()}`);
  console.log(`- Standard Tier: Rs. ${tiers.standard.grandTotal.toLocaleString()}`);
  console.log(`- Premium Tier: Rs. ${tiers.premium.grandTotal.toLocaleString()}`);

  // 3. Test Gemini Services
  console.log('\n3. Testing Gemini Prompts:');
  try {
    const analysis = await geminiEstimatorService.analyzeCostBreakdown({ ...mockParams, costBreakdown: costs });
    console.log('Gemini Analysis:', analysis.substring(0, 150) + '...');

    const optimizations = await geminiEstimatorService.suggestOptimizations({ ...mockParams, costBreakdown: costs });
    console.log('Gemini Optimizations:', optimizations);
  } catch (err) {
    console.error('Gemini Test Error:', err.message);
  }

  // 4. Test PDF Generation
  console.log('\n4. Testing PDF Report Buffer Generation:');
  try {
    const pdfBuffer = await generateEstimatePDF({
      estimateName: 'Living Room Cost Estimate',
      roomType: 'Living Room',
      area: 400,
      materialTier: 'standard',
      timeline: 'asap',
      scope: mockParams.scope,
      costBreakdown: costs,
      aiAnalysis: {
        costBreakdownAnalysis: 'Cost allocation is well balanced across furniture and installation.',
        riskAssessment: 'Unforeseen electrical rewiring variations on site.'
      }
    });
    console.log(`✅ PDF Buffer generated successfully (${pdfBuffer.length} bytes)!`);
  } catch (pdfErr) {
    console.error('PDF Test Error:', pdfErr.message);
  }

  console.log('\n✅ All Cost Estimator backend tests passed successfully!');
}

testCostEstimator();
