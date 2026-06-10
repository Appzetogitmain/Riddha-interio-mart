import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import {
  LuImagePlus, LuImages, LuLoader, LuPencil, LuRotateCcw,
  LuSave, LuTrash2, LuEye, LuX, LuCheck, LuUpload,
  LuLink, LuInfo, LuZap, LuMonitor
} from 'react-icons/lu';
import { FiArrowRight } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../../shared/utils/api';
import { uploadImage } from '../../../shared/utils/upload';
import { toast } from 'react-hot-toast';

const createEmptyBanner = () => ({
  title: '',
  subtitle: '',
  bgImage: { src: '', alt: '', caption: '' },
  primaryBtnText: '',
  primaryBtnLink: '',
  secondaryBtnText: '',
  secondaryBtnLink: '',
});

const mapBannerToForm = (banner) => ({
  title: banner?.title || '',
  subtitle: banner?.subtitle || '',
  bgImage: {
    src: banner?.bgImage?.src || '',
    alt: banner?.bgImage?.alt || '',
    caption: banner?.bgImage?.caption || '',
  },
  primaryBtnText: banner?.primaryBtnText || 'Shop Collection',
  primaryBtnLink: banner?.primaryBtnLink || '/shop',
  secondaryBtnText: banner?.secondaryBtnText || 'View Gallery',
  secondaryBtnLink: banner?.secondaryBtnLink || '/gallery',
});

const buildPayload = (form) => ({
  title: form.title.trim(),
  subtitle: form.subtitle?.trim() || '',
  bgImage: {
    src: form.bgImage?.src?.trim() || '',
    alt: form.bgImage?.alt?.trim() || 'Homepage hero banner image',
    caption: form.bgImage?.caption?.trim() || '',
  },
  primaryBtnText: form.primaryBtnText?.trim() || 'Shop Collection',
  primaryBtnLink: form.primaryBtnLink?.trim() || '/shop',
  secondaryBtnText: form.secondaryBtnText?.trim() || 'View Gallery',
  secondaryBtnLink: form.secondaryBtnLink?.trim() || '/gallery',
});

const Label = ({ children, hint }) => (
  <div className="flex items-center justify-between mb-1">
    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{children}</label>
    {hint && <span className="text-[10px] text-gray-400">{hint}</span>}
  </div>
);

const Field = ({ children }) => <div className="space-y-0">{children}</div>;

const inp = "w-full bg-gray-50 border border-gray-200 focus:border-teal-400 focus:bg-white rounded-xl px-3 py-2.5 text-sm outline-none transition-all font-medium";

/* Banner preview overlay — reused in form and in review modal */
const BannerPreview = ({ form, height = 'h-[260px] md:h-[420px]' }) => (
  <div className={`relative ${height} w-full overflow-hidden rounded-2xl bg-gray-100`}>
    {form.bgImage?.src ? (
      <img src={form.bgImage.src} alt={form.bgImage?.alt || 'Banner'} className="absolute inset-0 h-full w-full object-cover" />
    ) : (
      <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-300 gap-2">
        <LuMonitor size={40} />
        <span className="text-xs font-semibold">No image selected</span>
      </div>
    )}
    <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/30 to-transparent flex items-center">
      <div className="px-8 max-w-xl space-y-3">
        <span className="inline-block px-3 py-1 bg-teal-500/20 border border-teal-400/40 text-teal-300 rounded-full text-[9px] font-black uppercase tracking-widest">
          Preview
        </span>
        <h2 className="text-2xl md:text-4xl font-bold text-white leading-tight">
          {form.title || 'Your Banner Title'}
        </h2>
        <p className="text-sm text-white/80 leading-relaxed">
          {form.subtitle || 'Your banner subtitle goes here...'}
        </p>
        <div className="flex gap-3 pt-1">
          <span className="px-5 py-2 bg-teal-500 text-white rounded-full text-xs font-bold">
            {form.primaryBtnText || 'Primary'}
          </span>
          <span className="px-5 py-2 border-2 border-white text-white rounded-full text-xs font-bold">
            {form.secondaryBtnText || 'Secondary'}
          </span>
        </div>
      </div>
    </div>
  </div>
);

