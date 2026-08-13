import React, { useEffect, useState } from 'react';
import { Sparkles, Layers, ArrowUpRight, CheckCircle, Package } from 'lucide-react';
import RecommendationCard from './RecommendationCard';
import RecommendationExplanationModal from './RecommendationExplanationModal';
import api from '../../../shared/utils/api';

const ProductRecommendations = ({ productId }) => {
  const [activeTab, setActiveTab] = useState('blended'); // blended, similar, cross-sell, upsell
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [crossSellData, setCrossSellData] = useState(null);
  const [upsellData, setUpsellData] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (!productId) return;
    fetchProductRecommendations();
  }, [productId, activeTab]);

  const fetchProductRecommendations = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/recommendations/for-product/${productId}`, {
        params: { limit: 8, type: activeTab }
      });
      setItems(res.data?.data?.recommendations || []);
    } catch (err) {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleExplain = (item) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  return (
    <section className="mt-12 pt-8 border-t border-gray-100">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Smart Recommendations</span>
          </div>
          <h3 className="text-xl font-bold text-gray-900">Customers Also Explored & Paired</h3>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {[
            { id: 'blended', label: 'All Picks' },
            { id: 'similar', label: 'Similar Items' },
            { id: 'cross-sell', label: 'Complete Room (Cross-sell)' },
            { id: 'upsell', label: 'Premium Upgrades (Upsell)' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-emerald-900 text-emerald-300 shadow-2xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Recommended Products */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-64 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="p-8 text-center bg-gray-50 rounded-2xl">
          <Package className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-xs text-gray-500">No additional product pairing suggestions found for this item.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map(item => (
            <RecommendationCard
              key={item.id || item._id}
              item={item}
              onExplain={handleExplain}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      <RecommendationExplanationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        item={selectedItem}
      />
    </section>
  );
};

export default ProductRecommendations;
