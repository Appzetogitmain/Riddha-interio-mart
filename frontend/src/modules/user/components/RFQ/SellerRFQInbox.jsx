import React, { useState, useEffect, useCallback } from 'react';
import { FiClock, FiPackage, FiCalendar, FiInbox, FiSend, FiPlus, FiTrash2 } from 'react-icons/fi';
import toast from 'react-hot-toast';

import RFQMessageThread from './RFQMessageThread';
import {
  rfqService, RFQ_STATUS_LABELS, RFQ_STATUS_STYLES,
  RFQ_UNIT_LABELS, formatCurrency, slaCountdown
} from '../../services/rfqService';

const TABS = [
  { value: 'submitted,under_review', label: 'Needs a quote' },
  { value: 'quoted,negotiation', label: 'Quoted' },
  { value: 'accepted,converted_to_order', label: 'Won' },
  { value: '', label: 'All' }
];

const emptyQuoteLine = (line = {}) => ({
  description: line.productDescription || '',
  quantity: line.quantity || 1,
  unit: line.unit || 'pcs',
  unitRate: '',
  taxRate: 18,
  productId: line.productId || ''
});

/**
 * Requirement A — the seller's RFQ inbox with a live SLA timer, plus the
 * quote composer. A seller only ever sees the RFQs routed to them and their own
 * quotation; competitors' pricing is never sent to the client.
 */
