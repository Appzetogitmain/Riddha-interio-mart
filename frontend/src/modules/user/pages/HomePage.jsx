import React, { useState, useEffect } from 'react';
import { motion as Motion } from 'framer-motion';
import Banner from '../components/Banner';
import OfferBanner from '../components/OfferBanner';
import FavouriteCategories from '../components/FavouriteCategories';
import TopBrands from '../components/TopBrands';
import CategoryQuickAccess from '../components/CategoryQuickAccess';
import PromoGrid from '../components/PromoGrid';
import TrustBar from '../components/TrustBar';
import ExpressDeliveryBanner from '../components/ExpressDeliveryBanner';
import DynamicSections from '../components/DynamicSections';
import ProductCard from '../components/ProductCard';
import Button from '../../../shared/components/Button';
import { Link } from 'react-router-dom';
import api from '../../../shared/utils/api';
import ShopByCategory from '../components/ShopByCategory';
import { LuChevronRight } from 'react-icons/lu';
import WhatsAppFloat from '../components/WhatsAppFloat';

const SectionGrid = ({ products, loading, containerVariants }) => {
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

  return (
    <div className="relative">
      {/* Fade edge on right */}
      <div className="pointer-events-none absolute right-0 top-0 h-full w-12 bg-gradient-to-l from-white to-transparent z-10" />
      <Motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex flex-row gap-3 md:gap-4 overflow-x-auto pb-2 scrollbar-hide"
        style={{ scrollSnapType: 'x mandatory' }}
      >
      {loading ? (
        [1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="flex-none w-36 md:w-48 aspect-[3/4] bg-gray-100 rounded-xl animate-pulse" />
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
              variants={{
                hidden: { opacity: 0, y: 15 },
                visible: { opacity: 1, y: 0 }
              }}
              className="flex-none w-36 md:w-48"
              style={{ scrollSnapAlign: 'start' }}
            >
              <Link
                to={`/products/${productId}`}
                className="group flex flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 h-full"
              >
                {/* Product Image */}
                <div className="relative aspect-square overflow-hidden bg-gray-50">
                  <img
                    src={getProductImage(product)}
                    alt={product?.name || 'Product'}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {hasDiscount && (
                    <span className="absolute top-1.5 left-1.5 bg-[#EC008C] text-white text-[8px] font-black px-1.5 py-0.5 rounded-md">
                      SALE
                    </span>
                  )}
                </div>

                {/* Product Info */}
                <div className="p-2 flex flex-col gap-0.5 flex-1 justify-between">
                  <div>
                    <p className="line-clamp-1 text-[10px] md:text-xs font-black text-gray-800 leading-tight">
                      {product?.name}
                    </p>
                    <p className="line-clamp-1 text-[8px] md:text-[10px] font-bold text-[#189D91] uppercase tracking-wide">
                      {product?.category}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[11px] md:text-sm font-black text-gray-900">
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
                  <div className="mt-1.5 pt-1.5 border-t border-gray-50 flex items-center gap-1 text-[8px] md:text-[10px] text-slate-500">
                    <span>🚚</span>
                    <span className="truncate">Del: <span className="font-semibold text-slate-700">{getDeliveryEstimate()}</span></span>
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

const HomePage = () => {
  const [products, setProducts] = useState([]);
  const [advertisedProducts, setAdvertisedProducts] = useState([]);
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);

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

    fetchProducts();
    fetchBanners();
    fetchAdvertisements();
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
      {/* Banner Section (Now at Top) */}
      <section className="w-full">
        <Banner banners={banners} />
      </section>

      {/* Quick Access Categories */}
      <CategoryQuickAccess />

      {/* Featured Advertisements */}
      {(advertisedProducts.length > 0) && (
        <section className="px-4 md:px-8 py-4">
          <div className="flex justify-between items-end mb-4">
            <div>
              <h2 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">
                Sponsored Products
              </h2>
              <p className="text-xs md:text-sm text-gray-500 font-medium">Top picks for you</p>
            </div>
            <Link to="/products" className="text-sm font-bold text-[#189D91] hover:text-[#137c72] flex items-center gap-1 group">
              See All <LuChevronRight className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          <SectionGrid products={advertisedProducts} loading={loading} containerVariants={containerVariants} />
        </section>
      )}

      {/* Promo Section (Benefits for Contractors, Designers, etc.) */}
      <PromoGrid />

      {/* Visual Shop by Category Row */}
      <ShopByCategory />

      {/* Designer Favorites / Favourite Categories Section */}
      <FavouriteCategories />

      {/* New Season Arrivals Section */}
      <section className="bg-white py-4 md:py-8 border-t border-gray-50">
        <div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-12">

          {/* Section Header */}
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.25em] text-[#189D91] mb-0.5">Curated Collection</p>
              <h2 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight leading-tight">New Season Arrivals</h2>
            </div>
            <Link to="/products" className="flex items-center gap-1 text-[11px] md:text-sm font-bold text-[#189D91] hover:underline shrink-0">
              View All <span>›</span>
            </Link>
          </div>

          <SectionGrid products={newArrivals} loading={loading} containerVariants={containerVariants} />
        </div>
      </section>




      {/* Trust & Help Bar (Now below ShopByCategory) */}
      <TrustBar />

      {/* Offer Banner */}
      <OfferBanner />


      {/* Admin-Created Custom Sections */}
      <DynamicSections />

      {/* Top Brands Section */}
      <TopBrands />

      {/* WhatsApp Floating Button */}
      <WhatsAppFloat />

    </div>
  );
};

export default HomePage;
