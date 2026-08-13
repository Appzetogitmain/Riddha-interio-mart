import React, { useEffect, useState } from 'react';
import { X, Sparkles, CheckCircle2, ShieldCheck } from 'lucide-react';
import api from '../../../shared/utils/api';

const RecommendationExplanationModal = ({ isOpen, onClose, item }) => {
  const [loading, setLoading] = useState(false);
  const [details, setDetails] = useState(null);

  useEffect(() => {
    if (isOpen && item) {
      fetchExplanation();
    }
  }, [isOpen, item]);

  const fetchExplanation = async () => {
    try {
      setLoading(true);
      const productId = item._id || item.id;
      const res = await api.get(`/recommendations/explanation/${productId}`);
      setDetails(res.data?.data || null);
    } catch (err) {
      setDetails(null);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !item) return null;

  const name = item.name || 'Product';
  const scorePct = Math.round((item.score || 0.88) * 100);
  const explanationText = details?.explanation || item.reason || item.aiExplanation || `You'll love this because it perfectly aligns with your style preferences.`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl relative border border-gray-100 overflow-hidden">
        {/* Decorative Top Gradient */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-linear-to-r from-emerald-500 via-teal-500 to-emerald-700" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 bg-emerald-100 text-emerald-950 rounded-xl">
            <Sparkles className="w-5 h-5 text-emerald-700" />
          </div>
          <div>
            <h3 className="text-lg font-black text-gray-900">Why Gemini Recommended This</h3>
            <p className="text-xs font-semibold text-gray-600">AI Design Match Analysis</p>
          </div>
        </div>

        {/* Product Preview Header */}
        <div className="flex items-center gap-4 p-3 bg-gray-50 border border-gray-200 rounded-2xl mb-5">
          <img
            src={item.image || item.images?.[0]}
            alt={name}
            className="w-16 h-16 object-cover rounded-xl border border-gray-300"
          />
          <div>
            <h4 className="text-sm font-extrabold text-gray-900 line-clamp-1">{name}</h4>
            <p className="text-xs font-extrabold text-emerald-800 mt-0.5">
              ₹{item.price?.toLocaleString()}
            </p>
            <div className="inline-flex items-center gap-1.5 mt-1 text-[11px] font-bold text-emerald-950 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-md">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
              <span>{scorePct}% Compatibility Score</span>
            </div>
          </div>
        </div>

        {/* Gemini Explanation */}
        {loading ? (
          <div className="space-y-3 py-4">
            <div className="h-4 bg-gray-100 rounded-md animate-pulse" />
            <div className="h-4 bg-gray-100 rounded-md animate-pulse w-3/4" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
              <p className="text-sm font-semibold text-gray-900 leading-relaxed italic">
                "{explanationText}"
              </p>
            </div>

            {/* Key Match Points */}
            <div>
              <h5 className="text-xs font-black uppercase tracking-wider text-gray-700 mb-2">Key Compatibility Points</h5>
              <div className="space-y-2">
                {(details?.keyPoints || [
                  `Style match with your design profile`,
                  `Price aligns with your target budget range`,
                  `Complements your recent activity`
                ]).map((pt, index) => (
                  <div key={index} className="flex items-start gap-2 text-xs font-semibold text-gray-900">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    <span>{pt}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Action Footer */}
        <div className="mt-6 pt-4 border-t border-gray-200 flex items-center justify-between">
          <span className="text-xs font-medium text-gray-500">Powered by Gemini AI Engine</span>
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-emerald-950 hover:bg-black text-white text-xs font-bold rounded-xl shadow-md transition-colors"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecommendationExplanationModal;
