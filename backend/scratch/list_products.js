const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Product = require('../src/models/Product');

async function listProducts() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const products = await Product.find({}).select('name price discountPrice b2bPrice b2bMinQty sellerType').limit(10);

    console.log('--- PRODUCT PRICING LIST ---');
    console.log(JSON.stringify(products, null, 2));

    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

listProducts();
