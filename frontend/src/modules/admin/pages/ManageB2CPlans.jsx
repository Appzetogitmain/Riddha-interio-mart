import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LuPlus, LuPencil, LuTrash2, LuCheck, LuX, LuZap, LuCrown,
  LuTruck, LuCreditCard, LuPalette, LuHammer, LuUser, LuBuilding2
} from 'react-icons/lu';
import api from '../../../shared/utils/api';
import toast from 'react-hot-toast';
import PageWrapper from '../components/PageWrapper';

const EMPTY_FORM = {
  planId: '',
  name: '',
  badge: '',
  emoji: '🚀',
  price: '',
  billingCycle: 'Monthly',
  durationDays: 30,
  emiAvailable: false,
  emiMonths: 0,
  fastestDelivery: false,
  hireDesigner: false,
  hireContractor: false,
  hireArchitect: false,
  popular: false,
  bestValue: false,
  description: '',
  featuresText: '',
  isActive: true,
  orderIndex: 0
};

const ManageB2CPlans = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ ...EMPTY_FORM });
  const [purchases, setPurchases] = useState([]);
  const [purchasesLoading, setPurchasesLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('plans');

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const res = await api.get('/b2c-subscription/admin/plans');
      if (res.data.success) setPlans(res.data.data);
    } catch (err) {
      toast.error('Failed to fetch B2C plans');
    } finally {
      setLoading(false);
    }
  };

  const fetchPurchases = async () => {
    try {
      setPurchasesLoading(true);
      const res = await api.get('/b2c-subscription/admin/purchases');
      if (res.data.success) setPurchases(res.data.data || []);
    } catch (err) {
      console.error('Fetch B2C purchases error:', err);
    } finally {
      setPurchasesLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
    fetchPurchases();
  }, []);

  const openModal = (plan = null) => {
    if (plan) {
      setEditingPlan(plan);
      setFormData({
        planId: plan.planId,
        name: plan.name,
        badge: plan.badge || plan.name,
        emoji: plan.emoji || '🚀',
        price: plan.price,
        billingCycle: plan.billingCycle || 'Monthly',
        durationDays: plan.durationDays || 30,
        emiAvailable: plan.emiAvailable || false,
        emiMonths: plan.emiMonths || 0,
        fastestDelivery: plan.fastestDelivery || false,
        hireDesigner: plan.hireDesigner || false,
        hireContractor: plan.hireContractor || false,
        hireArchitect: plan.hireArchitect || false,
        popular: plan.popular || false,
        bestValue: plan.bestValue || false,
        description: plan.description || '',
        featuresText: (plan.features || []).join('\n'),
        isActive: plan.isActive !== undefined ? plan.isActive : true,
        orderIndex: plan.orderIndex || 0
      });
    } else {
      setEditingPlan(null);
      setFormData({ ...EMPTY_FORM, orderIndex: plans.length + 1 });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.price || !formData.durationDays) {
      toast.error('Please fill Plan Name, Price, and Duration');
      return;
    }

    const payload = {
      ...formData,
      price: Number(formData.price),
      durationDays: Number(formData.durationDays),
      emiMonths: Number(formData.emiMonths),
      features: formData.featuresText.split('\n').map(f => f.trim()).filter(Boolean)
    };

    try {
      setSaving(true);
      if (editingPlan) {
        const res = await api.put(`/b2c-subscription/admin/plans/${editingPlan._id}`, payload);
        if (res.data.success) toast.success('B2C plan updated successfully!');
      } else {
        const res = await api.post('/b2c-subscription/admin/plans', payload);
        if (res.data.success) toast.success('New B2C plan created successfully!');
      }
      setIsModalOpen(false);
      fetchPlans();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save B2C plan');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (plan) => {
    if (!window.confirm(`Delete plan "${plan.name}"?`)) return;
    try {
      const res = await api.delete(`/b2c-subscription/admin/plans/${plan._id}`);
      if (res.data.success) { toast.success('Plan deleted'); fetchPlans(); }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete plan');
    }
  };

  const toggleActive = async (plan) => {
    try {
      const res = await api.put(`/b2c-subscription/admin/plans/${plan._id}`, { isActive: !plan.isActive });
      if (res.data.success) { toast.success(`Plan ${!plan.isActive ? 'activated' : 'deactivated'}`); fetchPlans(); }
    } catch { toast.error('Failed to toggle status'); }
  };

  const ToggleField = ({ label, field, icon: Icon }) => (
    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-700 select-none">
      <div
        onClick={() => setFormData({ ...formData, [field]: !formData[field] })}
        className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer ${formData[field] ? 'bg-[#189D91]' : 'bg-gray-200'}`}
      >
        <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${formData[field] ? 'translate-x-5' : 'translate-x-0'}`} />
      </div>
      {Icon && <Icon className="w-4 h-4 text-gray-500" />}
      {label}
    </label>
  );

  return (
    <PageWrapper>
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-orange-100 text-orange-600">
                <LuCrown className="w-6 h-6" />
              </span>
              <div>
                <h1 className="text-2xl font-black text-gray-900">B2C Subscription Plans</h1>
                <p className="text-xs text-gray-500 mt-0.5">Manage customer plans — Fastest Delivery, EMI, Hire Designer/Contractor/Architect</p>
              </div>
            </div>
            <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-orange-50 text-orange-700 rounded-full text-[10px] font-black border border-orange-200">
              ⚡ Separate from AI/Enterpriser Subscription Plans
            </div>
          </div>
          <button
            onClick={() => openModal()}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all active:scale-95 shrink-0"
          >
            <LuPlus className="w-5 h-5" /> Add B2C Plan
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 bg-white p-2 rounded-xl border border-gray-100 shadow-sm w-fit">
          {[
            { key: 'plans', label: 'Plans' },
            { key: 'purchases', label: `Purchases (${purchases.length})` }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === tab.key ? 'bg-orange-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Plans Tab */}
        {activeTab === 'plans' && (
          <>
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" />
              </div>
            ) : plans.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
                <LuCrown className="w-12 h-12 text-orange-400 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-gray-800">No B2C Plans Found</h3>
                <p className="text-sm text-gray-500 mb-4">Create your first B2C customer plan.</p>
                <button onClick={() => openModal()} className="px-4 py-2 bg-orange-500 text-white font-bold text-xs rounded-lg">
                  Create Plan
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {plans.map((plan) => (
                  <motion.div
                    key={plan._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`bg-white rounded-2xl border-2 p-5 flex flex-col justify-between relative shadow-sm hover:shadow-md transition-all ${
                      plan.isActive ? 'border-gray-200' : 'border-red-200 bg-red-50/20 opacity-75'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                        plan.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {plan.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                      <div className="flex gap-1">
                        {plan.popular && <span className="bg-amber-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">POPULAR</span>}
                        {plan.bestValue && <span className="bg-purple-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">BEST VALUE</span>}
                      </div>
                    </div>

                    <div className="text-center pb-4 border-b border-gray-100">
                      <span className="text-3xl block mb-1">{plan.emoji || '🚀'}</span>
                      <h3 className="text-lg font-black text-gray-900">{plan.name}</h3>
                      <span className="text-xs font-bold text-gray-400">{plan.billingCycle} ({plan.durationDays} Days)</span>
                      <div className="text-2xl font-black text-gray-900 mt-2">₹{plan.price.toLocaleString()}</div>
                    </div>

                    {/* B2C Feature Flags */}
                    <div className="mt-3 grid grid-cols-3 gap-1.5">
                      {[
                        { key: 'fastestDelivery', icon: LuTruck, label: 'Fast' },
                        { key: 'emiAvailable', icon: LuCreditCard, label: 'EMI' },
                        { key: 'hireDesigner', icon: LuPalette, label: 'Designer' },
                        { key: 'hireContractor', icon: LuHammer, label: 'Contractor' },
                        { key: 'hireArchitect', icon: LuBuilding2, label: 'Architect' },
                      ].map(({ key, icon: Icon, label }) => (
                        <span key={key} className={`text-center py-1 rounded-lg text-[9px] font-bold border ${
                          plan[key] ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-50 text-gray-300 border-gray-100'
                        }`}>
                          {label}
                        </span>
                      ))}
                    </div>

                    <ul className="space-y-1.5 mt-3">
                      {(plan.features || []).slice(0, 3).map((feat, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-[11px] text-gray-600 font-medium">
                          <LuCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          <span className="line-clamp-1">{feat}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="pt-4 border-t border-gray-100 flex items-center justify-between gap-2 mt-3">
                      <button
                        onClick={() => toggleActive(plan)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors ${
                          plan.isActive ? 'border-gray-200 text-gray-600 hover:bg-gray-100' : 'border-emerald-200 text-emerald-700 bg-emerald-50'
                        }`}
                      >
                        {plan.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <div className="flex gap-1">
                        <button onClick={() => openModal(plan)} className="p-2 text-gray-600 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors">
                          <LuPencil size={16} />
                        </button>
                        <button onClick={() => handleDelete(plan)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <LuTrash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Purchases Tab */}
        {activeTab === 'purchases' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                  <LuZap className="text-orange-500" /> B2C Purchase History
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">All customer B2C plan purchases with Razorpay audit IDs</p>
              </div>
              <span className="px-3 py-1 bg-orange-50 text-orange-600 rounded-full text-xs font-bold border border-orange-100">
                Total: {purchases.length}
              </span>
            </div>

            {purchasesLoading ? (
              <div className="flex justify-center py-10"><div className="animate-spin h-8 w-8 rounded-full border-b-2 border-orange-500" /></div>
            ) : purchases.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-xs font-semibold">No B2C subscription purchases yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-gray-500 font-bold uppercase tracking-wider text-[10px] border-b border-gray-100">
                    <tr>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">Plan</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Features Unlocked</th>
                      <th className="py-3 px-4">Status / Validity</th>
                      <th className="py-3 px-4">Razorpay IDs</th>
                      <th className="py-3 px-4">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 font-medium text-gray-700">
                    {purchases.map((sub) => {
                      const u = sub.user || {};
                      const isExp = new Date(sub.endDate) < new Date();
                      return (
                        <tr key={sub._id} className="hover:bg-gray-50/60 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-bold text-gray-900">{u.fullName || 'User'}</div>
                            <div className="text-[11px] text-gray-400">{u.email}</div>
                            {u.phone && <div className="text-[10px] text-gray-400">{u.phone}</div>}
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-extrabold text-slate-800">{sub.planName}</span>
                            <span className="text-[10px] text-gray-400 block">{sub.billingCycle} ({sub.durationDays}d)</span>
                          </td>
                          <td className="py-3 px-4 font-black text-gray-900">
                            ₹{sub.price?.toLocaleString() || 0}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex flex-wrap gap-1">
                              {sub.fastestDelivery && <span className="bg-orange-50 text-orange-600 border border-orange-200 text-[9px] font-bold px-1.5 py-0.5 rounded">⚡ Fast</span>}
                              {sub.hireDesigner && <span className="bg-pink-50 text-pink-600 border border-pink-200 text-[9px] font-bold px-1.5 py-0.5 rounded">🎨 Designer</span>}
                              {sub.hireContractor && <span className="bg-blue-50 text-blue-600 border border-blue-200 text-[9px] font-bold px-1.5 py-0.5 rounded">👷 Contractor</span>}
                              {sub.hireArchitect && <span className="bg-indigo-50 text-indigo-600 border border-indigo-200 text-[9px] font-bold px-1.5 py-0.5 rounded">🏛️ Architect</span>}
                              {sub.emiAvailable && <span className="bg-green-50 text-green-600 border border-green-200 text-[9px] font-bold px-1.5 py-0.5 rounded">💳 EMI</span>}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                              isExp ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                            }`}>
                              {isExp ? 'EXPIRED' : 'ACTIVE'}
                            </span>
                            <div className="text-[10px] text-gray-500 mt-1">
                              Ends: {new Date(sub.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </div>
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px] text-gray-600">
                            <div>{sub.razorpayPaymentId || 'N/A'}</div>
                            <div className="text-[9px] text-gray-400">Ord: {sub.razorpayOrderId || 'N/A'}</div>
                          </td>
                          <td className="py-3 px-4 text-gray-500 font-medium">
                            {new Date(sub.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Create / Edit Modal */}
        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 overflow-y-auto">
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setIsModalOpen(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 z-10 p-6 md:p-8 my-auto"
              >
                <div className="flex justify-between items-center pb-4 border-b border-gray-100 mb-5">
                  <div className="flex items-center gap-2">
                    <LuCrown className="w-5 h-5 text-orange-500" />
                    <h2 className="text-xl font-black text-gray-900">
                      {editingPlan ? 'Edit B2C Plan' : 'Create New B2C Plan'}
                    </h2>
                  </div>
                  <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-full text-gray-400 hover:bg-gray-100">
                    <LuX size={20} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-gray-600 uppercase tracking-wider mb-1">Plan ID / Slug *</label>
                      <input
                        type="text" required disabled={!!editingPlan}
                        placeholder="e.g. b2c-silver"
                        value={formData.planId}
                        onChange={e => setFormData({ ...formData, planId: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-orange-400 disabled:bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-gray-600 uppercase tracking-wider mb-1">Display Name *</label>
                      <input
                        type="text" required
                        placeholder="e.g. 🥈 SILVER"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-orange-400"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-gray-600 uppercase tracking-wider mb-1">Price (₹) *</label>
                      <input
                        type="number" required min="0"
                        value={formData.price}
                        onChange={e => setFormData({ ...formData, price: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-orange-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-gray-600 uppercase tracking-wider mb-1">Billing Cycle</label>
                      <select
                        value={formData.billingCycle}
                        onChange={e => setFormData({ ...formData, billingCycle: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-orange-400"
                      >
                        <option>Monthly</option>
                        <option>Quarterly</option>
                        <option>Half-Yearly</option>
                        <option>Yearly</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-gray-600 uppercase tracking-wider mb-1">Duration (Days) *</label>
                      <input
                        type="number" required min="1"
                        value={formData.durationDays}
                        onChange={e => setFormData({ ...formData, durationDays: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-orange-400"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-gray-600 uppercase tracking-wider mb-1">Emoji Icon</label>
                      <input
                        type="text"
                        placeholder="🥈, 🥇, 💎, 👑"
                        value={formData.emoji}
                        onChange={e => setFormData({ ...formData, emoji: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-gray-600 uppercase tracking-wider mb-1">EMI Months (0 = no EMI)</label>
                      <input
                        type="number" min="0"
                        value={formData.emiMonths}
                        onChange={e => setFormData({ ...formData, emiMonths: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-orange-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-gray-600 uppercase tracking-wider mb-1">Short Description</label>
                    <input
                      type="text"
                      placeholder="Brief tagline for plan..."
                      value={formData.description}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-gray-600 uppercase tracking-wider mb-1">Features (1 per line)</label>
                    <textarea
                      rows={4}
                      placeholder="⚡ Fastest Express Delivery&#10;💳 EMI in 3 months&#10;🎨 Hire Designer"
                      value={formData.featuresText}
                      onChange={e => setFormData({ ...formData, featuresText: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400"
                    />
                  </div>

                  {/* B2C Feature Flags */}
                  <div>
                    <p className="text-[10px] font-black text-gray-600 uppercase tracking-wider mb-3">B2C Feature Flags (shown to customer)</p>
                    <div className="grid grid-cols-2 gap-3 p-4 bg-orange-50/50 rounded-xl border border-orange-100">
                      <ToggleField label="Fastest Delivery" field="fastestDelivery" icon={LuTruck} />
                      <ToggleField label="EMI Available" field="emiAvailable" icon={LuCreditCard} />
                      <ToggleField label="Hire Designer" field="hireDesigner" icon={LuPalette} />
                      <ToggleField label="Hire Contractor" field="hireContractor" icon={LuHammer} />
                      <ToggleField label="Hire Architect" field="hireArchitect" icon={LuBuilding2} />
                    </div>
                  </div>

                  {/* Display Flags */}
                  <div className="flex flex-wrap gap-4 pt-1">
                    <ToggleField label="Most Popular Badge" field="popular" />
                    <ToggleField label="Best Value Badge" field="bestValue" />
                    <ToggleField label="Active for Users" field="isActive" />
                  </div>

                  <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-5 py-2.5 rounded-xl border border-gray-200 font-bold text-xs text-gray-600 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
                    >
                      {saving ? 'Saving...' : editingPlan ? 'Update Plan' : 'Create Plan'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </PageWrapper>
  );
};

export default ManageB2CPlans;
