import React, { useState, useEffect } from 'react';
import { EMPTY_PRODUCT_FILTERS, productFilterChips, removeProductChip } from '../utils/productListFilters';

/** Shared filter panel for Product List (admin + seller). */
const ProductFilterBar = ({ filters, onApply, categories = [], brands = [], accent = '#059669' }) => {
  const [draft, setDraft] = useState(filters);
  useEffect(() => setDraft(filters), [filters]);

  const set = (k, v) => setDraft((d) => ({ ...d, [k]: v }));
  const apply = () => onApply(draft);
  const onKey = (e) => e.key === 'Enter' && apply();
  const clearAll = () => onApply({ ...EMPTY_PRODUCT_FILTERS });

  const subOptions = categories.find((c) => String(c._id) === draft.category)?.subcategories || [];
  const chips = productFilterChips(filters, categories);

  const sel = 'w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium focus:outline-none cursor-pointer disabled:opacity-50';
  const lbl = 'block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5';

  return (
    <div className="space-y-3">
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
          <div>
            <label className={lbl}>Category</label>
            <select className={sel} value={draft.category} onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value, subcategory: '' }))}>
              <option value="">All Categories</option>
              {categories.map((c) => <option key={c._id} value={String(c._id)}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className={lbl}>Sub Category</label>
            <select className={sel} value={draft.subcategory} disabled={!draft.category || subOptions.length === 0} onChange={(e) => set('subcategory', e.target.value)}>
              <option value="">{draft.category ? 'All Sub Categories' : 'Select category first'}</option>
              {subOptions.map((s) => <option key={s._id} value={String(s._id)}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className={lbl}>Brand</label>
            <select className={sel} value={draft.brand} onChange={(e) => set('brand', e.target.value)}>
              <option value="">All Brands</option>
              {brands.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label className={lbl}>Product Type</label>
            <select className={sel} value={draft.type} onChange={(e) => set('type', e.target.value)}>
              <option value="">All Types</option>
              <option value="single">Single Product</option>
              <option value="bundle">Bundle</option>
            </select>
          </div>
          <div>
            <label className={lbl}>Status</label>
            <select className={sel} value={draft.status} onChange={(e) => set('status', e.target.value)}>
              <option value="">All Status</option>
              <option value="draft">Draft</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div>
            <label className={lbl}>Stock</label>
            <select className={sel} value={draft.stock} onChange={(e) => set('stock', e.target.value)}>
              <option value="">All Stock</option>
              <option value="in">In Stock</option>
              <option value="low">Low Stock</option>
              <option value="out">Out of Stock</option>
            </select>
          </div>
          <div>
            <label className={lbl}>Price Range (B2C)</label>
            <div className="flex items-center gap-1.5">
              <input type="number" min="0" placeholder="Min" value={draft.minPrice} onKeyDown={onKey} onChange={(e) => set('minPrice', e.target.value)} className={sel + ' min-w-0'} />
              <span className="text-slate-400">-</span>
              <input type="number" min="0" placeholder="Max" value={draft.maxPrice} onKeyDown={onKey} onChange={(e) => set('maxPrice', e.target.value)} className={sel + ' min-w-0'} />
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3">
          <button type="button" onClick={clearAll} className="text-sm font-bold text-slate-600 hover:text-slate-900 px-3 py-2">↻ Clear All</button>
          <button type="button" onClick={apply} style={{ backgroundColor: accent }} className="text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:opacity-90 active:scale-95 transition-all">
            Apply Filters
          </button>
        </div>
      </div>

      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-bold text-slate-800">Active Filters:</span>
          {chips.map((c) => (
            <span key={c.key} className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-bold bg-emerald-50 border-emerald-200 text-slate-800">
              {c.label}
              <button type="button" aria-label={`Remove ${c.label}`} onClick={() => onApply(removeProductChip(filters, c.key))}>✕</button>
            </span>
          ))}
          <button type="button" onClick={clearAll} className="text-xs font-bold underline" style={{ color: accent }}>Clear All</button>
        </div>
      )}
    </div>
  );
};

export default ProductFilterBar;
