import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiShoppingCart, FiCheck, FiArrowLeft, FiPackage } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../../shared/utils/api';
import { useCart } from '../data/CartContext';

const BundleDetailPage = () => {
  const { id } = useParams();
  const { addToCart } = useCart();
  const [bundle, setBundle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/bundles/${id}`);
        setBundle(res.data?.data || null);
      } catch (err) {
        console.error('Failed to load bundle', err);
        setBundle(null);
      } finally {
        setLoading(false);
      }
    };
    load();
    window.scrollTo(0, 0);
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-[3px] border-[#189D91] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-400 font-medium">Loading bundle…</p>
      </div>
    );
  }

  if (!bundle) {
    return <div className="py-32 text-center text-gray-500 text-sm">Bundle not found.</div>;
  }

  const virtualProductId = bundle.virtualProduct?._id || bundle.virtualProduct;
  const coverImage = bundle.image || bundle.products?.[0]?.product?.images?.[0];

  const handleAdd = async () => {
    if (!virtualProductId) return;
    setAdding(true);
    try {
      await addToCart({
        _id: virtualProductId,
        name: `Bundle: ${bundle.name}`,
        price: bundle.bundlePrice,
        images: coverImage ? [coverImage] : []
      }, 1);
      toast.success('Bundle added to cart');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="max-w-[1000px] mx-auto px-4 md:px-6 pb-16 pt-4">
      <Link to="/bundles" className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-gray-500 hover:text-[#189D91] mb-4">
        <FiArrowLeft size={14} /> All Bundles
      </Link>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="w-full aspect-square bg-gray-50 rounded-2xl overflow-hidden border border-gray-100">
          {coverImage ? (
            <img src={coverImage} alt={bundle.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300"><FiPackage size={48} /></div>
          )}
        </div>

        <div>
          <h1 className="text-xl font-bold text-gray-900">{bundle.name}</h1>
          {bundle.description && <p className="text-sm text-gray-500 mt-2 leading-relaxed">{bundle.description}</p>}

          <div className="flex items-baseline gap-3 mt-4">
            <span className="text-2xl font-black text-gray-900">₹{Number(bundle.bundlePrice).toLocaleString('en-IN')}</span>
            {bundle.originalPrice > bundle.bundlePrice && (
              <>
                <span className="text-sm text-gray-300 line-through">₹{Number(bundle.originalPrice).toLocaleString('en-IN')}</span>
                <span className="text-[11px] font-black bg-pink-50 border border-pink-100 text-pink-600 px-2 py-0.5 rounded">
                  {Math.round(bundle.discountPercentage)}% OFF
                </span>
              </>
            )}
          </div>

          <button
            onClick={handleAdd}
            disabled={adding}
            className="mt-6 w-full h-12 bg-[#189D91] hover:bg-[#14847a] disabled:opacity-60 text-white font-bold text-[12px] uppercase tracking-wider rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {adding ? <FiCheck size={16} /> : <FiShoppingCart size={16} />}
            Add Bundle to Cart
          </button>

          <div className="mt-8">
            <h2 className="text-[11px] font-black text-gray-500 uppercase tracking-widest mb-3">What's included</h2>
            <div className="space-y-2">
              {bundle.products?.map((line) => (
                <div key={line._id || line.product?._id} className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="w-12 h-12 rounded-lg bg-white border border-gray-100 overflow-hidden shrink-0">
                    {line.product?.images?.[0] && (
                      <img src={line.product.images[0]} alt={line.product?.name} className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-semibold text-gray-800 truncate">{line.product?.name}</p>
                    <p className="text-[10px] text-gray-400">Qty {line.quantity} • ₹{Number(line.product?.price || 0).toLocaleString('en-IN')} each</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BundleDetailPage;
