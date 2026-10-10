const path = require('path');
const dotenv = require(path.join(__dirname, 'backend/node_modules/dotenv'));
dotenv.config({ path: path.join(__dirname, 'backend/.env') });

const connectDB = require(path.join(__dirname, 'backend/src/config/db'));
const mongoose = require(path.join(__dirname, 'backend/node_modules/mongoose'));

const run = async () => {
  await connectDB();
  const User = require(path.join(__dirname, 'backend/src/models/User'));
  const Order = require(path.join(__dirname, 'backend/src/models/Order'));

  const users = await User.find({}, '_id fullName email phone role').lean();
  console.log('All Users in User collection (count ' + users.length + '):');
  console.log(JSON.stringify(users, null, 2));

  const order = await Order.findById('6ac79babcfb54cdf14176542').lean();
  console.log('\nOrder user field:', order.user);
  console.log('Order shipping address:', order.shippingAddress);

  process.exit(0);
};

run();
