import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiCheck, FiZap, FiShield, FiArrowLeft, FiTruck, FiCreditCard,
  FiUser, FiChevronDown, FiChevronUp
} from 'react-icons/fi';
import { LuCrown, LuHammer, LuPalette, LuSparkles, LuBuilding2 } from 'react-icons/lu';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../data/UserContext';
import B2CSubscriptionModal from '../components/B2CSubscriptionModal';
import api from '../../../shared/utils/api';

const FALLBACK_PLANS = [
  {
    id: 'b2c-silver', name: '🥈 SILVER', emoji: '🥈', price: 1999,
    displayPrice: '₹1,999', billingCycle: 'Monthly', subText: 'Billed monthly',
    emiAvailable: true, emiMonths: 3, fastestDelivery: true,
    hireDesigner: true, hireContractor: false, hireArchitect: false,
    popular: false, bestValue: false,
    color: 'from-slate-100 to-gray-200', accent: '#64748b',
    features: ['⚡ Fastest Express Delivery (24-48h)', '💳 Flexible EMI – 3 months', '🎨 Hire Verified Designers', '🚚 Priority Order Processing', '📞 Priority Customer Support']
  },
  {
    id: 'b2c-gold', name: '🥇 GOLD', emoji: '🥇', price: 3999,
    displayPrice: '₹3,999', billingCycle: 'Quarterly', subText: 'Billed every 3 months',
    emiAvailable: true, emiMonths: 6, fastestDelivery: true,
    hireDesigner: true, hireContractor: true, hireArchitect: false,
    popular: true, bestValue: false,
    color: 'from-amber-100 to-yellow-200', accent: '#d97706',
    features: ['⚡ All Silver Features Included', '👷 Hire Certified Contractors', '💳 0% Interest EMI – 6 months', '🎁 Exclusive B2C Member Discounts', '📦 Zero Delivery & Handling Fees']
  },
  {
    id: 'b2c-platinum', name: '💎 PLATINUM', emoji: '💎', price: 6999,
    displayPrice: '₹6,999', billingCycle: 'Half-Yearly', subText: 'Billed every 6 months',
    emiAvailable: true, emiMonths: 12, fastestDelivery: true,
    hireDesigner: true, hireContractor: true, hireArchitect: true,
    popular: false, bestValue: false,
    color: 'from-cyan-100 to-teal-200', accent: '#0891b2',
    features: ['⚡ All Gold Features Included', '🏛️ Hire Professional Architects', '💳 EMI up to 12 months', '🌟 VIP Priority Order Dispatch', '🛎️ Dedicated Personal Shopping Assistant']
  },
  {
    id: 'b2c-diamond', name: '👑 DIAMOND', emoji: '👑', price: 11999,
    displayPrice: '₹11,999', billingCycle: 'Yearly', subText: 'Billed annually — Best Value',
    emiAvailable: true, emiMonths: 24, fastestDelivery: true,
    hireDesigner: true, hireContractor: true, hireArchitect: true,
    popular: false, bestValue: true,
    color: 'from-purple-100 to-fuchsia-200', accent: '#7c3aed',
    features: ['👑 Full VIP: All Hire Services Unlocked', '⚡ Same-Day Order Dispatch', '💳 0% Interest EMI – 24 months', '🎉 Zero Delivery Fees (1 Full Year)', '🏆 Save over 50% vs Monthly Billing']
  }
];

const FAQ = [
  {
    q: 'What is Fastest Delivery?',
    a: 'Pro members get priority dispatch with 24–48 hour delivery across all pincode zones, while standard delivery can take 5–7 business days.'
  },
  {
    q: 'How do EMI options work?',
    a: 'After subscribing, at checkout you can pay your product orders in easy monthly installments at 0% interest (bank EMI). Plans unlock 3 to 24 months of EMI based on tier.'
  },
  {
    q: 'How do I Hire a Designer / Contractor / Architect?',
    a: 'Once subscribed, Hire Designer, Hire Contractor, and Hire Architect options appear on your profile. Click them to fill a brief — our verified professionals will connect with you within 24 hours.'
  },
  {
    q: 'Can I upgrade my plan later?',
    a: 'Yes! You can upgrade anytime. If you still have time left on your current plan, the new plan duration will be added on top (stacking).'
  },
  {
    q: 'Is payment secure?',
    a: 'Yes — all payments are processed via Razorpay with bank-grade 256-bit SSL encryption. Your card details are never stored on our servers.'
  }
];

