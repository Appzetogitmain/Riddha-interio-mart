/**
 * Costing Calculation Engine for Riddha Interio Mart
 */

// Base rates per sq ft for room types
const BASE_ROOM_RATES = {
  'Living Room': 500,
  'Bedroom': 400,
  'Kitchen': 1000,
  'Dining Room': 450,
  'Office': 400,
  'Bathroom': 750,
  'Other': 450
};

// Material Tier Multipliers
const TIER_MULTIPLIERS = {
  economy: 0.7,
  standard: 1.0,
  premium: 1.6
};

// Timeline Urgency Factors
const TIMELINE_FACTORS = {
  'asap': 0.15,       // +15% rush fee
  'soon': 0.0,        // standard
  'flexible': -0.10,  // -10% discount
  'no-hurry': -0.15   // -15% discount
};

// Additional Services Flat Costs
const ADDITIONAL_SERVICE_COSTS = {
  'Professional installation': 8000,
  'Furniture disposal': 4000,
  '3D rendering': 10000,
  'Color consultation': 3000,
  'Material sampling': 3000,
  'Site visits': 4000
};

/**
 * Calculates itemized costs for a single project specification
 */
const calculateEstimateCosts = (params) => {
  const area = Number(params.area) > 0 ? Number(params.area) : 400;
  const roomType = params.roomType || 'Living Room';
  const tier = params.materialTier || 'standard';
  const timeline = params.timeline || 'soon';
  const scope = Array.isArray(params.scope) ? params.scope : [];
  const additionalServices = Array.isArray(params.additionalServices) ? params.additionalServices : [];

  const tierMultiplier = TIER_MULTIPLIERS[tier] || 1.0;
  const roomBaseRate = BASE_ROOM_RATES[roomType] || 450;

  // 1. Furniture Cost
  let furniture = 0;
  if (scope.length === 0 || scope.includes('Furniture Selection') || scope.includes('Custom Built-ins')) {
    const furnitureScopeFactor = scope.includes('Custom Built-ins') ? 1.4 : 1.0;
    furniture = Math.round(area * roomBaseRate * tierMultiplier * furnitureScopeFactor);
  }

  // 2. Flooring Cost
  let flooring = 0;
  if (scope.includes('Flooring')) {
    const flooringBasePerSqFt = tier === 'economy' ? 65 : tier === 'standard' ? 180 : 450;
    flooring = Math.round(area * flooringBasePerSqFt);
  }

  // 3. Lighting Cost
  let lighting = 0;
  if (scope.includes('Lighting Design')) {
    const fixturesCount = Math.max(2, Math.ceil(area / 50));
    const perFixtureCost = tier === 'economy' ? 2500 : tier === 'standard' ? 5500 : 12000;
    lighting = Math.round(6000 * tierMultiplier + (fixturesCount * perFixtureCost));
  }

  // 4. Decor & Accessories
  let decor = 0;
  if (scope.includes('Decor & Accessories') || scope.includes('Space Layout/Reorganization')) {
    const decorPerSqFt = tier === 'economy' ? 25 : tier === 'standard' ? 40 : 85;
    decor = Math.round(10000 * tierMultiplier + (area * decorPerSqFt));
  }

  // 5. Paint & Wall Treatment
  let paint = 0;
  if (scope.includes('Color Scheme & Painting') || scope.includes('Wall Treatment (Wallpaper, panels, etc.)')) {
    const wallArea = area * 3; // Estimated wall area multiplier
    const wallRatePerSqFt = scope.includes('Wall Treatment (Wallpaper, panels, etc.)') ? 75 : 40;
    paint = Math.round(wallArea * wallRatePerSqFt * tierMultiplier);
  }

  // 6. Labor & Installation
  const baseLabor = 18000;
  const laborPerSqFt = tier === 'economy' ? 50 : tier === 'standard' ? 90 : 140;
  const labor = Math.round((baseLabor + (area * laborPerSqFt)) * tierMultiplier);

  // 7. Additional Services
  let addServicesTotal = 0;
  additionalServices.forEach(service => {
    if (ADDITIONAL_SERVICE_COSTS[service]) {
      addServicesTotal += ADDITIONAL_SERVICE_COSTS[service];
    } else {
      addServicesTotal += 5000;
    }
  });

  // Subtotal
  const subtotal = furniture + flooring + lighting + decor + paint + labor + addServicesTotal;

  // Timeline Urgency Adjustment
  const timelineAdjustmentRate = TIMELINE_FACTORS[timeline] || 0.0;
  const timelineAdjustment = Math.round(subtotal * timelineAdjustmentRate);

  // Contingency (10%)
  const contingency = Math.round((subtotal + timelineAdjustment) * 0.10);

  // Grand Total
  const grandTotal = subtotal + timelineAdjustment + contingency;
  const costPerSqFt = Math.round(grandTotal / area);

  return {
    furniture,
    flooring,
    lighting,
    decor,
    paint,
    labor,
    additionalServices: addServicesTotal,
    subtotal,
    timelineAdjustment,
    contingency,
    grandTotal,
    costPerSqFt
  };
};

/**
 * Calculates 3-tier side-by-side totals (Economy vs Standard vs Premium)
 */
const calculateTierComparison = (params) => {
  const economyBreakdown = calculateEstimateCosts({ ...params, materialTier: 'economy' });
  const standardBreakdown = calculateEstimateCosts({ ...params, materialTier: 'standard' });
  const premiumBreakdown = calculateEstimateCosts({ ...params, materialTier: 'premium' });

  return {
    economy: economyBreakdown,
    standard: standardBreakdown,
    premium: premiumBreakdown
  };
};

module.exports = {
  calculateEstimateCosts,
  calculateTierComparison,
  BASE_ROOM_RATES,
  TIER_MULTIPLIERS,
  TIMELINE_FACTORS,
  ADDITIONAL_SERVICE_COSTS
};
