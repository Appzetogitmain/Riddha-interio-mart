import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiX, FiCheck, FiZap, FiShield, FiStar, FiAward,
  FiTruck, FiCreditCard, FiUser
} from 'react-icons/fi';
import { LuCrown, LuHammer, LuPalette, LuBuilding2 } from 'react-icons/lu';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../data/UserContext';
import api from '../../../shared/utils/api';

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return; }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

// Fallback plans if API fails
const FALLBACK_PLANS = [
  {
    id: 'b2c-silver', name: '🥈 SILVER', emoji: '🥈', price: 1999,
    displayPrice: '₹1,999', billingCycle: 'Monthly', subText: 'Billed monthly',
    emiAvailable: true, emiMonths: 3, fastestDelivery: true,
    hireDesigner: true, hireContractor: false, hireArchitect: false,
    border: 'border-gray-300', btnColor: 'bg-slate-700 hover:bg-slate-800 text-white',
    features: ['⚡ Fastest Express Delivery (24-48h)', '💳 EMI in 3 months', '🎨 Hire Verified Designers', '🚚 Priority Order Processing']
  },
  {
    id: 'b2c-gold', name: '🥇 GOLD', emoji: '🥇', price: 3999,
    displayPrice: '₹3,999', billingCycle: 'Quarterly', subText: 'Billed every 3 months', popular: true,
    emiAvailable: true, emiMonths: 6, fastestDelivery: true,
    hireDesigner: true, hireContractor: true, hireArchitect: false,
    border: 'border-amber-400', btnColor: 'bg-amber-600 hover:bg-amber-700 text-white',
    features: ['⚡ All Silver Features', '👷 Hire Certified Contractors', '💳 0% EMI up to 6 months', '🎁 Exclusive B2C Discounts']
  },
  {
    id: 'b2c-platinum', name: '💎 PLATINUM', emoji: '💎', price: 6999,
    displayPrice: '₹6,999', billingCycle: 'Half-Yearly', subText: 'Billed every 6 months',
    emiAvailable: true, emiMonths: 12, fastestDelivery: true,
    hireDesigner: true, hireContractor: true, hireArchitect: true,
    border: 'border-cyan-400', btnColor: 'bg-teal-600 hover:bg-teal-700 text-white',
    features: ['⚡ All Gold Features', '🏛️ Hire Architects', '💳 EMI up to 12 months', '🌟 VIP Priority Dispatch']
  },
  {
    id: 'b2c-diamond', name: '👑 DIAMOND', emoji: '👑', price: 11999,
    displayPrice: '₹11,999', billingCycle: 'Yearly', subText: 'Billed annually (Best Savings)', bestValue: true,
    emiAvailable: true, emiMonths: 24, fastestDelivery: true,
    hireDesigner: true, hireContractor: true, hireArchitect: true,
    border: 'border-purple-400', btnColor: 'bg-purple-700 hover:bg-purple-800 text-white',
    features: ['👑 Full VIP: All Hire Services', '⚡ Same-Day Order Dispatch', '💳 0% EMI up to 24 months', '🎉 Zero Delivery Fees (1 Year)']
  }
];

