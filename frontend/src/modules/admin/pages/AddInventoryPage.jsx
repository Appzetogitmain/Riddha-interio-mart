import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import PageWrapper from '../components/PageWrapper';
import { LuPlus, LuImage, LuBriefcase, LuTags, LuInfo, LuArrowLeft, LuPackage, LuCheck, LuGrid2X2, LuUpload, LuVideo, LuX } from 'react-icons/lu';
import { FiPackage, FiEdit3, FiTrash2, FiPlus } from 'react-icons/fi';
import api from '../../../shared/utils/api';
import AIContentPanel from '../../../shared/components/AIContentPanel';
import ImagePreviewModal from '../../../shared/components/ImagePreviewModal';
import UnitSelect from '../../../shared/components/UnitSelect';
import ProductVariantsEditor from '../../seller/components/ProductVariantsEditor';

const AddInventoryPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const catalogId = searchParams.get('catalogId');

  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [imgFiles, setImgFiles] = useState([]); // Array of actual File objects
  const [videoFile, setVideoFile] = useState(null);
  const [previewImageSrc, setPreviewImageSrc] = useState(null);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [customBrandName, setCustomBrandName] = useState('');
  
  // Custom Dropdown State
  const [isCatOpen, setIsCatOpen] = useState(false);
  const [catSearch, setCatSearch] = useState('');
  const [isBrandOpen, setIsBrandOpen] = useState(false);
  const [brandSearch, setBrandSearch] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    hsnCode: '',
    category: '',
    subcategory: '',
    subsubcategory: '',
    brand: '',
    price: '',
    images: [],
    videoUrl: '',
    description: '',
    material: '',
    dimensions: '',
    countInStock: 50,
    unit: 'piece',
    unitValue: '1',
    maxB2CQty: '',
    seoKeywords: []
  });
  
  // SKU availability tracking state
  const [skuStatus, setSkuStatus] = useState({ checking: false, exists: false, checked: false });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [catRes, brandRes] = await Promise.all([
          api.get('/categories'),
          api.get('/brands')
        ]);
        setCategories(catRes.data.data || []);
        setBrands(brandRes.data.data || []);
        
        // If catalogId exists, fetch catalog item to pre-fill
        if (catalogId) {
          const { data: catalogItem } = await api.get(`/catalog/${catalogId}`);
          const itm = catalogItem.data;
          if (itm) {
            setFormData({
              name: itm.name || '',
              sku: itm.sku || '',
              hsnCode: itm.hsnCode || '',
              category: itm.category || '',
              subcategory: itm.subcategory || '',
              subsubcategory: itm.subsubcategory || '',
              brand: itm.brand || '',
              price: itm.price || '',
              images: itm.images || [],
              videoUrl: itm.videoUrl || '',
              description: itm.description || '',
              material: itm.material || '',
              dimensions: itm.dimensions || '',
              countInStock: 50,
              unit: itm.unit || 'piece',
              unitValue: itm.unitValue || '1',
              maxB2CQty: itm.maxB2CQty || '',
            });
          }
        }
      } catch (err) {
        console.error('Failed to fetch initialization data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [catalogId]);

  // Debounced SKU uniqueness validation check
  useEffect(() => {
    if (!formData.sku || formData.sku.trim() === '') {
      setSkuStatus({ checking: false, exists: false, checked: false });
      return;
    }

    setSkuStatus(prev => ({ ...prev, checking: true, checked: true }));
    const delayDebounce = setTimeout(async () => {
      try {
        const response = await api.get(`/products/check-sku/${encodeURIComponent(formData.sku.trim())}`);
        setSkuStatus({
          checking: false,
          exists: response.data.exists,
          checked: true
        });
      } catch (err) {
        console.error('SKU check failed:', err);
        setSkuStatus({ checking: false, exists: false, checked: false });
      }
    }, 600);

    return () => clearTimeout(delayDebounce);
  }, [formData.sku]);

  const [isGeneratingHSN, setIsGeneratingHSN] = useState(false);

  const handleGenerateHSN = async () => {
    if (!formData.category || !formData.name) {
      alert('Please select a category and enter a product name first.');
      return;
    }
    try {
      setIsGeneratingHSN(true);
      const res = await api.post('/products/generate-hsn', {
        category: formData.category,
        subcategory: formData.subcategory,
        subsubcategory: formData.subsubcategory,
        name: formData.name,
        description: formData.description
      });
      if (res.data.success && res.data.hsnCode) {
        setFormData(prev => ({ ...prev, hsnCode: res.data.hsnCode }));
      }
    } catch (err) {
      console.error('Failed to generate HSN:', err);
      alert(err.response?.data?.error || 'Failed to generate HSN code');
    } finally {
      setIsGeneratingHSN(false);
    }
  };


  const filteredCategories = categories.filter(cat => 
    cat.name.toLowerCase().includes(catSearch.toLowerCase())
  );

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    
    // Limit to 10 images total
    if (formData.images.length + files.length > 10) {
      alert('You can upload a maximum of 10 images.');
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
  };

  const removeImage = (index) => {
    // We need to figure out if this is a new file or an existing URL
    // existing images in formData.images that are strings starting with http are URLs
    // Base64 starts with data:
    
    const imageToRemove = formData.images[index];
    const isNewFile = imageToRemove.startsWith('data:');

    if (isNewFile) {
      // Find which index in imgFiles this corresponds to
      // This is slightly tricky if we just append. 
      // Let's keep a better mapping or just filter both.
      
      // Simpler way: Find the count of 'data:' images before this index
      let base64CountBefore = 0;
      for (let i = 0; i < index; i++) {
        if (formData.images[i].startsWith('data:')) {
          base64CountBefore++;
        }
      }
      
      setImgFiles(prev => prev.filter((_, i) => i !== base64CountBefore));
    }

    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.category) return alert('Please select or enter a category');
    if (!formData.brand) return alert('Please select a brand partner.');
    if (formData.brand === 'other' && !customBrandName.trim()) return alert('Please enter the new brand name.');
    if (skuStatus.exists) return alert('Cannot save product: The entered SKU code already exists. Please enter a unique SKU.');
    if (formData.images.length === 0) return alert('Cannot save product: Please upload or select at least 1 image for this product.');

    try {
      setLoading(true);

      let finalImages = formData.images.filter(img => img.startsWith('http')); // Keep existing URLs
      let finalVideoUrl = formData.videoUrl;

      // 1. Bulk Media Upload
      if (imgFiles.length > 0 || videoFile) {
        const bulkData = new FormData();
        imgFiles.forEach(file => bulkData.append('images', file));
        if (videoFile) bulkData.append('video', videoFile);

        const uploadRes = await api.post('/upload/bulk', bulkData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        if (uploadRes.data.success) {
          finalImages = [...finalImages, ...uploadRes.data.images];
          if (uploadRes.data.videoUrl) finalVideoUrl = uploadRes.data.videoUrl;
        }
      }

      let finalBrand = formData.brand;
      if (formData.brand === 'other' && customBrandName.trim()) {
        try {
          const { data: brandRes } = await api.post('/brands', { name: customBrandName.trim() });
          finalBrand = brandRes.data?._id || brandRes._id;
        } catch (e) {
          const errorMsg = e.response?.data?.error || e.message || '';
          if (errorMsg.toLowerCase().includes('already exists')) {
            const { data: brandListRes } = await api.get('/brands');
            const matched = (brandListRes.data || []).find(b => b.name.toLowerCase() === customBrandName.trim().toLowerCase());
            if (matched) finalBrand = matched._id;
            else throw new Error('This brand name is already taken. Please pick a different name or select it from the list.');
          } else {
            throw new Error('Failed to create new brand: ' + errorMsg);
          }
        }
      }

      const payload = {
        ...formData,
        brand: finalBrand,
        price: Number(formData.price),
        countInStock: Number(formData.countInStock),
        maxB2CQty: formData.maxB2CQty !== '' ? Number(formData.maxB2CQty) : undefined,
        images: finalImages,
        videoUrl: finalVideoUrl,
        isApproved: true,
        approvalStatus: 'approved',
        sellerType: 'Admin',
        isActive: true
      };

      await api.post('/products', payload);
      navigate('/admin/inventory');
    } catch (err) {
      console.error('Failed to add inventory product:', err);
      alert(err.response?.data?.error || err.message || 'Error creating product.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageWrapper>
      <div className="max-w-4xl mx-auto space-y-6 pb-12">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button 
            onClick={() => navigate('/admin/inventory')}
            className="flex items-center gap-2 text-warm-sand hover:text-deep-espresso transition-colors font-bold text-xs uppercase tracking-widest"
          >
            <LuArrowLeft size={18} /> Back to Inventory
          </button>
          <h1 className="text-2xl font-display font-bold text-deep-espresso">Add Direct Product</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            
            {/* Image Section */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white rounded-3xl p-6 border border-soft-oatmeal shadow-sm h-fit space-y-6">
                <label className="text-[10px] font-black text-warm-sand uppercase tracking-widest mb-4 block text-center">Product Media</label>
                
                <div className="grid grid-cols-2 gap-3">
                   {formData.images.map((img, idx) => (
                     <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-soft-oatmeal group">
                        <img
                          src={img}
                          alt=""
                          onClick={() => setPreviewImageSrc(img)}
                          className="w-full h-full object-cover cursor-pointer"
                        />
                        <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all pointer-events-none">
                          <button
                            type="button" onClick={() => setPreviewImageSrc(img)}
                            className="p-2 bg-slate-700/90 hover:bg-slate-800 rounded-full text-white pointer-events-auto"
                          >
                             <LuImage size={16} />
                          </button>
                          <button
                            type="button" onClick={() => removeImage(idx)}
                            className="p-2 bg-red-500/90 hover:bg-red-600 rounded-full text-white pointer-events-auto"
                          >
                             <FiTrash2 size={16} />
                          </button>
                        </div>
                     </div>
                   ))}
                   {formData.images.length < 10 && (
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
                           type="file" id="inv-video-upload" hidden accept="video/*"
                           onChange={(e) => setVideoFile(e.target.files[0])}
                         />
                         <label htmlFor="inv-video-upload" className="text-[10px] font-black text-deep-espresso uppercase tracking-widest hover:underline cursor-pointer">
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
                <div className="pt-4 border-t border-soft-oatmeal/30">
                   <AIContentPanel
                     formData={formData}
                     onApply={(data) => {
                       console.log("Admin Inventory page applying AI content:", data);
                       
                       let matchedBrandId = "";
                       if (data.brandName) {
                         const matched = brands.find(
                           (b) => b.name.toLowerCase() === data.brandName.toLowerCase()
                         );
                         if (matched) {
                           matchedBrandId = matched._id;
                         } else {
                           matchedBrandId = "other";
                           setCustomBrandName(data.brandName);
                         }
                       }

                       const aiImages = (data.images && data.images.length > 0) ? data.images : (data.image ? [data.image] : []);
                       // Skip any image already sitting in the product (e.g. Apply clicked twice on the same selection).
                       const newAiImages = aiImages.filter((imgSrc) => !formData.images.includes(imgSrc));
                       newAiImages.forEach((imgSrc, idx) => {
                         if (imgSrc && imgSrc.startsWith('data:')) {
                           fetch(imgSrc)
                             .then(res => res.blob())
                             .then(blob => {
                               const file = new File([blob], `ai_generated_${Date.now()}_${idx}.jpg`, { type: 'image/jpeg' });
                               setImgFiles(prev => [...prev, file]);
                             })
                             .catch(err => console.error("Failed to convert base64 image to File:", err));
                         }
                       });

                       setFormData((prev) => ({
                         ...prev,
                         description: data.description,
                         hsnCode: data.hsnCode,
                         sku: data.sku,
                         brand: matchedBrandId || prev.brand,
                         dimensions: data.dimensions?.height && data.dimensions?.width
                           ? `${data.dimensions.height} x ${data.dimensions.width} ${data.dimensions.unit || ''}`.trim()
                           : prev.dimensions,
                         thickness: data.dimensions?.thickness || prev.thickness,
                         seoKeywords: data.seoKeywords,
                         images: newAiImages.length > 0 ? [...prev.images, ...newAiImages].slice(0, 10) : prev.images,
                         dynamicAttributes: {
                           ...(prev.dynamicAttributes || {}),
                           ...data.specifications
                         }
                       }));
                     }}
                     theme="admin"
                   />
                </div>
              </div>
            </div>

            {/* Main Info Section */}
            <div className="xl:col-span-2 space-y-6">
              <div className="bg-white rounded-3xl p-8 border border-soft-oatmeal shadow-sm space-y-6">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Name */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-warm-sand uppercase tracking-widest flex items-center gap-2">
                       <LuBriefcase size={12} /> Product Name
                    </label>
                    <input 
                      type="text" required
                      placeholder="e.g. Italian Carrera Marble"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full bg-soft-oatmeal/10 border border-soft-oatmeal rounded-xl px-4 py-3 text-sm focus:outline-none"
                    />
                  </div>

                  {/* SKU */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-warm-sand uppercase tracking-widest flex items-center gap-2">
                       <LuPackage size={12} /> SKU Code
                    </label>
                    <input 
                      type="text" required
                      placeholder="e.g. TLE-MAR-001"
                      value={formData.sku}
                      onChange={(e) => setFormData({...formData, sku: e.target.value})}
                      className={`w-full bg-soft-oatmeal/10 border rounded-xl px-4 py-3 text-sm focus:outline-none transition-all ${skuStatus.checked ? (skuStatus.checking ? 'border-yellow-400' : (skuStatus.exists ? 'border-red-500 bg-red-50/50' : 'border-green-500 bg-green-50/30')) : 'border-soft-oatmeal'}`}
                    />
                    {skuStatus.checked && (
                      <div className="mt-1 flex items-center gap-1">
                         {skuStatus.checking ? (
                           <span className="text-[9px] font-bold text-yellow-600 animate-pulse">Checking SKU availability...</span>
                         ) : skuStatus.exists ? (
                           <span className="text-[9px] font-bold text-red-600 flex items-center gap-1">❌ Code (SKU) already exists</span>
                         ) : (
                           <span className="text-[9px] font-bold text-green-600 flex items-center gap-1">✓ Code (SKU) is available</span>
                         )}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                       <label className="text-[10px] font-black text-warm-sand uppercase tracking-widest flex items-center gap-2">
                          <LuPackage size={12} /> HSN Code
                       </label>
                       <button
                         type="button"
                         onClick={handleGenerateHSN}
                         disabled={isGeneratingHSN}
                         className={`text-[9px] font-black uppercase tracking-widest flex items-center gap-1 ${isGeneratingHSN ? 'text-warm-sand' : 'text-red-800 hover:text-red-600 transition-colors'}`}
                       >
                          {isGeneratingHSN ? 'Generating...' : 'Auto Generate ✨'}
                       </button>
                    </div>
                    <input 
                      type="text" required
                      placeholder="e.g. 6802"
                      value={formData.hsnCode}
                      onChange={(e) => setFormData({...formData, hsnCode: e.target.value})}
                      className="w-full bg-soft-oatmeal/10 border border-soft-oatmeal rounded-xl px-4 py-3 text-sm focus:outline-none"
                    />
                  </div>

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
                         className="w-full bg-soft-oatmeal/10 border border-soft-oatmeal rounded-xl px-4 py-3 text-sm focus:outline-none"
                       />
                       <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-warm-sand">
                          <LuGrid2X2 size={14} className={isCatOpen ? 'rotate-180 transition-transform' : 'transition-transform'} />
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
                            <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-soft-oatmeal rounded-2xl shadow-2xl z-[50] overflow-hidden max-h-64 overflow-y-auto">
                               {filteredCategories.length > 0 ? (
                                 filteredCategories.map(cat => (
                                   <button
                                     key={cat._id}
                                     type="button"
                                     onClick={() => {
                                       setFormData({
                                         ...formData,
                                         category: cat.name,
                                         subcategory: '', // Reset subcategory when parent changes
                                         subsubcategory: ''
                                       });
                                       setCatSearch('');
                                       setIsCatOpen(false);
                                     }}
                                     className="w-full text-left px-5 py-3.5 text-sm font-medium hover:bg-soft-oatmeal/30 transition-colors border-b border-soft-oatmeal/10 last:border-0"
                                   >
                                     <span className={formData.category === cat.name ? "text-red-800 font-bold" : "text-deep-espresso"}>
                                       {cat.name}
                                     </span>
                                   </button>
                                 ))
                               ) : (
                                 <div className="px-5 py-4 text-xs font-bold text-warm-sand text-center italic">
                                   No categories found
                                 </div>
                               )}
                            </div>
                         </>
                       )}
                    </div>
                    {/* GST auto tax rate display badge */}
                    {categories.find(c => c.name === formData.category) && (
                      <div className="text-[9px] font-bold text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-lg w-fit flex items-center gap-1.5 mt-1.5">
                        <LuInfo size={11} /> Default Category GST Rate: {categories.find(c => c.name === formData.category).defaultGstRate || 18}%
                      </div>
                    )}
                  </div>

                  {/* Active Subcategories Dynamic Selector Dropdown */}
                  {formData.category && categories.find(c => c.name === formData.category)?.subcategories?.length > 0 && (
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-warm-sand uppercase tracking-widest flex items-center gap-2">
                          <LuGrid2X2 size={12} /> Subcategory
                       </label>
                       <select 
                         value={formData.subcategory || ''}
                         onChange={(e) => setFormData({...formData, subcategory: e.target.value, subsubcategory: ''})}
                         className="w-full bg-soft-oatmeal/10 border border-soft-oatmeal rounded-xl px-4 py-3 text-sm focus:outline-none cursor-pointer appearance-none font-medium"
                       >
                         <option value="">Select Subcategory</option>
                         {categories.find(c => c.name === formData.category).subcategories.map(sub => (
                           <option key={sub._id || sub.name} value={sub.name}>{sub.name}</option>
                         ))}
                       </select>
                    </div>
                  )}

                   {/* Active Sub-subcategories Dynamic Selector Dropdown */}
                   {formData.category && formData.subcategory && categories.find(c => c.name === formData.category)?.subcategories?.find(s => s.name === formData.subcategory)?.subsubcategories?.length > 0 && (
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-warm-sand uppercase tracking-widest flex items-center gap-2">
                           <LuGrid2X2 size={12} /> Sub-subcategory
                        </label>
                        <select 
                          value={formData.subsubcategory || ''}
                          onChange={(e) => setFormData({...formData, subsubcategory: e.target.value})}
                          className="w-full bg-soft-oatmeal/10 border border-soft-oatmeal rounded-xl px-4 py-3 text-sm focus:outline-none cursor-pointer appearance-none font-medium"
                        >
                          <option value="">Select Sub-subcategory</option>
                          {categories.find(c => c.name === formData.category).subcategories.find(s => s.name === formData.subcategory).subsubcategories.map(subsub => (
                            <option key={subsub._id || subsub.name} value={subsub.name}>{subsub.name}</option>
                          ))}
                        </select>
                     </div>
                   )}

                  {/* Brand */}
                  <div className="space-y-2 relative">
                    <label className="text-[10px] font-black text-warm-sand uppercase tracking-widest flex items-center gap-2">
                       <LuTags size={12} /> Brand Partner
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder={
                          formData.brand === 'other'
                            ? (customBrandName || 'Other (Add New Brand)')
                            : brands.find(b => b._id === formData.brand)?.name || 'Search brand...'
                        }
                        value={brandSearch}
                        onChange={(e) => { setBrandSearch(e.target.value); setIsBrandOpen(true); }}
                        onFocus={() => setIsBrandOpen(true)}
                        onBlur={() => setTimeout(() => setIsBrandOpen(false), 150)}
                        className="w-full bg-soft-oatmeal/10 border border-soft-oatmeal rounded-xl px-4 py-3 text-sm focus:outline-none"
                      />
                      {isBrandOpen && (
                        <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-soft-oatmeal rounded-xl shadow-2xl z-50 max-h-60 overflow-y-auto p-1.5">
                           {brands.filter(b => b.name.toLowerCase().includes(brandSearch.toLowerCase())).map(brand => (
                             <button
                               key={brand._id}
                               type="button"
                               onMouseDown={(e) => {
                                 e.preventDefault();
                                 setFormData({ ...formData, brand: brand._id });
                                 setBrandSearch('');
                                 setIsBrandOpen(false);
                               }}
                               className="w-full text-left px-3 py-2.5 text-xs font-bold text-warm-sand hover:bg-soft-oatmeal/20 rounded-lg transition-colors"
                             >
                               {brand.name}
                             </button>
                           ))}
                           {brands.filter(b => b.name.toLowerCase().includes(brandSearch.toLowerCase())).length === 0 && (
                             <p className="px-3 py-2.5 text-xs font-semibold text-warm-sand/60">No brands match "{brandSearch}"</p>
                           )}
                           <button
                             type="button"
                             onMouseDown={(e) => {
                               e.preventDefault();
                               setFormData({ ...formData, brand: 'other' });
                               setBrandSearch('');
                               setIsBrandOpen(false);
                             }}
                             className="w-full text-left px-3 py-2.5 text-xs font-black text-deep-espresso hover:bg-soft-oatmeal/20 rounded-lg transition-colors border-t border-soft-oatmeal/50 mt-1"
                           >
                             + Other (Add New Brand)
                           </button>
                        </div>
                      )}
                      {formData.brand === 'other' && (
                        <input
                          type="text"
                          placeholder="Type new brand name..."
                          value={customBrandName}
                          onChange={(e) => setCustomBrandName(e.target.value)}
                          className="w-full mt-2 bg-soft-oatmeal/10 border border-soft-oatmeal rounded-xl px-4 py-3 text-sm focus:outline-none"
                        />
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-warm-sand uppercase tracking-widest">Price (₹)</label>
                      <input 
                        type="number" required
                        placeholder="0.00"
                        value={formData.price}
                        onChange={(e) => setFormData({...formData, price: e.target.value})}
                        className="w-full bg-soft-oatmeal/10 border border-soft-oatmeal rounded-xl px-4 py-3 text-sm focus:outline-none font-bold"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-warm-sand uppercase tracking-widest">Initial Stock</label>
                      <input 
                        type="number" required
                        value={formData.countInStock}
                        onChange={(e) => setFormData({...formData, countInStock: e.target.value})}
                        className="w-full bg-soft-oatmeal/10 border border-soft-oatmeal rounded-xl px-4 py-3 text-sm focus:outline-none"
                      />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-warm-sand uppercase tracking-widest">Unit Type</label>
                      <UnitSelect
                        value={formData.unit}
                        onChange={(unit) => setFormData({...formData, unit})}
                        triggerClassName="w-full flex items-center justify-between bg-soft-oatmeal/10 border border-soft-oatmeal rounded-xl px-4 py-3 text-sm focus:outline-none cursor-pointer"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-warm-sand uppercase tracking-widest">Unit Value (Qty)</label>
                      <input 
                        type="text"
                        placeholder="e.g. 50"
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

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-warm-sand uppercase tracking-widest flex items-center gap-2">
                     <LuInfo size={12} /> Detailed Description
                  </label>
                  <textarea 
                    rows={3} required
                    placeholder="Enter product description..."
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full bg-soft-oatmeal/10 border border-soft-oatmeal rounded-xl px-4 py-3 text-sm focus:outline-none resize-none"
                  />
                </div>

                {formData.seoKeywords && formData.seoKeywords.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-warm-sand uppercase tracking-widest">
                      Active SEO Keywords
                    </label>
                    <div className="flex flex-wrap gap-1.5 p-3 bg-soft-oatmeal/5 rounded-xl border border-soft-oatmeal">
                      {formData.seoKeywords.map((kw, i) => (
                        <span key={i} className="text-xs font-bold px-3 py-1 rounded-xl bg-blue-50 text-blue-700 border border-blue-100 flex items-center gap-1.5">
                          {kw}
                          <button
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                seoKeywords: prev.seoKeywords.filter(k => k !== kw)
                              }));
                            }}
                            className="hover:text-slate-900 cursor-pointer"
                          >
                            <LuX size={10} />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-soft-oatmeal/50">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-warm-sand uppercase tracking-widest">Material</label>
                      <input 
                        type="text"
                        placeholder="e.g. Ceramic"
                        value={formData.material}
                        onChange={(e) => setFormData({...formData, material: e.target.value})}
                        className="w-full bg-soft-oatmeal/10 border border-soft-oatmeal rounded-xl px-4 py-3 text-sm focus:outline-none"
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-warm-sand uppercase tracking-widest">Dimensions</label>
                      <input 
                        type="text"
                        placeholder="e.g. 30x30 cm"
                        value={formData.dimensions}
                        onChange={(e) => setFormData({...formData, dimensions: e.target.value})}
                        className="w-full bg-soft-oatmeal/10 border border-soft-oatmeal rounded-xl px-4 py-3 text-sm focus:outline-none"
                      />
                   </div>
                </div>

                <ProductVariantsEditor formData={formData} setFormData={setFormData} categories={categories} />

                <div className="flex justify-end pt-6">
                  <button 
                    disabled={loading}
                    type="submit"
                    className="bg-deep-espresso hover:bg-black text-white px-10 py-4 rounded-2xl font-bold flex items-center gap-2 transition-all transform active:scale-95 shadow-xl shadow-black/10 disabled:opacity-50 uppercase tracking-widest text-xs"
                  >
                    {loading ? 'SAVING...' : 'PUBLISH PRODUCT'}
                  </button>
                </div>

              </div>
            </div>

          </div>
        </form>
      </div>
      {previewImageSrc && (
        <ImagePreviewModal src={previewImageSrc} onClose={() => setPreviewImageSrc(null)} />
      )}
    </PageWrapper>
  );
};

export default AddInventoryPage;
