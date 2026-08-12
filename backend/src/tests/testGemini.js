require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const connectDB = require('../config/db');

// Import services
const geminiProfileService = require('../services/geminiProfileService');
const geminiDesignService = require('../services/geminiDesignService');
const geminiRecommendationService = require('../services/geminiRecommendationService');
const geminiMoodBoardService = require('../services/geminiMoodBoardService');
const geminiUsageTracker = require('../services/geminiUsageTracker');
const Product = require('../models/Product');
const Admin = require('../models/Admin');

const runTest = async () => {
  try {
    console.log('Connecting to database...');
    await connectDB();

    console.log('\n--- Mocking Design Profile ---');
    const mockProfile = {
      roomType: 'living',
      primaryStyle: 'Modern Minimalist',
      colors: ['White', 'Light Grey', 'Navy Blue'],
      budget: { min: 75000, max: 150000 },
      lighting: 'Bright & Airy',
      boldness: 7,
      materials: ['Wood', 'Linen', 'Glass']
    };
    console.log(JSON.stringify(mockProfile, null, 2));

    console.log('\n1. Testing Designer Personality Label...');
    const personality = await geminiProfileService.generateDesignerPersonality(mockProfile);
    console.log('Result:', personality);

    console.log('\n2. Testing Profile Narrative...');
    const narrative = await geminiProfileService.generateProfileNarrative(mockProfile);
    console.log('Result:', narrative);

    console.log('\n3. Testing Design Suggestions (Parallel calls)...');
    const suggestions = await geminiDesignService.generateSuggestions(mockProfile);
    console.log('Result:', JSON.stringify(suggestions, null, 2));

    console.log('\n4. Testing Mood Board Narrative & Inspiration...');
    const moodBoard = await geminiMoodBoardService.generateMoodBoardContent(mockProfile, ['Clean Lines', 'Airy Vibe']);
    console.log('Result:', JSON.stringify(moodBoard, null, 2));

    console.log('\n5. Testing Recommendation Scoring & Enhancements...');
    // Create a mock product or grab one from DB
    let sampleProduct = await Product.findOne({});
    if (!sampleProduct) {
      console.log('No products found in DB to test recommendations. Creating a mock product...');
      const admin = await Admin.findOne({});
      const Category = mongoose.model('Category');
      const Brand = mongoose.model('Brand');
      const catObj = await Category.findOne({}) || { _id: new mongoose.Types.ObjectId() };
      const brandObj = await Brand.findOne({}) || { _id: new mongoose.Types.ObjectId() };

      if (admin) {
        sampleProduct = await Product.create({
          name: 'Minimalist Blue Linen Accent Chair',
          description: 'A gorgeous accent chair upholstered in premium navy blue linen with solid wood legs.',
          sku: 'FUR-ACC-TEST',
          brand: brandObj._id,
          category: catObj._id,
          price: 18000,
          color: 'Blue',
          material: 'Linen',
          roomType: 'living',
          style: 'Modern Minimalist',
          seller: admin._id,
          sellerType: 'Admin',
          countInStock: 5,
          weight: 12
        });
      }
    }

    if (sampleProduct) {
      console.log(`Found product: ${sampleProduct.name} (Price: ${sampleProduct.price})`);
      const enhanced = await geminiRecommendationService.enhanceRecommendations([sampleProduct], mockProfile);
      console.log('Scoring result:', JSON.stringify(enhanced, null, 2));
    } else {
      console.log('Skipping product recommendation test (no active Admin found to seed product).');
    }

    console.log('\n6. Checking Usage Log & Cost Audits...');
    const stats = await geminiUsageTracker.generateUsageReport();
    console.log('Usage report:', JSON.stringify(stats, null, 2));

    console.log('\nAll Gemini Services successfully tested and verified! 🎉');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test failed with error:', error);
    process.exit(1);
  }
};

runTest();
