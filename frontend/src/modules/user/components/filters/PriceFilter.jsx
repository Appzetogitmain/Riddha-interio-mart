import React, { useState, useEffect } from 'react';

const PriceFilter = ({ minPrice, maxPrice, onRangeChange, isLoading }) => {
  const [localMin, setLocalMin] = useState(minPrice || 0);
  const [localMax, setLocalMax] = useState(maxPrice || 500000);

  useEffect(() => {
    setLocalMin(minPrice || 0);
    setLocalMax(maxPrice || 500000);
  }, [minPrice, maxPrice]);

  const handleMinChange = (e) => {
    const value = Number(e.target.value);
    if (value <= localMax) {
      setLocalMin(value);
    }
  };

  const handleMaxChange = (e) => {
    const value = Number(e.target.value);
    if (value >= localMin) {
      setLocalMax(value);
    }
  };

  const handleApply = () => {
    onRangeChange(localMin, localMax);
  };

  const formatPrice = (value) => {
    return `₹${Math.round(value / 1000)}k`;
  };

  const trackFill = (value) => {
    const percent = (value / 500000) * 100;
    return {
      background: `linear-gradient(to right, var(--color-warm-sand) 0%, var(--color-warm-sand) ${percent}%, var(--color-soft-oatmeal) ${percent}%, var(--color-soft-oatmeal) 100%)`
    };
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-xs font-semibold text-deep-espresso/60">Min: {formatPrice(localMin)}</label>
        <input
          type="range"
          min="0"
          max="500000"
          step="5000"
          value={localMin}
          onChange={handleMinChange}
          disabled={isLoading}
          style={trackFill(localMin)}
          className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-warm-sand"
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold text-deep-espresso/60">Max: {formatPrice(localMax)}</label>
        <input
          type="range"
          min="0"
          max="500000"
          step="5000"
          value={localMax}
          onChange={handleMaxChange}
          disabled={isLoading}
          style={trackFill(localMax)}
          className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-warm-sand"
        />
      </div>

      <div className="flex gap-2 text-xs font-medium text-deep-espresso/70 pt-2">
        <span>{formatPrice(localMin)}</span>
        <span>-</span>
        <span>{formatPrice(localMax)}</span>
      </div>

      <button
        onClick={handleApply}
        disabled={isLoading}
        className="w-full mt-4 py-2.5 px-4 bg-warm-sand/10 hover:bg-warm-sand/20 text-warm-sand font-semibold text-sm rounded-lg transition-colors disabled:opacity-50"
      >
        Apply
      </button>
    </div>
  );
};

export default PriceFilter;
