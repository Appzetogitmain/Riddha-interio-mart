/**
 * Shared delivery-ETA buffer policy.
 *
 * A raw distance-based drive-time estimate is always a best case — it ignores traffic,
 * parking, finding the address, and load/unload time. Every place in the app that computes
 * a customer-facing delivery estimate should route the raw minutes through here so the
 * promised time has real slack instead of being the optimistic minimum.
 */

const MINUTES_PER_KM = 6;
const MIN_RAW_ETA_MINUTES = 10;
const DEFAULT_RAW_ETA_MINUTES = 25; // used when distance can't be computed at all

// Buffer: 20% padding on drive time, +10 min flat cushion for handoff/parking, plus extra
// time for bulk orders (more items to load, carry up, and unpack at the doorstep).
const BUFFER_MULTIPLIER = 1.2;
const FLAT_BUFFER_MINUTES = 10;
const PER_EXTRA_ITEM_MINUTES = 2;
const BULK_ITEM_THRESHOLD = 3; // buffer only grows once an order exceeds this many items
const MAX_BULK_BUFFER_MINUTES = 20;

const calculateBulkBufferMinutes = (itemCount = 1) => {
  const extraItems = Math.max(0, (Number(itemCount) || 1) - BULK_ITEM_THRESHOLD);
  return Math.min(MAX_BULK_BUFFER_MINUTES, extraItems * PER_EXTRA_ITEM_MINUTES);
};

// Applies the buffer policy to a raw drive-time estimate (in minutes).
const applyDeliveryBuffer = (rawMinutes, itemCount = 1) => {
  const base = Math.max(MIN_RAW_ETA_MINUTES, Math.round(Number(rawMinutes) || DEFAULT_RAW_ETA_MINUTES));
  return Math.round(base * BUFFER_MULTIPLIER) + FLAT_BUFFER_MINUTES + calculateBulkBufferMinutes(itemCount);
};

// Distance (km) -> buffered ETA minutes, in one step.
const estimateEtaMinutesFromDistance = (distanceKm, itemCount = 1) => {
  const rawMinutes = (typeof distanceKm === 'number' && !Number.isNaN(distanceKm))
    ? distanceKm * MINUTES_PER_KM
    : DEFAULT_RAW_ETA_MINUTES;
  return applyDeliveryBuffer(rawMinutes, itemCount);
};

module.exports = {
  MINUTES_PER_KM,
  MIN_RAW_ETA_MINUTES,
  DEFAULT_RAW_ETA_MINUTES,
  BUFFER_MULTIPLIER,
  FLAT_BUFFER_MINUTES,
  PER_EXTRA_ITEM_MINUTES,
  BULK_ITEM_THRESHOLD,
  MAX_BULK_BUFFER_MINUTES,
  applyDeliveryBuffer,
  estimateEtaMinutesFromDistance
};
