import RequestQuoteButton from '../components/RFQ/RequestQuoteButton';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronRight, FiChevronLeft, FiGrid, FiArrowRight, FiFilter, FiHome } from 'react-icons/fi';
import api from '../../../shared/utils/api';
import ProductCard from '../components/ProductCard';
import BrandScroll from '../components/BrandScroll';
import SponsoredBanner from '../components/SponsoredBanner';

// Horizontal chip row with arrow buttons (shown only when the row overflows), so it can be
// scrolled with a mouse on desktop as well as by swipe/touch on mobile.
const ChipScroller = ({ children, className = '' }) => {
  const ref = useRef(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    update();
    // Bring the active chip into view when the row first renders
    const active = el.querySelector('[data-active="true"]');
    if (active) {
      const target = active.offsetLeft - el.clientWidth / 2 + active.clientWidth / 2;
      el.scrollLeft = Math.max(target, 0);
      update();
    }
    el.addEventListener('scroll', update, { passive: true });
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(update) : null;
    if (ro) { ro.observe(el); Array.from(el.children).forEach(c => ro.observe(c)); }
    window.addEventListener('resize', update);
    return () => {
      el.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
      if (ro) ro.disconnect();
    };
  }, [update, children]);

  const scrollByDir = (dir) => {
    const el = ref.current;
    if (el) el.scrollBy({ left: dir * Math.max(el.clientWidth * 0.7, 200), behavior: 'smooth' });
  };

  const arrow = 'absolute top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white border border-gray-200 shadow-md flex items-center justify-center text-deep-espresso hover:bg-[#0D5C55] hover:text-white hover:border-[#0D5C55] transition-colors';
  return (
    <div className="relative min-w-0 max-w-full">
      {canLeft && (
        <>
          <div className="pointer-events-none absolute left-0 top-0 bottom-3 w-10 bg-gradient-to-r from-[#F5F7F8] to-transparent z-[5]" />
          <button type="button" aria-label="Scroll left" onClick={() => scrollByDir(-1)} className={`${arrow} left-0`}><FiChevronLeft size={16} /></button>
        </>
      )}
      <div ref={ref} className={`flex overflow-x-auto no-scrollbar scroll-smooth ${className}`}>{children}</div>
      {canRight && (
        <>
          <div className="pointer-events-none absolute right-0 top-0 bottom-3 w-10 bg-gradient-to-l from-[#F5F7F8] to-transparent z-[5]" />
          <button type="button" aria-label="Scroll right" onClick={() => scrollByDir(1)} className={`${arrow} right-0`}><FiChevronRight size={16} /></button>
        </>
      )}
    </div>
  );
};

// In-memory cache so revisiting a category renders instantly
const pageCache = new Map();
const PAGE_SIZE = 12;
// UI option -> value sent to the API's `sort` param (sorting must happen server-side because results are paginated)
const SORT_OPTIONS = [
  { key: 'handpicked', label: 'Handpicked', api: '-averageRating,-createdAt' },
  { key: 'price-asc', label: 'Price: Low to High', api: 'price' },
  { key: 'price-desc', label: 'Price: High to Low', api: '-price' },
  { key: 'newest', label: 'Newest First', api: '-createdAt' },
];

