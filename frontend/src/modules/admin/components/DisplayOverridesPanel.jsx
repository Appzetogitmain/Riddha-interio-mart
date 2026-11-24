import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../../../shared/utils/api';
import { clearDisplayConfigCache } from '../../../shared/utils/productDisplay';
import StarRating from '../../user/components/StarRating';

const POSITIONS = [['top-left', 'Top left'], ['top-right', 'Top right'], ['bottom-left', 'Bottom left'], ['bottom-right', 'Bottom right']];

export const isSuperAdmin = () => {
  try {
    const a = JSON.parse(localStorage.getItem('riddha_admin') || 'null');
    return !!a && (!a.type || a.type === 'superadmin');
  } catch { return false; }
};

const field = 'w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-500';
const lbl = 'text-[10px] font-black text-gray-500 uppercase tracking-widest';

/**
 * Super-admin only: override how a product's rating, review count and Bestseller badge are DISPLAYED.
 * The real values are never changed; "Reset to automatic" removes every override.
 */
const DisplayOverridesPanel = ({ productId }) => {
  const superAdmin = isSuperAdmin();
  const [data, setData] = useState(null);
  const [ov, setOv] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await api.get(`/display/products/${productId}`);
      setData(r.data.data);
      setOv(r.data.data.overrides);
    } catch { toast.error('Could not load display overrides'); }
  }, [productId]);

  useEffect(() => { if (productId) load(); }, [productId, load]);

  if (!data || !ov) return null;

  if (!superAdmin) {
    return (
      <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 text-xs text-gray-500">
        Rating and Bestseller display overrides can only be changed by the Super Admin.
      </div>
    );
  }

  const set = (path, value) => setOv(prev => {
    const next = JSON.parse(JSON.stringify(prev));
    let o = next;
    const keys = path.split('.');
    keys.slice(0, -1).forEach(k => { o[k] = o[k] || {}; o = o[k]; });
    o[keys[keys.length - 1]] = value;
    return next;
  });

  const save = async () => {
    try {
      setSaving(true);
      await api.put(`/display/products/${productId}`, ov);
      clearDisplayConfigCache();
      toast.success('Display settings saved');
      load();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const reset = async () => {
    if (!window.confirm('Reset every manual override for this product back to automatic?')) return;
    try {
      setSaving(true);
      await api.post(`/display/products/${productId}/reset`);
      clearDisplayConfigCache();
      toast.success('Back to automatic');
      load();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to reset'); }
    finally { setSaving(false); }
  };

  const badge = ov.badge || {};
  const previewBadge = { text: badge.useCustom && badge.text ? badge.text : data.defaults.text, bgColor: badge.useCustom && badge.bgColor ? badge.bgColor : data.defaults.bgColor, textColor: badge.useCustom && badge.textColor ? badge.textColor : data.defaults.textColor };

  return (
    <div className="rounded-2xl border border-indigo-200 bg-indigo-50/40 p-5 space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-gray-900">Display overrides <span className="ml-2 text-[10px] font-black px-2 py-0.5 rounded bg-indigo-600 text-white uppercase tracking-wider">Super Admin</span></h3>
          <p className="text-xs text-gray-500 mt-0.5">Changes what shoppers see. The real rating and review count are never changed.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={reset} disabled={saving} className="px-4 py-2 rounded-xl text-xs font-bold bg-white border border-gray-300 text-gray-700 hover:bg-gray-50">Reset to automatic</button>
          <button type="button" onClick={save} disabled={saving} className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50">{saving ? 'Saving…' : 'Save display settings'}</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        <div className="bg-white rounded-xl p-3 border border-gray-200"><p className={lbl}>Real (actual)</p><p className="mt-1 font-bold text-gray-900">{data.actual.averageRating} ★ · {data.actual.totalReviews} reviews</p></div>
        <div className="bg-white rounded-xl p-3 border border-gray-200"><p className={lbl}>Shoppers currently see</p>
          <div className="mt-1">{data.effective.showRating ? <StarRating rating={data.effective.rating} count={data.effective.reviewCount} size={12} /> : <span className="text-gray-400">No rating shown</span>}</div></div>
        <div className="bg-white rounded-xl p-3 border border-gray-200"><p className={lbl}>Bestseller badge</p>
          <p className="mt-1 font-bold">{data.effective.badge ? <span className="px-2 py-0.5 rounded text-[10px]" style={{ backgroundColor: data.effective.badge.bgColor, color: data.effective.badge.textColor }}>{data.effective.badge.text}</span> : <span className="text-gray-400 font-medium">Not a bestseller</span>}</p></div>
      </div>

      {/* Bestseller mark */}
      <div className="space-y-2">
        <p className={lbl}>Bestseller status</p>
        <div className="flex flex-wrap gap-2">
          {[['auto', 'Automatic (by sales)'], ['on', 'Always Bestseller'], ['off', 'Never Bestseller']].map(([val, label]) => (
            <button type="button" key={val} onClick={() => set('bestseller', val)} className={`px-3 py-2 rounded-xl text-xs font-bold border ${ov.bestseller === val ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700 border-gray-200'}`}>{label}</button>
          ))}
        </div>
      </div>

      {/* Rating / count */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" className="accent-indigo-600" checked={!!ov.rating?.enabled} onChange={e => set('rating.enabled', e.target.checked)} /> Override displayed rating</label>
          <input type="number" min="0" max="5" step="0.1" disabled={!ov.rating?.enabled} value={ov.rating?.value ?? ''} onChange={e => set('rating.value', e.target.value)} placeholder="0 – 5" className={field + ' disabled:opacity-50'} />
        </div>
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" className="accent-indigo-600" checked={!!ov.reviewCount?.enabled} onChange={e => set('reviewCount.enabled', e.target.checked)} /> Override displayed review count</label>
          <input type="number" min="0" step="1" disabled={!ov.reviewCount?.enabled} value={ov.reviewCount?.value ?? ''} onChange={e => set('reviewCount.value', e.target.value)} placeholder="e.g. 250" className={field + ' disabled:opacity-50'} />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" className="accent-indigo-600" checked={!ov.hideRating} onChange={e => set('hideRating', !e.target.checked)} /> Show star rating on this product</label>

      {/* Badge */}
      <div className="space-y-3">
        <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" className="accent-indigo-600" checked={badge.enabled !== false} onChange={e => set('badge.enabled', e.target.checked)} /> Show the Bestseller badge on this product (when it is a bestseller)</label>
        <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" className="accent-indigo-600" checked={!!badge.useCustom} onChange={e => set('badge.useCustom', e.target.checked)} /> Use a custom badge for this product</label>
        {badge.useCustom && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div><label className={lbl}>Text</label><input maxLength={20} value={badge.text || ''} onChange={e => set('badge.text', e.target.value)} placeholder="TRENDING" className={field} /></div>
            <div><label className={lbl}>Background</label><input type="color" value={badge.bgColor || data.defaults.bgColor} onChange={e => set('badge.bgColor', e.target.value)} className="w-full h-10 rounded-xl border border-gray-200 bg-white" /></div>
            <div><label className={lbl}>Text colour</label><input type="color" value={badge.textColor || data.defaults.textColor} onChange={e => set('badge.textColor', e.target.value)} className="w-full h-10 rounded-xl border border-gray-200 bg-white" /></div>
            <div><label className={lbl}>Position</label>
              <select value={badge.position || data.defaults.position} onChange={e => set('badge.position', e.target.value)} className={field}>{POSITIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
          </div>
        )}
        <div className="flex items-center gap-2 text-xs text-gray-500">Preview: <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider" style={{ backgroundColor: previewBadge.bgColor, color: previewBadge.textColor }}>{previewBadge.text}</span></div>
      </div>

      {data.audit?.length > 0 && (
        <details className="text-xs">
          <summary className="cursor-pointer font-bold text-gray-700">Change history ({data.audit.length})</summary>
          <div className="mt-2 space-y-1.5 max-h-48 overflow-y-auto">
            {data.audit.map(a => (
              <div key={a._id} className="bg-white border border-gray-200 rounded-lg p-2">
                <p className="font-semibold text-gray-800">{a.adminName} · {a.action === 'override_reset' ? 'reset to automatic' : 'edited'} · {new Date(a.createdAt).toLocaleString('en-IN')}</p>
                <p className="text-gray-500 break-words">{a.changes.map(c => `${c.field.replace('displayOverrides.', '')}: ${JSON.stringify(c.from)} → ${JSON.stringify(c.to)}`).join(' · ')}</p>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
};

export default DisplayOverridesPanel;
