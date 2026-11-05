const Product = require('../models/Product');
const InventoryReservation = require('../models/InventoryReservation');
const InventoryHistoryLog = require('../models/InventoryHistoryLog');
const mongoose = require('mongoose');

class InventoryService {
  /** On-hand units for the product, or for one variant when variantId is given. */
  _onHand(product, variantId = null) {
    if (variantId) {
      const v = product.variants.id(variantId);
      return v ? (v.countInStock || 0) : 0;
    }
    return product.countInStock || 0;
  }

  /** Units not currently held by a reservation. */
  _available(product, variantId = null) {
    if (variantId) {
      const v = product.variants.id(variantId);
      return v ? (v.countInStock || 0) - (v.reservedStock || 0) : 0;
    }
    return (product.countInStock || 0) - (product.reservedStock || 0);
  }

  /** Remaining on-hand stock used for low-stock alerts. */
  getRemainingStock(product, variantId = null) {
    return this._onHand(product, variantId);
  }

  /**
   * Atomically reserve stock for a customer during checkout.
   */
  async reserveStock(userId, productId, quantity, durationMinutes = 15, session = null, variantId = null) {
    const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000);

    // Atomically increment reservedStock only if available stock is sufficient
    let product;
    if (variantId) {
      // Variant stock is tracked per variant inside Product.variants
      const vId = new mongoose.Types.ObjectId(String(variantId));
      product = await Product.findOneAndUpdate(
        {
          _id: productId,
          variants: {
            $elemMatch: {
              _id: vId,
              $expr: { $gte: [{ $subtract: ['$$this.countInStock', { $ifNull: ['$$this.reservedStock', 0] }] }, quantity] }
            }
          }
        },
        { $inc: { 'variants.$[v].reservedStock': quantity } },
        { new: true, session, arrayFilters: [{ 'v._id': vId }] }
      );
    } else {
      product = await Product.findOneAndUpdate(
        {
          _id: productId,
          $expr: {
            $gte: [{ $subtract: ['$countInStock', '$reservedStock'] }, quantity]
          }
        },
        { $inc: { reservedStock: quantity } },
        { new: true, session }
      );
    }

    if (!product) {
      throw new Error(`Insufficient available stock for product: ${productId}${variantId ? ' (selected variant)' : ''}`);
    }

    // Record the reservation hold in DB
    const [reservation] = await InventoryReservation.create(
      [
        {
          product: productId,
          variantId: variantId || null,
          user: userId,
          quantity,
          expiresAt,
          status: 'reserved'
        }
      ],
      { session }
    );

    // Log the reservation movement
    await InventoryHistoryLog.create(
      [
        {
          product: productId,
          action: 'reservation',
          quantity,
          stockBefore: this._available(product, variantId) + quantity,
          stockAfter: this._available(product, variantId),
          details: `Reserved ${quantity} units for User ${userId}. Reservation ID: ${reservation._id}`
        }
      ],
      { session }
    );

