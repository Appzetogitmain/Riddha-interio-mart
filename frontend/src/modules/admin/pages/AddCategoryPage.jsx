import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import PageWrapper from '../components/PageWrapper';
import { FiArrowLeft, FiPlus, FiTrash2, FiImage, FiSave, FiUploadCloud, FiCheck } from 'react-icons/fi';
import * as LuIcons from 'react-icons/lu';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../../shared/utils/api';
import { uploadImage } from '../../../shared/utils/upload';

const PRESET_ICONS = [
  { name: 'LuSofa', label: 'Furniture' },
  { name: 'LuLampFloor', label: 'Lighting' },
  { name: 'LuLayoutGrid', label: 'Wall Solutions' },
  { name: 'LuFlower2', label: 'Decor' },
  { name: 'LuHammer', label: 'Hardware' },
  { name: 'LuChefHat', label: 'Modular Kitchen' },
  { name: 'LuBath', label: 'Bathroom' },
  { name: 'LuBriefcase', label: 'Office' },
  { name: 'LuUmbrella', label: 'Outdoor' }
];

const AddCategoryPage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const iconInputRef = useRef(null);

  const [category, setCategory] = useState({
    name: '',
    image: '',
    description: '',
    defaultGstRate: 18,
  });

  const [categoryIcon, setCategoryIcon] = useState('');
  const [iconFile, setIconFile] = useState(null);
  const [customIconPreview, setCustomIconPreview] = useState('');

  const [subcategories, setSubcategories] = useState([{ name: '', image: '', subsubcategories: [] }]);
  const [attributes, setAttributes] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [saveError, setSaveError] = useState('');

  const handleAddAttribute = () => {
    setAttributes([...attributes, { name: '', type: 'text', options: '', isVariant: false }]);
  };

  const handleRemoveAttribute = (index) => {
    setAttributes(attributes.filter((_, i) => i !== index));
  };

  const handleAttributeChange = (index, field, value) => {
    const newAttrs = [...attributes];
    newAttrs[index][field] = value;
    setAttributes(newAttrs);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImgFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCategory(prev => ({ ...prev, image: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleIconUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setIconFile(file);
      setCategoryIcon(''); // Clear preset if uploading custom
      const reader = new FileReader();
      reader.onloadend = () => {
        setCustomIconPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const [imgFile, setImgFile] = useState(null);
  const [subImgFiles, setSubImgFiles] = useState({});

  const handleAddSubcategory = () => {
    setSubcategories([...subcategories, { name: '', image: '', subsubcategories: [] }]);
  };

  const handleRemoveSubcategory = (index) => {
    setSubcategories(subcategories.filter((_, i) => i !== index));
  };

  const handleSubChange = (index, field, value) => {
    const newSubs = [...subcategories];
    newSubs[index][field] = value;
    setSubcategories(newSubs);
  };

  const handleSubImageUpload = (e, index) => {
    const file = e.target.files[0];
    if (file) {
      setSubImgFiles(prev => ({ ...prev, [index]: file }));
      const reader = new FileReader();
      reader.onloadend = () => handleSubChange(index, 'image', reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveError('');

    try {
      // 1. Upload main category image
      let mainImageUrl = category.image;
      if (imgFile) {
        mainImageUrl = await uploadImage(imgFile);
      }

      // 1.5. Upload custom icon if selected
      let finalIcon = categoryIcon;
      if (iconFile) {
        finalIcon = await uploadImage(iconFile);
      }

      // 2. Upload subcategory images
      const updatedSubcategories = await Promise.all(
        subcategories.map(async (sub, index) => {
          if (sub.name.trim() === '') return null;
          let subImgUrl = sub.image;
          if (subImgFiles[index]) {
            subImgUrl = await uploadImage(subImgFiles[index]);
          }
          return { 
            name: sub.name, 
            image: subImgUrl, 
            subsubcategories: sub.subsubcategories || [] 
          };
        })
      );

      const formattedAttributes = attributes.map(attr => ({
        ...attr,
        options: attr.type === 'select' ? attr.options.split(',').map(o => o.trim()).filter(o => o) : []
      })).filter(attr => attr.name.trim() !== '');

      const categoryData = {
        name: category.name,
        description: category.description,
        image: mainImageUrl,
        icon: finalIcon,
        subcategories: updatedSubcategories.filter(s => s !== null),
        attributes: formattedAttributes,
        defaultGstRate: Number(category.defaultGstRate) || 18
      };

      const response = await api.post('/categories', categoryData);

      if (response.data.success) {
        setIsSaving(false);
        setIsSaved(true);
        
        setTimeout(() => {
          navigate('/admin/manage-categories');
        }, 1000);
      }
    } catch (err) {
      console.error('Save failed:', err);
      setSaveError(err.response?.data?.error || 'Failed to save category. Please check your data or image size.');
      setIsSaving(false);
    }
  };

  // Render current selected icon preview dynamically
  const renderIconPreview = () => {
    if (customIconPreview) {
      return <img src={customIconPreview} alt="Icon Preview" className="w-8 h-8 object-contain" />;
    }
    if (categoryIcon) {
      const IconComponent = LuIcons[categoryIcon] || LuIcons.LuShapes;
      return <IconComponent size={32} className="text-deep-espresso" />;
    }
    return <LuIcons.LuShapes size={32} className="text-warm-sand opacity-40" />;
  };

  return (
    <PageWrapper>
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4 px-1 md:px-0">
          <button 
            onClick={() => navigate('/admin/manage-categories')}
            className="p-2.5 md:p-3 bg-white rounded-xl md:rounded-2xl border border-soft-oatmeal text-warm-sand hover:text-deep-espresso hover:shadow-md transition-all shadow-sm"
          >
            <FiArrowLeft size={18} />
          </button>
          <div className="min-w-0">
            <h1 className="text-xl md:text-2xl lg:text-3xl font-display font-bold text-deep-espresso truncate">Create Category</h1>
            <p className="text-warm-sand text-[10px] md:text-sm font-medium tracking-tight">Define a new top-level category collection.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-4 md:space-y-6">
            <div className="bg-white p-6 md:p-10 rounded-3xl md:rounded-[40px] border border-soft-oatmeal shadow-sm space-y-6 md:space-y-8">
              <h3 className="text-base md:text-lg font-black text-deep-espresso border-b border-soft-oatmeal pb-4 uppercase tracking-[0.1em]">General Information</h3>
              
              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-warm-sand uppercase tracking-widest pl-1">Category Name</label>
                  <input 
                    required
                    type="text" 
                    value={category.name}
                    onChange={(e) => setCategory({...category, name: e.target.value})}
                    placeholder="e.g. Luxury Lighting"
                    className="w-full bg-soft-oatmeal/10 border border-soft-oatmeal rounded-xl md:rounded-2xl px-5 py-4 md:px-6 md:py-5 text-sm focus:outline-none focus:ring-2 focus:ring-warm-sand/20 focus:bg-white transition-all font-medium" 
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-warm-sand uppercase tracking-widest pl-1">Description</label>
                  <textarea 
                    rows="4"
                    value={category.description}
                    onChange={(e) => setCategory({...category, description: e.target.value})}
                    placeholder="Describe the aesthetic..."
                    className="w-full bg-soft-oatmeal/10 border border-soft-oatmeal rounded-xl md:rounded-2xl px-5 py-4 md:px-6 md:py-5 text-sm focus:outline-none focus:ring-2 focus:ring-warm-sand/20 focus:bg-white transition-all font-medium resize-none" 
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-warm-sand uppercase tracking-widest pl-1">Default GST Rate (%)</label>
                  <input 
                    required
                    type="number" 
                    min="0"
                    max="100"
                    step="0.01"
                    value={category.defaultGstRate}
                    onChange={(e) => setCategory({...category, defaultGstRate: e.target.value})}
                    placeholder="e.g. 18"
                    className="w-full bg-soft-oatmeal/10 border border-soft-oatmeal rounded-xl md:rounded-2xl px-5 py-4 md:px-6 md:py-5 text-sm focus:outline-none focus:ring-2 focus:ring-warm-sand/20 focus:bg-white transition-all font-medium" 
                  />
                </div>
              </div>
            </div>

            {/* Icon Selection Card */}
            <div className="bg-white p-6 md:p-10 rounded-3xl md:rounded-[40px] border border-soft-oatmeal shadow-sm space-y-6 md:space-y-8">
              <h3 className="text-base md:text-lg font-black text-deep-espresso border-b border-soft-oatmeal pb-4 uppercase tracking-[0.1em]">Category Icon Management</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Live Preview Container */}
                <div className="flex flex-col items-center justify-center p-6 bg-soft-oatmeal/10 border border-soft-oatmeal rounded-2xl">
                  <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center border border-soft-oatmeal/40 mb-3">
                    {renderIconPreview()}
                  </div>
                  <span className="text-[9px] font-black text-warm-sand uppercase tracking-widest">Selected Icon</span>
                </div>

                {/* Custom Upload widget */}
                <div className="md:col-span-2 space-y-4">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-warm-sand uppercase tracking-widest block pl-1">Option A: Custom SVG / PNG Upload</label>
                    <input 
                      type="file" 
                      ref={iconInputRef}
                      onChange={handleIconUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => iconInputRef.current.click()}
                      className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-white border border-soft-oatmeal hover:bg-soft-oatmeal/10 transition-colors rounded-xl text-[10px] font-black uppercase tracking-[0.2em] text-deep-espresso shadow-sm"
                    >
                      <FiUploadCloud size={16} />
                      {iconFile ? 'Change Graphic File' : 'Upload Graphic Icon'}
                    </button>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-warm-sand uppercase tracking-widest block pl-1">Option B: Custom Lucide Code</label>
                    <input 
                      type="text" 
                      placeholder="Search or enter Lucide code (e.g. Sofa, Hammer)..."
                      value={categoryIcon}
                      onChange={(e) => {
                        setCategoryIcon(e.target.value);
                        setIconFile(null);
                        setCustomIconPreview('');
                      }}
                      className="w-full bg-soft-oatmeal/10 border border-soft-oatmeal rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-warm-sand/20 focus:bg-white transition-all font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* Pre-curated Grid */}
              <div className="space-y-3">
                <label className="text-[9px] font-black text-warm-sand uppercase tracking-widest block pl-1">Or Quick Select Pre-curated Lucide Icons</label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                  {PRESET_ICONS.map((ico) => {
                    const IconComp = LuIcons[ico.name] || LuIcons.LuShapes;
                    const isSelected = categoryIcon === ico.name;
                    return (
                      <button
                        key={ico.name}
                        type="button"
                        onClick={() => {
                          setCategoryIcon(ico.name);
                          setIconFile(null);
                          setCustomIconPreview('');
                        }}
                        className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all ${
                          isSelected
                            ? 'bg-deep-espresso text-white border-deep-espresso shadow-md'
                            : 'bg-soft-oatmeal/10 border-soft-oatmeal hover:bg-soft-oatmeal/20 text-warm-sand'
                        }`}
                      >
                        <IconComp size={20} />
                        <span className="text-[7.5px] font-black uppercase tracking-widest mt-1.5 truncate max-w-full">
                          {ico.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Subcategories */}
            <div className="bg-white p-6 md:p-10 rounded-3xl md:rounded-[40px] border border-soft-oatmeal shadow-sm space-y-6 md:space-y-8">
              <div className="flex items-center justify-between border-b border-soft-oatmeal pb-4">
                <h3 className="text-base md:text-lg font-black text-deep-espresso uppercase tracking-[0.1em]">Subcategories</h3>
                <button 
                  type="button"
                  onClick={handleAddSubcategory}
                  className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-dusty-cocoa hover:text-deep-espresso transition-colors px-4 py-2 border border-soft-oatmeal rounded-full hover:bg-white shadow-sm"
                >
                  <FiPlus /> Add new
                </button>
              </div>

              <div className="space-y-4">
                <AnimatePresence initial={false}>
                  {subcategories.map((sub, index) => (
                    <motion.div 
                      key={index}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="flex flex-col gap-4 p-4 md:p-6 bg-soft-oatmeal/5 rounded-2xl md:rounded-[24px] border border-soft-oatmeal/50 relative group hover:bg-white hover:shadow-xl hover:shadow-soft-oatmeal/20 transition-all duration-300"
                    >
                      <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                           <label className="text-[8px] font-black text-warm-sand uppercase tracking-widest pl-1">Subcategory Name</label>
                           <input 
                              type="text" 
                              placeholder="e.g. Chandeliers"
                              value={sub.name}
                              onChange={(e) => handleSubChange(index, 'name', e.target.value)}
                              className="w-full bg-white border border-soft-oatmeal rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-warm-sand/20 transition-all font-semibold"
                           />
                        </div>
                        <div className="space-y-1.5">
                           <div className="flex items-center justify-between">
                             <label className="text-[8px] font-black text-warm-sand uppercase tracking-widest pl-1">Thumbnail Media</label>
                             <button 
                               type="button"
                               onClick={() => document.getElementById(`sub-img-${index}`).click()}
                               className="text-[8px] font-black uppercase tracking-widest text-deep-espresso hover:underline"
                             >
                               Upload
                             </button>
                           </div>
                           <input 
                              type="file" id={`sub-img-${index}`} className="hidden" 
                              onChange={(e) => handleSubImageUpload(e, index)} accept="image/*"
                           />
                           <input 
                              type="text" 
                              placeholder="URL or upload file..."
                              value={sub.image}
                              onChange={(e) => handleSubChange(index, 'image', e.target.value)}
                              className="w-full bg-white border border-soft-oatmeal rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-warm-sand/20 transition-all"
                           />
                        </div>

                        {/* Sub-subcategories nested section */}
                        <div className="col-span-1 md:col-span-2 pt-4 border-t border-soft-oatmeal/40">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-[9px] font-black uppercase tracking-widest text-deep-espresso pl-1">Sub-subcategories</h4>
                            <div className="flex items-center gap-2">
                              <input 
                                type="text"
                                id={`new-subsub-${index}`}
                                placeholder="Add nested sub-subcategory..."
                                className="bg-white border border-soft-oatmeal rounded-xl px-3 py-2 text-[10px] focus:outline-none w-48 font-medium shadow-inner"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    const val = e.target.value.trim();
                                    if (val) {
                                      const updated = subcategories.map((s, sIdx) => {
                                        if (sIdx === index) {
                                          return {
                                            ...s,
                                            subsubcategories: [...(s.subsubcategories || []), { name: val, image: '' }]
                                          };
                                        }
                                        return s;
                                      });
                                      setSubcategories(updated);
                                      e.target.value = '';
                                    }
                                  }
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const input = document.getElementById(`new-subsub-${index}`);
                                  const val = input.value.trim();
                                  if (val) {
                                    const updated = subcategories.map((s, sIdx) => {
                                      if (sIdx === index) {
                                        return {
                                          ...s,
                                          subsubcategories: [...(s.subsubcategories || []), { name: val, image: '' }]
                                        };
                                      }
                                      return s;
                                    });
                                    setSubcategories(updated);
                                    input.value = '';
                                  }
                                }}
                                className="p-2 bg-soft-oatmeal/20 rounded-xl text-deep-espresso hover:bg-soft-oatmeal/40 transition-colors"
                              >
                                <FiPlus size={12} />
                              </button>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2 pt-1">
                            {sub.subsubcategories && sub.subsubcategories.map((subsub, ssIdx) => (
                              <div key={ssIdx} className="flex items-center gap-1.5 px-3 py-1.5 bg-soft-oatmeal/30 border border-soft-oatmeal/60 rounded-full text-[10px] font-bold text-warm-sand">
                                <span>{subsub.name}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = subcategories.map((s, sIdx) => {
                                      if (sIdx === index) {
                                        return {
                                          ...s,
                                          subsubcategories: (s.subsubcategories || []).filter((_, ss) => ss !== ssIdx)
                                        };
                                      }
                                      return s;
                                    });
                                    setSubcategories(updated);
                                  }}
                                  className="text-red-400 hover:text-red-600 transition-colors ml-1 font-bold text-xs"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                            {(!sub.subsubcategories || sub.subsubcategories.length === 0) && (
                              <p className="text-[9px] font-medium text-warm-sand italic pl-1">No sub-subcategories added yet. Press Enter or click + to add.</p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-end justify-end pb-1 border-t border-soft-oatmeal/40 pt-3 md:border-none md:pt-0">
                        <button 
                           type="button"
                           onClick={() => handleRemoveSubcategory(index)}
                           className="p-3 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                        >
                           <FiTrash2 size={16} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            {/* Attributes */}
            <div className="bg-white p-6 md:p-10 rounded-3xl md:rounded-[40px] border border-soft-oatmeal shadow-sm space-y-6 md:space-y-8 mt-8">
              <div className="flex items-center justify-between border-b border-soft-oatmeal pb-4">
                <div>
                  <h3 className="text-base md:text-lg font-black text-deep-espresso uppercase tracking-[0.1em]">Category Attributes</h3>
                  <p className="text-[10px] md:text-xs text-warm-sand font-medium mt-1">Define fields (like Size, Color, Dimensions) that sellers must fill for this category.</p>
                </div>
                <button 
                  type="button"
                  onClick={handleAddAttribute}
                  className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-dusty-cocoa hover:text-deep-espresso transition-colors px-4 py-2 border border-soft-oatmeal rounded-full hover:bg-white shadow-sm"
                >
                  <FiPlus /> Add new
                </button>
              </div>

              <div className="space-y-4">
                <AnimatePresence initial={false}>
                  {attributes.map((attr, index) => (
                    <motion.div 
                      key={index}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="flex flex-col gap-4 p-4 md:p-6 bg-soft-oatmeal/5 rounded-2xl md:rounded-[24px] border border-soft-oatmeal/50 relative group hover:bg-white hover:shadow-xl hover:shadow-soft-oatmeal/20 transition-all duration-300"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div className="space-y-1.5 md:col-span-1">
                           <label className="text-[8px] font-black text-warm-sand uppercase tracking-widest pl-1">Attribute Name</label>
                           <input 
                              type="text" 
                              placeholder="e.g. Dimensions"
                              value={attr.name}
                              onChange={(e) => handleAttributeChange(index, 'name', e.target.value)}
                              className="w-full bg-white border border-soft-oatmeal rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-warm-sand/20 transition-all font-semibold"
                           />
                        </div>
                        <div className="space-y-1.5 md:col-span-1">
                           <label className="text-[8px] font-black text-warm-sand uppercase tracking-widest pl-1">Field Type</label>
                           <select 
                              value={attr.type}
                              onChange={(e) => handleAttributeChange(index, 'type', e.target.value)}
                              className="w-full bg-white border border-soft-oatmeal rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-warm-sand/20 transition-all font-semibold"
                           >
                             <option value="text">Text / String</option>
                             <option value="number">Number</option>
                             <option value="select">Dropdown (Select)</option>
                           </select>
                        </div>
                        <div className="space-y-1.5 md:col-span-1">
                           <label className="flex items-center gap-2 mt-[28px] cursor-pointer pl-1">
                             <input 
                               type="checkbox"
                               checked={attr.isVariant}
                               onChange={(e) => handleAttributeChange(index, 'isVariant', e.target.checked)}
                               className="rounded border-soft-oatmeal text-deep-espresso focus:ring-deep-espresso"
                             />
                             <span className="text-[10px] font-black text-warm-sand uppercase tracking-widest">Is Variant?</span>
                           </label>
                        </div>
                        <div className="flex justify-end items-center md:col-span-1">
                           <button 
                             type="button"
                             onClick={() => handleRemoveAttribute(index)}
                             className="p-3 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                           >
                              <FiTrash2 size={16} />
                           </button>
                        </div>
                      </div>
                      
                      {attr.type === 'select' && (
                        <div className="space-y-1.5 pt-2 border-t border-soft-oatmeal/40 mt-2">
                           <label className="text-[8px] font-black text-warm-sand uppercase tracking-widest pl-1">Dropdown Options (Comma-Separated)</label>
                           <input 
                              type="text" 
                              placeholder="e.g. Red, Blue, Green"
                              value={attr.options}
                              onChange={(e) => handleAttributeChange(index, 'options', e.target.value)}
                              className="w-full bg-white border border-soft-oatmeal rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-warm-sand/20 transition-all font-semibold"
                           />
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
                {attributes.length === 0 && (
                  <p className="text-[10px] font-medium text-warm-sand italic pl-1 text-center py-6 border border-dashed border-soft-oatmeal rounded-2xl">No custom attributes defined.</p>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar / Media */}
          <div className="space-y-6">
            <div className="bg-white p-6 md:p-8 rounded-3xl md:rounded-[40px] border border-soft-oatmeal shadow-sm space-y-6 md:space-y-8 sticky top-24">
              <h3 className="text-base md:text-lg font-black text-deep-espresso border-b border-soft-oatmeal pb-4 uppercase tracking-[0.1em]">Banner Media</h3>
              
              <div className="space-y-6">
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="hidden"
                />
                <div 
                  onClick={() => fileInputRef.current.click()}
                  className="aspect-[4/5] bg-soft-oatmeal/10 rounded-[32px] border-2 border-dashed border-soft-oatmeal overflow-hidden relative group cursor-pointer hover:border-warm-sand/50 hover:bg-soft-oatmeal/20 transition-all"
                >
                  {category.image ? (
                    <img 
                      src={category.image} 
                      alt="Preview" 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-warm-sand p-6 text-center">
                      <div className="w-16 h-16 bg-soft-oatmeal/20 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-warm-sand/10 transition-colors">
                        <FiUploadCloud size={32} className="opacity-40" />
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1">Click to Upload</p>
                      <p className="text-[9px] font-medium opacity-60 leading-relaxed italic max-w-40 mx-auto">Upload a high-resolution banner image for the homepage.</p>
                    </div>
                  )}
                  {category.image && (
                    <div className="absolute inset-0 bg-deep-espresso/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                       <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Change Media</span>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <p className="text-[10px] font-black text-warm-sand uppercase tracking-widest pl-1">Media Format</p>
                  <p className="px-4 py-3 bg-soft-oatmeal/10 rounded-xl text-[10px] font-medium text-warm-sand border border-soft-oatmeal/50">
                    Supports JPG, PNG, WEBP. Recommended Aspect Ratio: 4:5
                  </p>
                </div>
              </div>

              <div className="pt-4">
                {saveError && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-red-50 border border-red-100 rounded-2xl text-[10px] font-bold text-red-500 text-center leading-relaxed mb-4"
                  >
                    {saveError}
                  </motion.div>
                )}

                <button 
                  type="submit"
                  disabled={isSaving || isSaved}
                  className={`w-full flex items-center justify-center gap-3 py-5 rounded-[24px] font-black uppercase tracking-[0.2em] text-xs transition-all active:scale-95 shadow-xl ${
                    isSaved ? 'bg-emerald-500 text-white' : 
                    isSaving ? 'bg-dusty-cocoa text-white' : 
                    'bg-deep-espresso text-white hover:bg-dusty-cocoa hover:shadow-deep-espresso/20'
                  }`}
                >
                  {isSaved ? (
                    <>
                      <FiCheck size={18} />
                      Category Saved
                    </>
                  ) : isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <FiSave size={18} />
                      Save Category
                    </>
                  )}
                </button>
                <button 
                  type="button"
                  onClick={() => navigate('/admin/manage-categories')}
                  className="w-full mt-4 py-3 text-[10px] font-black uppercase tracking-[0.25em] text-warm-sand hover:text-red-500 transition-colors text-center"
                >
                  Discard Changes
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </PageWrapper>
  );
};

export default AddCategoryPage;
