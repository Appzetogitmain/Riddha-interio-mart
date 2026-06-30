import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FiShoppingCart, FiMinus, FiPlus, FiHeart } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { useCart } from '../data/CartContext';
import { useWishlist } from '../data/WishlistContext';
import OptimizedImage from '../../../shared/components/OptimizedImage';
import Button from '../../../shared/components/Button';

/* ─── Reusable Sub-Components (Enhancement Overlays) ─── */

/** Wishlist heart toggle — uses global context with localStorage persistence */
const WishlistButton = ({ product }) => {
  const { toggleWishlist, isInWishlist } = useWishlist();
  const productId = product._id || product.id;
  const wishlisted = isInWishlist(productId);

  const toggle = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
  }, [product, toggleWishlist]);

  return (
    <button
      onClick={toggle}
      aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
      className="absolute top-3 right-3 md:top-4 md:right-4 z-10 w-8 h-8 md:w-9 md:h-9 rounded-full bg-white/80 backdrop-blur-md shadow-md flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-90"
    >
      <FiHeart
        className={`w-4 h-4 md:w-[18px] md:h-[18px] transition-colors duration-300 ${wishlisted ? 'text-red-500 fill-red-500' : 'text-gray-500'}`}
        fill={wishlisted ? 'currentColor' : 'none'}
      />
    </button>
  );
};

/** Trending badge — shows 🔥 for high-demand products */
const TrendingBadge = () => (
  <span className="absolute top-3 right-14 md:top-4 md:right-[60px] z-10 bg-orange-500/90 backdrop-blur-md text-white text-[8px] md:text-[10px] font-black px-2 py-0.5 md:px-2.5 md:py-1 rounded-lg uppercase tracking-wider shadow-sm flex items-center gap-1">
    🔥 Trending
  </span>
);

/** Discount percentage badge */
const DiscountBadge = ({ percent }) => (
  <span className="bg-[#E8F5E9]/90 backdrop-blur-md text-[#2E7D32] text-[9px] md:text-[11px] font-black px-2 py-0.5 md:px-2.5 md:py-1 rounded-lg shadow-sm ml-1.5">
    {percent}% OFF
  </span>
);

