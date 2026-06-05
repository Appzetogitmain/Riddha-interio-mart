const mongoose = require('mongoose');
require('dotenv').config();
const Admin = require('../src/models/Admin');

const seedAdmin = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      console.error('MONGODB_URI is not set in environment variables.');
      process.exit(1);
    }
    
    console.log('Connecting to MongoDB...');
    await mongoose.connect(uri);
    console.log('Connected successfully.');

    const email = 'riddhamart@gmail.com';
    const password = '123456';

    console.log(`Checking if admin with email "${email}" exists...`);
    let admin = await Admin.findOne({ email });

    if (admin) {
      console.log('Admin already exists. Updating password and details...');
      admin.password = password;
      admin.fullName = 'Riddha Admin';
      admin.type = 'superadmin';
      await admin.save();
      console.log('Admin updated successfully.');
    } else {
      console.log('Admin does not exist. Creating new admin...');
      admin = await Admin.create({
        fullName: 'Riddha Admin',
        email: email,
        password: password,
        type: 'superadmin'
      });
      console.log('Admin created successfully.');
    }

    console.log('Seed process completed.');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin:', error);
    process.exit(1);
  }
};

seedAdmin();
