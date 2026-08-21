/**
 * Requirement A — RFQ & Sample Request state machines.
 *
 * Pure, dependency-free transition logic so it can be unit tested without a
 * database. Controllers must never assign `status` directly; they go through
 * `applyRFQTransition` / `applySampleTransition` which validate the move and
 * append the audit entry in one step.
 */

// -----------------------------------------------------------------------------
// RFQ
// -----------------------------------------------------------------------------

const RFQ_STATUS = {
  SUBMITTED: 'submitted',
  UNDER_REVIEW: 'under_review',
  QUOTED: 'quoted',
  NEGOTIATION: 'negotiation',
  ACCEPTED: 'accepted',
  CONVERTED_TO_ORDER: 'converted_to_order',
  REJECTED: 'rejected',
  EXPIRED: 'expired'
};

const RFQ_STATUSES = Object.values(RFQ_STATUS);

/**
 * SUBMITTED -> UNDER_REVIEW -> QUOTED -> NEGOTIATION -> ACCEPTED -> CONVERTED_TO_ORDER
 *                                               \-> REJECTED
 *                                               \-> EXPIRED
 *
 * `submitted -> quoted` is allowed because a seller may quote straight out of
 * the inbox without explicitly opening the RFQ first; the review step is then
 * implied. Negotiation can bounce back to QUOTED when the seller revises.
 */
const RFQ_TRANSITIONS = {
  [RFQ_STATUS.SUBMITTED]: [RFQ_STATUS.UNDER_REVIEW, RFQ_STATUS.QUOTED, RFQ_STATUS.REJECTED, RFQ_STATUS.EXPIRED],
  [RFQ_STATUS.UNDER_REVIEW]: [RFQ_STATUS.QUOTED, RFQ_STATUS.REJECTED, RFQ_STATUS.EXPIRED],
  [RFQ_STATUS.QUOTED]: [RFQ_STATUS.NEGOTIATION, RFQ_STATUS.ACCEPTED, RFQ_STATUS.REJECTED, RFQ_STATUS.EXPIRED],
  [RFQ_STATUS.NEGOTIATION]: [RFQ_STATUS.QUOTED, RFQ_STATUS.ACCEPTED, RFQ_STATUS.REJECTED, RFQ_STATUS.EXPIRED],
  [RFQ_STATUS.ACCEPTED]: [RFQ_STATUS.CONVERTED_TO_ORDER],
  [RFQ_STATUS.CONVERTED_TO_ORDER]: [],
  [RFQ_STATUS.REJECTED]: [],
  [RFQ_STATUS.EXPIRED]: []
};

/** Statuses from which the customer may still edit the RFQ body. */
const RFQ_CUSTOMER_EDITABLE = [RFQ_STATUS.SUBMITTED, RFQ_STATUS.UNDER_REVIEW];

/** Statuses at which the RFQ is closed and the SLA/expiry sweeps skip it. */
const RFQ_TERMINAL = [RFQ_STATUS.CONVERTED_TO_ORDER, RFQ_STATUS.REJECTED, RFQ_STATUS.EXPIRED];

// -----------------------------------------------------------------------------
// Sample requests
// -----------------------------------------------------------------------------

const SAMPLE_STATUS = {
  REQUESTED: 'requested',
  APPROVED: 'approved',
  DECLINED: 'declined',
  DISPATCHED: 'dispatched',
  DELIVERED: 'delivered',
  FEEDBACK_GIVEN: 'feedback_given'
};

const SAMPLE_STATUSES = Object.values(SAMPLE_STATUS);

/**
 * REQUESTED -> APPROVED -> DISPATCHED -> DELIVERED -> FEEDBACK_GIVEN
 *          \-> DECLINED
 */
const SAMPLE_TRANSITIONS = {
  [SAMPLE_STATUS.REQUESTED]: [SAMPLE_STATUS.APPROVED, SAMPLE_STATUS.DECLINED],
  [SAMPLE_STATUS.APPROVED]: [SAMPLE_STATUS.DISPATCHED, SAMPLE_STATUS.DECLINED],
  [SAMPLE_STATUS.DISPATCHED]: [SAMPLE_STATUS.DELIVERED],
  [SAMPLE_STATUS.DELIVERED]: [SAMPLE_STATUS.FEEDBACK_GIVEN],
  [SAMPLE_STATUS.DECLINED]: [],
  [SAMPLE_STATUS.FEEDBACK_GIVEN]: []
};

