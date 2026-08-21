import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiMapPin, FiCalendar, FiPaperclip, FiClock, FiCheckCircle,
  FiXCircle, FiShoppingCart, FiAlertTriangle, FiPackage
} from 'react-icons/fi';
import toast from 'react-hot-toast';

import RFQQuoteComparison from './RFQQuoteComparison';
import RFQMessageThread from './RFQMessageThread';
import {
  rfqService, RFQ_STATUS_LABELS, RFQ_STATUS_STYLES, RFQ_TIMELINE,
  RFQ_UNIT_LABELS, formatCurrency, slaCountdown
} from '../../services/rfqService';

const CLOSED_STATUSES = ['converted_to_order', 'rejected', 'expired'];

/** Requirement A §1.3 — status, timeline, quotes received and negotiation. */
const RFQDetail = ({ rfqId, viewerRole = 'user' }) => {
  const navigate = useNavigate();
  const [rfq, setRfq] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await rfqService.getRFQById(rfqId);
      if (res.success) setRfq(res.data);
    } catch (err) {
      toast.error(err?.response?.data?.error || 'We could not load this RFQ.');
    } finally {
      setLoading(false);
    }
  }, [rfqId]);

  useEffect(() => { load(); }, [load]);

  const accept = async (quotationId) => {
    setBusy('accept');
    try {
      const res = await rfqService.acceptQuotation(rfqId, quotationId);
      if (res.success) {
        toast.success(res.message);
        await load();
      }
    } catch (err) {
      toast.error(err?.response?.data?.error || 'The quotation could not be accepted.');
    } finally {
      setBusy('');
    }
  };

  const convert = async () => {
    setBusy('convert');
    try {
      const res = await rfqService.convertToOrder(rfqId, { paymentMethod: 'Online' });
      if (res.success) {
        toast.success(res.message);
        navigate(`/orders/${res.data.order._id}/track`);
      }
    } catch (err) {
      const data = err?.response?.data;
      toast.error(data?.error || 'The order could not be created.');
    } finally {
      setBusy('');
    }
  };

  const close = async () => {
    const reason = window.prompt('Why are you closing this RFQ?');
    if (!reason || !reason.trim()) return;

    setBusy('reject');
    try {
      const res = await rfqService.rejectRFQ(rfqId, reason.trim());
      if (res.success) {
        toast.success('RFQ closed.');
        await load();
      }
    } catch (err) {
      toast.error(err?.response?.data?.error || 'The RFQ could not be closed.');
    } finally {
      setBusy('');
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-24 animate-pulse rounded-2xl bg-soft-oatmeal/50" />
        <div className="h-48 animate-pulse rounded-2xl bg-soft-oatmeal/50" />
      </div>
    );
  }

  if (!rfq) {
    return (
      <div className="rounded-2xl border border-dashed border-soft-oatmeal bg-white py-16 text-center">
        <p className="font-semibold text-deep-espresso">This RFQ is not available.</p>
      </div>
    );
  }

  const sla = slaCountdown(rfq.slaDueAt, rfq.firstResponseAt);
  const timelineIndex = RFQ_TIMELINE.indexOf(rfq.status);
  const isClosed = CLOSED_STATUSES.includes(rfq.status);
  const quotations = rfq.quotations || [];

  return (
    <div className="space-y-6">
      {/* ------------------------------------------------------------- header */}
      <header className="rounded-2xl border border-soft-oatmeal bg-white p-5">
        <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <h1 className="font-display text-xl font-bold text-deep-espresso">{rfq.rfqNumber}</h1>
              <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
                RFQ_STATUS_STYLES[rfq.status] || RFQ_STATUS_STYLES.submitted
              }`}
              >
                {RFQ_STATUS_LABELS[rfq.status] || rfq.status}
              </span>
            </div>
            {rfq.projectName && <p className="text-sm text-dusty-cocoa">{rfq.projectName}</p>}
          </div>

          {!isClosed && rfq.slaDueAt && (
            <div className={`rounded-lg border px-3 py-2 text-xs font-semibold ${
              sla.tone === 'breach' ? 'border-red-200 bg-red-50 text-red-700'
                : sla.tone === 'warn' ? 'border-amber-200 bg-amber-50 text-amber-700'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-700'
            }`}
            >
              <FiClock className="mr-1 inline h-3.5 w-3.5" />
              {sla.label}
            </div>
          )}
        </div>

        {/* Lifecycle timeline */}
        {!['rejected', 'expired'].includes(rfq.status) && (
          <ol className="flex items-center gap-1 overflow-x-auto scrollbar-hide pb-1">
            {RFQ_TIMELINE.map((step, index) => (
              <li key={step} className="flex shrink-0 items-center gap-1">
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                  index <= timelineIndex ? 'bg-warm-sand text-white' : 'bg-soft-oatmeal text-dusty-cocoa'
                }`}
                >
                  {RFQ_STATUS_LABELS[step]}
                </span>
                {index < RFQ_TIMELINE.length - 1 && (
                  <span className={`h-0.5 w-4 ${index < timelineIndex ? 'bg-warm-sand' : 'bg-soft-oatmeal'}`} />
                )}
              </li>
            ))}
          </ol>
        )}

        {['rejected', 'expired'].includes(rfq.status) && rfq.rejectionReason && (
          <p className="flex items-start gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
            <FiAlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {rfq.rejectionReason}
          </p>
        )}

        <dl className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-dusty-cocoa">
              <FiCalendar className="mr-1 inline h-3 w-3" /> Required by
            </dt>
            <dd className="mt-0.5 text-deep-espresso">
              {new Date(rfq.requiredDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-dusty-cocoa">
              <FiMapPin className="mr-1 inline h-3 w-3" /> Deliver to
            </dt>
            <dd className="mt-0.5 text-deep-espresso">
              {[rfq.deliveryLocation?.city, rfq.deliveryLocation?.pincode].filter(Boolean).join(' · ')}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-dusty-cocoa">
              <FiPackage className="mr-1 inline h-3 w-3" /> Sellers quoting
            </dt>
            <dd className="mt-0.5 text-deep-espresso">
              {viewerRole === 'seller'
                ? `You${rfq.competitorCount > 0 ? ` + ${rfq.competitorCount} other seller(s)` : ''}`
                : `${(rfq.routedTo || []).length}${rfq.routedToAdmin ? ' + Riddha team' : ''}`}
            </dd>
          </div>
        </dl>
      </header>

      {/* -------------------------------------------------------------- lines */}
      <section className="rounded-2xl border border-soft-oatmeal bg-white p-5">
        <h2 className="mb-3 font-display text-base font-bold text-deep-espresso">
          Requirement ({rfq.lineItems.length} line{rfq.lineItems.length === 1 ? '' : 's'})
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="border-b border-soft-oatmeal">
              <tr className="text-xs uppercase tracking-wide text-dusty-cocoa">
                <th className="py-2 pr-3 font-semibold">Product</th>
                <th className="py-2 pr-3 font-semibold">Qty</th>
                <th className="py-2 pr-3 font-semibold">Size</th>
                <th className="py-2 pr-3 font-semibold">Finish</th>
                <th className="py-2 font-semibold">Application</th>
              </tr>
            </thead>
            <tbody>
              {rfq.lineItems.map((line) => (
                <tr key={line._id || line.productDescription} className="border-b border-soft-oatmeal/50 last:border-0">
                  <td className="py-2.5 pr-3 text-deep-espresso">
                    {line.productDescription}
                    {line.brandPreference && (
                      <span className="ml-1 text-xs text-dusty-cocoa">({line.brandPreference})</span>
                    )}
                  </td>
                  <td className="py-2.5 pr-3 whitespace-nowrap text-deep-espresso">
                    {line.quantity} {RFQ_UNIT_LABELS[line.unit] || line.unit}
                  </td>
                  <td className="py-2.5 pr-3 text-dusty-cocoa">{line.size || '—'}</td>
                  <td className="py-2.5 pr-3 text-dusty-cocoa">{line.finish || '—'}</td>
                  <td className="py-2.5 text-dusty-cocoa">{line.application || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {rfq.specialRequirements && (
          <p className="mt-4 rounded-lg bg-soft-oatmeal/40 px-3 py-2.5 text-sm text-deep-espresso">
            <span className="font-semibold">Special requirements: </span>{rfq.specialRequirements}
          </p>
        )}

        {(rfq.budgetRange?.min || rfq.budgetRange?.max) && (
          <p className="mt-2 text-sm text-dusty-cocoa">
            Indicative budget: {formatCurrency(rfq.budgetRange.min)} – {formatCurrency(rfq.budgetRange.max)}
          </p>
        )}

        {(rfq.attachments || []).length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-dusty-cocoa">Attachments</p>
            <ul className="flex flex-wrap gap-2">
              {rfq.attachments.map((file) => (
                <li key={file.url}>
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-soft-oatmeal bg-white px-3 py-1.5 text-xs text-deep-espresso hover:bg-soft-oatmeal"
                  >
                    <FiPaperclip className="h-3 w-3" />
                    {file.filename || 'Attachment'}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* ------------------------------------------------------------- quotes */}
      <section>
        <h2 className="mb-3 font-display text-base font-bold text-deep-espresso">
          Quotations received{quotations.length > 0 ? ` (${quotations.length})` : ''}
        </h2>
        <RFQQuoteComparison
          quotations={quotations}
          acceptedQuotationId={rfq.acceptedQuotationId}
          onAccept={accept}
          accepting={busy === 'accept'}
          readOnly={viewerRole !== 'user' || isClosed}
        />
      </section>

      {/* ------------------------------------------------------------ actions */}
      {viewerRole === 'user' && !isClosed && (
        <div className="flex flex-wrap gap-3 rounded-2xl border border-soft-oatmeal bg-white p-5">
          {rfq.status === 'accepted' && (
            <button
              type="button"
              onClick={convert}
              disabled={busy === 'convert'}
              className="inline-flex items-center gap-2 rounded-xl bg-warm-sand px-5 py-2.5 text-sm font-semibold text-white hover:bg-dusty-cocoa disabled:opacity-50"
            >
              <FiShoppingCart className="h-4 w-4" />
              {busy === 'convert' ? 'Creating order…' : 'Place the order'}
            </button>
          )}
          <button
            type="button"
            onClick={close}
            disabled={busy === 'reject'}
            className="inline-flex items-center gap-2 rounded-xl border border-soft-oatmeal px-5 py-2.5 text-sm font-semibold text-dusty-cocoa hover:bg-soft-oatmeal disabled:opacity-50"
          >
            <FiXCircle className="h-4 w-4" /> Close this RFQ
          </button>
        </div>
      )}

      {rfq.convertedOrderId && (
        <p className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <FiCheckCircle className="h-4 w-4 shrink-0" />
          This RFQ became an order.
          <button
            type="button"
            onClick={() => navigate(`/orders/${rfq.convertedOrderId}/track`)}
            className="font-semibold underline underline-offset-2"
          >
            Track it
          </button>
        </p>
      )}

      {/* ------------------------------------------------------------- thread */}
      <RFQMessageThread
        rfqId={rfqId}
        viewerRole={viewerRole}
        disabled={isClosed}
        disabledReason="This RFQ is closed, so the conversation is read-only."
      />

      {/* ------------------------------------------------------- audit history */}
      <section className="rounded-2xl border border-soft-oatmeal bg-white p-5">
        <h2 className="mb-3 font-display text-base font-bold text-deep-espresso">History</h2>
        <ol className="space-y-3">
          {(rfq.statusHistory || []).map((entry, index) => (
            <li key={index} className="flex gap-3">
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-warm-sand" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-deep-espresso">
                  {RFQ_STATUS_LABELS[entry.status] || entry.status}
                  <span className="ml-2 text-xs font-normal text-dusty-cocoa">by {entry.changedByRole}</span>
                </p>
                {entry.note && <p className="text-xs text-dusty-cocoa">{entry.note}</p>}
                <p className="text-[11px] text-dusty-cocoa">
                  {new Date(entry.changedAt).toLocaleString('en-IN')}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
};

export default RFQDetail;
