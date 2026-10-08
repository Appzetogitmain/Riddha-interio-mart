import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FiChevronRight, FiChevronLeft } from 'react-icons/fi';
import api from '../../../shared/utils/api';

const getCategorySlug = (name) => {
  if (!name) return '';
  return name.toLowerCase().replace(/\s+/g, '-');
};

const AUTO_SLIDE_INTERVAL = 4000;

const ShopByCategory = () => {
  const [categories, setCategories] = useState([]);
  const scrollRef = useRef(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get('/categories');
        if (response.data && response.data.data) {
          setCategories(response.data.data);
        }
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      }
    };
    fetchCategories();
  }, []);

  const scrollBySlide = useCallback((direction) => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.8;
    const atEnd = direction > 0 && (el.scrollLeft + el.clientWidth >= el.scrollWidth - 16);
    const atStart = direction < 0 && el.scrollLeft <= 16;

    if (atEnd) {
      el.scrollTo({ left: 0, behavior: 'smooth' });
    } else if (atStart) {
      el.scrollTo({ left: el.scrollWidth, behavior: 'smooth' });
    } else {
      el.scrollBy({ left: direction * amount, behavior: 'smooth' });
    }
  }, []);

  // Auto-slide
  useEffect(() => {
    if (categories.length <= 4) return;
    const timer = setInterval(() => scrollBySlide(1), AUTO_SLIDE_INTERVAL);
    return () => clearInterval(timer);
  }, [categories.length, scrollBySlide]);

  return (
    <section
      className="py-8 md:py-12 border-y overflow-hidden my-0"
      style={{
        background: 'linear-gradient(180deg, #DCF5F0 0%, #E6F9F5 50%, #D5F2EC 100%)',
        borderColor: '#AEE4DA',
      }}
    >
      <div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-12">

        {/* Improved Heading */}
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <div>
            <span className="inline-block px-3 py-0.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] bg-[#189D91]/15 text-[#0f766e] border border-[#189D91]/30 mb-1">
              Shop By Category
            </span>
            <h2 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight leading-tight">
              Explore Our <span className="text-[#189D91]">Categories</span>
            </h2>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link to="/categories" className="flex items-center gap-1 text-[11px] md:text-sm font-bold text-[#189D91] hover:underline mr-1 bg-white px-3 py-1.5 rounded-xl border border-gray-200 shadow-2xs">
              View All <FiChevronRight />
            </Link>
            {categories.length > 4 && (
              <>
                <button
                  onClick={() => scrollBySlide(-1)}
                  aria-label="Previous categories"
                  className="w-7 h-7 md:w-8 md:h-8 rounded-full border border-gray-200 bg-white hover:bg-[#189D91] hover:border-[#189D91] hover:text-white text-gray-500 flex items-center justify-center transition-colors shadow-sm cursor-pointer"
                >
                  <FiChevronLeft size={14} />
                </button>
                <button
                  onClick={() => scrollBySlide(1)}
                  aria-label="Next categories"
                  className="w-7 h-7 md:w-8 md:h-8 rounded-full border border-gray-200 bg-white hover:bg-[#189D91] hover:border-[#189D91] hover:text-white text-gray-500 flex items-center justify-center transition-colors shadow-sm cursor-pointer"
                >
                  <FiChevronRight size={14} />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Auto-sliding carousel — 4 cards visible on mobile, 6 on md, 8 on lg */}
        <div
          ref={scrollRef}
          className="flex gap-3 md:gap-4 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-proximity"
        >
          {categories.map((cat, idx) => (
            <Link
              key={cat._id || idx}
              data-category-card
              to={`/category/${getCategorySlug(cat.name)}`}
              className="group flex flex-col items-center shrink-0 snap-start w-[calc(25%-9px)] md:w-[calc(16.666%-14px)] lg:w-[calc(12.5%-14px)]"
            >
              <div className="relative w-full aspect-square rounded-xl md:rounded-2xl overflow-hidden mb-1.5 md:mb-2 shadow-xs transition-all duration-500 group-hover:shadow-[0_14px_30px_rgba(24,157,145,0.16)] group-hover:-translate-y-1.5 border border-stone-200/70 group-hover:border-[#189D91]/40 bg-white">
                <img
                  src={cat.image || 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=400&q=80'}
                  alt={cat.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=400&q=80';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-white/90 backdrop-blur-md text-[#189D91] text-[8px] font-black uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-1 group-hover:translate-y-0 shadow-xs hidden md:inline-block">
                  Explore
                </span>
              </div>
              <h3 className="text-[10px] md:text-xs font-bold text-slate-700 group-hover:text-[#189D91] transition-colors leading-tight text-center truncate w-full tracking-tight">
                {cat.name}
              </h3>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ShopByCategory;
