const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const connectDB = require('../src/config/db');

const Product = require('../src/models/Product');
const Admin = require('../src/models/Admin');
const Bundle = require('../src/models/Bundle');

const {
  createBundle,
  updateBundle,
  deleteBundle,
  getBundle
} = require('../src/controllers/bundleController');

function createMockResponse() {
  const res = {
    statusCode: 200,
    jsonData: null,
    status(code) { this.statusCode = code; return this; },
    json(data) { this.jsonData = data; return this; }
  };
  return res;
}

async function run() {
  await connectDB();
  console.log('Connected.');

  const products = await Product.find({ isBundle: { $ne: true }, isActive: true, isApproved: true }).limit(2);
  if (products.length < 2) throw new Error('Need at least 2 real products to test with');

  const admin = await Admin.create({
    fullName: 'Bundle Test Admin (temp)',
    email: `bundle-test-${Date.now()}@example.com`,
    password: 'temporarypassword'
  });

  let bundleId, virtualProductId;

  try {
    // 1. Create
    const req1 = {
      body: {
        name: 'Test Smart Bundle',
        description: 'Temporary test bundle',
        products: [
          { productId: products[0]._id.toString(), quantity: 1 },
          { productId: products[1]._id.toString(), quantity: 2 }
        ],
        bundlePrice: Math.max(1, Math.round((products[0].price + products[1].price * 2) * 0.8))
      },
      user: admin
    };
    const res1 = createMockResponse();
    await createBundle(req1, res1);
    console.log('CREATE status:', res1.statusCode);
    console.log('CREATE body:', JSON.stringify(res1.jsonData, null, 2));
    if (res1.statusCode !== 201) throw new Error('Bundle creation failed');

    bundleId = res1.jsonData.data._id;
    virtualProductId = res1.jsonData.data.virtualProduct?._id || res1.jsonData.data.virtualProduct;

    const virtualProduct = await Product.findById(virtualProductId);
    console.log('\nVirtual product synced:', {
      name: virtualProduct.name,
      price: virtualProduct.price,
      isBundle: virtualProduct.isBundle,
      bundleRef: virtualProduct.bundleRef?.toString(),
      countInStock: virtualProduct.countInStock,
      isActive: virtualProduct.isActive,
      isApproved: virtualProduct.isApproved
    });

    if (!virtualProduct.isBundle) throw new Error('Virtual product isBundle flag not set');
    if (String(virtualProduct.bundleRef) !== String(bundleId)) throw new Error('Virtual product bundleRef mismatch');
    if (virtualProduct.price !== req1.body.bundlePrice) throw new Error('Virtual product price mismatch');

    // 2. Get by id (also exercises populate + view counter)
    const req2 = { params: { id: bundleId } };
    const res2 = createMockResponse();
    await getBundle(req2, res2);
    console.log('\nGET status:', res2.statusCode, '- products populated:', res2.jsonData.data.products.length);

    // 3. Update price
    const req3 = { params: { id: bundleId }, body: { bundlePrice: req1.body.bundlePrice - 10 }, user: admin };
    const res3 = createMockResponse();
    await updateBundle(req3, res3);
    console.log('\nUPDATE status:', res3.statusCode, '- new bundlePrice:', res3.jsonData.data.bundlePrice, '- discount%:', res3.jsonData.data.discountPercentage);
    const updatedVirtual = await Product.findById(virtualProductId);
    if (updatedVirtual.price !== req3.body.bundlePrice) throw new Error('Virtual product price not re-synced on update');
    console.log('Virtual product price re-synced correctly:', updatedVirtual.price);

    // 4. Delete
    const req4 = { params: { id: bundleId } };
    const res4 = createMockResponse();
    await deleteBundle(req4, res4);
    console.log('\nDELETE status:', res4.statusCode, res4.jsonData);

    const bundleAfterDelete = await Bundle.findById(bundleId);
    const virtualAfterDelete = await Product.findById(virtualProductId);
    console.log('Bundle doc gone:', bundleAfterDelete === null);
    console.log('Virtual product deactivated (not deleted):', virtualAfterDelete && virtualAfterDelete.isActive === false);

    console.log('\nALL BUNDLE FLOW ASSERTIONS PASSED');
  } finally {
    // Cleanup: remove all temp test data regardless of outcome
    if (virtualProductId) await Product.findByIdAndDelete(virtualProductId).catch(() => {});
    if (bundleId) await Bundle.findByIdAndDelete(bundleId).catch(() => {});
    await Admin.findByIdAndDelete(admin._id).catch(() => {});
    console.log('\nCleaned up temp admin/bundle/virtual product.');
    await mongoose.disconnect();
  }
}

run().catch((err) => {
  console.error('TEST FAILED:', err);
  process.exit(1);
});
