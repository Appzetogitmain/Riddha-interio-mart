import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { LuChevronRight, LuChevronLeft } from 'react-icons/lu';
import { brandData as staticBrandData } from '../../models/brandData';
import { AnimatePresence, motion } from 'framer-motion';

const BrandPage = () => {
  const { brandName } = useParams();
  const [brand, setBrand] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    setLoading(true);
    const saved = localStorage.getItem('admin_brands');
    let foundBrand = null;

    if (saved) {
      const brands = JSON.parse(saved);
      // Try to find by slug or name
      foundBrand = brands.find(b => 
        (b.slug && b.slug.toLowerCase() === brandName?.toLowerCase()) || 
        (b.name && b.name.toLowerCase() === brandName?.toLowerCase())
      );
    }

    if (!foundBrand) {
      // Fallback to static data
      foundBrand = staticBrandData[brandName?.toLowerCase()];
    }

    setBrand(foundBrand);
    setLoading(false);
    setCurrentSlide(0);
    window.scrollTo(0, 0);
  }, [brandName]);

  // Auto-scroll carousel
  useEffect(() => {
    if (!brand?.banners?.length) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % brand.banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [brand]);

  if (loading) return <div className="min-h-screen bg-white" />;

  if (!brand) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center bg-white">
        <h1 className="text-3xl font-bold text-deep-espresso uppercase tracking-tighter italic">Brand Not Found</h1>
        <p className="text-warm-sand mt-2">We are currently updating our brand directories.</p>
        <Link to="/" className="mt-8 bg-[#189D91] text-white px-10 py-3.5 rounded-full font-bold uppercase tracking-widest text-xs shadow-xl shadow-[#189D91]/20 hover:scale-105 transition-all">Back to Home</Link>
      </div>
    );
  }

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % brand.banners.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + brand.banners.length) % brand.banners.length);

  return (
    <div className="bg-white min-h-screen pb-20 font-sans">
      {/* Brand Hero Carousel */}
      <section className="relative w-full aspect-[21/9] md:aspect-[3/1] overflow-hidden bg-gray-50 group/carousel">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className="w-full h-full relative"
          >
            <img 
              src={brand.banners[currentSlide]} 
              alt={`${brand.name} Banner ${currentSlide + 1}`} 
              className="w-full h-full object-cover"
            />
            {/* Overlay if it's a URL or generic image */}
            {(brand.banners[currentSlide]?.startsWith('http') || brand.banners[currentSlide]?.startsWith('data:')) && (
              <div className="absolute inset-0 bg-black/10 flex items-center px-6 md:px-20">
                 <h1 className="text-4xl md:text-7xl font-black text-white italic uppercase tracking-tighter drop-shadow-2xl">
                    {brand.name}
                 </h1>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Carousel Controls */}
        {brand.banners.length > 1 && (
          <>
            <div className="absolute inset-0 flex items-center justify-between px-4 opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-300">
               <button onClick={prevSlide} className="p-2 md:p-4 rounded-full bg-white/30 backdrop-blur-md text-white hover:bg-white/50 transition-all active:scale-90">
                  <LuChevronLeft className="w-6 h-6 md:w-8 md:h-8" />
               </button>
               <button onClick={nextSlide} className="p-2 md:p-4 rounded-full bg-white/30 backdrop-blur-md text-white hover:bg-white/50 transition-all active:scale-90">
                  <LuChevronRight className="w-6 h-6 md:w-8 md:h-8" />
               </button>
            </div>
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3 z-10">
               {brand.banners.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentSlide(idx)}
                    className={`h-1 rounded-full transition-all duration-500 ${currentSlide === idx ? 'w-10 bg-white' : 'w-4 bg-white/40'}`}
                  />
               ))}
            </div>
          </>
        )}
      </section>

      {/* Shop By Category - Horizontal Scroll */}
      <section className="max-w-7xl mx-auto py-12 md:py-20">
        <div className="px-4 md:px-12 flex items-center justify-between mb-8 md:mb-12">
          <h2 className="text-xl md:text-4xl font-display font-bold text-gray-900 tracking-tight">Shop By Category</h2>
          <Link to="/categories" className="text-xs md:text-sm font-bold text-[#189D91] flex items-center gap-1 hover:underline uppercase tracking-widest">
            View All <LuChevronRight />
          </Link>
        </div>
        
        <div className="flex overflow-x-auto no-scrollbar gap-4 md:gap-8 px-4 md:px-12 pb-6 snap-x">
          {brand.categories?.map((cat, idx) => (
            <Link 
              key={cat.id || idx}
              to={`/products?brand=${brand.name}&category=${cat.slug}`}
              className="flex flex-col flex-shrink-0 items-center gap-2 md:gap-4 w-24 md:w-56 snap-start group relative transition-all"
            >
              <div className="relative aspect-square w-full bg-white border-[1px] md:border-2 border-[#189D91] rounded-lg md:rounded-2xl overflow-hidden shadow-sm group-hover:shadow-md transition-all duration-300">
                <div className="w-full h-full flex items-center justify-center p-2 md:p-4 bg-[#F9F9F9]">
                  <img 
                    src={cat.image} 
                    alt={cat.name} 
                    className="max-w-full max-h-full object-contain transition-transform duration-500 group-hover:scale-110 mix-blend-multiply" 
                  />
                </div>
              </div>
              <div className="text-center">
                <span className="text-[9px] md:text-lg font-bold text-[#189D91] group-hover:text-[#127F75] transition-colors tracking-tight line-clamp-1 uppercase">
                  {cat.name}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Brand Highlight Promo */}
      <section className="max-w-7xl mx-auto px-4 md:px-12 py-8">
         <div className="rounded-[40px] bg-[#F2F2F2] p-8 md:p-16 flex flex-col md:flex-row items-center gap-8 md:gap-16 border border-gray-100">
            <div className="flex-1 space-y-4 md:space-y-6 text-center md:text-left">
               <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#189D91]">Official Brand</span>
               <h2 className="text-3xl md:text-5xl font-display font-bold text-deep-espresso leading-tight">
                  Authentic {brand.name} <br /> Products at Wholesale.
               </h2>
               <p className="text-sm md:text-lg text-warm-sand max-w-xl">
                  Get the best deals on {brand.name} electrical and interior solutions. Direct from warehouse with guaranteed quality and fast delivery.
               </p>
               <button className="bg-deep-espresso text-white px-10 py-4 rounded-full font-bold uppercase tracking-widest text-xs shadow-2xl transition-all hover:bg-[#189D91] hover:scale-105 active:scale-95">
                  Explore Catalog
               </button>
            </div>
            <div className="hidden md:block w-1/3 aspect-square bg-white rounded-full p-12 border-4 border-white shadow-2xl">
               <div className="w-full h-full flex items-center justify-center">
                  <span className="text-4xl font-black italic tracking-tighter uppercase text-[#189D91]/20">
                     {brand.name}
                  </span>
               </div>
            </div>
         </div>
      </section>
    </div>
  );
};

export default BrandPage;