const ManageHeroBanner = () => {
  const [activeTab, setActiveTab] = useState('create');
  const [bannerForm, setBannerForm] = useState(createEmptyBanner());
  const [banners, setBanners] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [imgFile, setImgFile] = useState(null);
  const [imgMeta, setImgMeta] = useState(null); // { width, height, sizeKb, fileName }
  const [showReview, setShowReview] = useState(false);
  const fileInputRef = useRef(null);

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/home-banner');
      setBanners(Array.isArray(data?.data) ? data.data : []);
    } catch {
      toast.error('Failed to load banners');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBanners(); }, []);

  /* Load image dimensions from any src (URL or data URL) */
  const loadImageMeta = useCallback((src, file = null) => {
    if (!src) { setImgMeta(null); return; }
    const img = new Image();
    img.onload = () => {
      setImgMeta({
        width: img.naturalWidth,
        height: img.naturalHeight,
        sizeKb: file ? Math.round(file.size / 1024) : null,
        fileName: file ? file.name : null,
      });
    };
    img.onerror = () => setImgMeta(null);
    img.src = src;
  }, []);

  const handleChange = (field, value) => {
    if (field.startsWith('bgImage.')) {
      const key = field.split('.')[1];
      setBannerForm(prev => ({ ...prev, bgImage: { ...prev.bgImage, [key]: value } }));
      if (key === 'src') loadImageMeta(value, null);
    } else {
      setBannerForm(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImgFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setBannerForm(prev => ({ ...prev, bgImage: { ...prev.bgImage, src: reader.result } }));
      loadImageMeta(reader.result, file);
    };
    reader.readAsDataURL(file);
  };

  const resetForm = () => {
    setBannerForm(createEmptyBanner());
    setEditingId(null);
    setImgFile(null);
    setImgMeta(null);
    setShowReview(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleOpenReview = () => {
    const payload = buildPayload(bannerForm);
    if (!payload.title) { toast.error('Please add a banner title'); return; }
    if (!payload.bgImage.src) { toast.error('Please add a background image'); return; }
    setShowReview(true);
  };

  const handleSaveBanner = async () => {
    const payload = buildPayload(bannerForm);
    const saveToast = toast.loading(editingId ? 'Updating banner...' : 'Publishing banner...');
    try {
      setSubmitting(true);
      let finalImageUrl = bannerForm.bgImage.src;
      if (imgFile) finalImageUrl = await uploadImage(imgFile);
      const fullPayload = { ...payload, bgImage: { ...payload.bgImage, src: finalImageUrl } };
      if (editingId) {
        await api.put(`/home-banner/${editingId}`, fullPayload);
        toast.success('Banner updated', { id: saveToast });
      } else {
        await api.post('/home-banner', fullPayload);
        toast.success('Banner published', { id: saveToast });
      }
      await fetchBanners();
      resetForm();
      setActiveTab('all');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save banner', { id: saveToast });
    } finally {
      setSubmitting(false);
      setShowReview(false);
    }
  };

  const handleEdit = (banner) => {
    setBannerForm(mapBannerToForm(banner));
    setEditingId(banner._id);
    setImgFile(null);
    setImgMeta(null);
    loadImageMeta(banner?.bgImage?.src || null);
    setActiveTab('create');
  };

  const handleDelete = async (banner) => {
    toast((t) => (
      <div className="space-y-2 p-1">
        <p className="text-sm font-bold">Delete "{banner.title}"?</p>
        <div className="flex gap-2 justify-end">
          <button onClick={() => toast.dismiss(t.id)} className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg text-xs font-bold">Cancel</button>
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              const dt = toast.loading('Deleting...');
              try {
                setDeletingId(banner._id);
                await api.delete(`/home-banner/${banner._id}`);
                toast.success('Banner deleted', { id: dt });
                await fetchBanners();
                if (editingId === banner._id) resetForm();
              } catch {
                toast.error('Failed to delete', { id: dt });
              } finally { setDeletingId(null); }
            }}
            className="px-3 py-1 bg-red-600 text-white rounded-lg text-xs font-bold"
          >Delete</button>
        </div>
      </div>
    ), { duration: 8000 });
  };

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-6xl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black tracking-tight text-gray-900">
            Hero <span className="text-teal-600">Banners</span>
          </h1>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-0.5">
            Create & manage homepage hero banners
          </p>
        </div>
        <span className="bg-gray-100 border border-gray-200 text-gray-600 text-xs font-bold px-3 py-1.5 rounded-xl">
          {banners.length} banner{banners.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Tab toggle */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {[
          { id: 'create', label: editingId ? 'Edit Banner' : 'Create Banner', icon: editingId ? LuPencil : LuImagePlus },
          { id: 'all', label: 'All Banners', icon: LuImages },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => { if (id === 'create' && activeTab !== 'create') resetForm(); setActiveTab(id); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
              activeTab === id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {/* ── CREATE TAB ── */}
      {activeTab === 'create' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

          {/* Form panel */}
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="text-sm font-black text-gray-900">{editingId ? 'Edit Banner' : 'New Banner'}</h3>
              <button onClick={resetForm} className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-800 transition-colors">
                <LuRotateCcw size={12} /> Reset
              </button>
            </div>

            <form onSubmit={e => { e.preventDefault(); handleOpenReview(); }} className="p-5 space-y-4">

              <Field>
                <Label>Banner Title *</Label>
                <input type="text" value={bannerForm.title} onChange={e => handleChange('title', e.target.value)}
                  className={inp} placeholder="e.g. Elegance in Every Detail" />
              </Field>

              <Field>
                <Label hint="Optional">Subtitle / Description</Label>
                <textarea rows={2} value={bannerForm.subtitle} onChange={e => handleChange('subtitle', e.target.value)}
                  className={`${inp} resize-none`} placeholder="Short description shown below title..." />
              </Field>

              {/* Image upload area */}
              <div className="space-y-2">
                <Label>Background Image *</Label>

                {/* Upload zone */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-200 hover:border-teal-400 rounded-xl p-4 text-center cursor-pointer transition-colors group"
                >
                  {bannerForm.bgImage.src ? (
                    <div className="relative h-28 rounded-lg overflow-hidden">
                      <img src={bannerForm.bgImage.src} className="w-full h-full object-cover" alt="preview" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white text-xs font-bold">Click to change</span>
                      </div>
                    </div>
                  ) : (
                    <div className="py-4 flex flex-col items-center gap-2 text-gray-400">
                      <LuUpload size={22} className="group-hover:text-teal-500 transition-colors" />
                      <p className="text-xs font-semibold">Click to upload image</p>
                      <p className="text-[10px]">JPG, PNG, WebP — recommended 1920×600px</p>
                    </div>
                  )}
                </div>
                <input type="file" className="hidden" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" />

                {/* URL paste */}
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <LuLink className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={13} />
                    <input
                      type="text"
                      value={bannerForm.bgImage.src.startsWith('data:') ? '' : bannerForm.bgImage.src}
                      onChange={e => handleChange('bgImage.src', e.target.value)}
                      className={`${inp} pl-8`}
                      placeholder="…or paste image URL"
                    />
                  </div>
                </div>

                {/* Image meta info */}
                {imgMeta && (
                  <div className="flex flex-wrap items-center gap-3 px-3 py-2 bg-teal-50 border border-teal-100 rounded-xl">
                    <LuInfo size={13} className="text-teal-500 shrink-0" />
                    <span className="text-[11px] font-bold text-teal-700">
                      {imgMeta.width} × {imgMeta.height} px
                    </span>
                    {imgMeta.sizeKb && (
                      <span className="text-[11px] font-semibold text-teal-600">
                        {imgMeta.sizeKb >= 1024
                          ? `${(imgMeta.sizeKb / 1024).toFixed(1)} MB`
                          : `${imgMeta.sizeKb} KB`}
                      </span>
                    )}
                    {imgMeta.fileName && (
                      <span className="text-[10px] text-teal-500 truncate max-w-[140px]">{imgMeta.fileName}</span>
                    )}
                    {imgMeta.width < 1200 && (
                      <span className="text-[10px] text-amber-600 font-bold bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                        Low resolution — recommend 1920×600+
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Alt + Caption */}
              <div className="grid grid-cols-2 gap-3">
                <Field>
                  <Label hint="SEO">Alt Text</Label>
                  <input type="text" value={bannerForm.bgImage?.alt || ''} onChange={e => handleChange('bgImage.alt', e.target.value)}
                    className={inp} placeholder="Describe the image..." />
                </Field>
                <Field>
                  <Label hint="Optional">Caption</Label>
                  <input type="text" value={bannerForm.bgImage?.caption || ''} onChange={e => handleChange('bgImage.caption', e.target.value)}
                    className={inp} placeholder="Optional caption..." />
                </Field>
              </div>

              {/* Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <Field>
                  <Label>Primary Button</Label>
                  <input type="text" value={bannerForm.primaryBtnText} onChange={e => handleChange('primaryBtnText', e.target.value)}
                    className={inp} placeholder="Shop Collection" />
                </Field>
                <Field>
                  <Label>Primary Link</Label>
                  <input type="text" value={bannerForm.primaryBtnLink} onChange={e => handleChange('primaryBtnLink', e.target.value)}
                    className={inp} placeholder="/shop" />
                </Field>
                <Field>
                  <Label>Secondary Button</Label>
                  <input type="text" value={bannerForm.secondaryBtnText} onChange={e => handleChange('secondaryBtnText', e.target.value)}
                    className={inp} placeholder="View Gallery" />
                </Field>
                <Field>
                  <Label>Secondary Link</Label>
                  <input type="text" value={bannerForm.secondaryBtnLink} onChange={e => handleChange('secondaryBtnLink', e.target.value)}
                    className={inp} placeholder="/gallery" />
                </Field>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-sm active:scale-[0.98]"
                >
                  <LuEye size={14} />
                  Review & Publish
                </button>
              </div>
            </form>
          </div>

          {/* Live preview panel */}
          <div className="space-y-3">
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
                <LuMonitor size={14} className="text-teal-500" />
                <h3 className="text-xs font-black uppercase tracking-wider text-gray-700">Live Preview</h3>
                <span className="ml-auto text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Desktop</span>
              </div>
              <div className="p-3">
                <BannerPreview form={bannerForm} height="h-[220px] md:h-[320px]" />
              </div>
            </div>

            {/* Quick checklist */}
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4 space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Publish Checklist</p>
              {[
                { label: 'Title added', ok: !!bannerForm.title.trim() },
                { label: 'Image set', ok: !!bannerForm.bgImage.src },
                { label: 'Primary button text', ok: !!bannerForm.primaryBtnText.trim() },
                { label: 'Primary button link', ok: !!bannerForm.primaryBtnLink.trim() },
                { label: imgMeta ? `Image: ${imgMeta.width}×${imgMeta.height}px` : 'Image size unknown', ok: imgMeta ? imgMeta.width >= 1200 : false, warn: imgMeta && imgMeta.width < 1200 },
              ].map(({ label, ok, warn }) => (
                <div key={label} className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${ok ? 'bg-emerald-100 text-emerald-600' : warn ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-400'}`}>
                    {ok ? <LuCheck size={10} strokeWidth={3} /> : <LuX size={9} strokeWidth={3} />}
                  </div>
                  <span className={`text-xs font-medium ${ok ? 'text-gray-700' : warn ? 'text-amber-600' : 'text-gray-400'}`}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── ALL BANNERS TAB ── */}
      {activeTab === 'all' && (
        <div className="space-y-4">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {[1,2,3].map(n => (
                <div key={n} className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
                  <div className="aspect-[16/7] bg-gray-100" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-gray-100 rounded w-3/4" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : banners.length === 0 ? (
            <div className="bg-white py-20 rounded-2xl border border-dashed border-gray-200 text-center">
              <LuImages size={40} className="mx-auto text-gray-200 mb-3" />
              <p className="text-sm font-bold text-gray-500">No banners yet</p>
              <button onClick={() => setActiveTab('create')} className="mt-4 px-5 py-2 bg-teal-600 text-white rounded-xl text-xs font-black hover:bg-teal-700 transition-all">
                Create First Banner
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {banners.map(item => (
                <div key={item._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                  <div className="aspect-[16/7] bg-gray-100 relative overflow-hidden group">
                    {item.bgImage?.src ? (
                      <img src={item.bgImage.src} alt={item.bgImage?.alt || item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={e => { e.target.style.display = 'none'; }} />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-gray-300">
                        <LuImages size={28} />
                      </div>
                    )}
                    {/* Overlay with title */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-3">
                      <p className="text-white text-xs font-bold truncate">{item.title}</p>
                    </div>
                  </div>
                  <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                    <div>
                      <p className="text-xs text-gray-500 line-clamp-2 min-h-[32px]">{item.subtitle || '—'}</p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {item.primaryBtnText && (
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-teal-50 text-teal-600 border border-teal-100 rounded-full">
                            {item.primaryBtnText}
                          </span>
                        )}
                        {item.secondaryBtnText && (
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-gray-100 text-gray-600 border border-gray-200 rounded-full">
                            {item.secondaryBtnText}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2 border-t border-gray-100">
                      <button onClick={() => handleEdit(item)}
                        className="flex-1 flex items-center justify-center gap-1.5 text-xs font-black uppercase tracking-wider px-3 py-2 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all">
                        <LuPencil size={12} /> Edit
                      </button>
                      <button onClick={() => handleDelete(item)} disabled={deletingId === item._id}
                        className="flex-1 flex items-center justify-center gap-1.5 text-xs font-black uppercase tracking-wider px-3 py-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-all disabled:opacity-50">
                        {deletingId === item._id ? <LuLoader className="animate-spin" size={12} /> : <LuTrash2 size={12} />}
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── REVIEW & PUBLISH MODAL ── */}
      <AnimatePresence>
        {showReview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowReview(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
            >
              {/* Modal header */}
              <div className="sticky top-0 z-10 px-6 py-4 bg-white border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center">
                    <LuEye size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-gray-900">Review Banner</h3>
                    <p className="text-[10px] text-gray-400">Confirm before publishing</p>
                  </div>
                </div>
                <button onClick={() => setShowReview(false)} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-gray-600 transition-colors">
                  <LuX size={18} />
                </button>
              </div>

              <div className="p-6 space-y-5">

                {/* Full preview */}
                <BannerPreview form={bannerForm} height="h-[200px] md:h-[320px]" />

                {/* Summary table */}
                <div className="bg-gray-50 border border-gray-100 rounded-xl overflow-hidden">
                  <div className="px-4 py-2.5 bg-gray-100 border-b border-gray-200">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Banner Details</p>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {[
                      { label: 'Title', value: bannerForm.title },
                      { label: 'Subtitle', value: bannerForm.subtitle || '—' },
                      { label: 'Image', value: imgMeta ? `${imgMeta.width} × ${imgMeta.height} px${imgMeta.sizeKb ? ` · ${imgMeta.sizeKb >= 1024 ? (imgMeta.sizeKb/1024).toFixed(1)+'MB' : imgMeta.sizeKb+'KB'}` : ''}` : (bannerForm.bgImage.src ? 'URL set' : '—') },
                      { label: 'Primary Button', value: `${bannerForm.primaryBtnText || '—'} → ${bannerForm.primaryBtnLink || '—'}` },
                      { label: 'Secondary Button', value: `${bannerForm.secondaryBtnText || '—'} → ${bannerForm.secondaryBtnLink || '—'}` },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex items-start gap-4 px-4 py-2.5">
                        <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 w-32 shrink-0 pt-0.5">{label}</span>
                        <span className="text-xs font-semibold text-gray-800 truncate">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Warning for low-res */}
                {imgMeta && imgMeta.width < 1200 && (
                  <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                    <LuInfo size={14} className="text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-700 font-medium">
                      Image resolution ({imgMeta.width}×{imgMeta.height}px) is below the recommended 1920×600px. It may appear blurry on large screens.
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowReview(false)}
                    className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-gray-50 transition-all"
                  >
                    Back to Edit
                  </button>
                  <button
                    onClick={handleSaveBanner}
                    disabled={submitting}
                    className="flex-1 flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-sm"
                  >
                    {submitting
                      ? <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Publishing...</>
                      : <><LuZap size={13} />{editingId ? 'Update Banner' : 'Publish Banner'}</>
                    }
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default ManageHeroBanner;
