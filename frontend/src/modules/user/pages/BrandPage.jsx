import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { LuChevronRight, LuChevronLeft } from 'react-icons/lu';
import { brandData as staticBrandData } from '../data/brandData';
import { AnimatePresence, motion } from 'framer-motion';
import api from '../../../shared/utils/api';
import ProductCard from '../components/ProductCard';

const BrandPage = () => {
  const { brandName } = useParams();
  const [brand, setBrand] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const fetchBrandData = async () => {
      setLoading(true);
      let foundBrand = null;

      // 1. Try fetching from Backend API
      try {
        const { data } = await api.get('/brands');
        const brands = data.data || [];
        foundBrand = brands.find(b => 
          (b.slug && b.slug.toLowerCase() === brandName?.toLowerCase()) || 
          (b.name && b.name.toLowerCase() === brandName?.toLowerCase())
        );
      } catch (err) {
        console.error('Failed to fetch brands from API:', err);
      }

      // 2. Try Local Storage (Legacy/Admin)
      if (!foundBrand) {
        const saved = localStorage.getItem('admin_brands');
        if (saved) {
          const brands = JSON.parse(saved);
          foundBrand = brands.find(b => 
            (b.slug && b.slug.toLowerCase() === brandName?.toLowerCase()) || 
            (b.name && b.name.toLowerCase() === brandName?.toLowerCase())
          );
        }
      }

      // 3. Fallback to static data
      if (!foundBrand) {
        foundBrand = staticBrandData[brandName?.toLowerCase()];
      }

      setBrand(foundBrand);
      setLoading(false);
      setCurrentSlide(0);
      window.scrollTo(0, 0);

      if (foundBrand?._id) {
        fetchBrandProducts(foundBrand._id);
      }
    };

    const fetchBrandProducts = async (brandId) => {
      try {
        setLoadingProducts(true);
        const { data } = await api.get(`/products?brand=${brandId}`);
        setProducts(data.data || []);
      } catch (err) {
        console.error('Failed to fetch brand products:', err);
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchBrandData();
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
    <div className="bg-white min-h-screen pb-14 md:pb-20 font-sans">
      {/* Brand Hero Carousel */}
      <section className="relative w-full aspect-[21/9] md:aspect-[4.2/1] lg:aspect-[4.8/1] overflow-hidden bg-gray-50 group/carousel">
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
            {/* Brand name badge */}
            {(brand.banners[currentSlide]?.startsWith('http') || brand.banners[currentSlide]?.startsWith('data:')) && (
              <div className="absolute bottom-4 left-4 md:bottom-6 md:left-6">
                <span className="inline-block bg-white/90 backdrop-blur-sm text-slate-800 text-xs font-bold px-3 py-1.5 rounded-full shadow-sm tracking-wide">
                  {brand.name}
                </span>
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
            <div className="absolute bottom-4 md:bottom-5 left-1/2 -translate-x-1/2 flex gap-2.5 z-10">
               {brand.banners.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentSlide(idx)}
                    className={`h-1 rounded-full transition-all duration-500 ${currentSlide === idx ? 'w-8 md:w-10 bg-white' : 'w-3.5 md:w-4 bg-white/40'}`}
                  />
               ))}
            </div>
          </>
        )}
      </section>

      {/* Shop By Category - Horizontal Scroll */}
      <section className="max-w-7xl mx-auto py-10 md:py-14 lg:py-16">
        <div className="px-4 md:px-10 lg:px-12 flex items-center justify-between mb-6 md:mb-8">
          <h2 className="text-xl md:text-3xl lg:text-4xl font-display font-bold text-gray-900 tracking-tight">Shop By Category</h2>
          <Link to="/categories" className="text-xs md:text-sm font-bold text-[#189D91] flex items-center gap-1 hover:underline uppercase tracking-widest">
            View All <LuChevronRight />
          </Link>
        </div>
        
        <div className="flex overflow-x-auto no-scrollbar gap-3.5 md:gap-5 lg:gap-6 px-4 md:px-10 lg:px-12 pb-4 md:pb-5 snap-x">
          {brand.categories?.map((cat, idx) => (
            <Link 
              key={cat.id || idx}
              to={`/products?brand=${brand.name}&category=${cat.slug}`}
              className="flex flex-col flex-shrink-0 items-center gap-2 md:gap-3 w-24 md:w-40 lg:w-48 snap-start group relative transition-all"
            >
              <div className="relative aspect-square w-full bg-white border-[1px] md:border-2 border-[#189D91] rounded-lg md:rounded-2xl overflow-hidden shadow-sm group-hover:shadow-md transition-all duration-300">
                <div className="w-full h-full flex items-center justify-center p-2 md:p-3 lg:p-4 bg-[#F9F9F9]">
                  <img 
                    src={cat.image} 
                    alt={cat.name} 
                    className="max-w-full max-h-full object-contain transition-transform duration-500 group-hover:scale-110 mix-blend-multiply" 
                  />
                </div>
              </div>
              <div className="text-center">
                <span className="text-[9px] md:text-sm lg:text-base font-bold text-[#189D91] group-hover:text-[#127F75] transition-colors tracking-tight line-clamp-1 uppercase">
                  {cat.name}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Brand Products Section */}
      <section className="max-w-7xl mx-auto py-10 md:py-14 lg:py-16 bg-soft-oatmeal/5">
        <div className="px-4 md:px-10 lg:px-12 flex items-center justify-between mb-6 md:mb-8">
          <div className="space-y-1">
            <h2 className="text-xl md:text-3xl lg:text-4xl font-display font-bold text-gray-900 tracking-tight">
              {brand.name} Collection
            </h2>
            <p className="text-warm-sand font-medium text-[10px] md:text-xs uppercase tracking-widest">
              {products.length} Premium Pieces
            </p>
          </div>
        </div>

        {loadingProducts ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-10 w-10 border-4 border-[#189D91]/20 border-t-[#189D91] rounded-full animate-spin"></div>
          </div>
        ) : products.length > 0 ? (
          <div className="px-4 md:px-10 lg:px-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
            {products.map((product, index) => (
              <ProductCard key={product._id} product={product} index={index} />
            ))}
          </div>
        ) : (
          <div className="px-4 md:px-10 lg:px-12 py-14 md:py-16 text-center bg-white rounded-3xl mx-4 md:mx-10 lg:mx-12">
            <p className="text-warm-sand font-bold text-lg">No products found for this brand yet.</p>
          </div>
        )}
      </section>

      {/* Brand Highlight Promo */}
      <section className="max-w-7xl mx-auto px-4 md:px-10 lg:px-12 py-8 md:py-10">
         <div className="rounded-[32px] md:rounded-[36px] bg-[#F2F2F2] p-6 md:p-10 lg:p-12 flex flex-col md:flex-row items-center gap-6 md:gap-10 border border-gray-100">
            <div className="flex-1 space-y-4 md:space-y-6 text-center md:text-left">
               <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#189D91]">Official Brand</span>
               <h2 className="text-2xl md:text-4xl lg:text-5xl font-display font-bold text-deep-espresso leading-tight">
                  Authentic {brand.name} <br /> Products at Wholesale.
               </h2>
               <p className="text-sm md:text-base lg:text-lg text-warm-sand max-w-xl">
                  Get the best deals on {brand.name} electrical and interior solutions. Direct from warehouse with guaranteed quality and fast delivery.
               </p>
               <button className="bg-deep-espresso text-white px-8 md:px-10 py-3.5 md:py-4 rounded-full font-bold uppercase tracking-widest text-xs shadow-2xl transition-all hover:bg-[#189D91] hover:scale-105 active:scale-95">
                  Explore Catalog
               </button>
            </div>
            <div className="hidden md:block w-1/3 aspect-square bg-white rounded-full p-8 lg:p-10 border-4 border-white shadow-2xl">
               <div className="w-full h-full flex items-center justify-center">
                  <span className="text-3xl lg:text-4xl font-black italic tracking-tighter uppercase text-[#189D91]/20">
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
