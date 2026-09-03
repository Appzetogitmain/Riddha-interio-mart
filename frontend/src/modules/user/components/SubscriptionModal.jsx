import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiCheck, FiZap, FiShield, FiStar, FiAward } from 'react-icons/fi';
import { LuCrown } from 'react-icons/lu';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../data/UserContext';
import api from '../../../shared/utils/api';

const PLANS = [
  {
    id: 'silver',
    name: 'SILVER',
    emoji: '🥈',
    badge: '🥈 SILVER',
    price: 1999,
    displayPrice: '₹1,999',
    billingCycle: 'Monthly',
    subText: 'Billed monthly',
    gradient: 'from-gray-100 via-slate-200 to-gray-300',
    border: 'border-gray-300',
    btnColor: 'bg-slate-700 hover:bg-slate-800 text-white',
    features: [
      'Access to AI Design Quiz & Persona',
      'AI Product Recommendations',
      'AI Cost Estimator Calculations',
      'Standard Quotation Generator'
    ]
  },
  {
    id: 'gold',
    name: 'GOLD',
    emoji: '🥇',
    badge: '🥇 GOLD',
    price: 3999,
    displayPrice: '₹3,999',
    billingCycle: 'Quarterly',
    subText: 'Billed every 3 months',
    popular: true,
    gradient: 'from-amber-100 via-yellow-200 to-amber-300',
    border: 'border-amber-400',
    btnColor: 'bg-amber-600 hover:bg-amber-700 text-white',
    features: [
      'All Silver Features Included',
      'AI Project Brief Generator',
      'BOQ Generator (Quantities & AI)',
      'Projects Studio Dashboard',
      'Save Unlimited AI Design Drafts'
    ]
  },
  {
    id: 'platinum',
    name: 'PLATINUM',
    emoji: '💎',
    badge: '💎 PLATINUM',
    price: 6999,
    displayPrice: '₹6,999',
    billingCycle: 'Half-Yearly',
    subText: 'Billed every 6 months',
    gradient: 'from-cyan-100 via-sky-200 to-blue-300',
    border: 'border-cyan-400',
    btnColor: 'bg-teal-600 hover:bg-teal-700 text-white',
    features: [
      'All Gold Features Included',
      'Priority Live GPS Order Tracking',
      'Priority RFQ & Special Pricing',
      'Export BOQs & Quotes to PDF',
      'Dedicated Interior Specialist Support'
    ]
  },
  {
    id: 'diamond',
    name: 'DIAMOND',
    emoji: '👑',
    badge: '👑 DIAMOND',
    price: 11999,
    displayPrice: '₹11,999',
    billingCycle: 'Yearly',
    subText: 'Billed annually (Best Savings)',
    bestValue: true,
    gradient: 'from-purple-100 via-fuchsia-200 to-pink-300',
    border: 'border-purple-400',
    btnColor: 'bg-purple-700 hover:bg-purple-800 text-white',
    features: [
      'Full VIP Unlocked Access to ALL AI Tools',
      'Save over 50% vs Monthly Billing',
      'Unlimited Project Briefs & BOQs',
      '1-on-1 VIP Interior Consultant Support',
      'Full Enterprise GST Invoicing'
    ]
  }
];

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const SubscriptionModal = ({ isOpen, onClose, defaultPlanId = 'gold' }) => {
  const { user, setUser } = useUser();
  const navigate = useNavigate();
  const [selectedPlanId, setSelectedPlanId] = useState(defaultPlanId);
  const [loading, setLoading] = useState(false);
  const [loadingPlanId, setLoadingPlanId] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [dynamicPlans, setDynamicPlans] = useState([]);

  useEffect(() => {
    if (defaultPlanId) setSelectedPlanId(defaultPlanId);
  }, [defaultPlanId]);

  useEffect(() => {
    if (isOpen) {
      api.get('/subscription/plans')
        .then(res => {
          if (res.data.success && res.data.plans?.length > 0) {
            setDynamicPlans(res.data.plans.map(p => ({
              id: p.id || p.planId,
              planId: p.id || p.planId,
              name: p.name,
              emoji: p.emoji || '👑',
              badge: p.badge || p.name,
              price: p.price,
              displayPrice: `₹${p.price.toLocaleString()}`,
              billingCycle: p.billingCycle,
              subText: p.description || `Billed ${p.billingCycle.toLowerCase()}`,
              popular: p.popular,
              bestValue: p.bestValue,
              border: p.popular ? 'border-amber-400' : p.bestValue ? 'border-purple-400' : 'border-gray-300',
              btnColor: p.popular ? 'bg-amber-600 hover:bg-amber-700 text-white' : p.bestValue ? 'bg-purple-700 hover:bg-purple-800 text-white' : 'bg-[#189D91] hover:bg-[#148379] text-white',
              features: p.features || []
            })));
          }
        })
        .catch(err => {
          console.error('Failed to fetch dynamic subscription plans:', err);
        });
    }
  }, [isOpen]);

  const activePlansList = dynamicPlans.length > 0 ? dynamicPlans : PLANS;

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

      // Create Razorpay Order
      const res = await api.post('/subscription/create-order', { planId: plan.id });
      if (!res.data.success) {
        throw new Error(res.data.message || 'Could not initiate subscription order.');
      }

      const { order, key } = res.data;

      // Handle sandbox mock order fallback
      if (order.id && order.id.startsWith('order_mock_')) {
        const verifyRes = await api.post('/subscription/verify-payment', {
          planId: plan.id,
          razorpay_order_id: order.id,
          razorpay_payment_id: `pay_mock_${Date.now()}`,
          razorpay_signature: 'mock_signature'
        });

        if (verifyRes.data.success) {
          setSuccessMsg(`🎉 Success! ${plan.name} Pro Subscription Activated!`);
          if (verifyRes.data.user) {
            const updatedUser = { ...user, subscription: verifyRes.data.user.subscription };
            setUser(updatedUser);
            localStorage.setItem('riddha_user', JSON.stringify(updatedUser));
          }
          setTimeout(() => {
            onClose();
          }, 2000);
        } else {
          setErrorMsg(verifyRes.data.message || 'Payment verification failed.');
        }
        setLoading(false);
        setLoadingPlanId(null);
        return;
      }

      const cleanPlanName = (plan.name || '').replace(/[^\w\s-]/gi, '').trim() || 'PRO';

      const options = {
        key: key || 'rzp_test_dummyKey',
        amount: order.amount,
        currency: order.currency,
        name: 'Riddha Interio Mart',
        description: `Pro Membership Upgrade - ${cleanPlanName}`,
        image: '/logo.png',
        order_id: order.id,
        prefill: {
          name: user.fullName || '',
          email: user.email || '',
          contact: user.phone || ''
        },
        theme: {
          color: '#189D91'
        },
        handler: async (response) => {
          try {
            setLoading(true);
            const verifyRes = await api.post('/subscription/verify-payment', {
              planId: plan.id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });

            if (verifyRes.data.success) {
              setSuccessMsg(`🎉 Success! ${plan.name} Pro Subscription Activated!`);
              if (verifyRes.data.user) {
                const updatedUser = { ...user, subscription: verifyRes.data.user.subscription };
                setUser(updatedUser);
                localStorage.setItem('riddha_user', JSON.stringify(updatedUser));
              }
              setTimeout(() => {
                onClose();
              }, 2000);
            } else {
              setErrorMsg(verifyRes.data.message || 'Payment verification failed.');
            }
          } catch (err) {
            console.error('Payment Verification error:', err);
            setErrorMsg(err.response?.data?.message || 'Payment verification failed. Please contact support.');
          } finally {
            setLoading(false);
            setLoadingPlanId(null);
          }
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            setLoadingPlanId(null);
          }
        }
      };

      const razorpayInstance = new window.Razorpay(options);
      razorpayInstance.open();
    } catch (err) {
      console.error('Subscription error:', err);
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to initiate purchase.');
      setLoading(false);
      setLoadingPlanId(null);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 md:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/65 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 my-auto z-10 max-h-[92vh] flex flex-col"
        >
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-[#003d33] via-[#189D91] to-[#28a399] p-6 text-white text-center relative shrink-0">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all"
            >
              <FiX className="w-5 h-5" />
            </button>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-xs font-bold uppercase tracking-wider mb-2 backdrop-blur-sm">
              <LuCrown className="w-4 h-4 text-amber-300" /> Unlock All AI Features
            </div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight">
              Upgrade to Riddha Pro Subscription
            </h2>
            <p className="text-sm text-teal-100 mt-1 max-w-xl mx-auto">
              Get full access to AI Design Persona, Project Brief Generator, BOQ Quantities, Cost Estimator & Pro Tools.
            </p>
          </div>

          {/* Feedback messages */}
          {errorMsg && (
            <div className="mx-6 mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold text-center">
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="mx-6 mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-bold text-center flex items-center justify-center gap-2">
              <FiCheck className="w-5 h-5 text-emerald-600" /> {successMsg}
            </div>
          )}

          {/* Plan Selection Grid */}
          <div className="p-4 md:p-6 overflow-y-auto custom-scrollbar flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {activePlansList.map((plan) => {
                const isSelected = selectedPlanId === plan.id;
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
                      </div>

                      {/* Features List */}
                      <ul className="py-4 space-y-2.5">
                        {plan.features.map((feat, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-gray-700 font-medium leading-snug">
                            <FiCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Action Button */}
                    <button
                      disabled={loading}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSubscribe(plan);
                      }}
                      className={`w-full mt-3 py-2.5 px-4 rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 ${plan.btnColor} ${
                        loading ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'
                      }`}
                    >
                      {loading && loadingPlanId === plan.id ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <FiZap className="w-4 h-4" /> Subscribe {plan.name}
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Guarantee Note */}
            <div className="mt-6 pt-4 border-t border-gray-100 flex flex-wrap items-center justify-center gap-6 text-gray-500 text-xs font-semibold">
              <span className="flex items-center gap-1.5"><FiShield className="text-[#189D91]" /> 100% Secure Razorpay Checkout</span>
              <span className="flex items-center gap-1.5"><FiStar className="text-amber-500" /> Instant AI Tools Access</span>
              <span className="flex items-center gap-1.5"><FiAward className="text-blue-500" /> Enterprise Support Included</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default SubscriptionModal;
