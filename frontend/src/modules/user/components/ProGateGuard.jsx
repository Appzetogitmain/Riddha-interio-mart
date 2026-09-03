import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiLock, FiZap, FiShield, FiArrowRight } from 'react-icons/fi';
import { LuCrown } from 'react-icons/lu';
import { useUser } from '../data/UserContext';
import SubscriptionModal from './SubscriptionModal';

const ProGateGuard = ({ children, title = "Pro AI Feature", description = "Upgrade your account to unlock this exclusive AI Interior tool." }) => {
  const { user } = useUser();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isProActive = user?.subscription?.status === 'active' && user?.subscription?.endDate && new Date(user.subscription.endDate) > new Date();

  if (isProActive) {
    return children;
  }

  return (
    <div className="relative min-h-[70vh] flex items-center justify-center p-4 md:p-8 bg-gradient-to-b from-gray-50 via-teal-50/20 to-white">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xl w-full bg-white rounded-3xl p-8 md:p-10 shadow-2xl border border-teal-100 text-center relative overflow-hidden"
      >
        {/* Background Accent */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-[#189D91]/10 rounded-full blur-2xl" />
        <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-amber-400/10 rounded-full blur-2xl" />

        {/* Lock Icon */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-amber-500/20 mb-5 relative">
          <FiLock size={28} />
          <span className="absolute -bottom-1 -right-1 bg-white text-amber-600 rounded-full p-0.5 shadow-sm">
            <LuCrown size={12} />
          </span>
        </div>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-black uppercase tracking-wider mb-3 border border-amber-200">
          <LuCrown className="w-3.5 h-3.5 text-amber-500" /> Riddha Pro Required
        </span>

        <h2 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight mb-3">
          {title}
        </h2>
        <p className="text-sm text-gray-600 font-medium leading-relaxed mb-6">
          {description}
        </p>

        {/* Quick Plan Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-8 text-left">
          <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 text-center">
            <span className="text-xs font-bold text-gray-400 block">🥈 Silver</span>
            <span className="text-sm font-black text-gray-900">₹1,999</span>
          </div>
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-center">
            <span className="text-xs font-bold text-amber-700 block">🥇 Gold</span>
            <span className="text-sm font-black text-amber-900">₹3,999</span>
          </div>
          <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 text-center">
            <span className="text-xs font-bold text-teal-700 block">💎 Platinum</span>
            <span className="text-sm font-black text-teal-900">₹6,999</span>
          </div>
          <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 text-center">
            <span className="text-xs font-bold text-purple-700 block">👑 Diamond</span>
            <span className="text-sm font-black text-purple-900">₹11,999</span>
          </div>
        </div>

        {/* Upgrade Call To Action */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#003d33] via-[#189D91] to-[#28a399] text-white font-black text-sm tracking-wide shadow-xl shadow-[#189D91]/25 hover:shadow-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 group"
        >
          <FiZap className="w-5 h-5 text-amber-300 group-hover:rotate-12 transition-transform" />
          Upgrade to Pro & Unlock Now
          <FiArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>

        <p className="text-[11px] font-semibold text-gray-400 mt-4 flex items-center justify-center gap-1.5">
          <FiShield className="w-3.5 h-3.5 text-[#189D91]" /> Instant Activation via Razorpay Secure Checkout
        </p>
      </motion.div>

      <SubscriptionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};

export default ProGateGuard;
