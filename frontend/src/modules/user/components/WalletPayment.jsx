import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiLayers, FiInfo, FiAlertCircle } from 'react-icons/fi';
import { LuWallet } from 'react-icons/lu';
import toast from 'react-hot-toast';
import api from '../../../shared/utils/api';

const WalletPayment = ({ cartTotal, onPayWithWallet, isProcessing }) => {
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWalletBalance = async () => {
      try {
        const { data } = await api.get('/referrals/wallet');
        if (data.success && data.data) {
          setBalance(data.data.balance || 0);
        }
      } catch (err) {
        console.error('Failed to fetch wallet balance:', err);
        setBalance(0);
      } finally {
        setLoading(false);
      }
    };

    fetchWalletBalance();
  }, []);

  const hasSufficientBalance = balance >= cartTotal;

  const handleWalletPay = () => {
    if (!hasSufficientBalance) {
      toast.error(`Insufficient wallet balance. You have ₹${balance.toLocaleString('en-IN')}, but order total is ₹${cartTotal.toLocaleString('en-IN')}`, {
        duration: 5000,
        icon: <FiAlertCircle className="text-rose-500" />
      });
      return;
    }
    if (onPayWithWallet) {
      onPayWithWallet();
    }
  };

  return (
    <div className="p-4 md:p-6 bg-slate-50 rounded-2xl border border-gray-100 space-y-5">
      {/* Wallet Card Mockup */}
      <motion.div
        whileHover={{ scale: 1.01 }}
        className="w-full relative h-40 rounded-2xl bg-gradient-to-tr from-[#1E1B18] via-[#2F2925] to-[#1E1B18] p-5 text-white flex flex-col justify-between overflow-hidden shadow-md shadow-black/10"
      >
        {/* Subtle geometric circles */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-[#189D91]/10 rounded-full blur-xl pointer-events-none" />

        <div className="flex justify-between items-start z-10">
          <div>
            <p className="text-[8px] font-black tracking-widest text-[#189D91] uppercase">RIDDHA INTERIO</p>
            <p className="text-[6px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">EXCLUSIVE PRIVILEGES CARD</p>
          </div>
          <LuWallet className="text-2xl text-[#189D91]" />
        </div>

        <div className="z-10">
          {loading ? (
            <div className="h-8 w-24 bg-white/10 rounded animate-pulse" />
          ) : (
            <p className="text-2xl font-black tracking-wide">₹{balance.toLocaleString('en-IN')}</p>
          )}
          <p className="text-[7px] text-gray-400 font-bold uppercase tracking-widest mt-1">AVAILABLE BALANCE</p>
        </div>

        <div className="flex justify-between items-center z-10 text-[8px] font-bold text-gray-400 uppercase tracking-widest border-t border-white/5 pt-2.5">
          <span>ACTIVE CUSTOMER</span>
          <span className="text-[#189D91]">STATUS: ACTIVE</span>
        </div>
      </motion.div>

      {/* Pricing / Insufficient Notice */}
      <div className="space-y-3">
        <div className="flex items-center gap-2.5 p-3.5 bg-white border border-gray-200/60 rounded-xl">
          <FiInfo className="text-[#189D91] shrink-0" size={16} />
          <p className="text-[10px] text-gray-600 font-medium leading-relaxed">
            Order amount of <strong className="text-gray-900 font-bold">₹{cartTotal.toLocaleString('en-IN')}</strong> will be debited directly from your active wallet balance.
          </p>
        </div>

        {hasSufficientBalance ? (
          <button
            onClick={handleWalletPay}
            disabled={isProcessing || loading}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-md shadow-emerald-600/10 active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <span>{isProcessing ? 'PROCESSING WALLET DEBIT...' : `PAY ₹${cartTotal.toLocaleString('en-IN')} WITH WALLET`}</span>
          </button>
        ) : (
          <div className="space-y-2">
            <button
              disabled
              className="w-full py-4 bg-gray-200 text-gray-400 rounded-xl font-black text-xs uppercase tracking-widest cursor-not-allowed flex items-center justify-center gap-2"
            >
              <span>INSUFFICIENT WALLET BALANCE</span>
            </button>
            <p className="text-center text-[10px] text-rose-500 font-bold">
              You need ₹{Math.max(0, cartTotal - balance).toLocaleString('en-IN')} more to pay via wallet. Please choose Pay Online or COD.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WalletPayment;
