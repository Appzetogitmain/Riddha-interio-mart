const Notification = require('../models/Notification');
const NotificationPreference = require('../models/NotificationPreference');
const Admin = require('../models/Admin');
const { sendPushNotificationForUser } = require('./firebaseAdmin');

/**
 * Requirement A — notification fan-out for RFQs and sample requests
 * (Requirement #14 integration).
 *
 * Recipients are not all the same kind of account:
 *   - customers are `User` docs, so they get a persisted Notification inbox row
 *     honouring their NotificationPreference, plus a socket event and FCM push;
 *   - sellers and admins are not `User` docs (the Notification schema's userId
 *     refs User), so they receive the realtime socket event and an FCM push.
 *
 * Every call is fire-and-forget: a notification failure must never roll back the
 * RFQ write that triggered it.
 */

/** Lazily resolved so this module can be required before the server boots. */
const getIOSafe = () => {
  try {
    return require('../socket').getIO();
  } catch (err) {
    return null;
  }
};

const emit = (room, event, payload) => {
  const io = getIOSafe();
  if (!io) return false;
  try {
    io.to(room).emit(event, payload);
    return true;
  } catch (err) {
    console.error('[RFQ NOTIFY] socket emit failed:', err.message);
    return false;
  }
};

class RFQNotifier {
  /**
   * Notify a customer. Writes the inbox row, emits `notification:new` on their
   * socket room and pushes over FCM.
   */
  async notifyCustomer(userId, { type, category = 'orders', title, message, actionUrl, relatedEntity, event = 'notification:new' }) {
    if (!userId) return null;

    try {
      const prefs = await NotificationPreference.findOne({ userId }).lean();
      const categoryMuted = prefs
        && prefs.notificationTypes
        && prefs.notificationTypes[category] === false
        && !prefs.urgentOnly;

      let notification = null;
      if (!categoryMuted) {
        notification = await Notification.create({
          userId,
          type,
          category,
          title,
          message,
          channels: { inApp: message },
          actionUrl,
          relatedEntity,
          isRead: false
        });
      }

      emit(`user:${userId}`, event, notification || { type, title, message, actionUrl });

      if (!categoryMuted && (!prefs || !prefs.channels || prefs.channels.push !== false)) {
        await sendPushNotificationForUser(userId, 'User', {
          title,
          body: message,
          data: {
            type,
            entityType: (relatedEntity && relatedEntity.type) || '',
            entityId: String((relatedEntity && relatedEntity.id) || ''),
            actionUrl: actionUrl || ''
          }
        });
      }

      return notification;
    } catch (err) {
      console.error('[RFQ NOTIFY] customer notification failed:', err.message);
      return null;
    }
  }

  /**
   * Notify one seller. Acceptance criterion: a seller must have the RFQ within
   * 30 seconds of submission — the socket emit is synchronous with the write,
   * and offline sellers get an FCM push.
   */
  async notifySeller(sellerId, { event = 'rfq:new', title, message, payload = {} }) {
    if (!sellerId) return;
    try {
      emit(`seller:${sellerId}`, event, { ...payload, title, message });
      await sendPushNotificationForUser(sellerId, 'Seller', {
        title,
        body: message,
        data: Object.fromEntries(
          Object.entries(payload).map(([k, v]) => [k, typeof v === 'object' ? JSON.stringify(v) : String(v)])
        )
      });
    } catch (err) {
      console.error('[RFQ NOTIFY] seller notification failed:', err.message);
    }
  }

  /** Broadcast to every admin (internal routing, SLA escalation, high-value RFQs). */
  async notifyAdmins({ event = 'rfq:new', title, message, payload = {} }) {
    try {
      emit('role:admin', event, { ...payload, title, message });

      const admins = await Admin.find({}).select('_id').lean();
      const data = Object.fromEntries(
        Object.entries(payload).map(([k, v]) => [k, typeof v === 'object' ? JSON.stringify(v) : String(v)])
      );
      for (const admin of admins) {
        await sendPushNotificationForUser(admin._id, 'Admin', { title, body: message, data });
      }
    } catch (err) {
      console.error('[RFQ NOTIFY] admin notification failed:', err.message);
    }
  }

