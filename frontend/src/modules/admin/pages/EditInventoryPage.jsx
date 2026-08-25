import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageWrapper from '../components/PageWrapper';
import { LuImage, LuBriefcase, LuTags, LuInfo, LuArrowLeft, LuPackage, LuCheck, LuClock, LuUpload, LuGrid2X2, LuVideo, LuX } from 'react-icons/lu';
import { FiPackage, FiTrash2, FiPlus } from 'react-icons/fi';
import api from '../../../shared/utils/api';

const EditInventoryPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [videoFile, setVideoFile] = useState(null);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  
  // Custom Dropdown State
  const [isCatOpen, setIsCatOpen] = useState(false);
  const [catSearch, setCatSearch] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    hsnCode: '',
    category: '',
    brand: '',
    price: '',
    images: [],
    videoUrl: '',
    description: '',
    material: '',
    dimensions: '',
    countInStock: 0,
    unit: 'piece',
    unitValue: '1',
    maxB2CQty: '',
    adminCommission: 0,
    sellerPrice: 0,
    discountPrice: 0,
    dynamicAttributes: {},
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [prodRes, catRes, brandRes] = await Promise.all([
          api.get(`/products/${id}`),
          api.get('/categories'),
          api.get('/brands')
        ]);
        
        const product = prodRes.data.data;
        setCategories(catRes.data.data || []);
        setBrands(brandRes.data.data || []);
        
        setFormData({
          name: product.name || '',
          sku: product.sku || '',
          hsnCode: product.hsnCode || '',
          category: product.category || '',
          brand: product.brand || '',
          price: product.price || '',
          images: product.images || [],
          videoUrl: product.videoUrl || '',
          description: product.description || '',
          material: product.material || '',
          dimensions: product.dimensions || '',
          countInStock: product.countInStock || 0,
          unit: product.unit || 'piece',
          unitValue: product.unitValue || '1',
          maxB2CQty: product.maxB2CQty || '',
          adminCommission: product.adminCommission || 0,
          sellerPrice: product.sellerPrice || product.price || 0,
          discountPrice: product.discountPrice || 0,
          dynamicAttributes: product.dynamicAttributes || {},
        });
      } catch (err) {
        console.error('Failed to fetch data:', err);
        alert('Could not load product data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const filteredCategories = categories.filter(cat => 
    cat.name.toLowerCase().includes(catSearch.toLowerCase())
  );

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, images: [...prev.images, reader.result] }));
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);

      let finalVideoUrl = formData.videoUrl;

      if (videoFile) {
        const videoData = new FormData();
        videoData.append('image', videoFile);
        const { data: uploadRes } = await api.post('/upload', videoData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        finalVideoUrl = uploadRes.url;
      }

      const payload = {
        ...formData,
        price: Number(formData.price),
        countInStock: Number(formData.countInStock),
        maxB2CQty: formData.maxB2CQty !== '' ? Number(formData.maxB2CQty) : undefined,
        videoUrl: finalVideoUrl
      };

      await api.put(`/products/${id}`, payload);
      navigate('/admin/inventory');
    } catch (err) {
      console.error('Failed to update product:', err);
      alert('Error updating product.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <PageWrapper>
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <div className="w-12 h-12 border-4 border-soft-oatmeal border-t-red-800 rounded-full animate-spin" />
        <p className="text-xs font-black uppercase tracking-widest text-warm-sand">Fetching Product Details...</p>
      </div>
    </PageWrapper>
  );

  return (
    <PageWrapper>
      <div className="max-w-4xl mx-auto space-y-6 pb-12">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => navigate('/admin/inventory')}
            className="flex items-center gap-2 text-warm-sand hover:text-deep-espresso transition-colors font-bold text-xs uppercase tracking-widest"
          >
            <LuArrowLeft size={18} /> Back to Inventory
          </button>
          <h1 className="text-2xl font-display font-bold text-deep-espresso">Edit Product</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Image Section */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white rounded-3xl p-6 border border-soft-oatmeal shadow-sm h-fit space-y-6">
                <label className="text-[10px] font-black text-warm-sand uppercase tracking-widest block text-center">Product Media</label>
                
                <div className="grid grid-cols-2 gap-3">
                   {formData.images.map((img, idx) => (
                     <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-soft-oatmeal group">
                        <img src={img} alt="" className="w-full h-full object-cover" />
                        <button 
                          type="button" onClick={() => removeImage(idx)}
                          className="absolute inset-0 bg-red-500/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all text-white"
                        >
                           <FiTrash2 size={16} />
                        </button>
                     </div>
                   ))}
                   {formData.images.length < 5 && (
                     <div 
                       onClick={() => fileInputRef.current.click()}
                       className="aspect-square bg-soft-oatmeal/10 rounded-xl border-2 border-dashed border-soft-oatmeal flex flex-col items-center justify-center text-warm-sand hover:border-warm-sand hover:text-deep-espresso transition-all cursor-pointer group"
                     >
                        <FiPlus size={20} className="opacity-40 group-hover:opacity-100" />
                        <span className="text-[8px] font-black uppercase tracking-widest mt-1">Add Image</span>
                     </div>
                   )}
                </div>
                <input 
                  type="file" multiple hidden ref={fileInputRef} 
                  onChange={handleFileChange} accept="image/*"
                />

                <div className="space-y-4 pt-4 border-t border-soft-oatmeal/30">
                   <div className="space-y-2">
                      <div className="flex items-center justify-between">
                         <label className="text-[10px] font-black text-warm-sand uppercase tracking-widest flex items-center gap-2">
                            <LuVideo size={12} /> Product Video
                         </label>
                         <input 
                           type="file" id="edit-inv-video-upload" hidden accept="video/*"
                           onChange={(e) => setVideoFile(e.target.files[0])}
                         />
                         <label htmlFor="edit-inv-video-upload" className="text-[10px] font-black text-deep-espresso uppercase tracking-widest hover:underline cursor-pointer">
                            {videoFile ? 'Change Video' : 'Upload File'}
                         </label>
                      </div>
                      <input 
                         type="url" 
                         placeholder="or YouTube Link"
                         value={formData.videoUrl}
                         onChange={(e) => setFormData({...formData, videoUrl: e.target.value})}
                         className="w-full bg-soft-oatmeal/10 border border-soft-oatmeal rounded-xl px-4 py-3 text-[10px] focus:outline-none"
                      />
                      {videoFile && (
                        <div className="flex items-center justify-between p-2 bg-green-50 border border-green-100 rounded-lg">
                           <span className="text-[9px] font-bold text-green-700 truncate max-w-[150px]">{videoFile.name}</span>
                           <button onClick={() => setVideoFile(null)} className="text-green-700 hover:text-red-500 transition-colors">
                              <LuX size={12} />
                           </button>
                        </div>
                      )}
                   </div>
                </div>
              </div>
            </div>

            {/* Form Section */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-3xl p-8 border border-soft-oatmeal shadow-sm space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-warm-sand uppercase tracking-widest flex items-center gap-2">
                       <LuBriefcase size={12} /> Product Name
                    </label>
                    <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-soft-oatmeal/10 border border-soft-oatmeal rounded-xl px-4 py-3 text-sm focus:outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-warm-sand uppercase tracking-widest flex items-center gap-2">
                       <LuPackage size={12} /> SKU Code
                    </label>
                    <input type="text" required value={formData.sku} onChange={(e) => setFormData({...formData, sku: e.target.value})} className="w-full bg-soft-oatmeal/10 border border-soft-oatmeal rounded-xl px-4 py-3 text-sm focus:outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-warm-sand uppercase tracking-widest flex items-center gap-2">
                       <LuPackage size={12} /> HSN Code
                    </label>
                    <input type="text" required placeholder="e.g. 6802" value={formData.hsnCode} onChange={(e) => setFormData({...formData, hsnCode: e.target.value})} className="w-full bg-soft-oatmeal/10 border border-soft-oatmeal rounded-xl px-4 py-3 text-sm focus:outline-none" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-warm-sand uppercase tracking-widest flex items-center gap-2">
                       <LuGrid2X2 size={12} /> Category
                    </label>
                    <div className="relative group">
                       <input 
                         type="text"
                         placeholder={formData.category || "Search or select category..."}
                         value={catSearch}
                         onChange={(e) => {
                            setCatSearch(e.target.value);
                            setIsCatOpen(true);
                         }}
                         onFocus={() => setIsCatOpen(true)}
                         className="w-full bg-soft-oatmeal/10 border border-soft-oatmeal rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-warm-sand transition-all"
                       />
                       {isCatOpen && (
                         <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-soft-oatmeal rounded-2xl shadow-2xl z-[50] overflow-hidden max-h-64 overflow-y-auto">
                            {filteredCategories.map(cat => (
                              <button
                                key={cat._id}
                                type="button"
                                onClick={() => {
                                  setFormData({...formData, category: cat.name});
                                  setIsCatOpen(false);
                                }}
                                className="w-full text-left px-5 py-3.5 text-sm font-medium hover:bg-soft-oatmeal/30"
                              >
                                {cat.name}
                              </button>
                            ))}
                         </div>
                       )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-warm-sand uppercase tracking-widest flex items-center gap-2">
                       <LuTags size={12} /> Brand
                    </label>
                    <select 
                      value={formData.brand} 
                      onChange={(e) => setFormData({...formData, brand: e.target.value})} 
                      className="w-full bg-soft-oatmeal/10 border border-soft-oatmeal rounded-xl px-4 py-3 text-sm focus:outline-none"
                    >
                       <option value="">Select Brand</option>
                       {brands.map(brand => <option key={brand._id} value={brand._id}>{brand.name}</option>)}
                    </select>
                  </div>
                </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-warm-sand uppercase tracking-widest">Seller Price (₹)</label>
                      <input 
                        type="number" 
                        value={formData.sellerPrice} 
                        onChange={(e) => {
                          const sPrice = Number(e.target.value);
                          setFormData({
                            ...formData, 
                            sellerPrice: sPrice,
                            price: Math.round(sPrice * (1 + formData.adminCommission / 100))
                          });
                        }} 
                        className="w-full bg-soft-oatmeal/10 border border-soft-oatmeal rounded-xl px-4 py-3 text-sm focus:outline-none font-bold text-brand-teal" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Admin Commission (%)</label>
                      <input 
                        type="number" 
                        value={formData.adminCommission} 
                        onChange={(e) => {
                          const comm = Number(e.target.value);
                          setFormData({
                            ...formData, 
                            adminCommission: comm,
                            price: Math.round(formData.sellerPrice * (1 + comm / 100))
                          });
                        }} 
                        className="w-full bg-emerald-50/50 border border-emerald-100 rounded-xl px-4 py-3 text-sm focus:outline-none font-bold text-emerald-600" 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-warm-sand uppercase tracking-widest">Final Consumer Price (₹)</label>
                      <input 
                        type="number" 
                        readOnly
                        value={formData.price} 
                        className="w-full bg-[#240046]/5 border border-[#240046]/10 rounded-xl px-4 py-3 text-sm focus:outline-none font-black text-[#240046]" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-rose-500 uppercase tracking-widest flex items-center gap-2">
                        Discount Price (₹) <span className="opacity-50 lowercase font-normal italic">(optional)</span>
                      </label>
                      <input 
                        type="number" 
                        placeholder="Leave 0 if no discount"
                        value={formData.discountPrice} 
                        onChange={(e) => setFormData({...formData, discountPrice: Number(e.target.value)})} 
                        className="w-full bg-rose-50/30 border border-rose-100 rounded-xl px-4 py-3 text-sm focus:outline-none font-bold text-rose-600" 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-warm-sand uppercase tracking-widest">Stock Management</label>
                      <input type="number" required value={formData.countInStock} onChange={(e) => setFormData({...formData, countInStock: e.target.value})} className="w-full bg-soft-oatmeal/10 border border-soft-oatmeal rounded-xl px-4 py-3 text-sm focus:outline-none" />
                    </div>
                    <div className="space-y-2" />
                  </div>

                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-warm-sand uppercase tracking-widest">Unit Type</label>
                      <select 
                        value={formData.unit}
                        onChange={(e) => setFormData({...formData, unit: e.target.value})}
                        className="w-full bg-soft-oatmeal/10 border border-soft-oatmeal rounded-xl px-4 py-3 text-sm focus:outline-none appearance-none cursor-pointer"
                      >
                         <option value="piece">Piece (Pcs)</option>
                         <option value="kg">Kilogram (Kg)</option>
                         <option value="ltr">Litre (Ltr)</option>
                         <option value="watt">Watt (W)</option>
                         <option value="mtr">Meter (m)</option>
                         <option value="box">Box</option>
                         <option value="pack">Pack</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-warm-sand uppercase tracking-widest">Unit Value</label>
                      <input 
                        type="text"
                        value={formData.unitValue}
                        onChange={(e) => setFormData({...formData, unitValue: e.target.value})}
                        className="w-full bg-soft-oatmeal/10 border border-soft-oatmeal rounded-xl px-4 py-3 text-sm focus:outline-none"
                      />
                    </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-warm-sand uppercase tracking-widest">Max Qty per B2C Order</label>
                  <input
                    type="number"
                    placeholder="Unlimited"
                    value={formData.maxB2CQty}
                    onChange={(e) => setFormData({...formData, maxB2CQty: e.target.value})}
                    className="w-full bg-soft-oatmeal/10 border border-soft-oatmeal rounded-xl px-4 py-3 text-sm focus:outline-none"
                  />
                  <p className="text-[9px] text-warm-sand/70 font-medium">Customers wanting more than this must submit a Bulk Order Request.</p>
                </div>

                {/* Dynamic Specifications */}
                {formData.dynamicAttributes && Object.keys(formData.dynamicAttributes).length > 0 && (
                  <div className="space-y-4 pt-4 border-t border-soft-oatmeal/30">
                    <h3 className="text-xs font-black text-warm-sand uppercase tracking-widest">Specifications</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(formData.dynamicAttributes).map(([key, val]) => (
                        <div key={key} className="space-y-2">
                          <label className="text-[10px] font-bold text-warm-sand uppercase tracking-wider">{key}</label>
                          <input 
                            type="text" 
                            value={val || ''} 
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              dynamicAttributes: {
                                ...prev.dynamicAttributes,
                                [key]: e.target.value
                              }
                            }))} 
                            className="w-full bg-soft-oatmeal/10 border border-soft-oatmeal rounded-xl px-4 py-3 text-sm focus:outline-none" 
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-warm-sand uppercase tracking-widest">Description</label>
                  <textarea rows={4} required value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full bg-soft-oatmeal/10 border border-soft-oatmeal rounded-xl px-4 py-3 text-sm focus:outline-none resize-none" />
                </div>

                <div className="flex justify-end pt-6">
                  <button disabled={saving} type="submit" className="bg-deep-espresso hover:bg-black text-white px-10 py-4 rounded-2xl font-bold flex items-center gap-2 transition-all disabled:opacity-50 shadow-xl shadow-black/10 uppercase tracking-widest text-xs">
                    {saving ? 'UPDATING...' : 'SAVE CHANGES'}
                  </button>
                </div>
              </div>
            </div>

          </div>
        </form>
      </div>
    </PageWrapper>
  );
};

export default EditInventoryPage;
