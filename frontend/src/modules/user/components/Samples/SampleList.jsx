import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FiLayers, FiMessageCircle, FiChevronRight } from 'react-icons/fi';

import SampleFeedbackModal from './SampleFeedbackModal';
import { sampleService, SAMPLE_STATUS_LABELS, SAMPLE_STATUS_STYLES } from '../../services/sampleService';

const FILTERS = [
  { value: '', label: 'All' },
  { value: 'requested,approved', label: 'In progress' },
  { value: 'dispatched,delivered', label: 'On the way' },
  { value: 'feedback_given,declined', label: 'Closed' }
];

/** Requirement A — the customer's sample requests. */
const SampleList = ({ basePath = '/samples' }) => {
  const [samples, setSamples] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [feedbackFor, setFeedbackFor] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await sampleService.getSampleRequests({ status: status || undefined });
      if (res.success) setSamples(res.data || []);
    } catch {
      setSamples([]);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <div className="mb-4 flex gap-2 overflow-x-auto scrollbar-hide">
        {FILTERS.map((filter) => (
          <button
            key={filter.value}
            type="button"
            onClick={() => setStatus(filter.value)}
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

      {loading && (
        <div className="space-y-3">
          {[0, 1].map((i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-soft-oatmeal/40" />)}
        </div>
      )}

      {!loading && samples.length === 0 && (
        <div className="rounded-2xl border border-dashed border-soft-oatmeal bg-white py-16 text-center">
          <FiLayers className="mx-auto mb-3 h-10 w-10 text-warm-sand/60" />
          <p className="font-semibold text-deep-espresso">No sample requests yet</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-dusty-cocoa">
            Marble, tile, laminate and fabric are bought by touch. Order swatches before you commit to the full quantity.
          </p>
        </div>
      )}

      {!loading && samples.length > 0 && (
        <ul className="space-y-3">
          {samples.map((sample) => (
            <li key={sample._id} className="rounded-xl border border-soft-oatmeal bg-white">
              <Link
                to={`${basePath}/${sample._id}`}
                className="flex items-center gap-4 p-4 transition-colors hover:bg-soft-oatmeal/30"
              >
                <div className="min-w-0 flex-1">
                  <div className="mb-1.5 flex flex-wrap items-center gap-2">
                    <span className="font-display text-sm font-bold text-deep-espresso">{sample.requestNumber}</span>
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                      SAMPLE_STATUS_STYLES[sample.status] || SAMPLE_STATUS_STYLES.requested
                    }`}
                    >
                      {SAMPLE_STATUS_LABELS[sample.status] || sample.status}
                    </span>
                    {sample.chargeAmount > 0 && (
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        sample.chargeRefunded ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                      }`}
                      >
                        ₹{sample.chargeAmount}{sample.chargeRefunded ? ' refunded' : ''}
                      </span>
                    )}
                  </div>

                  <p className="truncate text-sm text-deep-espresso">
                    {(sample.items || []).map((i) => i.productName).filter(Boolean).join(', ')
                      || `${(sample.items || []).length} sample(s)`}
                  </p>
                  <p className="mt-1 text-xs text-dusty-cocoa">
                    {new Date(sample.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    {sample.declineReason && ` · ${sample.declineReason}`}
                  </p>
                </div>

                <FiChevronRight className="h-5 w-5 shrink-0 text-dusty-cocoa" />
              </Link>

              {sample.status === 'delivered' && (
                <div className="border-t border-soft-oatmeal px-4 py-3">
                  <button
                    type="button"
                    onClick={() => setFeedbackFor(sample)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-warm-sand px-4 py-2 text-sm font-semibold text-white hover:bg-dusty-cocoa"
                  >
                    <FiMessageCircle className="h-4 w-4" /> How was it?
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {feedbackFor && (
        <SampleFeedbackModal
          sample={feedbackFor}
          onClose={() => setFeedbackFor(null)}
          onSubmitted={() => { setFeedbackFor(null); load(); }}
        />
      )}
    </div>
  );
};

export default SampleList;
