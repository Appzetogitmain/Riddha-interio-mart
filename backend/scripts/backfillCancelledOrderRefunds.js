/**
 * One-off backfill: credits the customer's wallet for any order that is already
 * Cancelled + was paid online (isPaid: true), but predates the refund-on-cancel fix
 * in orderController.js (updateOrderStatus / respondToNewOrder) — so it never got
 * its refund_credit wallet transaction.
 *
 * Safe to re-run any number of times: walletService.creditUserWallet() is keyed on
 * idempotencyKey `order_refund_<orderId>` (the same key the live code now uses), so
 * an order that already has its credit is skipped automatically, never double-paid.
 *
 * Usage:
 *   node scripts/backfillCancelledOrderRefunds.js            (dry run — reports only)
 *   node scripts/backfillCancelledOrderRefunds.js --apply    (actually writes credits)
 */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const dns = require('dns');

dns.setServers(['8.8.8.8', '8.8.4.4']);
dotenv.config();

const Order = require('../src/models/Order');
const Wallet = require('../src/models/Wallet');
const walletService = require('../src/services/walletService');

const APPLY = process.argv.includes('--apply');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log(`Connected. Mode: ${APPLY ? 'APPLY (writing changes)' : 'DRY RUN (no changes will be made)'}\n`);

  const orders = await Order.find({ status: 'Cancelled', isPaid: true }).lean();
  console.log(`Found ${orders.length} cancelled + paid order(s).\n`);

  let totalRefunded = 0;
  let creditedCount = 0;
  let alreadyCreditedCount = 0;

  for (const order of orders) {
    const shortId = order._id.toString().slice(-8).toUpperCase();
    const idempotencyKey = `order_refund_${order._id}`;

    const wallet = await Wallet.findOne({ user: order.user });
    const alreadyCredited = wallet?.transactions?.some(t => t.idempotencyKey === idempotencyKey);

    if (alreadyCredited) {
      console.log(`[already credited] #${shortId} — skipping`);
      alreadyCreditedCount++;
      continue;
    }

    if (!APPLY) {
      console.log(`[would credit] #${shortId} — ₹${order.totalPrice} to user ${order.user}`);
      totalRefunded += order.totalPrice;
      continue;
    }

    try {
      await walletService.creditUserWallet(
        order.user,
        order.totalPrice,
        'refund_credit',
        `Refund for cancelled Order #${shortId}`,
        order._id,
        idempotencyKey
      );
      await walletService.reversePendingSale(order._id);
      console.log(`[credited] #${shortId} — ₹${order.totalPrice} to user ${order.user}`);
      totalRefunded += order.totalPrice;
      creditedCount++;
    } catch (err) {
      console.error(`[ERROR] #${shortId}:`, err.message);
    }
  }

  console.log('\n---');
  if (APPLY) {
    console.log(`Credited ${creditedCount} order(s), ₹${totalRefunded} total. ${alreadyCreditedCount} were already credited.`);
  } else {
    console.log(`Would credit ₹${totalRefunded} across ${orders.length - alreadyCreditedCount} order(s) (${alreadyCreditedCount} already credited). Re-run with --apply to actually write.`);
  }

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('Backfill failed:', err);
  process.exit(1);
});
