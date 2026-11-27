import React, { useState, useEffect, useMemo } from 'react';
import { LuCheck, LuWallet, LuCreditCard, LuX, LuClock, LuEye, LuMousePointerClick } from 'react-icons/lu';
import toast from 'react-hot-toast';
import api from '../../../shared/utils/api';
import PageWrapper from '../components/PageWrapper';
import BannerMediaUpload from '../../../shared/components/BannerMediaUpload';

const STATUS_STYLE = {
  PendingReview: 'bg-amber-50 text-amber-700',
  Active: 'bg-emerald-50 text-emerald-700',
  Rejected: 'bg-red-50 text-red-700',
  Expired: 'bg-gray-100 text-gray-600',
};
const STATUS_LABEL = { PendingReview: 'Awaiting approval', Active: 'Live', Rejected: 'Rejected (refunded)', Expired: 'Ended' };

const loadRazorpay = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');

const CategoryBannerAds = () => {
  const [plans, setPlans] = useState([]);
  const [ads, setAds] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(null); // plan being bought
  const [form, setForm] = useState({ categories: [], media: null, linkUrl: '', altText: '', paymentMethod: 'Wallet' });
  const [usage, setUsage] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const loadAds = () => api.get('/category-banners/my-ads').then(r => setAds(r.data.data || [])).catch(() => {});

  useEffect(() => {
    Promise.all([
      api.get('/category-banners/plans').then(r => setPlans(r.data.data || [])),
      api.get('/categories').then(r => setCategories(r.data.data || [])),
      loadAds(),
    ]).catch(() => toast.error('Failed to load banner plans')).finally(() => setLoading(false));
  }, []);

  const openBuy = (plan) => {
    setBuying(plan);
    setForm({ categories: [], media: null, linkUrl: '', altText: '', paymentMethod: 'Wallet' });
    api.get('/category-banners/availability', { params: { categories: categories.map(c => c._id).join(',') } })
      .then(r => setUsage(r.data.data || {})).catch(() => setUsage({}));
  };

  const toggleCategory = (id) => setForm(f => {
    if (f.categories.includes(id)) return { ...f, categories: f.categories.filter(c => c !== id) };
    if (f.categories.length >= buying.maxCategories) {
      toast.error(`This plan allows up to ${buying.maxCategories} categor${buying.maxCategories === 1 ? 'y' : 'ies'}`);
      return f;
    }
    return { ...f, categories: [...f.categories, id] };
  });

  const canSubmit = form.categories.length > 0 && form.media && !submitting;

  const submit = async () => {
    try {
      setSubmitting(true);
      const { data } = await api.post('/category-banners/ads', { planId: buying._id, ...form });
      if (data.requiresPayment) {
        const [{ data: cfg }, ok] = await Promise.all([api.get('/config/razorpay'), loadRazorpay()]);
        if (!ok || !cfg.key) { toast.error('Online payment is unavailable right now.'); setSubmitting(false); return; }
        const rzp = new window.Razorpay({
          key: cfg.key, amount: data.amount, currency: data.currency, name: 'Riddha Interio Mart',
          description: `Category banner: ${data.planName}`, order_id: data.razorpayOrderId,
          handler: async (resp) => {
            try {
              await api.post(`/category-banners/ads/${data.adId}/verify-payment`, resp);
              toast.success('Payment received. Your banner is now awaiting approval.');
              setBuying(null); loadAds();
            } catch { toast.error('Payment verification failed. Contact support if you were charged.'); }
            finally { setSubmitting(false); }
          },
          modal: { ondismiss: () => { toast.error('Payment cancelled'); setSubmitting(false); } },
          theme: { color: '#0F9488' },
        });
        rzp.on('payment.failed', (r) => { toast.error(r.error?.description || 'Payment failed'); setSubmitting(false); });
        rzp.open();
        return;
      }
      toast.success('Purchased. Your banner is now awaiting approval.');
      setBuying(null); loadAds();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not complete the purchase');
    } finally {
      if (!(form.paymentMethod === 'Online')) setSubmitting(false);
    }
  };

  const catName = useMemo(() => Object.fromEntries(categories.map(c => [c._id, c.name])), [categories]);

  return (
    <PageWrapper>
      <div className="p-4 md:p-8 w-full space-y-10">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Category Banner Ads</h1>
          <p className="text-gray-600 mt-2 max-w-2xl">Put your brand at the top of the category pages your customers browse. Pick a plan, choose the categories, upload your banner and we review and publish it.</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600" /></div>
        ) : (
          <>
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {plans.length === 0 && <p className="text-gray-500 col-span-full">No banner plans are available yet.</p>}
              {plans.map(plan => (
                <div key={plan._id} className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm flex flex-col">
                  <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                  {plan.description && <p className="text-sm text-gray-500 mt-1">{plan.description}</p>}
                  <div className="mt-4"><span className="text-3xl font-extrabold text-gray-900">₹{plan.price.toLocaleString('en-IN')}</span><span className="text-gray-500"> / {plan.durationDays} days</span></div>
                  <ul className="mt-4 space-y-2 text-sm text-gray-700 flex-grow">
                    <li className="flex gap-2"><LuCheck className="text-teal-600 mt-0.5" /> Up to {plan.maxCategories} categor{plan.maxCategories === 1 ? 'y' : 'ies'}</li>
                    <li className="flex gap-2"><LuCheck className="text-teal-600 mt-0.5" /> {plan.allowVideo ? 'Image or video banner' : 'Image banner'}</li>
                    <li className="flex gap-2"><LuCheck className="text-teal-600 mt-0.5" /> Shown at the top of the category page</li>
                    <li className="flex gap-2"><LuCheck className="text-teal-600 mt-0.5" /> Views and clicks report</li>
                  </ul>
                  <button onClick={() => openBuy(plan)} className="mt-6 w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm">Choose this plan</button>
                </div>
              ))}
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">My banners</h2>
              {ads.length === 0 ? (
                <p className="text-gray-500 text-sm bg-gray-50 border border-dashed border-gray-200 rounded-xl p-8 text-center">You haven't booked a banner yet.</p>
              ) : (
                <div className="space-y-4">
                  {ads.map(ad => (
                    <div key={ad._id} className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col md:flex-row gap-4">
                      <div className="md:w-72 shrink-0 aspect-[16/5] rounded-lg overflow-hidden bg-gray-100">
                        {ad.media?.type === 'video'
                          ? <video src={ad.media.url} className="w-full h-full object-contain bg-black" muted loop autoPlay playsInline />
                          : <img src={ad.media?.url} alt="" className="w-full h-full object-contain" />}
                      </div>
                      <div className="flex-1 space-y-1.5 text-sm">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-gray-900">{ad.plan?.name}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${STATUS_STYLE[ad.status]}`}>{STATUS_LABEL[ad.status] || ad.status}</span>
                        </div>
                        <p className="text-gray-600">Categories: {(ad.categories || []).map(c => c.name).join(', ')}</p>
                        <p className="text-gray-500 flex items-center gap-1"><LuClock size={13} /> {ad.status === 'PendingReview' ? 'Starts once approved' : `${fmtDate(ad.startDate)} → ${fmtDate(ad.endDate)}`}</p>
                        {ad.status === 'Rejected' && <p className="text-red-600">Reason: {ad.rejectionReason}. ₹{ad.amountPaid.toLocaleString('en-IN')} was refunded to your wallet.</p>}
                        {(ad.status === 'Active' || ad.status === 'Expired') && (
                          <p className="text-gray-700 flex gap-4">
                            <span className="flex items-center gap-1"><LuEye size={13} /> {ad.impressions} views</span>
                            <span className="flex items-center gap-1"><LuMousePointerClick size={13} /> {ad.clicks} clicks{ad.impressions ? ` (${((ad.clicks / ad.impressions) * 100).toFixed(1)}%)` : ''}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>

      {buying && (
        <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col">
            <div className="p-5 border-b flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{buying.name}: ₹{buying.price.toLocaleString('en-IN')} for {buying.durationDays} days</h3>
                <p className="text-xs text-gray-500">Pick up to {buying.maxCategories} categor{buying.maxCategories === 1 ? 'y' : 'ies'}, upload your banner, then pay.</p>
              </div>
              <button onClick={() => setBuying(null)} className="p-2 hover:bg-gray-100 rounded-full"><LuX /></button>
            </div>

            <div className="p-5 space-y-5 overflow-y-auto">
              <div>
                <p className="text-sm font-semibold text-gray-800 mb-2">1. Categories ({form.categories.length}/{buying.maxCategories})</p>
                <div className="flex flex-wrap gap-2">
                  {categories.map(c => {
                    const taken = usage[c._id] || 0;
                    const full = taken >= buying.slotsPerCategory;
                    const on = form.categories.includes(c._id);
                    return (
                      <button key={c._id} type="button" disabled={full} onClick={() => toggleCategory(c._id)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${on ? 'bg-teal-600 text-white border-teal-600' : full ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' : 'bg-white text-gray-700 border-gray-300 hover:border-teal-500'}`}>
                        {c.name}{full ? ' (full)' : ` · ${buying.slotsPerCategory - taken} slot${buying.slotsPerCategory - taken === 1 ? '' : 's'} left`}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-800 mb-2">2. Banner artwork</p>
                <BannerMediaUpload value={form.media} onChange={(m) => setForm(f => ({ ...f, media: m }))} allowVideo={buying.allowVideo} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-700">Where should it link? (optional)</label>
                  <input value={form.linkUrl} onChange={e => setForm(f => ({ ...f, linkUrl: e.target.value }))} placeholder="/products/…  or  https://…" className="mt-1 w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-500" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700">Short description for accessibility</label>
                  <input value={form.altText} maxLength={120} onChange={e => setForm(f => ({ ...f, altText: e.target.value }))} placeholder="e.g. Flat 20% off sofas" className="mt-1 w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-500" />
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-800 mb-2">3. Payment</p>
                <div className="grid grid-cols-2 gap-3">
                  {[['Wallet', 'Seller wallet', LuWallet], ['Online', 'Pay online', LuCreditCard]].map(([val, label, Icon]) => (
                    <button key={val} type="button" onClick={() => setForm(f => ({ ...f, paymentMethod: val }))}
                      className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-semibold ${form.paymentMethod === val ? 'border-teal-600 bg-teal-50 text-teal-700' : 'border-gray-200 text-gray-700'}`}>
                      <Icon /> {label}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-gray-500 mt-2">Banners go live after our team approves them. If a banner is rejected, the full amount is refunded to your wallet.</p>
              </div>
            </div>

            <div className="p-4 border-t flex justify-end gap-3">
              <button onClick={() => setBuying(null)} className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-gray-100 text-gray-600">Cancel</button>
              <button onClick={submit} disabled={!canSubmit} className="px-5 py-2.5 rounded-xl text-sm font-bold bg-teal-600 hover:bg-teal-700 text-white disabled:opacity-50">
                {submitting ? 'Processing…' : `Pay ₹${buying.price.toLocaleString('en-IN')}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageWrapper>
  );
};

export default CategoryBannerAds;
