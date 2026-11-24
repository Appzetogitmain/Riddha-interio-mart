import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../../../shared/utils/api';
import { clearDisplayConfigCache } from '../../../shared/utils/productDisplay';
import PageWrapper from '../components/PageWrapper';
import { isSuperAdmin } from '../components/DisplayOverridesPanel';

const POSITIONS = [['top-left', 'Top left'], ['top-right', 'Top right'], ['bottom-left', 'Bottom left'], ['bottom-right', 'Bottom right']];
const inp = 'w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-500 disabled:bg-gray-50 disabled:text-gray-500';
const lbl = 'text-xs font-bold text-gray-700';

const Toggle = ({ label, hint, checked, onChange, disabled }) => (
  <label className={`flex items-start gap-3 p-3 rounded-xl border ${checked ? 'border-teal-300 bg-teal-50/50' : 'border-gray-200'} ${disabled ? 'opacity-70' : 'cursor-pointer'}`}>
    <input type="checkbox" disabled={disabled} className="mt-1 accent-teal-600" checked={checked} onChange={e => onChange(e.target.checked)} />
    <span><span className="block text-sm font-semibold text-gray-800">{label}</span>{hint && <span className="block text-xs text-gray-500">{hint}</span>}</span>
  </label>
);

const RatingBestsellerSettings = () => {
  const superAdmin = isSuperAdmin();
  const [s, setS] = useState(null);
  const [preview, setPreview] = useState(null);
  const [audit, setAudit] = useState([]);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [a, b] = await Promise.all([api.get('/display/settings'), api.get('/display/bestsellers')]);
      setS(a.data.data);
      setPreview(b.data.data);
      if (superAdmin) api.get('/display/audit').then(r => setAudit(r.data.data || [])).catch(() => {});
    } catch { toast.error('Failed to load settings'); }
  }, [superAdmin]);

  useEffect(() => { load(); }, [load]);

  if (!s) return <PageWrapper><div className="flex justify-center py-24"><div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" /></div></PageWrapper>;

  const rs = s.ratingSettings, bs = s.bestsellerSettings;
  const setR = (k, v) => setS({ ...s, ratingSettings: { ...rs, [k]: v } });
  const setB = (k, v) => setS({ ...s, bestsellerSettings: { ...bs, [k]: v } });
  const setBadge = (k, v) => setS({ ...s, bestsellerSettings: { ...bs, badge: { ...bs.badge, [k]: v } } });

  const save = async () => {
    try {
      setSaving(true);
      await api.put('/display/settings', s);
      clearDisplayConfigCache();
      toast.success('Settings saved');
      load();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to save settings'); }
    finally { setSaving(false); }
  };

  const ro = !superAdmin;

  return (
    <PageWrapper>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Ratings, Reviews & Bestsellers</h1>
            <p className="text-sm text-gray-500 mt-0.5">Controls how ratings and the Bestseller badge work across the store.</p>
          </div>
          {superAdmin && <button onClick={save} disabled={saving} className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold disabled:opacity-50">{saving ? 'Saving…' : 'Save settings'}</button>}
        </div>
        {ro && <p className="text-xs bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-3">You can view these settings. Only the Super Admin can change them.</p>}

        <section className="bg-white border border-gray-200 rounded-2xl p-5 space-y-3">
          <h2 className="font-bold text-gray-900">Ratings & reviews</h2>
          <Toggle disabled={ro} label="Ratings and reviews feature" hint="Master switch. When off, stars and reviews are hidden everywhere and customers cannot post reviews." checked={rs.ratingsEnabled} onChange={v => setR('ratingsEnabled', v)} />
          <Toggle disabled={ro} label="Customers can write reviews" hint="Turn off to stop new reviews but keep showing existing ones." checked={rs.reviewsEnabled} onChange={v => setR('reviewsEnabled', v)} />
          <Toggle disabled={ro} label="Show the automatic rating" hint="Average of approved reviews. If off, only manually overridden ratings are shown." checked={rs.autoRatingEnabled} onChange={v => setR('autoRatingEnabled', v)} />
          <div>
            <label className={lbl}>New reviews are</label>
            <select disabled={ro} className={inp + ' mt-1 max-w-xs'} value={rs.reviewApproval} onChange={e => setR('reviewApproval', e.target.value)}>
              <option value="manual">Held until an admin approves them (recommended)</option>
              <option value="auto">Published immediately</option>
            </select>
            <p className="text-[11px] text-gray-500 mt-1">Only approved reviews count toward a product's rating. Approve them under Product Reviews.</p>
          </div>
        </section>

        <section className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
          <h2 className="font-bold text-gray-900">Bestseller rules</h2>
          <Toggle disabled={ro} label="Detect bestsellers automatically" hint="Ranks products by units sold. Cancelled, returned and refunded orders are not counted." checked={bs.autoEnabled} onChange={v => setB('autoEnabled', v)} />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div><label className={lbl}>Look at the last</label>
              <select disabled={ro} className={inp + ' mt-1'} value={bs.periodDays} onChange={e => setB('periodDays', Number(e.target.value))}>
                {[7, 30, 90].map(d => <option key={d} value={d}>{d} days</option>)}
              </select></div>
            <div><label className={lbl}>Minimum units sold</label><input disabled={ro} type="number" min="0" className={inp + ' mt-1'} value={bs.minSales} onChange={e => setB('minSales', e.target.value)} /></div>
            <div><label className={lbl}>Maximum bestsellers</label><input disabled={ro} type="number" min="1" max="100" className={inp + ' mt-1'} value={bs.maxProducts} onChange={e => setB('maxProducts', e.target.value)} /></div>
          </div>

          <h3 className="font-semibold text-gray-800 pt-2">Default badge</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div><label className={lbl}>Text</label><input disabled={ro} maxLength={20} className={inp + ' mt-1'} value={bs.badge.text} onChange={e => setBadge('text', e.target.value)} /></div>
            <div><label className={lbl}>Background</label><input disabled={ro} type="color" className="mt-1 w-full h-10 rounded-xl border border-gray-200" value={bs.badge.bgColor} onChange={e => setBadge('bgColor', e.target.value)} /></div>
            <div><label className={lbl}>Text colour</label><input disabled={ro} type="color" className="mt-1 w-full h-10 rounded-xl border border-gray-200" value={bs.badge.textColor} onChange={e => setBadge('textColor', e.target.value)} /></div>
            <div><label className={lbl}>Position on image</label>
              <select disabled={ro} className={inp + ' mt-1'} value={bs.badge.position} onChange={e => setBadge('position', e.target.value)}>{POSITIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
          </div>
          <div className="relative w-44 h-28 rounded-xl bg-gray-100 border border-gray-200 overflow-hidden">
            <span className="absolute px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider shadow"
              style={{ backgroundColor: bs.badge.bgColor, color: bs.badge.textColor, top: bs.badge.position.startsWith('top') ? 8 : 'auto', bottom: bs.badge.position.startsWith('bottom') ? 8 : 'auto', left: bs.badge.position.endsWith('left') ? 8 : 'auto', right: bs.badge.position.endsWith('right') ? 8 : 'auto' }}>
              {bs.badge.text || 'BESTSELLER'}
            </span>
            <span className="absolute inset-0 flex items-center justify-center text-xs text-gray-400">product image</span>
          </div>
        </section>

        <section className="bg-white border border-gray-200 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-900">Current bestsellers ({preview?.products?.length || 0})</h2>
            <button onClick={load} className="text-xs font-bold text-teal-700">Refresh</button>
          </div>
          <p className="text-[11px] text-gray-500 mb-3">Based on the saved settings. The list is cached for up to 15 minutes and refreshes when an order changes or settings are saved. Mark or unmark individual products from each product's edit page.</p>
          {(preview?.products || []).length === 0 ? <p className="text-sm text-gray-400">No products qualify right now.</p> : (
            <div className="divide-y divide-gray-100">
              {preview.products.map(p => (
                <div key={p._id} className="flex items-center gap-3 py-2">
                  <img src={p.image} alt="" className="w-10 h-10 rounded-lg object-cover bg-gray-100" />
                  <p className="flex-1 text-sm font-semibold text-gray-800 truncate">{p.name}</p>
                  <span className="text-xs text-gray-500">{p.units} sold</span>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${p.source === 'manual' ? 'bg-indigo-50 text-indigo-700' : 'bg-emerald-50 text-emerald-700'}`}>{p.source}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {superAdmin && (
          <section className="bg-white border border-gray-200 rounded-2xl p-5">
            <h2 className="font-bold text-gray-900 mb-3">Audit log (manual changes)</h2>
            {audit.length === 0 ? <p className="text-sm text-gray-400">No changes yet.</p> : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {audit.map(a => (
                  <div key={a._id} className="text-xs border border-gray-100 rounded-lg p-2">
                    <p className="font-semibold text-gray-800">{a.adminName} · {a.productName || 'Global settings'} · {a.action.replace('_', ' ')} · {new Date(a.createdAt).toLocaleString('en-IN')}</p>
                    <p className="text-gray-500 break-words">{a.changes.map(c => `${c.field.replace('displayOverrides.', '')}: ${JSON.stringify(c.from)} → ${JSON.stringify(c.to)}`).join(' · ') || 'no field changes'}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </PageWrapper>
  );
};

export default RatingBestsellerSettings;
