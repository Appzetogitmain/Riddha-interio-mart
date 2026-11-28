import React, { useState, useEffect, useMemo } from 'react';
import {
  EMPTY_ORDER_FILTERS, ORDER_STATUSES, orderFilterChips, removeOrderChip,
} from '../utils/orderListFilters';

/**
 * Shared filter panel for the Order lists (admin + seller), same look/behaviour as ProductFilterBar.
 * variant: 'admin' shows Seller Type + Delivery Assignment; 'seller' shows Delivery Type.
 * hideStatus: for pages whose status is fixed by the route.
 */
const OrderFilterBar = ({ filters, onApply, variant = 'admin', hideStatus = false, accent = '#059669', orders = [] }) => {
  const [draft, setDraft] = useState(filters);
  useEffect(() => setDraft(filters), [filters]);

  const set = (k, v) => setDraft((d) => ({ ...d, [k]: v }));
  // Dropdowns filter immediately; text/number/date inputs wait for Apply (or Enter).
  const setNow = (k, v) => { const next = { ...draft, [k]: v }; setDraft(next); onApply(next); };

  // Only offer statuses that actually exist in the data, with counts.
  const statusOptions = useMemo(() => {
    const counts = {};
    orders.forEach((o) => { const st = o.status || 'Pending'; counts[st] = (counts[st] || 0) + 1; });
    const known = ORDER_STATUSES.filter((st) => counts[st]);
    const extra = Object.keys(counts).filter((st) => !ORDER_STATUSES.includes(st));
    const list = [...known, ...extra];
    if (draft.status && !list.includes(draft.status)) list.push(draft.status);
    return list.map((st) => ({ value: st, label: `${st} (${counts[st] || 0})` }));
  }, [orders, draft.status]);
  const apply = () => onApply(draft);
  const onKey = (e) => e.key === 'Enter' && apply();
  const clearAll = () => onApply({ ...EMPTY_ORDER_FILTERS });
  const chips = orderFilterChips(filters).filter((c) => !(hideStatus && c.key === 'status'));

  const sel = 'w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium focus:outline-none cursor-pointer disabled:opacity-50';
  const lbl = 'block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5';

  return (
    <div className="space-y-3">
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {!hideStatus && (
            <div>
              <label className={lbl}>Status</label>
              <select className={sel} value={draft.status} onChange={(e) => setNow('status', e.target.value)}>
                <option value="">All Status ({orders.length})</option>
                {statusOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className={lbl}>Payment Method</label>
            <select className={sel} value={draft.payment} onChange={(e) => setNow('payment', e.target.value)}>
              <option value="">All Methods</option>
              <option value="online">Online</option>
              <option value="cod">Cash on Delivery</option>
              <option value="wallet">Wallet / Manual</option>
            </select>
          </div>
          <div>
            <label className={lbl}>Payment Status</label>
            <select className={sel} value={draft.paymentStatus} onChange={(e) => setNow('paymentStatus', e.target.value)}>
              <option value="">All</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
          {variant === 'admin' ? (
            <>
              <div>
                <label className={lbl}>Seller Type</label>
                <select className={sel} value={draft.sellerType} onChange={(e) => setNow('sellerType', e.target.value)}>
                  <option value="">All Sellers</option>
                  <option value="direct">Riddha Mart / Direct</option>
                  <option value="marketplace">Marketplace Sellers</option>
                </select>
              </div>
              <div>
                <label className={lbl}>Delivery Assignment</label>
                <select className={sel} value={draft.assignment} onChange={(e) => setNow('assignment', e.target.value)}>
                  <option value="">All Orders</option>
                  <option value="assigned">Assigned</option>
                  <option value="unassigned">Unassigned</option>
                </select>
              </div>
            </>
          ) : (
            <div>
              <label className={lbl}>Delivery Type</label>
              <select className={sel} value={draft.deliveryType} onChange={(e) => setNow('deliveryType', e.target.value)}>
                <option value="">All Types</option>
                <option value="in-app">In-App Partner</option>
                <option value="seller-managed">Self-Managed</option>
                <option value="shiprocket">Shiprocket</option>
              </select>
            </div>
          )}
          <div>
            <label className={lbl}>From Date</label>
            <input type="date" className={sel} value={draft.fromDate} max={draft.toDate || undefined} onKeyDown={onKey} onChange={(e) => set('fromDate', e.target.value)} />
          </div>
          <div>
            <label className={lbl}>To Date</label>
            <input type="date" className={sel} value={draft.toDate} min={draft.fromDate || undefined} onKeyDown={onKey} onChange={(e) => set('toDate', e.target.value)} />
          </div>
          <div>
            <label className={lbl}>Amount Range (₹)</label>
            <div className="flex items-center gap-1.5">
              <input type="number" min="0" placeholder="Min" value={draft.minAmount} onKeyDown={onKey} onChange={(e) => set('minAmount', e.target.value)} className={sel + ' min-w-0'} />
              <span className="text-slate-400">-</span>
              <input type="number" min="0" placeholder="Max" value={draft.maxAmount} onKeyDown={onKey} onChange={(e) => set('maxAmount', e.target.value)} className={sel + ' min-w-0'} />
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
              <button type="button" aria-label={`Remove ${c.label}`} onClick={() => onApply(removeOrderChip(filters, c.key))}>✕</button>
            </span>
          ))}
          <button type="button" onClick={clearAll} className="text-xs font-bold underline" style={{ color: accent }}>Clear All</button>
        </div>
      )}
    </div>
  );
};

export default OrderFilterBar;
