import React, { useState, useEffect } from 'react';
import PageWrapper from '../components/PageWrapper';
import api from '../../../shared/utils/api';
import {
  LuWallet,
  LuArrowUpRight,
  LuArrowDownLeft,
  LuDownload,
  LuClock,
  LuCheck,
  LuCircleAlert,
  LuBanknote,
  LuSmartphone
} from 'react-icons/lu';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';

const Wallet = () => {
  const [activeTab, setActiveTab] = useState('balance');
  const [walletData, setWalletData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState('bank');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [withdrawError, setWithdrawError] = useState('');

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, []);

  const fetchWallet = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/wallets/delivery/me');
      if (data.success) setWalletData(data.data);
    } catch (err) {
      console.error('Failed to fetch wallet:', err);
      toast.error('Failed to load wallet data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchWallet(); }, []);

  const walletBalance  = walletData?.earningsBalance ?? 0;
  const pendingAmount  = walletData?.codCollectionLiability ?? walletData?.pendingBalance ?? 0;
  const allTxns        = (walletData?.transactions ?? []).slice().reverse();
  const totalEarnings  = allTxns.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);

  const handleWithdraw = async (e) => {
    e.preventDefault();
    setWithdrawError('');
    const amount = parseFloat(withdrawAmount);

    if (isNaN(amount) || amount <= 0) { setWithdrawError('Please enter a valid amount'); return; }
    if (amount < 500)                  { setWithdrawError('Minimum withdrawal is ₹500'); return; }
    if (amount > walletBalance)        { setWithdrawError('Amount exceeds available balance'); return; }

    try {
      setIsSubmitting(true);
      const { data } = await api.post('/wallets/delivery/payout', { amount, method: withdrawMethod });
      if (data.success) {
        toast.success('Withdrawal request submitted successfully!');
        setWithdrawAmount('');
        setActiveTab('balance');
        fetchWallet();
      }
    } catch (err) {
      setWithdrawError(err.response?.data?.error || 'Failed to submit withdrawal request');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <PageWrapper>
        <div className="flex justify-center items-center py-40">
          <div className="w-10 h-10 border-4 border-[#2A458A] border-t-transparent rounded-full animate-spin" />
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className="max-w-5xl mx-auto space-y-8 pb-10">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-deep-espresso">Wallet</h1>
          <p className="text-warm-sand mt-2">Manage your earnings and withdrawals.</p>
        </div>

        {/* Balance Card */}
        <div className="bg-gradient-to-br from-deep-espresso to-warm-sand rounded-2xl p-8 text-white shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <p className="text-white/70 text-sm font-medium mb-2">Available Balance</p>
              <h2 className={`text-4xl md:text-5xl font-display font-bold ${walletBalance > 0 ? 'text-green-300' : 'text-white'}`}>
                ₹{walletBalance.toLocaleString()}
              </h2>
              <div className="flex gap-6 mt-4">
                <div>
                  <p className="text-white/60 text-xs">Total Earnings</p>
                  <p className="text-lg font-bold text-white">₹{totalEarnings.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-white/60 text-xs">Pending (COD)</p>
                  <p className="text-lg font-bold text-white">₹{pendingAmount.toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Bug 1 fix: Withdraw button now switches to withdraw tab */}
            <button
              onClick={() => setActiveTab('withdraw')}
              className="bg-white text-deep-espresso px-8 py-4 rounded-xl font-bold hover:bg-soft-oatmeal transition-colors flex items-center gap-2 shrink-0"
            >
              <LuDownload size={20} />
              Withdraw
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex p-1 bg-soft-oatmeal/30 rounded-2xl border border-soft-oatmeal w-fit">
          <button
            onClick={() => setActiveTab('balance')}
            className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all uppercase tracking-widest ${
              activeTab === 'balance'
                ? 'bg-deep-espresso text-white shadow-lg shadow-deep-espresso/10'
                : 'text-dusty-cocoa hover:text-deep-espresso'
            }`}
          >
            Transactions
          </button>
          <button
            onClick={() => setActiveTab('withdraw')}
            className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all uppercase tracking-widest ${
              activeTab === 'withdraw'
                ? 'bg-deep-espresso text-white shadow-lg shadow-deep-espresso/10'
                : 'text-dusty-cocoa hover:text-deep-espresso'
            }`}
          >
            Withdraw
          </button>
        </div>

        {/* Bug 4 fix: Real transactions from API, not hardcoded */}
        {activeTab === 'balance' ? (
          <div className="bg-white rounded-2xl shadow-sm border border-soft-oatmeal overflow-hidden">
            <div className="p-6 border-b border-soft-oatmeal">
              <h3 className="text-lg font-bold text-deep-espresso">Transaction History</h3>
            </div>

            {allTxns.length === 0 ? (
              <div className="p-14 text-center">
                <LuWallet size={36} className="mx-auto mb-3 text-slate-300" />
                <p className="text-sm font-semibold text-slate-400">No transactions yet</p>
                <p className="text-xs text-slate-300 mt-1">Completed deliveries will appear here</p>
              </div>
            ) : (
              <div className="divide-y divide-soft-oatmeal">
                {allTxns.map((txn, idx) => {
                  const isCredit = txn.amount > 0;
                  const shortId  = txn.referenceId
                    ? txn.referenceId.toString().slice(-6).toUpperCase()
                    : `${idx + 1}`;
                  const label    = txn.description
                    || (txn.type?.replace(/_/g, ' ') ?? 'Transaction');
                  const dateStr  = txn.createdAt
                    ? new Date(txn.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit', month: 'short', year: 'numeric'
                      })
                    : '—';
                  const isDone = ['cleared', 'completed', 'Completed'].includes(txn.status);

                  return (
                    <motion.div
                      key={txn._id || idx}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-6 hover:bg-soft-oatmeal/20 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4 min-w-0">
                          <div className={`w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center ${
                            isCredit ? 'bg-green-100 text-green-600' : 'bg-[#2A458A]/10 text-[#2A458A]'
                          }`}>
                            {isCredit ? <LuArrowDownLeft size={22} /> : <LuArrowUpRight size={22} />}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-deep-espresso capitalize truncate">{label}</p>
                            <p className="text-xs text-dusty-cocoa mt-0.5">#{shortId} · {dateStr}</p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className={`font-bold ${isCredit ? 'text-green-600' : 'text-[#2A458A]'}`}>
                            {isCredit ? '+' : '-'}₹{Math.abs(txn.amount).toLocaleString()}
                          </p>
                          <div className="flex items-center justify-end gap-1 mt-1">
                            {isDone
                              ? <LuCheck size={12} className="text-green-500" />
                              : <LuClock size={12} className="text-orange-500" />
                            }
                            <span className="text-xs text-dusty-cocoa capitalize">{txn.status || 'pending'}</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* Bug 5 fix: form wrapped, input scrolls into view on focus (avoids footer overlap on mobile) */
          /* Bug 6 fix: form onSubmit calls API  */
          /* Bug 7 fix: method selection has state + visual toggle */
          <div className="bg-white rounded-2xl shadow-sm border border-soft-oatmeal p-8">
            <h3 className="text-lg font-bold text-deep-espresso mb-6">Withdraw Funds</h3>
            <form onSubmit={handleWithdraw} className="space-y-6">

              <div>
                <label className="block text-sm font-bold text-deep-espresso mb-2">
                  Amount (₹) <span className="font-normal text-dusty-cocoa text-xs">— min ₹500</span>
                </label>
                <input
                  type="number"
                  min="500"
                  step="1"
                  placeholder="Enter amount"
                  value={withdrawAmount}
                  onChange={(e) => { setWithdrawAmount(e.target.value); setWithdrawError(''); }}
                  onFocus={(e) => {
                    // Bug 5: scroll input into view so mobile keyboard doesn't push footer over it
                    setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300);
                  }}
                  className="w-full px-4 py-3 border border-soft-oatmeal rounded-xl focus:outline-none focus:ring-2 focus:ring-warm-sand text-sm"
                />
                <p className="text-xs text-dusty-cocoa mt-2">
                  Available:{' '}
                  <span className={`font-bold ${walletBalance > 0 ? 'text-green-600' : 'text-slate-500'}`}>
                    ₹{walletBalance.toLocaleString()}
                  </span>
                </p>
              </div>

              <div>
                <label className="block text-sm font-bold text-deep-espresso mb-3">Withdrawal Method</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setWithdrawMethod('bank')}
                    className={`p-4 rounded-xl text-center border-2 transition-all ${
                      withdrawMethod === 'bank'
                        ? 'border-[#2A458A] bg-[#2A458A]/5'
                        : 'border-soft-oatmeal hover:border-warm-sand'
                    }`}
                  >
                    <LuBanknote size={24} className={`mx-auto mb-2 ${withdrawMethod === 'bank' ? 'text-[#2A458A]' : 'text-dusty-cocoa'}`} />
                    <p className={`text-sm font-bold ${withdrawMethod === 'bank' ? 'text-[#2A458A]' : 'text-deep-espresso'}`}>
                      Bank Transfer
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setWithdrawMethod('upi')}
                    className={`p-4 rounded-xl text-center border-2 transition-all ${
                      withdrawMethod === 'upi'
                        ? 'border-[#2A458A] bg-[#2A458A]/5'
                        : 'border-soft-oatmeal hover:border-warm-sand'
                    }`}
                  >
                    <LuSmartphone size={24} className={`mx-auto mb-2 ${withdrawMethod === 'upi' ? 'text-[#2A458A]' : 'text-dusty-cocoa'}`} />
                    <p className={`text-sm font-bold ${withdrawMethod === 'upi' ? 'text-[#2A458A]' : 'text-deep-espresso'}`}>
                      UPI
                    </p>
                  </button>
                </div>
              </div>

              {withdrawError && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-100 p-3 rounded-xl">
                  <LuCircleAlert size={16} className="shrink-0" />
                  <p className="text-sm font-semibold">{withdrawError}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-deep-espresso text-white py-4 rounded-xl font-bold hover:bg-warm-sand transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                {isSubmitting ? 'Processing...' : 'Request Withdrawal'}
              </button>
            </form>
          </div>
        )}
      </div>
    </PageWrapper>
  );
};

export default Wallet;
