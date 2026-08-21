const mongoose = require('mongoose');

/**
 * Shared atomic counter collection. `utils/invoiceNumberGenerator.js` registers
 * the same model name against the same collection, so the guard below keeps a
 * single compiled model no matter which module loads first.
 */
const CounterSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  seq: { type: Number, default: 0 }
});

const Counter = mongoose.models.Counter || mongoose.model('Counter', CounterSchema);

/**
 * Atomically increment and return the next value of a named sequence.
 * findOneAndUpdate with $inc is atomic at the document level, so concurrent
 * RFQ submissions can never receive the same number.
 */
const getNextSequenceValue = async (sequenceName) => {
  const doc = await Counter.findOneAndUpdate(
    { id: sequenceName },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return doc.seq;
};

/**
 * Build a per-year, zero-padded, strictly sequential document number.
 * e.g. buildNumber('RFQ') -> "RFQ-2026-0001"
 */
const buildNumber = async (prefix, { date = new Date(), pad = 4 } = {}) => {
  const year = date.getFullYear();
  const seq = await getNextSequenceValue(`${prefix.toLowerCase()}_${year}`);
  return `${prefix}-${year}-${String(seq).padStart(pad, '0')}`;
};

const generateRFQNumber = (date) => buildNumber('RFQ', { date });
const generateSampleRequestNumber = (date) => buildNumber('SMP', { date });

module.exports = {
  getNextSequenceValue,
  buildNumber,
  generateRFQNumber,
  generateSampleRequestNumber
};
