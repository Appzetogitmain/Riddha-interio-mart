import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import brandsGrid from '../../../assets/top_brands_grid_1774683605586.png';

const TopBrands = ({ title }) => {
  const [brands, setBrands] = useState([]);
  const [useStaticGrid, setUseStaticGrid] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('admin_brands');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.length > 0) {
        setBrands(parsed);
        setUseStaticGrid(false);
      }
    }
  }, []);

  // Fallback static brands for the grid overlay if no admin data
  const staticBrands = [
    { name: 'ANCHOR', offer: 'Up to 50% off', path: '/brand/anchor' },
    { name: 'Greenply', offer: 'Extra 2% off', path: '/brand/greenply' },
    { name: 'Hettich', offer: 'Up to 20% off', path: '/brand/hettich' },
    { name: 'Nippon Paint', offer: 'Up to 30% off', path: '/brand/nippon' },
    { name: 'Prince', offer: 'Pipes & Fittings', path: '/brand/prince' },
    { name: 'Cera', offer: 'Up to 30% off', path: '/brand/cera' },
    { name: 'Havells', offer: 'Up to 40% off', path: '/brand/havells' },
    { name: 'Bosch', offer: 'Up to 40% off', path: '/brand/bosch' },
    { name: 'Taparia', offer: 'Up to 15% off', path: '/brand/taparia' },
  ];

  return (
    <section className="max-w-7xl mx-auto px-4 md:px-12 py-4">
      <div className="bg-[#F2F2F2] py-4 text-center border-x border-t border-gray-100">
        <h2 className="text-xl md:text-2xl font-bold text-gray-800 tracking-tight">
          {title || "Explore our Top Brands"}
        </h2>
      </div>
      
      <div className="relative group overflow-hidden border border-gray-100 shadow-sm bg-white">
        {useStaticGrid ? (
          <>
            {/* The Original Grid Image */}
            <img 
              src={brandsGrid} 
              alt="Top Brands Grid" 
              className="w-full h-auto object-cover"
            />
            {/* Interactive Overlay Grid */}
            <div className="absolute inset-0 grid grid-cols-3">
              {staticBrands.map((brand, index) => (
                <Link
                  key={brand.name}
                  to={brand.path}
                  className="relative flex flex-col items-center justify-end pb-4 md:pb-10 group/brand hover:bg-black/5 transition-colors cursor-pointer"
                >
                  <span className="sr-only">{brand.name}</span>
                  <p className="text-[#189D91] text-[8px] md:text-lg font-bold text-center tracking-tight transition-transform group-hover/brand:scale-110">
                    {brand.offer}
                  </p>
                </Link>
              ))}
            </div>
          </>
        ) : (
          /* Dynamic Grid */
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-px bg-gray-100">
            {brands.map((brand) => (
              <Link
                key={brand.id}
                to={`/brand/${brand.slug || brand.name.toLowerCase()}`}
                className="bg-white p-6 md:p-10 flex flex-col items-center justify-center gap-4 group/brand hover:bg-gray-50 transition-all text-center min-h-[160px] md:min-h-[240px]"
              >
                <div className="w-full h-16 md:h-24 flex items-center justify-center overflow-hidden">
                  <img 
                    src={brand.logo} 
                    alt={brand.name} 
                    className="max-w-full max-h-full object-contain mix-blend-multiply group-hover/brand:scale-110 transition-transform duration-500" 
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] md:text-xs font-black uppercase tracking-widest text-gray-400 opacity-0 group-hover/brand:opacity-100 transition-opacity">
                    Official Brand
                  </p>
                  <p className="text-[#189D91] text-[10px] md:text-lg font-bold tracking-tight">
                    {brand.offer}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

    </section>
  );
};

export default TopBrands;
