const test = require('node:test');
const assert = require('node:assert/strict');

const {
  RFQ_STATUS,
  RFQ_STATUSES,
  RFQ_TRANSITIONS,
  RFQ_TERMINAL,
  SAMPLE_STATUS,
  SAMPLE_STATUSES,
  SAMPLE_TRANSITIONS,
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
} = require('../utils/rfqStateMachine');

/**
 * Requirement A — RFQ / sample state machine.
 * Pure logic, no database: every branch of the transition engine is exercised.
 */

// -----------------------------------------------------------------------------
// RFQ — shape
// -----------------------------------------------------------------------------

test('RFQ: every status in the enum has a transition entry', () => {
  for (const status of RFQ_STATUSES) {
    assert.ok(
      Object.prototype.hasOwnProperty.call(RFQ_TRANSITIONS, status),
      `missing transition table entry for "${status}"`
    );
  }
});

test('RFQ: every transition target is itself a known status', () => {
  for (const [from, targets] of Object.entries(RFQ_TRANSITIONS)) {
    for (const to of targets) {
      assert.ok(RFQ_STATUSES.includes(to), `"${from}" points at unknown status "${to}"`);
    }
  }
});

test('RFQ: terminal statuses have no outgoing transitions', () => {
  for (const status of RFQ_TERMINAL) {
    assert.deepEqual(RFQ_TRANSITIONS[status], [], `"${status}" should be terminal`);
    assert.equal(isRFQTerminal(status), true);
  }
  assert.equal(isRFQTerminal(RFQ_STATUS.SUBMITTED), false);
});

// -----------------------------------------------------------------------------
// RFQ — the happy path from the spec
// -----------------------------------------------------------------------------

test('RFQ: the full documented lifecycle is walkable end to end', () => {
  const path = [
    RFQ_STATUS.SUBMITTED,
    RFQ_STATUS.UNDER_REVIEW,
    RFQ_STATUS.QUOTED,
    RFQ_STATUS.NEGOTIATION,
    RFQ_STATUS.ACCEPTED,
    RFQ_STATUS.CONVERTED_TO_ORDER
  ];

  const rfq = { status: path[0], statusHistory: [] };
  for (let i = 1; i < path.length; i += 1) {
    assert.equal(canTransitionRFQ(path[i - 1], path[i]), true, `${path[i - 1]} -> ${path[i]} should be allowed`);
    applyRFQTransition(rfq, path[i], { id: 'actor-1', role: 'user', note: `step ${i}` });
  }

  assert.equal(rfq.status, RFQ_STATUS.CONVERTED_TO_ORDER);
  assert.equal(rfq.statusHistory.length, path.length - 1);
});

test('RFQ: negotiation can bounce back to quoted when the seller revises', () => {
  assert.equal(canTransitionRFQ(RFQ_STATUS.NEGOTIATION, RFQ_STATUS.QUOTED), true);
});

test('RFQ: a seller may quote straight from submitted without an explicit review step', () => {
  assert.equal(canTransitionRFQ(RFQ_STATUS.SUBMITTED, RFQ_STATUS.QUOTED), true);
});

test('RFQ: rejected and expired are reachable from every open status', () => {
  const open = [RFQ_STATUS.SUBMITTED, RFQ_STATUS.UNDER_REVIEW, RFQ_STATUS.QUOTED, RFQ_STATUS.NEGOTIATION];
  for (const status of open) {
    assert.equal(canTransitionRFQ(status, RFQ_STATUS.REJECTED), true, `${status} -> rejected`);
    assert.equal(canTransitionRFQ(status, RFQ_STATUS.EXPIRED), true, `${status} -> expired`);
  }
});

// -----------------------------------------------------------------------------
// RFQ — illegal moves
// -----------------------------------------------------------------------------

test('RFQ: an accepted quote cannot skip back to negotiation', () => {
  assert.equal(canTransitionRFQ(RFQ_STATUS.ACCEPTED, RFQ_STATUS.NEGOTIATION), false);
});

test('RFQ: a submitted RFQ cannot jump straight to accepted', () => {
  assert.equal(canTransitionRFQ(RFQ_STATUS.SUBMITTED, RFQ_STATUS.ACCEPTED), false);
});

test('RFQ: an expired RFQ cannot be revived', () => {
  for (const status of RFQ_STATUSES) {
    assert.equal(canTransitionRFQ(RFQ_STATUS.EXPIRED, status), false, `expired -> ${status}`);
  }
});

