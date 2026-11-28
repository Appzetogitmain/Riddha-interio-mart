export const EMPTY_ORDER_FILTERS = {
  status: '', payment: '', paymentStatus: '', sellerType: '', assignment: '', deliveryType: '',
  fromDate: '', toDate: '', minAmount: '', maxAmount: '',
};

export const ORDER_STATUSES = ['Pending', 'Processing', 'Packed', 'Shipped', 'Delivered', 'Cancelled', 'Returned'];
export const PAYMENT_LABELS = { online: 'Online', cod: 'Cash on Delivery', wallet: 'Wallet / Manual' };
export const PAYMENT_STATUS_LABELS = { pending: 'Pending', paid: 'Paid', failed: 'Failed', refunded: 'Refunded' };
export const SELLER_TYPE_LABELS = { direct: 'Riddha Mart / Direct', marketplace: 'Marketplace Sellers' };
export const ASSIGNMENT_LABELS = { assigned: 'Assigned', unassigned: 'Unassigned' };
export const DELIVERY_TYPE_LABELS = { 'in-app': 'In-App Partner', 'seller-managed': 'Self-Managed', shiprocket: 'Shiprocket' };

const dayStart = (s) => { const d = new Date(s); d.setHours(0, 0, 0, 0); return d; };
const dayEnd = (s) => { const d = new Date(s); d.setHours(23, 59, 59, 999); return d; };

const paymentKind = (order) => {
  const m = String(order.paymentMethod || 'Online').toLowerCase();
  if (m.includes('cod') || m.includes('cash')) return 'cod';
  if (m.includes('wallet') || m.includes('manual')) return 'wallet';
  return 'online';
};

/** Returns true when `order` passes every active filter (search is handled by the page). */
export const matchesOrderFilters = (order, f) => {
  if (f.status && String(order.status || 'Pending').toLowerCase() !== f.status.toLowerCase()) return false;
  if (f.payment && paymentKind(order) !== f.payment) return false;
  if (f.paymentStatus && String(order.paymentStatus || 'pending').toLowerCase() !== f.paymentStatus) return false;
  if (f.sellerType === 'direct' && order.sellerType !== 'Admin') return false;
  if (f.sellerType === 'marketplace' && order.sellerType === 'Admin') return false;
  if (f.assignment) {
    const assigned = Boolean(order.deliveryBoy) || Boolean(order.deliveryStatus && order.deliveryStatus !== 'None');
    if (f.assignment === 'assigned' && !assigned) return false;
    if (f.assignment === 'unassigned' && assigned) return false;
  }
  if (f.deliveryType && order.deliveryType !== f.deliveryType) return false;
  if (f.fromDate || f.toDate) {
    const t = order.createdAt ? new Date(order.createdAt) : null;
    if (!t || isNaN(t)) return false;
    if (f.fromDate && t < dayStart(f.fromDate)) return false;
    if (f.toDate && t > dayEnd(f.toDate)) return false;
  }
  const amount = Number(order.totalPrice) || 0;
  if (f.minAmount !== '' && amount < Number(f.minAmount)) return false;
  if (f.maxAmount !== '' && amount > Number(f.maxAmount)) return false;
  return true;
};

export const orderFilterChips = (f) => {
  const chips = [];
  if (f.status) chips.push({ key: 'status', label: `Status: ${f.status}` });
  if (f.payment) chips.push({ key: 'payment', label: `Payment: ${PAYMENT_LABELS[f.payment]}` });
  if (f.paymentStatus) chips.push({ key: 'paymentStatus', label: `Payment Status: ${PAYMENT_STATUS_LABELS[f.paymentStatus]}` });
  if (f.sellerType) chips.push({ key: 'sellerType', label: `Seller: ${SELLER_TYPE_LABELS[f.sellerType]}` });
  if (f.assignment) chips.push({ key: 'assignment', label: `Delivery: ${ASSIGNMENT_LABELS[f.assignment]}` });
  if (f.deliveryType) chips.push({ key: 'deliveryType', label: `Delivery Type: ${DELIVERY_TYPE_LABELS[f.deliveryType]}` });
  if (f.fromDate || f.toDate) chips.push({ key: 'date', label: `Date: ${f.fromDate || 'Any'} → ${f.toDate || 'Any'}` });
  if (f.minAmount !== '' || f.maxAmount !== '') {
    chips.push({ key: 'amount', label: `Amount: ₹${f.minAmount !== '' ? f.minAmount : 0} – ${f.maxAmount !== '' ? '₹' + f.maxAmount : 'Any'}` });
  }
  return chips;
};

export const removeOrderChip = (f, key) => {
  if (key === 'date') return { ...f, fromDate: '', toDate: '' };
  if (key === 'amount') return { ...f, minAmount: '', maxAmount: '' };
  return { ...f, [key]: '' };
};
