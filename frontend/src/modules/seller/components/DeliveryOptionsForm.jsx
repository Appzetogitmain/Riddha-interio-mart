import React from 'react';
import { Truck } from 'lucide-react';

const DeliveryOptionsForm = ({ formData, handleFieldChange }) => {
  const deliveryDays = ['Get It Today', 'Get It Tomorrow', 'Get It in 2 Days', 'Get It in 3–5 Days', 'Scheduled Delivery', 'Bulk Delivery'];
  const deliveryTypes = ['Hyperlocal', 'Standard', 'Express', 'Heavy/Bulk Transport', 'Site Delivery'];
  const freeDeliveryOptions = ['Free Delivery', 'Delivery Included', 'Vendor Pickup', 'Negotiable Freight'];

  // Initialize delivery options if not present
  const deliveryData = formData.deliveryOptions || {
    availableDeliveryDays: [],
    deliveryTypes: [],
    freeDeliveryEligibility: []
  };

  const handleDeliveryDayChange = (day) => {
    const updated = deliveryData.availableDeliveryDays?.includes(day)
      ? deliveryData.availableDeliveryDays.filter(d => d !== day)
      : [...(deliveryData.availableDeliveryDays || []), day];
    handleFieldChange('deliveryOptions', { ...deliveryData, availableDeliveryDays: updated });
  };

  const handleDeliveryTypeChange = (type) => {
    const updated = deliveryData.deliveryTypes?.includes(type)
      ? deliveryData.deliveryTypes.filter(t => t !== type)
      : [...(deliveryData.deliveryTypes || []), type];
    handleFieldChange('deliveryOptions', { ...deliveryData, deliveryTypes: updated });
  };

  const handleFreeDeliveryChange = (option) => {
    const updated = deliveryData.freeDeliveryEligibility?.includes(option)
      ? deliveryData.freeDeliveryEligibility.filter(o => o !== option)
      : [...(deliveryData.freeDeliveryEligibility || []), option];
    handleFieldChange('deliveryOptions', { ...deliveryData, freeDeliveryEligibility: updated });
  };

  return (
    <div className="space-y-6">
      {/* Delivery Day */}
      <div className="space-y-3">
        <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider ml-1 block">
          <Truck size={14} className="inline mr-1" /> Delivery Day
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
          {deliveryDays.map((day) => (
            <label key={day} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg cursor-pointer hover:bg-blue-50 transition-colors border border-slate-200" style={{borderColor: deliveryData.availableDeliveryDays?.includes(day) ? '#3B82F6' : '#E2E8F0'}}>
              <input
                type="checkbox"
                checked={deliveryData.availableDeliveryDays?.includes(day) || false}
                onChange={() => handleDeliveryDayChange(day)}
                className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
              />
              <span className="text-xs font-semibold text-slate-700">{day}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Delivery Type */}
      <div className="space-y-3 pt-4 border-t border-slate-100">
        <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider ml-1 block">
          Delivery Type
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
          {deliveryTypes.map((type) => (
            <label key={type} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg cursor-pointer hover:bg-blue-50 transition-colors border border-slate-200" style={{borderColor: deliveryData.deliveryTypes?.includes(type) ? '#3B82F6' : '#E2E8F0'}}>
              <input
                type="checkbox"
                checked={deliveryData.deliveryTypes?.includes(type) || false}
                onChange={() => handleDeliveryTypeChange(type)}
                className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
              />
              <span className="text-xs font-semibold text-slate-700">{type}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Free / Reduced Delivery */}
      <div className="space-y-3 pt-4 border-t border-slate-100">
        <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider ml-1 block">
          Eligible for Free / Reduced Delivery
        </label>
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-2">
          {freeDeliveryOptions.map((option) => (
            <label key={option} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg cursor-pointer hover:bg-green-50 transition-colors border border-slate-200" style={{borderColor: deliveryData.freeDeliveryEligibility?.includes(option) ? '#10B981' : '#E2E8F0'}}>
              <input
                type="checkbox"
                checked={deliveryData.freeDeliveryEligibility?.includes(option) || false}
                onChange={() => handleFreeDeliveryChange(option)}
                className="w-4 h-4 rounded accent-green-600 cursor-pointer"
              />
              <span className="text-xs font-semibold text-slate-700">{option}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DeliveryOptionsForm;
