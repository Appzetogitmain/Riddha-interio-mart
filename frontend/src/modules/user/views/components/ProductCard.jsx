import React from 'react';
import { Link } from 'react-router-dom';
import { FiShoppingCart, FiHeart } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { useCart } from '../../models/CartContext';
import Button from '../../../../views/shared/Button';
import ProductImage from '../../../../shared/components/ProductImage';

const ProductCard = ({ product, index = 0, variant = 'grid' }) => {
  const { addToCart, getItemQuantity, updateQuantity } = useCart();
  const quantity = getItemQuantity(product.id);
  const isList = variant === 'list';
  const isMinimal = variant === 'minimal';
  const discountPercent = product.originalPrice > product.price 
    ? Math.round((1 - product.price / product.originalPrice) * 100) 
    : 0;

  return (
    <div 
      className={`group bg-white ${isMinimal ? 'rounded-xl' : 'rounded-2xl md:rounded-3xl border border-soft-oatmeal/20'} shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden ${
        isList ? 'flex flex-row md:flex-col h-[135px] md:h-auto' : 'flex flex-col'
      }`}
    >
      <Link 
        to={`/products/${product.id}`} 
        className={`relative block overflow-hidden shrink-0 ${
          isList ? 'w-[40%] md:w-full h-full md:h-80 border-r md:border-r-0' : (isMinimal ? 'aspect-square w-full' : 'h-30 md:h-80 w-full')
        } ${!isMinimal ? 'border-soft-oatmeal/10' : ''}`}
      >
        <ProductImage
          src={product.image}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        
        {/* Quick Action Icons - Desktop only for grid/list, always for minimal bottom-right */}
        <div className={`${isMinimal ? 'absolute bottom-2 right-2' : 'hidden md:flex absolute top-5 right-5 scale-90'} transform group-hover:translate-x-0 transition-all duration-400`}>
          <button className={`${isMinimal ? 'h-8 w-8 text-deep-espresso/40 shadow-md' : 'h-11 w-11 text-deep-espresso shadow-xl'} bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center hover:text-[#189D91] transition-all`}>
            <FiHeart className={`${isMinimal ? 'h-4 w-4' : 'h-5 w-5'}`} />
          </button>
        </div>

        {/* Badges - Show Top Choice on grid view only */}
        {!isList && !isMinimal && (
           <div className="absolute top-2 left-2 md:top-3 md:left-3 flex gap-2">
             <span className="bg-golden-glow/90 backdrop-blur-md text-deep-espresso text-[9px] md:text-[10px] font-bold px-2 md:px-3 py-1 rounded-full uppercase tracking-tighter shadow-sm">
               Top Choice
             </span>
           </div>
        )}
      </Link>

      <div className={`flex-1 ${isMinimal ? 'p-2 pt-2.5' : (isList ? 'p-3 md:p-7' : 'p-2.5 md:p-7')} flex flex-col justify-between overflow-hidden ${!isList && !isMinimal ? 'space-y-1 md:space-y-5' : 'space-y-0.5'}`}>
        <div className="space-y-0.5">
          <Link to={`/products/${product.id}`}>
            <h3 className={`${isMinimal ? 'text-[11px] font-bold' : (isList ? 'text-[13px] md:text-xl' : 'text-[10px] md:text-xl')} font-display text-deep-espresso line-clamp-1 leading-tight group-hover:text-warm-sand transition-colors duration-300`}>
              {product.name}
            </h3>
          </Link>
          
          <h4 className={`${isMinimal ? 'text-[9px] font-medium text-deep-espresso/40 opacity-80' : 'text-[8px] md:text-[10px] tracking-[0.15em] text-warm-sand font-black'}`}>
            {isMinimal ? `By ${product.brand || 'Riddha Interio'}` : product.category}
          </h4>
        </div>
 
        <div className={`flex ${isList ? 'flex-row items-end' : (isMinimal ? 'flex-col items-start pt-1' : 'items-center')} justify-between gap-1 md:gap-2 md:pt-4`}>
          <div className="flex flex-col w-auto grow">
            <div className={`flex items-baseline gap-1.5 ${isMinimal ? 'flex-wrap' : ''}`}>
              <span className={`${isMinimal ? 'text-[12px]' : (isList ? 'text-[13px] md:text-2xl' : 'text-[11px] md:text-2xl')} font-black text-black tracking-tight`}>
                ₹{product.price}
              </span>
              {product.originalPrice > product.price && (
                <div className="flex items-center gap-1.5">
                  <span className={`${isMinimal ? 'text-[10px]' : 'text-[10px] md:text-xs'} text-gray-400 line-through font-medium`}>
                    ₹{product.originalPrice}
                  </span>
                  {isMinimal && (
                    <span className="text-[10px] font-bold text-green-600">
                      {discountPercent}%
                    </span>
                  )}
                </div>
              )}
            </div>
            {!isMinimal && (
              <div className="flex items-center gap-2 md:mt-1">
                <span className="text-[8px] md:text-[10px] text-deep-espresso/30 font-bold uppercase tracking-widest leading-none">
                  Incl. GST
                </span>
              </div>
            )}
          </div>

          {!isMinimal && (
            <div className={`flex items-center ${isList ? 'justify-between md:justify-end' : 'justify-end'} gap-3 mt-1 md:mt-0`}>
               {quantity > 0 ? (
                 <div className="flex items-center bg-soft-oatmeal/10 border border-soft-oatmeal/20 rounded-lg md:rounded-2xl overflow-hidden h-8 md:h-12 shadow-inner">
                   <button 
                     onClick={(e) => { e.preventDefault(); updateQuantity(product.id, quantity - 1); }}
                     className="px-1.5 min-[360px]:px-2 md:px-4 h-full hover:bg-soft-oatmeal/20 text-deep-espresso transition-colors text-xs md:text-xl font-bold"
                   >
                     −
                   </button>
                   <span className="px-1.5 min-[360px]:px-2 text-[9px] md:text-sm font-black text-deep-espresso w-5 min-[360px]:w-6 md:w-10 text-center">
                     {quantity}
                   </span>
                   <button 
                     onClick={(e) => { e.preventDefault(); updateQuantity(product.id, quantity + 1); }}
                     className="px-1.5 min-[360px]:px-2 md:px-4 h-full hover:bg-soft-oatmeal/20 text-deep-espresso transition-colors text-xs md:text-xl font-bold"
                   >
                     +
                   </button>
                 </div>
               ) : (
                 <button 
                   onClick={(e) => { e.preventDefault(); addToCart(product); }}
                   className="h-8 md:h-12 px-4 min-[360px]:px-6 md:px-8 bg-[var(--color-header-red)] text-white rounded-lg md:rounded-2xl font-bold text-[9px] md:text-sm hover:bg-black transition-colors shadow-lg active:scale-95"
                 >
                   Add
                 </button>
               )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
