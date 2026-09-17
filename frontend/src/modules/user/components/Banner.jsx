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
    <section className="py-2 md:py-4 bg-white">
      <div className="max-w-[1700px] mx-auto px-2 md:px-10">
        <div className="relative w-full aspect-[2.4/1] md:aspect-[4.5/1] overflow-hidden bg-gray-50 rounded-2xl md:rounded-[32px] shadow-sm">

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
                <div className="absolute inset-0 bg-black/40 flex flex-col justify-center px-8 md:px-20 z-10 text-white">
                  {slides[currentSlide]?.title && (
                    <h2 className="text-lg md:text-3xl lg:text-4xl font-black mb-2 md:mb-3 tracking-tight drop-shadow-md max-w-2xl text-[var(--color-primary)]">
                      {slides[currentSlide].title}
                    </h2>
                  )}
                  {slides[currentSlide]?.subtitle && (
                    <p className="text-[11px] md:text-base lg:text-lg font-semibold mb-4 md:mb-6 text-gray-100 max-w-2xl drop-shadow-sm">
                      {slides[currentSlide].subtitle}
                    </p>
                  )}
                  <div className="flex items-center gap-3 md:gap-4">
                    {slides[currentSlide]?.primaryBtnText && (
                      <Link 
                        to={slides[currentSlide].primaryBtnLink || '#'} 
                        className="px-5 py-2.5 md:px-7 md:py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-full text-[10px] md:text-xs font-black shadow-lg transition-all hover:-translate-y-1 border-2 border-teal-600 hover:border-teal-700"
                      >
                        {slides[currentSlide].primaryBtnText}
                      </Link>
                    )}
                    {slides[currentSlide]?.secondaryBtnText && (
                      <Link 
                        to={slides[currentSlide].secondaryBtnLink || '#'} 
                        className="px-5 py-2.5 md:px-7 md:py-3 bg-white/10 hover:bg-white text-white hover:text-slate-900 backdrop-blur-md rounded-full text-[10px] md:text-xs font-black shadow-lg transition-all hover:-translate-y-1 border-2 border-white/70 hover:border-white"
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
              <div className="absolute inset-y-0 left-0 flex items-center pl-2 md:pl-6 z-20">
                <button 
                  onClick={prevSlide} 
                  className="w-8 h-8 md:w-12 md:h-12 rounded-full bg-black/15 hover:bg-black/35 backdrop-blur-sm flex items-center justify-center text-white transition-all shadow-md active:scale-95"
                  aria-label="Previous Slide"
                >
                  <FiChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
                </button>
              </div>

              {/* Right Arrow */}
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 md:pr-6 z-20">
                <button 
                  onClick={nextSlide} 
                  className="w-8 h-8 md:w-12 md:h-12 rounded-full bg-black/15 hover:bg-black/35 backdrop-blur-sm flex items-center justify-center text-white transition-all shadow-md active:scale-95"
                  aria-label="Next Slide"
                >
                  <FiChevronRight className="w-5 h-5 md:w-6 md:h-6" />
                </button>
              </div>

              {/* Slide Indicators */}
              <div className="absolute bottom-3 md:bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1.5 md:gap-3 z-20">
                {slides.map((_, i) => (
                  <button 
                    key={i} 
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentSlide(i);
                    }}
                    className={`h-1 md:h-1.5 rounded-full transition-all duration-300 ${
                      i === currentSlide ? 'w-6 md:w-10 bg-white shadow-sm' : 'w-1 md:w-1.5 bg-white/40'
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
