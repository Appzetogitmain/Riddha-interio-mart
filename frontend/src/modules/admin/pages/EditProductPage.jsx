import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageWrapper from '../components/PageWrapper';
import { FiArrowLeft, FiImage, FiVideo, FiSave, FiInfo, FiTag, FiDollarSign, FiType, FiUser, FiPackage, FiTrash2, FiPlus, FiX, FiCamera } from 'react-icons/fi';
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
    b2bPrice: '',
    b2bMinQty: '',
    description: '',
    material: '',
    dimensions: '',
    thickness: '',
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
          b2bPrice: product.b2bPrice || '',
          b2bMinQty: product.b2bMinQty || '',
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
  const cameraInputRef = React.useRef(null);

  const handleRemoveBg = async (index) => {
    const originalSrc = formData.images[index];
    if (!originalSrc) return;

    // Set loading state for this specific index
    setFormData((prev) => {
      const updated = [...prev.images];
      updated[index] = { loading: true, originalSrc };
      return { ...prev, images: updated };
    });

    try {
      // Convert image source to File Blob
      const response = await fetch(originalSrc);
      const blob = await response.blob();
      const file = new File([blob], `image_${index}.jpg`, { type: blob.type || "image/jpeg" });

      const uploadData = new FormData();
      uploadData.append("images", file);

      // Call bulk upload with removeBg=true
      const { data: uploadRes } = await api.post("/upload/bulk?removeBg=true", uploadData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (uploadRes.success && uploadRes.images && uploadRes.images.length > 0) {
        const cloudinaryUrl = uploadRes.images[0];
        
        // Remove the original base64 file from imgFiles so it isn't uploaded again on submit
        if (originalSrc.startsWith("data:")) {
          const base64IndexBefore = formData.images
            .slice(0, index)
            .filter((img) => img && typeof img === "string" && img.startsWith("data:")).length;
          setImgFiles((prev) => prev.filter((_, i) => i !== base64IndexBefore));
        }

        setFormData((prev) => {
          const updated = [...prev.images];
          updated[index] = cloudinaryUrl;
          return { ...prev, images: updated };
        });
      } else {
        throw new Error("Failed to remove background");
      }
    } catch (err) {
      console.error("Background removal failed:", err);
      setStatusMessage("Failed to remove background.");
      // Revert back to original image
      setFormData((prev) => {
        const updated = [...prev.images];
        updated[index] = originalSrc;
        return { ...prev, images: updated };
      });
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setImgFiles(prev => [...prev, ...files]);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, images: [...prev.images, reader.result] }));
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    const removedSrc = formData.images[index];
    if (removedSrc && typeof removedSrc === "string" && removedSrc.startsWith("data:")) {
      const base64IndexBefore = formData.images
        .slice(0, index)
        .filter((img) => img && typeof img === "string" && img.startsWith("data:")).length;
      setImgFiles((prev) => prev.filter((_, i) => i !== base64IndexBefore));
    }
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const handleCameraCapture = async () => {
    if (formData.images.length >= 5) {
      setStatusMessage("Max 5 images allowed");
      return;
    }
    // 1. Try Flutter openCamera handler
    if (window.flutter_inappwebview && typeof window.flutter_inappwebview.callHandler === 'function') {
      try {
        const result = await window.flutter_inappwebview.callHandler('openCamera');
        if (result && result.success && result.base64) {
          const prefix = result.mimeType ? `data:${result.mimeType};base64,` : 'data:image/jpeg;base64,';
          const dataUrl = result.base64.startsWith('data:') ? result.base64 : `${prefix}${result.base64}`;
          
          // Convert base64 to File object
          const response = await fetch(dataUrl);
          const blob = await response.blob();
          const file = new File([blob], result.fileName || `camera_${Date.now()}.jpg`, { type: result.mimeType || 'image/jpeg' });
          
          setImgFiles(prev => [...prev, file]);
          setFormData(prev => ({ ...prev, images: [...prev.images, dataUrl] }));
          return;
        }
      } catch (err) {
        console.error("Flutter openCamera handler error:", err);
      }
    }
    
    // 2. Fallback to HTML5 capture input
    if (cameraInputRef.current) {
      cameraInputRef.current.click();
    }
  };

  const handleCameraFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    if (formData.images.length >= 5) {
      setStatusMessage("Max 5 images allowed");
      return;
    }

    setImgFiles(prev => [...prev, ...files]);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, images: [...prev.images, reader.result] }));
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
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
        b2bPrice: formData.b2bPrice !== '' ? Number(formData.b2bPrice) : undefined,
        b2bMinQty: formData.b2bMinQty !== '' ? Number(formData.b2bMinQty) : undefined,
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
                    {formData.images.map((img, idx) => {
                      const isLoading = img && typeof img === 'object' && img.loading;
                      const src = isLoading ? '' : img;
                      return (
                        <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-soft-oatmeal group">
                          {isLoading ? (
                            <div className="w-full h-full bg-soft-oatmeal/20 flex flex-col items-center justify-center gap-2">
                              <div className="w-6 h-6 border-2 border-warm-sand border-t-transparent rounded-full animate-spin" />
                              <span className="text-[8px] font-black text-warm-sand uppercase tracking-widest text-center">Removing BG...</span>
                            </div>
                          ) : (
                             <>
                               <img src={src} alt="" className="w-full h-full object-cover" />
                               <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2 z-10">
                                 <div className="flex justify-end">
                                   <button 
                                     type="button" 
                                     onClick={() => removeImage(idx)}
                                     className="p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors shadow-md"
                                   >
                                      <FiTrash2 size={12} />
                                   </button>
                                 </div>
                                 <div className="flex justify-center pb-1">
                                   <button
                                     type="button"
                                     onClick={() => handleRemoveBg(idx)}
                                     className="bg-brand-teal hover:bg-brand-teal/90 text-white text-[8px] font-black px-2 py-1 rounded shadow-md transition-all uppercase tracking-wider whitespace-nowrap"
                                   >
                                     Remove BG
                                   </button>
                                 </div>
                               </div>
                             </>
                          )}
                        </div>
                      );
                    })}
                    {formData.images.length < 5 && (
                      <>
                        <div 
                          onClick={triggerFileInput}
                          className="aspect-square bg-white rounded-xl border-2 border-dashed border-soft-oatmeal flex flex-col items-center justify-center text-warm-sand hover:border-warm-sand hover:text-deep-espresso transition-all cursor-pointer group"
                        >
                           <FiPlus size={20} className="opacity-40 group-hover:opacity-100" />
                           <span className="text-[8px] font-black uppercase tracking-widest mt-1">Upload File</span>
                        </div>
                        <div 
                          onClick={handleCameraCapture}
                          className="aspect-square bg-white rounded-xl border-2 border-dashed border-soft-oatmeal flex flex-col items-center justify-center text-warm-sand hover:border-warm-sand hover:text-deep-espresso transition-all cursor-pointer group"
                        >
                           <FiCamera size={20} className="opacity-40 group-hover:opacity-100" />
                           <span className="text-[8px] font-black uppercase tracking-widest mt-1">Take Photo</span>
                        </div>
                      </>
                    )}
                 </div>
                 <input 
                   type="file" 
                   accept="image/*" 
                   capture="environment"
                   hidden
                   ref={cameraInputRef}
                   onChange={handleCameraFileChange}
                 />

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
                    
                    {/* B2B Pricing Section */}
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                         <label className="text-[10px] font-black text-warm-sand uppercase tracking-widest flex items-center gap-2 text-deep-espresso">
                            <FiDollarSign size={12} /> B2B Price (₹)
                         </label>
                         <input 
                           type="number" placeholder="Optional"
                           value={formData.b2bPrice}
                           onChange={(e) => setFormData({...formData, b2bPrice: e.target.value})}
                           className="w-full bg-soft-oatmeal/10 border border-soft-oatmeal rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-warm-sand transition-all font-medium"
                         />
                       </div>
                       <div className="space-y-2">
                         <label className="text-[10px] font-black text-warm-sand uppercase tracking-widest flex items-center gap-2 text-deep-espresso">
                            <FiPackage size={12} /> B2B Min Qty
                         </label>
                         <input 
                           type="number" placeholder="Default from Settings"
                           value={formData.b2bMinQty}
                           onChange={(e) => setFormData({...formData, b2bMinQty: e.target.value})}
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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-soft-oatmeal/50">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-warm-sand uppercase tracking-widest">Material</label>
                      <input 
                        type="text" placeholder="e.g. Copper, Ceramic, Wood"
                        value={formData.material}
                        onChange={(e) => setFormData({...formData, material: e.target.value})}
                        className="w-full bg-soft-oatmeal/10 border border-soft-oatmeal rounded-xl px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-warm-sand transition-all font-medium"
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-warm-sand uppercase tracking-widest">Dimensions</label>
                      <input 
                        type="text" placeholder="e.g. 60x60 cm or 3x6 ft"
                        value={formData.dimensions}
                        onChange={(e) => setFormData({...formData, dimensions: e.target.value})}
                        className="w-full bg-soft-oatmeal/10 border border-soft-oatmeal rounded-xl px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-warm-sand transition-all font-medium"
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-warm-sand uppercase tracking-widest">Thickness</label>
                      <input 
                        type="text" placeholder="e.g. 0.9 cm or 18 mm"
                        value={formData.thickness}
                        onChange={(e) => setFormData({...formData, thickness: e.target.value})}
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
