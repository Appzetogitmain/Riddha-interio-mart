import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageWrapper from '../components/PageWrapper';
import { FiArrowLeft, FiImage, FiVideo, FiSave, FiInfo, FiTag, FiDollarSign, FiType, FiUser, FiPackage, FiTrash2, FiPlus, FiX } from 'react-icons/fi';
import api from '../../../shared/utils/api';

const EditProductPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [videoFile, setVideoFile] = useState(null);
  
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
    description: '',
    material: '',
    dimensions: '',
    stock: 50,
    unit: 'piece',
    unitValue: '1',
    images: [],
    videoUrl: '',
    targetCustomer: 'both',
    gstRate: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [prodRes, catRes, brandRes] = await Promise.all([
          api.get(`/catalog/${id}`),
          api.get('/categories'),
          api.get('/brands')
        ]);
        
        const product = prodRes.data.data;
        const fetchedCategories = catRes.data.data || [];
        const fetchedBrands = brandRes.data.data || [];

        setCategories(fetchedCategories);
        setBrands(fetchedBrands);
        
        setFormData({
          name: product.name || '',
          sku: product.sku || '',
          hsnCode: product.hsnCode || '',
          category: product.category || '',
          brand: product.brand || '',
          price: product.price || '',
          description: product.description || '',
          material: product.material || '',
          dimensions: product.dimensions || '',
          stock: product.stock || 0,
          unit: product.unit || 'piece',
          unitValue: product.unitValue || '1',
          images: product.images || [],
          videoUrl: product.videoUrl || '',
          targetCustomer: product.targetCustomer || 'both',
          gstRate: product.gstRate !== undefined ? String(product.gstRate) : ''
        });

      } catch (err) {
        console.error('Failed to fetch product details:', err);
        setStatusMessage('Failed to load product details.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const filteredCategories = categories.filter(cat => 
    cat.name.toLowerCase().includes(catSearch.toLowerCase())
  );

  const fileInputRef = React.useRef(null);

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

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setStatusMessage('');

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
        stock: Number(formData.stock),
        images: formData.images,
        videoUrl: finalVideoUrl,
        gstRate: formData.gstRate !== '' ? Number(formData.gstRate) : undefined
      };

      await api.put(`/catalog/${id}`, payload);
      navigate('/admin/catalog');
    } catch (err) {
      console.error('Failed to update product:', err);
      setStatusMessage(err.response?.data?.error || 'Failed to update product');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
     return (
        <PageWrapper>
           <div className="flex flex-col items-center justify-center py-40 animate-pulse">
              <div className="w-16 h-16 border-4 border-soft-oatmeal border-t-red-800 rounded-full animate-spin mb-4" />
              <p className="text-xs font-black uppercase tracking-[0.3em] text-warm-sand">Opening Blueprint...</p>
           </div>
        </PageWrapper>
     );
  }

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
          {statusMessage && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-xl text-xs font-bold">
               {statusMessage}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-8 pb-12">
          <div className="bg-white rounded-[32px] border border-soft-oatmeal shadow-xl grid grid-cols-1 lg:grid-cols-3 relative">
             {/* Left: Image Preview Area */}
             <div className="p-8 bg-soft-oatmeal/10 border-r border-soft-oatmeal space-y-6">
                <input 
                  type="file" 
                  multiple
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept="image/*" 
                  className="hidden" 
                />
                
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
                       onClick={triggerFileInput}
                       className="aspect-square bg-white rounded-xl border-2 border-dashed border-soft-oatmeal flex flex-col items-center justify-center text-warm-sand hover:border-warm-sand hover:text-deep-espresso transition-all cursor-pointer group"
                     >
                        <FiPlus size={20} className="opacity-40 group-hover:opacity-100" />
                        <span className="text-[8px] font-black uppercase tracking-widest mt-1">Add Image</span>
                     </div>
                   )}
                </div>

                 <div className="space-y-4 pt-4 border-t border-soft-oatmeal/30">
                    <div className="space-y-2">
                       <div className="flex items-center justify-between">
                          <label className="text-[10px] font-black text-warm-sand uppercase tracking-widest flex items-center gap-2">
                             <FiVideo size={12} /> Product Video
                          </label>
                          <input 
                            type="file" id="edit-video-upload" hidden accept="video/*"
                            onChange={(e) => setVideoFile(e.target.files[0])}
                          />
                          <label htmlFor="edit-video-upload" className="text-[10px] font-black text-deep-espresso uppercase tracking-widest hover:underline cursor-pointer">
                             {videoFile ? 'Change Video' : 'Upload File'}
                          </label>
                       </div>
                       <input 
                          type="url" 
                          placeholder="or YouTube Link"
                          value={formData.videoUrl}
                          onChange={(e) => setFormData({...formData, videoUrl: e.target.value})}
                          className="w-full bg-white border border-soft-oatmeal rounded-xl px-4 py-3 text-[10px] focus:outline-none focus:ring-2 focus:ring-warm-sand transition-all"
                       />
                       {videoFile && (
                         <div className="flex items-center justify-between p-2 bg-green-50 border border-green-100 rounded-lg">
                            <span className="text-[9px] font-bold text-green-700 truncate max-w-[150px]">{videoFile.name}</span>
                            <button onClick={() => setVideoFile(null)} className="text-green-700 hover:text-red-500 transition-colors">
                               <FiX size={12} />
                            </button>
                         </div>
                       )}
                    </div>
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
                        className="w-full bg-soft-oatmeal/10 border border-soft-oatmeal rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-warm-sand transition-all font-medium"
                      />
                   </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-warm-sand uppercase tracking-widest flex items-center gap-2">
                          <FiTag size={12} /> Product Code (SKU)
                       </label>
                       <input 
                         type="text" required placeholder="TLE-MAR-012"
                         value={formData.sku}
                         onChange={(e) => setFormData({...formData, sku: e.target.value})}
                         className="w-full bg-soft-oatmeal/10 border border-soft-oatmeal rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-warm-sand transition-all font-mono"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-warm-sand uppercase tracking-widest flex items-center gap-2">
                          <FiTag size={12} /> HSN Code
                       </label>
                       <input 
                         type="text" required placeholder="e.g. 6802"
                         value={formData.hsnCode}
                         onChange={(e) => setFormData({...formData, hsnCode: e.target.value})}
                         className="w-full bg-soft-oatmeal/10 border border-soft-oatmeal rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-warm-sand transition-all font-medium"
                       />
                    </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-warm-sand uppercase tracking-widest flex items-center gap-2">
                         <FiTag size={12} /> Brand Partner
                      </label>
                      <select 
                        required
                        value={formData.brand}
                        onChange={(e) => setFormData({...formData, brand: e.target.value})}
                        className="w-full bg-soft-oatmeal/10 border border-soft-oatmeal rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-warm-sand transition-all cursor-pointer font-medium"
                      >
                         <option value="">{brands.length > 0 ? 'Select associated brand' : 'No brands found'}</option>
                         {brands.map(b => (
                           <option key={b._id} value={b._id}>{b.name}</option>
                         ))}
                      </select>
                   </div>
                    <div className="space-y-2 relative">
                       <label className="text-[10px] font-black text-warm-sand uppercase tracking-widest">Category</label>
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
                            className={`w-full bg-soft-oatmeal/10 border border-soft-oatmeal rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-warm-sand transition-all font-medium ${
                               formData.category ? 'placeholder:text-slate-900 placeholder:opacity-100 placeholder:font-semibold' : 'placeholder:text-slate-400'
                             }`}
                          />
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-warm-sand">
                             <FiTag size={14} className={isCatOpen ? 'rotate-180 transition-transform' : 'transition-transform'} />
                          </div>

                          {isCatOpen && (
                            <>
                               <div 
                                 className="fixed inset-0 z-[40]" 
                                 onClick={() => {
                                    setIsCatOpen(false);
                                    setCatSearch('');
                                 }}
                               />
                               <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-soft-oatmeal rounded-2xl shadow-2xl z-[50] overflow-hidden max-h-64 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
                                  {filteredCategories.length > 0 ? (
                                    filteredCategories.map(cat => (
                                      <button
                                        key={cat._id}
                                        type="button"
                                        onClick={() => {
                                          setFormData({...formData, category: cat.name});
                                          setCatSearch('');
                                          setIsCatOpen(false);
                                        }}
                                        className="w-full text-left px-5 py-3.5 text-sm font-medium hover:bg-soft-oatmeal/30 transition-colors border-b border-soft-oatmeal/10 last:border-0 flex items-center justify-between group"
                                      >
                                        <span className={formData.category === cat.name ? "text-red-800 font-bold" : "text-deep-espresso"}>
                                          {cat.name}
                                        </span>
                                        {formData.category === cat.name && (
                                          <div className="w-1.5 h-1.5 bg-red-800 rounded-full" />
                                        )}
                                      </button>
                                    ))
                                  ) : (
                                    <div className="px-5 py-4 text-xs font-bold text-warm-sand uppercase tracking-widest text-center italic">
                                      No categories found
                                    </div>
                                  )}
                                </div>
                            </>
                          )}
                       </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-warm-sand uppercase tracking-widest flex items-center gap-2">
                            <FiUser size={12} /> Target Audience
                         </label>
                         <select 
                           required
                           value={formData.targetCustomer}
                           onChange={(e) => setFormData({...formData, targetCustomer: e.target.value})}
                           className="w-full bg-soft-oatmeal/10 border border-soft-oatmeal rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-warm-sand transition-all cursor-pointer font-medium"
                         >
                            <option value="individual">Individual Customers</option>
                            <option value="enterpriser">Enterprisers Only</option>
                            <option value="both">Both (Public)</option>
                         </select>
                      </div>

                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-warm-sand uppercase tracking-widest flex items-center gap-2">
                            <FiTag size={12} /> GST Rate Override
                         </label>
                         <select 
                           value={formData.gstRate}
                           onChange={(e) => setFormData({...formData, gstRate: e.target.value})}
                           className="w-full bg-soft-oatmeal/10 border border-soft-oatmeal rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-warm-sand transition-all cursor-pointer font-medium"
                         >
                            <option value="">Inherit Category Default</option>
                            <option value="0">0% (GST Exempt)</option>
                            <option value="5">5% GST</option>
                            <option value="12">12% GST</option>
                            <option value="18">18% GST</option>
                            <option value="28">28% GST</option>
                         </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                         <label className="text-[10px] font-black text-warm-sand uppercase tracking-widest flex items-center gap-2">
                            <FiDollarSign size={12} /> Price (₹)
                         </label>
                         <input 
                           type="number" required placeholder="0.00"
                           value={formData.price}
                           onChange={(e) => setFormData({...formData, price: e.target.value})}
                           className="w-full bg-soft-oatmeal/10 border border-soft-oatmeal rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-warm-sand transition-all font-medium"
                         />
                       </div>
                       <div className="space-y-2">
                         <label className="text-[10px] font-black text-warm-sand uppercase tracking-widest flex items-center gap-2">
                            <FiPackage size={12} /> Stock
                         </label>
                         <input 
                           type="number" required
                           value={formData.stock}
                           onChange={(e) => setFormData({...formData, stock: e.target.value})}
                           className="w-full bg-soft-oatmeal/10 border border-soft-oatmeal rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-warm-sand transition-all font-medium"
                         />
                       </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                         <label className="text-[10px] font-black text-warm-sand uppercase tracking-widest">Unit</label>
                         <select 
                           value={formData.unit} onChange={(e) => setFormData({...formData, unit: e.target.value})}
                           className="w-full bg-soft-oatmeal/10 border border-soft-oatmeal rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-warm-sand transition-all cursor-pointer font-medium"
                         >
                            <option value="piece">Piece (Pcs)</option>
                            <option value="kg">Kilogram (Kg)</option>
                            <option value="gm">Gram (g)</option>
                            <option value="ml">Millilitre (ml)</option>
                            <option value="ltr">Litre (Ltr)</option>
                            <option value="watt">Watt (W)</option>
                            <option value="mtr">Meter (m)</option>
                            <option value="ft">Feet (ft)</option>
                            <option value="sqft">Sq. Ft.</option>
                            <option value="box">Box</option>
                            <option value="bundle">Bundle</option>
                            <option value="pack">Pack</option>
                         </select>
                       </div>
                       <div className="space-y-2">
                         <label className="text-[10px] font-black text-warm-sand uppercase tracking-widest">Unit Value (Qty)</label>
                         <input 
                           type="text" placeholder="e.g. 5 or 50"
                           value={formData.unitValue} onChange={(e) => setFormData({...formData, unitValue: e.target.value})}
                           className="w-full bg-soft-oatmeal/10 border border-soft-oatmeal rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-warm-sand transition-all font-medium"
                         />
                       </div>
                    </div>
                </div>

                <div className="space-y-2">
                   <label className="text-[10px] font-black text-warm-sand uppercase tracking-widest flex items-center gap-2">
                      <FiInfo size={12} /> Detailed Description
                   </label>
                   <textarea 
                     rows="4" required
                     placeholder="Enter product description..."
                     value={formData.description}
                     onChange={(e) => setFormData({...formData, description: e.target.value})}
                     className="w-full bg-soft-oatmeal/10 border border-soft-oatmeal rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-warm-sand transition-all resize-none font-medium"
                   ></textarea>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-soft-oatmeal/50">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-warm-sand uppercase tracking-widest">Material</label>
                      <input 
                        type="text" placeholder="e.g. Carrara Marble"
                        value={formData.material}
                        onChange={(e) => setFormData({...formData, material: e.target.value})}
                        className="w-full bg-soft-oatmeal/10 border border-soft-oatmeal rounded-xl px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-warm-sand transition-all font-medium"
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-warm-sand uppercase tracking-widest">Dimensions</label>
                      <input 
                        type="text" placeholder="e.g. 60x60x2 cm"
                        value={formData.dimensions}
                        onChange={(e) => setFormData({...formData, dimensions: e.target.value})}
                        className="w-full bg-soft-oatmeal/10 border border-soft-oatmeal rounded-xl px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-warm-sand transition-all font-medium"
                      />
                   </div>
                </div>

                <div className="pt-6 flex justify-end gap-4">
                   <button 
                     type="button"
                     onClick={() => navigate('/admin/catalog')}
                     disabled={submitting}
                     className="px-6 py-4 rounded-xl font-bold text-[10px] uppercase tracking-widest text-dusty-cocoa hover:bg-soft-oatmeal/30 transition-all disabled:opacity-50"
                   >
                      Cancel
                   </button>
                   <button 
                     type="submit"
                     disabled={submitting}
                     className={`bg-deep-espresso text-white font-black uppercase tracking-[0.2em] text-[10px] px-10 py-4.5 rounded-2xl transition-all shadow-xl shadow-deep-espresso/20 flex items-center gap-3 ${submitting ? 'opacity-70 cursor-not-allowed' : 'hover:bg-dusty-cocoa active:scale-95'}`}
                   >
                      {submitting ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <FiSave size={16} />
                      )}
                      {submitting ? 'Saving...' : 'Save Changes'}
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
