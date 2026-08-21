import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiTruck, FiCheckCircle, FiExternalLink, FiPackage, FiMapPin } from 'react-icons/fi';

import { trackingService } from '../../services/trackingService';
import { SAMPLE_TIMELINE, SAMPLE_STATUS_LABELS } from '../../services/sampleService';

/**
 * Requirement A §2.6 — sample tracking.
 *
 * When the dispatch was linked to a tracking order (Requirement #13) this pulls
 * the same live tracking payload the order-tracking page uses; otherwise it
 * falls back to the courier AWB recorded on the sample itself.
 */
const SampleTracking = ({ sample }) => {
  const trackingOrderId = sample ? sample.trackingOrderId : null;
  const [orderTracking, setOrderTracking] = useState(null);
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    if (!trackingOrderId) return undefined;

    let cancelled = false;
    trackingService.getOrderTracking(trackingOrderId)
      .then((res) => { if (!cancelled && res.success) setOrderTracking(res.data); })
      .catch(() => { /* the AWB fallback below still renders */ })
      .finally(() => { if (!cancelled) setSettled(true); });

    return () => { cancelled = true; };
  }, [trackingOrderId]);

  const loading = !!trackingOrderId && !settled;

  if (!sample) return null;

  const stageIndex = SAMPLE_TIMELINE.indexOf(sample.status);
  const courier = sample.courier || {};
  const declined = sample.status === 'declined';

  return (
    <div className="rounded-2xl border border-soft-oatmeal bg-white p-5">
      <h3 className="mb-4 flex items-center gap-2 font-display text-base font-bold text-deep-espresso">
        <FiTruck className="h-4 w-4 text-warm-sand" /> Tracking
      </h3>

      {declined ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800">
          This request was declined. {sample.declineReason}
        </p>
      ) : (
        <ol className="mb-5 space-y-3">
          {SAMPLE_TIMELINE.map((stage, index) => {
            const done = index <= stageIndex;
            return (
              <li key={stage} className="flex items-start gap-3">
                <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                  done ? 'bg-warm-sand text-white' : 'bg-soft-oatmeal text-dusty-cocoa'
                }`}
                >
                  {done ? <FiCheckCircle className="h-3 w-3" /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}
                </span>
                <div className="min-w-0">
                  <p className={`text-sm font-semibold ${done ? 'text-deep-espresso' : 'text-dusty-cocoa'}`}>
                    {SAMPLE_STATUS_LABELS[stage]}
                  </p>
                  {stage === 'dispatched' && courier.dispatchedAt && (
                    <p className="text-xs text-dusty-cocoa">
                      {new Date(courier.dispatchedAt).toLocaleString('en-IN')}
                    </p>
                  )}
                  {stage === 'delivered' && courier.deliveredAt && (
                    <p className="text-xs text-dusty-cocoa">
                      {new Date(courier.deliveredAt).toLocaleString('en-IN')}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {courier.awb && (
        <dl className="space-y-2 rounded-xl bg-soft-oatmeal/40 p-4 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-dusty-cocoa">Courier</dt>
            <dd className="font-medium text-deep-espresso">{courier.partnerName || 'Courier'}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-dusty-cocoa">AWB</dt>
            <dd className="font-mono text-deep-espresso">{courier.awb}</dd>
          </div>
          {courier.trackingUrl && (
            <a
              href={courier.trackingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-warm-sand hover:underline"
            >
              Track with the courier <FiExternalLink className="h-3 w-3" />
            </a>
          )}
        </dl>
      )}

      {loading && <p className="mt-3 text-sm text-dusty-cocoa">Loading live tracking…</p>}

      {orderTracking && (
        <div className="mt-4 rounded-xl border border-soft-oatmeal p-4">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-dusty-cocoa">
            <FiMapPin className="h-3 w-3" /> Live tracking
          </p>
          {orderTracking.currentStatus && (
            <p className="text-sm text-deep-espresso">{orderTracking.currentStatus}</p>
          )}
          {orderTracking.estimatedDelivery && (
            <p className="mt-1 text-xs text-dusty-cocoa">
              Expected {new Date(orderTracking.estimatedDelivery).toLocaleString('en-IN')}
            </p>
          )}
          <Link
            to={`/orders/${sample.trackingOrderId}/track`}
            className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-warm-sand hover:underline"
          >
            Open full tracking <FiExternalLink className="h-3 w-3" />
          </Link>
        </div>
      )}

      {!courier.awb && !declined && stageIndex < SAMPLE_TIMELINE.indexOf('dispatched') && (
        <p className="flex items-start gap-2 rounded-lg bg-soft-oatmeal/40 px-3 py-2.5 text-sm text-dusty-cocoa">
          <FiPackage className="mt-0.5 h-4 w-4 shrink-0" />
          Tracking details appear here once your samples are dispatched.
        </p>
      )}
    </div>
  );
};

export default SampleTracking;
