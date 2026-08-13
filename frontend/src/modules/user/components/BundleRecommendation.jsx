import React, { useEffect, useState } from 'react';
import { Sparkles, Layers, Check, ShoppingBag, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../../shared/utils/api';

const BundleRecommendation = ({ roomType = 'Living Room', defaultStyle = 'Modern' }) => {
  const [bundles, setBundles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBundles();
  }, [roomType, defaultStyle]);

  const fetchBundles = async () => {
    try {
      setLoading(true);
      const res = await api.get('/recommendations/bundles', {
        params: { roomType, style: defaultStyle }
      });
      setBundles(res.data?.data?.bundles || []);
    } catch (err) {
      setBundles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBuyBundle = (bundle) => {
    toast.success(`1-Click Added "${bundle.name}" (${bundle.itemCount} items) to your Cart!`);
  };

  if (loading) {
    return (
      <div className="py-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-96 bg-gray-100 rounded-3xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (bundles.length === 0) return null;

  return (
    <section className="py-10 bg-linear-to-br from-emerald-950 via-gray-900 to-emerald-900 text-white rounded-3xl p-6 sm:p-10 my-8 shadow-2xl relative overflow-hidden">
      {/* Background Blur Accents */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8 relative z-10">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-xs font-semibold mb-2 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Designer Bundles</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Complete {roomType} Room Sets
          </h2>
          <p className="text-xs sm:text-sm text-gray-300 mt-1">
            Curated item bundles designed to transform your entire space with 1-click pricing savings.
          </p>
        </div>
      </div>

      {/* Bundles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
        {bundles.map((bundle, index) => (
          <div
            key={index}
            className={`bg-white/10 backdrop-blur-xl border p-6 rounded-3xl flex flex-col justify-between transition-all hover:-translate-y-1 ${
              index === 1
                ? 'border-emerald-400 shadow-xl bg-white/15'
                : 'border-white/10 hover:border-white/20'
            }`}
          >
            <div>
              {/* Badge */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300 bg-emerald-500/20 px-2.5 py-1 rounded-full">
                  {bundle.itemCount} Items Set
                </span>
                {bundle.savings && (
                  <span className="text-[11px] font-bold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-md">
                    {bundle.savings}
                  </span>
                )}
              </div>

              <h3 className="text-xl font-extrabold text-white">{bundle.name}</h3>
              <p className="text-xs text-gray-300 mt-1 line-clamp-2">{bundle.description}</p>

              <div className="my-5 pt-4 border-t border-white/10">
                <span className="text-xs text-gray-400 block mb-2 font-semibold">Included Items:</span>
                <div className="space-y-2">
                  {(bundle.items || []).map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-gray-200">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div>
              {bundle.stylingTip && (
                <p className="text-[11px] italic text-emerald-200 bg-emerald-950/40 p-2.5 rounded-xl mb-4 border border-emerald-500/20">
                  <span className="font-bold">Designer Tip:</span> {bundle.stylingTip}
                </p>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                <div>
                  <span className="text-xs text-gray-400 block">Total Bundle Price</span>
                  <span className="text-xl font-black text-white">₹{bundle.totalCost?.toLocaleString()}</span>
                </div>
                <button
                  onClick={() => handleBuyBundle(bundle)}
                  className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-gray-950 text-xs font-extrabold rounded-xl shadow-lg flex items-center gap-1.5 transition-all active:scale-95"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>1-Click Bundle</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default BundleRecommendation;
