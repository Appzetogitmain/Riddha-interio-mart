import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageWrapper from '../components/PageWrapper';
import { LuImage, LuBriefcase, LuTags, LuInfo, LuArrowLeft, LuPackage, LuCheck, LuClock, LuUpload, LuGrid2X2, LuVideo, LuX, LuUser, LuStore, LuPhone, LuMail, LuMapPin, LuShieldCheck } from 'react-icons/lu';
import { FiPackage, FiTrash2, FiPlus } from 'react-icons/fi';
import DeliveryOptionsForm from '../../seller/components/DeliveryOptionsForm';
import PaymentOptionsForm from '../../seller/components/PaymentOptionsForm';
import ProductVariantsEditor from '../../seller/components/ProductVariantsEditor';
import DimensionsInput from '../../../shared/components/DimensionsInput';
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
  const [sellers, setSellers] = useState([]);
  const [sellerInfo, setSellerInfo] = useState(null);
  
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
    shortDescription: '',
    metaTitle: '',
    metaDescription: '',
    approvalStatus: 'approved',
    rejectionReason: '',
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
    subcategory: '',
    subsubcategory: '',
    color: '',
    thickness: '',
    weight: '',
    gstRate: '',
    sellerB2bPrice: '',
    b2bAdminCommission: 0,
    b2bPrice: '',
    b2bMinQty: '',
    stock: 'in_stock',
    isActive: true,
    isCodAllowed: true,
    sampleAvailable: false,
    sampleCharge: 0,
    roomType: '',
    projectApplication: [],
    professionalGrade: false,
    seoKeywordsText: '',
    tagsText: '',
    specifications: {},
    seller: '',
    sellerType: 'Seller',
    deliveryOptions: {
      availableDeliveryDays: [],
      deliveryTypes: [],
      freeDeliveryEligibility: []
    },
    paymentOptions: []
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [prodRes, catRes, brandRes, sellerRes] = await Promise.all([
          api.get(`/products/${id}`),
          api.get('/categories'),
          api.get('/brands'),
          api.get('/admin/sellers').catch(() => ({ data: { data: [] } }))
        ]);
        
        const product = prodRes.data.data;
        setCategories(catRes.data.data || []);
        setBrands(brandRes.data.data || []);
        const loadedSellers = sellerRes.data?.data || [];
        setSellers(loadedSellers);

        const currentSeller = product.seller || null;
        setSellerInfo(currentSeller);
        
        const allCategories = catRes.data.data || [];
        const catId = String(product.category?._id || product.category || '');
        const catObj = allCategories.find(c => String(c._id) === catId || c.name === product.category?.name || c.name === product.category);
        const subObj = (catObj?.subcategories || []).find(sc => String(sc._id) === String(product.subcategory?._id || product.subcategory));
        const subsubObj = (subObj?.subsubcategories || []).find(ss => String(ss._id) === String(product.subsubcategory?._id || product.subsubcategory));

        setFormData({
          name: product.name || '',
          sku: product.sku || '',
          hsnCode: product.hsnCode || '',
          category: catObj?.name || product.category?.name || (typeof product.category === 'string' ? product.category : ''),
          subcategory: subObj?.name || '',
          subsubcategory: subsubObj?.name || '',
          brand: typeof product.brand === 'object' ? (product.brand?._id || '') : (product.brand || ''),
          color: product.color || '',
          thickness: product.thickness || '',
          weight: product.weight ?? '',
          gstRate: product.gstRate ?? '',
          sellerB2bPrice: product.sellerB2bPrice || '',
          b2bAdminCommission: product.b2bAdminCommission || 0,
          b2bPrice: product.b2bPrice || '',
          b2bMinQty: product.b2bMinQty || '',
          stock: product.stock || 'in_stock',
          isActive: product.isActive !== false,
          isCodAllowed: product.isCodAllowed !== false,
          sampleAvailable: !!product.sampleAvailable,
          sampleCharge: product.sampleCharge || 0,
          roomType: product.roomType || '',
          projectApplication: product.projectApplication || [],
          professionalGrade: !!product.professionalGrade,
          seoKeywordsText: (product.seoKeywords || []).join(', '),
          tagsText: (product.tags || []).join(', '),
          specifications: product.specifications || {},
          price: product.price || '',
          images: product.images || [],
          videoUrl: product.videoUrl || '',
          description: product.description || '',
          shortDescription: product.shortDescription || '',
          metaTitle: product.metaTitle || '',
          metaDescription: product.metaDescription || '',
          approvalStatus: product.approvalStatus || (product.isApproved ? 'approved' : 'pending'),
          rejectionReason: product.rejectionReason || '',
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
          seller: typeof currentSeller === 'object' ? (currentSeller?._id || '') : (currentSeller || ''),
          sellerType: product.sellerType || (product.seller ? 'Seller' : 'Admin'),
          deliveryOptions: product.deliveryOptions || {
            availableDeliveryDays: [],
            deliveryTypes: [],
            freeDeliveryEligibility: []
          },
          paymentOptions: product.paymentOptions || [],
          variants: (product.variants || []).map(v => ({
            _id: v._id,
            sku: v.sku || '',
            price: v.price ?? '',
            sellerPrice: v.sellerPrice ?? '',
            discountPrice: v.discountPrice ?? '',
            countInStock: v.countInStock ?? '',
            image: v.image || '',
          images: v.images && v.images.length ? v.images : (v.image ? [v.image] : []),
            attributes: v.attributes || {}
          }))
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

      const toNum = (v) => (v === '' || v === null || v === undefined ? undefined : Number(v));
      const toList = (text) => String(text || '').split(',').map(t => t.trim()).filter(Boolean);
      const { seoKeywordsText, tagsText, ...rest } = formData;
      const payload = {
        ...rest,
        isApproved: formData.approvalStatus === 'approved',
        seoKeywords: toList(seoKeywordsText),
        tags: toList(tagsText),
        roomType: formData.roomType || null,
        weight: toNum(formData.weight),
        gstRate: toNum(formData.gstRate),
        sellerB2bPrice: toNum(formData.sellerB2bPrice),
        b2bAdminCommission: toNum(formData.b2bAdminCommission) ?? 0,
        b2bPrice: toNum(formData.b2bPrice),
        b2bMinQty: toNum(formData.b2bMinQty),
        sampleCharge: toNum(formData.sampleCharge) ?? 0,
        subcategory: formData.subcategory || undefined,
        subsubcategory: formData.subsubcategory || undefined,
        price: Number(formData.price),
        countInStock: Number(formData.countInStock),
        maxB2CQty: formData.maxB2CQty !== '' ? Number(formData.maxB2CQty) : undefined,
        videoUrl: finalVideoUrl,
        seller: formData.seller || undefined,
        sellerType: formData.sellerType || 'Seller',
        variants: (formData.variants || [])
          .filter(v => Object.values(v.attributes || {}).some(Boolean))
          .map(v => ({
            ...(v._id ? { _id: v._id } : {}),
            sku: v.sku,
            price: Number(v.price) || Number(formData.price),
            sellerPrice: v.sellerPrice !== undefined && v.sellerPrice !== '' ? Number(v.sellerPrice) : undefined,
            discountPrice: v.discountPrice ? Number(v.discountPrice) : undefined,
            countInStock: Number(v.countInStock) || 0,
            image: (v.images && v.images[0]) || v.image || undefined,
            images: v.images && v.images.length ? v.images : (v.image ? [v.image] : []),
            attributes: v.attributes
          }))
      };

      await api.put(`/products/${id}`, payload);
      navigate('/admin/inventory');
    } catch (err) {
      console.error('Failed to update product:', err);
      alert(err.response?.data?.error || 'Error updating product.');
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

              {/* Seller Information & Ownership Card */}
              <div className="bg-white rounded-3xl p-6 border border-soft-oatmeal shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-soft-oatmeal pb-3">
                  <label className="text-[10px] font-black text-warm-sand uppercase tracking-widest flex items-center gap-2">
                    <LuStore size={14} /> Seller Information
                  </label>
                  {formData.sellerType === 'Admin' ? (
                    <span className="px-2 py-0.5 bg-red-800/10 text-red-800 text-[8px] font-black uppercase tracking-widest rounded border border-red-800/20">
                      Mart Direct
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-emerald-600/10 text-emerald-700 text-[8px] font-black uppercase tracking-widest rounded border border-emerald-600/20 flex items-center gap-1">
                      <LuShieldCheck size={10} /> {sellerInfo?.isVerified ? 'Verified Seller' : 'Registered Seller'}
                    </span>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="p-3 bg-soft-oatmeal/10 rounded-2xl space-y-2">
                    <div>
                      <p className="text-[9px] font-black text-warm-sand uppercase tracking-widest">Shop / Business</p>
                      <p className="text-sm font-bold text-deep-espresso flex items-center gap-1.5 mt-0.5">
                        <LuStore size={14} className="text-warm-sand shrink-0" />
                        {formData.sellerType === 'Admin' ? 'Riddha Mart Official' : (sellerInfo?.shopName || 'Marketplace Seller')}
                      </p>
                    </div>

                    {(sellerInfo?.fullName || formData.sellerType === 'Admin') && (
                      <div className="pt-2 border-t border-soft-oatmeal/40">
                        <p className="text-[9px] font-black text-warm-sand uppercase tracking-widest">Seller Name</p>
                        <p className="text-xs font-semibold text-deep-espresso flex items-center gap-1.5 mt-0.5">
                          <LuUser size={13} className="text-warm-sand shrink-0" />
                          {formData.sellerType === 'Admin' ? 'Riddha Admin' : (sellerInfo?.fullName || 'N/A')}
                        </p>
                      </div>
                    )}

                    {sellerInfo?.email && (
                      <div className="pt-1 text-xs text-deep-espresso flex items-center gap-1.5">
                        <LuMail size={13} className="text-warm-sand shrink-0" />
                        <span className="truncate text-[11px]">{sellerInfo.email}</span>
                      </div>
                    )}

                    {sellerInfo?.phone && (
                      <div className="text-xs text-deep-espresso flex items-center gap-1.5">
                        <LuPhone size={13} className="text-warm-sand shrink-0" />
                        <span className="text-[11px]">{sellerInfo.phone}</span>
                      </div>
                    )}

                    {(sellerInfo?.shopAddress || sellerInfo?.location?.address) && (
                      <div className="pt-1 text-xs text-warm-sand flex items-start gap-1.5">
                        <LuMapPin size={13} className="text-warm-sand shrink-0 mt-0.5" />
                        <span className="text-[10px] leading-tight text-warm-sand">
                          {sellerInfo?.shopAddress || sellerInfo?.location?.address}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Reassign / Change Seller Dropdown */}
                  <div className="space-y-1.5 pt-2">
                    <label className="text-[9px] font-black text-warm-sand uppercase tracking-widest block">
                      Assign / Reassign Seller
                    </label>
                    <select
                      value={formData.sellerType === 'Admin' ? 'admin' : (formData.seller || '')}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === 'admin') {
                          setFormData(prev => ({ ...prev, seller: '', sellerType: 'Admin' }));
                          setSellerInfo({ fullName: 'Riddha Admin', email: 'riddhamart@gmail.com', shopName: 'Riddha Official Direct' });
                        } else {
                          const s = sellers.find(item => item._id === val);
                          setFormData(prev => ({ ...prev, seller: val, sellerType: 'Seller' }));
                          if (s) setSellerInfo(s);
                        }
                      }}
                      className="w-full bg-soft-oatmeal/10 border border-soft-oatmeal rounded-xl px-3 py-2.5 text-xs text-deep-espresso font-medium focus:outline-none"
                    >
                      <option value="admin">Mart Direct (Admin)</option>
                      {sellers.map(s => (
                        <option key={s._id} value={s._id}>
                          {s.shopName ? `${s.shopName} (${s.fullName})` : s.fullName} — {s.email}
                        </option>
                      ))}
                    </select>
                    <p className="text-[9px] text-warm-sand">
                      Select which verified seller owns this product in their catalog.
                    </p>
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
                                  setFormData({...formData, category: cat.name, subcategory: '', subsubcategory: ''});
                                  setCatSearch('');
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
                        value={formData.price}
                        onChange={(e) => {
                          // Editing the final price keeps the seller price and recalculates the admin commission
                          const finalPrice = Number(e.target.value);
                          const sPrice = Number(formData.sellerPrice) || 0;
                          setFormData({
                            ...formData,
                            price: finalPrice,
                            adminCommission: sPrice > 0 ? Number(((finalPrice / sPrice - 1) * 100).toFixed(2)) : formData.adminCommission
                          });
                        }}
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

                {/* Subcategory / Sub-subcategory */}
                {(() => {
                  const catObj = categories.find(c => c.name === formData.category);
                  const subs = catObj?.subcategories || [];
                  const subObj = subs.find(sc => sc.name === formData.subcategory);
                  const subsubs = subObj?.subsubcategories || [];
                  const selectCls = 'w-full bg-soft-oatmeal/10 border border-soft-oatmeal rounded-xl px-4 py-3 text-sm focus:outline-none';
                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-warm-sand uppercase tracking-widest">Subcategory</label>
                        <select value={formData.subcategory} onChange={(e) => setFormData({ ...formData, subcategory: e.target.value, subsubcategory: '' })} className={selectCls}>
                          <option value="">{subs.length ? 'Select subcategory' : 'None available'}</option>
                          {subs.map(sc => <option key={sc._id || sc.name} value={sc.name}>{sc.name}</option>)}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-warm-sand uppercase tracking-widest">Sub-subcategory</label>
                        <select value={formData.subsubcategory} onChange={(e) => setFormData({ ...formData, subsubcategory: e.target.value })} className={selectCls}>
                          <option value="">{subsubs.length ? 'Select sub-subcategory' : 'None available'}</option>
                          {subsubs.map(ss => <option key={ss._id || ss.name} value={ss.name}>{ss.name}</option>)}
                        </select>
                      </div>
                    </div>
                  );
                })()}

                {/* More product details: everything else on the product is editable here */}
                {(() => {
                  const inputCls = 'w-full bg-soft-oatmeal/10 border border-soft-oatmeal rounded-xl px-4 py-3 text-sm focus:outline-none';
                  const labelCls = 'text-[10px] font-black text-warm-sand uppercase tracking-widest';
                  const setSpec = (key, value) => setFormData(prev => ({ ...prev, specifications: { ...(prev.specifications || {}), [key]: value } }));
                  const spec = formData.specifications || {};
                  const APPLICATIONS = ['home', 'office', 'retail', 'hotel', 'restaurant', 'hospital', 'school', 'corporate', 'industrial', 'institutional'];
                  const Toggle = ({ label, checked, onChange }) => (
                    <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer">
                      <input type="checkbox" checked={!!checked} onChange={(e) => onChange(e.target.checked)} className="rounded border-gray-300" />
                      {label}
                    </label>
                  );
                  return (
                    <div className="space-y-6 pt-6 border-t border-soft-oatmeal/50">
                      <h3 className="text-xs font-black text-warm-sand uppercase tracking-widest">Product Details</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="space-y-2"><label className={labelCls}>Colour</label><input type="text" value={formData.color} onChange={(e) => setFormData({ ...formData, color: e.target.value })} className={inputCls} /></div>
                        <div className="space-y-2"><label className={labelCls}>Thickness</label><input type="text" placeholder="e.g. 12 mm" value={formData.thickness} onChange={(e) => setFormData({ ...formData, thickness: e.target.value })} className={inputCls} /></div>
                        <div className="space-y-2"><label className={labelCls}>Weight (kg)</label><input type="number" step="any" value={formData.weight} onChange={(e) => setFormData({ ...formData, weight: e.target.value })} className={inputCls} /></div>
                        <div className="space-y-2"><label className={labelCls}>GST Rate (%)</label><input type="number" step="any" value={formData.gstRate} onChange={(e) => setFormData({ ...formData, gstRate: e.target.value })} className={inputCls} /></div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="space-y-2"><label className={labelCls}>Seller B2B Price (₹)</label><input type="number" value={formData.sellerB2bPrice} onChange={(e) => setFormData({ ...formData, sellerB2bPrice: e.target.value, b2bPrice: Math.round(Number(e.target.value) * (1 + (Number(formData.b2bAdminCommission) || 0) / 100)) || '' })} className={inputCls} /></div>
                        <div className="space-y-2"><label className={labelCls}>B2B Commission (%)</label><input type="number" step="any" value={formData.b2bAdminCommission} onChange={(e) => setFormData({ ...formData, b2bAdminCommission: e.target.value, b2bPrice: Math.round(Number(formData.sellerB2bPrice) * (1 + (Number(e.target.value) || 0) / 100)) || '' })} className={inputCls} /></div>
                        <div className="space-y-2"><label className={labelCls}>Final B2B Price (₹)</label><input type="number" value={formData.b2bPrice} readOnly title="Calculated from Seller B2B Price and commission" className={inputCls + ' opacity-70'} /></div>
                        <div className="space-y-2"><label className={labelCls}>B2B Min Qty</label><input type="number" value={formData.b2bMinQty} onChange={(e) => setFormData({ ...formData, b2bMinQty: e.target.value })} className={inputCls} /></div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <label className={labelCls}>Stock Status</label>
                          <select value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: e.target.value })} className={inputCls}>
                            {['in_stock', 'limited_stock', 'made_to_order', 'pre_order', 'available_on_request', 'out_of_stock'].map(v => <option key={v} value={v}>{v.replace(/_/g, ' ')}</option>)}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className={labelCls}>Room Type</label>
                          <select value={formData.roomType} onChange={(e) => setFormData({ ...formData, roomType: e.target.value })} className={inputCls}>
                            <option value="">Not specified</option>
                            {['living', 'bedroom', 'bathroom', 'kitchen', 'office', 'dining', 'outdoor'].map(v => <option key={v} value={v}>{v}</option>)}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className={labelCls}>Grade</label>
                          <select value={spec.grade || 'residential'} onChange={(e) => setSpec('grade', e.target.value)} className={inputCls}>
                            {['residential', 'commercial', 'industrial'].map(v => <option key={v} value={v}>{v}</option>)}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[['finish', 'Finish'], ['pattern', 'Pattern'], ['warranty', 'Warranty'], ['model', 'Model / Series'], ['fireRating', 'Fire Rating'], ['waterproofRating', 'Waterproof Rating'], ['maintenanceRequirements', 'Maintenance'], ['size', 'Size'], ['sku', 'Spec SKU'], ['Brand', 'Spec Brand'], ['installationCost', 'Installation Cost (₹)']].map(([key, label]) => (
                          <div key={key} className="space-y-2"><label className={labelCls}>{label}</label><input type="text" value={spec[key] || ''} onChange={(e) => setSpec(key, e.target.value)} className={inputCls} /></div>
                        ))}
                      </div>

                      <div className="flex flex-wrap gap-x-6 gap-y-3">
                        <Toggle label="Waterproof" checked={spec.waterproof} onChange={(v) => setSpec('waterproof', v)} />
                        <Toggle label="Fire proof" checked={spec.fireProof} onChange={(v) => setSpec('fireProof', v)} />
                        <Toggle label="Anti-slip" checked={spec.antiSlip} onChange={(v) => setSpec('antiSlip', v)} />
                        <Toggle label="Dust proof" checked={spec.dustProof} onChange={(v) => setSpec('dustProof', v)} />
                        <Toggle label="Eco friendly" checked={spec.ecoFriendly} onChange={(v) => setSpec('ecoFriendly', v)} />
                        <Toggle label="Sustainable material" checked={spec.sustainableMaterial} onChange={(v) => setSpec('sustainableMaterial', v)} />
                        <Toggle label="Needs professional installation" checked={spec.requiresProfessionalInstallation} onChange={(v) => setSpec('requiresProfessionalInstallation', v)} />
                      </div>

                      <div className="space-y-2">
                        <label className={labelCls}>Suitable for projects</label>
                        <div className="flex flex-wrap gap-x-5 gap-y-2">
                          {APPLICATIONS.map(app => (
                            <Toggle
                              key={app}
                              label={app}
                              checked={formData.projectApplication.includes(app)}
                              onChange={(v) => setFormData(prev => ({ ...prev, projectApplication: v ? [...prev.projectApplication, app] : prev.projectApplication.filter(a => a !== app) }))}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                        <Toggle label="Active (visible to customers)" checked={formData.isActive} onChange={(v) => setFormData({ ...formData, isActive: v })} />
                        <Toggle label="Cash on delivery allowed" checked={formData.isCodAllowed} onChange={(v) => setFormData({ ...formData, isCodAllowed: v })} />
                        <Toggle label="Professional grade" checked={formData.professionalGrade} onChange={(v) => setFormData({ ...formData, professionalGrade: v })} />
                        <Toggle label="Samples available" checked={formData.sampleAvailable} onChange={(v) => setFormData({ ...formData, sampleAvailable: v })} />
                        {formData.sampleAvailable && (
                          <div className="flex items-center gap-2">
                            <span className={labelCls}>Sample charge (₹)</span>
                            <input type="number" min="0" value={formData.sampleCharge} onChange={(e) => setFormData({ ...formData, sampleCharge: e.target.value })} className={inputCls + ' w-28'} />
                          </div>
                        )}
                      </div>

                      <div className="space-y-4 pt-4 border-t border-soft-oatmeal/30">
                        <h3 className="text-xs font-black text-warm-sand uppercase tracking-widest">SEO</h3>
                        <div className="space-y-2">
                          <label className={labelCls}>Meta title <span className="normal-case font-medium">({(formData.metaTitle || '').length}/70)</span></label>
                          <input type="text" maxLength={70} value={formData.metaTitle} onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })} className={inputCls} />
                        </div>
                        <div className="space-y-2">
                          <label className={labelCls}>Meta description <span className="normal-case font-medium">({(formData.metaDescription || '').length}/170)</span></label>
                          <textarea rows={2} maxLength={170} value={formData.metaDescription} onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })} className={inputCls + ' resize-none'} />
                        </div>
                        <div className="space-y-2">
                          <label className={labelCls}>SEO keywords (comma separated)</label>
                          <textarea rows={2} value={formData.seoKeywordsText} onChange={(e) => setFormData({ ...formData, seoKeywordsText: e.target.value })} className={inputCls + ' resize-none'} />
                        </div>
                        <div className="space-y-2">
                          <label className={labelCls}>Tags (comma separated)</label>
                          <textarea rows={2} value={formData.tagsText} onChange={(e) => setFormData({ ...formData, tagsText: e.target.value })} className={inputCls + ' resize-none'} />
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Dimensions: Length x Width/Depth x Height */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-warm-sand uppercase tracking-widest">Dimensions (L × W/D × H)</label>
                  <DimensionsInput
                    value={formData.dimensions}
                    onChange={(v) => setFormData(prev => ({ ...prev, dimensions: v }))}
                    categoryText={`${formData.name || ''} ${formData.category || ''} ${formData.subcategory || ''}`}
                  />
                </div>

                {/* Specifications & Variants (colour, size, etc.) */}
                <ProductVariantsEditor formData={formData} setFormData={setFormData} categories={categories} />

                {/* Delivery & Payment Options */}
                <div className="space-y-6 pt-6 border-t border-soft-oatmeal/50">
                  <DeliveryOptionsForm formData={formData} handleFieldChange={(field, value) => setFormData({...formData, [field]: value})} />
                  <PaymentOptionsForm formData={formData} handleFieldChange={(field, value) => setFormData({...formData, [field]: value})} />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-warm-sand uppercase tracking-widest">Short description <span className="normal-case font-medium">({(formData.shortDescription || '').length}/300)</span></label>
                  <textarea rows={2} maxLength={300} value={formData.shortDescription} onChange={(e) => setFormData({...formData, shortDescription: e.target.value})} className="w-full bg-soft-oatmeal/10 border border-soft-oatmeal rounded-xl px-4 py-3 text-sm focus:outline-none resize-none" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-warm-sand uppercase tracking-widest">Approval status</label>
                    <select value={formData.approvalStatus} onChange={(e) => setFormData({...formData, approvalStatus: e.target.value})} className="w-full bg-soft-oatmeal/10 border border-soft-oatmeal rounded-xl px-4 py-3 text-sm focus:outline-none">
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                  {formData.approvalStatus === 'rejected' && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-warm-sand uppercase tracking-widest">Rejection reason</label>
                      <input type="text" value={formData.rejectionReason} onChange={(e) => setFormData({...formData, rejectionReason: e.target.value})} className="w-full bg-soft-oatmeal/10 border border-soft-oatmeal rounded-xl px-4 py-3 text-sm focus:outline-none" />
                    </div>
                  )}
                </div>

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
