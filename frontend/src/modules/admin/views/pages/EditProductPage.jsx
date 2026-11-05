import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageWrapper from '../components/PageWrapper';
import { FiArrowLeft, FiImage, FiSave, FiInfo, FiTag, FiDollarSign, FiType } from 'react-icons/fi';
import { adminCategories } from '../../models/adminCategories';
import { adminProducts } from '../../models/adminProducts';

import DimensionsInput from '../../../../shared/components/DimensionsInput';
const EditProductPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [categories, setCategories] = useState(adminCategories);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    category: '',
    price: '',
    image: '',
    description: '',
    material: '',
    dimensions: '',
  });

  useEffect(() => {
    // Load categories from localStorage
    const savedCats = localStorage.getItem('admin_categories');
    if (savedCats) {
      setCategories(JSON.parse(savedCats));
    }

    // Simulate fetching product data
    const product = adminProducts.find(p => p.id === parseInt(id));
    if (product) {
      setFormData({
        ...formData,
        name: product.name,
        code: product.code,
        category: product.category,
        price: product.price,
        image: product.image,
        description: 'Premium quality architectural grade material sourced from trusted quarries.',
        material: 'Authentic Finish',
        dimensions: 'Standard fitment'
      });
    }
  }, [id]);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simulate API call
    console.log('Product Updated:', formData);
    navigate('/admin/catalog');
  };

  return (
    <PageWrapper>
      <div className="max-w-4xl mx-auto space-y-8">
        <button 
          onClick={() => navigate('/admin/catalog')}
          className="flex items-center gap-2 text-warm-sand font-bold hover:text-deep-espresso transition-colors group"
        >
          <FiArrowLeft className="group-hover:-translate-x-1 transition-transform" />
          Back to Catalog
        </button>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-display font-bold text-deep-espresso">Edit Product</h1>
            <p className="text-warm-sand mt-1">Update specifications for <span className="text-deep-espresso font-bold">{formData.name || 'this item'}</span>.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8 pb-12">
          <div className="bg-white rounded-[32px] border border-soft-oatmeal shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-3">
             {/* Left: Image Preview Area */}
             <div className="p-8 bg-soft-oatmeal/10 border-r border-soft-oatmeal flex flex-col items-center justify-center space-y-4">
                <div className="w-full aspect-square rounded-2xl border-2 border-dashed border-soft-oatmeal flex flex-col items-center justify-center overflow-hidden bg-white/50 relative group">
                   {formData.image ? (
                      <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                   ) : (
                      <div className="flex flex-col items-center gap-2 text-warm-sand">
                         <FiImage size={48} className="opacity-20" />
                         <span className="text-[10px] font-black uppercase tracking-widest">Image Preview</span>
                      </div>
                   )}
                   <div className="absolute inset-0 bg-deep-espresso/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-white text-xs font-bold px-3 py-1 bg-white/20 backdrop-blur-md rounded-full border border-white/20">Change Image URL</span>
                   </div>
                </div>
                <div className="w-full space-y-2">
                   <label className="text-[10px] font-black text-warm-sand uppercase tracking-widest flex items-center gap-2">
                      <FiImage size={12} /> Image URL
                   </label>
                   <input 
                      type="url" 
                      required
                      placeholder="https://example.com/item.jpg"
                      value={formData.image}
                      onChange={(e) => setFormData({...formData, image: e.target.value})}
                      className="w-full bg-white border border-soft-oatmeal rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-warm-sand transition-all"
                   />
                </div>
             </div>

             {/* Right: Detailed Fields */}
             <div className="lg:col-span-2 p-8 md:p-12 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-warm-sand uppercase tracking-widest flex items-center gap-2">
                         <FiType size={12} /> Product Name
                      </label>
                      <input 
                        type="text" required placeholder="Italian White Marble"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full bg-soft-oatmeal/10 border border-soft-oatmeal rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-warm-sand transition-all"
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-warm-sand uppercase tracking-widest flex items-center gap-2">
                         <FiTag size={12} /> Product Code (SKU)
                      </label>
                      <input 
                        type="text" required placeholder="TLE-MAR-012"
                        value={formData.code}
                        onChange={(e) => setFormData({...formData, code: e.target.value})}
                        className="w-full bg-soft-oatmeal/10 border border-soft-oatmeal rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-warm-sand transition-all font-mono"
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-warm-sand uppercase tracking-widest">Category</label>
                      <select 
                        value={formData.category}
                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                        className="w-full bg-soft-oatmeal/10 border border-soft-oatmeal rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-warm-sand transition-all cursor-pointer"
                      >
                         {categories.map(cat => (
                           <option key={cat.id} value={cat.name}>{cat.name}</option>
                         ))}
                      </select>
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-warm-sand uppercase tracking-widest flex items-center gap-2">
                         <FiDollarSign size={12} /> Base Price (₹)
                      </label>
                      <input 
                        type="number" required placeholder="0.00"
                        value={formData.price}
                        onChange={(e) => setFormData({...formData, price: e.target.value})}
                        className="w-full bg-soft-oatmeal/10 border border-soft-oatmeal rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-warm-sand transition-all"
                      />
                   </div>
                </div>

                <div className="space-y-2">
                   <label className="text-[10px] font-black text-warm-sand uppercase tracking-widest flex items-center gap-2">
                      <FiInfo size={12} /> Detailed Description
                   </label>
                   <textarea 
                     rows="4" 
                     placeholder="Enter product description..."
                     value={formData.description}
                     onChange={(e) => setFormData({...formData, description: e.target.value})}
                     className="w-full bg-soft-oatmeal/10 border border-soft-oatmeal rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-warm-sand transition-all resize-none"
                   ></textarea>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-soft-oatmeal/50">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-warm-sand uppercase tracking-widest">Material</label>
                      <input 
                        type="text" placeholder="e.g. Carrara Marble"
                        value={formData.material}
                        onChange={(e) => setFormData({...formData, material: e.target.value})}
                        className="w-full bg-soft-oatmeal/10 border border-soft-oatmeal rounded-xl px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-warm-sand transition-all"
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-warm-sand uppercase tracking-widest">Dimensions</label>
                      <DimensionsInput value={formData.dimensions} onChange={(v) => setFormData(prev => ({ ...prev, dimensions: v }))} categoryText={`${formData.name || ''} ${formData.category || ''}`} />
                   </div>
                </div>

                <div className="pt-6 flex justify-end gap-4">
                   <button 
                     type="button"
                     onClick={() => navigate('/admin/catalog')}
                     className="px-6 py-4 rounded-xl font-bold text-xs uppercase tracking-widest text-dusty-cocoa hover:bg-soft-oatmeal/30 transition-all"
                   >
                      Cancel
                   </button>
                   <button 
                     type="submit"
                     className="bg-deep-espresso text-white font-black uppercase tracking-[0.2em] text-xs px-10 py-4 rounded-xl hover:bg-dusty-cocoa transition-all shadow-xl shadow-deep-espresso/20 flex items-center gap-3"
                   >
                      <FiSave size={16} /> Save Changes
                   </button>
                </div>
             </div>
          </div>
        </form>
      </div>
    </PageWrapper>
  );
};

export default EditProductPage;
