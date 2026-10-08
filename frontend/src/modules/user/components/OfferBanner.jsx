import React, { useEffect, useState } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FiArrowRight } from 'react-icons/fi';
import api from '../../../shared/utils/api';

const defaultSlides = [
  {
    id: 1,
    badge: 'UP TO',
    headline: '50% OFF',
    subtitle: 'On Selected Collections',
    btnText: 'Shop the Sale',
    ctaLink: '/products',
    themeColor: 'from-[#D81B60] via-[#E11D48] to-[#BE123C]',
    accentColor: 'from-[#F59E0B] to-[#FBBF24]',
    cornerColor: 'from-[#1F3E96] to-[#142966]',
    cornerGradient: 'linear-gradient(225deg, #22429B 0%, #1F3E96 50%, #142966 100%)',
    image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1800&q=85',
  },
  {
    id: 2,
    badge: 'EXCLUSIVE DEALS',
    headline: '40% OFF',
    subtitle: 'On Luxury Living & Dining Sets',
    btnText: 'Explore Collection',
    ctaLink: '/products?category=furniture',
    themeColor: 'from-[#0F766E] via-[#14B8A6] to-[#0D9488]',
    accentColor: 'from-[#F59E0B] to-[#FBBF24]',
    cornerColor: 'from-[#BE123C] to-[#E11D48]',
    image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1800&q=85',
  },
  {
    id: 3,
    badge: 'LIMITED TIME',
    headline: 'FLAT 35% OFF',
    subtitle: 'On Designer Lights & Home Decor',
    btnText: 'View Decor Deals',
    ctaLink: '/products?category=lighting',
    themeColor: 'from-[#4338CA] via-[#6366F1] to-[#3730A3]',
    accentColor: 'from-[#EC4899] to-[#F43F5E]',
    cornerColor: 'from-[#F59E0B] to-[#D97706]',
    image: 'https://images.unsplash.com/photo-1513519245088-0e12902e35ca?auto=format&fit=crop&w=1800&q=85',
  },
];

const mapPromoBanner = (item, index) => {
  const image = item?.image || item?.bgImage?.src || item?.bannerImage || '';
  if (!image) return null;

  return {
    id: item?._id || item?.id || `promo-banner-${index}`,
    badge: 'SPECIAL OFFER',
    headline: item?.offer || item?.subtitle || 'UP TO 50% OFF',
    subtitle: item?.title || 'On Selected Collections',
    btnText: item?.ctaText || 'Shop the Sale',
    image,
    ctaLink: item?.ctaLink || '/products',
    themeColor: 'from-[#D81B60] via-[#E11D48] to-[#BE123C]',
    accentColor: 'from-[#F59E0B] to-[#FBBF24]',
    cornerColor: 'from-[#1F3E96] to-[#142966]',
    cornerGradient: 'linear-gradient(225deg, #22429B 0%, #1F3E96 50%, #142966 100%)',
  };
};

