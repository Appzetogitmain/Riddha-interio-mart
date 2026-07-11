const mongoose = require('mongoose');
const Wallet = require('../models/Wallet');
const SellerWallet = require('../models/SellerWallet');
const DeliveryWallet = require('../models/DeliveryWallet');
const SellerPayout = require('../models/SellerPayout');
const DeliverySettlement = require('../models/DeliverySettlement');
const Seller = require('../models/Seller');
const SystemSettings = require('../models/SystemSettings');

/**
 * Robust execution wrapper supporting Mongoose atomic sessions
 * with automatic fallback for standalone single-node local Mongo instances.
 */
const executeInTransaction = async (operation) => {
  const MAX_RETRIES = 5;
  let attempt = 0;

  while (attempt < MAX_RETRIES) {
    attempt++;
    const session = await mongoose.startSession();
    try {
      session.startTransaction();
      const result = await operation(session);
      await session.commitTransaction();
      return result;
    } catch (err) {
      await session.abortTransaction();

      // Check if it's a transient transaction error (e.g., WriteConflict)
      const isTransient = err.errorLabels && err.errorLabels.includes('TransientTransactionError');
      if (isTransient && attempt < MAX_RETRIES) {
        console.warn(`[FINTECH WARN] Transient transaction error (WriteConflict). Retrying attempt ${attempt + 1}/${MAX_RETRIES}...`);
        session.endSession();
        // Wait a short backoff period before retrying
        await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));
        continue;
      }
      
      // Fallback for local MongoDB standalone instances lacking Replica Set support
      const isNoReplicaSet = err.message.includes('replica set') || 
                             err.codeName === 'TransactionOutcomeUnknown' || 
                             err.code === 20;
      if (isNoReplicaSet) {
        console.warn('[FINTECH WARN] Standalone MongoDB detected. Executing fallback without transaction session.');
        session.endSession();
        return await operation(null);
      }
      
      session.endSession();
      throw err;
    }
  }
};

class WalletService {
  /**
   * Credit customer user wallet with idempotency protection
   */
  async creditUserWallet(userId, amount, type, description, referenceId, idempotencyKey, expiresAt = null, sessionOverride = null) {
    const operation = async (session) => {
      let wallet = await Wallet.findOne({ user: userId }).session(session);
      if (!wallet) {
        // Upsert wallet atomically
        const created = await Wallet.create([{ user: userId, balance: 0, transactions: [] }], { session });
        wallet = created[0];
      }

      // 1. Idempotency Check: Prevent duplicate credits
      const exists = wallet.transactions.some(tx => tx.idempotencyKey === idempotencyKey);
      if (exists) {
        console.log(`[FINTECH] Duplicate transaction blocked. Key: ${idempotencyKey}`);
        return wallet;
      }

      // 2. Push transaction log
      wallet.transactions.push({
        amount: Number(amount),
        type,
        description,
        status: 'active',
        referenceId,
        idempotencyKey,
        expiresAt
      });

      // 3. Recalculate balance securely (active & unexpired only)
      wallet.balance = this._calculateActiveBalance(wallet.transactions);

      // Force Mongoose to mark transactions array as modified to persist subdocument mutations correctly
      wallet.markModified('transactions');

      await wallet.save({ session });
      return wallet;
    };

    if (sessionOverride) {
      return await operation(sessionOverride);
    }
    return executeInTransaction(operation);
  }

  /**
   * Debit customer user wallet with idempotency protection and balance guards
   */
  async debitUserWallet(userId, amount, type, description, referenceId, idempotencyKey, sessionOverride = null) {
    const operation = async (session) => {
      let wallet = await Wallet.findOne({ user: userId }).session(session);
      if (!wallet) {
        throw new Error('Customer wallet not found.');
      }

      // 1. Idempotency Check
      const exists = wallet.transactions.some(tx => tx.idempotencyKey === idempotencyKey);
      if (exists) {
        console.log(`[FINTECH] Duplicate transaction blocked. Key: ${idempotencyKey}`);
        return wallet;
      }

      // 2. Balance Guard
      if (wallet.balance < amount) {
        throw new Error('Insufficient wallet balance.');
      }

      // 3. Push negative amount debit log
      wallet.transactions.push({
        amount: -Number(amount),
        type,
        description,
        status: 'active',
        referenceId,
        idempotencyKey
      });

      // 4. Recalculate balance
      wallet.balance = this._calculateActiveBalance(wallet.transactions);

      // Force Mongoose to mark transactions array as modified to persist subdocument mutations correctly
      wallet.markModified('transactions');

      await wallet.save({ session });
      return wallet;
    };

    if (sessionOverride) {
      return await operation(sessionOverride);
    }
    return executeInTransaction(operation);
  }

