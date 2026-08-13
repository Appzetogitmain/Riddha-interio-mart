import React, { useState } from 'react';
import { Sparkles, SlidersHorizontal, Search } from 'lucide-react';
import api from '../../../shared/utils/api';

const SearchRefinement = ({ query, onApplyFilter }) => {
  const [suggestions, setSuggestions] = useState([
    'Style: Modern Minimalist',
    'Material: Italian Marble',
    'Price: Under ₹50,000',
    'Rating: 4.5+ Stars',
    'In Stock Only'
  ]);

  const handleFilterClick = (filterText) => {
    if (onApplyFilter) onApplyFilter(filterText);
    api.post('/recommendations/track', { action: 'search_filter_click', context: 'search' }).catch(() => {});
  };

  return (
    <div className="bg-emerald-50/70 border border-emerald-100/80 rounded-2xl p-4 mb-6">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-4 h-4 text-emerald-700" />
        <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
          AI Suggested Search Refinements for "{query || 'Catalog'}"
        </h4>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {suggestions.map((sug, idx) => (
          <button
            key={idx}
            onClick={() => handleFilterClick(sug)}
            className="px-3 py-1.5 bg-white hover:bg-emerald-700 hover:text-white border border-emerald-200 text-gray-700 rounded-xl text-xs font-medium transition-all shadow-2xs active:scale-95 flex items-center gap-1.5"
          >
            <SlidersHorizontal className="w-3 h-3 text-emerald-600 group-hover:text-white" />
            <span>{sug}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default SearchRefinement;
