import React, { useMemo, useState } from 'react';
import { FiCheck, FiAward, FiClock, FiTruck } from 'react-icons/fi';

import { formatCurrency } from '../../services/rfqService';

/**
 * Requirement A §1.4 — side-by-side comparison of competing seller quotations.
 *
 * Best value per row is highlighted so a contractor can read the difference at a
 * glance instead of opening each quote. Mobile falls back to stacked cards.
 */
const RFQQuoteComparison = ({ quotations = [], acceptedQuotationId = null, onAccept, accepting = false, readOnly = false }) => {
  const [selected, setSelected] = useState(null);

  const rows = useMemo(() => {
    if (quotations.length === 0) return [];

    const totals = quotations.map((q) => (q.pricing && q.pricing.grandTotal) || 0);
    const subtotals = quotations.map((q) => (q.pricing && q.pricing.subtotal) || 0);
    const deliveries = quotations.map((q) => (q.delivery && q.delivery.charges) || 0);

    const lowest = (values) => {
      const valid = values.filter((v) => v > 0);
      return valid.length ? Math.min(...valid) : null;
    };

    return [
      { key: 'subtotal', label: 'Goods subtotal', values: subtotals, best: lowest(subtotals), format: formatCurrency },
      {
        key: 'gst',
        label: 'GST',
        values: quotations.map((q) => (q.pricing && q.pricing.taxes && q.pricing.taxes.totalGST) || 0),
        best: null,
        format: formatCurrency
      },
      { key: 'delivery', label: 'Delivery', values: deliveries, best: null, format: (v) => (v > 0 ? formatCurrency(v) : 'Included') },
      { key: 'total', label: 'Grand total', values: totals, best: lowest(totals), format: formatCurrency, emphasise: true },
      {
        key: 'validity',
        label: 'Valid until',
        values: quotations.map((q) => q.validUntil),
        best: null,
        format: (v) => (v ? new Date(v).toLocaleDateString('en-IN') : '—')
      },
      {
        key: 'lines',
        label: 'Lines quoted',
        values: quotations.map((q) => (q.items || []).length),
        best: null,
        format: (v) => `${v} line${v === 1 ? '' : 's'}`
      }
    ];
  }, [quotations]);

  if (quotations.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-soft-oatmeal bg-white py-12 text-center">
        <FiClock className="mx-auto mb-2 h-8 w-8 text-warm-sand/60" />
        <p className="font-semibold text-deep-espresso">No quotations yet</p>
        <p className="mt-1 text-sm text-dusty-cocoa">Sellers respond within 24 hours of submission.</p>
      </div>
    );
  }

  const isAccepted = (q) => String(q._id) === String(acceptedQuotationId);
  const cheapestTotal = rows.find((r) => r.key === 'total')?.best;

  return (
    <div>
      {quotations.length > 1 && (
        <p className="mb-3 flex items-center gap-1.5 text-sm text-dusty-cocoa">
          <FiAward className="h-4 w-4 text-warm-sand" />
          Comparing {quotations.length} quotes — the best value in each row is highlighted.
        </p>
      )}

      {/* Desktop: a real comparison table */}
      <div className="hidden overflow-x-auto rounded-xl border border-soft-oatmeal bg-white md:block">
        <table className="w-full min-w-[600px] text-left text-sm">
          <thead>
            <tr className="border-b border-soft-oatmeal bg-soft-oatmeal/40">
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-dusty-cocoa">Quotation</th>
              {quotations.map((q) => (
                <th key={q._id} className="px-4 py-3">
                  <span className="block font-display font-bold text-deep-espresso">{q.quotationNumber}</span>
                  {isAccepted(q) && (
                    <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                      <FiCheck className="h-3 w-3" /> Accepted
                    </span>
                  )}
                  {!isAccepted(q) && (q.pricing?.grandTotal || 0) === cheapestTotal && quotations.length > 1 && (
                    <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-semibold text-teal-700">
                      <FiAward className="h-3 w-3" /> Lowest total
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key} className="border-b border-soft-oatmeal/60 last:border-0">
                <td className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-dusty-cocoa">{row.label}</td>
                {row.values.map((value, index) => {
                  const isBest = row.best !== null && value === row.best;
                  return (
                    <td
                      key={index}
                      className={`px-4 py-3 ${row.emphasise ? 'font-display text-base font-bold' : ''} ${
                        isBest ? 'text-emerald-700' : 'text-deep-espresso'
                      }`}
                    >
                      {row.format(value)}
                      {isBest && <span className="ml-1 text-[10px] font-semibold uppercase text-emerald-600">best</span>}
                    </td>
                  );
                })}
              </tr>
            ))}

            {!readOnly && (
              <tr>
                <td className="px-4 py-4" />
                {quotations.map((q) => (
                  <td key={q._id} className="px-4 py-4">
                    {acceptedQuotationId ? (
                      isAccepted(q) ? (
                        <span className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700">
                          <FiCheck className="h-4 w-4" /> Accepted
                        </span>
                      ) : (
                        <span className="text-xs text-dusty-cocoa">Not selected</span>
                      )
                    ) : (
                      <button
                        type="button"
                        onClick={() => { setSelected(q._id); onAccept(q._id); }}
                        disabled={accepting}
                        className="w-full rounded-lg bg-warm-sand px-3 py-2 text-sm font-semibold text-white hover:bg-dusty-cocoa disabled:opacity-50"
                      >
                        {accepting && selected === q._id ? 'Accepting…' : 'Accept this quote'}
                      </button>
                    )}
                  </td>
                ))}
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile: stacked cards */}
      <div className="space-y-3 md:hidden">
        {quotations.map((q) => (
          <div
            key={q._id}
            className={`rounded-xl border p-4 ${
              isAccepted(q) ? 'border-emerald-300 bg-emerald-50/40' : 'border-soft-oatmeal bg-white'
            }`}
          >
            <div className="mb-3 flex items-start justify-between gap-2">
              <span className="font-display font-bold text-deep-espresso">{q.quotationNumber}</span>
              {isAccepted(q) && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                  <FiCheck className="h-3 w-3" /> Accepted
                </span>
              )}
            </div>

            <dl className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-dusty-cocoa">Goods subtotal</dt>
                <dd className="text-deep-espresso">{formatCurrency(q.pricing?.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-dusty-cocoa">GST</dt>
                <dd className="text-deep-espresso">{formatCurrency(q.pricing?.taxes?.totalGST)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="inline-flex items-center gap-1 text-dusty-cocoa"><FiTruck className="h-3 w-3" /> Delivery</dt>
                <dd className="text-deep-espresso">
                  {q.delivery?.charges > 0 ? formatCurrency(q.delivery.charges) : 'Included'}
                </dd>
              </div>
              <div className="flex justify-between border-t border-soft-oatmeal pt-1.5">
                <dt className="font-semibold text-deep-espresso">Grand total</dt>
                <dd className={`font-display text-base font-bold ${
                  (q.pricing?.grandTotal || 0) === cheapestTotal ? 'text-emerald-700' : 'text-deep-espresso'
                }`}
                >
                  {formatCurrency(q.pricing?.grandTotal)}
                </dd>
              </div>
            </dl>

            {!readOnly && !acceptedQuotationId && (
              <button
                type="button"
                onClick={() => { setSelected(q._id); onAccept(q._id); }}
                disabled={accepting}
                className="mt-3 w-full rounded-lg bg-warm-sand px-3 py-2.5 text-sm font-semibold text-white hover:bg-dusty-cocoa disabled:opacity-50"
              >
                {accepting && selected === q._id ? 'Accepting…' : 'Accept this quote'}
              </button>
            )}
          </div>
        ))}
      </div>

      {quotations.some((q) => q.openingMessage) && (
        <div className="mt-4 space-y-3">
          {quotations.filter((q) => q.openingMessage).map((q) => (
            <div key={q._id} className="rounded-xl border border-soft-oatmeal bg-soft-oatmeal/30 p-4">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-dusty-cocoa">
                Note from {q.quotationNumber}
              </p>
              <p className="text-sm leading-relaxed text-deep-espresso">{q.openingMessage}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RFQQuoteComparison;