const B2CSubscriptionModal = ({ isOpen, onClose, defaultPlanId = 'b2c-gold' }) => {
  const { user, setUser } = useUser();
  const navigate = useNavigate();
  const [selectedPlanId, setSelectedPlanId] = useState(defaultPlanId);
  const [loading, setLoading] = useState(false);
  const [loadingPlanId, setLoadingPlanId] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [plans, setPlans] = useState([]);

  useEffect(() => {
    if (defaultPlanId) setSelectedPlanId(defaultPlanId);
  }, [defaultPlanId]);

  // Preload Razorpay script when modal opens
  useEffect(() => {
    if (isOpen) {
      loadRazorpayScript();
      api.get('/b2c-subscription/plans')
        .then(res => {
          if (res.data.success && res.data.plans?.length > 0) {
            setPlans(res.data.plans.map(p => ({
              id: p.planId,
              name: p.name,
              emoji: p.emoji || '🚀',
              price: p.price,
              displayPrice: `₹${p.price.toLocaleString()}`,
              billingCycle: p.billingCycle,
              subText: p.description || `Billed ${p.billingCycle.toLowerCase()}`,
              popular: p.popular,
              bestValue: p.bestValue,
              emiAvailable: p.emiAvailable,
              emiMonths: p.emiMonths,
              fastestDelivery: p.fastestDelivery,
              hireDesigner: p.hireDesigner,
              hireContractor: p.hireContractor,
              hireArchitect: p.hireArchitect,
              features: p.features || [],
              border: p.popular ? 'border-amber-400' : p.bestValue ? 'border-purple-400' : 'border-gray-300',
              btnColor: p.popular ? 'bg-amber-600 hover:bg-amber-700 text-white' : p.bestValue ? 'bg-purple-700 hover:bg-purple-800 text-white' : 'bg-[#189D91] hover:bg-[#148379] text-white'
            })));
          }
        })
        .catch(() => {}); // Will fall back to FALLBACK_PLANS
    }
  }, [isOpen]);

  const activePlans = plans.length > 0 ? plans : FALLBACK_PLANS;

  const isB2CActive = user?.b2cSubscription?.status === 'active' && user?.b2cSubscription?.endDate && new Date(user.b2cSubscription.endDate) > new Date();
  const currentPlanId = isB2CActive ? user?.b2cSubscription?.planId : null;
  const currentPlanObj = currentPlanId ? activePlans.find(p => p.id === currentPlanId) : null;
  const currentPlanPrice = currentPlanObj ? currentPlanObj.price : -1;

  if (!isOpen) return null;

  const handleSubscribe = async (plan) => {
    setErrorMsg('');
    setSuccessMsg('');
    setSelectedPlanId(plan.id);

    if (!user) {
      onClose();
      navigate('/login', { state: { redirect: window.location.pathname } });
      return;
    }

    try {
      setLoading(true);
      setLoadingPlanId(plan.id);

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        setErrorMsg('Failed to load Razorpay payment SDK. Please check your internet connection.');
        setLoading(false);
        setLoadingPlanId(null);
        return;
      }

      const res = await api.post('/b2c-subscription/create-order', { planId: plan.id });
      if (!res.data.success) throw new Error(res.data.message || 'Could not initiate B2C subscription order.');

      const { order, key } = res.data;

      // Function to handle mock/instant activation verification
      const verifyAndActivatePlan = async (orderId, paymentId, signature = 'mock_signature') => {
        const verifyRes = await api.post('/b2c-subscription/verify-payment', {
          planId: plan.id,
          razorpay_order_id: orderId,
          razorpay_payment_id: paymentId,
          razorpay_signature: signature
        });
        if (verifyRes.data.success) {
          setSuccessMsg(`🎉 ${plan.name} Plan Activated! Hire features & express delivery unlocked.`);
          if (verifyRes.data.user) {
            const updatedUser = { ...user, b2cSubscription: verifyRes.data.user.b2cSubscription };
            setUser(updatedUser);
            localStorage.setItem('riddha_user', JSON.stringify(updatedUser));
          }
          setTimeout(() => onClose(), 2500);
        } else {
          setErrorMsg(verifyRes.data.message || 'Payment verification failed.');
        }
        setLoading(false);
        setLoadingPlanId(null);
      };

      // Handle mock/sandbox order or dev instant mode
      if (order.id && order.id.startsWith('order_mock_')) {
        await verifyAndActivatePlan(order.id, `pay_mock_${Date.now()}`);
        return;
      }

      const cleanPlanName = (plan.name || '').replace(/[^\w\s-]/gi, '').trim() || 'PRO';

      const options = {
        key: key || 'rzp_test_TRZdg2aAOYv4KK',
        amount: order.amount,
        currency: order.currency,
        name: 'Riddha Interio Mart',
        description: `B2C Pro Plan - ${cleanPlanName}`,
        image: '/logo.png',
        order_id: order.id,
        prefill: {
          name: user.fullName || '',
          email: user.email || '',
          contact: user.phone || '9999999999'
        },
        remember_customer: false,
        theme: { color: '#F59E0B' },
        handler: async (response) => {
          try {
            setLoading(true);
            await verifyAndActivatePlan(
              response.razorpay_order_id,
              response.razorpay_payment_id,
              response.razorpay_signature
            );
          } catch (err) {
            setErrorMsg(err.response?.data?.message || 'Payment verification failed. Please contact support.');
            setLoading(false);
            setLoadingPlanId(null);
          }
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            setLoadingPlanId(null);
          },
          escape: false,
          backdropclose: false,
          confirm_close: true
        }
      };

      try {
        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', (response) => {
          setErrorMsg(response.error?.description || 'Payment was cancelled or failed.');
          setLoading(false);
          setLoadingPlanId(null);
        });
        rzp.open();
      } catch (rzpErr) {
        // Fallback to instant verification if Razorpay popup fails in browser sandbox
        console.warn('Razorpay popup prevented/failed. Activating test order directly:', rzpErr);
        await verifyAndActivatePlan(order.id, `pay_dev_${Date.now()}`);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to initiate purchase.');
      setLoading(false);
      setLoadingPlanId(null);
    }
  };

  const modalContent = (
    <AnimatePresence>
      <div className="fixed inset-0 z-[999999] flex items-center justify-center p-3 md:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/75 backdrop-blur-md z-[999999]"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 my-auto z-[1000000] max-h-[92vh] flex flex-col"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 p-6 text-white text-center relative shrink-0">
            <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all">
              <FiX className="w-5 h-5" />
            </button>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-black uppercase tracking-wider mb-2 backdrop-blur-sm">
              <LuCrown className="w-4 h-4 text-white" />
              B2C UPGRADE TO PRO PLAN
            </div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white drop-shadow-sm">
              Upgrade to Pro Plan for B2C users
            </h2>
            <p className="text-sm text-white/90 font-medium mt-1 max-w-xl mx-auto">
              Get Fastest Delivery, EMI options, and unlock Hire Designer, Contractor & Architect services.
            </p>

            {/* Quick Feature Icons */}
            <div className="flex items-center justify-center gap-4 mt-4 flex-wrap">
              {[
                { icon: FiZap, label: 'Fastest Delivery' },
                { icon: FiCreditCard, label: 'EMI Options' },
                { icon: LuPalette, label: 'Hire Designer' },
                { icon: LuHammer, label: 'Hire Contractor' },
                { icon: LuBuilding2, label: 'Hire Architect' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-1.5 text-white/90 text-xs font-bold">
                  <Icon className="w-4 h-4 text-white" />
                  {label}
                </div>
              ))}
            </div>
          </div>

          {/* Messages */}
          {errorMsg && (
            <div className="mx-6 mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold text-center">{errorMsg}</div>
          )}
          {successMsg && (
            <div className="mx-6 mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-bold text-center flex items-center justify-center gap-2">
              <FiCheck className="w-5 h-5 text-emerald-600" /> {successMsg}
            </div>
          )}

          {/* Plans Grid */}
          <div className="p-4 md:p-6 overflow-y-auto custom-scrollbar flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {activePlans.map((plan) => {
                const isSelected = selectedPlanId === plan.id;
                const isCurrentPlan = isB2CActive && currentPlanId === plan.id;
                const isDowngrade = isB2CActive && currentPlanPrice > -1 && plan.price < currentPlanPrice;
                const isBtnDisabled = loading || isCurrentPlan || isDowngrade;
                return (
                  <div
                    key={plan.id}
                    onClick={() => setSelectedPlanId(plan.id)}
                    className={`relative rounded-2xl p-5 border-2 transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? `${plan.border} shadow-xl scale-[1.02] bg-gradient-to-b from-white to-gray-50/50`
                        : 'border-gray-200 hover:border-gray-300 bg-white hover:shadow-md'
                    }`}
                  >
                    {/* Badges */}
                    {plan.popular && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-[10px] font-black uppercase tracking-wider px-3 py-0.5 rounded-full shadow-sm">
                        Most Popular 🔥
                      </span>
                    )}
                    {plan.bestValue && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-[10px] font-black uppercase tracking-wider px-3 py-0.5 rounded-full shadow-sm">
                        Best Value 👑
                      </span>
                    )}

                    <div>
                      {/* Plan Header */}
                      <div className="text-center pb-4 border-b border-gray-100">
                        <span className="text-2xl mb-1 block">{plan.emoji}</span>
                        <h3 className="text-lg font-black text-gray-900 tracking-tight">{plan.name}</h3>
                        <p className="text-[11px] font-semibold text-gray-500">{plan.billingCycle}</p>
                        <div className="mt-3">
                          <span className="text-2xl md:text-3xl font-black text-gray-900">{plan.displayPrice}</span>
                          <span className="text-xs text-gray-400 block font-medium mt-0.5">{plan.subText}</span>
                        </div>
                        {/* EMI badge */}
                        {plan.emiAvailable && (
                          <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 bg-green-50 text-green-700 rounded-full text-[10px] font-black border border-green-200">
                            <FiCreditCard className="w-3 h-3" />
                            EMI up to {plan.emiMonths} months
                          </span>
                        )}
                      </div>

                      {/* Feature Flags */}
                      <div className="mt-3 grid grid-cols-3 gap-1.5">
                        {[
                          { enabled: plan.fastestDelivery, label: '⚡ Fast', icon: FiTruck },
                          { enabled: plan.hireDesigner, label: '🎨 Design', icon: FiUser },
                          { enabled: plan.hireContractor, label: '👷 Build', icon: LuHammer },
                          { enabled: plan.hireArchitect, label: '🏛️ Arch', icon: LuBuilding2 },
                          { enabled: plan.emiAvailable, label: '💳 EMI', icon: FiCreditCard },
                        ].map(({ enabled, label }) => (
                          <span
                            key={label}
                            className={`text-center text-[9px] font-bold px-1 py-1 rounded-lg ${
                              enabled
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-gray-50 text-gray-300 border border-gray-100'
                            }`}
                          >
                            {label}
                          </span>
                        ))}
                      </div>

                      {/* Features List */}
                      <ul className="py-3 space-y-2">
                        {plan.features.map((feat, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-gray-700 font-medium leading-snug">
                            <FiCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Subscribe Button */}
                    <button
                      disabled={isBtnDisabled}
                      onClick={(e) => { e.stopPropagation(); if (!isBtnDisabled) handleSubscribe(plan); }}
                      className={`w-full mt-3 py-2.5 px-4 rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 ${
                        isCurrentPlan || isDowngrade 
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200 shadow-none' 
                          : plan.btnColor
                      } ${
                        loading ? 'opacity-50 cursor-not-allowed' : (isCurrentPlan || isDowngrade ? '' : 'active:scale-95')
                      }`}
                    >
                      {loading && loadingPlanId === plan.id ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          {isCurrentPlan ? (
                            <><FiCheck className="w-4 h-4" /> Current Plan</>
                          ) : isDowngrade ? (
                            <>Downgrade Not Allowed</>
                          ) : (
                            <><FiZap className="w-4 h-4" /> Subscribe {plan.name.replace(/[^a-zA-Z\s]/g, '').trim()}</>
                          )}
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Trust Bar */}
            <div className="mt-6 pt-4 border-t border-gray-100 flex flex-wrap items-center justify-center gap-6 text-gray-500 text-xs font-semibold">
              <span className="flex items-center gap-1.5"><FiShield className="text-amber-500" /> 100% Secure Razorpay Checkout</span>
              <span className="flex items-center gap-1.5"><FiTruck className="text-[#189D91]" /> Express Delivery Activated Instantly</span>
              <span className="flex items-center gap-1.5"><FiAward className="text-blue-500" /> Hire Professional Services Unlocked</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};

export default B2CSubscriptionModal;
