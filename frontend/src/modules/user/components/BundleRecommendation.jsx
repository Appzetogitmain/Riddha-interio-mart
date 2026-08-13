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
            className={`bg-white/15 backdrop-blur-xl border p-6 rounded-3xl flex flex-col justify-between transition-all hover:-translate-y-1 shadow-lg ${
              index === 1
                ? 'border-emerald-400/80 shadow-2xl bg-white/20'
                : 'border-white/20 hover:border-white/40'
            }`}
          >
            <div>
              {/* Badge */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-200 bg-emerald-950/80 border border-emerald-500/40 px-3 py-1 rounded-full">
                  {bundle.itemCount} Items Set
                </span>
                {bundle.savings && (
                  <span className="text-[11px] font-black text-amber-200 bg-amber-950/80 border border-amber-400/40 px-2.5 py-1 rounded-md">
                    {bundle.savings}
                  </span>
                )}
              </div>

              <h3 className="text-xl font-black text-white">{bundle.name}</h3>
              <p className="text-xs font-medium text-gray-200 mt-1 line-clamp-2">{bundle.description}</p>

              <div className="my-5 pt-4 border-t border-white/15">
                <span className="text-xs text-gray-300 block mb-2.5 font-bold uppercase tracking-wider">Included Items:</span>
                <div className="space-y-2">
                  {(bundle.items || []).map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs font-semibold text-white">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div>
              {bundle.stylingTip && (
                <p className="text-xs font-medium text-emerald-100 bg-emerald-950/70 p-3 rounded-xl mb-4 border border-emerald-400/30">
                  <span className="font-bold text-white">Designer Tip:</span> {bundle.stylingTip}
                </p>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-white/15">
                <div>
                  <span className="text-xs text-gray-300 font-medium block">Total Bundle Price</span>
                  <span className="text-xl font-black text-white">₹{bundle.totalCost?.toLocaleString()}</span>
                </div>
                <button
                  onClick={() => handleBuyBundle(bundle)}
                  className="px-4 py-2.5 bg-emerald-400 hover:bg-emerald-300 text-gray-950 text-xs font-black rounded-xl shadow-lg flex items-center gap-1.5 transition-all active:scale-95"
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
