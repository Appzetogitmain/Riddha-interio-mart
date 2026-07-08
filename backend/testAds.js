const mongoose = require('mongoose');
require('dotenv').config();
const Product = require('./src/models/Product');
require('./src/models/Category');
require('./src/models/Brand');
require('./src/models/Seller');
require('./src/models/Admin');

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const ads = await Product.find({ isAdvertised: true });
  console.log('Total advertised:', ads.length);
  ads.forEach(ad => {
    console.log(`Product: ${ad.name}, isApproved: ${ad.isApproved}, isActive: ${ad.isActive}, endDate: ${ad.advertisementEndDate}`);
  });
  process.exit();
};
run();
