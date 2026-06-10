import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiSearch } from 'react-icons/fi';
import api from '../../../shared/utils/api';

const BrandsPage = () => {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/brands')
      .then(res => setBrands(res.data.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = brands.filter(b =>
    b.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-16">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 md:px-12 py-8">
        <div className="max-w-6xl mx-auto">
          <p className="text-[10px] uppercase tracking-[0.25em] font-black text-[#189D91] mb-1">Curated Partners</p>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-slate-900">All Brands</h1>
          <p className="text-sm text-gray-400 font-medium mt-1">
            {brands.length} trusted brand{brands.length !== 1 ? 's' : ''} available
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-12 pt-6">
        {/* Search */}
        <div className="relative max-w-sm mb-6">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
          <input
            type="text"
            placeholder="Search brands..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium focus:outline-none focus:border-[#189D91]/40 transition-all"
          />
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-36 rounded-xl bg-gray-100 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-sm font-medium">No brands found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filtered.map((brand, i) => (
              <motion.div
                key={brand._id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <Link
                  to={`/brand/${brand.slug || brand.name.toLowerCase().replace(/\s+/g, '-')}`}
                  className="group block bg-white rounded-xl border border-slate-200/70 overflow-hidden hover:-translate-y-1 hover:shadow-lg hover:border-[#189D91]/20 transition-all duration-300"
                >
                  <div className="h-24 bg-slate-50 flex items-center justify-center overflow-hidden border-b border-slate-100">
                    <img
                      src={brand.logo}
                      alt={brand.name}
                      className="h-full w-full object-cover mix-blend-multiply group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="px-3 py-2.5 text-center">
                    <p className="text-[11px] font-bold text-slate-900 truncate">{brand.name}</p>
                    {brand.offer && (
                      <p className="text-[10px] text-[#189D91] font-medium truncate mt-0.5">{brand.offer}</p>
                    )}
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BrandsPage;