const SAMPLE_TERMINAL = [SAMPLE_STATUS.DECLINED, SAMPLE_STATUS.FEEDBACK_GIVEN];

// -----------------------------------------------------------------------------
// Generic engine
// -----------------------------------------------------------------------------

class InvalidTransitionError extends Error {
  constructor(from, to, allowed) {
    super(`Cannot move from "${from}" to "${to}". Allowed next: ${allowed.length ? allowed.join(', ') : '(none — terminal state)'}.`);
    this.name = 'InvalidTransitionError';
    this.statusCode = 400;
    this.from = from;
    this.to = to;
    this.allowed = allowed;
  }
}

const nextStatuses = (table, from) => (table[from] ? [...table[from]] : []);

const canTransitionIn = (table, from, to) => nextStatuses(table, from).includes(to);

const assertTransitionIn = (table, from, to) => {
  if (!Object.prototype.hasOwnProperty.call(table, from)) {
    throw new InvalidTransitionError(from, to, []);
  }
  if (!canTransitionIn(table, from, to)) {
    throw new InvalidTransitionError(from, to, nextStatuses(table, from));
  }
  return true;
};

/**
 * Validate the move, set the new status and push an audit entry onto the
 * document's `statusHistory`. Mutates and returns `doc` — the caller saves.
 *
 * @param {object} table          transition table
 * @param {object} doc            mongoose doc (or plain object) with .status
 * @param {string} to             target status
 * @param {object} actor          { id, role, note }
 */
const applyTransitionIn = (table, doc, to, { id = null, role = 'system', note = '' } = {}) => {
  assertTransitionIn(table, doc.status, to);

  const entry = {
    status: to,
    changedAt: new Date(),
    changedBy: id || null,
    changedByRole: role,
    note: note || ''
  };

  doc.status = to;
  if (!Array.isArray(doc.statusHistory)) doc.statusHistory = [];
  doc.statusHistory.push(entry);

  return doc;
};

// -----------------------------------------------------------------------------
// Bound helpers
// -----------------------------------------------------------------------------

const nextRFQStatuses = (from) => nextStatuses(RFQ_TRANSITIONS, from);
const canTransitionRFQ = (from, to) => canTransitionIn(RFQ_TRANSITIONS, from, to);
const assertRFQTransition = (from, to) => assertTransitionIn(RFQ_TRANSITIONS, from, to);
const applyRFQTransition = (rfq, to, actor) => applyTransitionIn(RFQ_TRANSITIONS, rfq, to, actor);
const isRFQTerminal = (status) => RFQ_TERMINAL.includes(status);
const isRFQCustomerEditable = (status) => RFQ_CUSTOMER_EDITABLE.includes(status);

const nextSampleStatuses = (from) => nextStatuses(SAMPLE_TRANSITIONS, from);
const canTransitionSample = (from, to) => canTransitionIn(SAMPLE_TRANSITIONS, from, to);
const assertSampleTransition = (from, to) => assertTransitionIn(SAMPLE_TRANSITIONS, from, to);
const applySampleTransition = (sample, to, actor) => applyTransitionIn(SAMPLE_TRANSITIONS, sample, to, actor);
const isSampleTerminal = (status) => SAMPLE_TERMINAL.includes(status);

module.exports = {
  RFQ_STATUS,
  RFQ_STATUSES,
  RFQ_TRANSITIONS,
  RFQ_TERMINAL,
  RFQ_CUSTOMER_EDITABLE,
  SAMPLE_STATUS,
  SAMPLE_STATUSES,
  SAMPLE_TRANSITIONS,
  SAMPLE_TERMINAL,
  InvalidTransitionError,
  nextRFQStatuses,
  canTransitionRFQ,
  assertRFQTransition,
  applyRFQTransition,
  isRFQTerminal,
  isRFQCustomerEditable,
  nextSampleStatuses,
  canTransitionSample,
  assertSampleTransition,
  applySampleTransition,
  isSampleTerminal
};
