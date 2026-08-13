import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Heart, ShoppingBag, Star, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../../shared/utils/api';

const RecommendationCard = ({ item, onExplain, onTrack }) => {
  const [isWishlisted, setIsWishlisted] = useState(false);

  const productId = item._id || item.id;
  const name = item.name || 'Featured Product';
  const price = item.price || 0;
  const discountPrice = item.discountPrice;
  const image = item.image || item.images?.[0] || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500&auto=format&fit=crop&q=60';
  const rating = item.averageRating || 4.5;
  const reviews = item.totalReviews || 12;
  const reason = item.reason || item.aiExplanation || 'Recommended for your style';
  const category = item.category || 'Interior';

  const handleCardClick = () => {
    if (onTrack) onTrack(productId, 'click');
    api.post('/recommendations/track', { productId, action: 'click', context: 'homepage' }).catch(() => {});
  };

  const handleWishlist = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setIsWishlisted(!isWishlisted);
    toast.success(!isWishlisted ? 'Saved to Wishlist' : 'Removed from Wishlist');
    api.post('/recommendations/track', { productId, action: 'wishlist', context: 'card' }).catch(() => {});
  };

  const handleAddToCart = (e) => {
    e.stopPropagation();
    e.preventDefault();
    toast.success(`Added ${name} to Cart!`);
    api.post('/recommendations/track', { productId, action: 'cart', context: 'card' }).catch(() => {});
  };

  return (
    <div 
      onClick={handleCardClick}
      className="group relative bg-white border border-gray-100 rounded-2xl p-3 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between hover:-translate-y-1 cursor-pointer"
    >
      {/* AI Recommendation Badge */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 px-2.5 py-1 bg-emerald-900/90 backdrop-blur-md text-emerald-300 text-[11px] font-medium rounded-full shadow-sm">
        <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
        <span className="truncate max-w-[140px]">{reason}</span>
      </div>

      {/* Wishlist Button */}
      <button
        onClick={handleWishlist}
        className="absolute top-4 right-4 z-10 p-2 bg-white/80 hover:bg-white backdrop-blur-md rounded-full shadow-sm transition-transform active:scale-95"
      >
        <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
      </button>

      {/* Product Image */}
      <div className="relative w-full h-48 rounded-xl overflow-hidden bg-gray-50 mb-3">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {onExplain && (
          <button
            onClick={(e) => { e.stopPropagation(); onExplain(item); }}
            className="absolute bottom-2 right-2 px-2 py-1 bg-black/60 hover:bg-black/80 backdrop-blur-xs text-white text-[10px] rounded-lg flex items-center gap-1 transition-opacity opacity-0 group-hover:opacity-100"
          >
            <Info className="w-3 h-3 text-emerald-400" />
            <span>Why Recommended?</span>
          </button>
        )}
      </div>

      {/* Card Info */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          <span className="text-[11px] uppercase tracking-wider text-emerald-700 font-semibold">{category}</span>
          <Link to={`/products/${productId}`} className="block font-medium text-gray-900 text-sm hover:text-emerald-700 line-clamp-1 mt-0.5">
            {name}
          </Link>
          
          <div className="flex items-center gap-1.5 mt-1.5">
            <div className="flex items-center text-amber-400">
              <Star className="w-3.5 h-3.5 fill-amber-400" />
              <span className="text-xs font-semibold text-gray-800 ml-1">{rating}</span>
            </div>
            <span className="text-xs text-gray-400">({reviews})</span>
          </div>
        </div>

        {/* Price & Cart */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
          <div>
            <span className="text-base font-bold text-gray-900">₹{price.toLocaleString()}</span>
            {discountPrice && (
              <span className="text-xs text-gray-400 line-through ml-1.5">₹{discountPrice.toLocaleString()}</span>
            )}
          </div>
          <button
            onClick={handleAddToCart}
            className="p-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl shadow-xs transition-colors flex items-center justify-center active:scale-95"
            title="Add to Cart"
          >
            <ShoppingBag className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecommendationCard;
