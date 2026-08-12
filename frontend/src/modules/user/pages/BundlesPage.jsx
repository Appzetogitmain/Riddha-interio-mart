import React, { useEffect, useState } from 'react';
import { FiZap } from 'react-icons/fi';
import api from '../../../shared/utils/api';
import BundleCard from '../components/BundleCard';

const BundlesPage = () => {
  const [bundles, setBundles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await api.get('/bundles', { params: { limit: 50 } });
        setBundles(res.data?.data || []);
      } catch (err) {
        console.error('Failed to load bundles', err);
      } finally {
        setLoading(false);
      }
    };
    load();
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="max-w-[1200px] mx-auto px-4 md:px-6 pb-16 pt-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-[#189D91]/10 text-[#189D91] flex items-center justify-center">
          <FiZap size={20} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Smart Bundles</h1>
          <p className="text-[12px] text-gray-400 font-medium">Curated product sets at a bundled discount</p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-64 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : bundles.length === 0 ? (
        <div className="py-24 text-center text-gray-400 text-sm">No smart bundles available right now. Check back soon.</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {bundles.map((bundle) => (
            <BundleCard key={bundle._id} bundle={bundle} />
          ))}
        </div>
      )}
    </div>
  );
};

export default BundlesPage;
