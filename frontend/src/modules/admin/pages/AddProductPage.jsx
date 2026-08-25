import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageWrapper from '../components/PageWrapper';
import { FiArrowLeft, FiImage, FiVideo, FiSave, FiInfo, FiTag, FiDollarSign, FiType, FiUser, FiPackage, FiTrash2, FiPlus, FiX, FiCamera } from 'react-icons/fi';
import api from '../../../shared/utils/api';
import { toast } from 'react-hot-toast';
import BulkUploadModal from '../components/BulkUploadModal';
import { FiUploadCloud } from 'react-icons/fi';
import AIContentPanel from '../../../shared/components/AIContentPanel';
import ImagePreviewModal from '../../../shared/components/ImagePreviewModal';
import UnitSelect from '../../../shared/components/UnitSelect';
import DeliveryOptionsForm from '../../seller/components/DeliveryOptionsForm';
import PaymentOptionsForm from '../../seller/components/PaymentOptionsForm';
import ProductVariantsEditor from '../../seller/components/ProductVariantsEditor';

const AddProductPage = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [customBrandName, setCustomBrandName] = useState('');
  const [imgFiles, setImgFiles] = useState([]);
  const [videoFile, setVideoFile] = useState(null);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [previewImageSrc, setPreviewImageSrc] = useState(null);
  
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
    b2bPrice: '',
    b2bMinQty: '',
    maxB2CQty: '',
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
    gstRate: '',
    seoKeywords: [],
    deliveryOptions: {
      availableDeliveryDays: [],
      deliveryTypes: [],
      freeDeliveryEligibility: []
    },
    paymentOptions: []
  });

  // SKU availability tracking state for master catalog
  const [skuStatus, setSkuStatus] = useState({ checking: false, exists: false, checked: false });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        console.log('Fetching initialization data...');
        
        const [catRes, brandRes] = await Promise.all([
          api.get('/categories'),
          api.get('/brands')
        ]);
        
        console.log('Categories:', catRes.data);
        console.log('Brands:', brandRes.data);
        
        const fetchedCategories = catRes.data.data || [];
        const fetchedBrands = brandRes.data.data || [];

        setCategories(fetchedCategories);
        setBrands(fetchedBrands);
        
      } catch (err) {
        console.error('Failed to fetch initialization data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Debounced SKU uniqueness validation check in catalog list
  useEffect(() => {
    if (!formData.sku || formData.sku.trim() === '') {
      setSkuStatus({ checking: false, exists: false, checked: false });
      return;
    }

    setSkuStatus(prev => ({ ...prev, checking: true, checked: true }));
    const delayDebounce = setTimeout(async () => {
      try {
        const response = await api.get(`/catalog/check-sku/${encodeURIComponent(formData.sku.trim())}`);
        setSkuStatus({
          checking: false,
          exists: response.data.exists,
          checked: true
        });
      } catch (err) {
        console.error('SKU catalog check failed:', err);
        setSkuStatus({ checking: false, exists: false, checked: false });
      }
    }, 600);

    return () => clearTimeout(delayDebounce);
  }, [formData.sku]);

  const [isGeneratingHSN, setIsGeneratingHSN] = useState(false);

  const handleGenerateHSN = async () => {
    if (!formData.category || !formData.name) {
      toast.error('Please select a category and enter a product name first.');
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
        toast.success('HSN Code generated successfully!');
      }
    } catch (err) {
      console.error('Failed to generate HSN:', err);
      toast.error(err.response?.data?.error || 'Failed to generate HSN code');
    } finally {
      setIsGeneratingHSN(false);
    }
  };
  
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
      toast.error("Failed to remove background.");
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
    if (formData.images.length >= 10) {
      toast.error("Max 10 images allowed");
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
    
    if (formData.images.length >= 10) {
      toast.error("Max 10 images allowed");
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

    if (!formData.name || formData.name.trim() === '') {
      toast.error('Please enter a product name.');
      return;
    }
    if (!formData.sku || formData.sku.trim() === '') {
      toast.error('Please enter a unique SKU code.');
      return;
    }
    if (!formData.hsnCode || formData.hsnCode.trim() === '') {
      toast.error('Please enter an HSN code.');
      return;
    }
    if (!formData.brand) {
      toast.error('Please select a brand partner.');
      return;
    }
    if (formData.brand === 'other' && !customBrandName.trim()) {
      toast.error('Please enter the new brand name.');
      return;
    }
    if (!formData.category) {
      toast.error('Please select a category.');
      return;
    }
    if (formData.price === '' || formData.price === undefined || formData.price === null) {
      toast.error('Please enter a product price.');
      return;
    }
    if (formData.stock === '' || formData.stock === undefined || formData.stock === null) {
      toast.error('Please enter stock quantity.');
      return;
    }
    if (!formData.description || formData.description.trim() === '') {
      toast.error('Please enter a detailed product description.');
      return;
    }
    if (skuStatus.exists) {
      toast.error('Cannot save catalog item: The entered SKU code already exists. Please enter a unique SKU.');
      return;
    }
    if (formData.images.length === 0) {
      toast.error('Cannot save catalog item: Please upload or select at least 1 image for this catalog product.');
      return;
    }

    try {
      setSubmitting(true);
      setStatusMessage('');

      // Prepare multi-media upload
      const uploadData = new FormData();
      imgFiles.forEach(file => {
        uploadData.append('images', file);
      });
      if (videoFile) {
        uploadData.append('video', videoFile);
      }

      let uploadedUrls = [];
      let finalVideoUrl = formData.videoUrl;

      if (imgFiles.length > 0 || videoFile) {
        const { data: uploadRes } = await api.post('/upload/bulk', uploadData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        uploadedUrls = uploadRes.images || [];
        if (uploadRes.videoUrl) finalVideoUrl = uploadRes.videoUrl;
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
        b2bPrice: formData.b2bPrice !== '' ? Number(formData.b2bPrice) : undefined,
        b2bMinQty: formData.b2bMinQty !== '' ? Number(formData.b2bMinQty) : undefined,
        maxB2CQty: formData.maxB2CQty !== '' ? Number(formData.maxB2CQty) : undefined,
        countInStock: Number(formData.stock),
        images: uploadedUrls,
        videoUrl: finalVideoUrl,
        gstRate: formData.gstRate !== '' ? Number(formData.gstRate) : undefined
      };

      await api.post('/catalog', payload);
      toast.success('Product added to catalog successfully!');
      navigate('/admin/catalog');
    } catch (err) {
      console.error('Failed to add product:', err);
      setStatusMessage(err.response?.data?.error || err.message || 'Failed to add product to catalog');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
     return (
        <PageWrapper>
           <div className="flex flex-col items-center justify-center py-40 animate-pulse">
              <div className="w-16 h-16 border-4 border-soft-oatmeal border-t-red-800 rounded-full animate-spin mb-4" />
              <p className="text-xs font-black uppercase tracking-[0.3em] text-warm-sand">Preparing Designer Studio...</p>
           </div>
        </PageWrapper>
     );
  }

  return (
    <PageWrapper>
      <div className="max-w-7xl mx-auto space-y-8">
        <button 
          onClick={() => navigate('/admin/catalog')}
          className="flex items-center gap-2 text-warm-sand font-bold hover:text-deep-espresso transition-colors group text-xs md:text-sm"
        >
          <FiArrowLeft className="group-hover:-translate-x-1 transition-transform" />
          Back to Catalog
        </button>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-display font-bold text-deep-espresso">Add New Product</h1>
            <p className="text-warm-sand text-sm md:text-base font-medium">Populate your catalog with premium items.</p>
          </div>
          <div className="flex items-center gap-4">
            {statusMessage && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-xl text-xs font-bold">
                 {statusMessage}
              </div>
            )}
            <button 
              onClick={() => setIsBulkModalOpen(true)}
              className="bg-soft-oatmeal text-deep-espresso text-xs font-black uppercase tracking-widest px-6 py-3 rounded-xl hover:bg-warm-sand/20 transition-all flex items-center gap-2"
            >
              <FiUploadCloud size={16} /> Bulk Upload
            </button>
          </div>
        </div>

        <BulkUploadModal isOpen={isBulkModalOpen} onClose={() => setIsBulkModalOpen(false)} />

        <form onSubmit={handleSubmit} noValidate className="space-y-6 md:space-y-8 pb-12">
          {/* Main Form Card */}
          <div className="bg-white rounded-3xl md:rounded-[32px] border border-soft-oatmeal shadow-xl grid grid-cols-1 xl:grid-cols-2 relative">
             {/* Left: Image Preview Area */}
             <div className="p-6 md:p-8 bg-soft-oatmeal/10 border-b xl:border-r xl:border-b-0 border-soft-oatmeal space-y-6">
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
                               <img
                                 src={src}
                                 alt=""
                                 onClick={() => setPreviewImageSrc(src)}
                                 className="w-full h-full object-cover cursor-pointer"
                               />
                               <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2 z-10 pointer-events-none">
                                 <div className="flex justify-between pointer-events-auto">
                                   <button
                                     type="button"
                                     onClick={() => setPreviewImageSrc(src)}
                                     className="p-1.5 bg-slate-700 hover:bg-slate-800 text-white rounded-full transition-colors shadow-md"
                                   >
                                      <FiImage size={12} />
                                   </button>
                                   <button
                                     type="button"
                                     onClick={() => removeImage(idx)}
                                     className="p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors shadow-md"
                                   >
                                      <FiTrash2 size={12} />
                                   </button>
                                 </div>
                                 <div className="flex justify-center pb-1 pointer-events-auto">
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
                    {formData.images.length < 10 && (
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
                            type="file" id="admin-video-upload" hidden accept="video/*"
                            onChange={(e) => setVideoFile(e.target.files[0])}
                          />
                          <label htmlFor="admin-video-upload" className="text-[10px] font-black text-deep-espresso uppercase tracking-widest hover:underline cursor-pointer">
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

              {/* AI Content */}
              <div className="">
                   <AIContentPanel
                     formData={formData}
                     onApply={(data) => {
                       console.log("Admin Catalog page applying AI content:", data);
                       
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

              {/* Right: Detailed Fields */}
              <div className="xl:col-span-2 p-6 md:p-10 lg:p-12 space-y-8">
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
                         className={`w-full bg-soft-oatmeal/10 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-warm-sand transition-all font-mono ${skuStatus.checked ? (skuStatus.checking ? 'border-yellow-400' : (skuStatus.exists ? 'border-red-500 bg-red-50/50' : 'border-green-500 bg-green-50/30')) : 'border-soft-oatmeal'}`}
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
                             <FiTag size={12} /> HSN Code
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
                         type="text" required placeholder="e.g. 6802"
                         value={formData.hsnCode}
                         onChange={(e) => setFormData({...formData, hsnCode: e.target.value})}
                         className="w-full bg-soft-oatmeal/10 border border-soft-oatmeal rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-warm-sand transition-all font-medium"
                       />
                    </div>
                   <div className="space-y-2 relative">
                      <label className="text-[10px] font-black text-warm-sand uppercase tracking-widest flex items-center gap-2">
                         <FiTag size={12} /> Brand Partner
                      </label>
                      <div className="relative">
                         <input
                           type="text"
                           placeholder={
                             formData.brand === 'other'
                               ? (customBrandName || 'Other (Add New Brand)')
                               : brands.find(b => b._id === formData.brand)?.name || (brands.length > 0 ? 'Search brand...' : 'No brands found')
                           }
                           value={brandSearch}
                           onChange={(e) => { setBrandSearch(e.target.value); setIsBrandOpen(true); }}
                           onFocus={() => setIsBrandOpen(true)}
                           onBlur={() => setTimeout(() => setIsBrandOpen(false), 150)}
                           className="w-full bg-soft-oatmeal/10 border border-soft-oatmeal rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-warm-sand transition-all font-medium"
                         />
                         {isBrandOpen && (
                           <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-soft-oatmeal rounded-xl shadow-2xl z-50 max-h-60 overflow-y-auto p-1.5">
                              {brands.filter(b => b.name.toLowerCase().includes(brandSearch.toLowerCase())).map(b => (
                                <button
                                  key={b._id}
                                  type="button"
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    setFormData({ ...formData, brand: b._id });
                                    setBrandSearch('');
                                    setIsBrandOpen(false);
                                  }}
                                  className="w-full text-left px-3 py-2.5 text-xs font-bold text-warm-sand hover:bg-soft-oatmeal/20 rounded-lg transition-colors"
                                >
                                  {b.name}
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
                             className="w-full mt-2 bg-soft-oatmeal/10 border border-soft-oatmeal rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-warm-sand transition-all font-medium"
                           />
                         )}
                      </div>
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
                                          setFormData({
                                            ...formData,
                                            category: cat.name,
                                            subcategory: '',
                                            subsubcategory: ''
                                          });
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
                       {categories.find(c => c.name === formData.category) && (
                         <div className="text-[9px] font-bold text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-lg w-fit flex items-center gap-1.5 mt-1.5">
                           <FiInfo size={11} /> Default Category GST Rate: {categories.find(c => c.name === formData.category).defaultGstRate || 18}%
                         </div>
                       )}
                    </div>

                    {/* Active Subcategories Dynamic Selector Dropdown */}
                    {formData.category && categories.find(c => c.name === formData.category)?.subcategories?.length > 0 && (
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-warm-sand uppercase tracking-widest flex items-center gap-2">
                            <FiTag size={12} /> Subcategory
                         </label>
                         <select 
                           value={formData.subcategory || ''}
                           onChange={(e) => setFormData({...formData, subcategory: e.target.value, subsubcategory: ''})}
                           className="w-full bg-soft-oatmeal/10 border border-soft-oatmeal rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-warm-sand cursor-pointer appearance-none font-medium"
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
                             <FiTag size={12} /> Sub-subcategory
                          </label>
                          <select 
                            value={formData.subsubcategory || ''}
                            onChange={(e) => setFormData({...formData, subsubcategory: e.target.value})}
                            className="w-full bg-soft-oatmeal/10 border border-soft-oatmeal rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-warm-sand cursor-pointer appearance-none font-medium"
                          >
                            <option value="">Select Sub-subcategory</option>
                            {categories.find(c => c.name === formData.category).subcategories.find(s => s.name === formData.subcategory).subsubcategories.map(subsub => (
                              <option key={subsub._id || subsub.name} value={subsub.name}>{subsub.name}</option>
                            ))}
                          </select>
                       </div>
                     )}
                    
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

                    {/* B2C Order Quantity Cap */}
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-warm-sand uppercase tracking-widest flex items-center gap-2">
                          <FiUser size={12} /> Max Qty per B2C Order
                       </label>
                       <input
                         type="number" placeholder="Unlimited"
                         value={formData.maxB2CQty}
                         onChange={(e) => setFormData({...formData, maxB2CQty: e.target.value})}
                         className="w-full bg-soft-oatmeal/10 border border-soft-oatmeal rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-warm-sand transition-all font-medium"
                       />
                       <p className="text-[9px] text-warm-sand/70 font-medium">Customers wanting more than this must submit a Bulk Order Request.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                         <label className="text-[10px] font-black text-warm-sand uppercase tracking-widest">Unit</label>
                         <UnitSelect
                           value={formData.unit}
                           onChange={(unit) => setFormData({...formData, unit})}
                           triggerClassName="w-full flex items-center justify-between bg-soft-oatmeal/10 border border-soft-oatmeal rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-warm-sand transition-all cursor-pointer font-medium"
                         />
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
                     placeholder="Enter product description, key features, and heritage information..."
                     value={formData.description}
                     onChange={(e) => setFormData({...formData, description: e.target.value})}
                     className="w-full bg-soft-oatmeal/10 border border-soft-oatmeal rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-warm-sand transition-all resize-none font-medium"
                   ></textarea>
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
                             <FiX size={10} />
                           </button>
                         </span>
                       ))}
                     </div>
                   </div>
                 )}

              {/* Delivery & Payment Options */}
              <div className="space-y-6 pt-6 border-t border-soft-oatmeal/50">
                <DeliveryOptionsForm formData={formData} handleFieldChange={(field, value) => setFormData({...formData, [field]: value})} />
                <PaymentOptionsForm formData={formData} handleFieldChange={(field, value) => setFormData({...formData, [field]: value})} />
              </div>

              {/* Material & Dimensions */}
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

              <ProductVariantsEditor formData={formData} setFormData={setFormData} categories={categories} />

              <div className="pt-6 flex justify-end">
                   <button 
                     type="submit"
                     disabled={submitting}
                     className={`w-full md:w-auto bg-deep-espresso text-white font-black uppercase tracking-[0.2em] text-[10px] md:text-xs px-10 py-4.5 rounded-2xl transition-all shadow-xl shadow-deep-espresso/20 flex items-center justify-center gap-3 ${submitting ? 'opacity-70 cursor-not-allowed' : 'hover:bg-dusty-cocoa active:scale-95'}`}
                   >
                      {submitting ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <FiSave size={16} />
                      )}
                      {submitting ? 'Saving...' : 'Save Product'}
                   </button>
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

export default AddProductPage;
