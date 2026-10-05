import React, { useEffect, useState } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import api from '../../../shared/utils/api';

// Assets
import offerBannerBase from '../../../assets/offer_banner.png';
import offerBanner1 from '../../../assets/offer_banner_1.png';
import offerBanner2 from '../../../assets/offer_banner_2.png';

const defaultSlides = [
  { id: 1, title: 'Turn On\nThe Charm', offer: 'Min. 40% Off', image: offerBannerBase, ctaLink: '/products' },
  { id: 2, title: 'Bespoke\nFurniture', offer: 'Up to 30% Off', image: offerBanner1, ctaLink: '/products' },
  { id: 3, title: 'Elegant\nDecor', offer: 'Flat 20% Off', image: offerBanner2, ctaLink: '/products' },
];

const mapPromoBanner = (item, index) => {
  const image = item?.image || item?.bgImage?.src || item?.bannerImage || '';

  if (!image) return null;

  return {
    id: item?._id || item?.id || `promo-banner-${index}`,
    title: item?.title || 'Promo Offer',
    offer: item?.subtitle || item?.ctaText || 'Limited Offer',
    image,
    ctaLink: item?.ctaLink || '/products',
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

        const mappedSlides = list.map(mapPromoBanner).filter(Boolean);

        if (mappedSlides.length > 0) {
          setSlides(mappedSlides);
          setCurrent(0);
        }
      } catch (err) {
        console.error('Failed to load promo banners:', err);
      }
    };

    fetchPromoBanners();
  }, []);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides]);

  return (
    <section className="max-w-7xl mx-auto px-4 md:px-12 py-6">
      <div className="flex flex-row h-32 sm:h-40 md:h-64 rounded-xl md:rounded-[2.5rem] overflow-hidden shadow-lg border border-[#E52574]/20 bg-white relative">
        <AnimatePresence mode="wait">
          <Motion.div
            key={current}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0 flex flex-row"
          >
            <div className="w-[42%] min-[400px]:w-[38%] md:w-[30%] bg-gradient-to-br from-[#FFF0F5] via-white to-[#FCE7F3] flex flex-col justify-center px-3 min-[400px]:px-4 md:px-12 py-2 md:py-8 space-y-1 md:space-y-4 border-r border-[#E52574]/20">
              <h3 className="text-[13px] min-[360px]:text-[15px] sm:text-lg md:text-3xl font-black text-gray-900 leading-[1.1] md:leading-tight uppercase tracking-tight whitespace-pre-line">
                {slides[current].title}
              </h3>
              <Link
                to={slides[current].ctaLink || '/products'}
                className="text-[9px] min-[360px]:text-[10px] sm:text-xs md:text-lg font-bold text-[#E52574] hover:text-[#b01454] uppercase tracking-[0.05em] md:tracking-widest flex items-center gap-1 md:gap-2 transition-colors"
              >
                {slides[current].offer}{' '}
                <span className="text-sm md:text-xl transform md:translate-y-[1px]">→</span>
              </Link>
            </div>

            <div className="w-[58%] min-[400px]:w-[62%] md:w-[70%] relative overflow-hidden bg-soft-oatmeal/5">
              <img
                src={slides[current].image}
                alt="Offer Banner"
                className="h-full w-full object-cover"
              />

              <p className="absolute bottom-2 md:bottom-6 right-4 md:right-10 text-[6px] md:text-[10px] text-white/50 font-bold tracking-widest uppercase">
                *T&C Apply
              </p>
            </div>
          </Motion.div>
        </AnimatePresence>

        <div className="absolute bottom-4 md:bottom-8 left-[45%] md:left-[35%] flex gap-2 md:gap-3 z-10">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-1 md:h-2 rounded-full transition-all duration-300 ${current === i ? 'w-4 md:w-10 bg-warm-sand' : 'w-1 md:w-2 bg-gray-200'
                }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default OfferBanner;
