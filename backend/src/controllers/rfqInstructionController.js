const mongoose = require('mongoose');
const RFQInstruction = require('../models/RFQInstruction');

const FIELDS = ['pageHeading', 'pageSubheading', 'title', 'description', 'placeholder', 'uploadHint', 'isActive'];

const pick = (body) => FIELDS.reduce((acc, k) => (body[k] !== undefined ? { ...acc, [k]: body[k] } : acc), {});
const validCategory = (v) => v && mongoose.Types.ObjectId.isValid(v);

// GET /api/rfq/instructions/resolve?category=<id>  — category entry, else default, else null
exports.resolveInstruction = async (req, res, next) => {
  try {
    const { category } = req.query;
    let doc = null;
    if (validCategory(category)) {
      doc = await RFQInstruction.findOne({ category, isActive: true }).lean();
    }
    if (!doc) doc = await RFQInstruction.findOne({ category: null, isActive: true }).lean();
    res.json({ success: true, data: doc });
  } catch (err) { next(err); }
};

// GET /api/rfq/instructions  (admin)
exports.listInstructions = async (req, res, next) => {
  try {
    const data = await RFQInstruction.find().populate('category', 'name').sort({ updatedAt: -1 }).lean();
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

// POST /api/rfq/instructions  (admin) — body.category empty/null = default
exports.createInstruction = async (req, res, next) => {
  try {
    const category = validCategory(req.body.category) ? req.body.category : null;
    if (await RFQInstruction.exists({ category })) {
      return res.status(400).json({ success: false, error: category ? 'This category already has instructions. Edit the existing entry.' : 'A default entry already exists. Edit it instead.' });
    }
    const doc = await RFQInstruction.create({ ...pick(req.body), category });
    res.status(201).json({ success: true, data: doc });
  } catch (err) { next(err); }
};

// PUT /api/rfq/instructions/:id  (admin)
exports.updateInstruction = async (req, res, next) => {
  try {
    const doc = await RFQInstruction.findByIdAndUpdate(req.params.id, pick(req.body), { new: true, runValidators: true });
    if (!doc) return res.status(404).json({ success: false, error: 'Instruction not found.' });
    res.json({ success: true, data: doc });
  } catch (err) { next(err); }
};

// DELETE /api/rfq/instructions/:id  (admin)
exports.deleteInstruction = async (req, res, next) => {
  try {
    const doc = await RFQInstruction.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ success: false, error: 'Instruction not found.' });
    res.json({ success: true, data: {} });
  } catch (err) { next(err); }
};
