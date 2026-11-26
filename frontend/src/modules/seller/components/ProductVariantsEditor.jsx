import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Settings, Info, ImagePlus, Sparkles } from 'lucide-react';
import api from '../../../shared/utils/api';
import { formatSpecLabel } from '../../../shared/utils/textFormat';

const ProductVariantsEditor = ({ formData, setFormData, categories }) => {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [preview, setPreview] = useState(null); // { images, index }

  useEffect(() => {
    if (formData.category && categories.length > 0) {
      // formData.category could be name or ID. Let's find it.
      const cat = categories.find(c => c.name === formData.category || c._id === formData.category);
      setSelectedCategory(cat);
    }
  }, [formData.category, categories]);

  const [customAttributes, setCustomAttributes] = useState([]);
  const [newAttrName, setNewAttrName] = useState('');
  const [newAttrIsVariant, setNewAttrIsVariant] = useState(false);

  const attributes = [...(selectedCategory?.attributes || []), ...customAttributes];
  const hasVariants = attributes.some(attr => attr.isVariant);

  const addVariant = () => {
    setFormData(prev => ({
      ...prev,
      variants: [...(prev.variants || []), { sku: '', price: '', discountPrice: '', countInStock: '', attributes: {} }]
    }));
  };

  const removeVariant = (index) => {
    setFormData(prev => {
      const newVariants = [...(prev.variants || [])];
      newVariants.splice(index, 1);
      return { ...prev, variants: newVariants };
    });
  };

  const handleVariantChange = (index, field, value) => {
    setFormData(prev => {
      const newVariants = [...(prev.variants || [])];
      newVariants[index] = { ...newVariants[index], [field]: value };
      return { ...prev, variants: newVariants };
    });
  };

  const handleVariantAttributeChange = (index, attrName, value) => {
    setFormData(prev => {
      const newVariants = [...(prev.variants || [])];
      newVariants[index] = {
        ...newVariants[index],
        attributes: {
          ...(newVariants[index].attributes || {}),
          [attrName]: value
        }
      };
      return { ...prev, variants: newVariants };
    });
  };

  const [uploadingIndex, setUploadingIndex] = useState(null);
  const [variantImageMsg, setVariantImageMsg] = useState('');

  // Categories without variant attributes still get a Colour column, so a seller can always
  // create colour variants (the storefront shows one option per distinct value).
  const categoryVariantAttributes = attributes.filter(a => a.isVariant);
  // Attribute names already saved on this product's variants (e.g. "Color", "Size") must
  // always get a column, even if the category doesn't define them as variant attributes.
  const savedVariantAttrNames = Array.from(new Set(
    (formData.variants || []).flatMap(v => Object.keys(v.attributes || {}))
  ));
  const baseVariantAttributes = categoryVariantAttributes.length > 0
    ? categoryVariantAttributes
    : (savedVariantAttrNames.length > 0 ? [] : [{ name: 'Colour', type: 'text', isVariant: true }]);
  const variantAttributes = [
    ...baseVariantAttributes,
    ...savedVariantAttrNames
      .filter(n => !baseVariantAttributes.some(a => a.name === n))
      .map(n => ({ name: n, type: 'text', isVariant: true })),
  ];
  const generalAttributesBase = attributes.filter(a => !a.isVariant);
  const dynamicKeys = formData.dynamicAttributes ? Object.keys(formData.dynamicAttributes) : [];
  const existingAttrNames = attributes.map(a => a.name);
  const extraAttrs = dynamicKeys
    .filter(key => !existingAttrNames.includes(key))
    .map(key => ({ name: key, type: 'text', isVariant: false }));
  const generalAttributes = [...generalAttributesBase, ...extraAttrs];
  const MAX_VARIANT_IMAGES = 10;
  const getVariantImages = (v) => (v?.images?.length ? v.images : (v?.image ? [v.image] : []));

  const handleVariantImageUpload = async (index, fileList) => {
    let files = Array.from(fileList || []);
    if (files.length === 0) return;
    const current = getVariantImages(formData.variants?.[index]);
    const room = MAX_VARIANT_IMAGES - current.length;
    if (room <= 0) {
      setVariantImageMsg(`Maximum ${MAX_VARIANT_IMAGES} images per variant.`);
      return;
    }
    if (files.length > room) {
      files = files.slice(0, room);
      setVariantImageMsg(`Only ${room} more image(s) allowed - extra files were skipped (max ${MAX_VARIANT_IMAGES}).`);
    } else {
      setVariantImageMsg('');
    }
    try {
      setUploadingIndex(index);
      const uploadData = new FormData();
      files.forEach(f => uploadData.append('images', f));
      const { data } = await api.post('/upload/bulk', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const urls = data.images || [];
      if (urls.length) {
        setFormData(prev => {
          const variants = [...(prev.variants || [])];
          const images = [...getVariantImages(variants[index]), ...urls].slice(0, MAX_VARIANT_IMAGES);
          variants[index] = { ...variants[index], images, image: images[0] };
          return { ...prev, variants };
        });
      }
    } catch (err) {
      console.error('Variant image upload failed:', err);
      setVariantImageMsg('Image upload failed. Please try again.');
    } finally {
      setUploadingIndex(null);
    }
  };

  // ---- AI: generate extra images for ONE variant from that variant's own first image ----
  const [aiVariantIdx, setAiVariantIdx] = useState(null);
  const [aiVariantCount, setAiVariantCount] = useState({});

  const handleGenerateVariantImages = async (index) => {
    const variant = formData.variants?.[index];
    const current = getVariantImages(variant);
    const source = variant?.aiSource || current[0];
    const room = MAX_VARIANT_IMAGES - current.length;
    if (!source) {
      setVariantImageMsg('Upload a source photo for this variant first, then generate related images.');
      return;
    }
    if (room <= 0) {
      setVariantImageMsg(`Maximum ${MAX_VARIANT_IMAGES} images per variant.`);
      return;
    }
    const wanted = Math.min(aiVariantCount[index] || room, room);
    try {
      setAiVariantIdx(index);
      setVariantImageMsg('');
      const { data } = await api.post('/products/ai-generate-images', {
        image: source,
        imageCount: wanted,
      }, { timeout: 600000 });
      const urls = (data?.data?.images || []).map(g => g.url).filter(Boolean);
      if (!urls.length) throw new Error('No images returned');
      setFormData(prev => {
        const variants = [...(prev.variants || [])];
        const images = [...getVariantImages(variants[index]), ...urls].slice(0, MAX_VARIANT_IMAGES);
        variants[index] = { ...variants[index], images, image: images[0] };
        return { ...prev, variants };
      });
      setVariantImageMsg(`${urls.length} AI image(s) added to this variant.`);
    } catch (err) {
      setVariantImageMsg(err.response?.data?.error || 'AI image generation failed. Please try again.');
    } finally {
      setAiVariantIdx(null);
    }
  };

  // Upload one photo that the AI will use as the source for this variant's related images.
  // It is also added to the variant's gallery.
  const handleVariantSourceUpload = async (index, file) => {
    if (!file) return;
    try {
      setUploadingIndex(index);
      setVariantImageMsg('');
      const uploadData = new FormData();
      uploadData.append('images', file);
      const { data } = await api.post('/upload/bulk', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url = (data.images || [])[0];
      if (!url) throw new Error('no url');
      setFormData(prev => {
        const variants = [...(prev.variants || [])];
        const existing = getVariantImages(variants[index]);
        const images = [url, ...existing.filter(i => i !== url)].slice(0, MAX_VARIANT_IMAGES);
        variants[index] = { ...variants[index], aiSource: url, images, image: images[0] };
        return { ...prev, variants };
      });
    } catch (err) {
      setVariantImageMsg('Source photo upload failed. Please try again.');
    } finally {
      setUploadingIndex(null);
    }
  };

  const removeVariantImage = (index, imgIdx) => {
    setFormData(prev => {
      const variants = [...(prev.variants || [])];
      const images = getVariantImages(variants[index]).filter((_, i) => i !== imgIdx);
      variants[index] = { ...variants[index], images, image: images[0] || '' };
      return { ...prev, variants };
    });
  };

  const makeVariantImagePrimary = (index, imgIdx) => {
    setFormData(prev => {
      const variants = [...(prev.variants || [])];
      const imgs = getVariantImages(variants[index]);
      const images = [imgs[imgIdx], ...imgs.filter((_, i) => i !== imgIdx)];
      variants[index] = { ...variants[index], images, image: images[0] };
      return { ...prev, variants };
    });
  };

  // ---- AI colour variants: same product, only the colour changes ----
  const PRESET_COLOURS = ['Grey', 'Beige', 'Brown', 'Black', 'White', 'Blue', 'Green', 'Red', 'Navy', 'Cream'];
  const [aiColours, setAiColours] = useState([]);
  const [aiCustomColour, setAiCustomColour] = useState('');
  const [aiSourceImage, setAiSourceImage] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMessage, setAiMessage] = useState('');

  const toggleAiColour = (colour) =>
    setAiColours(prev => prev.includes(colour) ? prev.filter(c => c !== colour) : [...prev, colour]);

  const fileToDataUrl = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const colourAttrName = variantAttributes.find(a => /colou?r/i.test(a.name))?.name || variantAttributes[0]?.name || 'Colour';

  const handleGenerateColours = async () => {
    const source = aiSourceImage || formData.images?.[0];
    if (!source) {
      setAiMessage('Upload the original product image first (or add a main product image).');
      return;
    }
    if (aiColours.length === 0) {
      setAiMessage('Select at least one colour.');
      return;
    }
    try {
      setAiLoading(true);
      setAiMessage('');
      const { data } = await api.post('/products/generate-colour-variants', {
        originalImage: source,
        colours: aiColours,
        name: formData.name,
      }, { timeout: 300000 });

      const generated = (data.variants || []).filter(v => v.image);
      setFormData(prev => {
        const variants = [...(prev.variants || [])];
        generated.forEach(({ colour, image }) => {
          const existingIdx = variants.findIndex(v => (v.attributes?.[colourAttrName] || '').toLowerCase() === colour.toLowerCase());
          if (existingIdx >= 0) {
            const old = variants[existingIdx];
            const images = [image, ...((old.images || (old.image ? [old.image] : [])).filter(i => i !== image))].slice(0, 10);
            variants[existingIdx] = { ...old, images, image };
          } else {
            variants.push({
              sku: prev.sku ? `${prev.sku}-${colour.toUpperCase().replace(/[^A-Z0-9]+/g, '')}` : '',
              price: prev.price || '',
              discountPrice: prev.discountPrice || '',
              countInStock: '',
              attributes: { [colourAttrName]: colour },
              image,
              images: [image],
            });
          }
        });
        return { ...prev, variants };
      });
      const failed = (data.variants || []).filter(v => !v.image).map(v => v.colour);
      setAiMessage(
        `${generated.length} colour variant(s) added.` +
        (failed.length ? ` Failed: ${failed.join(', ')} - try again.` : '') +
        ' Review the images, then set the stock for each.'
      );
    } catch (err) {
      setAiMessage(err.response?.data?.error || 'AI colour generation failed. Please try again.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleDynamicAttributeChange = (attrName, value) => {
    setFormData(prev => ({
      ...prev,
      dynamicAttributes: {
        ...(prev.dynamicAttributes || {}),
        [attrName]: value
      }
    }));
  };

  const handleAddCustomAttribute = () => {
    if (newAttrName.trim()) {
      setCustomAttributes(prev => [...prev, { name: newAttrName.trim(), type: 'text', isVariant: newAttrIsVariant }]);
      setNewAttrName('');
      setNewAttrIsVariant(false);
    }
  };
  return (
    <div className="space-y-6 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mt-6">
      <div className="flex items-center justify-between border-b border-gray-100 pb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#189D91]" />
            Dynamic Specifications & Variants
          </h3>
          <p className="text-xs text-gray-500 mt-1">Configure attributes for {selectedCategory?.name || 'this product'}</p>
        </div>
      </div>

      {/* Custom Attribute Adder */}
      <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-3">
        <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Add Custom Specification Column</p>
        <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
          <input
            type="text"
            placeholder="e.g. Dimensions, Thickness, Color..."
            value={newAttrName}
            onChange={(e) => setNewAttrName(e.target.value)}
            className="flex-1 w-full bg-white border border-gray-200 text-gray-900 text-xs font-semibold rounded-lg px-3 py-2.5 focus:border-[#189D91] outline-none transition-all"
          />
          <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start shrink-0">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={newAttrIsVariant}
                onChange={(e) => setNewAttrIsVariant(e.target.checked)}
                className="rounded border-gray-300 text-[#189D91] focus:ring-[#189D91]"
              />
              <span className="text-xs font-semibold text-gray-600">Variant-specific?</span>
            </label>
            <button
              type="button"
              onClick={handleAddCustomAttribute}
              disabled={!newAttrName.trim()}
              className="px-4 py-2.5 bg-[#189D91] text-white text-xs font-bold rounded-lg hover:bg-[#15887e] disabled:opacity-50 disabled:cursor-not-allowed transition-all whitespace-nowrap shadow-sm"
            >
              Add Field
            </button>
          </div>
        </div>
      </div>

      {/* General Attributes (Non-variants) */}
      {generalAttributes.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-700">General Specifications</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {generalAttributes.map((attr, idx) => (
              <div key={idx}>
                <label className="block text-xs font-medium text-gray-700 mb-1">{formatSpecLabel(attr.name)}</label>
                {attr.type === 'select' && attr.options?.length > 0 ? (
                  <select
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl px-4 py-2.5 focus:ring-[#189D91] focus:border-[#189D91]"
                    value={formData.dynamicAttributes?.[attr.name] || ''}
                    onChange={(e) => handleDynamicAttributeChange(attr.name, e.target.value)}
                  >
                    <option value="">Select {attr.name}</option>
                    {attr.options.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={attr.type === 'number' ? 'number' : 'text'}
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl px-4 py-2.5 focus:ring-[#189D91] focus:border-[#189D91]"
                    value={formData.dynamicAttributes?.[attr.name] || ''}
                    onChange={(e) => handleDynamicAttributeChange(attr.name, e.target.value)}
                    placeholder={`Enter ${attr.name}`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI colour variants */}
      <div className="bg-[#189D91]/5 border border-[#189D91]/20 rounded-xl p-4 space-y-3">
        <p className="text-[11px] font-bold text-[#189D91] uppercase tracking-widest flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" /> Generate colour variants with AI
        </p>
        <p className="text-[11px] text-gray-500">
          Uses your original photo and changes only the colour. Shape, seat count, size and every other detail stay identical.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-700">
            {(aiSourceImage || formData.images?.[0]) ? (
              <img src={aiSourceImage || formData.images[0]} alt="" className="w-12 h-12 rounded-lg object-cover border border-gray-200" />
            ) : (
              <span className="w-12 h-12 rounded-lg border border-dashed border-gray-300 flex items-center justify-center text-gray-400"><ImagePlus className="w-4 h-4" /></span>
            )}
            <span className="text-[#189D91]">{aiSourceImage ? 'Change original' : 'Upload original (optional)'}</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => { const f = e.target.files?.[0]; if (f) setAiSourceImage(await fileToDataUrl(f)); }}
            />
          </label>
          <span className="text-[10px] text-gray-400">Default: the main product image.</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {[...PRESET_COLOURS, ...aiColours.filter(c => !PRESET_COLOURS.includes(c))].map(colour => (
            <button
              key={colour}
              type="button"
              onClick={() => toggleAiColour(colour)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${aiColours.includes(colour) ? 'border-[#189D91] bg-[#189D91] text-white' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'}`}
            >
              {colour}
            </button>
          ))}
          <input
            type="text"
            value={aiCustomColour}
            onChange={(e) => setAiCustomColour(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                const c = aiCustomColour.trim();
                if (c && !aiColours.includes(c)) setAiColours(prev => [...prev, c]);
                setAiCustomColour('');
              }
            }}
            placeholder="Other colour + Enter"
            className="text-xs bg-white border border-gray-200 rounded-lg px-3 py-1.5 w-40 focus:border-[#189D91] outline-none"
          />
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleGenerateColours}
            disabled={aiLoading || aiColours.length === 0}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#189D91] text-white text-xs font-bold rounded-lg hover:bg-[#15887e] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {aiLoading ? `Generating ${aiColours.length} colour(s)... (about a minute each)` : `Generate ${aiColours.length || ''} colour variant${aiColours.length === 1 ? '' : 's'}`}
          </button>
          {aiMessage && <span className="text-[11px] text-gray-600">{aiMessage}</span>}
        </div>
      </div>

      {/* Variants Table */}
      <div className="space-y-4 pt-4 border-t border-gray-100">
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-semibold text-gray-700">Product Variants (SKUs, Pricing, Sizes)</h4>
            <button
              type="button"
              onClick={addVariant}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#189D91]/10 text-[#189D91] hover:bg-[#189D91]/20 rounded-lg text-xs font-bold transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add Variant
            </button>
          </div>
          
          {variantImageMsg && <p className="text-[11px] text-amber-600 font-semibold">{variantImageMsg}</p>}
          {(!formData.variants || formData.variants.length === 0) ? (
            <div className="text-center py-6 bg-gray-50 border border-dashed border-gray-200 rounded-xl">
              <p className="text-xs text-gray-500 mb-2">No variants created yet.</p>
              <button type="button" onClick={addVariant} className="text-[#189D91] text-xs font-bold hover:underline">Click here to generate variants</button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-y border-gray-200">
                    <th className="px-3 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Mat Code / SKU</th>
                    {variantAttributes.map(attr => (
                      <th key={attr.name} className="px-3 py-2 text-[11px] font-bold text-gray-500 tracking-wide whitespace-nowrap">{formatSpecLabel(attr.name)}</th>
                    ))}
                    <th className="px-3 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">MRP (₹)</th>
                    <th className="px-3 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Discount Price</th>
                    <th className="px-3 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Stock</th>
                    <th className="px-3 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Image</th>
                    <th className="px-3 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {formData.variants.map((variant, index) => (
                    <tr key={index} className="hover:bg-gray-50/50">
                      <td className="px-2 py-2">
                        <input
                          type="text"
                          placeholder="SKU"
                          className="w-full min-w-[120px] text-xs bg-white border border-gray-200 rounded-lg px-2 py-1.5 focus:border-[#189D91] outline-none"
                          value={variant.sku || ''}
                          onChange={(e) => handleVariantChange(index, 'sku', e.target.value)}
                        />
                      </td>
                      
                      {variantAttributes.map(attr => (
                        <td key={attr.name} className="px-2 py-2">
                          {attr.type === 'select' && attr.options?.length > 0 ? (
                            <select
                              className="w-full min-w-[100px] text-xs bg-white border border-gray-200 rounded-lg px-2 py-1.5 focus:border-[#189D91] outline-none"
                              value={variant.attributes?.[attr.name] || ''}
                              onChange={(e) => handleVariantAttributeChange(index, attr.name, e.target.value)}
                            >
                              <option value="">Select</option>
                              {attr.options.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type="text"
                              placeholder={attr.name}
                              className="w-full min-w-[100px] text-xs bg-white border border-gray-200 rounded-lg px-2 py-1.5 focus:border-[#189D91] outline-none"
                              value={variant.attributes?.[attr.name] || ''}
                              onChange={(e) => handleVariantAttributeChange(index, attr.name, e.target.value)}
                            />
                          )}
                        </td>
                      ))}
                      
                      <td className="px-2 py-2">
                        <input
                          type="number"
                          placeholder="Price"
                          className="w-full min-w-[80px] text-xs bg-white border border-gray-200 rounded-lg px-2 py-1.5 focus:border-[#189D91] outline-none"
                          value={variant.price || ''}
                          onChange={(e) => handleVariantChange(index, 'price', e.target.value)}
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="number"
                          placeholder="Disc. Price"
                          className="w-full min-w-[80px] text-xs bg-white border border-gray-200 rounded-lg px-2 py-1.5 focus:border-[#189D91] outline-none"
                          value={variant.discountPrice || ''}
                          onChange={(e) => handleVariantChange(index, 'discountPrice', e.target.value)}
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="number"
                          placeholder="Stock"
                          className="w-full min-w-[60px] text-xs bg-white border border-gray-200 rounded-lg px-2 py-1.5 focus:border-[#189D91] outline-none"
                          value={variant.countInStock || ''}
                          onChange={(e) => handleVariantChange(index, 'countInStock', e.target.value)}
                        />
                      </td>
                      <td className="px-2 py-2 min-w-[260px]">
                        <div className="flex flex-wrap items-center gap-1.5 max-w-[320px]">
                          {getVariantImages(variant).map((img, imgIdx) => (
                            <div key={`${img}-${imgIdx}`} className="relative group w-11 h-11">
                              <img
                                src={img}
                                alt=""
                                onClick={() => setPreview({ images: getVariantImages(variant), index: imgIdx })}
                                className={`w-11 h-11 rounded-lg object-cover border cursor-pointer ${imgIdx === 0 ? 'border-[#189D91] ring-1 ring-[#189D91]' : 'border-gray-200'}`}
                              />
                              <button
                                type="button"
                                title="Remove image"
                                onClick={() => removeVariantImage(index, imgIdx)}
                                className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] leading-none flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                ×
                              </button>
                              {imgIdx === 0 ? (
                                <span className="absolute bottom-0 inset-x-0 bg-[#189D91] text-white text-[7px] font-bold text-center rounded-b-lg">MAIN</span>
                              ) : (
                                <button
                                  type="button"
                                  title="Make main image"
                                  onClick={() => makeVariantImagePrimary(index, imgIdx)}
                                  className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[7px] font-bold text-center rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  SET MAIN
                                </button>
                              )}
                            </div>
                          ))}
                          {getVariantImages(variant).length < MAX_VARIANT_IMAGES && (
                            <label className="h-11 px-3 rounded-lg border border-dashed border-[#189D91] bg-[#189D91]/5 flex items-center justify-center gap-1.5 text-[#189D91] text-[11px] font-bold hover:bg-[#189D91]/10 cursor-pointer whitespace-nowrap">
                              <ImagePlus className="w-4 h-4" />
                              {uploadingIndex === index ? 'Uploading...' : (getVariantImages(variant).length ? 'Add more' : 'Upload images')}
                              <input
                                type="file"
                                accept="image/*"
                                multiple
                                className="hidden"
                                disabled={uploadingIndex === index}
                                onChange={(e) => { handleVariantImageUpload(index, e.target.files); e.target.value = ''; }}
                              />
                            </label>
                          )}
                        </div>
                        <p className="text-[9px] text-gray-400 mt-1">{getVariantImages(variant).length}/{MAX_VARIANT_IMAGES} images</p>
                        {getVariantImages(variant).length < MAX_VARIANT_IMAGES && (
                          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                            <label className="flex items-center gap-1 px-2 py-1 border border-[#189D91] text-[#189D91] text-[10px] font-bold rounded-md cursor-pointer hover:bg-[#189D91]/10 whitespace-nowrap">
                              {variant.aiSource ? (
                                <img src={variant.aiSource} alt="" className="w-4 h-4 rounded object-cover" />
                              ) : (
                                <ImagePlus className="w-3 h-3" />
                              )}
                              {variant.aiSource ? 'Change source' : 'Upload source'}
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                disabled={uploadingIndex === index}
                                onChange={(e) => { handleVariantSourceUpload(index, e.target.files?.[0]); e.target.value = ''; }}
                              />
                            </label>
                            <select
                              value={aiVariantCount[index] || ''}
                              onChange={(e) => setAiVariantCount(prev => ({ ...prev, [index]: Number(e.target.value) || 0 }))}
                              className="text-[10px] bg-white border border-gray-200 rounded-md px-1 py-1 outline-none"
                              disabled={aiVariantIdx === index}
                            >
                              <option value="">Fill to 10</option>
                              {[1, 2, 3, 5, 7].filter(n => n <= MAX_VARIANT_IMAGES - getVariantImages(variant).length).map(n => (
                                <option key={n} value={n}>{n} image{n > 1 ? 's' : ''}</option>
                              ))}
                            </select>
                            <button
                              type="button"
                              onClick={() => handleGenerateVariantImages(index)}
                              disabled={aiVariantIdx === index}
                              className="flex items-center gap-1 px-2 py-1 bg-[#189D91] text-white text-[10px] font-bold rounded-md hover:bg-[#15887e] disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                            >
                              <Sparkles className="w-3 h-3" />
                              {aiVariantIdx === index ? 'Generating...' : 'AI generate'}
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="px-2 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => removeVariant(index)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-2 text-[10px] text-gray-400 flex items-center gap-1">
                <Info className="w-3 h-3" /> Note: Ensure combinations are unique. Each variant needs its own price and stock; up to 10 images per variant, the first (MAIN) replaces the main image when a customer picks it.
              </div>
            </div>
          )}
        </div>

      {preview && (
        <div
          className="fixed inset-0 z-[100000] bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPreview(null)}
        >
          <div className="relative max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setPreview(null)}
              className="absolute -top-3 -right-3 z-10 w-8 h-8 rounded-full bg-white text-gray-700 font-bold shadow-lg"
            >
              ×
            </button>
            <img
              src={preview.images[preview.index]}
              alt=""
              className="w-full max-h-[75vh] object-contain rounded-2xl bg-white"
            />
            {preview.images.length > 1 && (
              <div className="flex justify-center gap-2 mt-3 flex-wrap">
                {preview.images.map((img, i) => (
                  <button
                    type="button"
                    key={i}
                    onClick={() => setPreview({ ...preview, index: i })}
                    className={`w-14 h-14 rounded-lg overflow-hidden border-2 ${i === preview.index ? 'border-[#189D91]' : 'border-transparent opacity-70'}`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductVariantsEditor;
