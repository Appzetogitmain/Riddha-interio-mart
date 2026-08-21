import React from 'react';

const VerifiedVendorFilter = ({ verifiedOnly, verificationStatus, options, onChange, isLoading }) => {
  return (
    <div className="space-y-3">
      <label className="flex items-center space-x-3 cursor-pointer group">
        <input
          type="checkbox"
          checked={verifiedOnly === 'true' || verifiedOnly === true}
          onChange={(e) => onChange(e.target.checked ? 'true' : undefined, undefined)}
          disabled={isLoading}
          className="w-5 h-5 rounded border-soft-oatmeal cursor-pointer accent-warm-sand"
        />
        <span className="text-sm font-medium text-deep-espresso group-hover:text-warm-sand transition-colors">
          ✓ Verified Only
        </span>
      </label>

      <div className="border-t border-soft-oatmeal/20 pt-3 space-y-2">
        <button
          onClick={() => onChange(verifiedOnly, undefined)}
          className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            !verificationStatus
              ? 'bg-warm-sand/20 text-warm-sand'
              : 'bg-soft-oatmeal/10 text-deep-espresso hover:bg-soft-oatmeal/20'
          }`}
          disabled={isLoading}
        >
          All Vendor Types
        </button>
        {(options || []).map((option) => (
          <button
            key={option.value}
            onClick={() => onChange(verifiedOnly, option.value)}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              verificationStatus === option.value
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
  );
};

export default VerifiedVendorFilter;