  /**
   * Record a sale as pending when an order is placed
   */
  async recordPendingSale(order, customIdempotencyKey = null, sessionOverride = null) {
    if (order.sellerType === 'Admin') return; // Skip admin sales commission

    const idempotencyKey = customIdempotencyKey || `pending_sale_${order._id}`;

    const operation = async (session) => {
      let wallet = await SellerWallet.findOne({ seller: order.seller }).session(session);
      if (!wallet) {
        const created = await SellerWallet.create([{ seller: order.seller }], { session });
        wallet = created[0];
      }

      // 1. Idempotency Check
      const exists = wallet.transactions.some(t => t.idempotencyKey === idempotencyKey);
      if (exists) return wallet;

      // Dynamically load commission rate from SystemSettings
      let settings = await SystemSettings.findOne().session(session);
      
      // Determine if order was placed by an enterpriser
      let userType = 'customer';
      if (order.user) {
        const User = require('../models/User');
        const userObj = await User.findById(order.user).select('userType').session(session);
        if (userObj && userObj.userType) {
          userType = userObj.userType;
        }
      }

      let commissionRate = 0.10;
      if (settings) {
        if (userType === 'enterpriser') {
          commissionRate = (settings.b2bCommissionRate !== undefined) ? settings.b2bCommissionRate / 100 : 0.05;
        } else {
          commissionRate = (settings.salesCommissionRate !== undefined) ? settings.salesCommissionRate / 100 : 0.10;
        }
      }

      const subtotal = order.totalPrice;
      const commission = Number((subtotal * commissionRate).toFixed(2));
      const netEarnings = Number((subtotal - commission).toFixed(2));

      // 2. Append transaction log
      wallet.transactions.push({
        amount: netEarnings,
        type: 'sale_credit',
        status: 'pending',
        description: `Pending earnings for Order ${order._id} (inclusive of ${(commissionRate * 100).toFixed(0)}% commission fee)`,
        referenceId: order._id,
        balanceAfter: wallet.withdrawableBalance,
        idempotencyKey
      });

      wallet.pendingBalance = Number((wallet.pendingBalance + netEarnings).toFixed(2));
      await wallet.save({ session });
      return wallet;
    };

    if (sessionOverride) {
      return await operation(sessionOverride);
    }
    return executeInTransaction(operation);
  }

  /**
   * Promotes pending sale earnings to withdrawable once the order becomes Delivered
   */
  async clearPendingSale(orderId, customIdempotencyKey = null) {
    const idempotencyKey = customIdempotencyKey || `clear_sale_${orderId}`;

    return executeInTransaction(async (session) => {
      // Find all wallets containing this pending order transaction
      const wallets = await SellerWallet.find({ 
        'transactions.referenceId': orderId,
        'transactions.status': 'pending' 
      }).session(session);
      
      for (const wallet of wallets) {
        const tx = wallet.transactions.find(t => t.referenceId.toString() === orderId.toString() && t.status === 'pending');
        if (tx) {
          // Idempotency: verify this specific clearance has not fired already
          const alreadyCleared = wallet.transactions.some(t => t.idempotencyKey === idempotencyKey);
          if (alreadyCleared) continue;

          const newWithdrawable = Number((wallet.withdrawableBalance + tx.amount).toFixed(2));
          
          await SellerWallet.updateOne(
            { 
              _id: wallet._id, 
              "transactions._id": tx._id 
            },
            {
              $set: { 
                "transactions.$.status": "cleared",
                "transactions.$.balanceAfter": newWithdrawable,
                "transactions.$.idempotencyKey": idempotencyKey
              },
              $inc: {
                pendingBalance: -tx.amount,
                withdrawableBalance: tx.amount,
                totalEarnings: tx.amount
              }
            },
            { session }
          );
        }
      }
    });
  }

