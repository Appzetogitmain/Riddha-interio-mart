import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import api from '../../../shared/utils/api';

const TopBrands = ({ title }) => {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const { data } = await api.get('/brands');
        if (data.data && data.data.length > 0) {
          setBrands(data.data);
        }
      } catch (err) {
        console.error('Failed to fetch brands for homepage:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBrands();
  }, []);

  // Auto-slide the brands carousel
  useEffect(() => {
    if (brands.length <= 4) return;
    const timer = setInterval(() => {
      const el = scrollRef.current;
      if (!el) return;
      const card = el.querySelector('[data-brand-card]');
      const amount = card ? card.offsetWidth + 16 : el.clientWidth * 0.4;
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
      if (atEnd) {
        el.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        el.scrollBy({ left: amount, behavior: 'smooth' });
      }
    }, 3500);
    return () => clearInterval(timer);
  }, [brands.length]);

  if (!loading && brands.length === 0) return null;

  return (
    <section
      className="w-full py-8 md:py-14 border-y my-0"
      style={{
        background: 'linear-gradient(180deg, #DBEAFE 0%, #E8F2FF 50%, #D3E5FD 100%)',
        borderColor: '#BAD6FC',
      }}
    >
      <div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-12">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <div>
            <span className="inline-block px-3 py-0.5 rounded-full text-[9px] font-black uppercase tracking-[0.22em] bg-[#3B82F6]/10 border border-[#3B82F6]/25 text-[#1D4ED8] mb-1">
              Trusted Brands
            </span>
            <h2 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight leading-tight">
              {title || "Explore Top Brands"}
            </h2>
            <p className="text-[11px] md:text-xs text-gray-500 mt-1 max-w-2xl leading-relaxed font-medium">
              Trusted names, premium selections, and quick access to the collections customers ask for most.
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            <Link
              to="/brands"
              className="flex items-center gap-1 text-[11px] md:text-sm font-bold text-[#2563EB] hover:underline bg-white px-3.5 py-1.5 rounded-xl border border-[#BAD6FC] shadow-2xs shrink-0"
            >
              View All <FiChevronRight size={14} />
            </Link>
            {brands.length > 4 && (
              <div className="hidden sm:flex items-center gap-1.5">
                <button
                  onClick={() => {
                    const el = scrollRef.current;
                    if (el) el.scrollBy({ left: -el.clientWidth * 0.6, behavior: 'smooth' });
                  }}
                  aria-label="Previous brands"
                  className="w-7 h-7 rounded-full border border-[#BAD6FC] bg-white hover:bg-[#2563EB] hover:border-[#2563EB] hover:text-white text-slate-600 flex items-center justify-center transition-all shadow-xs cursor-pointer active:scale-95"
                >
                  <FiChevronLeft size={14} />
                </button>
                <button
                  onClick={() => {
                    const el = scrollRef.current;
                    if (el) el.scrollBy({ left: el.clientWidth * 0.6, behavior: 'smooth' });
                  }}
                  aria-label="Next brands"
                  className="w-7 h-7 rounded-full border border-[#BAD6FC] bg-white hover:bg-[#2563EB] hover:border-[#2563EB] hover:text-white text-slate-600 flex items-center justify-center transition-all shadow-xs cursor-pointer active:scale-95"
                >
                  <FiChevronRight size={14} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Brand Cards Carousel / Grid */}
        <div
          ref={scrollRef}
          className="flex gap-3 md:gap-4 lg:gap-5 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory pb-1"
        >
          {brands.slice(0, 12).map((brand) => (
            <Link
              key={brand._id}
              data-brand-card
              to={`/brand/${brand.slug || brand.name.toLowerCase().replace(/\s+/g, '-')}`}
              className="group/brand relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-0 flex flex-col text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(37,99,235,0.12)] hover:border-[#2563EB]/30 shrink-0 snap-start w-36 sm:w-44 md:w-56"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.06),transparent_55%)] opacity-0 group-hover/brand:opacity-100 transition-opacity z-10 pointer-events-none" />

              <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100 border-b border-slate-100">
                <img
                  src={brand.logo}
                  alt={brand.name}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover/brand:scale-108"
                />
              </div>

              <div className="relative px-3 md:px-5 py-3 md:py-4 space-y-1 w-full bg-white flex-1 flex flex-col justify-center">
                <p className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.24em] text-slate-400">
                  Brand
                </p>
                <p className="text-[11px] md:text-sm font-bold text-slate-950 tracking-tight line-clamp-1">
                  {brand.name}
                </p>
                <p className="text-[9px] md:text-[11px] font-medium text-[#2563EB] line-clamp-1">
                  {brand.offer || 'Premium collection'}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TopBrands;
