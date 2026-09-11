const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const User = require('../src/models/User');
const Admin = require('../src/models/Admin');
const Seller = require('../src/models/Seller');
const Delivery = require('../src/models/Delivery');

async function findUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const email = 'sheetalchouhan689@gmail.com';
    const regex = new RegExp(email, 'i');

    const users = await User.find({ email: regex });
    const admins = await Admin.find({ email: regex });
    const sellers = await Seller.find({ email: regex });
    const deliveries = await Delivery.find({ email: regex });

    console.log('--- FIND EMAIL RESULTS ---');
    console.log('Users found:', users.map(u => ({ id: u._id, email: u.email, userType: u.userType, isVerified: u.isEmailVerified })));
    console.log('Admins found:', admins.map(a => ({ id: a._id, email: a.email, isVerified: a.isEmailVerified })));
    console.log('Sellers found:', sellers.map(s => ({ id: s._id, email: s.email, isVerified: s.isEmailVerified })));
    console.log('Deliveries found:', deliveries.map(d => ({ id: d._id, email: d.email, isVerified: d.isEmailVerified })));

    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

findUser();
