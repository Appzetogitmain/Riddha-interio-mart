import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiArrowLeft, FiMic, FiTrendingUp, FiClock, FiSearch, FiX, FiPackage, FiChevronRight, FiCamera, FiUploadCloud, FiImage } from 'react-icons/fi';
import api from '../../../shared/utils/api';

const SearchEntryPage = () => {
  const [query, setQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedImage, setScannedImage] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const fileInputRef = React.useRef(null);

  const popularSearches = [
    "3 Seater Sofas",
    "Shoe Cabinets",
    "Sofa Cum Beds",
    "Centre Tables",
    "Queen Size Beds",
    "TV Units",
    "Marble Tiles"
  ];

  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) setRecentSearches(JSON.parse(saved));
    
    // Check if we should auto-start voice or image search
    if (location.state?.autoStart === 'voice') {
      startVoiceSearch();
    } else if (location.state?.autoStart === 'image') {
      fileInputRef.current?.click();
    } else {
      document.getElementById('main-search-input')?.focus();
    }
  }, [location.state]);

  // Voice Search Logic
  const startVoiceSearch = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice search is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.interimResults = true;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map(result => result[0])
        .map(result => result.transcript)
        .join('');
      
      setQuery(transcript);
      if (event.results[0].isFinal) {
        handleSearch(transcript);
      }
    };

    recognition.start();
  };

  // AI Image Search Logic
  const [aiData, setAiData] = useState(null);
  const [activeLookGroup, setActiveLookGroup] = useState('all');
  const imageSearchCacheRef = React.useRef(new Map());

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileCacheKey = `${file.name}_${file.size}_${file.lastModified}`;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target.result;
      setScannedImage(dataUrl);

      // Check client-side cache
      if (imageSearchCacheRef.current.has(fileCacheKey)) {
        const cachedRes = imageSearchCacheRef.current.get(fileCacheKey);
        setAiData(cachedRes);
        setQuery(cachedRes.aiAnalysis?.primaryItem || 'AI Visual Match');
        return;
      }

      setIsScanning(true);
      setAiData(null);
      setActiveLookGroup('all');

      try {
        const formData = new FormData();
        formData.append('image', file);

        const res = await api.post('/products/ai-image-search', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        if (res.data.success) {
          imageSearchCacheRef.current.set(fileCacheKey, res.data);
          setAiData(res.data);
          setQuery(res.data.aiAnalysis?.primaryItem || 'AI Visual Match');
        }
      } catch (err) {
        console.error('AI Image search failed:', err);
      } finally {
        setIsScanning(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Debounced Search Logic
  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    const delayDebounceFn = setTimeout(() => {
      fetchSuggestions(query);
    }, 500); // 500ms delay

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const fetchSuggestions = async (searchTerm) => {
    try {
      setLoading(true);
      const res = await api.get(`/products?search=${encodeURIComponent(searchTerm)}&limit=6`);
      setSuggestions(res.data.data);
    } catch (err) {
      console.error('Failed to fetch suggestions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (searchTerm) => {
    if (!searchTerm.trim()) return;
    
    const updatedRecent = [
      searchTerm,
      ...recentSearches.filter(s => s !== searchTerm)
    ].slice(0, 5);
    
    setRecentSearches(updatedRecent);
    localStorage.setItem('recentSearches', JSON.stringify(updatedRecent));
    navigate(`/search-results?search=${encodeURIComponent(searchTerm)}`);
  };

  const clearRecent = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Search Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-100 px-3 py-2 md:px-4 md:py-3 flex items-center gap-3 md:gap-4">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 text-gray-500 hover:text-gray-800 transition-colors"
        >
          <FiArrowLeft size={24} />
        </button>
        
        <div className="flex-1 relative">
          <input
            id="main-search-input"
            type="text"
            autoComplete="off"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch(query)}
            placeholder="Search products or brands..."
            className="w-full py-2 border-b-2 border-gray-100 focus:border-[#189D91] focus:outline-none text-lg font-medium placeholder:text-gray-300 transition-all"
          />
          {query && (
            <button 
              onClick={() => setQuery('')}
              className="absolute right-20 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors"
            >
              <FiX size={18} />
            </button>
          )}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-3">
            <button 
              onClick={startVoiceSearch}
              className="text-gray-400 hover:text-[#189D91] transition-colors"
            >
              <FiMic size={22} />
            </button>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="text-gray-400 hover:text-[#189D91] transition-colors"
            >
              <FiCamera size={22} />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleImageUpload}
            />
          </div>
        </div>
      </div>

      {/* Voice Listening Overlay */}
      <AnimatePresence>
        {isListening && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-[#189D91]/95 backdrop-blur-md flex flex-col items-center justify-center text-white"
          >
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="w-32 h-32 bg-white/20 rounded-full flex items-center justify-center mb-8"
            >
              <FiMic size={48} className="text-white" />
            </motion.div>
            <h2 className="text-2xl font-bold mb-2">Listening...</h2>
            <p className="text-white/70 italic">"{query || 'Say something...'}"</p>
            <button 
              onClick={() => setIsListening(false)}
              className="mt-12 px-8 py-3 bg-white/10 hover:bg-white/20 rounded-full border border-white/20 transition-all font-bold"
            >
              Cancel
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image Scanning Overlay */}
      <AnimatePresence>
        {isScanning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center text-white"
          >
            <div className="relative w-72 h-72 md:w-96 md:h-96 rounded-3xl overflow-hidden border-4 border-[#189D91]/50 shadow-2xl">
              <img src={scannedImage} className="w-full h-full object-cover" alt="Scanning" />
              <motion.div
                animate={{ top: ['0%', '100%', '0%'] }}
                transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                className="absolute left-0 right-0 h-1 bg-[#189D91] shadow-[0_0_20px_#189D91] z-10"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-[#189D91]/10 to-transparent" />
            </div>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-10 text-center"
            >
              <h2 className="text-2xl font-bold mb-2 tracking-tight">Analyzing Image</h2>
              <p className="text-white/60 font-medium">Finding similar furniture pieces for you...</p>
              <div className="flex gap-2 justify-center mt-6">
                {[0, 1, 2].map(i => (
                  <motion.div
                    key={i}
                    animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
                    transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
                    className="w-2 h-2 bg-[#189D91] rounded-full"
                  />
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content Area */}
      <div className="p-4 md:p-6 max-w-2xl mx-auto overflow-y-auto max-h-[calc(100vh-80px)] no-scrollbar">
        {/* AI Image Search Results Render */}
        {aiData && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 space-y-6"
          >
            {/* AI Insights Card */}
            <div className="p-4 md:p-5 bg-gradient-to-br from-[#127F75] to-[#0D5B54] rounded-3xl text-white shadow-xl relative overflow-hidden">
              <div className="absolute right-0 top-0 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-start gap-4">
                {scannedImage && (
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl overflow-hidden border-2 border-white/30 shrink-0 shadow-md">
                    <img src={scannedImage} className="w-full h-full object-cover" alt="AI Input" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-wider text-teal-100">
                      AI Visual Analysis
                    </span>
                  </div>
                  <h3 className="text-lg md:text-xl font-black text-white truncate">
                    {aiData.aiAnalysis.primaryItem}
                  </h3>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {aiData.aiAnalysis.category && (
                      <span className="px-2 py-0.5 bg-white/10 text-white rounded-lg text-[11px] font-bold">
                        {aiData.aiAnalysis.category}
                      </span>
                    )}
                    {aiData.aiAnalysis.color && (
                      <span className="px-2 py-0.5 bg-white/10 text-white rounded-lg text-[11px] font-bold">
                        {aiData.aiAnalysis.color}
                      </span>
                    )}
                    {aiData.aiAnalysis.material && (
                      <span className="px-2 py-0.5 bg-white/10 text-white rounded-lg text-[11px] font-bold">
                        {aiData.aiAnalysis.material}
                      </span>
                    )}
                    {aiData.aiAnalysis.style && (
                      <span className="px-2 py-0.5 bg-white/10 text-white rounded-lg text-[11px] font-bold">
                        {aiData.aiAnalysis.style}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Shop The Look Filter Chips */}
            {aiData.shopTheLookGroups && aiData.shopTheLookGroups.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#127F75]">
                    Shop The Look ({aiData.shopTheLookGroups.length} Items Detected)
                  </h4>
                </div>
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                  <button
                    onClick={() => setActiveLookGroup('all')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                      activeLookGroup === 'all'
                        ? 'bg-[#189D91] text-white border-[#189D91] shadow-md shadow-[#189D91]/20'
                        : 'bg-white text-gray-700 border-gray-100 hover:bg-gray-50'
                    }`}
                  >
                    All Similar ({aiData.similarProducts?.length || 0})
                  </button>
                  {aiData.shopTheLookGroups.map((group, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveLookGroup(group.label)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                        activeLookGroup === group.label
                          ? 'bg-[#189D91] text-white border-[#189D91] shadow-md shadow-[#189D91]/20'
                          : 'bg-white text-gray-700 border-gray-100 hover:bg-gray-50'
                      }`}
                    >
                      {group.label} ({group.products.length})
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Similar Products Output */}
            <div className="space-y-3">
              <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#127F75]">
                {activeLookGroup === 'all' ? 'Visually Similar Products' : `Matching: ${activeLookGroup}`}
              </h4>

              {(() => {
                let displayList = aiData.similarProducts || [];
                if (activeLookGroup !== 'all' && aiData.shopTheLookGroups) {
                  const targetGroup = aiData.shopTheLookGroups.find(g => g.label === activeLookGroup);
                  if (targetGroup) displayList = targetGroup.products;
                }

                if (displayList.length === 0) {
                  return (
                    <div className="py-8 text-center bg-gray-50 rounded-2xl">
                      <p className="text-sm font-semibold text-gray-400">No exact matches found for this item.</p>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-2 gap-3 md:gap-4">
                    {displayList.map((product) => (
                      <div
                        key={product._id}
                        onClick={() => navigate(`/products/${product._id}`)}
                        className="bg-white border border-gray-100 hover:border-[#189D91]/30 rounded-2xl p-3 shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
                      >
                        <div>
                          <div className="w-full h-36 md:h-44 bg-gray-50 rounded-xl overflow-hidden mb-3 relative">
                            <img
                              src={product.images?.[0] || 'https://images.unsplash.com/photo-1513519245088-0e12902e35ca?w=400&q=80'}
                              alt={product.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <span className="absolute top-2 left-2 bg-[#189D91] text-white text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider">
                              AI Match
                            </span>
                          </div>
                          <h5 className="text-xs font-bold text-gray-800 line-clamp-2 leading-tight group-hover:text-[#189D91] transition-colors">
                            {product.name}
                          </h5>
                        </div>
                        <div className="mt-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-black text-[#189D91]">
                              ₹{(() => {
                                const pPrice = Number(product.price) || 0;
                                const pDiscount = Number(product.discountPrice) || 0;
                                const display = (pDiscount > 0 && pDiscount < pPrice) ? pDiscount : pPrice;
                                return display.toLocaleString();
                              })()}
                            </span>
                            <span className="text-[10px] font-bold text-gray-400 uppercase">
                              {product.category?.name || 'In Store'}
                            </span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/products/${product._id}`);
                            }}
                            className="w-full py-2 bg-[#189D91] hover:bg-[#127F75] text-white text-xs font-bold rounded-xl transition-all shadow-sm active:scale-95 flex items-center justify-center gap-1.5"
                          >
                            <span>Buy / View Item</span>
                            <FiChevronRight size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {query.trim() ? (
            <motion.div
              key="suggestions"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between px-1">
                 <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#127F75]">Suggested Products</h3>
                 {loading && <div className="w-4 h-4 border-2 border-[#189D91]/20 border-t-[#189D91] rounded-full animate-spin" />}
              </div>
              
              <div className="space-y-1">
                {suggestions.length > 0 ? (
                  suggestions.map((product) => (
                    <button
                      key={product._id}
                      onClick={() => navigate(`/products/${product._id}`)}
                      className="w-full flex items-center justify-between p-3 md:p-4 hover:bg-[#F0F9F8] rounded-2xl transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 md:w-14 md:h-14 bg-gray-50 rounded-xl overflow-hidden border border-gray-100 shrink-0">
                          <img 
                            src={product.images?.[0] || 'https://images.unsplash.com/photo-1513519245088-0e12902e35ca?w=200&q=80'} 
                            alt="" 
                            className="w-full h-full object-cover transition-transform group-hover:scale-110"
                          />
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-bold text-gray-800 leading-tight line-clamp-1">{product.name}</p>
                          <p className="text-[10px] font-black uppercase tracking-wider text-warm-sand mt-1">{product.category}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-black text-[#189D91]">
                          ₹{(() => {
                            const pPrice = Number(product.price) || 0;
                            const pDiscount = Number(product.discountPrice) || 0;
                            const display = (pDiscount > 0 && pDiscount < pPrice) ? pDiscount : pPrice;
                            return display.toLocaleString();
                          })()}
                        </span>
                        <FiChevronRight className="text-gray-300 group-hover:text-[#189D91] transition-colors" />
                      </div>
                    </button>
                  ))
                ) : !loading && (
                  <div className="py-12 text-center space-y-3">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-200">
                       <FiSearch size={32} />
                    </div>
                    <p className="text-gray-400 text-sm font-medium italic">No matches found for "{query}"</p>
                  </div>
                )}

                <button 
                  onClick={() => handleSearch(query)}
                  className="w-full flex items-center gap-4 py-4 px-4 mt-2 bg-[#189D91]/5 text-[#189D91] hover:bg-[#189D91]/10 rounded-2xl transition-all group"
                >
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                    <FiSearch size={16} />
                  </div>
                  <span className="text-sm font-bold uppercase tracking-widest">Search for "{query}"</span>
                  <FiChevronRight className="ml-auto opacity-40 group-hover:opacity-100" />
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="landing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-10"
            >
              {recentSearches.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#127F75]">Recent Searches</h3>
                    <button onClick={clearRecent} className="text-[10px] font-bold text-gray-400 hover:text-red-400 uppercase tracking-widest transition-colors">Clear All</button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => handleSearch(s)}
                        className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-[#F0F9F8] rounded-xl text-xs font-bold text-gray-600 transition-all border border-gray-100 hover:border-[#189D91]/30 shadow-sm"
                      >
                        <FiClock className="h-3.5 w-3.5 text-gray-400" />
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-5">
                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#127F75]">Trending Now</h3>
                <div className="flex flex-wrap gap-3">
                  {popularSearches.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => handleSearch(s)}
                      className="flex items-center gap-2 md:gap-3 px-4 py-3 md:px-5 md:py-4 bg-white border border-gray-100 hover:border-[#189D91]/30 hover:bg-[#F0F9F8] rounded-2xl text-[11px] md:text-[13px] font-bold text-gray-700 transition-all shadow-sm group"
                    >
                      <FiTrendingUp className="h-4 w-4 text-gray-400 group-hover:text-[#189D91] transition-colors" />
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default SearchEntryPage;
