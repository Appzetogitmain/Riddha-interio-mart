import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { categories } from '../../models/categories';

const CategoriesPage = () => {
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-white pb-24 pt-10 px-4 md:px-12">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12 md:mb-16">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-black text-deep-espresso tracking-tight mb-4"
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
        <div className="grid grid-cols-4 md:grid-cols-4 lg:grid-cols-6 gap-x-3 md:gap-x-12 gap-y-8 md:gap-y-16">
          {categories.map((category) => (
            <div key={category.id}>
              <Link 
                to={`/category/${category.slug}`}
                className="group flex flex-col items-center gap-2 md:gap-4"
              >
                <div className="relative aspect-square w-full rounded-2xl md:rounded-[2.5rem] overflow-hidden bg-soft-oatmeal/10 shadow-sm group-hover:shadow-lg transition-all duration-500 border border-soft-oatmeal/5">
                  <img 
                    src={category.image} 
                    alt={category.name} 
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-deep-espresso/0 group-hover:bg-deep-espresso/5 transition-colors duration-300" />
                </div>
                <span className="text-[9px] md:text-xs font-black uppercase tracking-widest text-deep-espresso/60 group-hover:text-warm-sand text-center transition-colors leading-tight min-h-[2.5em] px-1">
                  {category.name}
                </span>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CategoriesPage;
