import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageWrapper from '../components/PageWrapper';
import { motion, AnimatePresence } from 'framer-motion';
import { LuPlus, LuPen, LuTrash2, LuLayoutGrid } from 'react-icons/lu';
import { categoryGridData } from '../data/manageCategoryGridData';

const ManageCategoryGrid = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem('admin_category_grid');
    if (saved) {
      setCategories(JSON.parse(saved));
    } else {
      setCategories([...categoryGridData].sort((a, b) => a.displayOrder - b.displayOrder));
    }
  }, []);

  const handleDelete = (id) => {
    const updated = categories.filter((c) => c.id !== id);
    setCategories(updated);
    localStorage.setItem('admin_category_grid', JSON.stringify(updated));
  };

  return (
    <PageWrapper>
      <div className="w-full space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-deep-espresso">
              Category Grid
            </h1>
            <p className="text-warm-sand mt-1 text-sm md:text-base">
              Manage the homepage quick-access category grid.
            </p>
          </div>
          <button
            onClick={() => navigate('/admin/manage-grid/add')}
            className="w-12 h-12 bg-dusty-cocoa text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-dusty-cocoa/40 transition-all active:scale-95"
          >
            <LuPlus size={24} />
          </button>
        </div>

        {/* Section Label */}
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-soft-oatmeal/20" />
          <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-warm-sand/60">
            Grid View
          </span>
          <div className="h-px flex-1 bg-soft-oatmeal/20" />
        </div>

        {/* Category Grid — mirrors user CategoryQuickAccess.jsx */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 md:gap-4"
        >
          <AnimatePresence>
            {categories.map((cat, index) => (
              <motion.div
                key={cat.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className="group relative flex flex-col items-center gap-2"
              >
                {/* Image Container */}
                <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-soft-oatmeal/5 shadow-sm group-hover:shadow-lg transition-all duration-500">
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="h-full w-full object-cover transition-all duration-700 group-hover:scale-110"
                  />
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-deep-espresso/0 group-hover:bg-deep-espresso/5 transition-colors duration-300" />

                  {/* Order Badge */}
                  <div className="absolute top-1.5 left-1.5">
                    <span className="bg-white/95 backdrop-blur-md text-deep-espresso text-[8px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">
                      {cat.displayOrder}
                    </span>
                  </div>

                  {/* Admin Actions */}
                  <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <button
                      className="h-6 w-6 bg-white/95 shadow-md rounded-full flex items-center justify-center text-deep-espresso hover:text-dusty-cocoa transition-all"
                      title="Edit"
                    >
                      <LuPen size={10} />
                    </button>
                    <button
                      onClick={() => handleDelete(cat.id)}
                      className="h-6 w-6 bg-white/95 shadow-md rounded-full flex items-center justify-center text-red-400 hover:text-red-600 transition-all"
                      title="Delete"
                    >
                      <LuTrash2 size={10} />
                    </button>
                  </div>
                </div>

                {/* Label */}
                <span className="text-[8px] md:text-[9px] font-black uppercase tracking-wider text-deep-espresso/50 group-hover:text-warm-sand text-center transition-colors leading-tight truncate w-full px-1">
                  {cat.name}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Add Placeholder */}
          <motion.button
            layout
            onClick={() => navigate('/admin/manage-grid/add')}
            className="flex flex-col items-center gap-2 group"
          >
            <div className="aspect-square w-full rounded-xl border border-dashed border-soft-oatmeal flex items-center justify-center hover:border-dusty-cocoa hover:bg-white/50 transition-all">
              <div className="flex flex-col items-center gap-1 text-warm-sand/60 group-hover:text-dusty-cocoa transition-colors">
                <LuPlus size={20} className="group-hover:scale-110 transition-transform" />
                <span className="text-[8px] font-bold uppercase tracking-tighter">Add</span>
              </div>
            </div>
          </motion.button>
        </motion.div>

        {/* Summary Footer */}
        <div className="bg-white p-4 rounded-xl border border-soft-oatmeal/30 flex items-center justify-between text-xs text-warm-sand">
          <p>
            Showing <span className="font-bold text-deep-espresso">{categories.length}</span> categories in grid
          </p>
          <span className="text-[10px] bg-golden-glow/30 text-deep-espresso/60 px-3 py-1 rounded-full font-bold border border-warm-sand/20">
            Frontend Preview Only
          </span>
        </div>
      </div>
    </PageWrapper>
  );
};

export default ManageCategoryGrid;
