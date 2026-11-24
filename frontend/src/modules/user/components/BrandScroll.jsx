import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import api from '../../../shared/utils/api';

const BrandLogo = ({ brand }) => {
  const [error, setError] = useState(false);

  if (error || !brand.logo) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center text-deep-espresso bg-soft-oatmeal/5">
        <span className="text-2xl font-black tracking-tighter uppercase text-[#189D91]/60">
          {brand.name?.slice(0, 2)}
        </span>
      </div>
    );
  }

  return (
    <img 
      src={brand.logo} 
      alt={brand.name} 
      onError={() => setError(true)}
      className="max-w-[80%] max-h-[80%] object-contain mix-blend-multiply transition-transform duration-500 group-hover:scale-105"
    />
  );
};

const BrandScroll = ({ title }) => {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const { data } = await api.get('/brands');
        setBrands(data.data || []);
      } catch (err) {
        console.error('Failed to fetch brands for scroll:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBrands();
  }, []);

  if (!loading && brands.length === 0) return null;

  return (
    <section className="bg-white py-4 md:py-10">
      <div className="max-w-[1440px] mx-auto px-4 md:px-8">
        <h2 className="text-xl md:text-2xl font-black text-deep-espresso tracking-tight mb-4 md:mb-6">
          {title || "Brands In Focus"}
        </h2>

        <div className="overflow-x-auto no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
          <div className="flex gap-3 md:gap-5 pb-2">
            {brands.map((brand, index) => (
              <div
                key={brand._id || index}
                className="flex-shrink-0"
              >
                <Link to={`/brand/${brand.slug || brand.name.toLowerCase().replace(/\s+/g, '-')}`} className="group flex flex-col items-center gap-1.5 md:gap-2 w-24 md:w-40">
                  {/* Brand Card */}
                  <div className="relative aspect-[4/3] w-full bg-white border border-gray-200 group-hover:border-[#189D91] rounded-lg md:rounded-xl overflow-hidden shadow-sm group-hover:shadow-md transition-all duration-300">
                    <div className="w-full h-full flex items-center justify-center">
                      <BrandLogo brand={brand} />
                    </div>
                  </div>
                  
                  {/* Brand Offer */}
                  <div className="text-center">
                    <p className="text-[9px] md:text-sm font-bold empty:hidden text-[#189D91] tracking-tight group-hover:text-[#127F75] transition-colors">
                      {brand.offer}
                    </p>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default BrandScroll;
