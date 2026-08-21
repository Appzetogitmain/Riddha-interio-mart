const RFQ = require('../models/RFQ');
const SampleRequest = require('../models/SampleRequest');
const notifier = require('./rfqNotifier');
const routingService = require('./rfqRoutingService');
const sampleRules = require('./sampleRulesService');
const {
  RFQ_STATUS,
  SAMPLE_STATUS,
  applyRFQTransition
} = require('../utils/rfqStateMachine');

/**
 * Requirement A — the background half of the RFQ/sample workflow.
 *
 * Three sweeps, driven by cronService:
 *   1. SLA breaches      — an RFQ past slaDueAt with no seller response is
 *                          escalated to the sellers holding it and to admins.
 *   2. Expiry            — an open RFQ past expiresAt is closed as expired.
 *   3. Sample follow-ups — "How was the sample?" N days after delivery.
 *
 * Each sweep marks what it has already acted on (slaEscalatedAt, status,
 * followUpSentAt) so a restart never re-notifies the same record.
 */

class RFQSlaService {
  /** Escalate every open RFQ whose SLA window has closed without a response. */
  async escalateBreachedSLAs() {
    try {
      const now = new Date();
      const breached = await RFQ.find({
        status: { $in: [RFQ_STATUS.SUBMITTED, RFQ_STATUS.UNDER_REVIEW] },
        slaDueAt: { $lt: now },
        slaEscalatedAt: null
      }).limit(200);

      if (breached.length === 0) return { escalated: 0 };

      let escalated = 0;
      for (const rfq of breached) {
        try {
          rfq.slaBreachedAt = rfq.slaBreachedAt || rfq.slaDueAt;
          rfq.slaEscalatedAt = now;
          rfq.statusHistory.push({
            status: rfq.status,
            changedAt: now,
            changedByRole: 'system',
            note: 'SLA breached — escalated to the assigned sellers and the Riddha team.'
          });
          await rfq.save();

          await notifier.rfqSlaBreached(rfq);
          escalated += 1;
        } catch (err) {
          console.error(`[RFQ SLA] escalation failed for ${rfq.rfqNumber}:`, err.message);
        }
      }

      console.log(`[RFQ SLA] Escalated ${escalated} breached RFQ(s).`);
      return { escalated };
    } catch (error) {
      console.error('[RFQ SLA] escalateBreachedSLAs failed:', error.message);
      return { escalated: 0 };
    }
  }

  /** Close RFQs that have sat open past their expiry date. */
  async expireStaleRFQs() {
    try {
      const now = new Date();
      const stale = await RFQ.find({
        status: {
          $in: [RFQ_STATUS.SUBMITTED, RFQ_STATUS.UNDER_REVIEW, RFQ_STATUS.QUOTED, RFQ_STATUS.NEGOTIATION]
        },
        expiresAt: { $lt: now }
      }).limit(200);

      if (stale.length === 0) return { expired: 0 };

      let expired = 0;
      for (const rfq of stale) {
        try {
          applyRFQTransition(rfq, RFQ_STATUS.EXPIRED, {
            role: 'system',
            note: 'Expired automatically — no accepted quotation before the validity window closed.'
          });
          await rfq.save();

          await notifier.rfqStatusChanged(rfq, {
            title: `RFQ ${rfq.rfqNumber} expired`,
            message: 'This request expired without an accepted quotation. Submit a new RFQ if you still need pricing.'
          });
          expired += 1;
        } catch (err) {
          console.error(`[RFQ SLA] expiry failed for ${rfq.rfqNumber}:`, err.message);
        }
      }

      console.log(`[RFQ SLA] Expired ${expired} stale RFQ(s).`);
      return { expired };
    } catch (error) {
      console.error('[RFQ SLA] expireStaleRFQs failed:', error.message);
      return { expired: 0 };
    }
  }

  /** Requirement A §2.7 — the "How was the sample?" nudge after delivery. */
  async sendSampleFollowUps() {
    try {
      const rules = await sampleRules.loadRules();
      const cutoff = new Date(Date.now() - rules.feedbackFollowUpDays * 24 * 60 * 60 * 1000);

      const due = await SampleRequest.find({
        status: SAMPLE_STATUS.DELIVERED,
        followUpSentAt: null,
        'courier.deliveredAt': { $ne: null, $lte: cutoff }
      }).limit(200);

      if (due.length === 0) return { sent: 0 };

      let sent = 0;
      for (const sample of due) {
        try {
          await notifier.sampleFeedbackFollowUp(sample);
          sample.followUpSentAt = new Date();
          await sample.save();
          sent += 1;
        } catch (err) {
          console.error(`[SAMPLE FOLLOW-UP] failed for ${sample.requestNumber}:`, err.message);
        }
      }

      console.log(`[SAMPLE FOLLOW-UP] Sent ${sent} feedback request(s).`);
      return { sent };
    } catch (error) {
      console.error('[SAMPLE FOLLOW-UP] sendSampleFollowUps failed:', error.message);
      return { sent: 0 };
    }
  }

  /** Everything the cron ticks together. */
  async runAll() {
    const [sla, expiry, followUps] = await Promise.all([
      this.escalateBreachedSLAs(),
      this.expireStaleRFQs(),
      this.sendSampleFollowUps()
    ]);
    return { ...sla, ...expiry, ...followUps };
  }

  /**
   * Live SLA figures for one RFQ, used by the seller inbox and admin console.
   * @returns {{ dueAt, msRemaining, hoursRemaining, breached, responded }}
   */
  slaStatus(rfq) {
    if (!rfq || !rfq.slaDueAt) {
      return { dueAt: null, msRemaining: null, hoursRemaining: null, breached: false, responded: false };
    }

    const responded = !!rfq.firstResponseAt;
    const reference = responded ? new Date(rfq.firstResponseAt) : new Date();
    const msRemaining = new Date(rfq.slaDueAt).getTime() - reference.getTime();

    return {
      dueAt: rfq.slaDueAt,
      msRemaining,
      hoursRemaining: Number((msRemaining / 3600000).toFixed(1)),
      breached: msRemaining < 0,
      responded
    };
  }

  /** Sellers on this RFQ who still owe a response. */
  pendingResponders(rfq) {
    return (rfq.routedTo || []).filter((r) => !r.respondedAt).map((r) => r.sellerId);
  }

  isRoutedToSeller(rfq, sellerId) {
    return routingService.isRoutedToSeller(rfq, sellerId);
  }
}

module.exports = new RFQSlaService();
