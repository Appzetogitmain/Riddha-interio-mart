import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import PageWrapper from '../components/PageWrapper';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiPlus, FiX, FiCheck, FiEdit3, FiTrash2, FiImage, FiLayers,
  FiSave, FiInfo, FiExternalLink, FiChevronDown, FiEye, FiEyeOff,
  FiSearch, FiFilter
} from 'react-icons/fi';
import api from '../../../shared/utils/api';
import { uploadImage } from '../../../shared/utils/upload';
import { toast } from 'react-hot-toast';

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Delete', type = 'danger' }) => {
  if (!isOpen) return null;
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-deep-espresso/40 backdrop-blur-md z-[200] flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-[32px] p-8 max-w-sm w-full shadow-2xl border border-soft-oatmeal/30 text-center"
      >
        <div className={`w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center ${type === 'danger' ? 'bg-red-50 text-red-500' : 'bg-warm-sand/10 text-warm-sand'}`}>
          {type === 'danger' ? <FiTrash2 size={24} /> : <FiInfo size={24} />}
        </div>
        <h3 className="text-xl font-display font-bold text-deep-espresso mb-2">{title}</h3>
        <p className="text-sm text-warm-sand/80 mb-8 leading-relaxed">{message}</p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 text-[10px] font-black uppercase tracking-widest text-warm-sand hover:bg-soft-oatmeal/20 rounded-xl transition-all">Cancel</button>
          <button
            onClick={() => { onConfirm(); onClose(); }}
            className={`flex-1 py-3 rounded-xl text-white text-[10px] font-black uppercase tracking-widest shadow-lg transition-all active:scale-95 ${type === 'danger' ? 'bg-red-500 hover:bg-red-600 shadow-red-200' : 'bg-deep-espresso hover:bg-dusty-cocoa shadow-warm-sand/20'}`}
          >
            {confirmText}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

const BrandLogo = ({ src, name, className = "" }) => {
  const [error, setError] = useState(false);
  const initials = name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';
  
  if (error || !src) {
    return (
      <div className={`flex items-center justify-center bg-gradient-to-br from-soft-oatmeal to-warm-sand/20 text-deep-espresso font-display font-black text-sm shadow-inner ${className}`}>
        {initials}
      </div>
    );
  }

  return (
    <img 
      src={src} 
      alt={name} 
      onError={() => setError(true)}
      className={`object-contain mix-blend-multiply ${className}`} 
    />
  );
};

const EmptyState = ({ onAdd, isFiltering }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
    className="col-span-full py-20 flex flex-col items-center text-center px-6"
  >
    <div className="w-24 h-24 rounded-[40px] bg-soft-oatmeal/20 flex items-center justify-center text-warm-sand/30 mb-8 relative">
      <FiLayers size={40} />
      <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-2xl bg-white shadow-lg flex items-center justify-center text-deep-espresso">
        <FiPlus size={20} />
      </div>
    </div>
    <h3 className="text-2xl font-display font-bold text-deep-espresso mb-3">
      {isFiltering ? 'No brands match your search' : 'No brand partners yet'}
    </h3>
    <p className="max-w-xs text-sm text-warm-sand leading-relaxed mb-10">
      {isFiltering
        ? "Try adjusting your search terms or filters to find what you're looking for."
        : "Start building your brand directory by adding your first official partner."}
    </p>
    <button
      onClick={onAdd}
      className="px-10 py-4 bg-deep-espresso text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl hover:shadow-2xl transition-all active:scale-95"
    >
      Add First Partner
    </button>
  </motion.div>
);

