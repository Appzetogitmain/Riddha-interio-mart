import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import PageWrapper from '../components/PageWrapper';
import { motion } from 'framer-motion';
import { LuArrowLeft, LuCheck, LuImage, LuPackagePlus, LuStar, LuType, LuChevronRight } from 'react-icons/lu';
import { manageFeaturedData } from '../data/manageFeaturedData';
import { toast } from 'react-hot-toast';

const AddFeaturedProductPage = () => {
  const navigate = useNavigate();
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    rating: '4.5',
    tag: 'Top Choice',
    image: '',
  });
  const fileInputRef = useRef(null);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setNewProduct({ ...newProduct, image: reader.result });
      reader.readAsDataURL(file);
    }
  };

  const handleClearImage = () => {
    setNewProduct({ ...newProduct, image: '' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.price) {
      toast.error('Please provide at least a name and price for the featured item.');
      return;
    }

    const productToAdd = {
      id: Date.now(),
      name: newProduct.name.trim(),
      category: 'Featured',
      price: parseFloat(newProduct.price) || 0,
      originalPrice: Math.round((parseFloat(newProduct.price) || 0) * 1.2),
      image: newProduct.image || 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=800&q=80',
      rating: parseFloat(newProduct.rating) || 4.5,
      tag: newProduct.tag || 'Top Choice',
    };

    const saved = localStorage.getItem('admin_featured_products');
    let products = saved ? JSON.parse(saved) : [];
    
    // If we're starting fresh, initialize with default data first
    if (!saved) {
      products = [...manageFeaturedData];
    }
    
    products = [...products, productToAdd];
    localStorage.setItem('admin_featured_products', JSON.stringify(products));
    
    toast.success('Featured highlight added successfully!');
    navigate('/admin/manage-featured');
  };

  return (
    <PageWrapper>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Breadcrumbs / Back button */}
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-warm-sand mb-2">
          <button onClick={() => navigate('/admin/manage-featured')} className="hover:text-deep-espresso transition-colors">Featured</button>
          <LuChevronRight size={12} />
          <span className="text-deep-espresso">Add New</span>
        </div>

        <button 
          onClick={() => navigate('/admin/manage-featured')}
          className="flex items-center gap-2 text-warm-sand font-bold hover:text-deep-espresso transition-colors group"
        >
          <LuArrowLeft className="group-hover:-translate-x-1 transition-transform" />
          Back to Featured List
        </button>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-display font-bold text-deep-espresso flex items-center gap-3">
              <LuStar className="text-golden-glow fill-golden-glow shrink-0" size={28} />
              Add Featured
            </h1>
            <p className="text-warm-sand text-sm font-medium tracking-tight">Designate a premium item for highlights.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8 pb-12">
          <div className="bg-white rounded-3xl md:rounded-[32px] border border-soft-oatmeal shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-3">
            {/* Left: Image Preview Area */}
            <div className="p-6 md:p-8 bg-soft-oatmeal/10 border-b lg:border-r lg:border-b-0 border-soft-oatmeal flex flex-col items-center justify-center space-y-6">
              <div className="w-full aspect-square rounded-2xl border-2 border-dashed border-soft-oatmeal flex flex-col items-center justify-center overflow-hidden bg-white/50 relative group shadow-inner">
                {newProduct.image ? (
                  <img src={newProduct.image} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center gap-3 text-warm-sand">
                    <LuImage size={48} className="opacity-20 translate-y-2" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-center px-4">Image Preview</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-deep-espresso/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-white text-xs font-bold px-3 py-1 bg-white/20 backdrop-blur-md rounded-full border border-white/20">Preview updates below</span>
                </div>
              </div>
              
              <div className="w-full space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-warm-sand uppercase tracking-widest flex items-center gap-2 pl-1">
                    <LuImage size={12} /> Image Media
                  </label>
                  {newProduct.image && (
                    <button 
                      type="button"
                      onClick={handleClearImage}
                      className="text-[9px] font-black text-red-400 uppercase tracking-widest hover:text-red-500 transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>
                
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  className="hidden" 
                  accept="image/*"
                />

                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current.click()}
                    className="w-full py-4 px-6 bg-white border-2 border-dashed border-soft-oatmeal hover:border-warm-sand/30 hover:bg-warm-sand/5 text-warm-sand hover:text-deep-espresso rounded-xl transition-all flex items-center justify-center gap-3 shadow-sm group"
                  >
                    <LuImage size={18} className="group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Upload Local File</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Detailed Fields */}
            <div className="lg:col-span-2 p-6 md:p-10 lg:p-12 space-y-8 md:space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Product Name */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-warm-sand uppercase tracking-widest flex items-center gap-2">
                    <LuType size={12} /> Product Name
                  </label>
                  <input 
                    required autoFocus
                    type="text" 
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    className="w-full bg-soft-oatmeal/10 border border-soft-oatmeal rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-warm-sand transition-all"
                    placeholder="e.g. Modern Velvet Sofa"
                  />
                </div>

                {/* Price */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-warm-sand uppercase tracking-widest flex items-center gap-2">
                    <span className="text-lg leading-none">₹</span> Price
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-warm-sand font-bold">₹</span>
                    <input 
                      required
                      type="number" 
                      min="0"
                      value={newProduct.price}
                      onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                      className="w-full bg-soft-oatmeal/10 border border-soft-oatmeal rounded-xl pl-9 pr-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-warm-sand transition-all"
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* Rating */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-warm-sand uppercase tracking-widest flex items-center gap-2">
                    <LuStar size={12} /> Rating (Out of 5)
                  </label>
                  <input 
                    type="number" 
                    min="1" max="5" step="0.1"
                    value={newProduct.rating}
                    onChange={(e) => setNewProduct({ ...newProduct, rating: e.target.value })}
                    className="w-full bg-soft-oatmeal/10 border border-soft-oatmeal rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-warm-sand transition-all"
                  />
                </div>

                {/* Tag Selection */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-warm-sand uppercase tracking-widest flex items-center gap-2">
                    <LuCheck size={12} /> Promotion Tag
                  </label>
                  <select 
                    value={newProduct.tag}
                    onChange={(e) => setNewProduct({ ...newProduct, tag: e.target.value })}
                    className="w-full bg-soft-oatmeal/10 border border-soft-oatmeal rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-warm-sand transition-all cursor-pointer appearance-none"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23C0A483' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1.5em' }}
                  >
                    <option value="Top Choice">Top Choice</option>
                    <option value="Best Seller">Best Seller</option>
                    <option value="Premium">Premium</option>
                    <option value="New Arrival">New Arrival</option>
                    <option value="Trending">Trending</option>
                  </select>
                </div>
              </div>

              <div className="pt-8 flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 border-t border-soft-oatmeal/50">
                <button 
                  type="button"
                  onClick={() => navigate('/admin/manage-featured')}
                  className="px-8 py-4 rounded-xl font-bold text-warm-sand hover:bg-soft-oatmeal/20 transition-all uppercase tracking-widest text-[10px]"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="bg-deep-espresso text-white font-black uppercase tracking-[0.2em] text-[10px] px-10 py-4.5 rounded-2xl hover:bg-dusty-cocoa transition-all shadow-xl shadow-deep-espresso/20 flex items-center justify-center gap-3"
                >
                  <LuCheck size={18} /> Add Featured Item
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </PageWrapper>
  );
};

export default AddFeaturedProductPage;
