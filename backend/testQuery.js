const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('./src/models/Product');
// Mock seller model to ensure it loads
require('./src/models/Seller');
require('./src/models/Admin');

dotenv.config();

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  try {
    const products = await Product.find({
      isAdvertised: true,
      advertisementEndDate: { $gt: new Date() },
      isApproved: true,
      isActive: true
    }).populate('seller', 'shopName')
      .select('name images price rating numReviews countInStock discountPrice isAdvertised')
      .limit(20);
    console.log('Success! Found:', products.length);
  } catch (err) {
    console.error('Error:', err.name, err.message);
  }
  
  process.exit();
};

run();