const SubscriptionPlansPage = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState('b2c-gold');
  const [openFaq, setOpenFaq] = useState(null);

  const isB2CActive = user?.b2cSubscription?.status === 'active' &&
    user?.b2cSubscription?.endDate &&
    new Date(user.b2cSubscription.endDate) > new Date();

  const daysRemaining = isB2CActive
    ? Math.max(0, Math.ceil((new Date(user.b2cSubscription.endDate) - new Date()) / (1000 * 60 * 60 * 24)))
    : 0;

  useEffect(() => {
    api.get('/b2c-subscription/plans')
      .then(res => {
        if (res.data.success && res.data.plans?.length > 0) {
          setPlans(res.data.plans.map((p, idx) => ({
            ...FALLBACK_PLANS[idx] || {},
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
            features: p.features || []
          })));
        } else {
          setPlans(FALLBACK_PLANS);
        }
      })
      .catch(() => setPlans(FALLBACK_PLANS))
      .finally(() => setLoading(false));
  }, []);

  const handleSelectPlan = (planId) => {
    setSelectedPlanId(planId);
    setModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 via-amber-50/50 to-white pb-24">
      {/* Hero Header */}
      <div className="relative bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-400 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white rounded-full translate-y-1/2 -translate-x-1/2" />
        </div>

        <div className="relative z-10 px-4 pt-10 pb-12 md:px-8 max-w-5xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-white/80 hover:text-white text-xs font-bold mb-6 transition-colors"
          >
            <FiArrowLeft className="w-4 h-4" /> Back
          </button>

          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 text-white text-xs font-black uppercase tracking-wider mb-4 backdrop-blur-sm">
            <LuCrown className="w-4 h-4" />
            B2C UPGRADE TO PRO PLAN
            <span className="bg-white text-orange-600 text-[9px] font-black px-2 py-0.5 rounded-full ml-1">UPGRADE AVAILABLE</span>
          </div>

          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white drop-shadow mb-3">
            Upgrade to Pro Plan for B2C users
          </h1>
          <p className="text-white/90 font-medium text-sm md:text-base max-w-xl">
            Unlock Fastest Delivery, EMI options, and Hire verified Designer, Contractor & Architect professionals for your interior project.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-3 mt-6">
            {[
              { icon: FiZap, label: 'Fastest Delivery' },
              { icon: FiCreditCard, label: 'EMI Options' },
              { icon: LuPalette, label: 'Hire Designer' },
              { icon: LuHammer, label: 'Hire Contractor' },
              { icon: LuBuilding2, label: 'Hire Architect' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-white text-xs font-bold border border-white/30">
                <Icon className="w-4 h-4" />
                {label}
              </div>
            ))}
          </div>

          {/* Active subscription status */}
          {isB2CActive && (
            <div className="mt-5 inline-flex items-center gap-2 bg-white/20 backdrop-blur px-4 py-2 rounded-xl text-white text-sm font-bold border border-white/30">
              <LuSparkles className="w-4 h-4 text-yellow-200" />
              <span>Active: <strong>{user.b2cSubscription?.planName}</strong> — {daysRemaining} days remaining</span>
            </div>
          )}
        </div>
      </div>

      {/* Plans Grid */}
      <div className="max-w-5xl mx-auto px-4 md:px-8 -mt-8 relative z-10">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {plans.map((plan, idx) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`relative bg-white rounded-3xl shadow-xl border-2 overflow-hidden flex flex-col ${
                  plan.popular ? 'border-amber-400 ring-2 ring-amber-400/30' :
                  plan.bestValue ? 'border-purple-400 ring-2 ring-purple-400/30' :
                  'border-gray-200'
                }`}
              >
                {/* Top badge */}
                {plan.popular && (
                  <div className="bg-amber-500 text-white text-center text-[10px] font-black uppercase tracking-wider py-1.5">
                    🔥 Most Popular
                  </div>
                )}
                {plan.bestValue && (
                  <div className="bg-purple-600 text-white text-center text-[10px] font-black uppercase tracking-wider py-1.5">
                    👑 Best Value — Save 50%+
                  </div>
                )}

                {/* Plan color bar */}
                <div className={`h-2 bg-gradient-to-r ${plan.color}`} />

                <div className="p-5 flex flex-col flex-1">
                  {/* Header */}
                  <div className="text-center mb-4 pb-4 border-b border-gray-100">
                    <span className="text-4xl block mb-2">{plan.emoji}</span>
                    <h2 className="text-xl font-black text-gray-900">{plan.name.replace(/[^a-zA-Z\s]/g, '').trim()}</h2>
                    <p className="text-xs text-gray-400 font-semibold mt-0.5">{plan.billingCycle}</p>
                    <div className="mt-3">
                      <span className="text-3xl font-black text-gray-900">{plan.displayPrice}</span>
                      <span className="text-xs text-gray-400 block mt-0.5">{plan.subText}</span>
                    </div>

                    {/* EMI Badge */}
                    {plan.emiAvailable && (
                      <div className="mt-3 inline-flex items-center gap-1.5 bg-green-50 text-green-700 border border-green-200 rounded-full px-3 py-1 text-[11px] font-black">
                        <FiCreditCard className="w-3.5 h-3.5" />
                        EMI up to {plan.emiMonths} months
                      </div>
                    )}
                  </div>

                  {/* Feature Unlock Grid */}
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {[
                      { enabled: plan.fastestDelivery, icon: FiZap, label: 'Fastest Delivery', color: 'bg-orange-50 text-orange-700 border-orange-200' },
                      { enabled: plan.emiAvailable, icon: FiCreditCard, label: 'EMI Options', color: 'bg-green-50 text-green-700 border-green-200' },
                      { enabled: plan.hireDesigner, icon: LuPalette, label: 'Hire Designer', color: 'bg-pink-50 text-pink-700 border-pink-200' },
                      { enabled: plan.hireContractor, icon: LuHammer, label: 'Hire Contractor', color: 'bg-blue-50 text-blue-700 border-blue-200' },
                      { enabled: plan.hireArchitect, icon: LuBuilding2, label: 'Hire Architect', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
                    ].map(({ enabled, icon: Icon, label, color }) => (
                      <div
                        key={label}
                        className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border text-[10px] font-bold ${
                          enabled ? color : 'bg-gray-50 text-gray-300 border-gray-100'
                        }`}
                      >
                        {enabled ? <Icon className="w-3.5 h-3.5 shrink-0" /> : <FiShield className="w-3.5 h-3.5 shrink-0 text-gray-200" />}
                        <span className="truncate">{label}</span>
                      </div>
                    ))}
                  </div>

                  {/* Features */}
                  <ul className="space-y-2 flex-1">
                    {plan.features.map((feat, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-gray-700 font-medium leading-snug">
                        <FiCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Subscribe Button */}
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleSelectPlan(plan.id)}
                    className={`w-full mt-5 py-3.5 px-4 rounded-2xl font-black text-sm shadow-lg transition-all flex items-center justify-center gap-2 ${
                      plan.popular ? 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-white shadow-amber-200' :
                      plan.bestValue ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 text-white shadow-purple-200' :
                      'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 text-white shadow-orange-200'
                    }`}
                  >
                    <FiZap className="w-4 h-4" />
                    Upgrade to {plan.name.replace(/[^a-zA-Z\s]/g, '').trim()}
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Hire Services Section */}
      <div className="max-w-5xl mx-auto px-4 md:px-8 mt-12">
        <div className="text-center mb-8">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-orange-100 text-orange-700 rounded-full text-xs font-black uppercase tracking-wider">
            <LuSparkles className="w-3.5 h-3.5" /> Unlocked After Purchase
          </span>
          <h2 className="text-2xl md:text-3xl font-black text-gray-900 mt-3">What you get access to</h2>
          <p className="text-gray-500 text-sm mt-1 font-medium">These services appear on your profile after subscribing</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            {
              icon: LuPalette,
              title: 'Hire Designer',
              desc: 'Connect with verified interior designers who will transform your space. Upload your room photos and get personalised design proposals within 24–48 hours.',
              badge: 'Silver+',
              color: 'from-pink-50 to-rose-50',
              border: 'border-pink-200',
              iconBg: 'bg-pink-100 text-pink-600',
              plan: 'Silver Plan or above'
            },
            {
              icon: LuHammer,
              title: 'Hire Contractor',
              desc: 'Hire certified and background-verified contractors for renovation, civil work, and installation. Get competitive quotes and tracked project timelines.',
              badge: 'Gold+',
              color: 'from-blue-50 to-indigo-50',
              border: 'border-blue-200',
              iconBg: 'bg-blue-100 text-blue-600',
              plan: 'Gold Plan or above'
            },
            {
              icon: LuBuilding2,
              title: 'Hire Architect',
              desc: 'Work with licensed architects for floor plans, structural designs, and complete project blueprints. Perfect for new constructions and full renovations.',
              badge: 'Platinum+',
              color: 'from-indigo-50 to-purple-50',
              border: 'border-indigo-200',
              iconBg: 'bg-indigo-100 text-indigo-600',
              plan: 'Platinum Plan or above'
            }
          ].map(({ icon: Icon, title, desc, badge, color, border, iconBg, plan }) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-gradient-to-br ${color} rounded-2xl border ${border} p-6 shadow-sm hover:shadow-md transition-all`}
            >
              <div className={`w-12 h-12 rounded-2xl ${iconBg} flex items-center justify-center mb-4 shadow-sm`}>
                <Icon className="w-6 h-6" />
              </div>
              <span className="inline-block px-2.5 py-0.5 bg-white/80 text-xs font-black text-gray-700 rounded-full border border-gray-200 mb-2">
                {badge}
              </span>
              <h3 className="text-lg font-black text-gray-900 mb-2">{title}</h3>
              <p className="text-sm text-gray-600 font-medium leading-relaxed">{desc}</p>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mt-3">Requires: {plan}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* FAQ Section */}
      <div className="max-w-3xl mx-auto px-4 md:px-8 mt-12">
        <h2 className="text-2xl font-black text-gray-900 mb-6 text-center">Frequently Asked Questions</h2>
        <div className="space-y-3">
          {FAQ.map((item, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between px-5 py-4 text-left"
              >
                <span className="text-sm font-bold text-gray-900">{item.q}</span>
                {openFaq === i ? <FiChevronUp className="w-4 h-4 text-amber-500 shrink-0" /> : <FiChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
              </button>
              <AnimatePresence>
                {openFaq === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <p className="px-5 pb-4 text-sm text-gray-600 font-medium leading-relaxed border-t border-gray-50 pt-3">
                      {item.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>

      {/* Sticky CTA */}
      <div className="fixed bottom-20 md:bottom-6 left-0 right-0 flex justify-center z-30 px-4">
        <motion.button
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 text-white font-black text-sm rounded-2xl shadow-2xl shadow-orange-300/40 hover:shadow-3xl hover:scale-105 active:scale-95 transition-all"
        >
          <LuCrown className="w-5 h-5 text-white" />
          Upgrade to Pro Plan
          <FiZap className="w-5 h-5 text-yellow-200" />
        </motion.button>
      </div>

      {/* B2C Subscription Modal */}
      <B2CSubscriptionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        defaultPlanId={selectedPlanId}
      />
    </div>
  );
};

export default SubscriptionPlansPage;
