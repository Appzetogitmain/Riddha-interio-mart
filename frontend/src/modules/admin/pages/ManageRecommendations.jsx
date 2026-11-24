import React, { useState, useEffect, useRef } from 'react';
import { FiSearch, FiTrash2, FiArrowUp, FiArrowDown, FiSave, FiPlus } from 'react-icons/fi';
import api from '../../../shared/utils/api';
import toast from 'react-hot-toast';

const TABS = [
  {
    id: 'personalized',
    label: 'Picks For You',
    logic: 'Automatic: ranks products by what the shopper viewed, wishlisted or bought (same categories get a boost), their saved style/budget profile, plus rating and review count. Already-purchased items are pushed down. Guests see top-rated items.',
  },
  {
    id: 'trending',
    label: 'Trending This Week',
    logic: 'Automatic: most-reviewed, then highest-rated, then newest in-stock products. Same for every visitor.',
  },
  {
    id: 'cross-sell',
    label: 'Complete the Look',
    logic: 'Automatic: suggests complementary items for what the shopper viewed (e.g. rugs & lamps for a sofa, tiles for a basin) and avoids more of the same category.',
  },
];

const ManageRecommendations = () => {
  const [tab, setTab] = useState('personalized');
  const [lists, setLists] = useState({ personalized: [], trending: [], 'cross-sell': [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const timer = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/recommendations/curation');
        setLists(prev => ({ ...prev, ...(res.data?.data || {}) }));
      } catch {
        toast.error('Failed to load curated products');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    clearTimeout(timer.current);
    if (query.trim().length < 2) { setResults([]); return; }
    timer.current = setTimeout(async () => {
      try {
        setSearching(true);
        const res = await api.get('/products', { params: { search: query.trim(), limit: 12 } });
        setResults(res.data?.data || []);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => clearTimeout(timer.current);
  }, [query]);

  const current = lists[tab] || [];
  const setCurrent = (next) => setLists(prev => ({ ...prev, [tab]: next }));
  const has = (id) => current.some(p => String(p._id) === String(id));

  const add = (p) => {
    if (has(p._id)) return;
    setCurrent([...current, { _id: p._id, name: p.name, price: p.price, images: p.images }]);
  };
  const remove = (id) => setCurrent(current.filter(p => String(p._id) !== String(id)));
  const move = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= current.length) return;
    const next = [...current];
    [next[i], next[j]] = [next[j], next[i]];
    setCurrent(next);
  };

  const save = async () => {
    try {
      setSaving(true);
      await api.put(`/recommendations/curation/${tab}`, { productIds: current.map(p => p._id) });
      toast.success('Saved. Storefront updated.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const activeTab = TABS.find(t => t.id === tab);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-800">Homepage Recommendation Tabs</h1>
        <p className="text-sm text-gray-500 mt-1">Pin products to a tab. Pinned products always show first, in the order below; the automatic logic fills the remaining slots.</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); setQuery(''); }}
            className={`px-4 py-2 rounded-xl text-sm font-bold border transition-colors ${tab === t.id ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-gray-600 border-gray-200 hover:border-teal-400'}`}
          >
            {t.label} <span className="opacity-70">({(lists[t.id] || []).length})</span>
          </button>
        ))}
      </div>

      <div className="bg-teal-50 border border-teal-100 rounded-xl p-4 text-sm text-teal-900">
        <span className="font-bold">How "{activeTab.label}" is decided automatically: </span>{activeTab.logic}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Add products */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
            <h2 className="font-black text-slate-800">Add products</h2>
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search products by name…"
                className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-500"
              />
            </div>
            <div className="space-y-2 max-h-[420px] overflow-y-auto">
              {searching && <p className="text-xs text-gray-400">Searching…</p>}
              {!searching && query.trim().length >= 2 && results.length === 0 && <p className="text-xs text-gray-400">No products found.</p>}
              {results.map(p => (
                <div key={p._id} className="flex items-center gap-3 p-2 rounded-xl border border-gray-100">
                  <img src={p.images?.[0]} alt="" className="w-12 h-12 rounded-lg object-cover bg-gray-50" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{p.name}</p>
                    <p className="text-xs text-gray-500">₹{p.price?.toLocaleString()}</p>
                  </div>
                  <button
                    onClick={() => add(p)}
                    disabled={has(p._id)}
                    className="px-3 py-1.5 text-xs font-bold rounded-lg bg-teal-600 text-white disabled:bg-gray-200 disabled:text-gray-500 flex items-center gap-1"
                  >
                    <FiPlus /> {has(p._id) ? 'Added' : 'Add'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Pinned list */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-black text-slate-800">Pinned in "{activeTab.label}"</h2>
              <button onClick={save} disabled={saving} className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-bold flex items-center gap-2 disabled:opacity-50">
                <FiSave /> {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
            {current.length === 0 ? (
              <p className="text-sm text-gray-400 py-10 text-center border border-dashed border-gray-200 rounded-xl">Nothing pinned. This tab uses the automatic logic only.</p>
            ) : (
              <div className="space-y-2 max-h-[420px] overflow-y-auto">
                {current.map((p, i) => (
                  <div key={p._id} className="flex items-center gap-3 p-2 rounded-xl border border-gray-100">
                    <span className="w-6 text-center text-xs font-black text-gray-400">{i + 1}</span>
                    <img src={p.images?.[0]} alt="" className="w-12 h-12 rounded-lg object-cover bg-gray-50" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{p.name}</p>
                      <p className="text-xs text-gray-500">₹{p.price?.toLocaleString()}</p>
                    </div>
                    <button onClick={() => move(i, -1)} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg"><FiArrowUp /></button>
                    <button onClick={() => move(i, 1)} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg"><FiArrowDown /></button>
                    <button onClick={() => remove(p._id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"><FiTrash2 /></button>
                  </div>
                ))}
              </div>
            )}
            <p className="text-[11px] text-gray-400">Out-of-stock or unapproved products are skipped automatically on the storefront.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageRecommendations;
