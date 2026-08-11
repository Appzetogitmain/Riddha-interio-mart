import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiShoppingCart, FiCheck, FiPackage } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useCart } from '../data/CartContext';

const BundleCard = ({ bundle }) => {
  const { addToCart } = useCart();
  const [adding, setAdding] = useState(false);

  const virtualProductId = bundle.virtualProduct?._id || bundle.virtualProduct;
  const coverImage = bundle.image || bundle.products?.[0]?.product?.images?.[0];

  const handleAdd = async (e) => {
    e.preventDefault();
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
    <Link
      to={`/bundles/${bundle._id}`}
      className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all overflow-hidden flex flex-col"
    >
      <div className="relative w-full aspect-[4/3] bg-gray-50">
        {coverImage ? (
          <img src={coverImage} alt={bundle.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <FiPackage size={32} />
          </div>
        )}
        {bundle.discountPercentage > 0 && (
          <span className="absolute top-3 left-3 bg-[#B71C1C] text-white text-[10px] font-black px-2.5 py-1 rounded-lg shadow-sm">
            {Math.round(bundle.discountPercentage)}% OFF
          </span>
        )}
      </div>

      <div className="p-4 flex-1 flex flex-col">
        <h3 className="text-sm font-bold text-gray-900 leading-snug line-clamp-2">{bundle.name}</h3>
        <p className="text-[11px] text-gray-400 font-medium mt-1">{bundle.products?.length || 0} products in this bundle</p>

        <div className="flex items-baseline gap-2 mt-3">
          <span className="text-lg font-black text-gray-900">₹{Number(bundle.bundlePrice).toLocaleString('en-IN')}</span>
          {bundle.originalPrice > bundle.bundlePrice && (
            <span className="text-xs text-gray-300 line-through">₹{Number(bundle.originalPrice).toLocaleString('en-IN')}</span>
          )}
        </div>

        <button
          onClick={handleAdd}
          disabled={adding}
          className="mt-4 w-full h-10 bg-[#189D91] hover:bg-[#14847a] disabled:opacity-60 text-white font-bold text-[11px] uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {adding ? <FiCheck size={14} /> : <FiShoppingCart size={14} />}
          Add Bundle to Cart
        </button>
      </div>
    </Link>
  );
};

export default BundleCard;
