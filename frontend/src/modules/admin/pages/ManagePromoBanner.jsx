import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  LuEye,
  LuImagePlus,
  LuImages,
  LuLoader,
  LuPencil,
  LuRotateCcw,
  LuSave,
  LuTrash2,
} from 'react-icons/lu';
import PageWrapper from '../components/PageWrapper';
import api from '../../../shared/utils/api';
import { uploadImage } from '../../../shared/utils/upload';
import { toast } from 'react-hot-toast';

const createEmptyBanner = () => ({
  title: '',
  subtitle: '',
  image: '',
  ctaText: '',
  ctaLink: '',
});

const mapBannerToForm = (banner) => ({
  title: banner?.title || '',
  subtitle: banner?.subtitle || '',
  image: banner?.image || '',
  ctaText: banner?.ctaText || '',
  ctaLink: banner?.ctaLink || '',
});

const ManagePromoBanner = () => {
  const [activeTab, setActiveTab] = useState('create');
  const [promoForm, setPromoForm] = useState(createEmptyBanner());
  const [banners, setBanners] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [imgFile, setImgFile] = useState(null);
  const fileInputRef = useRef(null);

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/promo-banner');
      const list = Array.isArray(data?.data) ? data.data : [];
      setBanners(list);
    } catch (error) {
      console.error('Failed to fetch promo banners:', error);
      toast.error('Failed to load promo banners.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);



  const totalBanners = banners.length;

  const createButtonLabel = useMemo(() => {
    if (submitting) return editingId ? 'Updating...' : 'Creating...';
    return editingId ? 'Update Promo Banner' : 'Create Promo Banner';
  }, [editingId, submitting]);

  const handleChange = (field, value) => {
    setPromoForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImgFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPromoForm((prev) => ({ ...prev, image: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const resetForm = () => {
    setPromoForm(createEmptyBanner());
    setEditingId(null);
    setImgFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSaveBanner = async (event) => {
    if (event) event.preventDefault();

    const payload = {
      title: promoForm.title.trim(),
      subtitle: promoForm.subtitle.trim(),
      image: promoForm.image.trim(),
      ctaText: promoForm.ctaText.trim() || 'Shop Now',
      ctaLink: promoForm.ctaLink.trim() || '/offers',
    };

    if (!payload.title) {
      toast.error('Please add a promo banner title.');
      return;
    }

    if (!payload.image) {
      toast.error('Please add an image URL or upload an image file.');
      return;
    }

    const saveToast = toast.loading(editingId ? 'Updating promo banner...' : 'Creating promo banner...');

    try {
      setSubmitting(true);

      let finalImageUrl = promoForm.image;
      if (imgFile) {
        finalImageUrl = await uploadImage(imgFile);
      }

      const fullPayload = {
        ...payload,
        image: finalImageUrl
      };

      if (editingId) {
        await api.put(`/promo-banner/${editingId}`, fullPayload);
        toast.success('Promo banner updated successfully.', { id: saveToast });
      } else {
        await api.post('/promo-banner', fullPayload);
        toast.success('Promo banner created successfully.', { id: saveToast });
      }

      await fetchBanners();
      resetForm();
      setActiveTab('all');
    } catch (error) {
      console.error('Failed to save promo banner:', error);
      toast.error(error.response?.data?.error || 'Failed to save promo banner.', { id: saveToast });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (banner) => {
    setPromoForm(mapBannerToForm(banner));
    setEditingId(banner._id);
    setActiveTab('create');
    toast.success(`Editing: ${banner.title.slice(0, 20)}...`);
  };

  const handleDelete = async (banner) => {
    const shouldDelete = window.confirm(`Delete promo banner "${banner.title}"?`);
    if (!shouldDelete) return;

    const deleteToast = toast.loading('Deleting promo banner...');
    try {
      setDeletingId(banner._id);
      await api.delete(`/promo-banner/${banner._id}`);
      toast.success('Promo banner deleted successfully.', { id: deleteToast });

      if (editingId === banner._id) {
        resetForm();
      }

      await fetchBanners();
    } catch (error) {
      console.error('Failed to delete promo banner:', error);
      toast.error(error.response?.data?.error || 'Failed to delete promo banner.', { id: deleteToast });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <PageWrapper>
      <div className="w-full space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-deep-espresso">
              Promo Banner
            </h1>
            <p className="text-warm-sand mt-1 text-sm md:text-base">
              Create and manage multiple promotional banners.
            </p>
          </div>
          <div className="px-3 py-2 rounded-full bg-soft-oatmeal/40 border border-soft-oatmeal text-xs font-bold tracking-wider text-deep-espresso">
            Total Promo Banners: {totalBanners}
          </div>
        </div>

        <div className="inline-flex p-1.5 rounded-2xl border border-soft-oatmeal bg-white shadow-sm w-full md:w-auto">
          <button
            onClick={() => {
              if (editingId) {
                resetForm();
              }
              setActiveTab('create');
            }}
            className={`flex-1 md:flex-none px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'create'
                ? 'bg-deep-espresso text-white shadow-sm'
                : 'text-deep-espresso hover:bg-soft-oatmeal/30'
            }`}
          >
            <LuImagePlus size={16} />
            Create Promo Banner
          </button>
          <button
            onClick={() => {
              resetForm();
              setActiveTab('all');
            }}
            className={`flex-1 md:flex-none px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'all'
                ? 'bg-deep-espresso text-white shadow-sm'
                : 'text-deep-espresso hover:bg-soft-oatmeal/30'
            }`}
          >
            <LuImages size={16} />
            All Promo Banners
          </button>
        </div>

        {activeTab === 'create' && (
          <div className="space-y-8">
            <form onSubmit={handleSaveBanner} className="bg-white p-6 md:p-8 rounded-2xl border border-soft-oatmeal shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h3 className="text-lg font-display font-bold text-deep-espresso">
                  {editingId ? 'Edit Promo Banner' : 'Create New Promo Banner'}
                </h3>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex items-center gap-2 border border-soft-oatmeal text-deep-espresso px-5 py-2.5 rounded-xl font-bold hover:bg-soft-oatmeal/20 transition-all text-sm"
                  >
                    <LuRotateCcw size={16} /> Reset
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all text-sm shadow-md bg-dusty-cocoa text-white hover:bg-deep-espresso disabled:opacity-60"
                  >
                    {submitting ? <LuLoader className="animate-spin" size={16} /> : <LuSave size={16} />}
                    {createButtonLabel}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold text-warm-sand uppercase tracking-wider">Title</label>
                  <input
                    type="text"
                    value={promoForm.title}
                    onChange={(event) => handleChange('title', event.target.value)}
                    className="w-full bg-soft-oatmeal/20 border border-soft-oatmeal rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-warm-sand transition-all text-sm"
                    placeholder="e.g. Mega Weekend Sale"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold text-warm-sand uppercase tracking-wider">Subtitle / Offer</label>
                  <textarea
                    rows={3}
                    value={promoForm.subtitle}
                    onChange={(event) => handleChange('subtitle', event.target.value)}
                    className="w-full bg-soft-oatmeal/20 border border-soft-oatmeal rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-warm-sand transition-all text-sm resize-none"
                    placeholder="e.g. Flat 50% off on selected collections."
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-warm-sand uppercase tracking-wider">Banner Image</label>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-[10px] font-black text-deep-espresso uppercase tracking-widest hover:underline"
                    >
                      Upload File
                    </button>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                  />
                  <input
                    type="text"
                    value={promoForm.image}
                    onChange={(event) => handleChange('image', event.target.value)}
                    className="w-full bg-soft-oatmeal/20 border border-soft-oatmeal rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-warm-sand transition-all text-sm"
                    placeholder="Paste remote URL or upload a file..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-warm-sand uppercase tracking-wider">CTA Button Text</label>
                  <input
                    type="text"
                    value={promoForm.ctaText}
                    onChange={(event) => handleChange('ctaText', event.target.value)}
                    className="w-full bg-soft-oatmeal/20 border border-soft-oatmeal rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-warm-sand transition-all text-sm"
                    placeholder="e.g. Shop Now"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-warm-sand uppercase tracking-wider">CTA Link</label>
                  <input
                    type="text"
                    value={promoForm.ctaLink}
                    onChange={(event) => handleChange('ctaLink', event.target.value)}
                    className="w-full bg-soft-oatmeal/20 border border-soft-oatmeal rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-warm-sand transition-all text-sm"
                    placeholder="e.g. /offers"
                  />
                </div>
              </div>
            </form>

            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-soft-oatmeal/40" />
              <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-warm-sand">
                Live Preview
              </span>
              <div className="h-px flex-1 bg-soft-oatmeal/40" />
            </div>

            <div className="relative rounded-[2rem] overflow-hidden min-h-[280px] md:min-h-[360px] bg-soft-oatmeal/30 border border-soft-oatmeal shadow-2xl">
              {promoForm.image ? (
                <img
                  src={promoForm.image}
                  alt={promoForm.title || 'Promo banner preview'}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-warm-sand">
                  Add image to preview promo banner
                </div>
              )}

              <div className="absolute inset-0 bg-gradient-to-r from-deep-espresso/80 via-deep-espresso/50 to-transparent" />

              <div className="relative z-10 h-full p-6 md:p-10 flex items-center">
                <div className="max-w-xl space-y-4">
                  <span className="inline-block px-4 py-1.5 bg-white/20 border border-white/40 text-white rounded-full text-[10px] md:text-xs font-bold tracking-widest uppercase">
                    Limited Offer
                  </span>
                  <h2 className="text-3xl md:text-5xl font-display font-bold text-white leading-tight">
                    {promoForm.title || 'Your Promo Headline'}
                  </h2>
                  <p className="text-sm md:text-xl text-white/90">
                    {promoForm.subtitle || 'Your promo subtitle or offer details will appear here.'}
                  </p>
                  {promoForm.ctaText && (
                    <span className="inline-flex items-center px-6 py-3 rounded-full bg-white text-deep-espresso font-bold text-sm shadow-md">
                      {promoForm.ctaText}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'all' && (
          <div className="space-y-6">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="bg-white rounded-2xl border border-soft-oatmeal shadow-sm overflow-hidden animate-pulse">
                    <div className="aspect-[16/9] bg-slate-200"></div>
                    <div className="p-4 space-y-3">
                      <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                      <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                      <div className="flex gap-2 pt-2">
                        <div className="h-8 bg-slate-200 rounded-xl flex-1"></div>
                        <div className="h-8 bg-slate-200 rounded-xl flex-1"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : banners.length === 0 ? (
              <div className="bg-white p-12 rounded-2xl border border-soft-oatmeal text-center">
                <div className="w-16 h-16 bg-soft-oatmeal/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <LuEye size={30} className="text-warm-sand opacity-50" />
                </div>
                <h3 className="text-lg font-bold text-deep-espresso mb-1">No promo banners yet</h3>
                <p className="text-warm-sand text-sm mb-6">Create a promo banner and it will appear here.</p>
                <button
                  onClick={() => setActiveTab('create')}
                  className="inline-flex items-center gap-2 bg-deep-espresso text-white px-6 py-3 rounded-xl font-bold hover:bg-dusty-cocoa transition-all shadow-sm"
                >
                  Create First Promo Banner
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {banners.map((item) => (
                  <div
                    key={item._id}
                    className="bg-white rounded-2xl border border-soft-oatmeal shadow-sm overflow-hidden flex flex-col justify-between"
                  >
                    <div className="aspect-[16/9] bg-soft-oatmeal/20 relative overflow-hidden">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.title || 'Promo banner'}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.style.display = 'none';
                            const fallback = e.target.parentNode.querySelector('.fallback-img');
                            if (fallback) fallback.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div className="fallback-img absolute inset-0 bg-soft-oatmeal/20 flex flex-col items-center justify-center text-warm-sand" style={{ display: item.image ? 'none' : 'flex' }}>
                        <LuImages size={28} className="opacity-40" />
                        <span className="text-[10px] font-black uppercase tracking-widest mt-2 text-slate-400">Broken Link</span>
                      </div>
                    </div>

                    <div className="p-4 space-y-3 flex-grow flex flex-col justify-between">
                      <div className="space-y-1">
                        <h3 className="font-bold text-deep-espresso line-clamp-1">
                          {item.title || 'Untitled promo banner'}
                        </h3>
                        <p className="text-xs text-warm-sand line-clamp-2 min-h-8">
                          {item.subtitle || 'No subtitle added'}
                        </p>
                      </div>

                      <div className="space-y-3 pt-2">
                        <div className="flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-wider">
                          {item.ctaText && (
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-650">
                              {item.ctaText}
                            </span>
                          )}
                          {item.ctaLink && (
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-650 font-mono">
                              {item.ctaLink}
                            </span>
                          )}
                        </div>

                        <div className="pt-2 border-t border-soft-oatmeal/60 flex gap-2">
                          <button
                            onClick={() => handleEdit(item)}
                            className="flex-1 flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest px-3 py-2 rounded-xl bg-soft-oatmeal/30 text-deep-espresso hover:bg-soft-oatmeal/50 transition-all border border-soft-oatmeal/50"
                          >
                            <LuPencil size={13} />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(item)}
                            disabled={deletingId === item._id}
                            className="flex-1 flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest px-3 py-2 rounded-xl bg-red-50 text-red-700 hover:bg-red-100 transition-all border border-red-200/50 disabled:opacity-60"
                          >
                            {deletingId === item._id ? <LuLoader className="animate-spin" size={13} /> : <LuTrash2 size={13} />}
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </PageWrapper>
  );
};

export default ManagePromoBanner;
