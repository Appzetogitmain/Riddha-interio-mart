import React, { useState, useEffect, useRef } from 'react';
import { motion as Motion } from 'framer-motion';
import Banner from '../components/Banner';
import OfferBanner from '../components/OfferBanner';
import FavouriteCategories from '../components/FavouriteCategories';
import TopBrands from '../components/TopBrands';
import PromoGrid from '../components/PromoGrid';
import TrustBar from '../components/TrustBar';
import ExpressDeliveryBanner from '../components/ExpressDeliveryBanner';
import DynamicSections from '../components/DynamicSections';
import ProductCard from '../components/ProductCard';
import Button from '../../../shared/components/Button';
import { Link } from 'react-router-dom';
import api from '../../../shared/utils/api';
import ShopByCategory from '../components/ShopByCategory';
import { LuChevronRight, LuChevronLeft } from 'react-icons/lu';

const SectionGrid = ({ products, loading, containerVariants, autoSlide = false, fadeColor = "from-white/90" }) => {
  const scrollRef = useRef(null);

  const getProductImage = (p) =>
    p?.image ||
    p?.images?.[0] ||
    p?.thumbnail ||
    'https://images.unsplash.com/photo-1513519245088-0e12902e35ca?w=800&q=80';

  const toMoney = (value) => {
    const number = Number(value);
    if (Number.isNaN(number)) return '₹0';
    return `₹${number.toLocaleString('en-IN')}`;
  };

  // Auto-slide, when enabled
  useEffect(() => {
    if (!autoSlide || loading || products.length <= 3) return;
    const timer = setInterval(() => {
      const el = scrollRef.current;
      if (!el) return;
      const card = el.querySelector('[data-arrival-card]');
      const amount = card ? card.offsetWidth + 16 : el.clientWidth * 0.5;
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
      if (atEnd) {
        el.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        el.scrollBy({ left: amount, behavior: 'smooth' });
      }
    }, 3500);
    return () => clearInterval(timer);
  }, [autoSlide, loading, products.length]);

  const scrollManual = (direction) => {
    const el = scrollRef.current;
    if (!el) return;
    const card = el.querySelector('[data-arrival-card]');
    const amount = (card ? card.offsetWidth + 16 : 220) * 2;
    el.scrollBy({ left: direction * amount, behavior: 'smooth' });
  };

  return (
    <div className="relative group/carousel">
      {/* Desktop Previous Button */}
      <button
        onClick={() => scrollManual(-1)}
        aria-label="Previous products"
        className="hidden md:flex absolute -left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/95 hover:bg-white text-gray-700 hover:text-[#189D91] shadow-md border border-stone-200/80 items-center justify-center transition-all duration-300 opacity-0 group-hover/carousel:opacity-100 hover:scale-110 active:scale-95"
      >
        <LuChevronLeft size={16} />
      </button>

      {/* Desktop Next Button */}
      <button
        onClick={() => scrollManual(1)}
        aria-label="Next products"
        className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/95 hover:bg-white text-gray-700 hover:text-[#189D91] shadow-md border border-stone-200/80 items-center justify-center transition-all duration-300 opacity-0 group-hover/carousel:opacity-100 hover:scale-110 active:scale-95"
      >
        <LuChevronRight size={16} />
      </button>

      {/* Fade edge on right */}
      <div className={`pointer-events-none absolute right-0 top-0 h-full w-12 bg-gradient-to-l ${fadeColor} to-transparent z-10`} />

      <Motion.div
        ref={scrollRef}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex flex-row gap-3 md:gap-4 overflow-x-auto pb-3 pt-1 scrollbar-hide px-0.5"
        style={{ scrollSnapType: 'x mandatory' }}
      >
      {loading ? (
        [1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="flex-none w-36 md:w-48 aspect-[3/4] bg-stone-100 rounded-2xl animate-pulse border border-stone-200/60" />
        ))
      ) : (
        products.map((product) => {
          const productId = product._id || product.id;
          const rawPrice = Number(product?.price) || 0;
          const rawDiscount = Number(product?.discountPrice) || 0;
          const hasDiscount = rawDiscount > 0 && rawDiscount < rawPrice && rawDiscount >= rawPrice * 0.5;
          const displayPrice = hasDiscount ? rawDiscount : rawPrice;
          const originalPrice = hasDiscount ? rawPrice : null;

          const getDeliveryEstimate = () => {
            const idString = String(productId || '');
            let charCodeSum = 0;
            for (let i = 0; i < idString.length; i++) {
              charCodeSum += idString.charCodeAt(i);
            }
            const daysToAdd = (charCodeSum % 3) + 1;
            
            const deliveryDate = new Date();
            deliveryDate.setDate(deliveryDate.getDate() + daysToAdd);
            
            if (daysToAdd === 1) {
              return 'Tomorrow';
            }
            
            return deliveryDate.toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric'
            });
          };

          return (
            <Motion.div
              key={productId}
              data-arrival-card
              variants={{
                hidden: { opacity: 0, y: 15 },
                visible: { opacity: 1, y: 0 }
              }}
              className="flex-none w-36 md:w-48"
              style={{ scrollSnapAlign: 'start' }}
            >
              <Link
                to={`/products/${productId}`}
                className="group flex flex-col overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-xs hover:shadow-[0_16px_36px_rgba(24,157,145,0.12)] hover:border-[#189D91]/40 hover:-translate-y-1 transition-all duration-400 h-full"
              >
                {/* Product Image */}
                <div className="relative aspect-square overflow-hidden bg-stone-50">
                  <img
                    src={getProductImage(product)}
                    alt={product?.name || 'Product'}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-108"
                  />
                  {hasDiscount && (
                    <span className="absolute top-2 left-2 bg-[#0F172A] text-amber-300 border border-amber-400/30 text-[8px] font-black px-2 py-0.5 rounded-md shadow-xs tracking-wider">
                      SALE
                    </span>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>

                {/* Product Info */}
                <div className="p-2.5 flex flex-col gap-1 flex-1 justify-between bg-white">
                  <div>
                    <p className="line-clamp-1 text-[11px] md:text-xs font-black text-slate-900 group-hover:text-[#189D91] transition-colors leading-tight">
                      {product?.name}
                    </p>
                    <p className="line-clamp-1 text-[8px] md:text-[9px] font-bold text-[#189D91] uppercase tracking-wider mt-0.5">
                      {product?.category}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span className="text-[12px] md:text-sm font-black text-slate-950">
                        {toMoney(displayPrice)}
                      </span>
                      {hasDiscount && (
                        <span className="text-[9px] text-gray-400 line-through">
                          {toMoney(originalPrice)}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Compact Delivery Estimate UI */}
                  <div className="mt-1.5 pt-1.5 border-t border-stone-100 flex items-center gap-1.5 text-[8px] md:text-[10px] text-slate-500">
                    <span className="text-[10px]">🚚</span>
                    <span className="truncate">Del: <span className="font-bold text-slate-800">{getDeliveryEstimate()}</span></span>
                  </div>
                </div>
              </Link>
            </Motion.div>
          );
        })
      )}
    </Motion.div>
    </div>
  );
};

import RecommendationFeed from '../components/RecommendationFeed';
import { useUser } from '../data/UserContext';

const HomePage = () => {
  const [products, setProducts] = useState([]);
  const [advertisedProducts, setAdvertisedProducts] = useState([]);
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [whatsappNumber, setWhatsappNumber] = useState("9111661100");
  const { user } = useUser();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await api.get('/products');
        setProducts(res.data.data);
      } catch (err) {
        console.error('Failed to fetch products:', err);
      } finally {
        setLoading(false);
      }
    };

    const fetchBanners = async () => {
      try {
        const res = await api.get('/home-banner');
        const list = Array.isArray(res.data?.data) ? res.data.data : [];
        setBanners(list);
      } catch (err) {
        console.error('Failed to fetch home banners:', err);
      }
    };

    const fetchAdvertisements = async () => {
      try {
        const res = await api.get('/advertisements/public');
        if (res.data.success) {
          setAdvertisedProducts(res.data.data);
        }
      } catch (err) {
        console.error('Failed to fetch advertisements:', err);
      }
    };

    const fetchSettings = async () => {
      try {
        const res = await api.get('/settings');
        if (res.data?.success && res.data?.data?.whatsappNumber) {
          setWhatsappNumber(res.data.data.whatsappNumber);
        }
      } catch (err) {
        console.error('Failed to fetch settings:', err);
      }
    };

    fetchProducts();
    fetchBanners();
    fetchAdvertisements();
    fetchSettings();
  }, []);

  const newArrivals = products.slice(0, 10);
  const bestSelling = products.slice(10, 20);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <div className="space-y-0 py-0">
      {/* Banner Section (Top Hero) */}
      <section className="w-full">
        <Banner banners={banners} />
      </section>

      {/* Featured Advertisements */}
      {(advertisedProducts.length > 0) && (
        <section
          className="w-full py-8 md:py-12 my-0 border-y"
          style={{
            background: 'linear-gradient(180deg, #DCF5F0 0%, #E6F9F5 50%, #D5F2EC 100%)',
            borderColor: '#AEE4DA',
          }}
        >
          <div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-12">
            <div className="flex justify-between items-end mb-4">
              <div>
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] bg-[#189D91]/15 text-[#0F766E] border border-[#189D91]/30 mb-1">
                  Featured Deals
                </span>
                <h2 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">
                  Sponsored Products
                </h2>
                <p className="text-xs md:text-sm text-gray-500 font-medium">Top picks for you</p>
              </div>
              <Link to="/products" className="text-xs md:text-sm font-bold text-[#189D91] hover:text-[#137c72] flex items-center gap-1 group bg-white px-3 py-1.5 rounded-xl border border-[#AEE4DA] shadow-2xs">
                See All <LuChevronRight className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            <SectionGrid products={advertisedProducts} loading={loading} containerVariants={containerVariants} fadeColor="from-[#E6F9F5]" />
          </div>
        </section>
      )}

      {/* Visual Shop by Category Row (Soft Mint Background from reference image) */}
      <ShopByCategory />

      {/* AI Recommendation Engine Feed (Soft Blush Pink Background from reference image) */}
      <RecommendationFeed />

      {/* Promo Section (Benefits Grid) */}
      <PromoGrid />

      {/* Designer Favorites / Favourite Categories Section */}
      <FavouriteCategories />

      {/* New Season Arrivals Section (Warm Cream / Pale Amber Background from reference image) */}
      <section
        className="py-8 md:py-14 my-0 border-y"
        style={{
          background: 'linear-gradient(180deg, #FEE8D2 0%, #FFF1E2 50%, #FEDEBF 100%)',
          borderColor: '#FDCBA0',
        }}
      >
        <div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-12">

          {/* Section Header */}
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <div>
              <span className="inline-block px-3 py-0.5 rounded-full text-[9px] font-black uppercase tracking-[0.25em] bg-[#D97706]/15 text-[#B45309] mb-1 border border-[#D97706]/30">
                Curated Picks
              </span>
              <h2 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight leading-tight">New Season Arrivals</h2>
            </div>
            <Link to="/products" className="flex items-center gap-1 text-[11px] md:text-sm font-bold text-[#D97706] hover:underline bg-white px-3 py-1.5 rounded-xl border border-[#FDCBA0] shadow-2xs shrink-0">
              View All <LuChevronRight size={14} />
            </Link>
          </div>

          <SectionGrid products={newArrivals} loading={loading} containerVariants={containerVariants} autoSlide fadeColor="from-[#FFF1E2]" />
        </div>
      </section>

      {/* Top Brands Section (Soft Sky Blue / Ice Blue Background from reference image) */}
      <TopBrands />

      {/* Offer Banner */}
      <OfferBanner />

      {/* Admin-Created Custom Sections */}
      <DynamicSections />

      {/* Why Shop With Riddha / Trust Bar (Soft Mint / Seafoam Background from reference image) */}
      <TrustBar />

    </div>
  );
};

export default HomePage;
