import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from './ProductCard';
import api from '../../../shared/utils/api';

// AI-based product recommendations for a product detail page: similar items,
// cross-sell pairings, upsell (premium) options, or a blended mix of these.
const RecommendationCarousel = ({ productId, type = 'blended', title, limit = 6 }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!productId) return;
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        const res = await api.get('/recommendations/products', {
          params: { productId, type, limit }
        });
        if (!cancelled) {
          setItems(res.data?.data?.recommendations || []);
        }
      } catch (err) {
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [productId, type, limit]);

  const trackClick = (targetId) => {
    api.post('/recommendations/events', {
      productId,
      targetProductId: targetId,
      recommendationType: type === 'similar' || type === 'cross-sell' || type === 'upsell' ? type : 'blended',
      action: 'click'
    }).catch(() => {});
  };

  if (!loading && items.length === 0) return null;

  return (
    <section className="mt-8">
      <div className="flex items-center justify-between mb-4 px-5 md:px-0">
        <h2 className="text-base font-bold text-gray-900">{title}</h2>
      </div>
      <div className="overflow-x-auto no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
        <div className="flex md:grid md:grid-cols-4 gap-3 pb-2">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="w-[150px] md:w-auto shrink-0 h-56 bg-gray-100 rounded-xl animate-pulse" />
              ))
            : items.map((item, i) => (
                <div key={item.id} className="w-[150px] md:w-auto shrink-0" onClickCapture={() => trackClick(item.id)}>
                  <Link to={`/products/${item.id}`} className="block text-[10px] font-semibold text-[#189D91] px-0.5 mb-1 truncate">
                    {item.reason}
                  </Link>
                  <ProductCard product={item} index={i} variant="minimal" />
                </div>
              ))}
        </div>
      </div>
    </section>
  );
};

export default RecommendationCarousel;
