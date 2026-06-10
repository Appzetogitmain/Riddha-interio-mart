import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ProductCard from '../components/ProductCard';
import { categories } from '../data/categories';
import { FiFilter, FiChevronDown, FiX } from 'react-icons/fi';
import api from '../../../shared/utils/api';

const ProductListingPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sortBy, setSortBy] = useState('featured');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const activeCategory = searchParams.get('category') || 'all';
  const searchQuery = searchParams.get('search') || '';

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const res = await api.get('/products');
        setProducts(res.data.data);
      } catch (err) {
        console.error('Failed to fetch products:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    let result = [...products];
    if (activeCategory !== 'all') {
      const categoryObj = categories.find(c => c.slug === activeCategory);
      const categoryName = categoryObj ? categoryObj.name : activeCategory;
      result = result.filter(p =>
        p.category.toLowerCase() === categoryName.toLowerCase() ||
        p.category.toLowerCase() === activeCategory.toLowerCase()
      );
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.category.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q))
      );
    }

    const getEffectivePrice = (p) => {
      const pPrice = Number(p.price) || 0;
      const pDiscount = Number(p.discountPrice) || 0;
      return (pDiscount > 0 && pDiscount < pPrice) ? pDiscount : pPrice;
    };

    if (sortBy === 'price-low') result.sort((a, b) => getEffectivePrice(a) - getEffectivePrice(b));
    if (sortBy === 'price-high') result.sort((a, b) => getEffectivePrice(b) - getEffectivePrice(a));

    return result;
  }, [activeCategory, sortBy, products]);

  const handleCategoryChange = (slug) => {
    if (slug === 'all') {
      searchParams.delete('category');
    } else {
      searchParams.set('category', slug);
    }
    setSearchParams(searchParams);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-2 md:py-16"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 md:mb-16 gap-4 md:gap-8"
      >
        <div className="space-y-1">
          <h1 className="text-3xl md:text-5xl font-display font-semibold tracking-tight">Our Collection</h1>
          <p className="text-deep-espresso/70 text-sm md:text-lg font-normal">
            {searchQuery ? `Search results for "${searchQuery}"` : `Showing ${filteredProducts.length} premium pieces for your dream home.`}
          </p>
        </div>

        <div className="flex items-center space-x-4 w-full md:w-auto">
          {/* Mobile Filter Toggle */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsSidebarOpen(true)}
            className="md:hidden flex-1 flex items-center justify-center space-x-3 px-6 py-3.5 bg-soft-oatmeal/10 border border-soft-oatmeal/20 rounded-2xl text-deep-espresso font-bold"
          >
            <FiFilter className="h-5 w-5" />
            <span>Filters</span>
          </motion.button>

          <div className="hidden md:flex items-center space-x-3 text-[11px] font-semibold text-deep-espresso/40 mr-4">
            <span>Sort by:</span>
          </div>
          <div className="relative group flex-1 md:flex-none">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="appearance-none w-full md:w-64 px-6 py-3.5 bg-white border border-soft-oatmeal rounded-2xl focus:outline-none focus:ring-4 focus:ring-warm-sand/10 cursor-pointer pr-12 text-sm font-semibold text-deep-espresso transition-all"
            >
              <option value="featured">Featured Recommendations</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>

            </select>
            <FiChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
          </div>
        </div>
      </motion.div>

      <div className="flex gap-16 relative">
        {/* Sidebar - Desktop */}
        <aside className="hidden md:block w-72 space-y-12 flex-shrink-0 sticky top-32 h-fit">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h3 className="text-[11px] font-semibold text-deep-espresso flex items-center mb-8 uppercase tracking-wider">
              <span className="h-px w-6 bg-warm-sand mr-3"></span>
              Categories
            </h3>
            <div className="space-y-3">
              <button
                onClick={() => handleCategoryChange('all')}
                className={`flex items-center justify-between w-full p-4 rounded-2xl transition-all group ${activeCategory === 'all' ? 'bg-[#189D91] text-white font-semibold shadow-lg shadow-[#189D91]/20' : 'text-deep-espresso/60 hover:bg-soft-oatmeal/10 hover:text-deep-espresso'}`}
              >
                <span className="text-sm font-medium group-hover:translate-x-1 transition-transform">All Collections</span>
                <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold ${activeCategory === 'all' ? 'bg-white/20' : 'bg-soft-oatmeal/20'}`}>{products.length}</span>
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryChange(cat.slug)}
                  className={`flex items-center justify-between w-full p-4 rounded-2xl transition-all group ${activeCategory === cat.slug ? 'bg-[#189D91] text-white font-semibold shadow-lg shadow-[#189D91]/20' : 'text-deep-espresso/60 hover:bg-soft-oatmeal/10 hover:text-deep-espresso'}`}
                >
                  <span className="text-sm font-medium group-hover:translate-x-1 transition-transform">{cat.name}</span>
                  <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold ${activeCategory === cat.slug ? 'bg-white/20' : 'bg-soft-oatmeal/20'}`}>{cat.productCount}</span>
                </button>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h3 className="text-[11px] font-semibold text-deep-espresso flex items-center mb-8 uppercase tracking-wider">
              <span className="h-px w-6 bg-warm-sand mr-3"></span>
              Price Range
            </h3>
            <div className="px-2 space-y-4">
              <input type="range" className="w-full h-1.5 bg-soft-oatmeal rounded-full appearance-none cursor-pointer accent-warm-sand" />
              <div className="flex justify-between text-[10px] text-gray-400 font-semibold uppercase tracking-wide">
                <span>₹0</span>
                <span>₹10,000+</span>
              </div>
            </div>
          </motion.div>
        </aside>

        {/* Product Grid */}
        <div className="flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-32">
              <div className="h-12 w-12 border-4 border-warm-sand/20 border-t-warm-sand rounded-full animate-spin"></div>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {filteredProducts.length > 0 ? (
                <motion.div
                  key={activeCategory}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4 }}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-10"
                >
                  {filteredProducts.map((product, index) => (
                    <ProductCard key={product._id || product.id} product={product} index={index} variant="list" />
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-32 text-center"
                >
                  <div className="mb-8 p-10 bg-soft-oatmeal/10 rounded-full text-deep-espresso/10">
                    <FiFilter className="h-24 w-24" />
                  </div>
                  <h3 className="text-2xl md:text-3xl font-display font-semibold mb-3">No matching pieces</h3>
                  <p className="text-deep-espresso/40 max-w-sm text-lg font-medium leading-relaxed">Try adjusting your filters to find your perfect interior elements.</p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleCategoryChange('all')}
                    className="mt-10 bg-[#189D91] hover:bg-[#14847a] text-white px-10 py-4 rounded-xl font-bold text-sm shadow-md shadow-[#189D91]/15 transition-all"
                  >
                    Reset all filters
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] md:hidden bg-deep-espresso/40 backdrop-blur-md px-4 pt-20"
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute right-0 top-0 h-full w-[85%] bg-white shadow-[-20px_0_60px_-15px_rgba(0,0,0,0.3)] flex flex-col"
            >
              <div className="p-8 border-b border-soft-oatmeal flex justify-between items-center">
                <h3 className="text-xl font-display font-semibold text-deep-espresso">Filters</h3>
                <motion.button
                  whileTap={{ scale: 0.8 }}
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-3 bg-soft-oatmeal/20 rounded-full"
                >
                  <FiX className="h-6 w-6" />
                </motion.button>
              </div>
              <div className="p-8 space-y-12 overflow-y-auto flex-1">
                <div>
                  <h4 className="text-xs uppercase tracking-[0.3em] font-black text-warm-sand mb-6">Collections</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {['all', ...categories.map(c => c.slug)].map(slug => (
                      <button
                        key={slug}
                        onClick={() => { handleCategoryChange(slug); setIsSidebarOpen(false); }}
                        className={`px-5 py-4 rounded-[1.25rem] border text-xs font-black uppercase tracking-widest transition-all ${activeCategory === slug ? 'bg-[#189D91] border-[#189D91] text-white shadow-lg' : 'border-soft-oatmeal/40 text-deep-espresso hover:bg-soft-oatmeal/10'}`}
                      >
                        {slug}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="p-8 border-t border-soft-oatmeal/20">
                <Button className="w-full h-16 rounded-full text-lg shadow-2xl" onClick={() => setIsSidebarOpen(false)}>Apply Filters</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ProductListingPage;