  /**
   * Records a refund deduction on returned orders
   */
  async recordRefundDeduction(order, refundAmount, customIdempotencyKey = null, sessionOverride = null) {
    const idempotencyKey = customIdempotencyKey || `refund_deduct_${order._id}_${refundAmount}`;

    const operation = async (session) => {
      let wallet = await SellerWallet.findOne({ seller: order.seller }).session(session);
      if (!wallet) {
        const created = await SellerWallet.create([{ seller: order.seller }], { session });
        wallet = created[0];
      }

      // Idempotency check
      const exists = wallet.transactions.some(t => t.idempotencyKey === idempotencyKey);
      if (exists) return wallet;

      // Dynamically load commission rate from SystemSettings
      let settings = await SystemSettings.findOne().session(session);
      const commissionRate = (settings && settings.salesCommissionRate !== undefined) ? settings.salesCommissionRate / 100 : 0.10;

      const commissionRecovery = Number((refundAmount * commissionRate).toFixed(2));
      const netDeduction = Number((refundAmount - commissionRecovery).toFixed(2));

      wallet.withdrawableBalance = Number((wallet.withdrawableBalance - netDeduction).toFixed(2));
      const newBalance = Number(wallet.withdrawableBalance.toFixed(2));

      wallet.transactions.push({
        amount: -netDeduction,
        type: 'refund_debit',
        status: 'cleared',
        description: `Deduction for returned items in Order ${order._id} (inclusive of ${(commissionRate * 100).toFixed(0)}% commission recovery)`,
        referenceId: order._id,
        balanceAfter: newBalance,
        idempotencyKey
      });

      await wallet.save({ session });
      return wallet;
    };

    if (sessionOverride) {
      return await operation(sessionOverride);
    }
    return executeInTransaction(operation);
  }

  /**
   * Initiates a withdrawal payout request for sellers
   */
  async requestSellerPayout(sellerId, amount, customBankDetails = null, customIdempotencyKey = null) {
    if (amount < 500) {
      throw new Error('Minimum withdrawal amount is ₹500.');
    }

    const seller = await Seller.findById(sellerId);
    if (!seller) throw new Error('Seller profile not found.');

    const hasProfileBankDetails = seller.bankDetails && seller.bankDetails.accountNumber && seller.bankDetails.accountNumber.trim() !== '';
    const bankDetails = (customBankDetails && customBankDetails.accountNumber) ? customBankDetails : seller.bankDetails;

    if (!bankDetails || !bankDetails.accountNumber) {
      throw new Error('Please configure your bank details in your profile or provide valid details.');
    }

    return executeInTransaction(async (session) => {
      // 1. Debit wallet withdrawable balance atomically to prevent double-spending race conditions
      const wallet = await SellerWallet.findOneAndUpdate(
        { seller: sellerId, withdrawableBalance: { $gte: amount } },
        { $inc: { withdrawableBalance: -amount } },
        { session, new: true }
      );

      if (!wallet) {
        throw new Error('Insufficient withdrawable balance.');
      }

      // 2. Create the SellerPayout document
      const payoutRequest = await SellerPayout.create([{
        seller: sellerId,
        amount,
        status: 'requested',
        bankDetails: {
          accountHolderName: bankDetails.accountHolderName,
          accountNumber: bankDetails.accountNumber,
          ifscCode: bankDetails.ifscCode,
          bankName: bankDetails.bankName
        }
      }], { session });

      const payout = payoutRequest[0];
      const idempotencyKey = customIdempotencyKey || `payout_request_${payout._id}`;

      // 3. Ledger pushing with idempotency
      const newBalance = Number(wallet.withdrawableBalance.toFixed(2));
      wallet.transactions.push({
        amount: -amount,
        type: 'payout_debit',
        status: 'pending',
        description: `Payout request created. Request ID: ${payout._id}`,
        referenceId: payout._id,
        balanceAfter: newBalance,
        idempotencyKey
      });

      await wallet.save({ session });
      return payout;
    });
  }

