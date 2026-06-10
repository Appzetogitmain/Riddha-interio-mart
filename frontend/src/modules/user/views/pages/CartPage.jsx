import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../../models/CartContext';
import { useUser } from '../../models/UserContext';
import CartItem from '../components/CartItem';
import { FiArrowRight, FiShoppingBag, FiInfo, FiTrash2 } from 'react-icons/fi';
import Button from '../../../../views/shared/Button';

const CartPage = () => {
  const { cart, cartTotal, clearCart, updateQuantity, removeFromCart, pricingBreakdown } = useCart();
  const { isLoggedIn, address, user } = useUser();
  const navigate = useNavigate();
  // We'll use the address pincode if available, otherwise default
  const displayPincode = address ? address.pincode : '560001';

  // Secure backend price mapping
  const mrpValue = pricingBreakdown?.subtotal || 0;
  const discountOnMRP = pricingBreakdown?.discountAmount || 0;
  const deliveryCharges = pricingBreakdown?.shippingPrice || 0;
  const gstAmount = pricingBreakdown?.taxAmount || 0;
  const totalPrice = pricingBreakdown?.totalPrice || 0;

  const handleAction = () => {
    if (!isLoggedIn) {
      navigate('/login');
    } else if (!address) {
      navigate('/address');
    } else {
      navigate('/payment');
    }
  };

  const getButtonText = () => {
    if (!isLoggedIn) return 'LOGIN TO PROCEED';
    if (!address) return 'ADD ADDRESS';
    return 'PROCEED TO PAY';
  };

  if (cart.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-10 md:py-40 text-center"
      >
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-8 md:mb-12 flex justify-center"
        >
          <div className="h-20 w-20 md:h-32 md:w-32 bg-soft-oatmeal/10 rounded-full flex items-center justify-center border-2 border-dashed border-soft-oatmeal/30">
            <FiShoppingBag className="h-8 w-8 md:h-12 md:w-12 text-gray-300" />
          </div>
        </motion.div>
        <h1 className="text-3xl md:text-5xl font-bold mb-4 md:mb-6 tracking-tight">Your sanctuary awaits</h1>
        <p className="text-deep-espresso/30 text-sm md:text-xl font-medium mb-8 md:mb-12 max-w-lg mx-auto leading-relaxed">
          It seems your cart is empty. Explore our premium collections to find the perfect elements for your dream home.
        </p>
        <Link to="/products">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button size="lg" className="px-8 md:px-12 h-12 md:h-16 rounded-full shadow-2xl shadow-[#189D91]/30 bg-[#189D91] text-sm md:text-lg font-black uppercase tracking-widest text-white">Start Shopping</Button>
          </motion.div>
        </Link>
      </motion.div>
    );
  }

  return (
    <div className="bg-soft-oatmeal/5 min-h-screen">
      {/* Mobile Top Header (Fixed) */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-warm-sand text-white px-6 h-14 flex items-center shadow-lg">
        <h1 className="text-xl font-bold text-white tracking-tight">Cart: {cart.length} {cart.length === 1 ? 'item' : 'items'}</h1>
      </div>

      {/* Main Content Container */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 pt-2 md:pt-20 pb-32 md:pb-20"
      >
        {/* Mobile-Only Progress Steps */}
        <div className="md:hidden mt-2 mb-4 flex items-center justify-between px-2 bg-white py-2 rounded-xl shadow-sm overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="h-6 w-6 rounded-full bg-warm-sand text-white text-xs flex items-center justify-center font-bold">1</span>
            <span className="text-xs font-bold text-gray-400">Cart</span>
            <FiArrowRight className="text-gray-300 text-xs" />
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="h-6 w-6 rounded-full bg-gray-200 text-gray-500 text-xs flex items-center justify-center font-bold">2</span>
            <span className="text-xs font-bold text-gray-400">Address</span>
            <FiArrowRight className="text-gray-300 text-xs" />
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="h-6 w-6 rounded-full bg-gray-200 text-gray-500 text-xs flex items-center justify-center font-bold">3</span>
            <span className="text-xs font-bold text-gray-400">Payment</span>
          </div>
        </div>

        {/* Mobile-Only Delivery Section */}
        <div className="md:hidden mb-6 bg-white p-4 rounded-xl shadow-sm border-b-4 border-soft-oatmeal/10">
          {!isLoggedIn ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Delivering To</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm font-bold text-deep-espresso">560001, Bengaluru</span>
                  <button className="text-[10px] font-black text-warm-sand uppercase tracking-wider">Change</button>
                </div>
              </div>
              <button onClick={() => navigate('/login')} className="text-[10px] font-black text-[#189D91] uppercase tracking-wider border-b border-[#189D91]/30">LOGIN NOW</button>
            </div>
          ) : !address ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Delivering To</p>
                <p className="text-sm font-bold text-deep-espresso">560001, Bengaluru</p>
              </div>
              <button onClick={() => navigate('/address')} className="text-[10px] font-black text-warm-sand uppercase tracking-wider">ADD ADDRESS</button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Delivering To</p>
                <p className="text-sm font-bold text-deep-espresso">{address.pincode}, {address.city}</p>
                <p className="text-[10px] text-gray-400 mt-0.5 truncate max-w-[200px]">{address.address}</p>
              </div>
              <button onClick={() => navigate('/address')} className="text-[10px] font-black text-warm-sand uppercase tracking-wider">Change</button>
            </div>
          )}
          {!isLoggedIn && (
             <p className="text-[8px] text-gray-400 font-bold mt-2 italic uppercase tracking-wider">Login to Add Address & Avail Offers</p>
          )}
        </div>

        {/* Desktop Header (Hidden on Mobile) */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="hidden md:flex flex-col sm:flex-row items-center justify-between mb-16 gap-6"
        >
          <div className="space-y-2 text-center sm:text-left">
            <h1 className="text-5xl font-bold tracking-tight">My Lifestyle Cart</h1>
            <p className="text-deep-espresso/30 font-bold uppercase tracking-[0.2em] text-[10px]">Review your selected pieces before secure checkout</p>
          </div>
          <motion.button 
            whileHover={{ color: '#189D91', scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={clearCart}
            className="flex items-center text-xs font-black uppercase tracking-[0.2em] text-gray-400 group transition-all"
          >
            <FiTrash2 className="mr-3 text-lg" />
            Clear Collections
          </motion.button>
        </motion.div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 md:gap-20 items-start">
          {/* Cart Listing */}
          <div className="xl:col-span-2 space-y-4 md:space-y-8">
            <AnimatePresence>
              {cart.map((item) => (
                <div key={item.id}>
                  {/* Mobile Item Card */}
                  <div className="md:hidden bg-white rounded-xl p-3 shadow-sm border border-soft-oatmeal/10 flex gap-3">
                    <div className="w-20 h-20 bg-soft-oatmeal/10 rounded-lg overflow-hidden flex-shrink-0">
                      <img src={item.images?.[0] || item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 flex flex-col justify-between py-0.5">
                      <div>
                        <h3 className="text-sm font-bold text-deep-espresso line-clamp-2 leading-snug">{item.name}</h3>
                        <p className="text-xs font-bold text-warm-sand mt-1">₹{item.price} <span className="text-[9px] text-gray-400 font-medium italic">incl. GST</span></p>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <button 
                          onClick={() => removeFromCart(item.id)}
                          className="flex items-center gap-1.5 text-gray-400 text-[10px] font-bold uppercase tracking-widest"
                        >
                          <FiTrash2 className="h-3.5 w-3.5" />
                          Remove
                        </button>
                        <div className="flex items-center border border-gray-200 rounded-lg">
                          <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="px-2.5 py-1 text-gray-400 border-r border-gray-200">-</button>
                          <span className="px-3 text-xs font-bold text-deep-espresso">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="px-2.5 py-1 text-gray-400 border-l border-gray-200">+</button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Desktop Item Card */}
                  <div className="hidden md:block">
                    <CartItem item={item} />
                  </div>
                </div>
              ))}
            </AnimatePresence>

            {/* Referral Code (Mobile Only) */}
            <div className="md:hidden bg-white p-4 rounded-xl shadow-sm border border-soft-oatmeal/10 flex flex-col gap-3 mt-4">
               <div className="flex items-center gap-2 text-deep-espresso">
                 <svg className="w-5 h-5 opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 12V8H6a2 2 0 01-2-2V5a1 1 0 011-1h15a1 1 0 011 1v2M20 12v4a2 2 0 01-2 2H6a2 2 0 01-2-2V9a2 2 0 012-2h14z"/></svg>
                 <span className="text-sm font-bold">Use Referral code</span>
               </div>
               <div className="flex gap-2">
                 <input type="text" placeholder="Enter referral code" className="flex-1 bg-soft-oatmeal/5 border border-gray-100 rounded-lg px-4 py-2 text-sm focus:outline-none" />
                 <button className="text-xs font-black uppercase text-warm-sand px-4">APPLY</button>
               </div>
            </div>

            {/* Trust Message (Hidden on Mobile) */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="hidden md:flex items-center gap-8 p-10 bg-warm-sand/5 rounded-[2.5rem] border border-warm-sand/20 border-dashed mt-20"
            >
              <div className="h-16 w-16 bg-warm-sand/10 rounded-full flex items-center justify-center flex-shrink-0 animate-pulse">
                <FiInfo className="h-8 w-8 text-warm-sand" />
              </div>
              <div className="space-y-2">
                <h4 className="text-xs font-black uppercase tracking-widest text-deep-espresso">White-Glove Handling</h4>
                <p className="text-sm text-deep-espresso/60 leading-relaxed italic font-medium">
                  "We treat your order as our own. Fragile items like tiles and lighting are protected by our premium damage-free delivery guarantee."
                </p>
              </div>
            </motion.div>
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            {/* Price Details (Mobile Pattern) */}
            <div className="bg-white rounded-xl shadow-sm border border-soft-oatmeal/10 overflow-hidden">
               <h3 className="bg-soft-oatmeal/5 px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 border-b border-gray-100 italic">Price Details</h3>
               <div className="p-4 space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">MRP Value</span>
                    <span className="text-deep-espresso font-medium">₹{mrpValue}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Discount on MRP</span>
                    <span className="text-warm-sand font-medium">-₹{discountOnMRP}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Delivery Charges</span>
                    <span className="text-warm-sand font-bold uppercase text-[10px]">
                      {deliveryCharges === 0 ? 'Free' : `₹${deliveryCharges}`}
                    </span>
                  </div>
                  <div className="border-t border-dashed border-gray-200 pt-4 flex justify-between items-baseline">
                    <div>
                      <span className="text-base font-bold text-deep-espresso tracking-tight">Total</span>
                      <p className="text-[8px] text-gray-400 font-medium">(Including ₹{gstAmount} as GST)</p>
                    </div>
                    <span className="text-xl font-black text-deep-espresso tracking-tighter">₹{totalPrice}</span>
                  </div>
               </div>
                <div className="bg-warm-sand/10 px-4 py-2 border-t border-warm-sand/20">
                   <p className="text-[10px] text-warm-sand font-bold text-center">You saved ₹{discountOnMRP} on this purchase.</p>
               </div>
            </div>

            {/* Original Desktop Order Summary (Hidden on Mobile) */}
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              className="hidden md:block bg-white border-2 border-soft-oatmeal/10 rounded-[3rem] p-10 shadow-2xl sticky top-32"
            >
              <h2 className="text-xs uppercase tracking-[0.4em] font-black text-deep-espresso/30 mb-10 flex items-center leading-none">
                <span className="h-px w-6 bg-warm-sand mr-4"></span>
                Order Summary
              </h2>
              
              <div className="space-y-6 mb-12">
                <div className="flex justify-between text-deep-espresso/60 font-medium">
                  <div>
                    <span className="text-sm uppercase tracking-widest">Subtotal</span>
                    {gstAmount > 0 && (
                      <p className="text-[10px] text-deep-espresso/40 mt-0.5 normal-case tracking-normal">
                        Incl. GST ₹{gstAmount.toFixed(2)}
                      </p>
                    )}
                  </div>
                  <span className="text-lg font-bold text-deep-espresso">₹{mrpValue.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-deep-espresso/60 font-medium">
                  <span className="text-sm uppercase tracking-widest">Discount</span>
                  <span className="text-lg font-bold text-warm-sand">-₹{discountOnMRP.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-deep-espresso/40">
                  <span className="text-xs uppercase tracking-widest">Shipping</span>
                  <span className="text-xs font-black text-warm-sand uppercase tracking-widest">
                    {deliveryCharges === 0 ? 'Complimentary' : `₹${deliveryCharges.toFixed(2)}`}
                  </span>
                </div>
              </div>

              <div className="h-px bg-soft-oatmeal/20 mb-10" />

              <div className="flex justify-between mb-12 items-end">
                <span className="text-xs uppercase tracking-[0.3em] font-black text-warm-sand pb-1.5">Total Amount</span>
                <span className="text-4xl font-bold text-deep-espresso tracking-tight">₹{totalPrice.toFixed(2)}</span>
              </div>

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button size="lg" className="w-full h-20 text-lg font-black uppercase tracking-[0.2em] shadow-2xl shadow-warm-sand/20 group rounded-full overflow-hidden">
                  <span className="relative z-10 flex items-center justify-center">
                    Review Checkout
                    <FiArrowRight className="ml-4 text-xl transform group-hover:translate-x-2 transition-transform duration-300" />
                  </span>
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-4 flex items-center justify-between shadow-[0_-8px_20px_rgba(0,0,0,0.05)] z-50">
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Total Price</p>
            <p className="text-xl font-black text-deep-espresso tracking-tighter">₹{cartTotal}</p>
            <p className="text-[8px] text-warm-sand font-bold">View Details</p>
          </div>
          <motion.button 
            whileTap={{ scale: 0.95 }}
            onClick={handleAction}
            className="bg-[#189D91] text-white px-8 py-3.5 rounded-xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-[#189D91]/20"
          >
            {getButtonText()}
          </motion.button>
      </div>
    </div>
  );
};

export default CartPage;
