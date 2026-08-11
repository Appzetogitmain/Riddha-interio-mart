const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const connectDB = require('../src/config/db');
const Admin = require('../src/models/Admin');
const tokenService = require('../src/utils/tokenService');

async function run() {
  await connectDB();
  const admin = await Admin.create({
    fullName: 'Temp Smoke Test Admin',
    email: `smoke-admin-${Date.now()}@example.com`,
    password: 'temporarypassword123'
  });
  const token = tokenService.generateAccessToken(admin._id, 'admin');
  console.log(JSON.stringify({ id: admin._id.toString(), token }));
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