  /**
   * Process and approve seller payout
   */
  async approveSellerPayout(payoutId, transactionReference, customIdempotencyKey = null) {
    const idempotencyKey = customIdempotencyKey || `payout_approve_${payoutId}`;

    return executeInTransaction(async (session) => {
      const payout = await SellerPayout.findOne({ _id: payoutId, status: 'requested' }).session(session);
      if (!payout) {
        throw new Error('Payout request not found or already processed.');
      }

      payout.status = 'completed';
      payout.transactionReference = transactionReference;
      await payout.save({ session });

      const wallet = await SellerWallet.findOne({ seller: payout.seller }).session(session);
      if (wallet) {
        const tx = wallet.transactions.find(t => t.referenceId.toString() === payoutId.toString());
        if (tx) {
          // Verify idempotency
          if (tx.idempotencyKey !== idempotencyKey) {
            tx.status = 'cleared';
            tx.idempotencyKey = idempotencyKey;
            await wallet.save({ session });
          }
        }
      }
      return payout;
    });
  }

  /**
   * Reject a seller payout request and refund the funds atomically
   */
  async rejectSellerPayout(payoutId, adminNotes = '', customIdempotencyKey = null) {
    const idempotencyKey = customIdempotencyKey || `payout_reject_${payoutId}`;

    return executeInTransaction(async (session) => {
      // 1. Invalidate Payout atomically
      const payout = await SellerPayout.findOneAndUpdate(
        { _id: payoutId, status: { $in: ['requested', 'processing'] } },
        { $set: { status: 'rejected', adminNotes } },
        { session, new: true }
      );

      if (!payout) {
        throw new Error('Payout request not found, or already processed.');
      }

      // 2. Refund balance
      const wallet = await SellerWallet.findOneAndUpdate(
        { seller: payout.seller },
        { $inc: { withdrawableBalance: payout.amount } },
        { session, new: true }
      );

      if (wallet) {
        const newBalance = Number(wallet.withdrawableBalance.toFixed(2));
        
        await SellerWallet.updateOne(
          { 
            seller: payout.seller, 
            "transactions.referenceId": payoutId 
          },
          {
            $set: { 
              "transactions.$.status": "cancelled",
              "transactions.$.balanceAfter": newBalance,
              "transactions.$.description": `Payout request rejected & refunded. Notes: ${adminNotes}`,
              "transactions.$.idempotencyKey": idempotencyKey
            }
          },
          { session }
        );
      }

      return payout;
    });
  }

  /**
   * Record delivery partner earnings & COD liability on order delivery completion
   */
  async recordDeliveryEarning(deliveryPartnerId, orderId, isCod, totalPrice, customIdempotencyKey = null, sessionOverride = null) {
    const idempotencyKey = customIdempotencyKey || `delivery_earn_${deliveryPartnerId}_${orderId}`;

    const operation = async (session) => {
      let wallet = await DeliveryWallet.findOne({ deliveryPartner: deliveryPartnerId }).session(session);
      if (!wallet) {
        const created = await DeliveryWallet.create([{ deliveryPartner: deliveryPartnerId }], { session });
        wallet = created[0];
      }

      // Idempotency check
      const exists = wallet.transactions.some(t => t.idempotencyKey === idempotencyKey);
      if (exists) return wallet;

      // Dynamically load delivery fee from SystemSettings
      let settings = await SystemSettings.findOne().session(session);
      const deliveryFee = (settings && settings.deliveryCommissionRate !== undefined) ? settings.deliveryCommissionRate : 50;

      // Credit delivery fee
      wallet.earningsBalance = Number((wallet.earningsBalance + deliveryFee).toFixed(2));
      wallet.transactions.push({
        amount: deliveryFee,
        type: 'delivery_fee_credit',
        description: `Delivery fee earning for Order ${orderId}`,
        referenceId: orderId,
        balanceAfter: wallet.earningsBalance,
        idempotencyKey
      });

      // Credit COD liability if cash was collected
      if (isCod) {
        const codIdempotencyKey = `cod_collect_${deliveryPartnerId}_${orderId}`;
        const codExists = wallet.transactions.some(t => t.idempotencyKey === codIdempotencyKey);
        if (!codExists) {
          wallet.codCollectionLiability = Number((wallet.codCollectionLiability + totalPrice).toFixed(2));
          wallet.transactions.push({
            amount: totalPrice,
            type: 'cod_cash_collected',
            description: `COD Cash collected from customer for Order ${orderId}`,
            referenceId: orderId,
            balanceAfter: wallet.earningsBalance,
            idempotencyKey: codIdempotencyKey
          });
        }
      }

      await wallet.save({ session });
      return wallet;
    };

    if (sessionOverride) {
      return await operation(sessionOverride);
    }
    return executeInTransaction(operation);
  }

