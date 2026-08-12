import React, { useState, useEffect, useRef, useCallback } from 'react';
import PageWrapper from '../components/PageWrapper';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiPlus, FiX, FiCheck, FiEdit3, FiTrash2, FiImage, FiPackage,
  FiSave, FiSearch, FiEye, FiEyeOff, FiZap
} from 'react-icons/fi';
import api from '../../../shared/utils/api';
import { uploadImage } from '../../../shared/utils/upload';
import { toast } from 'react-hot-toast';

const ROOM_TYPES = ['living', 'bedroom', 'bathroom', 'kitchen', 'office', 'dining', 'outdoor'];

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-deep-espresso/40 backdrop-blur-md z-[200] flex items-center justify-center p-4">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-[32px] p-8 max-w-sm w-full shadow-2xl border border-soft-oatmeal/30 text-center">
        <div className="w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center bg-red-50 text-red-500">
          <FiTrash2 size={24} />
        </div>
        <h3 className="text-xl font-display font-bold text-deep-espresso mb-2">{title}</h3>
        <p className="text-sm text-warm-sand/80 mb-8 leading-relaxed">{message}</p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 text-[10px] font-black uppercase tracking-widest text-warm-sand hover:bg-soft-oatmeal/20 rounded-xl transition-all">Cancel</button>
          <button onClick={() => { onConfirm(); onClose(); }} className="flex-1 py-3 rounded-xl text-white text-[10px] font-black uppercase tracking-widest shadow-lg transition-all active:scale-95 bg-red-500 hover:bg-red-600 shadow-red-200">Delete</button>
        </div>
      </motion.div>
    </motion.div>
  );
};

const EmptyState = ({ onAdd }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="col-span-full py-20 flex flex-col items-center text-center px-6">
    <div className="w-24 h-24 rounded-[40px] bg-soft-oatmeal/20 flex items-center justify-center text-warm-sand/30 mb-8 relative">
      <FiZap size={40} />
      <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-2xl bg-white shadow-lg flex items-center justify-center text-deep-espresso"><FiPlus size={20} /></div>
    </div>
    <h3 className="text-2xl font-display font-bold text-deep-espresso mb-3">No smart bundles yet</h3>
    <p className="max-w-xs text-sm text-warm-sand leading-relaxed mb-10">Bundle products together at a discounted price to boost average order value.</p>
    <button onClick={onAdd} className="px-10 py-4 bg-deep-espresso text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl hover:shadow-2xl transition-all active:scale-95">Create First Bundle</button>
  </motion.div>
);

