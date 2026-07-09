import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../../shared/utils/api';

const getCategorySlug = (name) => {
  if (!name) return '';
  return name.toLowerCase().replace(/\s+/g, '-');
};

const FOR_YOU_CATEGORY = {
  _id: 'for_you',
  name: 'For You',
  image: 'https://cdn-icons-png.flaticon.com/512/3500/3500833.png',
  isSpecial: true
};

const CategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState(null);
  const [recentProducts, setRecentProducts] = useState([]);
  const [recentlyViewed, setRecentlyViewed] = useState([]);

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchCategoriesAndProducts = async () => {
      try {
        const [catRes, prodRes] = await Promise.all([
          api.get('/categories'),
          api.get('/products?limit=6&sort=-createdAt')
        ]);
        
        const recent = JSON.parse(localStorage.getItem('recently_viewed_products') || '[]');
        setRecentlyViewed(recent);
        
        const cats = catRes.data.data;
        const allCats = [FOR_YOU_CATEGORY, ...cats];
        setCategories(allCats);
        if (allCats.length > 0) {
          setActiveCategory(allCats[0]);
        }
        
        if (prodRes.data.success) {
          setRecentProducts(prodRes.data.data.products || prodRes.data.data || []);
        }
      } catch (err) {
        console.error('Failed to load categories:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCategoriesAndProducts();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen py-40 text-center font-display text-[#189D91] animate-pulse uppercase tracking-widest text-sm font-bold">
        Loading Categories...
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-60px)] md:h-[calc(100vh-140px)] bg-white overflow-hidden border-t border-gray-100">
      {/* Left Sidebar - Categories */}
      <div className="w-[85px] md:w-48 bg-[#F8F9FA] overflow-y-auto no-scrollbar shrink-0 border-r border-gray-100">
        <div className="py-2">
          {categories.map((cat) => {
            const isActive = activeCategory?._id === cat._id;
            return (
              <div
                key={cat._id}
                onClick={() => setActiveCategory(cat)}
                className={`flex flex-col items-center justify-center p-3 cursor-pointer transition-all relative ${
                  isActive ? 'bg-white' : 'hover:bg-gray-100'
                }`}
              >
                {/* Active Indicator Line */}
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#189D91] rounded-r-md"></div>
                )}
                
                <div className={`w-12 h-12 md:w-16 md:h-16 rounded-full overflow-hidden bg-gray-50 mb-1.5 md:mb-2 shadow-sm ${isActive ? (cat.isSpecial ? 'ring-2 ring-blue-500' : 'ring-2 ring-[#189D91]') : 'ring-1 ring-gray-200'} ${cat.isSpecial ? 'bg-blue-50/50 p-2' : ''}`}>
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className={`w-full h-full object-cover ${cat.isSpecial ? 'object-contain' : 'mix-blend-multiply'}`}
                  />
                </div>
                <span
                  className={`text-[9px] md:text-xs text-center leading-tight px-1 ${
                    isActive ? (cat.isSpecial ? 'font-bold text-blue-600' : 'font-bold text-[#189D91]') : 'font-medium text-gray-600'
                  }`}
                >
                  {cat.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Content - Subcategories */}
      <div className="flex-1 overflow-y-auto bg-white p-4 md:p-8 no-scrollbar pb-24 md:pb-8">
        {activeCategory && activeCategory._id === 'for_you' ? (
          <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
            {/* Top Banner */}
            <div className="rounded-2xl overflow-hidden bg-gradient-to-r from-blue-50 to-indigo-50 p-5 md:p-6 border border-blue-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm md:text-xl font-bold text-gray-900">Personalized For You</h3>
                <p className="text-[10px] md:text-sm text-gray-600 mt-1">Recommendations based on your interests</p>
              </div>
              <div className="bg-blue-600 text-white p-2 rounded-full hidden md:block">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
              </div>
            </div>

            {/* New & Upcoming Launches */}
            <div>
              <h3 className="text-sm md:text-lg font-bold text-gray-800 mb-4 tracking-tight">New & Upcoming Launches</h3>
              <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-3 gap-y-5 md:gap-6">
                {recentProducts.slice(0, 6).map((prod) => (
                  <Link
                    to={`/product/${prod.slug || prod._id}`}
                    key={prod._id}
                    className="flex flex-col items-center gap-2 group"
                  >
                    <div className="w-full aspect-square rounded-2xl bg-gray-50 overflow-hidden border border-gray-100 relative group-hover:shadow-md transition-all">
                      <img
                        src={prod.images?.[0] || 'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?w=400&q=80'}
                        alt={prod.name}
                        className="w-full h-full object-cover mix-blend-multiply group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute bottom-1.5 left-1.5 right-1.5 bg-[#189D91] hover:bg-[#115E59] text-white text-[8px] md:text-[10px] font-bold text-center py-1.5 rounded uppercase tracking-wider shadow-sm transition-colors">
                        Shop Now
                      </div>
                    </div>
                    <span className="text-[10px] md:text-xs font-semibold text-center leading-tight text-gray-700 group-hover:text-[#189D91] line-clamp-2 w-full px-1">
                      {prod.name}
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Recently Viewed Products */}
            {recentlyViewed.length > 0 && (
              <div>
                <h3 className="text-sm md:text-lg font-bold text-gray-800 mb-4 tracking-tight">Recently Viewed</h3>
                <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-3 gap-y-5 md:gap-6">
                  {recentlyViewed.map(prod => (
                    <Link to={`/product/${prod.slug || prod._id}`} key={prod._id} className="flex flex-col items-center gap-2 group">
                      <div className="w-full aspect-square rounded-2xl bg-gray-50 overflow-hidden border border-gray-100 relative group-hover:shadow-md transition-all">
                        <img
                          src={prod.images?.[0] || 'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?w=400&q=80'}
                          alt={prod.name}
                          className="w-full h-full object-cover mix-blend-multiply group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <span className="text-[10px] md:text-xs font-semibold text-center leading-tight text-gray-700 group-hover:text-[#189D91] line-clamp-2 w-full px-1">
                        {prod.name}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : activeCategory ? (
          <div className="max-w-4xl mx-auto animate-in fade-in duration-300">
            {/* Recently Viewed Products (Top of Category) */}
            {recentlyViewed.length > 0 && (
              <div className="mb-10">
                <h3 className="text-sm md:text-lg font-bold text-gray-800 mb-4 tracking-tight">Recently Viewed</h3>
                <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-3 gap-y-5 md:gap-6">
                  {recentlyViewed.map(prod => (
                    <Link to={`/product/${prod.slug || prod._id}`} key={prod._id} className="flex flex-col items-center gap-2 group">
                      <div className="w-full aspect-square rounded-2xl md:rounded-3xl bg-gray-50 overflow-hidden border border-gray-100 relative group-hover:shadow-md transition-all">
                        <img
                          src={prod.images?.[0] || 'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?w=400&q=80'}
                          alt={prod.name}
                          className="w-full h-full object-cover mix-blend-multiply group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <span className="text-[10px] md:text-xs font-semibold text-center leading-tight text-gray-700 group-hover:text-[#189D91] line-clamp-2 w-full px-1">
                        {prod.name}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between items-center mb-6">
              <h2 className="text-sm md:text-xl font-bold text-gray-800">{activeCategory.name}</h2>
              <Link
                to={`/category/${getCategorySlug(activeCategory.name)}`}
                className="text-[10px] md:text-xs text-[#189D91] font-bold uppercase tracking-wider hover:underline"
              >
                View All
              </Link>
            </div>

            {activeCategory.subcategories && activeCategory.subcategories.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-3 gap-y-6 md:gap-6">
                {activeCategory.subcategories.map((sub) => (
                  <Link
                    to={`/category/${getCategorySlug(activeCategory.name)}?sub=${sub.name.toLowerCase()}`}
                    key={sub._id}
                    className="flex flex-col items-center gap-2 group"
                  >
                    <div className="w-full aspect-square rounded-2xl md:rounded-3xl bg-gray-50 overflow-hidden border border-gray-100 group-hover:shadow-md transition-all">
                      <img
                        src={sub.image && !sub.image.startsWith('C:') ? sub.image : 'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?w=400&q=80'}
                        alt={sub.name}
                        className="w-full h-full object-cover mix-blend-multiply group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <span className="text-[10px] md:text-xs font-semibold text-center leading-tight text-gray-700 group-hover:text-[#189D91]">
                      {sub.name}
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20">
                <p className="text-gray-400 text-xs md:text-sm mb-4">No subcategories found for {activeCategory.name}</p>
                <Link
                  to={`/category/${getCategorySlug(activeCategory.name)}`}
                  className="px-6 py-2 bg-[#189D91] text-white rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wider hover:bg-[#115E59]"
                >
                  Shop All {activeCategory.name}
                </Link>
              </div>
            )}
            
            {/* Promotional Banner for Category */}
            <div className="mt-12 rounded-2xl md:rounded-3xl overflow-hidden relative shadow-sm border border-gray-100 group block">
              <Link to={`/category/${getCategorySlug(activeCategory.name)}`}>
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent z-10" />
                <img 
                  src={activeCategory.image} 
                  className="w-full h-32 md:h-48 object-cover object-center group-hover:scale-105 transition-transform duration-700" 
                  alt=""
                />
                <div className="absolute inset-0 z-20 flex flex-col justify-center p-6 md:p-10">
                  <span className="text-white/80 text-[9px] md:text-xs font-bold uppercase tracking-[0.2em] mb-1 md:mb-2">Explore the Collection</span>
                  <h3 className="text-white text-lg md:text-3xl font-black">{activeCategory.name}</h3>
                  <div className="mt-3 md:mt-4 inline-flex items-center gap-2 text-[#189D91] bg-white w-fit px-4 py-1.5 md:px-5 md:py-2 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wider">
                    Shop Now
                  </div>
                </div>
              </Link>
            </div>

          </div>
        ) : null}
      </div>
    </div>
  );
};

export default CategoriesPage;
