import React from 'react';
import { OFFER_TYPES } from '../../../../shared/constants/offerTypes';

const OfferTypeFilter = ({ selectedOfferType, onChange, isLoading }) => {
  return (
    <div className="space-y-3">
      <button
        onClick={() => onChange(undefined)}
        className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
          !selectedOfferType
            ? 'bg-warm-sand/20 text-warm-sand'
            : 'bg-soft-oatmeal/10 text-deep-espresso hover:bg-soft-oatmeal/20'
        }`}
        disabled={isLoading}
      >
        All Deals
      </button>

      {OFFER_TYPES.map((offer) => (
        <button
          key={offer.label}
          onClick={() => onChange(offer.label)}
          className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            selectedOfferType === offer.label
              ? 'bg-warm-sand/20 text-warm-sand'
              : 'bg-soft-oatmeal/10 text-deep-espresso hover:bg-soft-oatmeal/20'
          }`}
          disabled={isLoading}
        >
          {offer.label}
        </button>
      ))}
    </div>
  );
};

export default OfferTypeFilter;