test('RFQ: a converted RFQ cannot be converted twice', () => {
  assert.equal(canTransitionRFQ(RFQ_STATUS.CONVERTED_TO_ORDER, RFQ_STATUS.CONVERTED_TO_ORDER), false);
});

test('RFQ: assertRFQTransition throws InvalidTransitionError naming the allowed moves', () => {
  assert.throws(
    () => assertRFQTransition(RFQ_STATUS.SUBMITTED, RFQ_STATUS.ACCEPTED),
    (err) => {
      assert.ok(err instanceof InvalidTransitionError);
      assert.equal(err.statusCode, 400);
      assert.equal(err.from, RFQ_STATUS.SUBMITTED);
      assert.equal(err.to, RFQ_STATUS.ACCEPTED);
      assert.deepEqual(err.allowed, nextRFQStatuses(RFQ_STATUS.SUBMITTED));
      assert.match(err.message, /under_review/);
      return true;
    }
  );
});

test('RFQ: transitioning out of a terminal status reports it as terminal', () => {
  assert.throws(
    () => assertRFQTransition(RFQ_STATUS.REJECTED, RFQ_STATUS.QUOTED),
    /terminal state/
  );
});

test('RFQ: an unknown source status is rejected rather than silently allowed', () => {
  assert.throws(
    () => assertRFQTransition('not_a_status', RFQ_STATUS.QUOTED),
    InvalidTransitionError
  );
});

// -----------------------------------------------------------------------------
// RFQ — audit history
// -----------------------------------------------------------------------------

test('RFQ: applyRFQTransition records actor, role, note and timestamp', () => {
  const before = Date.now();
  const rfq = { status: RFQ_STATUS.SUBMITTED, statusHistory: [] };

  applyRFQTransition(rfq, RFQ_STATUS.UNDER_REVIEW, { id: 'admin-9', role: 'admin', note: 'Opened by the Riddha team.' });

  const [entry] = rfq.statusHistory;
  assert.equal(rfq.status, RFQ_STATUS.UNDER_REVIEW);
  assert.equal(entry.status, RFQ_STATUS.UNDER_REVIEW);
  assert.equal(entry.changedBy, 'admin-9');
  assert.equal(entry.changedByRole, 'admin');
  assert.equal(entry.note, 'Opened by the Riddha team.');
  assert.ok(entry.changedAt.getTime() >= before);
});

test('RFQ: applyRFQTransition defaults to a system actor with an empty note', () => {
  const rfq = { status: RFQ_STATUS.QUOTED, statusHistory: [] };
  applyRFQTransition(rfq, RFQ_STATUS.EXPIRED);

  const [entry] = rfq.statusHistory;
  assert.equal(entry.changedBy, null);
  assert.equal(entry.changedByRole, 'system');
  assert.equal(entry.note, '');
});

test('RFQ: applyRFQTransition creates statusHistory when the document has none', () => {
  const rfq = { status: RFQ_STATUS.SUBMITTED };
  applyRFQTransition(rfq, RFQ_STATUS.UNDER_REVIEW, { role: 'system' });
  assert.equal(Array.isArray(rfq.statusHistory), true);
  assert.equal(rfq.statusHistory.length, 1);
});

test('RFQ: a rejected transition leaves the document untouched', () => {
  const rfq = { status: RFQ_STATUS.SUBMITTED, statusHistory: [] };
  assert.throws(() => applyRFQTransition(rfq, RFQ_STATUS.CONVERTED_TO_ORDER), InvalidTransitionError);
  assert.equal(rfq.status, RFQ_STATUS.SUBMITTED);
  assert.equal(rfq.statusHistory.length, 0);
});

test('RFQ: nextRFQStatuses returns a copy, so callers cannot mutate the table', () => {
  const next = nextRFQStatuses(RFQ_STATUS.SUBMITTED);
  next.push('tampered');
  assert.equal(nextRFQStatuses(RFQ_STATUS.SUBMITTED).includes('tampered'), false);
});

test('RFQ: nextRFQStatuses is empty for an unknown status', () => {
  assert.deepEqual(nextRFQStatuses('nope'), []);
});

// -----------------------------------------------------------------------------
// RFQ — customer edit window
// -----------------------------------------------------------------------------

