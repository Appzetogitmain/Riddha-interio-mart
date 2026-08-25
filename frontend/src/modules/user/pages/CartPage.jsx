import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../data/CartContext';
import { useUser } from '../data/UserContext';
import { FiArrowRight, FiShoppingBag, FiTrash2, FiClock, FiPlus, FiMinus, FiSearch, FiX, FiArrowLeft, FiStar } from 'react-icons/fi';
import Button from '../../../shared/components/Button';
import { getDeliveryEstimate } from '../../../shared/utils/delivery';
import SmartGuide from '../components/SmartGuide';
// Requirement A — capture bulk buyers who will not check out at list price
import RequestQuoteButton from '../components/RFQ/RequestQuoteButton';
import BulkOrderModal from '../components/BulkOrderModal';

const CartPage = () => {
  const { cart, updateQuantity, removeFromCart, pricingBreakdown } = useCart();
  const { isLoggedIn, address } = useUser();
  const navigate = useNavigate();

  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkPrefill, setBulkPrefill] = useState(null);

  const handleIncrement = async (item) => {
    const nextQty = item.quantity + 1;
    const result = await updateQuantity(item._id || item.id, nextQty);
    if (result?.capped) {
      setBulkPrefill({
        id: item._id || item.id,
        name: item.name,
        qty: nextQty,
        price: item.price,
        image: item.images?.[0] || item.image,
        category: typeof item.category === 'string' ? item.category : (item.category?.name || 'General'),
        maxQty: result.maxQty,
      });
      setBulkModalOpen(true);
    }
  };

  // Price Calculations (securely driven by backend pricing engine)
  const mrpValue = pricingBreakdown?.subtotal || 0;
  const discountOnMRP = pricingBreakdown?.discountAmount || 0;
  const deliveryCharges = pricingBreakdown?.shippingPrice || 0;
  const gstAmount = pricingBreakdown?.taxAmount || 0;
  const totalPrice = pricingBreakdown?.totalPrice || 0;

  const [searchQuery, setSearchQuery] = useState('');
  const handleSearch = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleAction = () => {
    if (!isLoggedIn) {
      navigate('/login');
    } else {
      navigate('/checkout');
    }
  };

  if (cart.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
        <div className="w-20 h-20 bg-[#189D91]/5 rounded-full flex items-center justify-center mb-6 border border-[#189D91]/10">
          <FiShoppingBag className="text-3xl text-[#189D91]/55" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Your cart is empty</h2>
        <p className="text-gray-400 mb-8 text-xs font-semibold">Add some beautiful pieces to your collection!</p>
        <button
          onClick={() => navigate('/products')}
          className="px-10 py-3.5 bg-[#189D91] hover:bg-[#14847a] text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all duration-300 shadow-md shadow-[#189D91]/15 hover:shadow-lg active:scale-[0.98]"
        >
          START SHOPPING
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white md:bg-[#FAFAFA] min-h-screen pb-32">
      {/* ======================= DESKTOP VIEW (Match Screenshot) ======================= */}
      <div className="hidden md:block max-w-6xl mx-auto px-6 py-8">
        {/* Breadcrumbs */}
        <div className="text-[13px] text-gray-500 font-medium mb-8">
          <Link to="/" className="hover:text-[#189D91] hover:underline transition-colors cursor-pointer">Home</Link> <span className="mx-2">&gt;</span> Cart <span className="mx-2">&gt;</span> <span className="text-gray-900">Checkout</span>
        </div>

        {/* Stepper */}
        <div className="flex items-center gap-10 mb-10">
          <div className="flex items-center gap-3 bg-[#189D91]/10 px-5 py-2 rounded-full border border-[#189D91]/20">
            <span className="w-6 h-6 rounded-full bg-[#189D91] text-white flex items-center justify-center text-xs font-bold">1</span>
            <span className="text-sm font-bold text-[#189D91]">Checkout Summary</span>
          </div>
          <div className="flex items-center gap-3 opacity-60">
            <span className="w-6 h-6 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-xs font-bold">2</span>
            <span className="text-sm font-semibold text-gray-600">Payment Selection</span>
          </div>
          <div className="flex items-center gap-3 opacity-60">
            <span className="w-6 h-6 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-xs font-bold">3</span>
            <span className="text-sm font-semibold text-gray-600">Order Placed</span>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-8">
          {/* Left Column: Cart Items (Replaces Shipping Address from screenshot) */}
          <div className="col-span-7">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Cart Items</h2>
              <button onClick={() => navigate('/products')} className="text-sm font-bold text-[#189D91]">+ Add More Items</button>
            </div>

            <div className="space-y-4">
              <AnimatePresence>
                {cart.map((item) => (
                  <motion.div
                    key={item._id || item.id}
                    className="border border-[#189D91]/30 rounded-xl p-5 flex gap-6 bg-white shadow-sm relative overflow-hidden"
                  >
                    {/* Active border accent like the 'Home' card in screenshot */}
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#189D91] rounded-l-xl"></div>
                    <div className="absolute right-4 top-4 text-[#189D91]">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                    </div>

                    <div className="w-24 h-24 bg-gray-50 rounded-lg overflow-hidden flex-shrink-0 border border-gray-100">
                      <img src={item.images?.[0] || item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 flex flex-col justify-between pr-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-gray-900 text-lg">{item.name}</h3>
                          <p className="text-sm font-semibold text-gray-500 mt-1">₹{item.price?.toLocaleString('en-IN')}</p>
                        </div>
                        <button
                          onClick={() => removeFromCart(item._id || item.id)}
                          className="text-gray-400 hover:text-red-500 transition-colors p-1"
                        >
                          <FiX size={22} />
                        </button>
                      </div>

                      <div className="flex items-center gap-4 mt-4">
                        <span className="text-sm font-medium text-gray-500">Qty:</span>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => updateQuantity(item._id || item.id, item.quantity - 1)}
                            className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-md text-gray-600 hover:bg-gray-200"
                          >
                            <FiMinus size={14} />
                          </button>
                          <span className="font-bold text-gray-900 w-4 text-center">{item.quantity}</span>
                          <button
                            onClick={() => handleIncrement(item)}
                            className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-md text-gray-600 hover:bg-gray-200"
                          >
                            <FiPlus size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            <div className="mt-8 flex items-center gap-2 text-sm font-semibold text-gray-500">
              <svg className="w-5 h-5 text-[#189D91]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              100% Secure Payments
            </div>
          </div>

          {/* Right Column: Order Summary */}
          <div className="col-span-5 pl-8">
            {/* Journey guidance at the decision point (Req #17) */}
            <SmartGuide currentPage="/cart" includeUpsell className="mb-4" />

            <div className="border border-gray-200 rounded-[20px] p-8 bg-white shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>

              {/* Mini Cart Items (like screenshot) */}
              <div className="space-y-5 mb-6 border-b border-gray-100 pb-6">
                {cart.map((item) => (
                  <div key={item._id || item.id} className="flex gap-4 items-center">
                    <img src={item.images?.[0] || item.image} alt={item.name} className="w-[60px] h-[60px] rounded-lg object-cover bg-gray-50 border border-gray-100" />
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h4 className="text-[15px] font-bold text-gray-800 line-clamp-1">{item.name}</h4>
                        <span className="text-[15px] font-bold text-gray-900 ml-2">₹{item.price?.toLocaleString('en-IN')}</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">Qty: {item.quantity}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-4">
                <div className="flex justify-between text-[15px]">
                  <div>
                    <span className="text-gray-500 font-medium">Subtotal</span>
                    {gstAmount > 0 && (
                      <p className="text-[11px] text-gray-400 font-medium mt-0.5">
                        Incl. GST ₹{gstAmount?.toLocaleString('en-IN')}
                      </p>
                    )}
                  </div>
                  <span className="text-gray-900 font-bold">₹{mrpValue?.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-[15px]">
                  <span className="text-gray-500 font-medium">Shipping</span>
                  <span className="text-[#189D91] font-bold uppercase tracking-wide">
                    {deliveryCharges === 0 ? 'FREE' : `₹${deliveryCharges?.toLocaleString('en-IN')}`}
                  </span>
                </div>

                <div className="pt-4 mt-2 border-t border-gray-100 flex justify-between items-center">
                  <span className="text-[22px] font-extrabold text-gray-900">Total</span>
                  <span className="text-[22px] font-extrabold text-gray-900">₹{totalPrice?.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <button
                onClick={handleAction}
                className="w-full mt-8 bg-[#189D91] hover:bg-[#14847a] text-white py-4 rounded-xl font-bold text-[15px] shadow-md shadow-[#189D91]/15 hover:shadow-lg transition-all"
              >
                Proceed to Checkout
              </button>

              {/* ── B2B: bulk pricing (Requirement A) ── */}
              {cart.length > 0 && (
                <div className="mt-4 rounded-xl border border-[#189D91]/25 bg-[#189D91]/5 p-4 text-center">
                  <p className="mb-2 text-[13px] font-semibold text-gray-800">Need bulk pricing?</p>
                  <p className="mb-3 text-[11px] text-gray-500">
                    Get a quotation for these {cart.length} item{cart.length === 1 ? '' : 's'} at contractor rates.
                  </p>
                  <RequestQuoteButton
                    products={cart.map((item) => ({
                      productId: item._id || item.id,
                      productDescription: item.name,
                      quantity: item.quantity || '',
                      unit: 'pcs'
                    }))}
                    source="cart"
                    variant="outline"
                    fullWidth
                    label="Request a quote"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>


      {/* ======================= MOBILE VIEW ======================= */}
      <div className="md:hidden pb-40">
        {/* Mobile Header */}
        <div className="bg-[#189D91] text-white px-5 py-4 flex items-center justify-between sticky top-0 z-20">
          <button onClick={() => window.history.back()} className="text-white hover:text-white/80 transition-colors">
            <FiArrowLeft size={22} />
          </button>
          <h1 className="text-lg font-bold flex-1 text-center pr-5">Cart</h1>
        </div>

        {/* Mobile Search */}
        <div className="px-5 py-4 bg-white">
          <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 flex items-center gap-2.5 text-gray-400 focus-within:ring-2 focus-within:ring-[#36A18B]/20 transition-all">
            <button
              onClick={() => { if (searchQuery.trim()) navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`); }}
              className="text-gray-400 hover:text-[#189D91] transition-colors flex-shrink-0"
            >
              <FiSearch size={18} />
            </button>
            <input
              type="text"
              placeholder="Search products or brands..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearch}
              className="bg-transparent border-none outline-none w-full text-[15px] font-medium text-gray-700 placeholder:text-gray-400"
            />
          </div>
        </div>

        {/* Mobile Item List */}
        <div className="space-y-0 px-0">
          <AnimatePresence>
            {cart.map((item) => (
              <motion.div
                key={item._id || item.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white p-5 border-b border-gray-100"
              >
                <div className="flex flex-col gap-4">
                  <div className="flex gap-4 relative">
                    <button
                      onClick={() => removeFromCart(item._id || item.id)}
                      className="absolute top-0 right-0 text-gray-400 hover:text-gray-600 p-1 z-10 bg-white rounded-full"
                    >
                      <FiX size={18} />
                    </button>
                    <div className="w-[100px] h-[100px] rounded-2xl overflow-hidden flex-shrink-0 bg-gray-50 border border-gray-100">
                      <img src={item.images?.[0] || item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 pt-1 pr-6">
                      <h3 className="text-[15px] font-bold text-gray-900 leading-tight mb-1">{item.name}</h3>
                      <p className="text-[13px] font-medium text-gray-500 mb-1">Price- ₹{item.price?.toLocaleString('en-IN')}</p>
                      <div className="flex items-center text-[13px] font-medium text-gray-500">
                        <span>Rating- <span className="text-amber-400 mx-0.5">⭐</span> {item.averageRating || '4.7'} ({item.totalReviews || '913'})</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[15px] font-semibold text-gray-900">Quantity</span>
                    <div className="flex items-center bg-gray-50 rounded-[10px] p-0.5 border border-gray-100/80">
                      <button
                        onClick={() => updateQuantity(item._id || item.id, item.quantity - 1)}
                        className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-white hover:shadow-sm rounded-lg transition-all"
                      >
                        <FiMinus size={14} className="stroke-[2.5px]" />
                      </button>
                      <span className="w-8 text-center text-[15px] font-bold text-gray-900">{item.quantity}</span>
                      <button
                        onClick={() => handleIncrement(item)}
                        className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-white hover:shadow-sm rounded-lg transition-all"
                      >
                        <FiPlus size={14} className="stroke-[2.5px]" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Mobile Price Summary */}
        <div className="px-5 py-6 space-y-3 border-b border-gray-100 bg-white">
          <div className="flex justify-between items-center text-[15px] font-medium text-gray-800">
            <div>
              <span>Subtotal</span>
              {gstAmount > 0 && (
                <p className="text-[11px] text-gray-400 mt-0.5">Incl. GST ₹{gstAmount?.toLocaleString('en-IN')}</p>
              )}
            </div>
            <span className="font-semibold text-gray-900">₹{mrpValue?.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between items-center text-[15px] font-medium text-gray-800">
            <span>Shipping</span>
            <span className={deliveryCharges === 0 ? 'font-semibold text-[#189D91]' : 'font-semibold text-gray-900'}>
              {deliveryCharges === 0 ? 'FREE' : `₹${deliveryCharges?.toLocaleString('en-IN')}`}
            </span>
          </div>

          {discountOnMRP > 0 && (
            <div className="flex justify-between items-center text-[15px] font-medium text-emerald-600">
              <span>Discount</span>
              <span className="font-semibold">-₹{discountOnMRP?.toLocaleString('en-IN')}</span>
            </div>
          )}

          <div className="pt-4 mt-2 flex justify-between items-center">
            <span className="text-[18px] font-extrabold text-gray-900">Total</span>
            <span className="text-[18px] font-extrabold text-gray-900">₹{totalPrice?.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Mobile Sticky Footer */}
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg px-5 py-4 pb-6 z-40 border-t border-gray-100 shadow-[0_-10px_30px_rgba(0,0,0,0.03)]">
          <button
            onClick={handleAction}
            className="w-full bg-[#189D91] hover:bg-[#14847a] text-white py-[18px] rounded-full font-bold text-[17px] shadow-sm transition-all active:scale-[0.98]"
          >
            Proceed to Checkout
          </button>
          {cart.length > 0 && (
            <div className="mt-2 text-center">
              <RequestQuoteButton
                products={cart.map((item) => ({
                  productId: item._id || item.id,
                  productDescription: item.name,
                  quantity: item.quantity || '',
                  unit: 'pcs'
                }))}
                source="cart-mobile"
                variant="link"
                label="Need bulk pricing? Request a quote"
                className="text-[13px]"
              />
            </div>
          )}
        </div>
      </div>

      <BulkOrderModal
        isOpen={bulkModalOpen}
        onClose={() => setBulkModalOpen(false)}
        prefillItem={bulkPrefill}
      />
    </div>
  );
};

export default CartPage;
