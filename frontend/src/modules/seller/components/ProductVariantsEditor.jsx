import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Settings, Info } from 'lucide-react';

const ProductVariantsEditor = ({ formData, setFormData, categories }) => {
  const [selectedCategory, setSelectedCategory] = useState(null);
  
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

  const variantAttributes = attributes.filter(a => a.isVariant);
  const generalAttributes = attributes.filter(a => !a.isVariant);

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
                <label className="block text-xs font-medium text-gray-700 mb-1">{attr.name}</label>
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
                      <th key={attr.name} className="px-3 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">{attr.name}</th>
                    ))}
                    <th className="px-3 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">MRP (₹)</th>
                    <th className="px-3 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Discount Price</th>
                    <th className="px-3 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Stock</th>
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
                <Info className="w-3 h-3" /> Note: Ensure combinations are unique. Base product price will be used as a fallback.
              </div>
            </div>
          )}
        </div>
    </div>
  );
};

export default ProductVariantsEditor;
