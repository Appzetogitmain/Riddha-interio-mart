/**
 * Verification script for the delivery ETA + in-app invoice changes:
 * Path: backend/scratch/test_delivery_eta_invoice.js
 *
 * Validates, against the real DB, using a fully synthetic/throwaway Order (fabricated ObjectIds
 * for user/seller/deliveryBoy so no real customer is looked up or emailed):
 * 1. updateSellerManagedDeliveryStatus sets deliveryTimeline.expectedDeliveryTime from real
 *    haversine distance when transitioning to "Out for Delivery".
 * 2. updateOrderStatus (in-app delivery path) does the same.
 * 3. downloadCustomerInvoice's auth check now allows the assigned delivery partner (no 403).
 *
 * The order document is deleted at the end regardless of outcome.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../src/config/db');
const Order = require('../src/models/Order');
const orderController = require('../src/controllers/orderController');
const invoiceController = require('../src/controllers/invoiceController');
const filterService = require('../src/services/filterService');

const mockResponse = () => {
  const res = {};
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (data) => { res.body = data; return res; };
  res.send = (data) => { res.body = data; return res; };
  res.setHeader = () => {};
  return res;
};

// Jaipur seller vs. a point ~6km away — realistic local-delivery distance.
const SELLER_COORDS = { latitude: 26.9124, longitude: 75.7873 };
const SHIPPING_COORDS = { latitude: 26.9550, longitude: 75.8200 };

const buildBaseOrder = (overrides = {}) => ({
  user: new mongoose.Types.ObjectId(), // fabricated — no real customer, OTP email lookup will just no-op
  seller: overrides.sellerId,
  sellerType: 'Seller',
  orderItems: [{
    name: 'Test Marble Slab',
    quantity: 1,
    image: 'https://example.com/image.jpg',
    price: 1000,
    product: new mongoose.Types.ObjectId(),
    seller: overrides.sellerId,
    sellerType: 'Seller'
  }],
  shippingAddress: {
    fullName: 'Test Customer',
    mobileNumber: '9999999999',
    pincode: '302001',
    city: 'Jaipur',
    fullAddress: 'Test Address, Jaipur'
  },
  paymentMethod: 'COD',
  totalPrice: 1000,
  status: 'Processing',
  sellerCoordinates: SELLER_COORDS,
  shippingCoordinates: SHIPPING_COORDS,
  ...overrides
});

const runTests = async () => {
  let exitCode = 0;
  const createdOrderIds = [];

  console.log('================================================================');
  console.log('⚡ DELIVERY ETA + IN-APP INVOICE VERIFICATION ⚡');
  console.log('================================================================');

  try {
    console.log('\n[SETUP] Connecting to MongoDB...');
    await connectDB();
    console.log('Connected.');

    // ------------------------------------------------------------------
    // TEST 0: raw haversine sanity check on the two fixture coordinates
    // ------------------------------------------------------------------
    const rawDistanceKm = filterService.calculateDistance(
      [SELLER_COORDS.longitude, SELLER_COORDS.latitude],
      [SHIPPING_COORDS.longitude, SHIPPING_COORDS.latitude]
    );
    console.log(`\n[TEST 0] Raw haversine distance between fixture coords: ${rawDistanceKm} km`);
    if (typeof rawDistanceKm === 'number' && rawDistanceKm > 0 && rawDistanceKm < 50) {
      console.log('✅ PASS: Distance is a sane positive number for two nearby Jaipur points.');
    } else {
      console.error('❌ FAIL: Unexpected distance value.');
      exitCode = 1;
    }

    // ------------------------------------------------------------------
    // TEST 1: self-managed "Out for Delivery" -> deliveryTimeline populated
    // ------------------------------------------------------------------
    console.log('\n[TEST 1] Seller-managed delivery: Picked -> Out for Delivery...');
    const sellerId = new mongoose.Types.ObjectId();
    const order1 = await new Order(buildBaseOrder({
      sellerId,
      deliveryType: 'seller-managed',
      deliveryStatus: 'Picked',
      pickupProofImages: ['https://example.com/proof.jpg']
    })).save({ validateBeforeSave: false });
    createdOrderIds.push(order1._id);

    const req1 = { params: { id: order1._id.toString() }, user: { role: 'seller', id: sellerId.toString() }, body: { status: 'Out for Delivery' } };
    const res1 = mockResponse();
    await orderController.updateSellerManagedDeliveryStatus(req1, res1);

    const eta1 = res1.body?.data?.deliveryTimeline?.expectedDeliveryTime;
    const outAt1 = res1.body?.data?.deliveryTimeline?.outForDeliveryAt;
    console.log(`  status=${res1.statusCode} deliveryStatus=${res1.body?.data?.deliveryStatus} expectedDeliveryTime=${eta1} outForDeliveryAt=${outAt1}`);
    if (res1.statusCode === 200 && eta1 && outAt1) {
      const minutesFromNow = Math.round((new Date(eta1).getTime() - Date.now()) / 60000);
      const expectedMinutes = Math.max(10, Math.round(rawDistanceKm * 6));
      console.log(`  ETA is ~${minutesFromNow} min from now (expected ~${expectedMinutes} min from the ${rawDistanceKm}km distance).`);
      if (Math.abs(minutesFromNow - expectedMinutes) <= 1) {
        console.log('✅ PASS: deliveryTimeline.expectedDeliveryTime matches the distance-based formula.');
      } else {
        console.error('❌ FAIL: ETA minutes do not match expected distance-based formula.');
        exitCode = 1;
      }
    } else {
      console.error('❌ FAIL: deliveryTimeline was not populated on seller-managed Out for Delivery.');
      exitCode = 1;
    }

    // ------------------------------------------------------------------
    // TEST 2: in-app delivery "Out for Delivery" -> deliveryTimeline populated
    // ------------------------------------------------------------------
    console.log('\n[TEST 2] In-app delivery: Picked -> Out for Delivery...');
    const sellerId2 = new mongoose.Types.ObjectId();
    const deliveryBoyId = new mongoose.Types.ObjectId();
    const order2 = await new Order(buildBaseOrder({
      sellerId: sellerId2,
      deliveryType: 'in-app',
      deliveryBoy: deliveryBoyId,
      deliveryStatus: 'Picked',
      status: 'Shipped'
    })).save({ validateBeforeSave: false });
    createdOrderIds.push(order2._id);

    const req2 = { params: { id: order2._id.toString() }, user: { role: 'delivery', id: deliveryBoyId.toString() }, body: { status: 'Out for Delivery' } };
    const res2 = mockResponse();
    await orderController.updateOrderStatus(req2, res2);

    const eta2 = res2.body?.data?.deliveryTimeline?.expectedDeliveryTime;
    console.log(`  status=${res2.statusCode} deliveryStatus=${res2.body?.data?.deliveryStatus} expectedDeliveryTime=${eta2}`);
    if (res2.statusCode === 200 && eta2) {
      console.log('✅ PASS: deliveryTimeline.expectedDeliveryTime populated on in-app Out for Delivery.');
    } else {
      console.error('❌ FAIL: deliveryTimeline was not populated on in-app Out for Delivery.');
      exitCode = 1;
    }

    // ------------------------------------------------------------------
    // TEST 3: assigned delivery partner is no longer 403'd on the customer invoice route
    // ------------------------------------------------------------------
    console.log('\n[TEST 3] Assigned delivery partner requesting the customer invoice...');
    const req3 = { params: { id: order2._id.toString() }, user: { role: 'delivery', id: deliveryBoyId.toString() } };
    const res3 = mockResponse();
    try {
      await invoiceController.downloadCustomerInvoice(req3, res3);
    } catch (e) {
      // PDF generation may fail on this synthetic order (no real Seller/SystemSettings doc) —
      // that's fine, we only care that the AUTH gate didn't reject it with 403.
      console.log(`  (PDF generation threw downstream, as expected for a synthetic order: ${e.message})`);
    }
    console.log(`  status=${res3.statusCode}`);
    if (res3.statusCode !== 403) {
      console.log('✅ PASS: Assigned delivery partner is not blocked by the auth check (was 403 before this change).');
    } else {
      console.error('❌ FAIL: Assigned delivery partner still gets 403 on the customer invoice route.');
      exitCode = 1;
    }

    // Sanity: an unrelated delivery partner (not assigned to this order) should still be blocked.
    console.log('\n[TEST 3b] Unrelated delivery partner requesting the same invoice (should stay blocked)...');
    const req3b = { params: { id: order2._id.toString() }, user: { role: 'delivery', id: new mongoose.Types.ObjectId().toString() } };
    const res3b = mockResponse();
    await invoiceController.downloadCustomerInvoice(req3b, res3b);
    console.log(`  status=${res3b.statusCode}`);
    if (res3b.statusCode === 403) {
      console.log('✅ PASS: Unassigned delivery partner is correctly still blocked.');
    } else {
      console.error('❌ FAIL: Unassigned delivery partner was NOT blocked — auth check is too permissive!');
      exitCode = 1;
    }

  } catch (err) {
    console.error('💥 CRITICAL RUNTIME ERROR:', err);
    exitCode = 1;
  } finally {
    if (createdOrderIds.length) {
      await Order.deleteMany({ _id: { $in: createdOrderIds } });
      console.log(`\n[CLEANUP] Deleted ${createdOrderIds.length} synthetic test order(s).`);
    }
    await mongoose.connection.close();
    console.log('================================================================');
    console.log(`🏁 FINISHED WITH EXIT CODE: ${exitCode} 🏁`);
    console.log('================================================================');
    process.exit(exitCode);
  }
};

runTests();