test('RFQ: the customer may edit only before a quote lands', () => {
  assert.equal(isRFQCustomerEditable(RFQ_STATUS.SUBMITTED), true);
  assert.equal(isRFQCustomerEditable(RFQ_STATUS.UNDER_REVIEW), true);
  assert.equal(isRFQCustomerEditable(RFQ_STATUS.QUOTED), false);
  assert.equal(isRFQCustomerEditable(RFQ_STATUS.NEGOTIATION), false);
  assert.equal(isRFQCustomerEditable(RFQ_STATUS.ACCEPTED), false);
});

// -----------------------------------------------------------------------------
// Sample requests
// -----------------------------------------------------------------------------

test('Sample: every status in the enum has a transition entry', () => {
  for (const status of SAMPLE_STATUSES) {
    assert.ok(Object.prototype.hasOwnProperty.call(SAMPLE_TRANSITIONS, status), `missing entry for "${status}"`);
  }
});

test('Sample: the documented lifecycle is walkable end to end', () => {
  const path = [
    SAMPLE_STATUS.REQUESTED,
    SAMPLE_STATUS.APPROVED,
    SAMPLE_STATUS.DISPATCHED,
    SAMPLE_STATUS.DELIVERED,
    SAMPLE_STATUS.FEEDBACK_GIVEN
  ];

  const sample = { status: path[0], statusHistory: [] };
  for (let i = 1; i < path.length; i += 1) {
    applySampleTransition(sample, path[i], { id: 'u1', role: 'user' });
  }

  assert.equal(sample.status, SAMPLE_STATUS.FEEDBACK_GIVEN);
  assert.equal(sample.statusHistory.length, 4);
  assert.equal(isSampleTerminal(sample.status), true);
});

test('Sample: a request can be declined while requested or approved', () => {
  assert.equal(canTransitionSample(SAMPLE_STATUS.REQUESTED, SAMPLE_STATUS.DECLINED), true);
  assert.equal(canTransitionSample(SAMPLE_STATUS.APPROVED, SAMPLE_STATUS.DECLINED), true);
  // Once it is on a courier it is too late to decline.
  assert.equal(canTransitionSample(SAMPLE_STATUS.DISPATCHED, SAMPLE_STATUS.DECLINED), false);
});

test('Sample: dispatch requires approval first', () => {
  assert.equal(canTransitionSample(SAMPLE_STATUS.REQUESTED, SAMPLE_STATUS.DISPATCHED), false);
  assert.throws(
    () => assertSampleTransition(SAMPLE_STATUS.REQUESTED, SAMPLE_STATUS.DISPATCHED),
    InvalidTransitionError
  );
});

test('Sample: feedback cannot be given before delivery', () => {
  assert.equal(canTransitionSample(SAMPLE_STATUS.DISPATCHED, SAMPLE_STATUS.FEEDBACK_GIVEN), false);
  assert.equal(canTransitionSample(SAMPLE_STATUS.DELIVERED, SAMPLE_STATUS.FEEDBACK_GIVEN), true);
});

test('Sample: feedback can only be given once', () => {
  const sample = { status: SAMPLE_STATUS.DELIVERED, statusHistory: [] };
  applySampleTransition(sample, SAMPLE_STATUS.FEEDBACK_GIVEN, { role: 'user' });
  assert.throws(
    () => applySampleTransition(sample, SAMPLE_STATUS.FEEDBACK_GIVEN, { role: 'user' }),
    InvalidTransitionError
  );
});

test('Sample: declined is terminal', () => {
  assert.deepEqual(nextSampleStatuses(SAMPLE_STATUS.DECLINED), []);
  assert.equal(isSampleTerminal(SAMPLE_STATUS.DECLINED), true);
  assert.equal(isSampleTerminal(SAMPLE_STATUS.DELIVERED), false);
});

test('Sample: transitions carry the same audit fields as RFQs', () => {
  const sample = { status: SAMPLE_STATUS.REQUESTED, statusHistory: [] };
  applySampleTransition(sample, SAMPLE_STATUS.DECLINED, { id: 'seller-3', role: 'seller', note: 'Out of stock.' });

  const [entry] = sample.statusHistory;
  assert.equal(entry.status, SAMPLE_STATUS.DECLINED);
  assert.equal(entry.changedBy, 'seller-3');
  assert.equal(entry.changedByRole, 'seller');
  assert.equal(entry.note, 'Out of stock.');
});
