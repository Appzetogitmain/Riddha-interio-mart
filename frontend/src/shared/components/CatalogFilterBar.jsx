import React, { useState, useEffect } from 'react';
import { EMPTY_FILTERS, activeFilterChips, removeChip } from '../utils/catalogFilters';

/**
 * Shared filter row for the Product Catalog (admin + seller).
 * Props: filters (applied), onApply(filters), categories[], brands[], accent (tailwind color classes)
 */
const CatalogFilterBar = ({ filters, onApply, categories = [], brands = [], accent = '#240046' }) => {
  const [draft, setDraft] = useState(filters);

  useEffect(() => setDraft(filters), [filters]);

  const set = (k, v) => setDraft((d) => ({ ...d, [k]: v }));
  const apply = () => onApply(draft);
  const onKey = (e) => e.key === 'Enter' && apply();

  const selectCls = 'w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium focus:outline-none cursor-pointer';
  const labelCls = 'block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5';
  const chips = activeFilterChips(filters);

  return (
    <div className="space-y-3">
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 items-end">
        <div>
          <label className={labelCls}>Category</label>
          <select className={selectCls} value={draft.category} onChange={(e) => set('category', e.target.value)}>
            <option value="">All Categories</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Brand Partner</label>
          <select className={selectCls} value={draft.brand} onChange={(e) => set('brand', e.target.value)}>
            <option value="">All Brands</option>
            {brands.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Target Audience</label>
          <select className={selectCls} value={draft.audience} onChange={(e) => set('audience', e.target.value)}>
            <option value="">All Audiences</option>
            <option value="individual">Individual</option>
            <option value="enterpriser">Enterprise</option>
            <option value="both">Both</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Stock Status</label>
          <select className={selectCls} value={draft.stock} onChange={(e) => set('stock', e.target.value)}>
            <option value="">All Stock</option>
            <option value="in">In Stock</option>
            <option value="low">Low Stock</option>
            <option value="out">Out of Stock</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Price Range (₹)</label>
          <div className="flex items-center gap-1.5">
            <input type="number" min="0" placeholder="Min" value={draft.minPrice} onKeyDown={onKey}
              onChange={(e) => set('minPrice', e.target.value)} className={selectCls + ' min-w-0'} />
            <span className="text-slate-400">–</span>
            <input type="number" min="0" placeholder="Max" value={draft.maxPrice} onKeyDown={onKey}
              onChange={(e) => set('maxPrice', e.target.value)} className={selectCls + ' min-w-0'} />
          </div>
        </div>
        <button type="button" onClick={apply} style={{ backgroundColor: accent }}
          className="text-white px-4 py-2.5 rounded-xl font-bold text-sm hover:opacity-90 active:scale-95 transition-all">
          Apply Filters
        </button>
      </div>

      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-bold text-slate-800">Active Filters:</span>
          {chips.map((c) => (
            <span key={c.key} className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-bold bg-purple-50 border-purple-200 text-slate-800">
              {c.label}
              <button type="button" aria-label={`Remove ${c.label}`} onClick={() => onApply(removeChip(filters, c.key))}>✕</button>
            </span>
          ))}
          <button type="button" onClick={() => onApply({ ...EMPTY_FILTERS })} className="text-xs font-bold underline" style={{ color: accent }}>
            Clear All
          </button>
        </div>
      )}
    </div>
  );
};

export default CatalogFilterBar;
