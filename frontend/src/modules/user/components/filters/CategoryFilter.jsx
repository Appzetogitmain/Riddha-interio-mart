import React from 'react';

const CategoryFilter = ({ categories = [], selectedCategory, selectedSubcategory, onChange, isLoading }) => {
  const activeCategory = categories.find((c) => c._id === selectedCategory);
  const subcategories = activeCategory?.subcategories || [];

  return (
    <div className="space-y-3">
      <select
        value={selectedCategory || ''}
        onChange={(e) => onChange(e.target.value || undefined, undefined)}
        disabled={isLoading}
        className="w-full px-3 py-2.5 rounded-lg text-sm font-medium bg-soft-oatmeal/10 text-deep-espresso border border-soft-oatmeal/20 focus:outline-none focus:ring-2 focus:ring-warm-sand/30 cursor-pointer"
      >
        <option value="">All Categories</option>
        {categories.map((cat) => (
          <option key={cat._id} value={cat._id}>{cat.name}</option>
        ))}
      </select>

      {selectedCategory && subcategories.length > 0 && (
        <select
          value={selectedSubcategory || ''}
          onChange={(e) => onChange(selectedCategory, e.target.value || undefined)}
          disabled={isLoading}
          className="w-full px-3 py-2.5 rounded-lg text-sm font-medium bg-soft-oatmeal/10 text-deep-espresso border border-soft-oatmeal/20 focus:outline-none focus:ring-2 focus:ring-warm-sand/30 cursor-pointer"
        >
          <option value="">All Subcategories</option>
          {subcategories.map((sub) => (
            <option key={sub._id} value={sub._id}>{sub.name}</option>
          ))}
        </select>
      )}
    </div>
  );
};

export default CategoryFilter;
