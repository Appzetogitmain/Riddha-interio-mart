import React, { useState, useEffect } from 'react';

const OfferPricingFields = ({
  type,
  discountType = 'percentage',
  discountValue = 0,
  minQuantity = 1,
  couponCode = '',
  usageLimit = '',
  comboPrice = 0,
  onChange,
  products = []
}) => {
  const [localDiscountType, setLocalDiscountType] = useState(discountType);
  const [localDiscountValue, setLocalDiscountValue] = useState(discountValue);

  useEffect(() => {
    setLocalDiscountType(discountType);
    setLocalDiscountValue(discountValue);
  }, [discountType, discountValue, type]);

  const handleDiscountTypeChange = (newType) => {
    setLocalDiscountType(newType);
    onChange({ discountType: newType, discountValue: localDiscountValue });
  };

  const handleDiscountValueChange = (value) => {
    const numValue = Number(value) || 0;
    setLocalDiscountValue(numValue);
    onChange({ discountType: localDiscountType, discountValue: numValue });
  };

  const handleFixedPriceChange = (value) => {
    const numValue = Number(value) || 0;
    onChange({ discountType: 'fixedPrice', discountValue: numValue });
  };

  const handleComboPriceChange = (value) => {
    const numValue = Number(value) || 0;
    onChange({ comboPrice: numValue });
  };

  const computePreviewPrice = () => {
    if (!products.length) return 0;
    const avgPrice = products.reduce((sum, p) => sum + (p.price || 0), 0) / products.length;
    if (localDiscountType === 'percentage') {
      return Math.max(0, avgPrice - (avgPrice * localDiscountValue / 100));
    } else if (localDiscountType === 'flat') {
      return Math.max(0, avgPrice - localDiscountValue);
    }
    return avgPrice;
  };

  // Coupon, Today's Deals, Vendor Offers, Project Pricing, New Vendor Offers, Festival Offers, Bulk Purchase Discount
  if (['Coupon', "Today's Deals", 'Vendor Offers', 'Project Pricing', 'New Vendor Offers', 'Festival Offers', 'Bulk Purchase Discount'].includes(type)) {
    return (
      <div className="space-y-4">
        {type === 'Bulk Purchase Discount' && (
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
              Minimum Quantity
            </label>
            <input
              type="number"
              min="1"
              value={minQuantity}
              onChange={(e) => onChange({ minQuantity: Number(e.target.value) || 1 })}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 5"
            />
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">
            Discount Type
          </label>
          <div className="flex gap-3">
            <label className="flex items-center gap-2 px-4 py-2 border-2 rounded-lg cursor-pointer transition" style={{borderColor: localDiscountType === 'percentage' ? '#3B82F6' : '#E2E8F0'}}>
              <input
                type="radio"
                checked={localDiscountType === 'percentage'}
                onChange={() => handleDiscountTypeChange('percentage')}
                className="accent-blue-600 cursor-pointer"
              />
              <span className="text-sm font-semibold text-slate-700">% Off</span>
            </label>
            <label className="flex items-center gap-2 px-4 py-2 border-2 rounded-lg cursor-pointer transition" style={{borderColor: localDiscountType === 'flat' ? '#3B82F6' : '#E2E8F0'}}>
              <input
                type="radio"
                checked={localDiscountType === 'flat'}
                onChange={() => handleDiscountTypeChange('flat')}
                className="accent-blue-600 cursor-pointer"
              />
              <span className="text-sm font-semibold text-slate-700">Flat ₹ Off</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
            Discount Value
          </label>
          <div className="relative">
            <input
              type="number"
              min="0"
              step="0.01"
              value={localDiscountValue}
              onChange={(e) => handleDiscountValueChange(e.target.value)}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={localDiscountType === 'percentage' ? 'e.g., 20' : 'e.g., 500'}
            />
            <span className="absolute right-4 top-2 text-sm font-bold text-slate-500">
              {localDiscountType === 'percentage' ? '%' : '₹'}
            </span>
          </div>
          {products.length > 0 && (
            <p className="text-xs text-slate-500 mt-2">
              Preview: ₹{computePreviewPrice().toLocaleString()} (from avg ₹{(products.reduce((s, p) => s + (p.price || 0), 0) / products.length).toLocaleString()})
            </p>
          )}
        </div>
      </div>
    );
  }

  // Clearance Sale
  if (type === 'Clearance Sale') {
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
            New Price (₹)
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={discountValue}
            onChange={(e) => handleFixedPriceChange(e.target.value)}
            className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., 1500"
          />
          {products.length > 0 && (
            <div className="mt-3 p-3 bg-amber-50 rounded border border-amber-200">
              <p className="text-xs text-amber-900">
                <span className="font-semibold">Original Price:</span> ₹{(products.reduce((s, p) => s + (p.price || 0), 0) / products.length).toLocaleString()}
              </p>
              <p className="text-xs text-amber-900 mt-1">
                <span className="font-semibold">Discount:</span> {(((products.reduce((s, p) => s + (p.price || 0), 0) / products.length) - discountValue) / (products.reduce((s, p) => s + (p.price || 0), 0) / products.length) * 100).toFixed(1)}%
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Combo Offers
  if (type === 'Combo Offers') {
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
            Combo Price (₹)
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={comboPrice}
            onChange={(e) => handleComboPriceChange(e.target.value)}
            className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., 2500"
          />
          {products.length > 0 && (
            <div className="mt-3 p-3 bg-green-50 rounded border border-green-200">
              <p className="text-xs text-green-900">
                <span className="font-semibold">Total Original Price:</span> ₹{products.reduce((s, p) => s + (p.price || 0), 0).toLocaleString()}
              </p>
              <p className="text-xs text-green-900 mt-1">
                <span className="font-semibold">Bundle Savings:</span> ₹{Math.max(0, products.reduce((s, p) => s + (p.price || 0), 0) - comboPrice).toLocaleString()}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
};

export default OfferPricingFields;
