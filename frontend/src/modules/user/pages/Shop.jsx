import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FiGrid, FiArrowRight, FiImage } from 'react-icons/fi';
import api from '../../../shared/utils/api';

const Shop = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await api.get('/categories');
        setCategories(data.data || []);
      } catch (error) {
        console.error('Failed to fetch categories', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="py-16 md:py-24"
    >
      <div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-16 space-y-4"
        >
          <div className="flex items-center gap-3 text-warm-sand mb-2">
            <FiGrid className="h-5 w-5" />
            <span className="text-xs uppercase tracking-[0.2em] font-bold">Browse</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tight text-deep-espresso">
            Shop by Category
          </h1>
          <p className="text-deep-espresso/50 text-lg font-light leading-relaxed max-w-2xl">
            Explore our curated collections — from premium tiles and designer paints to handcrafted furniture and elegant home décor.
          </p>
        </motion.div>

        {/* Category Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white border border-gray-100 rounded-2xl p-6 h-32" />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-12 text-gray-400 font-medium">No categories found.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((cat, index) => (
            <motion.div
              key={cat.slug}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + index * 0.08 }}
            >
              <Link
                to={`/category/${cat.slug}`}
                className="group block bg-white border border-soft-oatmeal/30 rounded-2xl p-6 hover:shadow-lg hover:border-warm-sand/40 transition-all duration-300"
              >
                <div className="flex items-center gap-6">
                  {/* Small Category Image */}
                  <div className="h-20 w-20 shrink-0 rounded-xl overflow-hidden bg-soft-oatmeal/5 shadow-inner border border-soft-oatmeal/10 flex items-center justify-center">
                    {cat.image && cat.image !== 'no-photo.jpg' ? (
                      <img 
                        src={cat.image} 
                        alt={cat.name} 
                        className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500" 
                      />
                    ) : (
                      <FiImage className="h-8 w-8 text-warm-sand/50" />
                    )}
                  </div>
                  
                  {/* Category Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <h3 className="text-lg font-display font-bold text-deep-espresso group-hover:text-warm-sand transition-colors truncate">
                        {cat.name}
                      </h3>
                      <FiArrowRight className="h-4 w-4 text-deep-espresso/20 group-hover:text-warm-sand group-hover:translate-x-1 transition-all shrink-0" />
                    </div>
                    <p className="text-deep-espresso/50 text-xs font-medium leading-relaxed line-clamp-2">
                      {cat.description}
                    </p>
                  </div>
                </div>
              </Link>
            </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default Shop;
