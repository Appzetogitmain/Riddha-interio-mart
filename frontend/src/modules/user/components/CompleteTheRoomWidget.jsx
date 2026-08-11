import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiHome, FiShoppingCart, FiCheck } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../../shared/utils/api';
import { useCart } from '../data/CartContext';

// "Complete the Room" — given a starting product, suggests the other category
// groups (flooring, furniture, lighting, decor, ...) typically needed to finish
// furnishing the same room.
const CompleteTheRoomWidget = ({ productId }) => {
  const { addToCart } = useCart();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [addingAll, setAddingAll] = useState(false);

  useEffect(() => {
    if (!productId) return;
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        const res = await api.get('/rooms/complete-suggestions', { params: { productId } });
        if (!cancelled) setData(res.data?.data?.roomCompletion || null);
      } catch (err) {
        if (!cancelled) setData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [productId]);

  if (loading) {
    return <div className="mt-8 h-40 bg-gray-100 rounded-xl animate-pulse mx-5 md:mx-0" />;
  }

  const categories = (data?.categories || []).filter((c) => c.items.length > 0);
  if (categories.length === 0) return null;

  const handleAddEssentials = async () => {
    setAddingAll(true);
    try {
      for (const cat of categories) {
        const cheapest = [...cat.items].sort((a, b) => a.price - b.price)[0];
        if (cheapest) await addToCart(cheapest, 1);
      }
      toast.success('Added one essential item from each category to your cart');
    } finally {
      setAddingAll(false);
    }
  };

  return (
    <section className="mt-8 px-5 md:px-0">
      <div className="bg-gradient-to-br from-[#189D91]/5 to-transparent border border-[#189D91]/15 rounded-2xl p-4 md:p-6">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[#189D91]/10 text-[#189D91] flex items-center justify-center">
              <FiHome size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Complete the {data.roomType}</h2>
              <p className="text-[11px] text-gray-400 font-medium">
                Estimated ₹{data.estimateLow.toLocaleString('en-IN')} – ₹{data.estimateHigh.toLocaleString('en-IN')} to finish the look
              </p>
            </div>
          </div>
          <button
            onClick={handleAddEssentials}
            disabled={addingAll}
            className="flex items-center gap-2 h-10 px-4 bg-[#189D91] hover:bg-[#14847a] disabled:opacity-60 text-white font-bold text-[11px] uppercase tracking-wider rounded-lg transition-colors"
          >
            {addingAll ? <FiCheck size={14} /> : <FiShoppingCart size={14} />}
            Add Essentials to Cart
          </button>
        </div>

        <div className="space-y-5">
          {categories.map((cat) => (
            <div key={cat.name}>
              <h3 className="text-[11px] font-black text-gray-500 uppercase tracking-widest mb-2">{cat.name}</h3>
              <div className="overflow-x-auto no-scrollbar -mx-1 px-1">
                <div className="flex gap-3 pb-1">
                  {cat.items.map((item) => (
                    <Link
                      key={item.id}
                      to={`/products/${item.id}`}
                      className="w-32 shrink-0 bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="w-full h-24 bg-gray-50">
                        {item.image && <img src={item.image} alt={item.name} className="w-full h-full object-cover" />}
                      </div>
                      <div className="p-2">
                        <p className="text-[11px] font-semibold text-gray-800 line-clamp-2 leading-snug">{item.name}</p>
                        <p className="text-[12px] font-black text-gray-900 mt-1">₹{item.price.toLocaleString('en-IN')}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CompleteTheRoomWidget;
