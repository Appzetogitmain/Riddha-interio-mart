import React, { useRef, useState, useEffect, useCallback } from 'react';
import { LuLayoutGrid, LuChevronDown, LuChevronLeft, LuChevronRight } from 'react-icons/lu';
import { getCategoryIconAndColor, toTitleCase } from '../utils/categoryIcon';

// Horizontal row of category icon tiles used as the primary category filter
// (replaces the old sidebar "All Categories" dropdown). Clicking a tile selects
// that category as a filter; when the selected category has subcategories, a
// dropdown to narrow further appears right below the row.
const CategoryIconFilter = ({ categories = [], selectedCategory, selectedSubcategory, onChange, isLoading }) => {
  const activeCategory = categories.find((c) => c._id === selectedCategory);
  const subcategories = activeCategory?.subcategories || [];

  const scrollRef = useRef(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const updateArrows = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    updateArrows();
    const el = scrollRef.current;
    if (!el) return;
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updateArrows) : null;
    ro?.observe(el);
    window.addEventListener('resize', updateArrows);
    return () => { ro?.disconnect(); window.removeEventListener('resize', updateArrows); };
  }, [categories, isLoading, updateArrows]);

  const scrollByDir = (dir) => {
    const el = scrollRef.current;
    if (el) el.scrollBy({ left: dir * Math.max(240, el.clientWidth * 0.7), behavior: 'smooth' });
  };

  const handleSelectCategory = (categoryId) => {
    // Clicking the already-selected category clears it (acts as a toggle).
    onChange(categoryId === selectedCategory ? undefined : categoryId, undefined);
  };

  if (isLoading || categories.length === 0) return null;

  return (
    <div className="mb-6 space-y-3">
      <div className="relative">
      {canLeft && (
        <button type="button" aria-label="Scroll categories left" onClick={() => scrollByDir(-1)}
          className="hidden md:flex absolute left-0 top-8 -translate-y-1/2 z-10 h-9 w-9 items-center justify-center rounded-full bg-white border border-soft-oatmeal shadow-md hover:bg-gray-50">
          <LuChevronLeft className="w-5 h-5 text-gray-700" />
        </button>
      )}
      {canRight && (
        <button type="button" aria-label="Scroll categories right" onClick={() => scrollByDir(1)}
          className="hidden md:flex absolute right-0 top-8 -translate-y-1/2 z-10 h-9 w-9 items-center justify-center rounded-full bg-white border border-soft-oatmeal shadow-md hover:bg-gray-50">
          <LuChevronRight className="w-5 h-5 text-gray-700" />
        </button>
      )}
      <div ref={scrollRef} onScroll={updateArrows} className="flex items-center gap-2 md:gap-3 overflow-x-auto no-scrollbar pb-1 scroll-smooth">
        <button
          type="button"
          onClick={() => handleSelectCategory(undefined)}
          className="group flex flex-col items-center justify-center min-w-[64px] md:min-w-[84px] py-1 shrink-0"
        >
          <div
            className={`mb-1.5 h-10 w-10 md:h-14 md:w-14 rounded-xl md:rounded-2xl flex items-center justify-center transition-all ${
              !selectedCategory ? 'ring-2 ring-[#189D91] bg-[#189D91]/10' : 'bg-soft-oatmeal/10 group-hover:bg-soft-oatmeal/20'
            }`}
          >
            <LuLayoutGrid className="w-5 h-5 md:w-6 md:h-6" style={{ color: !selectedCategory ? '#189D91' : '#8a8a8a' }} strokeWidth={1.5} />
          </div>
          <span className={`text-[9px] md:text-[11px] font-bold text-center leading-tight ${!selectedCategory ? 'text-[#189D91]' : 'text-gray-600'}`}>
            All
          </span>
        </button>

        {categories.map((category) => {
          const { IconComponent, color, isCustomImage } = getCategoryIconAndColor(category.name, category.icon);
          const isSelected = selectedCategory === category._id;

          return (
            <button
              type="button"
              key={category._id}
              onClick={() => handleSelectCategory(category._id)}
              className="group flex flex-col items-center justify-center min-w-[64px] md:min-w-[84px] py-1 shrink-0"
            >
              <div
                className="mb-1.5 h-10 w-10 md:h-14 md:w-14 rounded-xl md:rounded-2xl flex items-center justify-center overflow-hidden transition-all"
                style={{
                  backgroundColor: `${color}15`,
                  boxShadow: isSelected ? `0 0 0 2px ${color}` : 'none'
                }}
              >
                {isCustomImage ? (
                  <img src={category.icon} alt={category.name} className="w-5 h-5 md:w-7 md:h-7 object-contain" />
                ) : (
                  <IconComponent className="w-5 h-5 md:w-7 md:h-7" style={{ color }} strokeWidth={1.5} />
                )}
              </div>
              <span className={`text-[9px] md:text-[11px] font-bold text-center px-0.5 leading-tight ${isSelected ? 'text-gray-900' : 'text-gray-600'}`}>
                {toTitleCase(category.name)}
              </span>
            </button>
          );
        })}
      </div>
      </div>

      {selectedCategory && subcategories.length > 0 && (
        <div className="relative max-w-xs">
          <select
            value={selectedSubcategory || ''}
            onChange={(e) => onChange(selectedCategory, e.target.value || undefined)}
            disabled={isLoading}
            className="w-full appearance-none px-4 py-2.5 pr-10 rounded-xl text-sm font-medium bg-soft-oatmeal/10 text-deep-espresso border border-soft-oatmeal/20 focus:outline-none focus:ring-2 focus:ring-warm-sand/30 cursor-pointer"
          >
            <option value="">All {toTitleCase(activeCategory.name)} Subcategories</option>
            {subcategories.map((sub) => (
              <option key={sub._id} value={sub._id}>{sub.name}</option>
            ))}
          </select>
          <LuChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 w-4 h-4" />
        </div>
      )}
    </div>
  );
};

export default CategoryIconFilter;
