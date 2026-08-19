import React, { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronRight, FiGrid, FiArrowRight, FiFilter, FiHome } from 'react-icons/fi';
import api from '../../../shared/utils/api';
import ProductCard from '../components/ProductCard';
import BrandScroll from '../components/BrandScroll';

const CategoryDetailPage = () => {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const subFilter = searchParams.get('sub');
  const subSubFilter = searchParams.get('subsub');

  const [category, setCategory] = useState(null);
  const [allCategories, setAllCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch current category by slug
        const catRes = await api.get(`/categories/slug/${slug}`);
        const currentCategory = catRes.data.data;
        setCategory(currentCategory);

        // Fetch products for this category (with optional subcategory filter)
        let productUrl = `/products?category=${encodeURIComponent(currentCategory.name)}`;
        if (subFilter) {
          productUrl += `&subcategory=${encodeURIComponent(subFilter)}`;
        }
        if (subSubFilter) {
          productUrl += `&subsubcategory=${encodeURIComponent(subSubFilter)}`;
        }
        console.log("[CategoryDetailPage] Fetching products from URL:", productUrl);
        const productRes = await api.get(productUrl);
        console.log("[CategoryDetailPage] Received products response:", productRes.data);
        setProducts(productRes.data.data);

        // Fetch all categories for sidebar
        const allRes = await api.get('/categories');
        setAllCategories(allRes.data.data);
      } catch (err) {
        console.error('Failed to fetch category data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    window.scrollTo(0, 0);
  }, [slug, subFilter]);

  if (loading) {
    return (
      <div className="min-h-svh flex flex-col items-center justify-center bg-[#FDFBF9]">
        <div className="w-16 h-16 border-4 border-warm-sand/20 border-t-warm-sand rounded-full animate-spin mb-6" />
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-deep-espresso/40 animate-pulse">Curating Selection</h2>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-svh flex flex-col items-center justify-center text-center p-8">
        <div className="mb-8 p-10 bg-soft-oatmeal/10 rounded-full text-deep-espresso/10">
          <FiHome size={64} />
        </div>
        <h2 className="text-3xl font-display font-semibold text-deep-espresso mb-4">Collection Unavailable</h2>
        <p className="text-deep-espresso/40 max-w-xs mb-10 leading-relaxed">This category might have moved or is currently being updated by our curators.</p>
        <Link to="/" className="bg-deep-espresso text-white px-10 py-4 rounded-full font-bold text-sm shadow-xl hover:scale-105 active:scale-95 transition-all">Return to Home</Link>
      </div>
    );
  }

  return (
    <div className="min-h-svh bg-[#FDFBF9]">
      {/* Category Hero */}
      <div className="relative h-[160px] md:h-[240px] overflow-hidden">
        <img
          src={category.image && !category.image.startsWith('C:') ? category.image : 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1600&q=80'}
          alt={category.name}
          className="absolute inset-0 w-full h-full object-cover scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
        <div className="absolute inset-0 flex flex-col justify-center px-6 md:px-16 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-1.5 md:space-y-3"
          >
            <nav className="flex items-center gap-1.5 text-white/60 text-[10px] md:text-xs font-medium mb-1 md:mb-2">
              <Link to="/" className="hover:text-white transition-colors">Home</Link>
              <FiChevronRight size={12} />
              <span className="text-white">Collections</span>
            </nav>
            <h1 className="text-2xl md:text-4xl font-display font-semibold text-white tracking-tight leading-none">
              {category.name}
            </h1>
            <p className="text-white/80 text-[11px] md:text-sm font-light leading-relaxed max-w-2xl border-l-2 border-warm-sand pl-3 md:pl-4 italic line-clamp-2 md:line-clamp-none">
              {category.description || `Exquisite pieces curated from the world's finest artisans, designed to bring character and timeless elegance to your modern living spaces.`}
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-4 md:py-8">
        <div className="relative flex flex-col lg:flex-row gap-6 lg:gap-10">

          {/* Main Content Area */}
          <main className="flex-1 w-full order-2">

            {/* Horizontal Sub-subcategories (Small Circular Images) at Top */}
            {subFilter && (() => {
              const activeSub = category.subcategories?.find(s => s.name.toLowerCase() === subFilter.toLowerCase());
              if (activeSub && activeSub.subsubcategories && activeSub.subsubcategories.length > 0) {
                return (
                  <div className="mb-6 md:mb-8">
                    <div className="flex overflow-x-auto no-scrollbar gap-3 md:gap-4 pb-3 items-center">
                      <Link
                        to={`/category/${slug}?sub=${encodeURIComponent(activeSub.name)}`}
                        className={`px-5 py-2 md:px-6 md:py-2.5 rounded-full text-[10px] md:text-[11px] font-bold uppercase tracking-wider whitespace-nowrap transition-all border ${!subSubFilter ? 'bg-[#0D5C55] text-white border-[#0D5C55] shadow-md' : 'bg-soft-oatmeal/10 text-deep-espresso/70 border-gray-200 hover:border-[#0D5C55]/30 hover:text-[#0D5C55]'}`}
                      >
                        All {activeSub.name}
                      </Link>

                      {activeSub.subsubcategories.map(ss => {
                        const isSubSubActive = subSubFilter && ss.name.toLowerCase() === subSubFilter.toLowerCase();
                        return (
                          <Link
                            key={ss._id}
                            to={`/category/${slug}?sub=${encodeURIComponent(activeSub.name)}&subsub=${encodeURIComponent(ss.name)}`}
                            className={`px-5 py-2 md:px-6 md:py-2.5 rounded-full text-[10px] md:text-[11px] font-bold uppercase tracking-wider whitespace-nowrap transition-all border ${isSubSubActive ? 'bg-[#0D5C55] text-white border-[#0D5C55] shadow-md' : 'bg-soft-oatmeal/10 text-deep-espresso/70 border-gray-200 hover:border-[#0D5C55]/30 hover:text-[#0D5C55]'}`}
                          >
                            {ss.name}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              }
              return null;
            })()}

            <div className="flex flex-col md:flex-row items-baseline justify-between mb-4 md:mb-6 gap-4 border-b border-soft-oatmeal/20 pb-4">
              <div>
                <h2 className="text-2xl md:text-3xl font-display font-semibold text-deep-espresso mb-1.5 leading-tight">Superior {category.name}</h2>
                <div className="flex items-center gap-2.5">
                  <span className="h-px w-6 bg-warm-sand" />
                  <p className="text-[11px] md:text-xs text-warm-sand font-semibold uppercase tracking-wider">Showing {products.length} Masterpieces</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-[10px] md:text-[11px] font-semibold uppercase tracking-wider text-deep-espresso/50">
                <span>Sort By:</span>
                <select className="bg-transparent border-b border-soft-oatmeal pb-0.5 focus:outline-none text-deep-espresso font-semibold cursor-pointer">
                  <option>Handpicked</option>
                  <option>Price: Low to High</option>
                  <option>Newest First</option>
                </select>
              </div>
            </div>



            {/* Products Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
              <AnimatePresence>
                {products.length > 0 ? (
                  products.map((product, index) => (
                    <motion.div
                      key={product._id}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <ProductCard product={product} index={index} variant="list" />
                    </motion.div>
                  ))
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="col-span-full py-12 text-center"
                  >
                    <p className="text-xl font-display font-medium text-deep-espresso/40 italic mb-6">These pieces are currently being curated...</p>
                    <Link to="/products" className="text-warm-sand font-semibold uppercase tracking-wider text-[11px] border-b-2 border-warm-sand pb-1 hover:text-deep-espresso hover:border-deep-espresso transition-all">Explore Full Collection</Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer call to action in center */}
            {products.length > 0 && (
              <div className="mt-8 py-6 border-t border-soft-oatmeal/20 text-center space-y-4">
                <h3 className="text-xl md:text-2xl font-display font-semibold text-deep-espresso underline decoration-warm-sand/20 decoration-4 underline-offset-[8px]">Request a Custom Selection?</h3>
                <p className="text-deep-espresso/50 max-w-lg mx-auto text-xs md:text-sm font-light italic">
                  Can't find the exact piece for your vision? Our designers can source exclusive materials tailored to your specific architectural requirements.
                </p>
                <Link to="/contact">
                  <button className="px-8 py-3.5 bg-deep-espresso text-white rounded-lg font-bold uppercase tracking-widest text-[10px] shadow-lg hover:bg-black transition-all mt-4">
                    Contact Curator
                  </button>
                </Link>
              </div>
            )}
          </main>

          {/* Left Sidebar - Subcategories (Small Squares Vertical) */}
          {category.subcategories && category.subcategories.length > 0 && (
            <aside className="w-full lg:w-32 xl:w-40 shrink-0 order-1 mb-6 lg:mb-0">
              <div className="lg:sticky lg:top-24">
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-deep-espresso/50 mb-4 border-b border-soft-oatmeal pb-2">Collections</h3>
                <div className="flex flex-row lg:flex-col overflow-x-auto lg:overflow-x-hidden lg:overflow-y-auto custom-scrollbar lg:max-h-[calc(100vh-140px)] gap-4 lg:gap-6 pb-2 lg:pb-4 lg:pr-2">
                  {category.subcategories.map(sub => {
                    const isSubActive = subFilter && sub.name.toLowerCase() === subFilter.toLowerCase();
                    return (
                      <Link
                        key={sub._id}
                        to={`/category/${slug}?sub=${encodeURIComponent(sub.name)}`}
                        className="group flex flex-col items-center min-w-[70px] lg:min-w-0"
                      >
                        <div className={`w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 rounded-2xl overflow-hidden mb-2 border transition-all p-0.5 ${isSubActive ? 'border-deep-espresso shadow-md scale-105' : 'border-deep-espresso/30 group-hover:border-deep-espresso/50'}`}>
                          <img
                            src={sub.image && !sub.image.startsWith('C:') ? sub.image : 'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?w=400&q=80'}
                            alt={sub.name}
                            className="w-full h-full object-cover transition-all duration-300"
                          />
                        </div>
                        <span className={`text-[10px] md:text-[11px] font-bold text-center uppercase tracking-wider transition-colors ${isSubActive ? 'text-deep-espresso' : 'text-deep-espresso/60 group-hover:text-deep-espresso'}`}>{sub.name}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </aside>
          )}
        </div>
      </div>

      <div className="border-t border-soft-oatmeal/10 pt-6 pb-12 md:pt-10 md:pb-20 bg-white/30 backdrop-blur-xl">
        <BrandScroll title="Premium Brands" />
      </div>
    </div>
  );
};

export default CategoryDetailPage;
