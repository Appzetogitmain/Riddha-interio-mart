import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiChevronRight } from 'react-icons/fi';
import api from '../../../shared/utils/api';

const getCategorySlug = (name) => {
  if (!name) return '';
  return name.toLowerCase().replace(/\s+/g, '-');
};

// Dummy data for visual categories
// Dynamic categories fetched from the database

const ShopByCategory = () => {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get('/categories');
        // Filter to categories that have a valid http image, or just take all
        const validCategories = response.data.data.filter(c => c.image && c.image.startsWith('http'));
        // If not enough with http images, fallback to the rest
        const displayCategories = validCategories.length >= 6 
          ? validCategories 
          : response.data.data;
        
        setCategories(displayCategories.slice(0, 8)); // Display up to 8
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      }
    };
    fetchCategories();
  }, []);

  return (
    <section className="py-4 md:py-8 bg-white overflow-hidden">
      <div className="max-w-[1440px] mx-auto px-4 md:px-12">

        {/* Improved Heading */}
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#189D91] mb-0.5">Browse</p>
            <h2 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight leading-tight">Shop by Category</h2>
          </div>
          <Link to="/categories" className="flex items-center gap-1 text-[11px] md:text-sm font-bold text-[#189D91] hover:underline shrink-0">
            View All <FiChevronRight />
          </Link>
        </div>

        {/* 3-column Grid on mobile, wraps into rows */}
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
          {categories.slice(0, 6).map((cat, idx) => (
            <Link 
              key={idx} 
              to={`/category/${getCategorySlug(cat.name)}`}
              className="group flex flex-col items-center"
            >
              <div className="relative w-full aspect-square rounded-xl md:rounded-2xl overflow-hidden mb-1.5 md:mb-3 shadow-sm transition-all duration-300 group-hover:shadow-md group-hover:-translate-y-1">
                <img 
                  src={cat.image || 'https://via.placeholder.com/400x400?text=No+Image'} 
                  alt={cat.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <h3 className="text-[10px] md:text-sm font-bold text-gray-700 group-hover:text-[#189D91] transition-colors leading-tight text-center">
                {cat.name}
              </h3>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ShopByCategory;