  // ---------------------------------------------------------------------------
  // RFQ events
  // ---------------------------------------------------------------------------

  async rfqSubmitted(rfq, { sellerIds = [], notifyAdmin = false } = {}) {
    const payload = {
      rfqId: String(rfq._id),
      rfqNumber: rfq.rfqNumber,
      lineItems: rfq.lineItems.length,
      requiredDate: rfq.requiredDate,
      slaDueAt: rfq.slaDueAt
    };

    await this.notifyCustomer(rfq.customerId, {
      type: 'rfq_submitted',
      category: 'orders',
      title: `RFQ ${rfq.rfqNumber} received`,
      message: `We have received your request for quotation with ${rfq.lineItems.length} line item(s). You will receive a quote within 24 hours.`,
      actionUrl: `/rfq/${rfq._id}`,
      relatedEntity: { type: 'quotation', id: rfq._id }
    });

    await Promise.all(sellerIds.map((sellerId) => this.notifySeller(sellerId, {
      event: 'rfq:new',
      title: `New RFQ ${rfq.rfqNumber}`,
      message: `${rfq.lineItems.length} line item(s) required by ${new Date(rfq.requiredDate).toLocaleDateString('en-IN')}. Respond within 24 hours.`,
      payload
    })));

    if (notifyAdmin) {
      await this.notifyAdmins({
        event: 'rfq:new',
        title: `New RFQ ${rfq.rfqNumber}`,
        message: `RFQ needs internal review (${rfq.lineItems.length} line items).`,
        payload
      });
    }
  }

  async rfqQuoted(rfq, { quotationId, sellerName = 'A seller' } = {}) {
    await this.notifyCustomer(rfq.customerId, {
      type: 'rfq_quoted',
      category: 'orders',
      title: `Quote received for ${rfq.rfqNumber}`,
      message: `${sellerName} has submitted a quotation for your request. Review and compare it now.`,
      actionUrl: `/rfq/${rfq._id}`,
      relatedEntity: { type: 'quotation', id: quotationId || rfq._id }
    });
  }

  async rfqMessage(rfq, { message, senderRole, sellerId }) {
    const preview = message.length > 120 ? `${message.slice(0, 117)}...` : message;

    if (senderRole === 'user') {
      const payload = { rfqId: String(rfq._id), rfqNumber: rfq.rfqNumber };
      // No sellerId means the customer broadcast to everyone holding the RFQ.
      const targets = sellerId ? [sellerId] : (rfq.routedTo || []).map((r) => r.sellerId);

      await Promise.all(targets.map((target) => this.notifySeller(target, {
        event: 'rfq:message',
        title: `New message on ${rfq.rfqNumber}`,
        message: preview,
        payload
      })));

      if (targets.length === 0 || rfq.routedToAdmin) {
        await this.notifyAdmins({
          event: 'rfq:message',
          title: `New message on ${rfq.rfqNumber}`,
          message: preview,
          payload
        });
      }
      return;
    }

    await this.notifyCustomer(rfq.customerId, {
      type: 'rfq_message',
      category: 'orders',
      title: `New message on ${rfq.rfqNumber}`,
      message: preview,
      actionUrl: `/rfq/${rfq._id}`,
      relatedEntity: { type: 'quotation', id: rfq._id },
      event: 'rfq:message'
    });
  }

