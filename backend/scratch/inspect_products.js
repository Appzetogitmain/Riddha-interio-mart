const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");
    const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));
    const count = await Product.countDocuments();
    console.log(`Total products in database: ${count}`);
    
    const products = await Product.find().limit(20);
    console.log("Sample products:");
    for (const p of products) {
      console.log(`- ID: ${p._id}, Name: ${p.name}, Seller: ${p.seller}, SKU: ${p.sku}, Images: ${p.images ? p.images.length : 0}`);
    }
    
    await mongoose.connection.close();
  } catch (err) {
    console.error(err);
  }
};

run();
