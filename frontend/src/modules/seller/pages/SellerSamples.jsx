import React, { useState, useEffect, useCallback } from 'react';
import { Layers, Truck, Check, X, Inbox } from 'lucide-react';
import { toast } from 'react-hot-toast';

import PageWrapper from '../components/PageWrapper';
import {
  sampleService, SAMPLE_STATUS_LABELS, SAMPLE_STATUS_STYLES
} from '../../user/services/sampleService';

const TABS = [
  { value: 'requested', label: 'Awaiting approval' },
  { value: 'approved', label: 'To dispatch' },
  { value: 'dispatched,delivered', label: 'In transit' },
  { value: '', label: 'All' }
];

/**
 * Requirement A §2.4 — the seller's sample queue: approve or decline a request,
 * then record the courier AWB that puts it on the tracking pipeline.
 */
const SellerSamples = () => {
  const [samples, setSamples] = useState([]);
  const [status, setStatus] = useState('requested');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [dispatchFor, setDispatchFor] = useState(null);
  const [awbForm, setAwbForm] = useState({ awb: '', partnerName: '', trackingUrl: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await sampleService.getSampleRequests({ status: status || undefined, limit: 50 });
      if (res.success) setSamples(res.data || []);
    } catch {
      toast.error('We could not load your sample requests.');
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => { load(); }, [load]);

  const approve = async (id) => {
    setBusyId(id);
    try {
      const res = await sampleService.approve(id);
      if (res.success) { toast.success('Sample request approved.'); load(); }
    } catch (err) {
      toast.error(err?.response?.data?.error || 'The request could not be approved.');
    } finally {
      setBusyId('');
    }
  };

  const decline = async (id) => {
    const reason = window.prompt('Why are you declining this sample request?');
    if (!reason || !reason.trim()) return;

    setBusyId(id);
    try {
      const res = await sampleService.decline(id, reason.trim());
      if (res.success) { toast.success('Sample request declined.'); load(); }
    } catch (err) {
      toast.error(err?.response?.data?.error || 'The request could not be declined.');
    } finally {
      setBusyId('');
    }
  };

  const dispatch = async (e) => {
    e.preventDefault();
    if (!awbForm.awb.trim()) {
      toast.error('An AWB number is required.');
      return;
    }

    setBusyId(dispatchFor._id);
    try {
      const res = await sampleService.dispatch(dispatchFor._id, awbForm);
      if (res.success) {
        toast.success('Marked dispatched — the customer can track it now.');
        setDispatchFor(null);
        setAwbForm({ awb: '', partnerName: '', trackingUrl: '' });
        load();
      }
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Dispatch could not be recorded.');
    } finally {
      setBusyId('');
    }
  };

  const inputBase = 'w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-seller-primary/30';

  return (
    <PageWrapper>
      <div className="p-4 md:p-6">
        <header className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-seller-light text-seller-primary">
            <Layers size={20} />
          </div>
          <div>
            <h1 className="font-display text-xl font-black text-slate-900">Sample requests</h1>
            <p className="text-xs font-semibold text-slate-500">
              Swatches convert browsers into buyers — approve and dispatch quickly.
            </p>
          </div>
        </header>

        <div className="mb-4 flex gap-2 overflow-x-auto scrollbar-hide">
          {TABS.map((tab) => (
            <button
              key={tab.label}
              type="button"
              onClick={() => setStatus(tab.value)}
              className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                status === tab.value
                  ? 'bg-seller-primary text-white'
                  : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading && (
          <div className="space-y-3">
            {[0, 1].map((i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-100" />)}
          </div>
        )}

        {!loading && samples.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center">
            <Inbox className="mx-auto mb-3 text-slate-300" size={40} />
            <p className="font-semibold text-slate-900">Nothing in this view</p>
          </div>
        )}

        <ul className="space-y-3">
          {samples.map((sample) => (
            <li key={sample._id} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="font-display text-sm font-bold text-slate-900">{sample.requestNumber}</span>
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${
                  SAMPLE_STATUS_STYLES[sample.status] || SAMPLE_STATUS_STYLES.requested
                }`}
                >
                  {SAMPLE_STATUS_LABELS[sample.status] || sample.status}
                </span>
                {sample.autoApproved && (
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                    verified business
                  </span>
                )}
              </div>

              <p className="text-sm text-slate-700">
                {(sample.items || []).map((i) => i.productName).filter(Boolean).join(', ')}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {sample.customerId?.fullName || 'Customer'}
                {sample.companyName && ` · ${sample.companyName}`}
                {' · '}{sample.deliveryAddress?.city} {sample.deliveryAddress?.pincode}
                {' · '}{String(sample.purpose || '').replace(/_/g, ' ')}
              </p>
              {sample.notes && <p className="mt-1 text-xs italic text-slate-500">“{sample.notes}”</p>}

              <div className="mt-3 flex flex-wrap gap-2">
                {sample.status === 'requested' && (
                  <>
                    <button
                      type="button"
                      onClick={() => approve(sample._id)}
                      disabled={busyId === sample._id}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-seller-primary px-4 py-2 text-sm font-semibold text-white hover:bg-seller-dark disabled:opacity-50"
                    >
                      <Check size={14} /> Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => decline(sample._id)}
                      disabled={busyId === sample._id}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                    >
                      <X size={14} /> Decline
                    </button>
                  </>
                )}

                {sample.status === 'approved' && (
                  <button
                    type="button"
                    onClick={() => setDispatchFor(sample)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-seller-primary px-4 py-2 text-sm font-semibold text-white hover:bg-seller-dark"
                  >
                    <Truck size={14} /> Mark dispatched
                  </button>
                )}

                {sample.courier?.awb && (
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
                    AWB <span className="font-mono">{sample.courier.awb}</span>
                    {sample.courier.partnerName && ` · ${sample.courier.partnerName}`}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>

        {dispatchFor && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <form onSubmit={dispatch} className="w-full max-w-md rounded-2xl bg-white p-5">
              <h2 className="mb-1 font-display text-lg font-bold text-slate-900">Dispatch {dispatchFor.requestNumber}</h2>
              <p className="mb-4 text-xs text-slate-500">
                The AWB puts this sample on the same live tracking the customer sees for orders.
              </p>

              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-500">
                    AWB number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text" value={awbForm.awb}
                    onChange={(e) => setAwbForm({ ...awbForm, awb: e.target.value })}
                    className={inputBase}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-500">Courier</label>
                  <input
                    type="text" value={awbForm.partnerName}
                    onChange={(e) => setAwbForm({ ...awbForm, partnerName: e.target.value })}
                    placeholder="Bluedart, Delhivery…"
                    className={inputBase}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-500">Tracking URL (optional)</label>
                  <input
                    type="url" value={awbForm.trackingUrl}
                    onChange={(e) => setAwbForm({ ...awbForm, trackingUrl: e.target.value })}
                    className={inputBase}
                  />
                </div>
              </div>

              <div className="mt-5 flex gap-2">
                <button
                  type="submit"
                  disabled={busyId === dispatchFor._id}
                  className="flex-1 rounded-xl bg-seller-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-seller-dark disabled:opacity-50"
                >
                  {busyId === dispatchFor._id ? 'Saving…' : 'Confirm dispatch'}
                </button>
                <button
                  type="button"
                  onClick={() => setDispatchFor(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </PageWrapper>
  );
};

export default SellerSamples;