    return reservation;
  }

  /**
   * Atomically commit a reservation upon successful checkout payment.
   * Decrements countInStock and reservedStock simultaneously.
   */
  async commitReservation(reservationId, session = null) {
    const reservation = await InventoryReservation.findOne({ _id: reservationId, status: 'reserved' }).session(session);
    if (!reservation) {
      throw new Error(`Active stock reservation not found: ${reservationId}`);
    }

    // Atomic update to subtract actual countInStock and reservedStock
    const product = reservation.variantId
      ? await Product.findOneAndUpdate(
          { _id: reservation.product },
          {
            $inc: {
              'variants.$[v].countInStock': -reservation.quantity,
              'variants.$[v].reservedStock': -reservation.quantity
            }
          },
          { new: true, session, arrayFilters: [{ 'v._id': reservation.variantId }] }
        )
      : await Product.findOneAndUpdate(
          { _id: reservation.product },
          {
            $inc: {
              countInStock: -reservation.quantity,
              reservedStock: -reservation.quantity
            }
          },
          { new: true, session }
        );

    if (!product) {
      throw new Error(`Product not found during reservation commit: ${reservation.product}`);
    }

    reservation.status = 'completed';
    await reservation.save({ session });

    // Log the final sale
    await InventoryHistoryLog.create(
      [
        {
          product: reservation.product,
          action: 'sale',
          quantity: reservation.quantity,
          stockBefore: this._onHand(product, reservation.variantId) + reservation.quantity,
          stockAfter: this._onHand(product, reservation.variantId),
          details: `Committed reservation ${reservation._id}. Units permanently sold.`
        }
      ],
      { session }
    );

    return reservation;
  }

  /**
   * Atomically release a reservation if checkout fails, payment is cancelled, or order is deleted.
   */
  async releaseReservation(reservationId, session = null) {
    const reservation = await InventoryReservation.findOne({ _id: reservationId, status: 'reserved' }).session(session);
    if (!reservation) return null;

    const product = reservation.variantId
      ? await Product.findOneAndUpdate(
          { _id: reservation.product },
          { $inc: { 'variants.$[v].reservedStock': -reservation.quantity } },
          { new: true, session, arrayFilters: [{ 'v._id': reservation.variantId }] }
        )
      : await Product.findOneAndUpdate(
          { _id: reservation.product },
          { $inc: { reservedStock: -reservation.quantity } },
          { new: true, session }
        );

    reservation.status = 'released';
    await reservation.save({ session });

    if (product) {
      // Log the release
      await InventoryHistoryLog.create(
        [
          {
            product: reservation.product,
            action: 'release',
            quantity: reservation.quantity,
            stockBefore: this._available(product, reservation.variantId) - reservation.quantity,
            stockAfter: this._available(product, reservation.variantId),
            details: `Released stock hold for reservation ${reservation._id}.`
          }
        ],
        { session }
      );
    }

    return reservation;
  }

  /**
   * Release stock atomically upon cancellations or returns
   */
  async returnStock(productId, quantity, session = null, variantId = null) {
    const product = variantId
      ? await Product.findOneAndUpdate(
          { _id: productId },
          { $inc: { 'variants.$[v].countInStock': quantity } },
          { new: true, session, arrayFilters: [{ 'v._id': new mongoose.Types.ObjectId(String(variantId)) }] }
        )
      : await Product.findOneAndUpdate(
          { _id: productId },
          { $inc: { countInStock: quantity } },
          { new: true, session }
        );

    if (!product) {
      throw new Error(`Product not found for returning stock: ${productId}`);
    }

    // Log the return
    await InventoryHistoryLog.create(
      [
        {
          product: productId,
          action: 'return',
          quantity,
          stockBefore: this._onHand(product, variantId) - quantity,
          stockAfter: this._onHand(product, variantId),
          details: `Returned ${quantity} units to inventory due to order cancellation or return approval.`
        }
      ],
      { session }
    );

    return product;
  }

  /**
   * Background scan process to release all expired stock reservations.
   */
  /**
   * Background scan process to release all expired stock reservations.
   */
  async releaseExpiredReservations() {
    const expiredReservations = await InventoryReservation.find({
      status: 'reserved',
      expiresAt: { $lt: new Date() }
    });

    if (expiredReservations.length === 0) return;

    console.log(`[Inventory Daemon] Found ${expiredReservations.length} expired reservations to release.`);

    for (const reservation of expiredReservations) {
      const session = await mongoose.startSession();
      try {
        session.startTransaction();

        const Order = require('../models/Order');
        let order = null;
        if (reservation.order) {
          order = await Order.findOne({
            _id: reservation.order,
            status: 'Pending',
            isPaid: false
          }).session(session);
        } else {
          order = await Order.findOne({
            user: reservation.user,
            'orderItems.product': reservation.product,
            status: 'Pending',
            isPaid: false
          }).session(session);
        }

        if (order) {
          order.status = 'Cancelled';
          order.paymentStatus = 'failed';
          await order.save({ session });

          const associatedReservations = await InventoryReservation.find({
            order: order._id,
            status: 'reserved'
          }).session(session);

          for (const assocRes of associatedReservations) {
            await this.releaseReservation(assocRes._id, session);
          }
          console.log(`[Inventory Daemon] Reconciled and auto-cancelled abandoned Order #${order._id} releasing all associated stock holds.`);
        } else {
          await this.releaseReservation(reservation._id, session);
        }

        await session.commitTransaction();
      } catch (err) {
        await session.abortTransaction();

        // Handle standalone MongoDB fallback
        const isNoReplicaSet = err.message.includes('replica set') || 
                               err.codeName === 'TransactionOutcomeUnknown' || 
                               err.code === 20;
        if (isNoReplicaSet) {
          console.warn('[Inventory Daemon WARNING] Standalone MongoDB detected. Sweeping expired hold without transaction.');
          try {
            // Standalone sweep fallback logic (runs without session)
            const Order = require('../models/Order');
            let order = null;
            if (reservation.order) {
              order = await Order.findOne({
                _id: reservation.order,
                status: 'Pending',
                isPaid: false
              });
            } else {
              order = await Order.findOne({
                user: reservation.user,
                'orderItems.product': reservation.product,
                status: 'Pending',
                isPaid: false
              });
            }

            if (order) {
              order.status = 'Cancelled';
              order.paymentStatus = 'failed';
              await order.save();

              const associatedReservations = await InventoryReservation.find({
                order: order._id,
                status: 'reserved'
              });

              for (const assocRes of associatedReservations) {
                await this.releaseReservation(assocRes._id);
              }
              console.log(`[Inventory Daemon] Reconciled and auto-cancelled abandoned Order #${order._id} releasing all associated stock holds (Standalone fallback).`);
            } else {
              await this.releaseReservation(reservation._id);
            }
          } catch (fallbackErr) {
            console.error('[Inventory Daemon ERROR] Standalone sweep fallback failed:', fallbackErr.message);
          }
        } else {
          console.error(`[Inventory Daemon ERROR] Failed to release expired reservation ${reservation._id}:`, err.message);
        }
      } finally {
        session.endSession();
      }
    }
  }

  /**
   * Starts the background interval daemon that sweeps expired holds periodically.
   */
  startReservationDaemon() {
    console.log('[Inventory Daemon] Starting background Stock Reservation Daemon...');
    setInterval(async () => {
      try {
        await this.releaseExpiredReservations();
      } catch (err) {
        console.error('[Inventory Daemon] Scanner error:', err.message);
      }
    }, 30000); // Scans every 30 seconds
  }
}

module.exports = new InventoryService();