const ProductPicker = ({ selected, onAdd, onRemove, onQtyChange }) => {
  const [term, setTerm] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!term.trim()) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      try {
        setSearching(true);
        const { data } = await api.get('/products', { params: { search: term, limit: 8 } });
        setResults(data.data || []);
      } catch (err) {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => clearTimeout(debounceRef.current);
  }, [term]);

  const isSelected = (id) => selected.some((s) => s.productId === id);
  const originalPrice = selected.reduce((sum, s) => sum + (s.price || 0) * s.quantity, 0);

  return (
    <div className="space-y-4">
      <div className="relative">
        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-warm-sand/40" size={16} />
        <input
          type="text" value={term} onChange={(e) => setTerm(e.target.value)}
          placeholder="Search products to add…"
          className="w-full bg-white border border-soft-oatmeal/60 rounded-xl pl-10 pr-4 py-3 text-xs focus:ring-2 focus:ring-warm-sand/10 outline-none transition-all"
        />
        {(results.length > 0 || searching) && (
          <div className="absolute z-20 mt-1 w-full bg-white border border-soft-oatmeal/40 rounded-xl shadow-xl max-h-64 overflow-y-auto">
            {searching && <div className="p-3 text-[11px] text-warm-sand">Searching…</div>}
            {!searching && results.map((p) => (
              <button
                key={p._id}
                type="button"
                disabled={isSelected(p._id)}
                onClick={() => { onAdd({ productId: p._id, name: p.name, price: p.price, image: p.images?.[0] }); setTerm(''); setResults([]); }}
                className="w-full flex items-center gap-3 p-2.5 hover:bg-soft-oatmeal/10 disabled:opacity-40 text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-soft-oatmeal/20 overflow-hidden shrink-0">
                  {p.images?.[0] && <img src={p.images[0]} className="w-full h-full object-cover" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold text-deep-espresso truncate">{p.name}</p>
                  <p className="text-[9px] text-warm-sand">₹{p.price}</p>
                </div>
                {isSelected(p._id) && <FiCheck className="text-green-500" size={14} />}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        {selected.length === 0 ? (
          <p className="text-[11px] text-warm-sand/60 italic px-1">No products added yet — search above to add at least 2.</p>
        ) : selected.map((s) => (
          <div key={s.productId} className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-soft-oatmeal/30">
            <div className="w-9 h-9 rounded-lg bg-soft-oatmeal/20 overflow-hidden shrink-0">
              {s.image && <img src={s.image} className="w-full h-full object-cover" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold text-deep-espresso truncate">{s.name}</p>
              <p className="text-[9px] text-warm-sand">₹{s.price} each</p>
            </div>
            <input
              type="number" min={1} value={s.quantity}
              onChange={(e) => onQtyChange(s.productId, Math.max(1, parseInt(e.target.value, 10) || 1))}
              className="w-14 bg-soft-oatmeal/10 border border-soft-oatmeal/30 rounded-lg text-center text-xs py-1.5 outline-none"
            />
            <button onClick={() => onRemove(s.productId)} className="p-1.5 text-red-300 hover:text-red-500"><FiX size={14} /></button>
          </div>
        ))}
      </div>

      {selected.length > 0 && (
        <div className="text-[11px] font-bold text-deep-espresso bg-soft-oatmeal/10 px-3 py-2 rounded-lg">
          Combined original price: ₹{originalPrice.toLocaleString('en-IN')}
        </div>
      )}
    </div>
  );
};

const BundleModal = ({ bundle, isOpen, onClose, onSave, saving }) => {
  const [formData, setFormData] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (bundle) {
      setFormData({
        name: bundle.name || '',
        description: bundle.description || '',
        image: bundle.image || '',
        roomType: bundle.roomType || '',
        bundlePrice: bundle.bundlePrice || '',
        isActive: bundle.isActive !== false,
        products: (bundle.products || []).map((p) => ({
          productId: p.product?._id || p.product,
          name: p.product?.name || '',
          price: p.product?.price || 0,
          image: p.product?.images?.[0] || '',
          quantity: p.quantity || 1
        }))
      });
    } else {
      setFormData({ name: '', description: '', image: '', roomType: '', bundlePrice: '', isActive: true, products: [] });
    }
  }, [bundle, isOpen]);

  if (!isOpen || !formData) return null;

  const handleChange = (field, value) => setFormData((prev) => ({ ...prev, [field]: value }));

  const addProduct = (p) => {
    if (formData.products.some((s) => s.productId === p.productId)) return;
    setFormData((prev) => ({ ...prev, products: [...prev.products, { ...p, quantity: 1 }] }));
  };
  const removeProduct = (id) => setFormData((prev) => ({ ...prev, products: prev.products.filter((s) => s.productId !== id) }));
  const changeQty = (id, quantity) => setFormData((prev) => ({ ...prev, products: prev.products.map((s) => s.productId === id ? { ...s, quantity } : s) }));

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => handleChange('image', reader.result);
      reader.readAsDataURL(file);
    }
  };

  const originalPrice = formData.products.reduce((sum, s) => sum + (s.price || 0) * s.quantity, 0);
  const bundlePriceNum = Number(formData.bundlePrice) || 0;
  const discountPercentage = originalPrice > 0 && bundlePriceNum > 0 ? (((originalPrice - bundlePriceNum) / originalPrice) * 100) : 0;

  const canSave = formData.name.trim() && formData.products.length >= 2 && bundlePriceNum > 0 && bundlePriceNum < originalPrice;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-deep-espresso/60 backdrop-blur-xl z-[100] flex items-center justify-center p-4 md:p-6">
      <motion.div initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }}
        className="bg-white w-full max-w-3xl rounded-[40px] shadow-2xl overflow-hidden border border-soft-oatmeal/30 flex flex-col max-h-[90vh]">
        <div className="p-8 border-b border-soft-oatmeal flex items-center justify-between bg-soft-oatmeal/5">
          <div>
            <h2 className="text-2xl font-display font-bold text-deep-espresso">{bundle ? 'Edit Bundle' : 'New Smart Bundle'}</h2>
            <p className="text-warm-sand text-[9px] font-black uppercase tracking-[0.2em] mt-1">Bundle Management</p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-red-50 hover:text-red-500 rounded-2xl transition-all text-warm-sand/60"><FiX size={24} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar bg-soft-oatmeal/5">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            <div className="md:col-span-4">
              <label className="text-[9px] font-black text-warm-sand uppercase tracking-widest block mb-3">Cover Image</label>
              <input type="file" className="hidden" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" />
              <div onClick={() => fileInputRef.current.click()}
                className="aspect-square w-full rounded-3xl bg-white border-2 border-dashed border-soft-oatmeal/60 flex items-center justify-center cursor-pointer hover:bg-soft-oatmeal/10 transition-all overflow-hidden shadow-inner">
                {formData.image ? <img src={formData.image} className="w-full h-full object-cover" /> : <FiImage size={32} className="text-warm-sand/20" />}
              </div>
            </div>
            <div className="md:col-span-8 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-warm-sand uppercase tracking-widest">Bundle Name</label>
                <input type="text" value={formData.name} onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="e.g. Complete Bathroom Refresh Set"
                  className="w-full bg-white border border-soft-oatmeal/60 rounded-2xl px-6 py-3.5 text-sm focus:ring-4 focus:ring-warm-sand/5 outline-none transition-all font-medium" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-warm-sand uppercase tracking-widest">Description</label>
                <textarea value={formData.description} onChange={(e) => handleChange('description', e.target.value)}
                  rows={2} placeholder="Short description shown to shoppers"
                  className="w-full bg-white border border-soft-oatmeal/60 rounded-2xl px-6 py-3.5 text-sm focus:ring-4 focus:ring-warm-sand/5 outline-none transition-all font-medium resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-warm-sand uppercase tracking-widest">Room Type</label>
                  <select value={formData.roomType} onChange={(e) => handleChange('roomType', e.target.value)}
                    className="w-full bg-white border border-soft-oatmeal/60 rounded-2xl px-4 py-3.5 text-sm outline-none capitalize">
                    <option value="">None</option>
                    {ROOM_TYPES.map((r) => <option key={r} value={r} className="capitalize">{r}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-warm-sand uppercase tracking-widest">Bundle Price (₹)</label>
                  <input type="number" min={1} value={formData.bundlePrice} onChange={(e) => handleChange('bundlePrice', e.target.value)}
                    placeholder="e.g. 4999"
                    className="w-full bg-white border border-soft-oatmeal/60 rounded-2xl px-4 py-3.5 text-sm outline-none" />
                </div>
              </div>
              {originalPrice > 0 && bundlePriceNum > 0 && (
                <div className={`text-[11px] font-bold px-3 py-2 rounded-lg ${bundlePriceNum < originalPrice ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                  {bundlePriceNum < originalPrice
                    ? `${discountPercentage.toFixed(1)}% OFF vs. buying separately (₹${originalPrice.toLocaleString('en-IN')})`
                    : 'Bundle price must be lower than the combined original price'}
                </div>
              )}
              <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-soft-oatmeal/30">
                <div onClick={() => handleChange('isActive', !formData.isActive)}
                  className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-all ${formData.isActive ? 'bg-green-500' : 'bg-red-200'}`}>
                  <motion.div animate={{ x: formData.isActive ? 24 : 0 }} className="w-4 h-4 bg-white rounded-full shadow-md" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-deep-espresso">Public Visibility</p>
                  <p className="text-[8px] text-warm-sand uppercase font-black">{formData.isActive ? 'Active on Storefront' : 'Hidden from Users'}</p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-deep-espresso mb-3">Bundle Products</h3>
            <ProductPicker selected={formData.products} onAdd={addProduct} onRemove={removeProduct} onQtyChange={changeQty} />
          </div>
        </div>

        <div className="p-8 bg-white border-t border-soft-oatmeal flex items-center justify-end gap-4 flex-shrink-0">
          <button onClick={onClose} className="px-8 py-4 text-[10px] font-black uppercase tracking-[0.25em] text-warm-sand hover:text-red-500 transition-colors">Cancel</button>
          <button
            onClick={() => onSave(formData)}
            disabled={!canSave || saving}
            className="px-12 bg-deep-espresso text-white disabled:opacity-50 py-4 rounded-[20px] font-black uppercase tracking-[0.2em] text-[10px] shadow-xl hover:shadow-2xl hover:bg-black transition-all flex items-center justify-center gap-3 active:scale-95"
          >
            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <FiSave size={16} />}
            {bundle ? 'Save Changes' : 'Create Bundle'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

const BundleManagementPage = () => {
  const [bundles, setBundles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingBundle, setEditingBundle] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, id: null });

  const fetchBundles = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/bundles/admin');
      setBundles(data.data || []);
    } catch (err) {
      console.error('Failed to fetch bundles:', err);
      toast.error('Failed to load bundles.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBundles(); }, [fetchBundles]);

  const handleSave = async (formData) => {
    const saveToast = toast.loading(editingBundle ? 'Updating bundle...' : 'Creating bundle...');
    try {
      setSaving(true);
      let image = formData.image;
      if (image && image.startsWith('data:image')) {
        image = await uploadImage(image);
      }

      const payload = {
        name: formData.name,
        description: formData.description,
        image,
        roomType: formData.roomType || null,
        bundlePrice: Number(formData.bundlePrice),
        isActive: formData.isActive,
        products: formData.products.map((p) => ({ productId: p.productId, quantity: p.quantity }))
      };

      if (editingBundle) {
        await api.put(`/bundles/${editingBundle._id}`, payload);
        toast.success('Bundle updated successfully.', { id: saveToast });
      } else {
        await api.post('/bundles', payload);
        toast.success('Bundle created successfully.', { id: saveToast });
      }
      fetchBundles();
      setIsModalOpen(false);
      setEditingBundle(null);
    } catch (err) {
      console.error('Failed to save bundle:', err);
      toast.error(err.response?.data?.error || 'Failed to save bundle.', { id: saveToast });
    } finally {
      setSaving(false);
    }
  };

  const toggleVisibility = async (bundle) => {
    try {
      await api.put(`/bundles/${bundle._id}`, { isActive: !bundle.isActive });
      setBundles((prev) => prev.map((b) => b._id === bundle._id ? { ...b, isActive: !b.isActive } : b));
      toast.success(`Bundle visibility: ${!bundle.isActive ? 'Active' : 'Hidden'}`);
    } catch (err) {
      toast.error('Failed to toggle bundle visibility.');
    }
  };

  const handleDelete = async (id) => {
    const deleteToast = toast.loading('Removing bundle...');
    try {
      await api.delete(`/bundles/${id}`);
      setBundles((prev) => prev.filter((b) => b._id !== id));
      toast.success('Bundle removed.', { id: deleteToast });
    } catch (err) {
      toast.error('Failed to remove bundle.', { id: deleteToast });
    }
  };

  return (
    <PageWrapper>
      <div className="max-w-7xl mx-auto space-y-4 py-2">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Bundles', value: bundles.length, icon: FiZap, color: 'text-blue-500', bg: 'bg-blue-50' },
            { label: 'Active', value: bundles.filter((b) => b.isActive).length, icon: FiCheck, color: 'text-green-500', bg: 'bg-green-50' },
            { label: 'Hidden', value: bundles.filter((b) => !b.isActive).length, icon: FiEyeOff, color: 'text-amber-500', bg: 'bg-amber-50' },
            { label: 'Total Views', value: bundles.reduce((acc, b) => acc + (b.analytics?.views || 0), 0), icon: FiEye, color: 'text-purple-500', bg: 'bg-purple-50' },
          ].map((stat, i) => (
            <div key={i} className="bg-white p-4 rounded-2xl border border-soft-oatmeal/40 shadow-sm flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center shadow-inner flex-shrink-0`}><stat.icon size={18} /></div>
              <div className="min-w-0">
                <p className="text-[8px] font-black uppercase tracking-widest text-warm-sand/60 truncate">{stat.label}</p>
                <p className="text-lg font-display font-bold text-deep-espresso">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white p-4 rounded-3xl border border-soft-oatmeal/40 shadow-sm flex items-center justify-between">
          <button
            onClick={() => { setEditingBundle(null); setIsModalOpen(true); }}
            className="px-6 py-3 bg-deep-espresso text-white rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg active:scale-95"
          >
            <FiPlus size={16} /> New Bundle
          </button>
          <p className="text-[8px] font-black uppercase tracking-widest text-warm-sand/60">{bundles.length} bundles total</p>
        </div>

        <div className="flex flex-col gap-3">
          <AnimatePresence mode="popLayout">
            {loading ? (
              [1, 2, 3].map((n) => (
                <div key={n} className="bg-white p-3 rounded-2xl border border-soft-oatmeal/40 shadow-sm flex items-center gap-6 animate-pulse">
                  <div className="w-14 h-14 rounded-xl bg-slate-200 flex-shrink-0" />
                  <div className="flex-1 space-y-2"><div className="h-4 bg-slate-200 rounded w-1/2" /><div className="h-3 bg-slate-200 rounded w-1/4" /></div>
                </div>
              ))
            ) : bundles.length > 0 ? (
              bundles.map((bundle) => (
                <div key={bundle._id} className={`bg-white p-3 rounded-2xl border border-soft-oatmeal/40 shadow-sm flex items-center gap-6 relative group ${!bundle.isActive ? 'opacity-70 grayscale-[0.3]' : ''}`}>
                  <div className="w-14 h-14 rounded-xl bg-soft-oatmeal/10 border border-soft-oatmeal/20 flex items-center justify-center overflow-hidden shadow-inner flex-shrink-0">
                    {bundle.image ? <img src={bundle.image} className="w-full h-full object-cover" /> : <FiPackage className="text-warm-sand/30" size={22} />}
                  </div>
                  <div className="flex-1 min-w-0 flex items-center gap-8">
                    <div className="w-56">
                      <h3 className="text-sm font-display font-bold text-deep-espresso truncate">{bundle.name}</h3>
                      <div onClick={() => toggleVisibility(bundle)}
                        className={`mt-1 inline-block px-2 py-0.5 rounded-full text-[6px] font-black uppercase tracking-widest cursor-pointer transition-all ${bundle.isActive ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                        {bundle.isActive ? 'Active' : 'Hidden'}
                      </div>
                    </div>
                    <div className="hidden md:flex flex-col">
                      <span className="text-sm font-bold text-deep-espresso">₹{Number(bundle.bundlePrice).toLocaleString('en-IN')}</span>
                      <span className="text-[9px] text-warm-sand line-through">₹{Number(bundle.originalPrice).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="hidden lg:flex items-center gap-4">
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] font-bold text-deep-espresso">{bundle.products?.length || 0}</span>
                        <span className="text-[6px] font-black uppercase tracking-tighter text-warm-sand/40">Products</span>
                      </div>
                      <div className="flex flex-col items-center border-l border-soft-oatmeal/40 pl-4">
                        <span className="text-[10px] font-bold text-deep-espresso">{Math.round(bundle.discountPercentage || 0)}%</span>
                        <span className="text-[6px] font-black uppercase tracking-tighter text-warm-sand/40">Discount</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 bg-soft-oatmeal/5 p-1.5 rounded-xl border border-soft-oatmeal/30">
                    <button onClick={() => { setEditingBundle(bundle); setIsModalOpen(true); }}
                      className="p-2 bg-white border border-soft-oatmeal rounded-lg text-warm-sand hover:bg-deep-espresso hover:text-white transition-all shadow-sm" title="Edit">
                      <FiEdit3 size={14} />
                    </button>
                    <button onClick={() => setConfirmConfig({ isOpen: true, id: bundle._id })}
                      className="p-2 bg-red-50 text-red-400 border border-red-100 rounded-lg hover:bg-red-500 hover:text-white transition-all shadow-sm" title="Delete">
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState onAdd={() => { setEditingBundle(null); setIsModalOpen(true); }} />
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <BundleModal
            bundle={editingBundle}
            isOpen={isModalOpen}
            onClose={() => { setIsModalOpen(false); setEditingBundle(null); }}
            onSave={handleSave}
            saving={saving}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirmConfig.isOpen && (
          <ConfirmationModal
            isOpen={confirmConfig.isOpen}
            onClose={() => setConfirmConfig({ isOpen: false, id: null })}
            onConfirm={() => handleDelete(confirmConfig.id)}
            title="Delete Bundle?"
            message="This will permanently remove the bundle. The underlying products are unaffected."
          />
        )}
      </AnimatePresence>
    </PageWrapper>
  );
};

export default BundleManagementPage;
