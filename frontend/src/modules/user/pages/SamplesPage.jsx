import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation, useSearchParams, Link } from 'react-router-dom';
import { FiArrowLeft, FiMessageCircle, FiPackage } from 'react-icons/fi';

import SampleRequestForm from '../components/Samples/SampleRequestForm';
import SampleList from '../components/Samples/SampleList';
import SampleTracking from '../components/Samples/SampleTracking';
import SampleFeedbackModal from '../components/Samples/SampleFeedbackModal';
import {
  sampleService, SAMPLE_STATUS_LABELS, SAMPLE_STATUS_STYLES
} from '../services/sampleService';
import { useUser } from '../data/UserContext';

/**
 * Requirement A — the customer's sample views:
 *   /samples        list
 *   /samples/new    request form
 *   /samples/:id    detail + tracking + feedback
 */
const SamplesPage = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useUser();

  const isNew = location.pathname.endsWith('/new');
  const state = location.state || {};

  const [sample, setSample] = useState(null);
  const [loading, setLoading] = useState(false);
  // The follow-up notification deep-links here with ?feedback=1.
  const [showFeedback, setShowFeedback] = useState(searchParams.get('feedback') === '1');

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await sampleService.getSampleRequestById(id);
      if (res.success) setSample(res.data);
    } catch {
      setSample(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="font-display text-xl font-bold text-deep-espresso">Sign in to request samples</h1>
        <Link
          to="/login"
          state={{ from: location.pathname }}
          className="mt-5 inline-block rounded-xl bg-warm-sand px-6 py-3 text-sm font-semibold text-white hover:bg-dusty-cocoa"
        >
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 md:py-10">
      {(isNew || id) && (
        <button
          type="button"
          onClick={() => navigate('/samples')}
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-dusty-cocoa hover:text-deep-espresso"
        >
          <FiArrowLeft className="h-4 w-4" /> All samples
        </button>
      )}

      {isNew && (
        <>
          <header className="mb-6">
            <h1 className="font-display text-2xl font-bold text-deep-espresso">Request material samples</h1>
            <p className="mt-1 text-sm text-dusty-cocoa">
              See and feel the finish before you commit to the full quantity.
            </p>
          </header>

          <SampleRequestForm
            prefillProducts={state.prefillProducts || []}
            onSubmitted={(created) => navigate(`/samples/${created._id}`, { replace: true })}
          />
        </>
      )}

      {!isNew && id && (
        <>
          {loading && <div className="h-40 animate-pulse rounded-2xl bg-soft-oatmeal/40" />}

          {!loading && !sample && (
            <p className="rounded-2xl border border-dashed border-soft-oatmeal bg-white py-16 text-center font-semibold text-deep-espresso">
              This sample request is not available.
            </p>
          )}

          {!loading && sample && (
            <div className="space-y-5">
              <header className="rounded-2xl border border-soft-oatmeal bg-white p-5">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <h1 className="font-display text-xl font-bold text-deep-espresso">{sample.requestNumber}</h1>
                  <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
                    SAMPLE_STATUS_STYLES[sample.status] || SAMPLE_STATUS_STYLES.requested
                  }`}
                  >
                    {SAMPLE_STATUS_LABELS[sample.status] || sample.status}
                  </span>
                </div>

                <p className="text-sm text-dusty-cocoa">
                  Requested {new Date(sample.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'long', year: 'numeric'
                  })}
                  {sample.autoApproved && ' · auto-approved for your verified business account'}
                </p>

                {sample.chargeAmount > 0 && (
                  <p className={`mt-3 rounded-lg px-3 py-2 text-sm ${
                    sample.chargeRefunded ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'
                  }`}
                  >
                    Sample fee ₹{sample.chargeAmount}
                    {sample.chargeRefunded ? ' — credited against your order.' : ' — refundable against your first order.'}
                  </p>
                )}

                <ul className="mt-4 space-y-2">
                  {(sample.items || []).map((item, index) => {
                    const product = item.productId && typeof item.productId === 'object' ? item.productId : null;
                    return (
                      <li key={index} className="flex items-center gap-3 rounded-lg border border-soft-oatmeal p-3">
                        {product?.images?.[0] && (
                          <img src={product.images[0]} alt="" className="h-12 w-12 rounded object-cover" />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-deep-espresso">
                            {item.productName || product?.name || 'Sample'}
                          </p>
                          {(item.shade || item.variantId) && (
                            <p className="text-xs text-dusty-cocoa">{item.shade || item.variantId}</p>
                          )}
                        </div>
                        <span className="shrink-0 text-xs text-dusty-cocoa">×{item.quantity}</span>
                      </li>
                    );
                  })}
                </ul>

                {sample.status === 'delivered' && (
                  <button
                    type="button"
                    onClick={() => setShowFeedback(true)}
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-warm-sand px-5 py-2.5 text-sm font-semibold text-white hover:bg-dusty-cocoa"
                  >
                    <FiMessageCircle className="h-4 w-4" /> Share your feedback
                  </button>
                )}

                {sample.feedback?.verdict && (
                  <p className="mt-4 rounded-lg bg-soft-oatmeal/50 px-3 py-2.5 text-sm text-deep-espresso">
                    <span className="font-semibold">Your feedback: </span>
                    {sample.feedback.verdict.replace(/_/g, ' ')}
                    {sample.feedback.comment && ` — ${sample.feedback.comment}`}
                  </p>
                )}
              </header>

              <SampleTracking sample={sample} />

              <section className="rounded-2xl border border-soft-oatmeal bg-white p-5">
                <h2 className="mb-3 flex items-center gap-2 font-display text-base font-bold text-deep-espresso">
                  <FiPackage className="h-4 w-4 text-warm-sand" /> History
                </h2>
                <ol className="space-y-3">
                  {(sample.statusHistory || []).map((entry, index) => (
                    <li key={index} className="flex gap-3">
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-warm-sand" />
                      <div>
                        <p className="text-sm font-semibold text-deep-espresso">
                          {SAMPLE_STATUS_LABELS[entry.status] || entry.status}
                          <span className="ml-2 text-xs font-normal text-dusty-cocoa">by {entry.changedByRole}</span>
                        </p>
                        {entry.note && <p className="text-xs text-dusty-cocoa">{entry.note}</p>}
                        <p className="text-[11px] text-dusty-cocoa">{new Date(entry.changedAt).toLocaleString('en-IN')}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </section>
            </div>
          )}
        </>
      )}

      {!isNew && !id && (
        <>
          <header className="mb-6">
            <h1 className="font-display text-2xl font-bold text-deep-espresso">My sample requests</h1>
            <p className="mt-1 text-sm text-dusty-cocoa">Track swatches on their way to you and share what you thought.</p>
          </header>
          <SampleList />
        </>
      )}

      {showFeedback && sample && (
        <SampleFeedbackModal
          sample={sample}
          onClose={() => setShowFeedback(false)}
          onSubmitted={() => { setShowFeedback(false); load(); }}
        />
      )}
    </div>
  );
};

export default SamplesPage;
