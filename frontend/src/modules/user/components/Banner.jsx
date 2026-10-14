import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { Link } from 'react-router-dom';

// Fallback high-quality static hero images
import HeroBG1 from "../../../assets/hero_banner_interior.png";
import HeroBG2 from "../../../assets/hero_banner_kitchen.png";

const defaultSlides = [
  { id: 1, image: HeroBG1 },
  { id: 2, image: HeroBG2 }
];

const Banner = ({ banners }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Filter out any banners from API that do not have a valid image URL
  const validBanners = Array.isArray(banners)
    ? banners.filter(b => b && (b.image || b.bg || b.bgImage?.src || typeof b === 'string'))
    : [];

  // Use dynamic banners if available and valid, otherwise fallback to defaults
  const slides = validBanners.length > 0
    ? validBanners
    : defaultSlides;

  // Handle auto-playing slides
  useEffect(() => {
    if (slides.length <= 1) return;
    const slideTimer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(slideTimer);
  }, [slides.length]);

  const nextSlide = (e) => {
    e.stopPropagation();
    setCurrentSlide(prev => (prev + 1) % slides.length);
  };
  
  const prevSlide = (e) => {
    e.stopPropagation();
    setCurrentSlide(prev => (prev - 1 + slides.length) % slides.length);
  };

  if (!slides.length) return null;

  const currentImage = slides[currentSlide]?.image || slides[currentSlide]?.bg || slides[currentSlide]?.bgImage?.src || (typeof slides[currentSlide] === 'string' ? slides[currentSlide] : HeroBG1);
  const isVideo = currentImage.match(/\.(mp4|webm|ogg|mov)$/i) || currentImage.startsWith('data:video') || currentImage.includes('/video/upload/');

  return (
    <section className="py-2 md:py-4 bg-gradient-to-b from-[#F2F8F7] via-[#FAFCFB] to-[#F5F7F8]">
      <div className="max-w-[1700px] mx-auto px-2 md:px-10">
        <div className="group relative w-full aspect-[2/1] sm:aspect-[2.3/1] md:aspect-[4.5/1] overflow-hidden bg-slate-900 rounded-2xl md:rounded-[32px] shadow-[0_16px_40px_rgba(24,157,145,0.08)] border border-stone-200/40">

          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="absolute inset-0"
            >
              {isVideo ? (
                <video 
                  src={currentImage} 
                  autoPlay 
                  loop 
                  muted 
                  playsInline
                  className="w-full h-full object-cover object-center"
                />
              ) : (
                <img 
                  src={currentImage} 
                  alt={slides[currentSlide]?.title || "Riddha Mart Premium Banner"} 
                  className="w-full h-full object-cover object-center"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = HeroBG1;
                  }}
                />
              )}

              {/* Overlay Content */}
              {(slides[currentSlide]?.title || slides[currentSlide]?.subtitle || slides[currentSlide]?.primaryBtnText || slides[currentSlide]?.secondaryBtnText) ? (
                <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/40 to-transparent flex flex-col justify-center px-5 sm:px-8 md:px-20 z-10 text-white pb-7 md:pb-0">
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[7.5px] sm:text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em] bg-white/15 backdrop-blur-md text-amber-300 border border-white/20 mb-1.5 md:mb-2 w-fit shadow-xs">
                    ✦ ARCHITECTURAL EXCELLENCE
                  </span>
                  {slides[currentSlide]?.title && (
                    <h2 className="text-base sm:text-lg md:text-3xl lg:text-4xl font-black mb-1 md:mb-2.5 tracking-tight drop-shadow-md max-w-2xl text-white line-clamp-1 sm:line-clamp-none">
                      {slides[currentSlide].title}
                    </h2>
                  )}
                  {slides[currentSlide]?.subtitle && (
                    <p className="text-[10px] sm:text-[11px] md:text-base lg:text-lg font-medium mb-3 md:mb-6 text-gray-200 max-w-xl drop-shadow-sm line-clamp-2 sm:line-clamp-none">
                      {slides[currentSlide].subtitle}
                    </p>
                  )}
                  <div className="flex items-center gap-2.5 md:gap-4 flex-wrap">
                    {slides[currentSlide]?.primaryBtnText && (
                      <Link 
                        to={slides[currentSlide].primaryBtnLink || '#'} 
                        className="px-4 py-1.5 sm:px-5 sm:py-2 md:px-7 md:py-3 bg-[#189D91] hover:bg-[#127F75] text-white rounded-full text-[9px] sm:text-[10px] md:text-xs font-black shadow-[0_8px_20px_rgba(24,157,145,0.35)] transition-all hover:-translate-y-0.5 border-2 border-[#189D91] hover:border-[#127F75] active:scale-95"
                      >
                        {slides[currentSlide].primaryBtnText}
                      </Link>
                    )}
                    {slides[currentSlide]?.secondaryBtnText && (
                      <Link 
                        to={slides[currentSlide].secondaryBtnLink || '#'} 
                        className="px-4 py-1.5 sm:px-5 sm:py-2 md:px-7 md:py-3 bg-white/15 hover:bg-white text-white hover:text-slate-900 backdrop-blur-md rounded-full text-[9px] sm:text-[10px] md:text-xs font-black shadow-lg transition-all hover:-translate-y-0.5 border-2 border-white/60 hover:border-white active:scale-95"
                      >
                        {slides[currentSlide].secondaryBtnText}
                      </Link>
                    )}
                  </div>
                </div>
              ) : null}
            </motion.div>
          </AnimatePresence>

          {/* Elegant Minimal Controls */}
          {slides.length > 1 && (
            <>
              {/* Left Arrow */}
              <div className="absolute inset-y-0 left-0 flex items-center pl-1.5 sm:pl-2 md:pl-6 z-20 md:opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <button 
                  onClick={prevSlide} 
                  className="w-7 h-7 sm:w-8 sm:h-8 md:w-11 md:h-11 rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-md flex items-center justify-center text-white transition-all shadow-md active:scale-90 border border-white/20"
                  aria-label="Previous Slide"
                >
                  <FiChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                </button>
              </div>

              {/* Right Arrow */}
              <div className="absolute inset-y-0 right-0 flex items-center pr-1.5 sm:pr-2 md:pr-6 z-20 md:opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <button 
                  onClick={nextSlide} 
                  className="w-7 h-7 sm:w-8 sm:h-8 md:w-11 md:h-11 rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-md flex items-center justify-center text-white transition-all shadow-md active:scale-90 border border-white/20"
                  aria-label="Next Slide"
                >
                  <FiChevronRight className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                </button>
              </div>

              {/* Slide Indicators */}
              <div className="absolute bottom-2 md:bottom-5 right-4 sm:right-6 md:right-auto md:left-1/2 md:-translate-x-1/2 flex items-center gap-1.5 md:gap-2.5 z-20 bg-black/40 backdrop-blur-md px-2.5 py-1 md:px-3 md:py-1.5 rounded-full border border-white/15 shadow-sm">
                {slides.map((_, i) => (
                  <button 
                    key={i} 
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentSlide(i);
                    }}
                    className={`h-1.5 rounded-full transition-all duration-400 ${
                      i === currentSlide ? 'w-5 sm:w-6 md:w-8 bg-[#189D91] shadow-sm' : 'w-1.5 bg-white/40 hover:bg-white/70'
                    }`} 
                    aria-label={`Go to slide ${i + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
};

export default Banner;
