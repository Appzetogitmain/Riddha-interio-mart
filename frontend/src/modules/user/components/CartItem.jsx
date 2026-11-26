import React from 'react';
import { FiTrash2, FiPlus, FiMinus } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { useCart } from '../data/CartContext';
import ProductImage from '../../../shared/components/ProductImage';

const CartItem = ({ item }) => {
  const { updateQuantity, removeFromCart } = useCart();

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100, transition: { duration: 0.3 } }}
      className="flex flex-col sm:flex-row items-center gap-6 p-6 sm:p-8 bg-white border border-soft-oatmeal/10 rounded-[2rem] shadow-sm hover:shadow-xl transition-all duration-300"
    >
      {/* Product Image */}
      <div className="h-32 w-32 flex-shrink-0 overflow-hidden rounded-3xl border border-soft-oatmeal/20 shadow-inner bg-soft-oatmeal/10">
        <ProductImage
          src={item.image}
          alt={item.name}
          className="h-full w-full object-cover"
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 text-center sm:text-left space-y-1">
        <h4 className="text-[10px] uppercase tracking-[0.2em] text-warm-sand font-black">
          {item.category}
        </h4>
        <h3 className="text-2xl font-display font-bold text-deep-espresso truncate">
          {item.name}
        </h3>
        <p className="text-warm-sand font-bold text-xl">
          ₹{item.price}
        </p>
      </div>

      {/* Quantity Controls */}
      <div className="flex items-center bg-soft-oatmeal/10 rounded-full px-4 py-2 border border-soft-oatmeal/20">
        <motion.button 
          whileTap={{ scale: 0.8 }}
          onClick={() => updateQuantity(item.id, item.quantity - 1)}
          className="p-2 text-deep-espresso hover:text-warm-sand transition-colors"
          disabled={item.quantity <= 1}
        >
          <FiMinus className="h-4 w-4" />
        </motion.button>
        <span className="w-10 text-center font-bold text-deep-espresso text-lg">{item.quantity}</span>
        <motion.button 
          whileTap={{ scale: 0.8 }}
          onClick={() => updateQuantity(item.id, item.quantity + 1)}
          className="p-2 text-deep-espresso hover:text-warm-sand transition-colors"
        >
          <FiPlus className="h-4 w-4" />
        </motion.button>
      </div>

      {/* Remove */}
      <motion.button 
        whileHover={{ scale: 1.1, backgroundColor: '#FEF2F2' }}
        whileTap={{ scale: 0.9 }}
        onClick={() => removeFromCart(item.id)}
        className="p-4 text-gray-300 hover:text-red-500 rounded-2xl transition-all"
        title="Remove item"
      >
        <FiTrash2 className="h-6 w-6" />
      </motion.button>
    </motion.div>
  );
};

export default CartItem;
