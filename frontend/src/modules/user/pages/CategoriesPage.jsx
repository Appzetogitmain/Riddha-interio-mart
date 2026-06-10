import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import api from '../../../shared/utils/api';

const CategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get('/categories');
        setCategories(response.data.data);
      } catch (err) {
        console.error('Failed to load categories:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen py-40 text-center font-display text-warm-sand animate-pulse uppercase tracking-widest">
        Bringing you the best of interiors...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-24 pt-4 md:pt-10 px-4 md:px-12">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-4 md:mb-16">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl md:text-6xl font-black text-deep-espresso tracking-tight mb-4"
          >
            Product <span className="text-warm-sand">Categories</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-deep-espresso/40 text-[10px] md:text-sm font-black tracking-[0.3em] uppercase"
          >
            Explore our curated collections for your dream home
          </motion.p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-6 gap-x-3 md:gap-x-12 gap-y-6 md:gap-y-16">
          {categories.slice(0, showAll ? categories.length : 8).map((category) => (
            <div key={category._id}>
              <Link 
                to={`/category/${category.name.toLowerCase().replace(/\s+/g, '-')}`}
                className="group flex flex-col items-center gap-1 md:gap-4"
              >
                <div className="relative aspect-square w-full rounded-2xl md:rounded-[2.5rem] overflow-hidden bg-white shadow-sm group-hover:shadow-lg transition-all duration-500 border border-soft-oatmeal/10">
                  <img
                    src={category.image}
                    alt={category.name}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-deep-espresso/0 group-hover:bg-deep-espresso/5 transition-colors duration-300" />
                </div>
                <span className="text-[8px] md:text-xs font-black uppercase tracking-widest text-deep-espresso/60 group-hover:text-warm-sand text-center transition-colors leading-tight min-h-[2.5em] px-1">
                  {category.name}
                </span>
              </Link>
            </div>
          ))}
        </div>

        {/* View More Button */}
        {!showAll && categories.length > 8 && (
          <div className="mt-12 text-center">
            <button 
              onClick={() => setShowAll(true)}
              className="px-8 py-3 rounded-full border border-warm-sand/30 text-warm-sand text-[10px] font-black uppercase tracking-widest hover:bg-warm-sand hover:text-white transition-all duration-500"
            >
              View All {categories.length} Collections
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoriesPage;
