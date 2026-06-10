const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");
    const Seller = mongoose.model('Seller', new mongoose.Schema({}, { strict: false }));
    const sellers = await Seller.find();
    console.log(`Total sellers: ${sellers.length}`);
    for (const s of sellers) {
      console.log(`- ID: ${s._id}, Name: ${s.fullName}, Shop: ${s.shopName}, Verified: ${s.isVerified}, Status: ${s.status}`);
    }
    await mongoose.connection.close();
  } catch (err) {
    console.error(err);
  }
};

run();
