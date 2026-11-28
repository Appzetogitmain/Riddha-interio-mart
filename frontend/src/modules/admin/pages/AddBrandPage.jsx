import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import PageWrapper from '../components/PageWrapper';
import { motion } from 'framer-motion';
import {
  FiPlus, FiX, FiCheck, FiImage, FiLayers,
  FiSave, FiInfo, FiChevronLeft, FiTrash2
} from 'react-icons/fi';

import api from '../../../shared/utils/api';

const AddBrandPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('general');
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    offer: '',
    logo: '',
    banners: [''],
    categories: [{ id: 1, name: '', image: '', slug: '' }],
    isActive: true
  });
  const fileInputRef = useRef(null);

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

  const handleBannerUpload = (e, index) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => handleArrayChange('banners', index, reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleCategoryImgUpload = (e, index) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => handleCategoryChange(index, 'image', reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    try {
      setSubmitting(true);
      setStatusMessage('');

      // Sanitize payload: remove empty banners and empty categories
      const sanitizedPayload = {
        ...formData,
        banners: formData.banners.filter(b => b && b.trim() !== ''),
        categories: formData.categories
          .filter(c => c.name && c.name.trim() !== '')
          .map(({ id, ...rest }) => rest) // Remove frontend-only temporary ID
      };

      await api.post('/brands', sanitizedPayload);
      navigate('/admin/manage-brands');
    } catch (error) {
      console.error('Failed to initialize partner:', error);
      setStatusMessage(error.response?.data?.error || 'Failed to initialize partner.');
    } finally {
      setSubmitting(false);
    }
  };

  const tabs = [
    { id: 'general', label: 'General Info', icon: FiInfo },
    { id: 'assets', label: 'Visual Assets', icon: FiImage },
    { id: 'categories', label: 'Categories', icon: FiLayers }
  ];

  return (
    <PageWrapper>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/admin/manage-brands')}
              className="p-3 bg-white rounded-2xl border border-soft-oatmeal/40 text-warm-sand hover:text-deep-espresso transition-all shadow-sm"
            >
              <FiChevronLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-display font-bold text-deep-espresso">Initialize New Partner</h1>
              <p className="text-[10px] text-warm-sand font-black uppercase tracking-widest mt-1">Expanding the Riddha Brand Directory</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => navigate('/admin/manage-brands')}
              className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-warm-sand hover:text-deep-espresso transition-all"
            >
              Discard Changes
            </button>
            <button
              onClick={handleSave}
              disabled={!formData.name || submitting}
              className="px-8 py-3 bg-deep-espresso text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:shadow-2xl hover:bg-black transition-all disabled:opacity-50 active:scale-95 flex items-center gap-2"
            >
              <FiSave size={16} /> {submitting ? 'Initializing...' : 'Save Partner'}
            </button>
          </div>
        </div>

        {statusMessage && (
          <div className="bg-red-50 text-red-500 p-4 rounded-2xl text-xs font-bold border border-red-100 animate-shake">
            {statusMessage}
          </div>
        )}

        <div className="bg-white rounded-[40px] shadow-2xl border border-soft-oatmeal/30 overflow-hidden flex flex-col">
          {/* Tab Navigation */}
          <div className="px-8 border-b border-soft-oatmeal flex gap-8 bg-soft-oatmeal/5">
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

          <div className="p-8 space-y-8 bg-white min-h-[400px]">
            {activeTab === 'general' && (
              <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
                  <div className="md:col-span-4">
                    <label className="text-[9px] font-black text-warm-sand uppercase tracking-widest block mb-4">Official Logo</label>
                    <input type="file" className="hidden" ref={fileInputRef} onChange={handleLogoUpload} />
                    <div
                      onClick={() => fileInputRef.current.click()}
                      className="aspect-square w-full rounded-[40px] bg-soft-oatmeal/5 border-2 border-dashed border-soft-oatmeal/60 flex flex-col items-center justify-center cursor-pointer hover:bg-soft-oatmeal/10 transition-all overflow-hidden relative shadow-inner group"
                    >
                      {formData.logo ? (
                        <>
                          <img src={formData.logo} alt="Logo Preview" className="w-full h-full object-contain p-8" />
                          <div className="absolute inset-0 bg-deep-espresso/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                            <span className="text-white text-[10px] font-black uppercase tracking-widest">Change Brand Logo</span>
                          </div>
                        </>
                      ) : (
                        <div className="text-center px-4">
                          <div className="w-16 h-16 rounded-3xl bg-white shadow-lg mx-auto mb-4 flex items-center justify-center text-warm-sand/20">
                            <FiImage size={32} />
                          </div>
                          <span className="text-[10px] font-bold uppercase text-warm-sand/40 tracking-widest">Upload PNG/SVG</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="md:col-span-8 space-y-8 flex flex-col justify-center">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-warm-sand uppercase tracking-widest ml-1">Brand Name</label>
                      <input
                        type="text" value={formData.name} onChange={(e) => handleChange('name', e.target.value)}
                        placeholder="e.g. Anchor by Panasonic"
                        className="w-full bg-soft-oatmeal/5 border border-soft-oatmeal/60 rounded-2xl px-6 py-4 text-sm focus:ring-4 focus:ring-warm-sand/5 outline-none transition-all font-medium"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-warm-sand uppercase tracking-widest ml-1">Current Campaign</label>
                      <input
                        type="text" value={formData.offer} onChange={(e) => handleChange('offer', e.target.value)}
                        placeholder="e.g. Exclusive Season: Up to 50% Off"
                        className="w-full bg-soft-oatmeal/5 border border-soft-oatmeal/60 rounded-2xl px-6 py-4 text-sm focus:ring-4 focus:ring-warm-sand/5 outline-none transition-all font-medium"
                      />
                    </div>
                    <div className="flex items-center gap-6 p-6 bg-soft-oatmeal/5 rounded-[32px] border border-soft-oatmeal/30">
                      <div
                        onClick={() => handleChange('isActive', !formData.isActive)}
                        className={`w-14 h-7 rounded-full p-1 cursor-pointer transition-all duration-300 ${formData.isActive ? 'bg-green-500 shadow-lg shadow-green-200' : 'bg-soft-oatmeal'}`}
                      >
                        <motion.div
                          animate={{ x: formData.isActive ? 28 : 0 }}
                          className="w-5 h-5 bg-white rounded-full shadow-md"
                        />
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-deep-espresso">Public Presence</p>
                        <p className="text-[9px] text-warm-sand uppercase font-black tracking-widest">{formData.isActive ? 'Active on Storefront' : 'Hidden from Directory'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'assets' && (
              <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="text-lg font-bold text-deep-espresso">Experience Banners</h3>
                    <p className="text-[10px] text-warm-sand uppercase font-black tracking-widest mt-1">High-impact visuals for the brand dedicated page</p>
                  </div>
                  <button
                    onClick={() => addArrayItem('banners')}
                    className="px-5 py-2.5 bg-deep-espresso text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all flex items-center gap-2 shadow-lg"
                  >
                    <FiPlus /> New Banner URL
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {formData.banners.map((url, idx) => (
                    <div key={idx} className="bg-soft-oatmeal/5 p-4 rounded-[32px] border border-soft-oatmeal/40 flex items-center gap-6 group hover:border-warm-sand/30 transition-all">
                      <div 
                        onClick={() => document.getElementById(`banner-upload-${idx}`).click()}
                        className="w-32 h-16 rounded-2xl bg-white border border-soft-oatmeal/20 flex-shrink-0 overflow-hidden relative shadow-inner cursor-pointer"
                      >
                        {url ? <img src={url} className="w-full h-full object-cover" /> : <FiImage className="absolute inset-0 m-auto text-warm-sand/10" size={20} />}
                        <div className="absolute inset-0 bg-deep-espresso/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                          <FiPlus className="text-white" />
                        </div>
                      </div>
                      <input 
                        type="file" id={`banner-upload-${idx}`} className="hidden" 
                        onChange={(e) => handleBannerUpload(e, idx)} accept="image/*"
                      />
                      <input
                        type="text" value={url} onChange={(e) => handleArrayChange('banners', idx, e.target.value)}
                        placeholder="Banner URL or Upload File"
                        className="flex-1 bg-transparent border-none text-xs focus:ring-0 font-medium placeholder:text-warm-sand/20"
                      />
                      <button onClick={() => removeArrayItem('banners', idx)} className="p-3 text-warm-sand/20 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all">
                        <FiX size={20} />
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'categories' && (
              <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="text-lg font-bold text-deep-espresso">Brand Segments</h3>
                    <p className="text-[10px] text-warm-sand uppercase font-black tracking-widest mt-1">Categorically organized product collections</p>
                  </div>
                  <button
                    onClick={() => addArrayItem('categories')}
                    className="px-5 py-2.5 bg-deep-espresso text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all flex items-center gap-2 shadow-lg"
                  >
                    <FiPlus /> Initialize Segment
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {formData.categories.map((cat, idx) => (
                    <div key={idx} className="bg-soft-oatmeal/5 p-6 rounded-[40px] border border-soft-oatmeal/40 relative group hover:border-warm-sand/30 transition-all">
                      <div className="flex items-center gap-5 mb-6">
                        <div className="w-16 h-16 rounded-[24px] bg-white border border-soft-oatmeal/20 overflow-hidden shadow-inner flex-shrink-0">
                          {cat.image ? <img src={cat.image} className="w-full h-full object-cover" /> : <FiLayers size={24} className="w-full h-full p-5 text-warm-sand/10" />}
                        </div>
                        <div className="flex-1 space-y-1">
                          <input
                            type="text" value={cat.name} onChange={(e) => handleCategoryChange(idx, 'name', e.target.value)}
                            placeholder="Segment Title"
                            className="w-full bg-transparent border-none text-sm font-bold text-deep-espresso p-0 focus:ring-0 placeholder:text-warm-sand/20"
                          />
                          <input
                            type="text" value={cat.slug} onChange={(e) => handleCategoryChange(idx, 'slug', e.target.value)}
                            placeholder="segment-slug"
                            className="w-full bg-transparent border-none text-[9px] font-black uppercase tracking-[0.2em] text-warm-sand p-0 focus:ring-0"
                          />
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <label className="text-[8px] font-black uppercase tracking-widest text-warm-sand/50 ml-1">Asset Reference</label>
                          <button 
                            type="button"
                            onClick={() => document.getElementById(`cat-img-upload-${idx}`).click()}
                            className="text-[8px] font-black uppercase tracking-widest text-deep-espresso hover:underline"
                          >
                            Upload File
                          </button>
                        </div>
                        <input 
                           type="file" id={`cat-img-upload-${idx}`} className="hidden" 
                           onChange={(e) => handleCategoryImgUpload(e, idx)} accept="image/*"
                         />
                        <div className="flex gap-3">
                          <input
                            type="text" value={cat.image} onChange={(e) => handleCategoryChange(idx, 'image', e.target.value)}
                            placeholder="Paste image link or upload..."
                            className="flex-1 bg-white border border-soft-oatmeal/30 rounded-xl px-4 py-3 text-[11px] focus:ring-4 focus:ring-warm-sand/5 outline-none transition-all font-medium"
                          />
                          <button onClick={() => removeArrayItem('categories', idx)} className="p-3 bg-red-50 text-red-300 hover:text-red-500 rounded-xl transition-all">
                            <FiTrash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};

export default AddBrandPage;
