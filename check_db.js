const mongoose = require('mongoose');

async function checkProduct() {
  try {
    await mongoose.connect('mongodb://localhost:27017/riddha-interio-mart');
    const Product = require('../backend/src/models/Product');
    const User = require('../backend/src/models/User');
    
    const latestProduct = await Product.findOne().sort({ createdAt: -1 });
    console.log("Latest Product:", {
      name: latestProduct.name,
      approvalStatus: latestProduct.approvalStatus,
      isApproved: latestProduct.isApproved,
      sellerId: latestProduct.seller,
      source: latestProduct.source
    });

    const seller = await User.findById(latestProduct.seller);
    console.log("Seller Info:", {
      name: seller.fullName,
      shopName: seller.shopName,
      role: seller.role
    });

  } catch (err) {
    console.error(err);
  } finally {
    mongoose.disconnect();
  }
}

checkProduct();