const SellerRFQInbox = () => {
  const [rfqs, setRfqs] = useState([]);
  const [status, setStatus] = useState(TABS[0].value);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(null);
  const [quoteLines, setQuoteLines] = useState([]);
  const [quoteMeta, setQuoteMeta] = useState({ leadTimeDays: 14, deliveryCharges: 0, installationCost: 0, notes: '' });
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await rfqService.getRFQs({ status: status || undefined, limit: 50 });
      if (res.success) setRfqs(res.data || []);
    } catch {
      toast.error('We could not load your RFQ inbox.');
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => { load(); }, [load]);

  // Refresh the SLA countdowns without refetching.
  const [, forceTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => forceTick((n) => n + 1), 60000);
    return () => clearInterval(timer);
  }, []);

  const open = async (rfqId) => {
    try {
      const res = await rfqService.getRFQById(rfqId);
      if (res.success) {
        setActive(res.data);
        setQuoteLines(res.data.lineItems.map(emptyQuoteLine));
        setQuoteMeta({ leadTimeDays: 14, deliveryCharges: 0, installationCost: 0, notes: '' });
      }
    } catch (err) {
      toast.error(err?.response?.data?.error || 'We could not open that RFQ.');
    }
  };

  const updateLine = (index, field, value) => {
    setQuoteLines((prev) => prev.map((l, i) => (i === index ? { ...l, [field]: value } : l)));
  };

  const quoteTotals = quoteLines.reduce((acc, line) => {
    const amount = (Number(line.quantity) || 0) * (Number(line.unitRate) || 0);
    const tax = (amount * (Number(line.taxRate) || 0)) / 100;
    return { subtotal: acc.subtotal + amount, tax: acc.tax + tax };
  }, { subtotal: 0, tax: 0 });

  const grandTotal = quoteTotals.subtotal + quoteTotals.tax
    + (Number(quoteMeta.deliveryCharges) || 0) + (Number(quoteMeta.installationCost) || 0);

  const submitQuote = async (e) => {
    e.preventDefault();

    const invalid = quoteLines.findIndex((l) => !l.description.trim() || !Number(l.quantity) || Number(l.unitRate) <= 0);
    if (invalid >= 0) {
      toast.error(`Line ${invalid + 1} needs a description, a quantity and a rate above zero.`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await rfqService.submitQuote(active._id, {
        items: quoteLines.map((l) => ({
          description: l.description.trim(),
          quantity: Number(l.quantity),
          unit: l.unit,
          unitRate: Number(l.unitRate),
          taxRate: Number(l.taxRate),
          productId: l.productId || undefined
        })),
        leadTimeDays: Number(quoteMeta.leadTimeDays) || 14,
        deliveryCharges: Number(quoteMeta.deliveryCharges) || 0,
        installationCost: Number(quoteMeta.installationCost) || 0,
        notes: quoteMeta.notes
      });

      if (res.success) {
        toast.success(res.message);
        setActive(null);
        load();
      }
    } catch (err) {
      toast.error(err?.response?.data?.error || 'The quotation could not be sent.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputBase = 'w-full rounded-lg border border-soft-oatmeal bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-seller-primary/30';

  // ---------------------------------------------------------------- detail
  if (active) {
    const sla = slaCountdown(active.slaDueAt, active.firstResponseAt);
    const alreadyQuoted = (active.quotations || []).length > 0;

    return (
      <div className="space-y-5">
        <button
          type="button"
          onClick={() => setActive(null)}
          className="text-sm font-semibold text-seller-primary hover:underline"
        >
          ← Back to inbox
        </button>

        <header className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-bold text-slate-900">{active.rfqNumber}</h2>
              <p className="text-sm text-slate-500">
                {active.projectName || `${active.lineItems.length} line item(s)`}
                {active.competitorCount > 0 && (
                  <span className="ml-2 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
                    competing with {active.competitorCount} other seller(s)
                  </span>
                )}
              </p>
            </div>
            <div className={`rounded-lg border px-3 py-2 text-xs font-semibold ${
              sla.tone === 'breach' ? 'border-red-200 bg-red-50 text-red-700'
                : sla.tone === 'warn' ? 'border-amber-200 bg-amber-50 text-amber-700'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-700'
            }`}
            >
              <FiClock className="mr-1 inline h-3.5 w-3.5" /> {sla.label}
            </div>
          </div>

          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-400">Required by</dt>
              <dd className="text-slate-900">{new Date(active.requiredDate).toLocaleDateString('en-IN')}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-400">Deliver to</dt>
              <dd className="text-slate-900">
                {[active.deliveryLocation?.city, active.deliveryLocation?.pincode].filter(Boolean).join(' · ')}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-400">Buyer</dt>
              <dd className="text-slate-900">{active.companyName || active.customerId?.fullName || 'Customer'}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-400">GSTIN</dt>
              <dd className="text-slate-900">{active.gstin || '—'}</dd>
            </div>
          </dl>

          {active.specialRequirements && (
            <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
              <span className="font-semibold">Special requirements: </span>{active.specialRequirements}
            </p>
          )}

          {(active.attachments || []).length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-2">
              {active.attachments.map((file) => (
                <li key={file.url}>
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
                  >
                    {file.filename || 'Attachment'}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </header>

        <form onSubmit={submitQuote} className="rounded-2xl border border-slate-200 bg-white p-5">
          <h3 className="mb-1 font-display text-base font-bold text-slate-900">
            {alreadyQuoted ? 'Send a revised quotation' : 'Build your quotation'}
          </h3>
          <p className="mb-4 text-xs text-slate-500">
            Link a catalogue product on every line — an accepted quote can only become an order when each line maps to a product.
          </p>

          <div className="space-y-3">
            {quoteLines.map((line, index) => {
              const source = active.lineItems[index];
              return (
                <div key={index} className="rounded-xl border border-slate-200 p-3">
                  {source && (
                    <p className="mb-2 text-xs text-slate-500">
                      Buyer asked for: <span className="font-medium text-slate-700">
                        {source.quantity} {RFQ_UNIT_LABELS[source.unit] || source.unit} {source.productDescription}
                      </span>
                      {source.size && ` · ${source.size}`}
                      {source.finish && ` · ${source.finish}`}
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-2 md:grid-cols-12">
                    <div className="col-span-2 md:col-span-5">
                      <input
                        type="text"
                        value={line.description}
                        onChange={(e) => updateLine(index, 'description', e.target.value)}
                        placeholder="What you are quoting"
                        className={inputBase}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={line.quantity}
                        onChange={(e) => updateLine(index, 'quantity', e.target.value)}
                        placeholder="Qty"
                        className={inputBase}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={line.unitRate}
                        onChange={(e) => updateLine(index, 'unitRate', e.target.value)}
                        placeholder="Rate"
                        className={inputBase}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <select
                        value={line.taxRate}
                        onChange={(e) => updateLine(index, 'taxRate', Number(e.target.value))}
                        className={inputBase}
                      >
                        {[0, 5, 12, 18].map((rate) => <option key={rate} value={rate}>{rate}% GST</option>)}
                      </select>
                    </div>
                    <div className="flex items-center justify-end md:col-span-1">
                      {quoteLines.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setQuoteLines((prev) => prev.filter((_, i) => i !== index))}
                          className="rounded p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                          aria-label={`Remove quote line ${index + 1}`}
                        >
                          <FiTrash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <div className="col-span-2 md:col-span-12">
                      <input
                        type="text"
                        value={line.productId}
                        onChange={(e) => updateLine(index, 'productId', e.target.value)}
                        placeholder="Catalogue product ID (required to convert into an order)"
                        className={`${inputBase} text-xs`}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setQuoteLines((prev) => [...prev, emptyQuoteLine()])}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            <FiPlus className="h-4 w-4" /> Add a line
          </button>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-500">Lead time (days)</label>
              <input
                type="number" min="1"
                value={quoteMeta.leadTimeDays}
                onChange={(e) => setQuoteMeta({ ...quoteMeta, leadTimeDays: e.target.value })}
                className={inputBase}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-500">Delivery charges</label>
              <input
                type="number" min="0"
                value={quoteMeta.deliveryCharges}
                onChange={(e) => setQuoteMeta({ ...quoteMeta, deliveryCharges: e.target.value })}
                className={inputBase}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-500">Installation cost</label>
              <input
                type="number" min="0"
                value={quoteMeta.installationCost}
                onChange={(e) => setQuoteMeta({ ...quoteMeta, installationCost: e.target.value })}
                className={inputBase}
              />
            </div>
          </div>

          <div className="mt-4 rounded-xl bg-slate-50 p-4">
            <dl className="space-y-1 text-sm">
              <div className="flex justify-between"><dt className="text-slate-500">Goods subtotal</dt><dd className="text-slate-900">{formatCurrency(quoteTotals.subtotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">GST</dt><dd className="text-slate-900">{formatCurrency(quoteTotals.tax)}</dd></div>
              <div className="flex justify-between border-t border-slate-200 pt-1 font-semibold">
                <dt className="text-slate-900">Grand total</dt>
                <dd className="font-display text-base text-slate-900">{formatCurrency(grandTotal)}</dd>
              </div>
            </dl>
            <p className="mt-2 text-xs text-slate-500">
              A professional cover note is drafted automatically and sent with the quotation.
            </p>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-seller-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-seller-dark disabled:opacity-50"
          >
            <FiSend className="h-4 w-4" />
            {submitting ? 'Sending…' : 'Send quotation'}
          </button>
        </form>

        <RFQMessageThread rfqId={active._id} viewerRole="seller" />
      </div>
    );
  }

  // ----------------------------------------------------------------- inbox
  return (
    <div>
      <div className="mb-4 flex gap-2 overflow-x-auto scrollbar-hide">
        {TABS.map((tab) => (
          <button
            key={tab.label}
            type="button"
            onClick={() => setStatus(tab.value)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
              status === tab.value ? 'bg-seller-primary text-white' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-100" />)}
        </div>
      )}

      {!loading && rfqs.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center">
          <FiInbox className="mx-auto mb-3 h-10 w-10 text-slate-300" />
          <p className="font-semibold text-slate-900">No RFQs in this view</p>
          <p className="mt-1 text-sm text-slate-500">Bulk enquiries matching your catalogue land here.</p>
        </div>
      )}

      <ul className="space-y-3">
        {rfqs.map((rfq) => {
          const sla = slaCountdown(rfq.slaDueAt, rfq.firstResponseAt);
          return (
            <li key={rfq._id}>
              <button
                type="button"
                onClick={() => open(rfq._id)}
                className="w-full rounded-xl border border-slate-200 bg-white p-4 text-left transition-colors hover:border-seller-primary/50 hover:bg-seller-light/30"
              >
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="font-display text-sm font-bold text-slate-900">{rfq.rfqNumber}</span>
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${
                    RFQ_STATUS_STYLES[rfq.status] || RFQ_STATUS_STYLES.submitted
                  }`}
                  >
                    {RFQ_STATUS_LABELS[rfq.status] || rfq.status}
                  </span>
                  <span className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    sla.tone === 'breach' ? 'bg-red-50 text-red-700'
                      : sla.tone === 'warn' ? 'bg-amber-50 text-amber-700'
                        : 'bg-emerald-50 text-emerald-700'
                  }`}
                  >
                    <FiClock className="mr-1 inline h-3 w-3" />{sla.label}
                  </span>
                </div>

                <p className="text-sm text-slate-700">{rfq.projectName || 'Bulk enquiry'}</p>

                <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1"><FiPackage className="h-3 w-3" /> {(rfq.lineItems || []).length} line(s)</span>
                  <span className="inline-flex items-center gap-1">
                    <FiCalendar className="h-3 w-3" /> needed by {new Date(rfq.requiredDate).toLocaleDateString('en-IN')}
                  </span>
                  {rfq.estimatedValue > 0 && <span>est. {formatCurrency(rfq.estimatedValue)}</span>}
                  <span>{[rfq.deliveryLocation?.city, rfq.deliveryLocation?.pincode].filter(Boolean).join(' · ')}</span>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default SellerRFQInbox;
