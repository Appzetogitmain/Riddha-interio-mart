import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FiHeart, FiShoppingCart, FiTrash2 } from 'react-icons/fi';
import { useWishlist } from '../data/WishlistContext';
import { useCart } from '../data/CartContext';
import { useUser } from '../data/UserContext';
import ProductCard from '../components/ProductCard';

const WishlistPage = () => {
  const { wishlistItems, loading, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { isLoggedIn } = useUser();

  if (!isLoggedIn) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mb-6">
          <FiHeart size={32} />
        </div>
        <h2 className="text-2xl font-bold text-deep-espresso mb-2">Please Login</h2>
        <p className="text-gray-500 mb-8">You need to be logged in to view your wishlist.</p>
        <Link to="/login" className="px-8 py-3 bg-[#189D91] text-white rounded-xl font-bold uppercase tracking-widest hover:bg-[#15877c] transition-colors">
          Login Now
        </Link>
      </div>
    );
  }

  if (loading && wishlistItems.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-gray-200 border-t-[#189D91] rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12 py-8 md:py-12">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-[#E91E8B]/10 rounded-2xl flex items-center justify-center text-[#E91E8B]">
          <FiHeart size={24} className="fill-[#E91E8B]" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-deep-espresso tracking-tight">My Wishlist</h1>
          <p className="text-sm text-gray-500 font-medium mt-1">{wishlistItems.length} items saved</p>
        </div>
      </div>

      {wishlistItems.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-soft-oatmeal/20 shadow-sm flex flex-col items-center">
          <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mb-6">
            <FiHeart size={40} />
          </div>
          <h2 className="text-2xl font-bold text-deep-espresso mb-3">Your wishlist is empty</h2>
          <p className="text-gray-500 mb-8 max-w-sm mx-auto">Explore our collection and click the heart icon to save your favorite products.</p>
          <Link to="/products" className="px-8 py-3 bg-[#189D91] text-white rounded-xl font-bold uppercase tracking-widest hover:bg-[#15877c] transition-colors shadow-lg shadow-[#189D91]/20">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
          {wishlistItems.map((product) => (
            <motion.div 
              key={product._id || product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative group"
            >
              <ProductCard product={product} />
              
              {/* Optional overlay remove button in addition to the heart toggle */}
              <button 
                onClick={() => removeFromWishlist(product._id || product.id)}
                className="absolute top-2 left-2 md:top-3 md:left-3 z-20 w-8 h-8 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 shadow-md opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 active:scale-90"
              >
                <FiTrash2 size={14} />
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WishlistPage;
