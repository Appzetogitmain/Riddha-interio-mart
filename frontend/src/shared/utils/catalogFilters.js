export const LOW_STOCK_THRESHOLD = 10;

export const EMPTY_FILTERS = {
  category: '',
  brand: '',
  audience: '',
  stock: '',
  minPrice: '',
  maxPrice: '',
};

export const AUDIENCE_LABELS = {
  individual: 'Individual',
  enterpriser: 'Enterprise',
  both: 'Both',
};

export const STOCK_LABELS = {
  in: 'In Stock',
  low: 'Low Stock',
  out: 'Out of Stock',
};

export const getBrandName = (p) => (p?.brand && typeof p.brand === 'object' ? p.brand.name : '') || '';

export const getStockStatus = (p) => {
  const s = Number(p?.stock) || 0;
  if (s <= 0) return 'out';
  if (s <= LOW_STOCK_THRESHOLD) return 'low';
  return 'in';
};

export const matchesCatalogFilters = (p, search, f) => {
  const q = (search || '').trim().toLowerCase();
  if (q && !(p.name?.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q))) return false;
  if (f.category && p.category !== f.category) return false;
  if (f.brand && getBrandName(p) !== f.brand) return false;
  if (f.audience && (p.targetCustomer || 'both') !== f.audience) return false;
  if (f.stock && getStockStatus(p) !== f.stock) return false;
  const price = Number(p.price) || 0;
  if (f.minPrice !== '' && price < Number(f.minPrice)) return false;
  if (f.maxPrice !== '' && price > Number(f.maxPrice)) return false;
  return true;
};

export const activeFilterChips = (f) => {
  const chips = [];
  if (f.category) chips.push({ key: 'category', label: `Category: ${f.category}` });
  if (f.brand) chips.push({ key: 'brand', label: `Brand: ${f.brand}` });
  if (f.audience) chips.push({ key: 'audience', label: `Audience: ${AUDIENCE_LABELS[f.audience]}` });
  if (f.stock) chips.push({ key: 'stock', label: `Stock: ${STOCK_LABELS[f.stock]}` });
  if (f.minPrice !== '' || f.maxPrice !== '') {
    chips.push({ key: 'price', label: `Price: ₹${f.minPrice !== '' ? f.minPrice : 0} – ${f.maxPrice !== '' ? '₹' + f.maxPrice : 'Any'}` });
  }
  return chips;
};

export const removeChip = (f, key) =>
  key === 'price' ? { ...f, minPrice: '', maxPrice: '' } : { ...f, [key]: '' };
