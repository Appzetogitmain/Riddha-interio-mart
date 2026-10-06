import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
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
    <section className="w-full py-8 md:py-14 bg-gradient-to-b from-[#EFF6FF] via-[#F4F8FF] to-[#EFF6FF] border-y border-blue-100 my-4">
      <div className="max-w-7xl mx-auto px-4 md:px-12">
        <div className="relative overflow-hidden rounded-2xl border border-blue-100 bg-white/80 backdrop-blur-sm shadow-sm p-4 md:p-8">
          <div className="absolute -top-20 right-0 h-56 w-56 rounded-full bg-blue-500/5 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-[#2563EB]/10 border border-[#2563EB]/20 text-[#2563EB] mb-1">
                <span className="h-1.5 w-1.5 rounded-full bg-[#2563EB]" />
                <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.22em]">Trusted Brands</span>
              </div>
              <h2 className="text-lg md:text-2xl lg:text-3xl font-display font-black text-slate-950 tracking-tight">
                {title || "Explore Top Brands"}
              </h2>
            <p className="max-w-xl text-[11px] md:text-sm text-slate-500 font-medium">
              Trusted names, premium selections, and quick access to the collections customers ask for most.
            </p>
          </div>

          <Link
            to="/brands"
            className="shrink-0 inline-flex items-center gap-2 rounded-full border border-[#189D91]/15 bg-white/80 px-4 py-2 text-[10px] md:text-[11px] font-black uppercase tracking-[0.22em] text-[#189D91] hover:bg-white hover:border-[#189D91]/25 transition-all shadow-sm"
          >
            View All
          </Link>
        </div>

        <div className="relative z-10 px-4 sm:px-6 md:px-8 pb-6 md:pb-8 pt-5">
          <div
            ref={scrollRef}
            className="flex gap-3 md:gap-4 lg:gap-5 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory pb-1"
          >
            {brands.slice(0, 12).map((brand) => (
              <Link
                key={brand._id}
                data-brand-card
                to={`/brand/${brand.slug || brand.name.toLowerCase().replace(/\s+/g, '-')}`}
                className="group/brand relative overflow-hidden rounded-xl border border-slate-200/70 bg-white/90 p-0 flex flex-col text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(24,157,145,0.12)] hover:border-[#189D91]/20 shrink-0 snap-start w-[calc(50%-6px)] md:w-[calc(25%-13px)]"
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(24,157,145,0.06),transparent_55%)] opacity-0 group-hover/brand:opacity-100 transition-opacity" />

                <div className="relative h-24 md:h-28 w-full overflow-hidden bg-slate-50 border-b border-slate-100">
                  <img
                    src={brand.logo}
                    alt={brand.name}
                    className="h-full w-full object-cover object-center mix-blend-multiply transition-transform duration-500 group-hover/brand:scale-105"
                  />
                </div>

                <div className="relative px-3 md:px-5 py-3 md:py-4 space-y-1 w-full">
                  <p className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.24em] text-slate-400">
                    Brand
                  </p>
                  <p className="text-[10px] md:text-[12px] font-bold text-slate-950 tracking-tight line-clamp-1">
                    {brand.name}
                  </p>
                  <p className="text-[9px] md:text-[11px] font-medium text-[#189D91] line-clamp-1">
                    {brand.offer || 'Premium collection'}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  </section>
  );
};

export default TopBrands;