const CategoryDetailPage = () => {
  const { slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const subFilter = searchParams.get('sub');
  const subSubFilter = searchParams.get('subsub');
  const sortKey = SORT_OPTIONS.some(o => o.key === searchParams.get('sort')) ? searchParams.get('sort') : 'handpicked';
  const sortApi = SORT_OPTIONS.find(o => o.key === sortKey).api;
  const page = Math.max(parseInt(searchParams.get('page'), 10) || 1, 1);

  const [category, setCategory] = useState(null);
  const [allCategories, setAllCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ totalResults: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cacheKey = `${slug}|${subFilter || ''}|${subSubFilter || ''}|${page}|${sortKey}`;
    let cancelled = false;
    const cached = pageCache.get(cacheKey);
    if (cached) {
      // Show previously loaded data instantly, refresh quietly in background
      setCategory(cached.category);
      setProducts(cached.products);
      setPagination(cached.pagination || { totalResults: cached.products.length, totalPages: 1 });
      setAllCategories(cached.allCategories);
      setLoading(false);
    } else {
      setLoading(true);
    }
    const fetchData = async () => {
      try {
        // Fire the independent requests together instead of one after another
        const allCategoriesReq = api.get('/categories');
        const catRes = await api.get(`/categories/slug/${slug}`);
        const currentCategory = catRes.data.data;

        let productUrl = `/products?category=${encodeURIComponent(currentCategory.name)}&page=${page}&limit=${PAGE_SIZE}&sort=${encodeURIComponent(sortApi)}`;
        if (subFilter) {
          productUrl += `&subcategory=${encodeURIComponent(subFilter)}`;
        }
        if (subSubFilter) {
          productUrl += `&subsubcategory=${encodeURIComponent(subSubFilter)}`;
        }
        const [productRes, allRes] = await Promise.all([api.get(productUrl), allCategoriesReq]);
        if (cancelled) return;
        const pageInfo = {
          totalResults: productRes.data.totalResults ?? productRes.data.data.length,
          totalPages: productRes.data.totalPages || 1,
        };
        pageCache.set(cacheKey, {
          category: currentCategory,
          products: productRes.data.data,
          allCategories: allRes.data.data,
          pagination: pageInfo,
        });
        setCategory(currentCategory);
        setProducts(productRes.data.data);
        setPagination(pageInfo);
        setAllCategories(allRes.data.data);
      } catch (err) {
        console.error('Failed to fetch category data:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchData();
    window.scrollTo(0, 0);
    return () => {
      cancelled = true;
    };
  }, [slug, subFilter, subSubFilter, page, sortKey, sortApi]);

  const changeSort = (key) => {
    const next = new URLSearchParams(searchParams);
    next.delete('page');
    if (key === 'handpicked') next.delete('sort'); else next.set('sort', key);
    setSearchParams(next);
  };

  const goToPage = (n) => {
    const next = new URLSearchParams(searchParams);
    if (n <= 1) next.delete('page'); else next.set('page', String(n));
    setSearchParams(next);
  };

  if (loading) {
    return (
      <div className="min-h-svh flex items-center justify-center bg-[#F5F7F8]">
        <div className="w-12 h-12 border-4 border-warm-sand/20 border-t-warm-sand rounded-full animate-spin" />
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-svh flex flex-col items-center justify-center text-center p-8 bg-[#F5F7F8]">
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
    <div className="min-h-svh bg-[#F5F7F8] overflow-x-clip">
      {/* Paid banner ads for this category (renders nothing when there are none) */}
      <SponsoredBanner categoryId={category._id} />

      {/* Category Hero */}
      <div className="relative h-[160px] md:h-[240px] overflow-hidden">
        <img
          src={category.image && !category.image.startsWith('C:') ? category.image : 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1600&q=80'}
          alt={category.name}
          className="absolute inset-0 w-full h-full object-cover scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
        <div className="absolute inset-0 flex items-center">
         <div className="w-full max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-1.5 md:space-y-3 max-w-4xl"
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
            <RequestQuoteButton
              source="category-page"
              categoryId={category._id}
              categoryName={category.name}
              label={`Request a Quote for ${category.name}`}
              variant="card"
              size="sm"
            />
          </motion.div>
         </div>
        </div>
      </div>

      <div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12 py-4 md:py-6">
        <div className="relative flex flex-col lg:flex-row gap-5 lg:gap-8">

          {/* Main Content Area */}
          <main className="flex-1 w-full min-w-0 order-2">

            {/* Horizontal Sub-subcategories (Small Circular Images) at Top */}
            {subFilter && (() => {
              const activeSub = category.subcategories?.find(s => s.name.toLowerCase() === subFilter.toLowerCase());
              if (activeSub && activeSub.subsubcategories && activeSub.subsubcategories.length > 0) {
                return (
                  <div className="mb-6 md:mb-8">
                    <ChipScroller className="gap-3 md:gap-4 pb-3 items-center">
                      <Link
                        to={`/category/${slug}?sub=${encodeURIComponent(activeSub.name)}`}
                        data-active={!subSubFilter ? 'true' : undefined}
                        className={`px-5 py-2 md:px-6 md:py-2.5 rounded-full text-[10px] md:text-[11px] font-bold uppercase tracking-wider whitespace-nowrap shrink-0 transition-all border ${!subSubFilter ? 'bg-[#0D5C55] text-white border-[#0D5C55] shadow-md' : 'bg-soft-oatmeal/10 text-deep-espresso/70 border-gray-200 hover:border-[#0D5C55]/30 hover:text-[#0D5C55]'}`}
                      >
                        All {activeSub.name}
                      </Link>

                      {activeSub.subsubcategories.map(ss => {
                        const isSubSubActive = subSubFilter && ss.name.toLowerCase() === subSubFilter.toLowerCase();
                        return (
                          <Link
                            key={ss._id}
                            to={`/category/${slug}?sub=${encodeURIComponent(activeSub.name)}&subsub=${encodeURIComponent(ss.name)}`}
                            data-active={isSubSubActive ? 'true' : undefined}
                            className={`px-5 py-2 md:px-6 md:py-2.5 rounded-full text-[10px] md:text-[11px] font-bold uppercase tracking-wider whitespace-nowrap shrink-0 transition-all border ${isSubSubActive ? 'bg-[#0D5C55] text-white border-[#0D5C55] shadow-md' : 'bg-soft-oatmeal/10 text-deep-espresso/70 border-gray-200 hover:border-[#0D5C55]/30 hover:text-[#0D5C55]'}`}
                          >
                            {ss.name}
                          </Link>
                        );
                      })}
                    </ChipScroller>
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
                  <p className="text-[11px] md:text-xs text-warm-sand font-semibold uppercase tracking-wider">{pagination.totalResults > 0
                      ? `Showing ${(page - 1) * PAGE_SIZE + 1}-${(page - 1) * PAGE_SIZE + products.length} of ${pagination.totalResults} Masterpieces`
                      : 'Showing 0 Masterpieces'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-[10px] md:text-[11px] font-semibold uppercase tracking-wider text-deep-espresso/50">
                <span>Sort By:</span>
                <select
                  value={sortKey}
                  onChange={(e) => changeSort(e.target.value)}
                  className="bg-transparent border-b border-soft-oatmeal pb-0.5 focus:outline-none text-deep-espresso font-semibold cursor-pointer"
                >
                  {SORT_OPTIONS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
                </select>
              </div>
            </div>



            {/* Products Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 md:gap-5 [&>*]:min-w-0">
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

            {/* Pagination */}
            {pagination.totalPages > 1 && (() => {
              const total = pagination.totalPages;
              const pages = [];
              for (let n = 1; n <= total; n++) {
                if (n === 1 || n === total || Math.abs(n - page) <= 1) pages.push(n);
                else if (pages[pages.length - 1] !== '...') pages.push('...');
              }
              const btn = 'min-w-9 h-9 px-3 rounded-lg text-xs font-bold border transition-all';
              return (
                <nav aria-label="Pagination" className="mt-8 flex flex-wrap items-center justify-center gap-2">
                  <button type="button" disabled={page <= 1} onClick={() => goToPage(page - 1)} className={`${btn} border-gray-200 bg-white text-deep-espresso disabled:opacity-40 disabled:cursor-not-allowed hover:border-[#0D5C55]`}>Prev</button>
                  {pages.map((n, i) => n === '...' ? (
                    <span key={`dots-${i}`} className="px-1 text-gray-400">…</span>
                  ) : (
                    <button key={n} type="button" onClick={() => goToPage(n)} aria-current={n === page ? 'page' : undefined}
                      className={`${btn} ${n === page ? 'bg-[#0D5C55] text-white border-[#0D5C55]' : 'border-gray-200 bg-white text-deep-espresso hover:border-[#0D5C55]'}`}>{n}</button>
                  ))}
                  <button type="button" disabled={page >= total} onClick={() => goToPage(page + 1)} className={`${btn} border-gray-200 bg-white text-deep-espresso disabled:opacity-40 disabled:cursor-not-allowed hover:border-[#0D5C55]`}>Next</button>
                </nav>
              );
            })()}

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
            <aside className="w-full lg:w-28 xl:w-32 shrink-0 order-1 mb-4 lg:mb-0">
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

      <div className="border-t border-soft-oatmeal/10 pt-2 pb-6 md:pt-4 md:pb-10 bg-white">
        <BrandScroll title="Premium Brands" />
      </div>
    </div>
  );
};

export default CategoryDetailPage;
