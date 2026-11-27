import React, { useState, useEffect, useCallback } from 'react';
import { LuPlus, LuPen, LuCheck, LuX, LuEye, LuMousePointerClick } from 'react-icons/lu';
import toast from 'react-hot-toast';
import api from '../../../shared/utils/api';
import PageWrapper from '../components/PageWrapper';

const EMPTY_PLAN = { _id: null, name: '', description: '', price: '', durationDays: 30, maxCategories: 1, slotsPerCategory: 5, allowVideo: false, isActive: true };
const STATUSES = [['PendingReview', 'Awaiting review'], ['Active', 'Live'], ['Rejected', 'Rejected'], ['Expired', 'Ended'], ['all', 'All']];
const fmt = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');

const ManageCategoryBanners = () => {
  const [tab, setTab] = useState('requests');
  const [plans, setPlans] = useState([]);
  const [ads, setAds] = useState([]);
  const [status, setStatus] = useState('PendingReview');
  const [planForm, setPlanForm] = useState(null);
  const [rejecting, setRejecting] = useState(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  const loadPlans = () => api.get('/category-banners/plans').then(r => setPlans(r.data.data || [])).catch(() => toast.error('Failed to load plans'));
  const loadAds = useCallback(() => api.get('/category-banners/admin/ads', { params: { status } }).then(r => setAds(r.data.data || [])).catch(() => toast.error('Failed to load requests')), [status]);

  useEffect(() => { loadPlans(); }, []);
  useEffect(() => { loadAds(); }, [loadAds]);

  const savePlan = async (e) => {
    e.preventDefault();
    const body = { ...planForm, price: Number(planForm.price), durationDays: Number(planForm.durationDays), maxCategories: Number(planForm.maxCategories), slotsPerCategory: Number(planForm.slotsPerCategory) };
    try {
      setBusy(true);
      if (planForm._id) await api.put(`/category-banners/plans/${planForm._id}`, body);
      else await api.post('/category-banners/plans', body);
      toast.success('Plan saved');
      setPlanForm(null); loadPlans();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to save plan'); }
    finally { setBusy(false); }
  };

  const review = async (id, decision, why) => {
    try {
      setBusy(true);
      await api.put(`/category-banners/admin/ads/${id}/review`, { decision, reason: why });
      toast.success(decision === 'approve' ? 'Banner approved and live' : 'Banner rejected and refunded');
      setRejecting(null); setReason(''); loadAds();
    } catch (err) { toast.error(err.response?.data?.error || 'Action failed'); }
    finally { setBusy(false); }
  };

  const endAd = async (id) => {
    if (!window.confirm('Take this banner down now? No refund is issued.')) return;
    try { await api.put(`/category-banners/admin/ads/${id}/end`); toast.success('Banner ended'); loadAds(); }
    catch (err) { toast.error(err.response?.data?.error || 'Action failed'); }
  };

  const input = 'w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-500';

  return (
    <PageWrapper>
      <div className="w-full space-y-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Category Banner Ads</h1>
          <p className="text-sm text-gray-500 mt-0.5">Sellers buy a plan, choose categories and upload a banner. Approve it here to make it live on those category pages.</p>
        </div>

        <div className="flex gap-2">
          {[['requests', 'Requests'], ['plans', 'Plans']].map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)} className={`px-4 py-2 rounded-xl text-sm font-bold border ${tab === id ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-gray-600 border-gray-200'}`}>{label}</button>
          ))}
        </div>

        {tab === 'plans' && (
          <div className="space-y-4">
            <button onClick={() => setPlanForm({ ...EMPTY_PLAN })} className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-bold flex items-center gap-2"><LuPlus /> New plan</button>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {plans.map(p => (
                <div key={p._id} className="bg-white border border-gray-200 rounded-2xl p-5 space-y-2">
                  <div className="flex items-start justify-between">
                    <h3 className="font-bold text-gray-900">{p.name}</h3>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${p.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>{p.isActive ? 'Active' : 'Hidden'}</span>
                  </div>
                  <p className="text-2xl font-extrabold">₹{p.price.toLocaleString('en-IN')} <span className="text-sm font-medium text-gray-500">/ {p.durationDays} days</span></p>
                  <p className="text-xs text-gray-600">Up to {p.maxCategories} categor{p.maxCategories === 1 ? 'y' : 'ies'} · {p.slotsPerCategory} slots per category · {p.allowVideo ? 'Image or video' : 'Image only'}</p>
                  {p.description && <p className="text-xs text-gray-500">{p.description}</p>}
                  <button onClick={() => setPlanForm({ ...p })} className="mt-2 text-xs font-bold text-teal-700 flex items-center gap-1"><LuPen size={12} /> Edit</button>
                </div>
              ))}
              {plans.length === 0 && <p className="text-gray-400 text-sm col-span-full">No plans yet. Create the first one.</p>}
            </div>
          </div>
        )}

        {tab === 'requests' && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {STATUSES.map(([id, label]) => (
                <button key={id} onClick={() => setStatus(id)} className={`px-3 py-1.5 rounded-full text-xs font-bold border ${status === id ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-gray-600 border-gray-200'}`}>{label}</button>
              ))}
            </div>
            {ads.length === 0 && <p className="text-gray-400 text-sm bg-gray-50 border border-dashed border-gray-200 rounded-xl p-8 text-center">Nothing here.</p>}
            {ads.map(ad => (
              <div key={ad._id} className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col lg:flex-row gap-4">
                <div className="lg:w-80 shrink-0 aspect-[16/5] rounded-lg overflow-hidden bg-gray-100">
                  {ad.media?.type === 'video'
                    ? <video src={ad.media.url} className="w-full h-full object-contain bg-black" controls muted />
                    : <img src={ad.media?.url} alt="" className="w-full h-full object-contain" />}
                </div>
                <div className="flex-1 text-sm space-y-1">
                  <p className="font-bold text-gray-900">{ad.seller?.shopName || ad.seller?.fullName} <span className="font-normal text-gray-500">· {ad.plan?.name} · ₹{ad.amountPaid.toLocaleString('en-IN')} ({ad.paymentMethod})</span></p>
                  <p className="text-gray-600">Categories: {(ad.categories || []).map(c => c.name).join(', ')}</p>
                  <p className="text-gray-600">Link: {ad.linkUrl || 'none'}{ad.altText ? ` · “${ad.altText}”` : ''}</p>
                  <p className="text-gray-500">{ad.status === 'PendingReview' ? `Submitted ${fmt(ad.createdAt)}` : `${fmt(ad.startDate)} → ${fmt(ad.endDate)}`} · {ad.media?.width}×{ad.media?.height}</p>
                  {ad.status === 'Rejected' && <p className="text-red-600">Rejected: {ad.rejectionReason}</p>}
                  {['Active', 'Expired'].includes(ad.status) && <p className="text-gray-700 flex gap-4"><span className="flex items-center gap-1"><LuEye size={13} /> {ad.impressions}</span><span className="flex items-center gap-1"><LuMousePointerClick size={13} /> {ad.clicks}</span></p>}
                </div>
                <div className="flex lg:flex-col gap-2 shrink-0">
                  {ad.status === 'PendingReview' && (
                    <>
                      <button disabled={busy} onClick={() => review(ad._id, 'approve')} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center gap-1 justify-center"><LuCheck size={14} /> Approve</button>
                      <button disabled={busy} onClick={() => { setRejecting(ad); setReason(''); }} className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-lg flex items-center gap-1 justify-center"><LuX size={14} /> Reject</button>
                    </>
                  )}
                  {ad.status === 'Active' && <button onClick={() => endAd(ad._id)} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg">Take down</button>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {planForm && (
        <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={savePlan} className="bg-white rounded-2xl w-full max-w-lg p-6 space-y-4 max-h-[92vh] overflow-y-auto">
            <h3 className="text-lg font-bold">{planForm._id ? 'Edit plan' : 'New plan'}</h3>
            <div><label className="text-xs font-bold text-gray-700">Plan name</label><input required className={input} value={planForm.name} onChange={e => setPlanForm({ ...planForm, name: e.target.value })} placeholder="e.g. Category Spotlight" /></div>
            <div><label className="text-xs font-bold text-gray-700">Description</label><input className={input} value={planForm.description} onChange={e => setPlanForm({ ...planForm, description: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-xs font-bold text-gray-700">Price (₹)</label><input required type="number" min="0" className={input} value={planForm.price} onChange={e => setPlanForm({ ...planForm, price: e.target.value })} /></div>
              <div><label className="text-xs font-bold text-gray-700">Duration (days)</label><input required type="number" min="1" className={input} value={planForm.durationDays} onChange={e => setPlanForm({ ...planForm, durationDays: e.target.value })} /></div>
              <div><label className="text-xs font-bold text-gray-700">Categories per purchase</label><input required type="number" min="1" className={input} value={planForm.maxCategories} onChange={e => setPlanForm({ ...planForm, maxCategories: e.target.value })} /></div>
              <div><label className="text-xs font-bold text-gray-700">Slots per category</label><input required type="number" min="1" className={input} value={planForm.slotsPerCategory} onChange={e => setPlanForm({ ...planForm, slotsPerCategory: e.target.value })} /></div>
            </div>
            <p className="text-[11px] text-gray-500 -mt-2">Slots = how many banners one category page can hold at once (they rotate). 1 means exclusive.</p>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="accent-teal-600" checked={planForm.allowVideo} onChange={e => setPlanForm({ ...planForm, allowVideo: e.target.checked })} /> Allow video banners</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="accent-teal-600" checked={planForm.isActive} onChange={e => setPlanForm({ ...planForm, isActive: e.target.checked })} /> Visible to sellers</label>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setPlanForm(null)} className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-gray-100 text-gray-600">Cancel</button>
              <button disabled={busy} className="px-5 py-2.5 rounded-xl text-sm font-bold bg-teal-600 text-white disabled:opacity-50">Save plan</button>
            </div>
          </form>
        </div>
      )}

      {rejecting && (
        <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-bold">Reject banner</h3>
            <p className="text-sm text-gray-500">The seller sees this reason and the full ₹{rejecting.amountPaid.toLocaleString('en-IN')} is refunded to their wallet.</p>
            <textarea rows={3} value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g. Image is blurry / contains prohibited content" className={input} />
            <div className="flex justify-end gap-3">
              <button onClick={() => setRejecting(null)} className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-gray-100 text-gray-600">Cancel</button>
              <button disabled={busy || !reason.trim()} onClick={() => review(rejecting._id, 'reject', reason)} className="px-5 py-2.5 rounded-xl text-sm font-bold bg-red-600 text-white disabled:opacity-50">Reject & refund</button>
            </div>
          </div>
        </div>
      )}
    </PageWrapper>
  );
};

export default ManageCategoryBanners;
