import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import PageWrapper from '../components/PageWrapper';
import { LuArrowLeft, LuCheck, LuImage, LuLayoutList, LuStar } from 'react-icons/lu';
import { manageFavouriteCategoriesData } from '../data/manageFavouriteCategoriesData';

const AddFavouriteCategoryItemPage = () => {
  const navigate = useNavigate();
  const [data, setData] = useState({ tabs: [], categories: [] });
  const [loading, setLoading] = useState(false);
  const [item, setItem] = useState({
    name: '',
    category: '',
    image: '',
    slug: ''
  });

  const fileInputRef = React.useRef(null);
  const [uploadMode, setUploadMode] = useState('upload'); // 'upload' or 'url'

  const location = useLocation();

  useEffect(() => {
    const saved = localStorage.getItem('admin_favourite_categories');
    let categoriesData = manageFavouriteCategoriesData;
    
    if (saved) {
      categoriesData = JSON.parse(saved);
    } else {
      localStorage.setItem('admin_favourite_categories', JSON.stringify(manageFavouriteCategoriesData));
    }
    
    setData(categoriesData);
    
    // Set initial category: prioritized passed state > first tab > empty
    const initialCategory = location.state?.category || categoriesData.tabs[0] || '';
    setItem(prev => ({ ...prev, category: initialCategory }));
  }, [location]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setItem(prev => ({ ...prev, image: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!item.name || !item.category) {
      alert("Please fill in both Name and Category (Tab).");
      return;
    }
    
    setLoading(true);

    const newItem = {
      id: Date.now(),
      ...item,
      slug: item.slug || item.name.toLowerCase().replace(/\s+/g, '-'),
      image: item.image || 'https://images.unsplash.com/photo-1583847268964-b28dc2f51ac9?w=800&q=80',
    };

    // Always get freshest data from storage before saving
    const saved = localStorage.getItem('admin_favourite_categories');
    let currentData = data;
    if (saved) {
      try {
        currentData = JSON.parse(saved);
      } catch (err) {
        console.error("Failed to parse storage data:", err);
      }
    }
    
    const updatedData = {
      ...currentData,
      categories: [...(currentData.categories || []), newItem],
    };

    localStorage.setItem('admin_favourite_categories', JSON.stringify(updatedData));
    
    setTimeout(() => {
      setLoading(false);
      navigate('/admin/manage-favourites', { state: { activeTab: item.category } });
    }, 600);
  };

  return (
    <PageWrapper>
      <div className="w-full">
        {/* Navigation / Header */}
        <button
          onClick={() => navigate('/admin/manage-favourites')}
          className="flex items-center gap-2 text-warm-sand hover:text-deep-espresso transition-colors mb-8 group"
        >
          <LuArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span className="font-bold text-sm tracking-widest uppercase">Back to All Favourites</span>
        </button>

        <div className="mb-12">
          <h1 className="text-4xl font-display font-bold text-deep-espresso">Add Category Item</h1>
          <p className="text-warm-sand mt-2">Create a new visual card for the "Our Favourite Categories" section.</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-deep-espresso/5 border border-soft-oatmeal/30 overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-dusty-cocoa via-warm-sand to-dusty-cocoa" />

          <form onSubmit={handleSubmit} className="p-8 md:p-12 space-y-10">
            {/* Main Fields Group */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Item Name */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-warm-sand uppercase tracking-[0.2em] ml-1">Item Name</label>
                <div className="relative">
                  <LuLayoutList className="absolute left-4 top-1/2 -translate-y-1/2 text-deep-espresso/30" />
                  <input
                    required autoFocus
                    type="text"
                    value={item.name}
                    onChange={(e) => setItem({ ...item, name: e.target.value })}
                    className="w-full bg-soft-oatmeal/10 border border-soft-oatmeal rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:ring-2 focus:ring-warm-sand transition-all text-deep-espresso placeholder:text-deep-espresso/20"
                    placeholder="e.g. Luxury Velvet Beds"
                  />
                </div>
              </div>

              {/* Tab Category Selection */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-warm-sand uppercase tracking-[0.2em] ml-1">Parent Tab</label>
                <div className="relative">
                  <LuStar className="absolute left-4 top-1/2 -translate-y-1/2 text-deep-espresso/30" />
                  <select
                    required
                    value={item.category}
                    onChange={(e) => setItem({ ...item, category: e.target.value })}
                    className="w-full bg-soft-oatmeal/10 border border-soft-oatmeal rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:ring-2 focus:ring-warm-sand transition-all text-deep-espresso appearance-none cursor-pointer"
                  >
                    {data.tabs.map(tab => (
                      <option key={tab} value={tab}>{tab}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Image Input Section */}
              <div className="space-y-3 md:col-span-2">
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] font-black text-warm-sand uppercase tracking-[0.2em] ml-1">Category Image</label>
                  <button
                    type="button"
                    onClick={() => setUploadMode(uploadMode === 'upload' ? 'url' : 'upload')}
                    className="text-[10px] font-black text-dusty-cocoa uppercase tracking-widest hover:text-deep-espresso transition-colors"
                  >
                    {uploadMode === 'upload' ? 'Use URL instead' : 'Upload local file'}
                  </button>
                </div>

                {uploadMode === 'upload' ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-40 border-2 border-dashed border-soft-oatmeal rounded-2xl flex flex-col items-center justify-center gap-3 hover:border-warm-sand hover:bg-soft-oatmeal/5 transition-all cursor-pointer group"
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="hidden"
                      accept="image/*"
                    />
                    <div className="w-12 h-12 rounded-full bg-soft-oatmeal/20 flex items-center justify-center text-warm-sand group-hover:scale-110 transition-transform">
                      <LuImage size={24} />
                    </div>
                    <p className="text-sm font-medium text-warm-sand">Click to upload or drag and drop</p>
                    <p className="text-[10px] text-warm-sand/50">PNG, JPG, WebP (Max 2MB)</p>
                  </div>
                ) : (
                  <div className="relative">
                    <LuImage className="absolute left-4 top-1/2 -translate-y-1/2 text-deep-espresso/30" />
                    <input
                      required
                      type="url"
                      value={item.image}
                      onChange={(e) => setItem({ ...item, image: e.target.value })}
                      className="w-full bg-soft-oatmeal/10 border border-soft-oatmeal rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:ring-2 focus:ring-warm-sand transition-all text-deep-espresso placeholder:text-deep-espresso/20"
                      placeholder="Paste image link here..."
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Preview Section */}
            {item.image && (
              <div className="pt-4 border-t border-soft-oatmeal/30">
                <p className="text-[10px] font-black text-warm-sand uppercase tracking-[0.2em] mb-4">Card Preview</p>
                <div className="w-48 aspect-[3/4] rounded-2xl overflow-hidden shadow-xl border border-soft-oatmeal/20 group relative">
                  <img
                    src={item.image}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1583847268964-b28dc2f51ac9?w=800&q=80' }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                  <div className="absolute bottom-4 left-0 right-0 text-center px-4">
                    <span className="text-[10px] font-bold text-white uppercase tracking-wider drop-shadow-md">
                      {item.name || 'Your Item Name'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end pt-4 gap-4">
              <button
                type="button"
                onClick={() => navigate('/admin/manage-favourites')}
                className="px-8 py-4 rounded-2xl font-bold text-warm-sand hover:text-deep-espresso transition-colors text-sm uppercase tracking-widest"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-deep-espresso text-white px-10 py-4 rounded-2xl font-bold hover:bg-dusty-cocoa transition-all shadow-xl shadow-deep-espresso/20 flex items-center gap-3 disabled:opacity-50 min-w-[200px] justify-center text-sm uppercase tracking-widest"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <LuCheck size={20} />
                    Save Item
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </PageWrapper>
  );
};

export default AddFavouriteCategoryItemPage;
