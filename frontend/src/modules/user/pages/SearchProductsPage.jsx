import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { FiArrowLeft, FiCamera, FiShoppingCart, FiSearch, FiChevronDown, FiCheck, FiZap } from 'react-icons/fi';
import api from '../../../shared/utils/api';
import { useCart } from '../data/CartContext';
import SearchRefinement from '../components/SearchRefinement';
import ProductCard from '../components/ProductCard';

const SORT_OPTIONS = [
  { value: 'featured', label: 'Popularity' },
  { value: 'low', label: 'Price: Low to High' },
  { value: 'high', label: 'Price: High to Low' }
];

const SearchProductsPage = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('search') || '';
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('featured');
  const [sortOpen, setSortOpen] = useState(false);
  const [parsedFilters, setParsedFilters] = useState(null);
  const [chips, setChips] = useState([]);
  const [interpretation, setInterpretation] = useState('');
  const [relaxedMatch, setRelaxedMatch] = useState(false);
  const navigate = useNavigate();
  const { cart, addToCart } = useCart();
  const [searchInput, setSearchInput] = useState(query);

  useEffect(() => {
    setSearchInput(query);
  }, [query]);

  const handleBuyNow = (product) => {
    addToCart(product, 1);
    navigate('/cart');
  };

  const submitSearch = () => {
    const trimmed = searchInput.trim();
    if (!trimmed) return;
    navigate(`/search-results?search=${encodeURIComponent(trimmed)}`);
  };

  const runSearch = useCallback(async (overrideFilters) => {
    setLoading(true);
    try {
      const params = overrideFilters
        ? { filters: JSON.stringify(overrideFilters) }
        : { search: query };
      const { data } = await api.get('/products/smart-search', { params });
      if (data.success) {
        setProducts(data.data || []);
        setParsedFilters(data.parsedFilters || null);
        setChips(data.chips || []);
        setInterpretation(data.interpretation || '');
        setRelaxedMatch(!!data.relaxedMatch);
      }
    } catch (err) {
      console.error('Smart search failed:', err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    runSearch();
  }, [runSearch]);

  const handleRemoveChip = (chip) => {
    if (!parsedFilters) return;
    const next = { ...parsedFilters };
    const booleanKeys = ['antiSlip', 'waterproof', 'fireProof', 'ecoFriendly'];

    if (chip.key.startsWith('keyword:')) {
      next.keywords = (next.keywords || []).filter((kw) => kw !== chip.value);
    } else if (booleanKeys.includes(chip.key)) {
      next[chip.key] = false;
    } else {
      next[chip.key] = null;
    }
    runSearch(next);
  };

  const sortedProducts = useMemo(() => {
    const result = [...products];
    if (sortBy === 'low') result.sort((a, b) => (a.price || 0) - (b.price || 0));
    if (sortBy === 'high') result.sort((a, b) => (b.price || 0) - (a.price || 0));
    return result;
  }, [products, sortBy]);

  const activeSortLabel = SORT_OPTIONS.find((o) => o.value === sortBy)?.label || 'Sort';

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
          <button
            onClick={submitSearch}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#127F75]"
          >
            <FiSearch size={18} />
          </button>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') submitSearch(); }}
            placeholder="Search products..."
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
        <div className="flex gap-2 overflow-x-auto no-scrollbar px-4 py-3 relative">
          <div className="relative">
            <button
              onClick={() => setSortOpen((o) => !o)}
              className={`flex items-center gap-2 px-4 py-2 border rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${sortBy !== 'featured' ? 'bg-[#127F75]/10 border-[#127F75]/30 text-[#127F75]' : 'bg-gray-50 border-gray-100 text-gray-700 hover:bg-gray-100'}`}
            >
              {activeSortLabel} <FiChevronDown size={14} className={sortBy !== 'featured' ? 'text-[#127F75]' : 'text-gray-400'} />
            </button>
            {sortOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setSortOpen(false)} />
                <div className="absolute left-0 top-full mt-2 w-52 bg-white rounded-xl border border-gray-100 shadow-xl z-20 overflow-hidden">
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => { setSortBy(opt.value); setSortOpen(false); }}
                      className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      {opt.label}
                      {sortBy === opt.value && <FiCheck size={14} className="text-[#127F75]" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-4">
        <SearchRefinement
          query={query}
          interpretation={interpretation}
          chips={chips}
          onRemoveChip={handleRemoveChip}
          loading={loading}
        />

        <div className="mb-4">
          <p className="text-sm font-bold text-gray-400">
            {sortedProducts.length} results found
          </p>
          {relaxedMatch && (
            <p className="text-xs font-semibold text-amber-600 mt-1">
              No exact match for every term — showing the closest results instead.
            </p>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-10 h-10 border-4 border-[#127F75]/20 border-t-[#127F75] rounded-full animate-spin" />
            <p className="text-sm font-bold text-[#127F75] animate-pulse">Finding perfect matches...</p>
          </div>
        ) : sortedProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-6">
            {sortedProducts.map((product, idx) => (
              <div key={product._id || idx} className="space-y-1.5">
                <ProductCard product={product} index={idx} variant="list" />
                <button
                  onClick={() => handleBuyNow(product)}
                  className="w-full flex items-center justify-center gap-1.5 bg-[#B71C1C] hover:bg-[#8f1616] text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95"
                >
                  <FiZap size={13} />
                  Buy Now
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
              <FiSearch size={40} />
            </div>
            <h3 className="text-lg font-black text-gray-900 mb-1">No results for "{query}"</h3>
            <p className="text-sm text-gray-400">
              {chips.length > 0 ? 'Try removing a filter above, or search for something else' : 'Try searching for something else'}
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default SearchProductsPage;