  async rfqAccepted(rfq, { sellerId, quotationId }) {
    if (sellerId) {
      await this.notifySeller(sellerId, {
        event: 'rfq:accepted',
        title: `Quote accepted — ${rfq.rfqNumber}`,
        message: 'The customer accepted your quotation. Prepare for order confirmation.',
        payload: { rfqId: String(rfq._id), rfqNumber: rfq.rfqNumber, quotationId: String(quotationId || '') }
      });
    }
    await this.notifyAdmins({
      event: 'rfq:accepted',
      title: `Quote accepted — ${rfq.rfqNumber}`,
      message: 'An RFQ quotation was accepted and is ready to convert to an order.',
      payload: { rfqId: String(rfq._id), rfqNumber: rfq.rfqNumber }
    });
  }

  async rfqConverted(rfq, order) {
    await this.notifyCustomer(rfq.customerId, {
      type: 'rfq_converted',
      category: 'orders',
      title: `Order created from ${rfq.rfqNumber}`,
      message: `Your accepted quotation is now order ${order.orderNumber || order._id}.`,
      actionUrl: `/orders/${order._id}/track`,
      relatedEntity: { type: 'order', id: order._id }
    });
  }

  async rfqStatusChanged(rfq, { title, message }) {
    await this.notifyCustomer(rfq.customerId, {
      type: `rfq_${rfq.status}`,
      category: 'orders',
      title,
      message,
      actionUrl: `/rfq/${rfq._id}`,
      relatedEntity: { type: 'quotation', id: rfq._id }
    });
  }

  /** SLA breach — escalates to every seller still holding the RFQ, plus admins. */
  async rfqSlaBreached(rfq) {
    const payload = {
      rfqId: String(rfq._id),
      rfqNumber: rfq.rfqNumber,
      slaDueAt: rfq.slaDueAt
    };

    const pending = (rfq.routedTo || []).filter((r) => !r.respondedAt);
    await Promise.all(pending.map((r) => this.notifySeller(r.sellerId, {
      event: 'rfq:sla_breach',
      title: `SLA breached — ${rfq.rfqNumber}`,
      message: 'This RFQ is past its 24-hour response window. Respond now.',
      payload
    })));

    await this.notifyAdmins({
      event: 'rfq:sla_breach',
      title: `SLA breached — ${rfq.rfqNumber}`,
      message: `${pending.length} seller(s) have not responded within the SLA window. Escalated for internal action.`,
      payload
    });
  }

  // ---------------------------------------------------------------------------
  // Sample request events
  // ---------------------------------------------------------------------------

  async sampleStatusChanged(sample, { title, message, actionUrl }) {
    await this.notifyCustomer(sample.customerId, {
      type: `sample_${sample.status}`,
      category: 'orders',
      title,
      message,
      actionUrl: actionUrl || `/samples/${sample._id}`,
      relatedEntity: { type: 'order', id: sample.trackingOrderId || sample._id }
    });
  }

  async sampleRequested(sample, { sellerIds = [] } = {}) {
    await Promise.all(sellerIds.map((sellerId) => this.notifySeller(sellerId, {
      event: 'sample:new',
      title: `New sample request ${sample.requestNumber}`,
      message: `${sample.items.length} sample(s) requested. Approve and dispatch.`,
      payload: { sampleRequestId: String(sample._id), requestNumber: sample.requestNumber }
    })));

    if (sample.status === 'requested') {
      await this.notifyAdmins({
        event: 'sample:new',
        title: `Sample request ${sample.requestNumber} awaiting approval`,
        message: `${sample.items.length} sample(s) requested.`,
        payload: { sampleRequestId: String(sample._id), requestNumber: sample.requestNumber }
      });
    }
  }

  /** The "How was the sample?" nudge, 3 days after delivery. */
  async sampleFeedbackFollowUp(sample) {
    await this.notifyCustomer(sample.customerId, {
      type: 'sample_feedback_request',
      category: 'engagement',
      title: 'How was the sample?',
      message: `Tell us what you thought of the samples from ${sample.requestNumber} — like, dislike, or need a different shade?`,
      actionUrl: `/samples/${sample._id}?feedback=1`,
      relatedEntity: { type: 'product', id: sample.items[0] && sample.items[0].productId }
    });
  }
}

module.exports = new RFQNotifier();