const BrandModal = ({ brand, isOpen, onClose, onSave, saving }) => {
  const [activeTab, setActiveTab] = useState('general');
  const [formData, setFormData] = useState({
    name: '',
    offer: '',
    logo: '',
    banners: [''],
    categories: [{ id: 1, name: '', image: '', slug: '' }],
    isActive: true
  });
  const fileInputRef = useRef(null);
  const bannerFileInputRef = useRef(null);
  const categoryFileInputRef = useRef(null);

  const [activeBannerUploadIndex, setActiveBannerUploadIndex] = useState(null);
  const [activeCategoryUploadIndex, setActiveCategoryUploadIndex] = useState(null);

  useEffect(() => {
    if (brand) {
      setFormData({
        ...brand,
        banners: brand.banners?.length ? brand.banners : [''],
        categories: brand.categories?.length ? brand.categories : [{ id: 1, name: '', image: '', slug: '' }]
      });
    } else {
      setFormData({
        name: '',
        offer: '',
        logo: '',
        banners: [''],
        categories: [{ id: 1, name: '', image: '', slug: '' }],
        isActive: true
      });
    }
    setActiveTab('general');
    setActiveBannerUploadIndex(null);
    setActiveCategoryUploadIndex(null);
  }, [brand, isOpen]);

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayChange = (type, index, value) => {
    const newArr = [...formData[type]];
    newArr[index] = value;
    setFormData(prev => ({ ...prev, [type]: newArr }));
  };

  const handleCategoryChange = (index, field, value) => {
    const newCats = [...formData.categories];
    newCats[index] = { ...newCats[index], [field]: value };
    setFormData(prev => ({ ...prev, categories: newCats }));
  };

  const addArrayItem = (type) => {
    if (type === 'banners') {
      setFormData(prev => ({ ...prev, banners: [...prev.banners, ''] }));
    } else {
      setFormData(prev => ({
        ...prev,
        categories: [...prev.categories, { id: Date.now(), name: '', image: '', slug: '' }]
      }));
    }
  };

  const removeArrayItem = (type, index) => {
    const newArr = formData[type].filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, [type]: newArr }));
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => handleChange('logo', reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleBannerUpload = (e) => {
    const file = e.target.files[0];
    if (file && activeBannerUploadIndex !== null) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleArrayChange('banners', activeBannerUploadIndex, reader.result);
        setActiveBannerUploadIndex(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCategoryUpload = (e) => {
    const file = e.target.files[0];
    if (file && activeCategoryUploadIndex !== null) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleCategoryChange(activeCategoryUploadIndex, 'image', reader.result);
        setActiveCategoryUploadIndex(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const tabs = [
    { id: 'general', label: 'General Info', icon: FiInfo },
    { id: 'assets', label: 'Visual Assets', icon: FiImage },
    { id: 'categories', label: 'Categories', icon: FiLayers }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-deep-espresso/60 backdrop-blur-xl z-[100] flex items-center justify-center p-4 md:p-6"
    >
      <motion.div
        initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }}
        className="bg-white w-full max-w-4xl rounded-[40px] shadow-2xl overflow-hidden border border-soft-oatmeal/30 flex flex-col max-h-[90vh]"
      >
        <div className="p-8 border-b border-soft-oatmeal flex items-center justify-between bg-soft-oatmeal/5">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-white border border-soft-oatmeal shadow-inner flex items-center justify-center overflow-hidden flex-shrink-0">
              {formData.logo ? <img src={formData.logo} className="w-full h-full object-contain p-2" /> : <FiImage className="text-warm-sand/20" size={24} />}
            </div>
            <div>
              <h2 className="text-2xl font-display font-bold text-deep-espresso">
                {brand ? 'Edit Brand' : 'Add New Brand'}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-warm-sand text-[9px] font-black uppercase tracking-[0.2em]">Partner Management</span>
                <div className="w-1 h-1 rounded-full bg-warm-sand/30" />
                <span className="text-deep-espresso text-[9px] font-black uppercase tracking-[0.1em]">{formData.name || 'New Record'}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-red-50 hover:text-red-500 rounded-2xl transition-all text-warm-sand/60">
            <FiX size={24} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-8 border-b border-soft-oatmeal flex gap-8">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-5 text-[10px] font-black uppercase tracking-widest relative transition-all flex items-center gap-2 ${activeTab === tab.id ? 'text-deep-espresso' : 'text-warm-sand/40 hover:text-warm-sand'}`}
            >
              <tab.icon size={14} />
              {tab.label}
              {activeTab === tab.id && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-1 bg-deep-espresso rounded-t-full" />}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar bg-soft-oatmeal/5">
          {activeTab === 'general' && (
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                <div className="md:col-span-4">
                  <label className="text-[9px] font-black text-warm-sand uppercase tracking-widest block mb-3">Brand Identity</label>
                  <input type="file" className="hidden" ref={fileInputRef} onChange={handleLogoUpload} />
                  <div
                    onClick={() => fileInputRef.current.click()}
                    className="aspect-square w-full rounded-3xl bg-white border-2 border-dashed border-soft-oatmeal/60 flex flex-col items-center justify-center cursor-pointer hover:bg-soft-oatmeal/10 transition-all overflow-hidden relative shadow-inner group"
                  >
                    {formData.logo ? (
                      <>
                        <img src={formData.logo} alt="Logo Preview" className="w-full h-full object-contain p-6" />
                        <div className="absolute inset-0 bg-deep-espresso/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                          <span className="text-white text-[8px] font-black uppercase tracking-widest">Change Logo</span>
                        </div>
                      </>
                    ) : (
                      <div className="text-center">
                        <FiImage size={32} className="mx-auto mb-2 opacity-20" />
                        <span className="text-[8px] font-bold uppercase text-warm-sand/40">Upload official Logo</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="md:col-span-8 flex flex-col justify-center space-y-6">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-warm-sand uppercase tracking-widest">Display Name</label>
                    <input
                      type="text" value={formData.name} onChange={(e) => handleChange('name', e.target.value)}
                      placeholder="e.g. Anchor by Panasonic"
                      className="w-full bg-white border border-soft-oatmeal/60 rounded-2xl px-6 py-4 text-sm focus:ring-4 focus:ring-warm-sand/5 outline-none transition-all font-medium"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-warm-sand uppercase tracking-widest">Promotional Campaign</label>
                    <input
                      type="text" value={formData.offer} onChange={(e) => handleChange('offer', e.target.value)}
                      placeholder="e.g. Festive Season: Up to 50% Off"
                      className="w-full bg-white border border-soft-oatmeal/60 rounded-2xl px-6 py-4 text-sm focus:ring-4 focus:ring-warm-sand/5 outline-none transition-all font-medium"
                    />
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-soft-oatmeal/30">
                    <div
                      onClick={() => handleChange('isActive', !formData.isActive)}
                      className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-all ${formData.isActive ? 'bg-green-500' : 'bg-red-200'}`}
                    >
                      <motion.div
                        animate={{ x: formData.isActive ? 24 : 0 }}
                        className="w-4 h-4 bg-white rounded-full shadow-md"
                      />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-deep-espresso">Public Visibility</p>
                      <p className="text-[8px] text-warm-sand uppercase font-black">{formData.isActive ? 'Active on Storefront' : 'Hidden from Users'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'assets' && (
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
              <input type="file" className="hidden" ref={bannerFileInputRef} onChange={handleBannerUpload} accept="image/*" />
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-deep-espresso">Banner Assets</h3>
                  <p className="text-[9px] text-warm-sand uppercase font-black tracking-widest mt-0.5">High-resolution hero images for brand page</p>
                </div>
                <button
                  onClick={() => addArrayItem('banners')}
                  className="px-4 py-2 bg-soft-oatmeal/20 rounded-xl text-[9px] font-black uppercase text-deep-espresso hover:bg-soft-oatmeal transition-colors flex items-center gap-2"
                >
                  <FiPlus /> Add Banner
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {formData.banners.map((url, idx) => (
                  <div key={idx} className="relative group">
                    <div 
                      onClick={() => { setActiveBannerUploadIndex(idx); bannerFileInputRef.current.click(); }}
                      className="w-full aspect-[21/9] md:aspect-[3/1] rounded-3xl bg-white border-2 border-dashed border-soft-oatmeal/60 flex flex-col items-center justify-center cursor-pointer hover:bg-soft-oatmeal/10 transition-all overflow-hidden relative shadow-inner group"
                    >
                      {url ? (
                        <>
                          <img src={url} alt="Banner Preview" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-deep-espresso/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                            <span className="text-white text-[8px] font-black uppercase tracking-widest">Change Banner Image</span>
                          </div>
                        </>
                      ) : (
                        <div className="text-center">
                          <FiImage size={32} className="mx-auto mb-2 opacity-20" />
                          <span className="text-[8px] font-bold uppercase text-warm-sand/40">Click to upload banner image</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Delete Floating Button */}
                    <button 
                      onClick={() => removeArrayItem('banners', idx)} 
                      className="absolute top-4 right-4 p-2 bg-white hover:bg-red-50 text-warm-sand/60 hover:text-red-500 rounded-xl shadow-md border border-soft-oatmeal/20 transition-all z-10 opacity-0 group-hover:opacity-100"
                    >
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'categories' && (
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
              <input type="file" className="hidden" ref={categoryFileInputRef} onChange={handleCategoryUpload} accept="image/*" />
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-deep-espresso">Collection Segments</h3>
                  <p className="text-[9px] text-warm-sand uppercase font-black tracking-widest mt-0.5">Define shopping categories for this brand</p>
                </div>
                <button
                  onClick={() => addArrayItem('categories')}
                  className="px-4 py-2 bg-soft-oatmeal/20 rounded-xl text-[9px] font-black uppercase text-deep-espresso hover:bg-soft-oatmeal transition-colors flex items-center gap-2"
                >
                  <FiPlus /> New Record
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {formData.categories.map((cat, idx) => (
                  <div key={idx} className="bg-white p-5 rounded-[32px] border border-soft-oatmeal/40 shadow-sm relative group hover:border-warm-sand/30 transition-all">
                    <div className="flex items-center gap-4 mb-4">
                      <div 
                        onClick={() => { setActiveCategoryUploadIndex(idx); categoryFileInputRef.current.click(); }}
                        className="w-12 h-12 rounded-2xl bg-soft-oatmeal/10 border border-soft-oatmeal/20 overflow-hidden cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0"
                        title="Click to Upload Category Image"
                      >
                        {cat.image ? <img src={cat.image} className="w-full h-full object-cover" /> : <FiImage className="w-full h-full p-3 text-warm-sand/20 flex-shrink-0" />}
                      </div>
                      <div className="flex-1">
                        <input
                          type="text" value={cat.name} onChange={(e) => handleCategoryChange(idx, 'name', e.target.value)}
                          placeholder="Category Title"
                          className="w-full bg-transparent border-none text-xs font-bold text-deep-espresso p-0 focus:ring-0 placeholder:text-warm-sand/20"
                        />
                        <input
                          type="text" value={cat.slug} onChange={(e) => handleCategoryChange(idx, 'slug', e.target.value)}
                          placeholder="url-slug"
                          className="w-full bg-transparent border-none text-[9px] font-black uppercase tracking-widest text-warm-sand p-0 mt-0.5 focus:ring-0"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[7px] font-black uppercase tracking-widest text-warm-sand/60">Image Asset URL</label>
                      <div className="flex gap-2">
                        <input
                          type="text" value={cat.image} onChange={(e) => handleCategoryChange(idx, 'image', e.target.value)}
                          placeholder="https://..."
                          className="flex-1 bg-soft-oatmeal/5 border border-soft-oatmeal/20 rounded-xl px-4 py-2 text-[10px] focus:ring-2 focus:ring-warm-sand/10 outline-none transition-all"
                        />
                        <button onClick={() => removeArrayItem('categories', idx)} className="p-2 text-red-300 hover:text-red-500 transition-colors">
                          <FiX size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        <div className="p-8 bg-white border-t border-soft-oatmeal flex items-center justify-between flex-shrink-0">
          <div className="hidden md:flex gap-4">
            <div className="flex -space-x-3">
              {formData.banners.filter(b => b).slice(0, 3).map((b, i) => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-soft-oatmeal overflow-hidden shadow-sm flex-shrink-0">
                  <img src={b} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
            <p className="text-[8px] font-black uppercase tracking-widest text-warm-sand/40 self-center">
              {formData.banners.length} Banners &bull; {formData.categories.length} Categories
            </p>
          </div>
          <div className="flex gap-4 w-full md:w-auto">
            <button onClick={onClose} className="flex-1 md:flex-none px-8 py-4 text-[10px] font-black uppercase tracking-[0.25em] text-warm-sand hover:text-red-500 transition-colors">Cancel</button>
            <button
              onClick={() => onSave(formData)}
              disabled={!formData.name || saving}
              className="flex-1 md:flex-none px-12 bg-deep-espresso text-white disabled:opacity-50 py-4 rounded-[20px] font-black uppercase tracking-[0.2em] text-[10px] shadow-xl hover:shadow-2xl hover:bg-black transition-all flex items-center justify-center gap-3 active:scale-95"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <FiSave size={18} /> {brand ? 'Finalize Changes' : 'Initialize Partner'}
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

const ManageBrands = () => {
  const navigate = useNavigate();
  const [brands, setBrands] = useState([]);
  const [editingBrand, setEditingBrand] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, active, hidden
  const [sortBy, setSortBy] = useState('name'); // name, categories, banners

  // Confirmation Modal State
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, id: null });

  const fetchBrands = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/brands/admin');
      setBrands(data.data || []);
    } catch (err) {
      console.error('Failed to fetch brands:', err);
      toast.error('Failed to load partners from the directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  const handleSave = async (brandData) => {
    const saveToast = toast.loading(editingBrand ? 'Updating brand partner...' : 'Initializing brand partner...');
    try {
      setSaving(true);
      let finalLogo = brandData.logo;

      // 1. Upload logo to Cloudinary if it's base64
      if (finalLogo && finalLogo.startsWith('data:image')) {
        finalLogo = await uploadImage(finalLogo);
      }

      // 2. Upload banners if base64 in parallel
      const uploadedBanners = await Promise.all(
        (brandData.banners || []).map(async (bannerUrl) => {
          if (bannerUrl && bannerUrl.startsWith('data:image')) {
            return await uploadImage(bannerUrl);
          }
          return bannerUrl;
        })
      );

      // 3. Upload category images if base64 in parallel
      const uploadedCategories = await Promise.all(
        (brandData.categories || []).map(async (cat) => {
          let catImg = cat.image;
          if (catImg && catImg.startsWith('data:image')) {
            catImg = await uploadImage(catImg);
          }
          return {
            ...cat,
            image: catImg
          };
        })
      );

      // Sanitize payload
      const sanitizedPayload = {
        ...brandData,
        logo: finalLogo,
        banners: uploadedBanners.filter(b => b && b.trim() !== ''),
        categories: uploadedCategories
          ?.filter(c => c.name && c.name.trim() !== '')
          .map(({ id, _id, ...rest }) => rest) || [] 
      };

      if (editingBrand) {
        await api.put(`/brands/${editingBrand._id}`, sanitizedPayload);
        toast.success('Brand partner updated successfully.', { id: saveToast });
      } else {
        await api.post('/brands', sanitizedPayload);
        toast.success('Brand partner created successfully.', { id: saveToast });
      }
      fetchBrands();
      setIsModalOpen(false);
      setEditingBrand(null);
    } catch (err) {
      console.error('Failed to save brand:', err);
      toast.error(err.response?.data?.error || 'Failed to save brand data.', { id: saveToast });
    } finally {
      setSaving(false);
    }
  };

  const toggleVisibility = async (id) => {
    const brand = brands.find(b => b._id === id);
    if (!brand) return;
    
    try {
      await api.put(`/brands/${id}`, { isActive: !brand.isActive });
      setBrands(brands.map(b => b._id === id ? { ...b, isActive: !b.isActive } : b));
      toast.success(`Brand visibility: ${!brand.isActive ? 'Active' : 'Hidden'}`);
    } catch (err) {
      console.error('Failed to toggle visibility:', err);
      toast.error('Failed to toggle brand visibility.');
    }
  };

  const handleDelete = async (id) => {
    const deleteToast = toast.loading('Removing brand partner...');
    try {
      await api.delete(`/brands/${id}`);
      setBrands(brands.filter(b => b._id !== id));
      toast.success('Brand partner removed from directory.', { id: deleteToast });
    } catch (err) {
      console.error('Failed to delete brand:', err);
      toast.error('Failed to remove partner from the directory.', { id: deleteToast });
    }
  };

  const filteredBrands = brands
    .filter(b => b.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .filter(b => {
      if (filterStatus === 'active') return b.isActive;
      if (filterStatus === 'hidden') return !b.isActive;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'categories') return (b.categories?.length || 0) - (a.categories?.length || 0);
      if (sortBy === 'banners') return (b.banners?.length || 0) - (a.banners?.length || 0);
      return 0;
    });

  return (
    <PageWrapper>
      <div className="max-w-7xl mx-auto space-y-4 py-2">
        {/* Main Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Partners', value: brands.length, icon: FiLayers, color: 'text-blue-500', bg: 'bg-blue-50' },
            { label: 'Active', value: brands.filter(b => b.isActive).length, icon: FiCheck, color: 'text-green-500', bg: 'bg-green-50' },
            { label: 'Hidden', value: brands.filter(b => !b.isActive).length, icon: FiEyeOff, color: 'text-amber-500', bg: 'bg-amber-50' },
            { label: 'Assets', value: brands.reduce((acc, b) => acc + (b.banners?.length || 0), 0), icon: FiImage, color: 'text-purple-500', bg: 'bg-purple-50' },
          ].map((stat, i) => (
            <div key={i} className="bg-white p-4 rounded-2xl border border-soft-oatmeal/40 shadow-sm flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center shadow-inner flex-shrink-0`}>
                <stat.icon size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-[8px] font-black uppercase tracking-widest text-warm-sand/60 truncate">{stat.label}</p>
                <p className="text-lg font-display font-bold text-deep-espresso">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Action & Filter Bar */}
        <div className="bg-white p-4 rounded-3xl border border-soft-oatmeal/40 shadow-sm space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => { setEditingBrand(null); setIsModalOpen(true); }}
                className="px-6 py-3 bg-deep-espresso text-white rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg active:scale-95"
              >
                <FiPlus size={16} /> New Record
              </button>
              <div className="h-8 w-px bg-soft-oatmeal/40 hidden md:block" />
              <div className="hidden lg:flex flex-col">
                <p className="text-[8px] font-black uppercase tracking-widest text-deep-espresso">Admin Control</p>
                <p className="text-[7px] text-warm-sand font-bold uppercase">Live Directory</p>
              </div>
            </div>

            <div className="flex-1 min-w-[200px] relative">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-warm-sand/40" size={16} />
              <input
                type="text" placeholder="Search brands..."
                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-soft-oatmeal/5 border border-soft-oatmeal/40 rounded-xl pl-10 pr-4 py-3 text-xs focus:ring-2 focus:ring-warm-sand/10 outline-none transition-all"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between pt-3 border-t border-soft-oatmeal/40 gap-3">
            <div className="flex items-center gap-1.5">
              {['all', 'active', 'hidden'].map(status => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-4 py-2 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all border ${filterStatus === status ? 'bg-deep-espresso text-white border-deep-espresso' : 'bg-white text-warm-sand border-soft-oatmeal/60 hover:bg-soft-oatmeal/10'}`}
                >
                  {status}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-soft-oatmeal/5 px-3 py-1.5 rounded-lg border border-soft-oatmeal/40">
                <FiFilter className="text-warm-sand/60" size={10} />
                <select
                  value={sortBy} onChange={(e) => setSortBy(e.target.value)}
                  className="bg-transparent border-none text-[8px] font-black uppercase tracking-widest text-deep-espresso outline-none cursor-pointer focus:ring-0 p-0"
                >
                  <option value="name">Name A-Z</option>
                  <option value="categories">Categories</option>
                  <option value="banners">Banners</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Brands List (Full-Width Card Column) */}
        <div className="flex flex-col gap-3">
           <AnimatePresence mode="popLayout">
             {loading ? (
                <div className="flex flex-col gap-3">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="bg-white p-3 rounded-2xl border border-soft-oatmeal/40 shadow-sm flex items-center gap-6 animate-pulse">
                      <div className="w-14 h-14 rounded-xl bg-slate-200 flex-shrink-0"></div>
                      <div className="flex-1 flex items-center gap-8">
                        <div className="w-48 space-y-2">
                          <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                          <div className="h-3 bg-slate-200 rounded w-1/4"></div>
                        </div>
                        <div className="flex-1 hidden md:block">
                          <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                        </div>
                        <div className="hidden lg:flex items-center gap-4">
                          <div className="w-8 h-8 rounded-full bg-slate-200"></div>
                          <div className="w-8 h-8 rounded-full bg-slate-200"></div>
                        </div>
                      </div>
                      <div className="w-16 h-8 bg-slate-200 rounded-xl flex-shrink-0"></div>
                    </div>
                  ))}
                </div>
             ) : filteredBrands.length > 0 ? (
               filteredBrands.map((brand) => (
                 <div 
                   key={brand._id}
                   className={`bg-white p-3 rounded-2xl border border-soft-oatmeal/40 shadow-sm flex items-center gap-6 relative group ${!brand.isActive ? 'opacity-70 grayscale-[0.3]' : ''}`}
                 >
                    {/* Logo */}
                    <div className="w-14 h-14 rounded-xl bg-white border border-soft-oatmeal/20 flex items-center justify-center p-3 overflow-hidden shadow-inner flex-shrink-0">
                       <BrandLogo src={brand.logo} name={brand.name} className="max-w-full max-h-full" />
                    </div>

                    {/* Basic Info */}
                    <div className="flex-1 min-w-0 flex items-center gap-8">
                       <div className="w-48">
                         <h3 className="text-sm font-display font-bold text-deep-espresso truncate">{brand.name}</h3>
                         <div 
                           onClick={() => toggleVisibility(brand._id)}
                           className={`mt-1 inline-block px-2 py-0.5 rounded-full text-[6px] font-black uppercase tracking-widest cursor-pointer transition-all ${brand.isActive ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'}`}
                         >
                           {brand.isActive ? 'Active' : 'Hidden'}
                         </div>
                       </div>
                       
                       <div className="flex-1 hidden md:block">
                         <p className="text-[10px] font-bold text-warm-sand leading-tight line-clamp-1">{brand.offer}</p>
                         <p className="text-[7px] text-warm-sand/40 font-black uppercase tracking-widest mt-1">Current Campaign</p>
                       </div>

                       {/* Metrics */}
                       <div className="hidden lg:flex items-center gap-4">
                          <div className="flex flex-col items-center">
                             <div className="flex items-center gap-1.5 text-[10px] font-bold text-deep-espresso">
                                <FiLayers size={10} className="text-warm-sand/40" /> {brand.categories?.length || 0}
                             </div>
                             <span className="text-[6px] font-black uppercase tracking-tighter text-warm-sand/40">Records</span>
                          </div>
                          <div className="flex flex-col items-center border-l border-soft-oatmeal/40 pl-4">
                             <div className="flex items-center gap-1.5 text-[10px] font-bold text-deep-espresso">
                                <FiImage size={10} className="text-warm-sand/40" /> {brand.banners?.length || 0}
                             </div>
                             <span className="text-[6px] font-black uppercase tracking-tighter text-warm-sand/40">Assets</span>
                          </div>
                       </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0 bg-soft-oatmeal/5 p-1.5 rounded-xl border border-soft-oatmeal/30">
                       <button 
                         onClick={() => { setEditingBrand(brand); setIsModalOpen(true); }}
                         className="p-2 bg-white border border-soft-oatmeal rounded-lg text-warm-sand hover:bg-deep-espresso hover:text-white transition-all shadow-sm"
                         title="Edit"
                       >
                         <FiEdit3 size={14} />
                       </button>
                       <button 
                         onClick={() => setConfirmConfig({ isOpen: true, id: brand._id })}
                         className="p-2 bg-red-50 text-red-400 border border-red-100 rounded-lg hover:bg-red-500 hover:text-white transition-all shadow-sm"
                         title="Delete"
                       >
                         <FiTrash2 size={14} />
                       </button>
                    </div>
                 </div>
               ))
             ) : (
               <div className="w-full">
                 <EmptyState onAdd={() => setIsModalOpen(true)} isFiltering={searchTerm || filterStatus !== 'all'} />
               </div>
             )}
           </AnimatePresence>

           <div className="flex flex-wrap items-center justify-between gap-4 pt-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-deep-espresso text-white flex items-center justify-center shadow-lg shadow-deep-espresso/10">
                  <FiCheck size={20} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-deep-espresso uppercase tracking-tighter">System Live</p>
                  <p className="text-[8px] text-warm-sand uppercase tracking-widest font-black mt-0.5">Automated Asset Hosting</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="hidden sm:block text-right">
                  <p className="text-[10px] font-bold text-deep-espresso">{brands.length} Partners</p>
                  <p className="text-[8px] text-warm-sand uppercase font-black tracking-tighter">Directory v2.4</p>
                </div>
              </div>
           </div>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <BrandModal
            brand={editingBrand}
            isOpen={isModalOpen}
            onClose={() => { setIsModalOpen(false); setEditingBrand(null); }}
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
            title="Delete Partnership?"
            message="This will permanently remove the brand partner and all associated data. This action cannot be undone."
          />
        )}
      </AnimatePresence>
    </PageWrapper>
  );
};

export default ManageBrands;
