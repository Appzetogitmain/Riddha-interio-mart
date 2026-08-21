import React from 'react';

const RatingFilter = ({ selectedRating, options, onChange, isLoading }) => {
  return (
    <div className="space-y-3">
      <button
        onClick={() => onChange(undefined)}
        className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
          !selectedRating
            ? 'bg-warm-sand/20 text-warm-sand'
            : 'bg-soft-oatmeal/10 text-deep-espresso hover:bg-soft-oatmeal/20'
        }`}
        disabled={isLoading}
      >
        All Ratings
      </button>

      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            selectedRating === option.value
              ? 'bg-warm-sand/20 text-warm-sand'
              : 'bg-soft-oatmeal/10 text-deep-espresso hover:bg-soft-oatmeal/20'
          }`}
          disabled={isLoading}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};

export default RatingFilter;
