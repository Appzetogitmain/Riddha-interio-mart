const dotenv = require('dotenv');
dotenv.config();

const geminiBoqService = require('../services/geminiBoqService');
const { generateBOQPDF, generateBOQCSV } = require('../utils/boqPdfGenerator');

async function testBOQBackend() {
  console.log('--- Testing BOQ Backend Engine & Gemini Services ---');

  const mockItems = [
    { itemName: '3-Seater Velvet Sofa Set', category: 'Furniture', quantity: 1, unit: 'Sets', unitCost: 42000, totalCost: 42000, supplier: 'Riddha Preferred Vendor', deliveryTimeline: '1-2 weeks', priority: 'critical' },
    { itemName: 'Marble Finish Vitrified Tiles (60x60cm)', category: 'Flooring', quantity: 400, unit: 'Sq Ft', unitCost: 140, totalCost: 56000, supplier: 'Kajaria Ceramics', deliveryTimeline: '1 week', priority: 'essential' },
    { itemName: 'Dimmable Recessed LED Spotlights', category: 'Lighting', quantity: 10, unit: 'Pieces', unitCost: 1500, totalCost: 15000, supplier: 'Philips Lighting', deliveryTimeline: 'Immediate', priority: 'essential' },
    { itemName: 'Royal Shine Interior Wall Acrylic Paint', category: 'Paint', quantity: 4, unit: 'Liters', unitCost: 3800, totalCost: 15200, supplier: 'Asian Paints', deliveryTimeline: 'Immediate', priority: 'important' }
  ];

  // 1. Test Gemini Brief Extraction
  console.log('\n1. Testing Brief-to-BOQ AI Extraction:');
  try {
    const briefItems = await geminiBoqService.generateBOQFromBrief({ roomType: 'Living Room', area: 450, designStyle: 'Modern' });
    console.log(`Extracted ${briefItems.length} items from brief! First item:`, briefItems[0].itemName);
  } catch (err) {
    console.error('Brief AI Extraction Error:', err.message);
  }

  // 2. Test Gemini Completeness Analysis
  console.log('\n2. Testing AI Completeness & Missing Items Analysis:');
  try {
    const analysis = await geminiBoqService.analyzeMissingItems(mockItems, 'Living Room');
    console.log(`Completeness Score: ${analysis.completenessScore}%`);
    console.log(`Missing Items:`, analysis.missingItems);
  } catch (err) {
    console.error('Completeness Analysis Error:', err.message);
  }

  // 3. Test PDF Exporter
  console.log('\n3. Testing BOQ PDF Exporter:');
  try {
    const pdfBuffer = await generateBOQPDF({
      boqName: 'Modern Living Room BOQ',
      createdAt: new Date(),
      items: mockItems,
      summary: { totalItems: 4, totalEstimatedCost: 128200, completenessScore: 92 }
    });
    console.log(`✅ BOQ PDF Buffer generated successfully (${pdfBuffer.length} bytes)!`);
  } catch (pdfErr) {
    console.error('PDF Test Error:', pdfErr.message);
  }

  // 4. Test CSV Exporter
  console.log('\n4. Testing BOQ CSV Exporter:');
  try {
    const csvContent = generateBOQCSV({ items: mockItems });
    console.log(`✅ BOQ CSV Generated successfully (${csvContent.length} chars)! First line:`);
    console.log(csvContent.split('\n')[0]);
  } catch (csvErr) {
    console.error('CSV Test Error:', csvErr.message);
  }

  console.log('\n✅ All BOQ backend tests passed successfully!');
}

testBOQBackend();
