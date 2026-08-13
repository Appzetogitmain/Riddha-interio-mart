import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiArrowLeft, FiCamera, FiShoppingCart, FiSearch, FiChevronDown, FiHeart, FiStar } from 'react-icons/fi';
import api from '../../../shared/utils/api';
import { useCart } from '../data/CartContext';
import SearchRefinement from '../components/SearchRefinement';

const SearchProductsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('search') || '';
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('featured');
  const navigate = useNavigate();
  const { cart } = useCart();

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
    if (query) {
      const q = query.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.category.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q))
      );
    }
    
    if (sortBy === 'low') result.sort((a, b) => a.price - b.price);
    if (sortBy === 'high') result.sort((a, b) => b.price - a.price);
    
    return result;
  }, [query, products, sortBy]);

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      {/* Search Header - Teal Style */}
      <header className="sticky top-0 z-[60] bg-[#127F75] px-4 py-3 flex items-center gap-4 shadow-lg">
        <button 
          onClick={() => navigate(-1)}
          className="text-white p-1 hover:bg-white/10 rounded-full transition-colors"
        >
          <FiArrowLeft size={24} />
        </button>

        <div className="flex-1 relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
            <FiSearch size={18} />
          </div>
          <input 
            type="text" 
            value={query}
            readOnly
            onClick={() => navigate('/search-entry')}
            className="w-full bg-white rounded-full py-2.5 pl-11 pr-12 text-sm font-medium focus:outline-none"
          />
          <button 
            onClick={() => navigate('/search-entry', { state: { autoStart: 'image' } })}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#127F75]"
          >
            <FiCamera size={20} />
          </button>
        </div>

        <Link to="/cart" className="relative text-white p-2 hover:bg-white/10 rounded-full transition-colors">
          <FiShoppingCart size={24} />
          {cart.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-[10px] font-black h-5 w-5 rounded-full flex items-center justify-center border-2 border-[#127F75]">
              {cart.length}
            </span>
          )}
        </Link>
      </header>

      {/* Filters Row */}
      <div className="bg-white border-b border-gray-100 sticky top-[68px] z-50">
        <div className="flex gap-2 overflow-x-auto no-scrollbar px-4 py-3">
          {[
            { label: 'Sort', options: ['Popularity', 'Price: Low to High', 'Price: High to Low'] },
            { label: 'Category', options: ['Living', 'Bedroom', 'Kitchen'] },
            { label: 'Material', options: ['Wood', 'Metal', 'Glass'] },
            { label: 'Price', options: ['Under ₹5000', '₹5000 - ₹15000', 'Above ₹15000'] }
          ].map((filter, idx) => (
            <button 
              key={idx}
              className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold text-gray-700 whitespace-nowrap hover:bg-gray-100 transition-colors"
            >
              {filter.label} <FiChevronDown size={14} className="text-gray-400" />
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-4">
        <SearchRefinement query={query} />

        <div className="mb-4">
          <p className="text-sm font-bold text-gray-400">
            {filteredProducts.length} results found
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-10 h-10 border-4 border-[#127F75]/20 border-t-[#127F75] rounded-full animate-spin" />
            <p className="text-sm font-bold text-[#127F75] animate-pulse">Finding perfect matches...</p>
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="space-y-3">
            {filteredProducts.map((product, idx) => (
              <SearchProductListItem key={product._id || idx} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
              <FiSearch size={40} />
            </div>
            <h3 className="text-lg font-black text-gray-900 mb-1">No results for "{query}"</h3>
            <p className="text-sm text-gray-400">Try searching for something else</p>
          </div>
        )}
      </main>
    </div>
  );
};

const SearchProductListItem = ({ product }) => {
  const navigate = useNavigate();
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => navigate(`/products/${product._id}`)}
      className="bg-white p-3 rounded-2xl border border-gray-100 flex gap-4 cursor-pointer hover:shadow-md transition-all group relative"
    >
      {/* Image Section */}
      <div className="w-[100px] h-[100px] md:w-[140px] md:h-[140px] shrink-0 rounded-xl overflow-hidden bg-gray-50 border border-gray-50">
        <img 
          src={product.images?.[0] || 'https://images.unsplash.com/photo-1513519245088-0e12902e35ca?w=400&q=80'} 
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
      </div>

      {/* Info Section */}
      <div className="flex-1 flex flex-col py-0.5">
        <div className="flex justify-between items-start">
          <h3 className="text-sm md:text-base font-bold text-gray-900 leading-tight pr-8">{product.name}</h3>
          <button className="absolute top-3 right-3 p-1.5 text-gray-300 hover:text-pink-500 transition-colors">
            <FiHeart size={18} />
          </button>
        </div>

        <div className="flex items-center gap-1 mt-1.5">
          <div className="flex items-center text-[#4CAF50]">
            <FiStar size={12} className="fill-current" />
          </div>
          <span className="text-[11px] font-bold text-gray-900">4.8</span>
          <span className="text-[11px] font-medium text-gray-400">(156)</span>
        </div>

        <div className="mt-auto">
          <div className="flex items-baseline gap-1">
            <span className="text-base md:text-lg font-black text-gray-900">₹{product.price}</span>
            <span className="text-[10px] font-bold text-gray-400">/sq.ft.</span>
          </div>
          <p className="text-[11px] font-bold text-[#4CAF50] mt-0.5">In Stock</p>
        </div>
      </div>
    </motion.div>
  );
};

export default SearchProductsPage;
