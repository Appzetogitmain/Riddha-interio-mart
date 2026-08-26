import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../data/CartContext';
import { useUser } from '../data/UserContext';
import {
  FiArrowLeft, FiMapPin, FiShoppingBag, FiTruck, FiInfo,
  FiPlusCircle, FiAlertCircle, FiArrowRight, FiEdit2, FiCheck,
  FiTag
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import CouponSelector from '../components/CouponSelector';

/* ── tiny reusable section card ── */
const Card = ({ children, className = '' }) => (
  <div className={`bg-white border border-gray-100 ${className}`}>{children}</div>
);

const CardHeader = ({ icon: Icon, title, action }) => (
  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
    <div className="flex items-center gap-2.5">
      <div className="w-7 h-7 bg-[#189D91]/10 flex items-center justify-center text-[#189D91]">
        <Icon size={14} />
      </div>
      <span className="text-[11px] font-black uppercase tracking-widest text-gray-700">{title}</span>
    </div>
    {action}
  </div>
);

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { cart, pricingBreakdown, loading: cartLoading } = useCart();
  const { address, isLoggedIn, fetchAddresses, loading: userLoading, user } = useUser();
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  // Safety net: a per-product Max B2C Order Quantity can be set/lowered by the admin/seller
  // after an item was already added to cart (the cart/product pages block it going in, but
  // don't re-validate items already sitting in the cart) — catch that here, before payment,
  // rather than letting the customer discover it only after filling in payment details.
  const overCapItem = user?.userType === 'enterpriser'
    ? null
    : cart.find(item => item.maxB2CQty && item.quantity > item.maxB2CQty);

  useEffect(() => {
    if (!isLoggedIn) { navigate('/login'); return; }
    fetchAddresses();
    sessionStorage.removeItem('applied_coupon');
  }, [isLoggedIn, fetchAddresses, navigate]);

  const handleCouponApplied  = (c) => setAppliedCoupon(c);
  const handleCouponRemoved  = () => { setAppliedCoupon(null); sessionStorage.removeItem('applied_coupon'); toast.success('Coupon removed.'); };

  const subtotal       = pricingBreakdown?.subtotal     || 0;
  const gstAmount      = pricingBreakdown?.taxAmount    || 0;
  const deliveryCharges= pricingBreakdown?.shippingPrice|| 0;
  const baseDiscount   = pricingBreakdown?.discountAmount|| 0;
  const couponDiscount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const grandTotal     = Math.max(0, subtotal - baseDiscount + deliveryCharges - couponDiscount);

  const handleProceedToPayment = () => {
    if (overCapItem) {
      toast.error(`"${overCapItem.name}" has a maximum order quantity of ${overCapItem.maxB2CQty}. Reduce the quantity in your cart, or submit a Bulk Order Request for the rest.`);
      navigate('/cart');
      return;
    }
    if (!address) { toast.error('Add a shipping address first.'); return; }
    if (!address.fullName || !address.mobileNumber || !address.fullAddress || !address.pincode || !address.city) {
      toast.error('Address has incomplete details.'); return;
    }
    if (address.mobileNumber.length !== 10) { toast.error('Mobile must be 10 digits.'); return; }
    if (address.pincode.length !== 6)       { toast.error('Pincode must be 6 digits.'); return; }
    if (appliedCoupon) sessionStorage.setItem('applied_coupon', JSON.stringify(appliedCoupon));
    navigate('/payment');
  };

  const isLoading = cartLoading || userLoading;

  if (cart.length === 0 && !isLoading) return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
      <FiShoppingBag size={40} className="text-gray-200 mb-4" />
      <h2 className="text-base font-bold text-gray-800 mb-1">Cart is empty</h2>
      <p className="text-xs text-gray-400 mb-6">Add items before checking out.</p>
      <button onClick={() => navigate('/products')}
        className="px-8 py-2.5 bg-[#189D91] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#14847a] transition-colors">
        Browse Products
      </button>
    </div>
  );

  /* ── Stepper ── */
  const steps = [
    { n: 1, label: 'Checkout' },
    { n: 2, label: 'Payment' },
    { n: 3, label: 'Placed' },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="min-h-screen bg-[#F5F5F5] pb-32 md:pb-10">

      {/* ── Page header ── */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 sticky top-0 z-20 md:static md:bg-transparent md:border-0 md:px-6 md:py-5">
        <button onClick={() => navigate('/cart')}
          className="p-1.5 hover:bg-gray-100 transition-colors">
          <FiArrowLeft size={18} className="text-gray-700" />
        </button>
        <div className="flex-1">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none">Step 1 of 3</p>
          <h1 className="text-base font-bold text-gray-900 leading-tight mt-0.5">Checkout Summary</h1>
        </div>
        {/* Stepper — mobile compact */}
        <div className="flex items-center gap-1 md:hidden">
          {steps.map((s, i) => (
            <React.Fragment key={s.n}>
              <div className={`flex items-center gap-1 ${s.n === 1 ? 'text-[#189D91]' : 'text-gray-300'}`}>
                <span className={`w-5 h-5 flex items-center justify-center text-[10px] font-black border ${s.n === 1 ? 'bg-[#189D91] border-[#189D91] text-white' : 'border-gray-200'}`}>
                  {s.n === 1 ? <FiCheck size={10} /> : s.n}
                </span>
                <span className="text-[9px] font-bold hidden">{s.label}</span>
              </div>
              {i < steps.length - 1 && <div className={`w-4 h-px ${s.n < 1 ? 'bg-[#189D91]' : 'bg-gray-200'}`} />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Desktop stepper */}
      <div className="hidden md:flex items-center gap-6 max-w-6xl mx-auto px-6 mb-6 mt-2">
        {steps.map((s, i) => (
          <React.Fragment key={s.n}>
            <div className={`flex items-center gap-2 ${s.n === 1 ? '' : 'opacity-40'}`}>
              <span className={`w-6 h-6 flex items-center justify-center text-xs font-black ${s.n === 1 ? 'bg-[#189D91] text-white' : 'bg-gray-200 text-gray-600'}`}>
                {s.n}
              </span>
              <span className={`text-xs font-bold ${s.n === 1 ? 'text-[#189D91]' : 'text-gray-500'}`}>{s.label}</span>
            </div>
            {i < steps.length - 1 && <div className="flex-1 h-px bg-gray-200" />}
          </React.Fragment>
        ))}
      </div>

      {isLoading ? (
        <div className="max-w-6xl mx-auto px-4 md:px-6 space-y-3 mt-3">
          {[80, 56, 120, 80].map((h, i) => (
            <div key={i} className={`h-${h === 80 ? '20' : h === 56 ? '14' : h === 120 ? '28' : '20'} bg-white animate-pulse border border-gray-100`} style={{height: h}} />
          ))}
        </div>
      ) : (
        <div className="max-w-6xl mx-auto md:px-6 md:grid md:grid-cols-12 md:gap-6">

          {/* ── Left column ── */}
          <div className="md:col-span-7 space-y-2 md:space-y-4">

            {/* Address */}
            <Card className="mx-0">
              <CardHeader
                icon={FiMapPin}
                title="Shipping Address"
                action={address && (
                  <button
                    onClick={() => navigate('/address', { state: { from: '/checkout' } })}
                    className="flex items-center gap-1 text-[10px] font-bold text-[#189D91] uppercase tracking-wider hover:underline"
                  >
                    <FiEdit2 size={11} /> Edit
                  </button>
                )}
              />
              <div className="px-4 py-3">
                {address ? (
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-[13px] font-bold text-gray-900">{address.fullName}</p>
                        <span className="text-[9px] font-black bg-emerald-50 text-emerald-600 border border-emerald-100 px-1.5 py-0.5 uppercase tracking-wide">Default</span>
                      </div>
                      <p className="text-[12px] text-gray-500 leading-relaxed">
                        {address.fullAddress}{address.landmark ? `, ${address.landmark}` : ''}, {address.city} – {address.pincode}
                      </p>
                      <p className="text-[11px] text-gray-400 font-medium mt-1">+91 {address.mobileNumber}</p>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => navigate('/address', { state: { from: '/checkout' } })}
                    className="flex items-center gap-3 py-3 cursor-pointer group"
                  >
                    <div className="w-9 h-9 border-2 border-dashed border-gray-200 group-hover:border-[#189D91]/40 flex items-center justify-center text-gray-300 group-hover:text-[#189D91] transition-colors">
                      <FiPlusCircle size={18} />
                    </div>
                    <div>
                      <p className="text-[12px] font-bold text-gray-700 group-hover:text-[#189D91] transition-colors">Add Delivery Address</p>
                      <p className="text-[10px] text-gray-400">Required to proceed to payment</p>
                    </div>
                    <FiArrowRight size={14} className="ml-auto text-gray-300 group-hover:text-[#189D91] transition-colors" />
                  </div>
                )}
              </div>
            </Card>

            {/* Coupon */}
            <Card>
              <CardHeader icon={FiTag} title="Apply Coupon" />
              <div className="px-4 py-3">
                <CouponSelector
                  cartItems={cart}
                  onCouponApplied={handleCouponApplied}
                  appliedCoupon={appliedCoupon}
                  onCouponRemoved={handleCouponRemoved}
                />
              </div>
            </Card>

            {/* Order items */}
            <Card>
              <CardHeader icon={FiShoppingBag} title={`Order Items (${cart.length})`} />
              <div className="divide-y divide-gray-50">
                {cart.map((item) => {
                  const isOverCap = item.maxB2CQty && item.quantity > item.maxB2CQty && user?.userType !== 'enterpriser';
                  return (
                    <div key={item._id || item.id} className="px-4 py-3">
                      <div className="flex gap-3 items-center">
                        <img
                          src={item.image || item.images?.[0]}
                          alt={item.name}
                          className="w-14 h-14 object-cover bg-gray-50 border border-gray-100 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-bold text-gray-800 line-clamp-1">{item.name}</p>
                          <p className="text-[11px] text-gray-400 mt-0.5">Qty: <span className={`font-bold ${isOverCap ? 'text-red-500' : 'text-gray-600'}`}>{item.quantity}</span></p>
                        </div>
                        <span className="text-[13px] font-black text-gray-900 shrink-0">
                          ₹{(item.price * item.quantity)?.toLocaleString('en-IN')}
                        </span>
                      </div>
                      {isOverCap && (
                        <div className="flex items-start gap-2 mt-2 p-2.5 bg-red-50 border border-red-100">
                          <FiAlertCircle className="text-red-500 shrink-0 mt-0.5" size={13} />
                          <p className="text-[10.5px] text-red-600 leading-relaxed">
                            Max order quantity for this product is <span className="font-bold">{item.maxB2CQty}</span>. Reduce the quantity in your cart, or submit a Bulk Order Request for the rest — you can order the remainder separately.
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* ── Right column (desktop only) — price summary ── */}
          <div className="md:col-span-5 hidden md:block">
            <div className="bg-white border border-gray-100 sticky top-24">
              <div className="px-5 py-4 border-b border-gray-50">
                <h2 className="text-[11px] font-black uppercase tracking-widest text-gray-700">Price Summary</h2>
              </div>

              <div className="px-5 py-4 space-y-3">
                <PriceLine label="Subtotal" value={`₹${subtotal.toLocaleString('en-IN')}`} />
                {gstAmount > 0 && <PriceLine label="GST (incl.)" value={`₹${gstAmount.toLocaleString('en-IN')}`} muted />}
                <PriceLine
                  label="Shipping"
                  value={deliveryCharges === 0 ? 'FREE' : `₹${deliveryCharges}`}
                  valueClass={deliveryCharges === 0 ? 'text-[#189D91] font-black' : ''}
                />
                {baseDiscount > 0 && <PriceLine label="Discount" value={`-₹${baseDiscount.toLocaleString('en-IN')}`} valueClass="text-emerald-600 font-black" />}
                <AnimatePresence>
                  {appliedCoupon && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                      <PriceLine label={`Coupon (${appliedCoupon.code})`} value={`-₹${appliedCoupon.discountAmount.toLocaleString('en-IN')}`} valueClass="text-emerald-600 font-black" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="px-5 py-3 border-t-2 border-gray-900 mx-5 flex justify-between items-center mb-5">
                <span className="text-[13px] font-black uppercase tracking-wide text-gray-900">Total</span>
                <span className="text-xl font-black text-gray-900">₹{grandTotal.toLocaleString('en-IN')}</span>
              </div>

              {overCapItem ? (
                <div className="mx-5 mb-3 flex items-center gap-2 p-2.5 bg-red-50 border border-red-200">
                  <FiAlertCircle className="text-red-500 shrink-0" size={13} />
                  <p className="text-[10px] text-red-600 font-bold uppercase tracking-wider">Reduce quantity to proceed</p>
                </div>
              ) : !address && (
                <div className="mx-5 mb-3 flex items-center gap-2 p-2.5 bg-amber-50 border border-amber-200">
                  <FiAlertCircle className="text-amber-500 shrink-0" size={13} />
                  <p className="text-[10px] text-amber-700 font-bold uppercase tracking-wider">Add address to proceed</p>
                </div>
              )}

              <div className="px-5 pb-5">
                <button
                  onClick={overCapItem ? () => navigate('/cart') : (!address ? () => navigate('/address', { state: { from: '/checkout' } }) : handleProceedToPayment)}
                  className={`w-full h-12 font-black text-xs uppercase tracking-[0.15em] transition-colors flex items-center justify-center gap-2 ${
                    overCapItem
                      ? 'bg-red-500 hover:bg-red-600 text-white'
                      : !address
                      ? 'bg-amber-500 hover:bg-amber-600 text-white'
                      : 'bg-[#189D91] hover:bg-[#14847a] text-white'
                  }`}
                >
                  {overCapItem
                    ? <><FiAlertCircle size={14} /> Fix Cart Quantity</>
                    : !address ? <><FiPlusCircle size={14} /> Add Address First</> : 'Proceed to Payment'}
                </button>

                <div className="flex items-start gap-2 mt-3 p-3 bg-gray-50 border border-gray-100">
                  <FiInfo className="text-gray-400 shrink-0 mt-0.5" size={12} />
                  <p className="text-[10px] text-gray-400 leading-relaxed">Secure checkout. All payments are encrypted and protected.</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ── Mobile sticky bottom bar ── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
        {/* Price row */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-50">
          <div className="flex items-center gap-3 text-[12px] text-gray-500">
            <span>Subtotal <span className="font-bold text-gray-800">₹{subtotal.toLocaleString('en-IN')}</span></span>
            {deliveryCharges === 0 && <span className="text-[#189D91] font-bold text-[11px]">+ Free Shipping</span>}
          </div>
          <div className="text-right">
            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Total</p>
            <p className="text-[16px] font-black text-gray-900">₹{grandTotal.toLocaleString('en-IN')}</p>
          </div>
        </div>
        {/* CTA */}
        <div className="px-4 py-3">
          <button
            onClick={overCapItem ? () => navigate('/cart') : (!address ? () => navigate('/address', { state: { from: '/checkout' } }) : handleProceedToPayment)}
            className={`w-full h-12 font-black text-[13px] uppercase tracking-wider transition-colors flex items-center justify-center gap-2 ${
              overCapItem
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : !address
                ? 'bg-amber-500 hover:bg-amber-600 text-white'
                : 'bg-[#189D91] hover:bg-[#14847a] text-white'
            }`}
          >
            {overCapItem
              ? <><FiAlertCircle size={15} /> Fix Cart Quantity</>
              : !address
              ? <><FiPlusCircle size={15} /> Add Address to Continue</>
              : <>Proceed to Payment <FiArrowRight size={14} /></>
            }
          </button>
        </div>
      </div>

    </motion.div>
  );
};

const PriceLine = ({ label, value, muted = false, valueClass = '' }) => (
  <div className="flex justify-between items-center text-[12px]">
    <span className={muted ? 'text-gray-400' : 'text-gray-500'}>{label}</span>
    <span className={`font-bold text-gray-800 ${valueClass}`}>{value}</span>
  </div>
);

export default CheckoutPage;
