const mongoose = require('mongoose');

const CounterSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  seq: { type: Number, default: 0 }
});

const Counter = mongoose.models.Counter || mongoose.model('Counter', CounterSchema);

const getNextSequenceValue = async (sequenceName) => {
  const sequenceDocument = await Counter.findOneAndUpdate(
    { id: sequenceName },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return sequenceDocument.seq;
};

const getFinancialYear = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed, so 3 is April
  
  let startYear, endYear;
  if (month >= 3) { // April onwards
    startYear = year;
    endYear = year + 1;
  } else {
    startYear = year - 1;
    endYear = year;
  }
  
  // Format as YY-YY
  const yyStart = startYear.toString().slice(-2);
  const yyEnd = endYear.toString().slice(-2);
  return `${yyStart}-${yyEnd}`;
};

const generateInvoiceNumbers = async (order) => {
  let updated = false;
  
  if (!order.sellerInvoiceNumber) {
    const seq = await getNextSequenceValue('seller_invoice');
    const fy = getFinancialYear();
    const formattedSeq = seq.toString().padStart(6, '0');
    order.sellerInvoiceNumber = `INV/${fy}/${formattedSeq}`;
    updated = true;
  }
  
  if (!order.marketplaceInvoiceNumber) {
    const seq = await getNextSequenceValue('marketplace_invoice');
    const fy = getFinancialYear();
    const formattedSeq = seq.toString().padStart(6, '0');
    order.marketplaceInvoiceNumber = `RIMX-INV/${fy}/${formattedSeq}`;
    updated = true;
  }
  
  if (!order.eWayBillNumber) {
    // Generate a 12 digit random number for eWay bill
    const random12 = Math.floor(100000000000 + Math.random() * 900000000000).toString();
    // Format with spaces as: 2517 6458 3210
    order.eWayBillNumber = `${random12.slice(0, 4)} ${random12.slice(4, 8)} ${random12.slice(8, 12)}`;
    updated = true;
  }
  
  if (updated) {
    await order.save();
  }
  
  return order;
};

module.exports = {
  generateInvoiceNumbers
};
