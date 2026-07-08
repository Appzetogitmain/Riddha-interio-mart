import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LuPlus, LuPencil, LuTrash, LuCheck, LuX } from 'react-icons/lu';
import api from '../../../shared/utils/api';
import toast from 'react-hot-toast';
import PageWrapper from '../components/PageWrapper';

const ManageAdvertisementPlans = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    durationDays: '',
    maxProducts: 1,
    isActive: true
  });

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const res = await api.get('/advertisements/plans');
      if (res.data.success) {
        setPlans(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to fetch advertisement plans');
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
        name: plan.name,
        price: plan.price,
        durationDays: plan.durationDays,
        maxProducts: plan.maxProducts,
        isActive: plan.isActive
      });
    } else {
      setEditingPlan(null);
      setFormData({
        name: '',
        price: '',
        durationDays: '',
        maxProducts: 1,
        isActive: true
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingPlan) {
        const res = await api.put(`/advertisements/plans/${editingPlan._id}`, formData);
        if (res.data.success) toast.success('Plan updated');
      } else {
        const res = await api.post('/advertisements/plans', formData);
        if (res.data.success) toast.success('Plan created');
      }
      setIsModalOpen(false);
      fetchPlans();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save plan');
    }
  };

  return (
    <PageWrapper>
      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Advertisement Plans</h1>
            <p className="text-gray-500 mt-1">Manage product advertisement packages for sellers</p>
          </div>
          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
          >
            <LuPlus /> Create Plan
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map(plan => (
              <motion.div
                key={plan._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-white rounded-2xl p-6 border ${plan.isActive ? 'border-gray-200 shadow-sm' : 'border-gray-300 opacity-75'}`}
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                  <div className="flex gap-2">
                    <button onClick={() => openModal(plan)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                      <LuPencil />
                    </button>
                  </div>
                </div>
                
                <div className="text-3xl font-black text-gray-900 mb-6">
                  ₹{plan.price}
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-2 text-gray-600">
                    <LuCheck className="text-green-500" />
                    <span>{plan.maxProducts} {plan.maxProducts === 1 ? 'Product' : 'Products'} allowed</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <LuCheck className="text-green-500" />
                    <span>Active for {plan.durationDays} {plan.durationDays === 1 ? 'Day' : 'Days'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    {plan.isActive ? <LuCheck className="text-green-500" /> : <LuX className="text-red-500" />}
                    <span>{plan.isActive ? 'Status: Active' : 'Status: Inactive'}</span>
                  </div>
                </div>
              </motion.div>
            ))}
            
            {plans.length === 0 && (
              <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-gray-200">
                <p className="text-gray-500">No advertisement plans found. Create one to get started.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl w-full max-w-md overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-lg font-bold text-gray-900">{editingPlan ? 'Edit Plan' : 'Create Plan'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <LuX size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Plan Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. Gold Ad Plan"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.price}
                    onChange={e => setFormData({...formData, price: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration (Days)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.durationDays}
                    onChange={e => setFormData({...formData, durationDays: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Products Allowed</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.maxProducts}
                  onChange={e => setFormData({...formData, maxProducts: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={e => setFormData({...formData, isActive: e.target.checked})}
                  className="w-4 h-4 text-indigo-600 rounded border-gray-300"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">Active (Visible to sellers)</label>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700"
                >
                  Save Plan
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </PageWrapper>
  );
};

export default ManageAdvertisementPlans;
