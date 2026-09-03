import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LuPlus, LuPencil, LuTrash2, LuCheck, LuX, LuZap, LuCrown, LuShieldAlert, LuStar, LuSparkles } from 'react-icons/lu';
import api from '../../../shared/utils/api';
import toast from 'react-hot-toast';
import PageWrapper from '../components/PageWrapper';

const ManageProPlans = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    planId: '',
    name: '',
    badge: '',
    emoji: '👑',
    price: '',
    billingCycle: 'Monthly',
    durationDays: 30,
    popular: false,
    bestValue: false,
    description: '',
    featuresText: '',
    isActive: true,
    orderIndex: 0
  });

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const res = await api.get('/subscription/admin/plans');
      if (res.data.success) {
        setPlans(res.data.data);
      }
    } catch (err) {
      console.error('Fetch plans error:', err);
      toast.error('Failed to fetch subscription plans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const openModal = (plan = null) => {
    if (plan) {
      setEditingPlan(plan);
      setFormData({
        planId: plan.planId,
        name: plan.name,
        badge: plan.badge || plan.name,
        emoji: plan.emoji || '👑',
        price: plan.price,
        billingCycle: plan.billingCycle || 'Monthly',
        durationDays: plan.durationDays || 30,
        popular: plan.popular || false,
        bestValue: plan.bestValue || false,
        description: plan.description || '',
        featuresText: (plan.features || []).join('\n'),
        isActive: plan.isActive !== undefined ? plan.isActive : true,
        orderIndex: plan.orderIndex || 0
      });
    } else {
      setEditingPlan(null);
      setFormData({
        planId: '',
        name: '',
        badge: '',
        emoji: '👑',
        price: '',
        billingCycle: 'Monthly',
        durationDays: 30,
        popular: false,
        bestValue: false,
        description: '',
        featuresText: '',
        isActive: true,
        orderIndex: plans.length + 1
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.price || !formData.durationDays) {
      toast.error('Please fill in Plan Name, Price, and Duration');
      return;
    }

    const payload = {
      ...formData,
      price: Number(formData.price),
      durationDays: Number(formData.durationDays),
      features: formData.featuresText.split('\n').map(f => f.trim()).filter(Boolean)
    };

    try {
      setSaving(true);
      if (editingPlan) {
        const res = await api.put(`/subscription/admin/plans/${editingPlan._id}`, payload);
        if (res.data.success) {
          toast.success('Subscription plan updated successfully!');
        }
      } else {
        const res = await api.post('/subscription/admin/plans', payload);
        if (res.data.success) {
          toast.success('New Pro Plan created successfully!');
        }
      }
      setIsModalOpen(false);
      fetchPlans();
    } catch (err) {
      console.error('Save plan error:', err);
      toast.error(err.response?.data?.message || 'Failed to save subscription plan');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (plan) => {
    if (!window.confirm(`Are you sure you want to delete the plan "${plan.name}"?`)) return;
    try {
      const res = await api.delete(`/subscription/admin/plans/${plan._id}`);
      if (res.data.success) {
        toast.success('Plan deleted successfully');
        fetchPlans();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete plan');
    }
  };

  const toggleActiveStatus = async (plan) => {
    try {
      const res = await api.put(`/subscription/admin/plans/${plan._id}`, {
        isActive: !plan.isActive
      });
      if (res.data.success) {
        toast.success(`Plan ${!plan.isActive ? 'activated' : 'deactivated'}`);
        fetchPlans();
      }
    } catch (err) {
      toast.error('Failed to toggle status');
    }
  };

  return (
    <PageWrapper>
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-amber-100 text-amber-600 font-bold">
                <LuCrown className="w-6 h-6" />
              </span>
              <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Pro Subscription Plans</h1>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Create, edit, and configure pricing tiers and AI feature access for Riddha Pro members.
            </p>
          </div>

          <button
            onClick={() => openModal()}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-[#189D91] hover:bg-[#148379] text-white rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all active:scale-95 shrink-0"
          >
            <LuPlus className="w-5 h-5" /> Add New Plan
          </button>
        </div>

        {/* Loading Spinner */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#189D91]" />
          </div>
        ) : plans.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
            <LuCrown className="w-12 h-12 text-amber-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-gray-800">No Subscription Plans Found</h3>
            <p className="text-sm text-gray-500 mb-4">Click below to create your first Pro plan.</p>
            <button
              onClick={() => openModal()}
              className="px-4 py-2 bg-[#189D91] text-white font-bold text-xs rounded-lg"
            >
              Create Plan
            </button>
          </div>
        ) : (
          /* Plans Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan) => (
              <motion.div
                key={plan._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-white rounded-2xl border-2 p-6 flex flex-col justify-between relative shadow-sm transition-all hover:shadow-md ${
                  plan.isActive ? 'border-gray-200' : 'border-red-200 bg-red-50/20 opacity-75'
                }`}
              >
                {/* Status Badges */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                    plan.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {plan.isActive ? 'ACTIVE' : 'INACTIVE'}
                  </span>

                  <div className="flex items-center gap-1">
                    {plan.popular && (
                      <span className="bg-amber-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">POPULAR</span>
                    )}
                    {plan.bestValue && (
                      <span className="bg-purple-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">BEST VALUE</span>
                    )}
                  </div>
                </div>

                <div>
                  <div className="text-center pb-4 border-b border-gray-100">
                    <span className="text-3xl mb-1 block">{plan.emoji || '👑'}</span>
                    <h3 className="text-xl font-black text-gray-900">{plan.name}</h3>
                    <span className="text-xs font-bold text-gray-400 block mt-0.5">{plan.billingCycle} ({plan.durationDays} Days)</span>
                    <div className="mt-3">
                      <span className="text-3xl font-black text-gray-900">₹{plan.price.toLocaleString()}</span>
                    </div>
                  </div>

                  {plan.description && (
                    <p className="text-xs text-gray-500 my-3 text-center italic">{plan.description}</p>
                  )}

                  {/* Features List */}
                  <ul className="space-y-2 my-4">
                    {(plan.features || []).map((feat, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-gray-700 font-medium">
                        <LuCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Actions */}
                <div className="pt-4 border-t border-gray-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => toggleActiveStatus(plan)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors ${
                      plan.isActive
                        ? 'border-gray-200 text-gray-600 hover:bg-gray-100'
                        : 'border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                    }`}
                  >
                    {plan.isActive ? 'Deactivate' : 'Activate'}
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openModal(plan)}
                      className="p-2 text-gray-600 hover:text-[#189D91] hover:bg-teal-50 rounded-lg transition-colors"
                      title="Edit Plan"
                    >
                      <LuPencil size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(plan)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete Plan"
                    >
                      <LuTrash2 size={16} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Create / Edit Plan Modal */}
        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 overflow-y-auto">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsModalOpen(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 z-10 p-6 md:p-8 my-auto"
              >
                <div className="flex justify-between items-center pb-4 border-b border-gray-100 mb-6">
                  <div className="flex items-center gap-2">
                    <LuSparkles className="w-5 h-5 text-[#189D91]" />
                    <h2 className="text-xl font-black text-gray-900">
                      {editingPlan ? 'Edit Subscription Plan' : 'Create New Pro Plan'}
                    </h2>
                  </div>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="p-2 rounded-full text-gray-400 hover:bg-gray-100"
                  >
                    <LuX size={20} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                        Plan ID / Slug (Unique)
                      </label>
                      <input
                        type="text"
                        disabled={!!editingPlan}
                        required
                        placeholder="e.g. silver, gold, diamond"
                        value={formData.planId}
                        onChange={(e) => setFormData({ ...formData, planId: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-[#189D91] disabled:bg-gray-50"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                        Plan Display Name
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 🥈 SILVER or VIP PRO"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-[#189D91]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                        Price (₹)
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        placeholder="1999"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-[#189D91]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                        Billing Cycle
                      </label>
                      <select
                        value={formData.billingCycle}
                        onChange={(e) => setFormData({ ...formData, billingCycle: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-[#189D91]"
                      >
                        <option value="Monthly">Monthly</option>
                        <option value="Quarterly">Quarterly</option>
                        <option value="Halfyearly">Half-Yearly</option>
                        <option value="Yearly">Yearly</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                        Duration (Days)
                      </label>
                      <input
                        type="number"
                        required
                        min="1"
                        placeholder="30"
                        value={formData.durationDays}
                        onChange={(e) => setFormData({ ...formData, durationDays: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-[#189D91]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Emoji Icon
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 🥈, 🥇, 💎, 👑"
                      value={formData.emoji}
                      onChange={(e) => setFormData({ ...formData, emoji: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-[#189D91]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Short Description
                    </label>
                    <input
                      type="text"
                      placeholder="Brief tagline for plan..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#189D91]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Features List (1 per line)
                    </label>
                    <textarea
                      rows={4}
                      placeholder="Access to AI Design Quiz&#10;AI Recommendations Engine&#10;Unlimited BOQ Exports"
                      value={formData.featuresText}
                      onChange={(e) => setFormData({ ...formData, featuresText: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#189D91]"
                    />
                  </div>

                  {/* Toggles */}
                  <div className="flex flex-wrap items-center gap-6 pt-2">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-700">
                      <input
                        type="checkbox"
                        checked={formData.popular}
                        onChange={(e) => setFormData({ ...formData, popular: e.target.checked })}
                        className="rounded text-[#189D91] focus:ring-[#189D91]"
                      />
                      Most Popular Badge
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-700">
                      <input
                        type="checkbox"
                        checked={formData.bestValue}
                        onChange={(e) => setFormData({ ...formData, bestValue: e.target.checked })}
                        className="rounded text-[#189D91] focus:ring-[#189D91]"
                      />
                      Best Value Badge
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-700">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                        className="rounded text-[#189D91] focus:ring-[#189D91]"
                      />
                      Active for Users
                    </label>
                  </div>

                  {/* Submit Button */}
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
                      className="px-6 py-2.5 rounded-xl bg-[#189D91] hover:bg-[#148379] text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
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

export default ManageProPlans;