  /**
   * Logs a delivery boy cash deposit settlement to Admin
   */
  async recordCodDeposit(deliveryPartnerId, amount, notes, customIdempotencyKey = null) {
    const idempotencyKey = customIdempotencyKey || `cod_deposit_${deliveryPartnerId}_${Date.now()}`;

    return executeInTransaction(async (session) => {
      const wallet = await DeliveryWallet.findOne({ deliveryPartner: deliveryPartnerId }).session(session);
      if (!wallet || wallet.codCollectionLiability < amount) {
        throw new Error('Deposit amount exceeds current COD cash liability.');
      }

      // Idempotency Check
      const exists = wallet.transactions.some(t => t.idempotencyKey === idempotencyKey);
      if (exists) return wallet;

      const settlementRequest = await DeliverySettlement.create([{
        deliveryPartner: deliveryPartnerId,
        type: 'cod_deposit',
        amount,
        status: 'completed',
        notes
      }], { session });

      const settlement = settlementRequest[0];

      wallet.codCollectionLiability = Number((wallet.codCollectionLiability - amount).toFixed(2));
      wallet.transactions.push({
        amount: -amount,
        type: 'cod_settlement_to_admin',
        description: `Cash deposit settlement to Admin. Settlement ID: ${settlement._id}`,
        referenceId: settlement._id,
        balanceAfter: wallet.earningsBalance,
        idempotencyKey
      });

      await wallet.save({ session });
      return settlement;
    });
  }

  /**
   * Atomically settles delivery boy COD cash liability in the DeliveryWallet
   */
  async settleDeliveryCodLiability(deliveryBoyId, amount, idempotencyKey) {
    return executeInTransaction(async (session) => {
      const wallet = await DeliveryWallet.findOne({ deliveryPartner: deliveryBoyId }).session(session);
      if (!wallet) {
        throw new Error('Delivery wallet not found.');
      }

      // Idempotency Check
      const exists = wallet.transactions.some(tx => tx.idempotencyKey === idempotencyKey);
      if (exists) {
        console.log(`[FINTECH] COD settlement already recorded. Key: ${idempotencyKey}`);
        return wallet;
      }

      // Create settlement document
      const settlementRequest = await DeliverySettlement.create([{
        deliveryPartner: deliveryBoyId,
        type: 'cod_deposit',
        amount,
        status: 'completed',
        notes: 'COD Cash deposit reconciled by Admin'
      }], { session });

      const settlement = settlementRequest[0];

      // Offset COD collection liability
      wallet.codCollectionLiability = Number((Math.max(0, wallet.codCollectionLiability - amount)).toFixed(2));
      wallet.transactions.push({
        amount: -amount,
        type: 'cod_settlement_to_admin',
        description: `COD Cash deposit settlement confirmed by Admin. Settlement ID: ${settlement._id}`,
        referenceId: settlement._id,
        balanceAfter: wallet.earningsBalance,
        idempotencyKey
      });

      await wallet.save({ session });
      return wallet;
    });
  }

  /**
   * Helper to compute active balance considering only active and unexpired transactions
   */
  _calculateActiveBalance(transactions) {
    let balance = 0;
    const now = new Date();

    for (const tx of transactions) {
      // Check expiration for positive balances
      if (tx.amount > 0 && tx.status === 'active' && tx.expiresAt && tx.expiresAt < now) {
        tx.status = 'expired';
      }

      if (tx.status === 'active') {
        balance += tx.amount;
      }
    }

    return Number(balance.toFixed(2));
  }
}

module.exports = new WalletService();
