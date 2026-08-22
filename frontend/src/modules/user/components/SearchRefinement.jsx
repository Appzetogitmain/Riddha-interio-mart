import React from 'react';
import { Sparkles, X, SlidersHorizontal } from 'lucide-react';
import api from '../../../shared/utils/api';

const SearchRefinement = ({ query, interpretation, chips = [], onRemoveChip, loading }) => {
  if (loading || chips.length === 0) return null;

  const handleRemove = (chip) => {
    if (onRemoveChip) onRemoveChip(chip);
    api.post('/recommendations/track', { action: 'search_filter_remove', context: 'search' }).catch(() => {});
  };

  return (
    <div className="bg-emerald-50/70 border border-emerald-100/80 rounded-2xl p-4 mb-6">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-4 h-4 text-emerald-700" />
        <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
          {interpretation ? `Searching for: ${interpretation}` : `AI Understood "${query}"`}
        </h4>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {chips.map((chip) => (
          <button
            key={chip.key}
            onClick={() => handleRemove(chip)}
            title="Remove this filter"
            className="px-3 py-1.5 bg-white hover:bg-emerald-700 hover:text-white border border-emerald-200 text-gray-700 rounded-xl text-xs font-medium transition-all shadow-2xs active:scale-95 flex items-center gap-1.5 group"
          >
            <SlidersHorizontal className="w-3 h-3 text-emerald-600 group-hover:text-white" />
            <span>{chip.label}</span>
            <X className="w-3 h-3 text-gray-400 group-hover:text-white" />
          </button>
        ))}
      </div>
    </div>
  );
};

export default SearchRefinement;
