import { LOW_STOCK_THRESHOLD } from './catalogFilters';

export const EMPTY_PRODUCT_FILTERS = {
  category: '', subcategory: '', brand: '', type: '', status: '', stock: '', minPrice: '', maxPrice: '',
};

export const STATUS_LABELS = { draft: 'Draft', pending: 'Pending', approved: 'Approved', rejected: 'Rejected' };
export const TYPE_LABELS = { single: 'Single Product', bundle: 'Bundle' };
export const PRODUCT_STOCK_LABELS = { in: 'In Stock', low: 'Low Stock', out: 'Out of Stock' };

export const productStatus = (p) =>
  (p.approvalStatus || p.status || (p.isActive ? 'approved' : 'pending')).toLowerCase();

export const productStockStatus = (p) => {
  const s = Number(p.countInStock ?? p.stock) || 0;
  if (s <= 0) return 'out';
  return s <= LOW_STOCK_THRESHOLD ? 'low' : 'in';
};

// priceOf: which price the range applies to (admin: final B2C price, seller: their own price)
export const matchesProductFilters = (p, search, f, priceOf = (x) => Number(x.price) || 0) => {
  const q = (search || '').trim().toLowerCase();
  if (q && !(p.name?.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q))) return false;
  if (f.category && String(p.categoryId || p.category?._id || '') !== f.category) return false;
  if (f.subcategory && String(p.subcategory || '') !== f.subcategory) return false;
  if (f.brand && (p.brand?.name || '') !== f.brand) return false;
  if (f.type && (p.isBundle ? 'bundle' : 'single') !== f.type) return false;
  if (f.status && productStatus(p) !== f.status) return false;
  if (f.stock && productStockStatus(p) !== f.stock) return false;
  const price = priceOf(p);
  if (f.minPrice !== '' && price < Number(f.minPrice)) return false;
  if (f.maxPrice !== '' && price > Number(f.maxPrice)) return false;
  return true;
};

export const productFilterChips = (f, categories = []) => {
  const chips = [];
  const cat = categories.find((c) => String(c._id) === f.category);
  const sub = cat?.subcategories?.find((s) => String(s._id) === f.subcategory);
  if (f.category) chips.push({ key: 'category', label: `Category: ${cat?.name || f.category}` });
  if (f.subcategory) chips.push({ key: 'subcategory', label: `Sub Category: ${sub?.name || f.subcategory}` });
  if (f.brand) chips.push({ key: 'brand', label: `Brand: ${f.brand}` });
  if (f.type) chips.push({ key: 'type', label: `Type: ${TYPE_LABELS[f.type]}` });
  if (f.status) chips.push({ key: 'status', label: `Status: ${STATUS_LABELS[f.status]}` });
  if (f.stock) chips.push({ key: 'stock', label: `Stock: ${PRODUCT_STOCK_LABELS[f.stock]}` });
  if (f.minPrice !== '' || f.maxPrice !== '') {
    chips.push({ key: 'price', label: `Price: ₹${f.minPrice !== '' ? f.minPrice : 0} – ${f.maxPrice !== '' ? '₹' + f.maxPrice : 'Any'}` });
  }
  return chips;
};

export const removeProductChip = (f, key) => {
  if (key === 'price') return { ...f, minPrice: '', maxPrice: '' };
  if (key === 'category') return { ...f, category: '', subcategory: '' };
  return { ...f, [key]: '' };
};