/** Stock status indicator — small inline green dot */
const StockIndicator = ({ stock }) => {
  // In this project, countInStock = 0 means "Unlimited" (always in stock)
  const isInStock = stock === 0 || stock > 0;
  if (!isInStock) return null;

  return (
    <span className="inline-flex items-center gap-1 text-[7px] md:text-[10px] font-bold text-[#2E7D32]">
      <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-[#4CAF50] inline-block animate-pulse" />
      In Stock • Fast Delivery
    </span>
  );
};

/* ─── Main ProductCard Component ─── */

const ProductCard = ({ product, index = 0, variant = 'grid' }) => {
  const { addToCart, getItemQuantity, updateQuantity } = useCart();
  const productId = product.id || product._id;
  const quantity = getItemQuantity(productId);
  const isList = variant === 'list';
  const isMinimal = variant === 'minimal';

  const originalPrice = Number(product.price || 0);

  // discountPrice is valid only if > 0, less than full price, and at least 50% of it
  const parsedDiscount = Number(product.discountPrice || 0);
  const validDiscount = parsedDiscount > 0 && parsedDiscount < originalPrice && parsedDiscount >= originalPrice * 0.5;
  let displayPrice = validDiscount ? parsedDiscount : originalPrice;

  const displayPriceString = displayPrice != null ? Number(displayPrice).toLocaleString() : '0';
  const originalPriceString = originalPrice != null ? Number(originalPrice).toLocaleString() : '0';
  const rawImage = product.image || (product.images && product.images.length > 0 ? product.images[0] : '');
  // Handle local file paths that won't work in browser
  const productImage = (rawImage && (rawImage.startsWith('C:') || rawImage.startsWith('/')))
    ? `https://images.unsplash.com/photo-1513519245088-0e12902e35ca?w=800&q=80` // Placeholder for interior
    : (rawImage || 'https://images.unsplash.com/photo-1513519245088-0e12902e35ca?w=800&q=80');

  const discountPercent = originalPrice > displayPrice
    ? Math.round((1 - displayPrice / originalPrice) * 100)
    : 0;

  // Derive "trending" from high discount or explicit flag
  const isTrending = product.isTrending === true || discountPercent >= 15;

  const getDeliveryEstimate = () => {
    const idString = String(productId || '');
    let charCodeSum = 0;
    for (let i = 0; i < idString.length; i++) {
      charCodeSum += idString.charCodeAt(i);
    }
    const daysToAdd = (charCodeSum % 3) + 1; // 1, 2, or 3 days
    
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + daysToAdd);
    
    if (daysToAdd === 1) {
      return 'Tomorrow';
    }
    
    return deliveryDate.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div
      className={`group bg-white ${isMinimal ? 'rounded-xl' : 'rounded-2xl md:rounded-3xl border border-soft-oatmeal/10'} shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden ${isList ? 'flex flex-row md:flex-col' : 'flex flex-col'
        }`}
    >
      <Link
        to={`/products/${productId}`}
        className={`relative block overflow-hidden shrink-0 bg-white ${isList ? 'w-[40%] md:w-full aspect-square md:aspect-auto md:h-40' : 'aspect-[4/3.2] md:aspect-video md:h-40 w-full'
          }`}
      >
        <OptimizedImage
          src={productImage}
          alt={product.name}
          className="h-full w-full object-contain md:object-cover object-center transition-transform duration-700 group-hover:scale-110"
        />


        {/* Top Choice Badge + Discount Badge (left cluster) */}
        <div className="absolute top-2 left-2 md:top-4 md:left-4 flex flex-col gap-2 z-10">
          {isList ? (
             discountPercent > 0 && (
               <div className="w-10 h-10 md:w-12 md:h-12 bg-[#B71C1C] rounded-full flex flex-col items-center justify-center text-white shadow-lg border-2 border-white/20">
                 <span className="text-[8px] md:text-[10px] font-black leading-none">{discountPercent}%</span>
                 <span className="text-[7px] md:text-[8px] font-bold uppercase">Off</span>
               </div>
             )
          ) : (
            <>
              <span className="bg-[#F0F9F8]/90 backdrop-blur-md text-[#189D91] text-[9px] md:text-[11px] font-bold px-2 py-1 md:px-3 md:py-1.5 rounded-lg uppercase tracking-wide shadow-sm">
                Top Choice
              </span>
              {discountPercent > 0 && <DiscountBadge percent={discountPercent} />}
            </>
          )}
        </div>

        {/* Wishlist Button (top-right) */}
        <WishlistButton product={product} />

        {/* Trending Badge (top-right, left of heart) — only in grid view; list view uses the red discount circle */}
        {isTrending && !isList && <TrendingBadge />}
      </Link>

      <div className={`flex-1 min-w-0 p-3 md:p-5 flex flex-col justify-between ${isList ? 'space-y-2 md:space-y-4' : 'space-y-1 md:space-y-2'}`}>
        <Link to={`/products/${productId}`} className="space-y-0 md:space-y-1 block hover:opacity-80 transition-opacity">
          <h3 className="text-[13px] md:text-lg font-display font-semibold text-black leading-tight line-clamp-1">
            {product.name}
          </h3>
          <h4 className="text-[9px] md:text-xs font-medium text-gray-400">
            {product.category}
          </h4>
          {isList && product.description && (
            <p className="text-[10px] md:text-[13px] text-gray-500 line-clamp-2 leading-snug mt-1">
              {product.description}
            </p>
          )}
        </Link>

        <div className="flex items-center justify-between gap-2 md:gap-4 min-w-0 pt-1 md:pt-2 mt-auto">
          <Link to={`/products/${productId}`} className="min-w-0 flex-1 flex flex-col hover:opacity-80 transition-opacity">
            <div className="flex flex-col md:flex-row md:items-baseline md:gap-2 min-w-0">
              <span className={`text-[16px] md:text-xl font-black tracking-tight whitespace-nowrap ${isList ? 'text-[#B71C1C]' : 'text-black'}`}>
                ₹{displayPriceString}
                {isList && <span className="ml-1 text-[9px] md:text-[11px] text-gray-400 font-medium">incl. GST</span>}
              </span>
              {originalPrice > displayPrice && (
                <span className="text-[10px] md:text-sm text-gray-300 line-through font-medium whitespace-nowrap mt-0.5 md:mt-0">
                  {isList && "MRP: "}₹{originalPriceString}
                </span>
              )}
              {isList && originalPrice > displayPrice && (
                <span className="hidden md:inline text-[11px] font-bold text-[#B71C1C] italic">({discountPercent}% off)</span>
              )}
            </div>
            {!isList && (
              <span className="text-[8px] md:text-[11px] text-gray-400 font-medium">
                Incl. GST {product.unitValue && product.unit && product.unit !== 'piece' && (
                  <span className="ml-1 text-[#189D91] font-bold">• {product.unitValue} {product.unit.toUpperCase()}</span>
                )}
              </span>
            )}
            
            {/* Express Delivery Badge (List View) */}
            {isList && (
              <span className="inline-flex items-center gap-1 mt-1.5 text-[9px] md:text-[10px] font-bold text-[#189D91]">
                <span className="text-[9px]">⚡</span>
                Fast Delivery
              </span>
            )}
            
            {/* Stock Status Indicator */}
            {!isList && <div className="mt-1"><StockIndicator stock={product.countInStock} /></div>}
          </Link>

          {quantity === 0 ? (
            <button
              onClick={(e) => { e.preventDefault(); addToCart(product); }}
              className="flex items-center gap-1.5 bg-[#189D91] hover:bg-[#14847a] text-white px-4 py-2 rounded-lg text-[11px] font-bold shadow-sm transition-all active:scale-95 whitespace-nowrap flex-shrink-0"
            >
              <FiShoppingCart className="w-3 h-3" />
              Add
            </button>
          ) : (
            <div className="flex items-center gap-0.5 bg-gray-50 rounded-lg border border-gray-200 flex-shrink-0">
              <button
                onClick={(e) => { e.preventDefault(); updateQuantity(productId, quantity - 1); }}
                className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-[#189D91] transition-colors active:scale-90 outline-none"
              >
                <FiMinus className="w-3 h-3" />
              </button>
              <span className="min-w-[20px] text-center text-[12px] font-bold text-gray-800">
                {quantity}
              </span>
              <button
                onClick={(e) => { e.preventDefault(); addToCart(product); }}
                className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-[#189D91] transition-colors active:scale-90 outline-none"
              >
                <FiPlus className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {/* Compact Delivery Estimate UI */}
        <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-1 text-[9px] md:text-[11px] text-slate-500">
          <span className="text-[#189D91] text-xs">🚚</span>
          <span>Delivery by: <span className="font-semibold text-slate-700">{getDeliveryEstimate()}</span></span>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;

