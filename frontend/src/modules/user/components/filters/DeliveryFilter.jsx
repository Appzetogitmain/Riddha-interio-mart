import React from 'react';

const DeliveryFilter = ({ selectedDay, selectedType, selectedFree, dayOptions, typeOptions, freeOptions, onChange, isLoading }) => {
  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-xs font-semibold text-deep-espresso/60 mb-2">Delivery Day</h4>
        <div className="space-y-2">
          <button
            onClick={() => onChange(undefined, selectedType, selectedFree)}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              !selectedDay
                ? 'bg-warm-sand/20 text-warm-sand'
                : 'bg-soft-oatmeal/10 text-deep-espresso hover:bg-soft-oatmeal/20'
            }`}
            disabled={isLoading}
          >
            Any Day
          </button>
          {(dayOptions || []).map((option) => (
            <button
              key={option.value}
              onClick={() => onChange(option.value, selectedType, selectedFree)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedDay === option.value
                  ? 'bg-warm-sand/20 text-warm-sand'
                  : 'bg-soft-oatmeal/10 text-deep-espresso hover:bg-soft-oatmeal/20'
              }`}
              disabled={isLoading}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-soft-oatmeal/20 pt-3">
        <h4 className="text-xs font-semibold text-deep-espresso/60 mb-2">Delivery Type</h4>
        <div className="space-y-2">
          <button
            onClick={() => onChange(selectedDay, undefined, selectedFree)}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              !selectedType
                ? 'bg-warm-sand/20 text-warm-sand'
                : 'bg-soft-oatmeal/10 text-deep-espresso hover:bg-soft-oatmeal/20'
            }`}
            disabled={isLoading}
          >
            All Types
          </button>
          {(typeOptions || []).map((option) => (
            <button
              key={option.value}
              onClick={() => onChange(selectedDay, option.value, selectedFree)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedType === option.value
                  ? 'bg-warm-sand/20 text-warm-sand'
                  : 'bg-soft-oatmeal/10 text-deep-espresso hover:bg-soft-oatmeal/20'
              }`}
              disabled={isLoading}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-soft-oatmeal/20 pt-3">
        <h4 className="text-xs font-semibold text-deep-espresso/60 mb-2">Free / Reduced Delivery</h4>
        <div className="space-y-2">
          <button
            onClick={() => onChange(selectedDay, selectedType, undefined)}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              !selectedFree
                ? 'bg-warm-sand/20 text-warm-sand'
                : 'bg-soft-oatmeal/10 text-deep-espresso hover:bg-soft-oatmeal/20'
            }`}
            disabled={isLoading}
          >
            Any
          </button>
          {(freeOptions || []).map((option) => (
            <button
              key={option.value}
              onClick={() => onChange(selectedDay, selectedType, option.value)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedFree === option.value
                  ? 'bg-warm-sand/20 text-warm-sand'
                  : 'bg-soft-oatmeal/10 text-deep-espresso hover:bg-soft-oatmeal/20'
              }`}
              disabled={isLoading}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DeliveryFilter;
