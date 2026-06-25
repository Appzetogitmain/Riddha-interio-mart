const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Catalog = require('./src/models/Catalog');

async function check() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB.');

    // Fetch the 15 most recently created catalogs
    const catalogs = await Catalog.find({})
      .sort({ createdAt: -1 })
      .limit(15);

    console.log(`Found ${catalogs.length} recently uploaded catalogs:\n`);
    catalogs.forEach((c, idx) => {
      console.log(`${idx + 1}. Name: ${c.name}`);
      console.log(`   SKU: ${c.sku}`);
      console.log(`   Price: ₹${c.price}`);
      console.log(`   Stock: ${c.stock}`);
      console.log(`   Category: ${c.category}`);
      console.log(`   Brand ID: ${c.brand}`);
      console.log(`   Images: ${c.images.join(', ')}`);
      console.log(`   Material: ${c.material || 'N/A'}`);
      console.log(`   Dimensions: ${c.dimensions || 'N/A'}`);
      console.log(`   CreatedAt: ${c.createdAt}`);
      console.log('----------------------------------------------------');
    });

  } catch (error) {
    console.error('Error checking catalogs:', error);
  } finally {
    await mongoose.disconnect();
  }
}

check();
