import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FiFileText, FiPackage, FiCalendar, FiSearch, FiChevronRight } from 'react-icons/fi';

import { rfqService, RFQ_STATUS_LABELS, RFQ_STATUS_STYLES, formatCurrency } from '../../services/rfqService';

const FILTERS = [
  { value: '', label: 'All' },
  { value: 'submitted,under_review', label: 'Awaiting quote' },
  { value: 'quoted,negotiation', label: 'Quoted' },
  { value: 'accepted,converted_to_order', label: 'Accepted' },
  { value: 'rejected,expired', label: 'Closed' }
];

/** Requirement A — the customer's RFQ list, filterable by status. */
const RFQList = ({ basePath = '/rfq' }) => {
  const [rfqs, setRfqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await rfqService.getRFQs({ status: status || undefined, search: search || undefined, page });
      if (res.success) {
        setRfqs(res.data || []);
        setPages(res.pages || 1);
      }
    } catch {
      setRfqs([]);
    } finally {
      setLoading(false);
    }
  }, [status, search, page]);

  useEffect(() => {
    const timer = setTimeout(load, search ? 350 : 0);
    return () => clearTimeout(timer);
  }, [load, search]);

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => { setStatus(filter.value); setPage(1); }}
              className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                status === filter.value
                  ? 'bg-warm-sand text-white'
                  : 'border border-soft-oatmeal bg-white text-dusty-cocoa hover:bg-soft-oatmeal'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div className="relative sm:w-64">
          <FiSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-dusty-cocoa" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search RFQ number or project"
            className="w-full rounded-lg border border-soft-oatmeal bg-white py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-warm-sand/40"
          />
        </div>
      </div>

      {loading && (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl border border-soft-oatmeal bg-soft-oatmeal/40" />
          ))}
        </div>
      )}

      {!loading && rfqs.length === 0 && (
        <div className="rounded-2xl border border-dashed border-soft-oatmeal bg-white py-16 text-center">
          <FiFileText className="mx-auto mb-3 h-10 w-10 text-warm-sand/60" />
          <p className="font-semibold text-deep-espresso">No requests for quotation yet</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-dusty-cocoa">
            Buying in bulk? Ask for a quote instead of adding to the cart — sellers respond within 24 hours.
          </p>
          <Link
            to="/rfq/new"
            className="mt-4 inline-block rounded-xl bg-warm-sand px-5 py-2.5 text-sm font-semibold text-white hover:bg-dusty-cocoa"
          >
            Request a quote
          </Link>
        </div>
      )}

      {!loading && rfqs.length > 0 && (
        <ul className="space-y-3">
          {rfqs.map((rfq) => (
            <li key={rfq._id}>
              <Link
                to={`${basePath}/${rfq._id}`}
                className="flex items-center gap-4 rounded-xl border border-soft-oatmeal bg-white p-4 transition-colors hover:border-warm-sand/60 hover:bg-soft-oatmeal/30"
              >
                <div className="min-w-0 flex-1">
                  <div className="mb-1.5 flex flex-wrap items-center gap-2">
                    <span className="font-display text-sm font-bold text-deep-espresso">{rfq.rfqNumber}</span>
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                      RFQ_STATUS_STYLES[rfq.status] || RFQ_STATUS_STYLES.submitted
                    }`}
                    >
                      {RFQ_STATUS_LABELS[rfq.status] || rfq.status}
                    </span>
                    {(rfq.quotations || []).length > 1 && (
                      <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-semibold text-teal-700">
                        {rfq.quotations.length} quotes to compare
                      </span>
                    )}
                  </div>

                  <p className="truncate text-sm text-deep-espresso">
                    {rfq.projectName || `${(rfq.lineItems || []).length} line item(s)`}
                  </p>

                  <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-dusty-cocoa">
                    <span className="inline-flex items-center gap-1">
                      <FiPackage className="h-3 w-3" /> {(rfq.lineItems || []).length} line(s)
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <FiCalendar className="h-3 w-3" />
                      needed by {new Date(rfq.requiredDate).toLocaleDateString('en-IN')}
                    </span>
                    {rfq.estimatedValue > 0 && <span>est. {formatCurrency(rfq.estimatedValue)}</span>}
                  </div>
                </div>

                <FiChevronRight className="h-5 w-5 shrink-0 text-dusty-cocoa" />
              </Link>
            </li>
          ))}
        </ul>
      )}

      {pages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-lg border border-soft-oatmeal px-4 py-2 text-sm font-semibold text-dusty-cocoa disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-sm text-dusty-cocoa">Page {page} of {pages}</span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
            disabled={page === pages}
            className="rounded-lg border border-soft-oatmeal px-4 py-2 text-sm font-semibold text-dusty-cocoa disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default RFQList;