const OfferBanner = () => {
  const [current, setCurrent] = useState(0);
  const [slides, setSlides] = useState(defaultSlides);

  useEffect(() => {
    const fetchPromoBanners = async () => {
      try {
        const { data } = await api.get('/promo-banner');
        const list = Array.isArray(data?.data) ? data.data : [];
        const mapped = list.map(mapPromoBanner).filter(Boolean);

        if (mapped.length > 0) {
          // Prepend the iconic 50% off slide as the hero default
          setSlides([defaultSlides[0], ...mapped]);
          setCurrent(0);
        }
      } catch (err) {
        console.warn('Failed to load dynamic promo banners, using curated offer slides');
      }
    };

    fetchPromoBanners();
  }, []);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [slides]);

  const slide = slides[current] || defaultSlides[0];

  return (
    <section
      className="w-full py-8 md:py-12 border-b"
      style={{
        background: 'linear-gradient(180deg, #E6F0FE 0%, #EDF5FF 50%, #DEECFE 100%)',
        borderColor: '#BAD6FC',
      }}
    >
      <div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-12">
        <div className="relative w-full h-44 sm:h-56 md:h-72 lg:h-80 rounded-2xl md:rounded-[2rem] overflow-hidden shadow-xl border border-stone-200/80 bg-white">
          <AnimatePresence mode="wait">
            <Motion.div
              key={current}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="absolute inset-0 flex"
            >
              {/* Full-Bleed Right Living Room Image */}
              <div className="absolute inset-0 w-full h-full bg-slate-100">
                <img
                  src={slide.image}
                  alt={slide.subtitle || 'Special Sale Offer'}
                  className="w-full h-full object-cover object-center"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1800&q=85';
                  }}
                />
              </div>

              {/* Dynamic Angled Yellow/Gold Slash Accent */}
              <div
                className={`absolute top-0 bottom-0 left-0 w-[72%] sm:w-[56%] md:w-[48%] lg:w-[44%] bg-gradient-to-r ${slide.accentColor || 'from-[#F59E0B] to-[#FBBF24]'} z-10 pointer-events-none`}
                style={{
                  clipPath: 'polygon(0 0, 100% 0, 85% 100%, 0 100%)',
                }}
              />

              {/* Dynamic Angled Magenta/Hot-Pink Main Banner Panel */}
              <div
                className={`relative z-20 w-[68%] sm:w-[52%] md:w-[45%] lg:w-[41%] h-full bg-gradient-to-r ${slide.themeColor || 'from-[#D81B60] via-[#E11D48] to-[#BE123C]'} flex flex-col justify-center px-4 sm:px-6 md:px-10 lg:px-12 text-white shadow-2xl`}
                style={{
                  clipPath: 'polygon(0 0, 100% 0, 82% 100%, 0 100%)',
                }}
              >
                <span className="text-[9px] sm:text-[11px] md:text-xs font-black uppercase tracking-[0.2em] text-white/95 drop-shadow-xs">
                  {slide.badge || 'UP TO'}
                </span>

                <h3 className="text-xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black text-white leading-none tracking-tight mt-0.5 sm:mt-1 drop-shadow-md">
                  {slide.headline || '50% OFF'}
                </h3>

                <p className="text-[10px] sm:text-xs md:text-sm lg:text-base font-semibold text-white/90 mt-1 md:mt-2 leading-tight drop-shadow-xs line-clamp-1">
                  {slide.subtitle || 'On Selected Collections'}
                </p>

                <Link
                  to={slide.ctaLink || '/products'}
                  className="mt-2.5 sm:mt-4 md:mt-6 inline-flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 md:px-6 py-1.5 sm:py-2 md:py-2.5 rounded-full bg-white text-[#BE123C] font-black text-[9px] sm:text-xs md:text-sm tracking-wider uppercase shadow-md hover:bg-white/95 hover:shadow-lg hover:scale-105 active:scale-95 transition-all w-fit"
                >
                  <span>{slide.btnText || 'Shop the Sale'}</span>
                  <FiArrowRight className="text-xs md:text-sm" />
                </Link>
              </div>

              {/* Dynamic Angled Blue Ribbon Accent on Bottom-Right (Matching Riddha Logo's Blue) */}
              <div
                className="hidden sm:block absolute bottom-0 right-0 w-24 sm:w-36 md:w-44 h-24 sm:h-36 md:h-44 z-10 pointer-events-none shadow-lg"
                style={{
                  clipPath: 'polygon(100% 0, 100% 100%, 25% 100%)',
                  background: slide.cornerGradient || 'linear-gradient(225deg, #22429B 0%, #1F3E96 50%, #142966 100%)',
                }}
              />
              <div
                className="hidden sm:block absolute bottom-0 right-0 w-16 sm:w-28 md:w-36 h-16 sm:h-28 md:h-36 bg-[#F59E0B] z-15 pointer-events-none opacity-90"
                style={{
                  clipPath: 'polygon(100% 65%, 100% 100%, 35% 100%)',
                }}
              />
            </Motion.div>
          </AnimatePresence>

          {/* Interactive Pagination Dots */}
          {slides.length > 1 && (
            <div className="absolute bottom-2.5 sm:bottom-4 md:bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 sm:gap-2 z-30 bg-black/20 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/20">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  aria-label={`Go to slide ${i + 1}`}
                  className={`h-1.5 sm:h-2 rounded-full transition-all duration-300 cursor-pointer ${
                    current === i ? 'w-5 sm:w-7 bg-[#189D91]' : 'w-1.5 sm:w-2 bg-white/70 hover:bg-white'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default OfferBanner;
