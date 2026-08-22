import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FiChevronRight, FiChevronLeft } from 'react-icons/fi';
import api from '../../../shared/utils/api';

const getCategorySlug = (name) => {
  if (!name) return '';
  return name.toLowerCase().replace(/\s+/g, '-');
};

const AUTO_SLIDE_INTERVAL = 3500;

const ShopByCategory = () => {
  const [categories, setCategories] = useState([]);
  const scrollRef = useRef(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get('/categories');
        // Filter to categories that have a valid http image, or just take all
        const validCategories = response.data.data.filter(c => c.image && c.image.startsWith('http'));
        // If not enough with http images, fallback to the rest
        const displayCategories = validCategories.length >= 6
          ? validCategories
          : response.data.data;

        setCategories(displayCategories.slice(0, 10)); // Display up to 10, slidable
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      }
    };
    fetchCategories();
  }, []);

  const scrollByCard = useCallback((direction) => {
    const el = scrollRef.current;
    if (!el) return;
    const card = el.querySelector('[data-category-card]');
    const amount = card ? card.offsetWidth + 12 : el.clientWidth * 0.25;
    el.scrollBy({ left: direction * amount, behavior: 'smooth' });
  }, []);

  const goNext = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
    if (atEnd) {
      el.scrollTo({ left: 0, behavior: 'smooth' });
    } else {
      scrollByCard(1);
    }
  }, [scrollByCard]);

  // Auto-slide
  useEffect(() => {
    if (categories.length <= 4) return;
    const timer = setInterval(goNext, AUTO_SLIDE_INTERVAL);
    return () => clearInterval(timer);
  }, [categories.length, goNext]);

  return (
    <section className="py-4 md:py-8 bg-white overflow-hidden">
      <div className="max-w-[1440px] mx-auto px-4 md:px-12">

        {/* Improved Heading */}
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#28a399] mb-0.5">Browse</p>
            <h2 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight leading-tight">Shop by Category</h2>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link to="/categories" className="flex items-center gap-1 text-[11px] md:text-sm font-bold text-[#28a399] hover:underline mr-1">
              View All <FiChevronRight />
            </Link>
            {categories.length > 4 && (
              <>
                <button
                  onClick={() => scrollByCard(-1)}
                  aria-label="Previous categories"
                  className="w-7 h-7 md:w-8 md:h-8 rounded-full border border-gray-200 bg-white hover:bg-[#28a399] hover:border-[#28a399] hover:text-white text-gray-500 flex items-center justify-center transition-colors shadow-sm"
                >
                  <FiChevronLeft size={14} />
                </button>
                <button
                  onClick={() => scrollByCard(1)}
                  aria-label="Next categories"
                  className="w-7 h-7 md:w-8 md:h-8 rounded-full border border-gray-200 bg-white hover:bg-[#28a399] hover:border-[#28a399] hover:text-white text-gray-500 flex items-center justify-center transition-colors shadow-sm"
                >
                  <FiChevronRight size={14} />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Auto-sliding carousel — 4 cards visible on mobile, 6+ on desktop */}
        <div
          ref={scrollRef}
          className="flex gap-3 md:gap-4 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory"
        >
          {categories.map((cat, idx) => (
            <Link
              key={idx}
              data-category-card
              to={`/category/${getCategorySlug(cat.name)}`}
              className="group flex flex-col items-center shrink-0 snap-start w-[calc(25%-9px)] md:w-[calc(16.666%-14px)] lg:w-[calc(12.5%-14px)]"
            >
              <div className="relative w-full aspect-square rounded-lg md:rounded-xl overflow-hidden mb-1 md:mb-2 shadow-sm transition-all duration-300 group-hover:shadow-md group-hover:-translate-y-1">
                <img
                  src={cat.image || 'https://via.placeholder.com/400x400?text=No+Image'}
                  alt={cat.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <h3 className="text-[9px] md:text-xs font-medium text-gray-600 group-hover:text-[#28a399] transition-colors leading-tight text-center truncate w-full">
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
