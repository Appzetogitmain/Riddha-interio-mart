const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const connectDB = require('../src/config/db');
const Admin = require('../src/models/Admin');
const Product = require('../src/models/Product');
const Bundle = require('../src/models/Bundle');

async function run() {
  await connectDB();

  const orphanBundleProducts = await Product.find({ isBundle: true, name: /Playwright Test Bundle/i });
  for (const p of orphanBundleProducts) {
    console.log('Deleting orphaned virtual product:', p._id.toString(), p.name);
    await Product.findByIdAndDelete(p._id);
  }

  const leftoverBundles = await Bundle.find({ name: /Playwright Test Bundle/i });
  for (const b of leftoverBundles) {
    console.log('Deleting leftover bundle doc:', b._id.toString());
    await Bundle.findByIdAndDelete(b._id);
  }

  const tempAdmins = await Admin.find({ email: { $regex: /^(smoke-admin-|bundle-test-)/ } });
  for (const a of tempAdmins) {
    console.log('Deleting temp admin:', a._id.toString(), a.email);
    await Admin.findByIdAndDelete(a._id);
  }

  console.log('Cleanup complete.');
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
