import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageWrapper from '../components/PageWrapper';
import { motion, AnimatePresence } from 'framer-motion';
import { LuPlus, LuPen, LuTrash2, LuPackagePlus, LuImages } from 'react-icons/lu';
import { manageFeaturedData } from '../data/manageFeaturedData';
import { toast } from 'react-hot-toast';

const ManageFeaturedProducts = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const fetchWithDelay = async () => {
      setLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 600));
      const saved = localStorage.getItem('admin_featured_products');
      if (saved) {
        setProducts(JSON.parse(saved));
      } else {
        localStorage.setItem('admin_featured_products', JSON.stringify(manageFeaturedData));
        setProducts(manageFeaturedData);
      }
      setLoading(false);
    };
    fetchWithDelay();
  }, []);

  const handleDelete = (id) => {
    const updated = products.filter((p) => p.id !== id);
    setProducts(updated);
    localStorage.setItem('admin_featured_products', JSON.stringify(updated));
    toast.success('Featured highlight removed successfully.');
  };

  return (
    <PageWrapper>
      <div className="w-full space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-5xl font-display font-extrabold text-[#240046] tracking-tight leading-none">
              Featured Products
            </h1>
            <p className="subtitle mt-2">
              Control the homepage Featured Highlights section.
            </p>
          </div>
          <button
            onClick={() => navigate('/admin/manage-featured/add')}
            className="flex items-center justify-center gap-2 bg-dusty-cocoa text-white px-6 py-3 rounded-xl font-bold hover:bg-deep-espresso transition-all shadow-md shadow-dusty-cocoa/20 active:scale-95"
          >
            <LuPlus size={18} />
            Add Featured Product
          </button>
        </div>

        {/* Section Label */}
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-soft-oatmeal/40" />
          <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-brand-teal">
            Homepage Preview
          </span>
          <div className="h-px flex-1 bg-soft-oatmeal/40" />
        </div>

        {/* Product Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 md:gap-4">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div
                key={n}
                className="bg-white rounded-xl md:rounded-2xl border border-soft-oatmeal/20 shadow-sm overflow-hidden flex flex-col animate-pulse"
              >
                <div className="h-20 md:h-32 bg-slate-200"></div>
                <div className="p-2 space-y-2">
                  <div className="h-3 bg-slate-200 rounded w-1/3"></div>
                  <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                  <div className="h-4 bg-slate-200 rounded w-1/2 pt-1"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 md:gap-4">
            <AnimatePresence>
              {products.map((product, index) => (
                <motion.div
                  key={product.id}
                  layout
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.5, delay: index * 0.04 }}
                  className="group bg-white rounded-xl md:rounded-2xl border border-soft-oatmeal/20 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden flex flex-col"
                >
                  {/* Image */}
                  <div className="relative h-20 md:h-32 overflow-hidden bg-soft-oatmeal/20 flex-shrink-0">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.style.display = 'none';
                          const fallback = e.target.parentNode.querySelector('.fallback-img');
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div className="fallback-img absolute inset-0 bg-soft-oatmeal/20 flex flex-col items-center justify-center text-warm-sand" style={{ display: product.image ? 'none' : 'flex' }}>
                      <LuImages size={20} className="opacity-45" />
                      <span className="text-[7px] font-black uppercase tracking-widest mt-1 text-slate-450">Broken</span>
                    </div>

                    {/* Tag Badge */}
                    {product.tag && (
                      <div className="absolute top-2 left-2">
                        <span className="bg-golden-glow/90 backdrop-blur-md text-deep-espresso text-[7px] md:text-[8px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter shadow-sm">
                          {product.tag}
                        </span>
                      </div>
                    )}

                    {/* Admin Actions on Hover */}
                    <div className="absolute top-2 right-2 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="h-7 w-7 bg-white/90 backdrop-blur-md shadow-xl rounded-full flex items-center justify-center text-[#240046]/60 hover:text-[#240046] hover:bg-[#240046]/5 transition-all"
                        title="Delete"
                      >
                        <LuTrash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-grow p-2 flex flex-col justify-between space-y-2">
                    <div className="space-y-1">
                      <h4 className="text-[8px] md:text-[10px] uppercase tracking-[0.2em] text-brand-teal font-black">
                        {product.category || 'Featured'}
                      </h4>

                      {/* Product Name */}
                      <h3 className="text-[9px] md:text-[11px] font-display font-bold text-deep-espresso line-clamp-1 leading-tight group-hover:text-brand-teal transition-colors duration-300">
                        {product.name}
                      </h3>
                    </div>

                    {/* Price */}
                    <div className="pt-2 border-t border-soft-oatmeal/10 flex items-center justify-between">
                      <div className="flex flex-col">
                        <div className="flex items-baseline gap-1">
                          <span className="text-xs md:text-sm font-black text-deep-espresso tracking-tight">
                            ₹{product.price}
                          </span>
                          {product.originalPrice > product.price && (
                            <span className="text-[9px] text-gray-400 line-through font-medium">
                              ₹{product.originalPrice}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Tag Pill (visual consistency) */}
                      {product.tag && (
                        <span className="text-[7px] bg-soft-oatmeal/30 text-dusty-cocoa px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider scale-90">
                          {product.tag}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Add Placeholder */}
            <motion.button
              layout
              onClick={() => navigate('/admin/manage-featured/add')}
              className="border-2 border-dashed border-soft-oatmeal rounded-2xl md:rounded-3xl min-h-[180px] md:min-h-[200px] flex flex-col items-center justify-center gap-1.5 text-brand-teal hover:border-dusty-cocoa hover:text-dusty-cocoa hover:bg-white/50 transition-all group active:scale-95"
            >
              <div className="w-10 h-10 rounded-full bg-soft-oatmeal/20 flex items-center justify-center group-hover:bg-brand-purple/10 transition-colors">
                <LuPackagePlus size={18} className="group-hover:scale-110 transition-transform opacity-60" />
              </div>
              <span className="font-bold text-[9px] md:text-[10px] uppercase tracking-wider">Add Product</span>
            </motion.button>
          </div>
        )}

        {/* Summary Footer */}
        <div className="bg-white p-4 rounded-xl border border-soft-oatmeal/30 flex items-center justify-between text-xs text-brand-teal">
          <p>
            Showing <span className="font-bold text-deep-espresso">{products.length}</span> featured products on homepage
          </p>
          <span className="text-[10px] bg-golden-glow/30 text-deep-espresso/60 px-3 py-1 rounded-full font-bold border border-warm-sand/20">
            Frontend Preview Only
          </span>
        </div>
      </div>
    </PageWrapper>
  );
};

export default ManageFeaturedProducts;
