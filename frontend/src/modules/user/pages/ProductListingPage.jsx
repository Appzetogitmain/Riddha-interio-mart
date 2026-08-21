import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ProductCard from '../components/ProductCard';
import FilterPanel from '../components/FilterPanel';
import AppliedFilters from '../components/AppliedFilters';
import { categories } from '../data/categories';
import { FiFilter, FiChevronDown, FiX } from 'react-icons/fi';
import api from '../../../shared/utils/api';
import Button from '../../../shared/components/Button';
import { OFFER_TYPES } from '../../../shared/constants/offerTypes';

const ProductListingPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sortBy, setSortBy] = useState('featured');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterOptions, setFilterOptions] = useState(null);
  const [filterLoading, setFilterLoading] = useState(false);

  // Filter state from URL params
  const [filters, setFilters] = useState({
    minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
    maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
    stock: searchParams.get('stock') || undefined,
    minRating: searchParams.get('minRating') ? Number(searchParams.get('minRating')) : undefined,
    userLat: searchParams.get('userLat') ? Number(searchParams.get('userLat')) : undefined,
    userLon: searchParams.get('userLon') ? Number(searchParams.get('userLon')) : undefined,
    distance: searchParams.get('distance') || undefined,
    region: searchParams.get('region') || undefined,
    verifiedOnly: searchParams.get('verifiedOnly') || undefined,
    verificationStatus: searchParams.get('verificationStatus') || undefined,
    deliveryDay: searchParams.get('deliveryDay') || undefined,
    deliveryType: searchParams.get('deliveryType') || undefined,
    freeDelivery: searchParams.get('freeDelivery') || undefined,
    newArrivalDays: searchParams.get('newArrivalDays') || undefined,
    offerType: searchParams.get('offerType') || undefined,
    grade: searchParams.get('grade') || undefined,
    ecoFriendly: searchParams.get('ecoFriendly') || undefined,
    waterproof: searchParams.get('waterproof') || undefined
  });

  const activeCategory = searchParams.get('category') || 'all';
  const searchQuery = searchParams.get('search') || '';

  // Fetch filter options on mount
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const res = await api.get('/filters/options');
        if (res.data && res.data.data) {
          setFilterOptions(res.data.data);
        }
      } catch (err) {
        console.error('Failed to fetch filter options:', err);
      }
    };
    fetchFilterOptions();
  }, []);

  // Fetch products with filters
  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const params = {};

        // Add all active filters to request
        if (filters.minPrice !== undefined) params.minPrice = filters.minPrice;
        if (filters.maxPrice !== undefined) params.maxPrice = filters.maxPrice;
        if (filters.stock) params.stock = filters.stock;
        if (filters.minRating !== undefined) params.minRating = filters.minRating;
        if (filters.userLat !== undefined) params.userLat = filters.userLat;
        if (filters.userLon !== undefined) params.userLon = filters.userLon;
        if (filters.distance) params.distance = filters.distance;
        if (filters.region) params.region = filters.region;
        if (filters.verifiedOnly) params.verifiedOnly = filters.verifiedOnly;
        if (filters.verificationStatus) params.verificationStatus = filters.verificationStatus;
        if (filters.deliveryDay) params.deliveryDay = filters.deliveryDay;
        if (filters.deliveryType) params.deliveryType = filters.deliveryType;
        if (filters.freeDelivery) params.freeDelivery = filters.freeDelivery;
        if (filters.newArrivalDays) params.newArrivalDays = filters.newArrivalDays;
        if (filters.offerType) params.offerType = filters.offerType;
        if (filters.grade) params.grade = filters.grade;
        if (filters.ecoFriendly) params.ecoFriendly = filters.ecoFriendly;
        if (filters.waterproof) params.waterproof = filters.waterproof;

        // Use new filter endpoint if any filters are active, otherwise use standard products endpoint
        const endpoint = Object.keys(params).length > 0 ? '/filters/search' : '/products';
        const res = await api.get(endpoint, { params });
        setProducts(res.data.data || []);
      } catch (err) {
        console.error('Failed to fetch products:', err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [filters]);

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
  }, [activeCategory, sortBy, products, searchQuery]);

  const handleCategoryChange = (slug) => {
    if (slug === 'all') {
      searchParams.delete('category');
    } else {
      searchParams.set('category', slug);
    }
    setSearchParams(searchParams);
  };

  const handleFiltersChange = (newFilters) => {
    const params = new URLSearchParams(searchParams);

    // Update URL params with new filters
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    setFilters(newFilters);
    setSearchParams(params);
  };

  const handleRemoveFilter = (filterNames) => {
    const names = Array.isArray(filterNames) ? filterNames : [filterNames];
    const newFilters = { ...filters };
    names.forEach(name => {
      delete newFilters[name];
    });
    handleFiltersChange(newFilters);
  };

  const handleClearAllFilters = () => {
    const newFilters = {
      minPrice: undefined,
      maxPrice: undefined,
      stock: undefined,
      minRating: undefined,
      userLat: undefined,
      userLon: undefined,
      distance: undefined,
      region: undefined,
      verifiedOnly: undefined,
      verificationStatus: undefined,
      deliveryDay: undefined,
      deliveryType: undefined,
      freeDelivery: undefined,
      newArrivalDays: undefined,
      offerType: undefined,
      grade: undefined,
      ecoFriendly: undefined,
      waterproof: undefined
    };
    handleFiltersChange(newFilters);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-2 md:py-6"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 md:mb-6 gap-4 md:gap-8"
      >
        <div className="space-y-1">
          <h1 className="text-xl md:text-2xl font-display font-semibold tracking-tight">Our Collection</h1>
          <p className="text-deep-espresso/70 text-sm md:text-base font-normal">
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

      {/* Applied Filters */}
      <AppliedFilters
        filters={filters}
        onRemoveFilter={handleRemoveFilter}
        onClearAll={handleClearAllFilters}
      />

      <div className="flex gap-16 relative">
        {/* Sidebar - Desktop (Updated with FilterPanel) */}
        <aside className="hidden md:block w-72 flex-shrink-0 sticky top-32 max-h-[calc(100vh-9rem)] overflow-y-auto pr-2">
          <FilterPanel
            filters={filters}
            onFiltersChange={handleFiltersChange}
            filterOptions={filterOptions}
            isLoading={filterLoading}
          />
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
                  key="products"
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
                    onClick={handleClearAllFilters}
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

      {/* Mobile Sidebar Overlay (Updated with FilterPanel) */}
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
              <div className="p-8 space-y-6 overflow-y-auto flex-1">
                <FilterPanel
                  filters={filters}
                  onFiltersChange={(newFilters) => {
                    handleFiltersChange(newFilters);
                    setIsSidebarOpen(false);
                  }}
                  filterOptions={filterOptions}
                  isLoading={filterLoading}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ProductListingPage;
