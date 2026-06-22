import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageWrapper from '../components/PageWrapper';
import {
  LuBell, LuUser, LuShieldCheck, LuGlobe, LuChevronRight, LuX, LuTriangleAlert
} from 'react-icons/lu';
import { FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../../shared/utils/api';
import { toast } from 'react-hot-toast';
import { useUser } from '../../user/data/UserContext';

const Settings = () => {
  const navigate = useNavigate();
  const { logout } = useUser();

  const [notifications, setNotifications] = useState({
    orderAlerts: true,
    paymentAlerts: true,
    promotions: false,
    emailNotifications: true,
  });
  const [language] = useState('en');

  // Change password modal state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [cpForm, setCpForm] = useState({ current: '', newPwd: '', confirm: '' });
  const [cpShowCurrent, setCpShowCurrent] = useState(false);
  const [cpShowNew, setCpShowNew] = useState(false);
  const [cpShowConfirm, setCpShowConfirm] = useState(false);
  const [cpLoading, setCpLoading] = useState(false);

  // Delete account modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const toggleNotification = (key) => {
    setNotifications(prev => {
      const updated = { ...prev, [key]: !prev[key] };
      if (key === 'emailNotifications') {
        toast.success(updated.emailNotifications ? 'Email notifications enabled' : 'Email notifications disabled');
      }
      return updated;
    });
  };

  const handleAction = (action) => {
    if (action === 'edit' || action === 'vehicle') navigate('/delivery/profile');
    else if (action === 'password') setShowPasswordModal(true);
    else if (action === '2fa') toast('Two-Factor Authentication coming soon', { icon: '🔒' });
    else if (action === 'history') toast('Login History coming soon', { icon: '📋' });
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (cpForm.newPwd !== cpForm.confirm) {
      toast.error('New passwords do not match');
      return;
    }
    if (cpForm.newPwd.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setCpLoading(true);
    try {
      const { data } = await api.put('/delivery/change-password', {
        currentPassword: cpForm.current,
        newPassword: cpForm.newPwd,
      });
      if (data.success) {
        toast.success('Password updated successfully');
        setShowPasswordModal(false);
        setCpForm({ current: '', newPwd: '', confirm: '' });
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update password');
    } finally {
      setCpLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    try {
      const { data } = await api.delete('/delivery/me');
      if (data.success) {
        toast.success('Account deleted');
        logout();
        navigate('/delivery');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete account');
    } finally {
      setDeleteLoading(false);
    }
  };

  const settingsSections = [
    {
      title: 'Account',
      icon: LuUser,
      items: [
        { label: 'Edit Profile', description: 'Update your personal information', action: 'edit' },
        { label: 'Change Password', description: 'Secure your account', action: 'password' },
        { label: 'Vehicle Details', description: 'Update your vehicle information', action: 'vehicle' },
      ]
    },
    {
      title: 'Notifications',
      icon: LuBell,
      items: [
        { label: 'Order Alerts', description: 'Get notified for new orders', toggle: 'orderAlerts' },
        { label: 'Payment Alerts', description: 'Get notified for payments', toggle: 'paymentAlerts' },
        { label: 'Promotions', description: 'Receive promotional offers', toggle: 'promotions' },
        { label: 'Email Notifications', description: 'Receive email updates', toggle: 'emailNotifications' },
      ]
    },
    {
      title: 'Preferences',
      icon: LuGlobe,
      items: [
        { label: 'Language', description: 'English', value: language },
      ]
    },
    {
      title: 'Security',
      icon: LuShieldCheck,
      items: [
        { label: 'Two-Factor Authentication', description: 'Add extra security', action: '2fa', comingSoon: true },
        { label: 'Login History', description: 'View recent logins', action: 'history', comingSoon: true },
      ]
    }
  ];

  return (
    <PageWrapper>
      <div className="max-w-3xl mx-auto space-y-4 pb-12">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Settings</h1>
          <p className="text-xs font-medium text-slate-500 mt-1">Customize your account preferences.</p>
        </div>

        {settingsSections.map((section, sectionIndex) => (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: sectionIndex * 0.05 }}
            className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden"
          >
            <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
              <div className="w-8 h-8 bg-teal-50 text-[#189D91] rounded-lg flex items-center justify-center">
                <section.icon size={16} />
              </div>
              <h3 className="text-sm font-bold text-slate-900">{section.title}</h3>
            </div>
            <div className="divide-y divide-slate-100">
              {section.items.map((item, index) => (
                <div
                  key={index}
                  onClick={() => item.action && !item.comingSoon && handleAction(item.action)}
                  className={`px-5 py-3 flex items-center justify-between transition-colors ${item.comingSoon ? 'opacity-50 cursor-default' : item.action ? 'cursor-pointer hover:bg-slate-50' : ''}`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-slate-800">{item.label}</p>
                      {item.comingSoon && (
                        <span className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-600 border border-amber-200">Soon</span>
                      )}
                    </div>
                    <p className="text-[10px] font-medium text-slate-500">{item.description}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {item.toggle !== undefined ? (
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleNotification(item.toggle); }}
                        className={`w-10 h-6 rounded-full relative transition-colors duration-300 ${
                          notifications[item.toggle] ? 'bg-[#189D91]' : 'bg-slate-200'
                        }`}
                      >
                        <motion.div
                          animate={{ x: notifications[item.toggle] ? 18 : 2 }}
                          className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                        />
                      </button>
                    ) : item.value ? (
                      <div className="flex items-center gap-2 text-slate-500">
                        <span className="text-xs font-medium">{item.description}</span>
                      </div>
                    ) : (
                      <LuChevronRight size={16} className="text-slate-400" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        ))}

        {/* Delete Account */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-rose-50 rounded-xl border border-rose-100 p-5"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-rose-600">Delete Account</h3>
              <p className="text-[10px] font-medium text-rose-500 mt-0.5">Permanently delete your account and all data</p>
            </div>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="px-4 py-2 bg-white border border-rose-200 text-rose-600 rounded-lg text-xs font-bold hover:bg-rose-600 hover:text-white transition-colors"
            >
              Delete
            </button>
          </div>
        </motion.div>
      </div>

      {/* Change Password Modal */}
      <AnimatePresence>
        {showPasswordModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4"
            onClick={() => setShowPasswordModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl"
            >
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-teal-50 text-[#189D91] rounded-lg flex items-center justify-center">
                    <FiLock size={16} />
                  </div>
                  <h2 className="text-base font-bold text-slate-900">Change Password</h2>
                </div>
                <button onClick={() => setShowPasswordModal(false)} className="text-slate-400 hover:text-slate-600">
                  <LuX size={20} />
                </button>
              </div>
              <form onSubmit={handleChangePassword} className="space-y-4">
                {[
                  { label: 'Current Password', key: 'current', show: cpShowCurrent, toggle: setCpShowCurrent },
                  { label: 'New Password', key: 'newPwd', show: cpShowNew, toggle: setCpShowNew },
                  { label: 'Confirm New Password', key: 'confirm', show: cpShowConfirm, toggle: setCpShowConfirm },
                ].map(({ label, key, show, toggle }) => (
                  <div key={key}>
                    <label className="block text-xs font-bold text-slate-700 mb-1">{label}</label>
                    <div className="relative">
                      <input
                        type={show ? 'text' : 'password'}
                        value={cpForm[key]}
                        onChange={(e) => setCpForm(prev => ({ ...prev, [key]: e.target.value }))}
                        onFocus={(e) => setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300)}
                        placeholder={`Enter ${label.toLowerCase()}`}
                        required
                        className="w-full px-4 py-2.5 pr-10 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#189D91]/30"
                      />
                      <button
                        type="button"
                        onClick={() => toggle(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                      >
                        {show ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  type="submit"
                  disabled={cpLoading}
                  className="w-full py-2.5 bg-[#189D91] text-white rounded-xl text-sm font-bold hover:bg-[#147d73] transition-colors disabled:opacity-60"
                >
                  {cpLoading ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Account Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4"
            onClick={() => setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl"
            >
              <div className="flex flex-col items-center text-center gap-3 mb-6">
                <div className="w-14 h-14 bg-rose-100 rounded-full flex items-center justify-center text-rose-500">
                  <LuTriangleAlert size={28} />
                </div>
                <h2 className="text-base font-bold text-slate-900">Delete Account?</h2>
                <p className="text-sm text-slate-500">This will permanently delete your account and all associated data. This action cannot be undone.</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteLoading}
                  className="flex-1 py-2.5 bg-rose-600 text-white rounded-xl text-sm font-bold hover:bg-rose-700 transition-colors disabled:opacity-60"
                >
                  {deleteLoading ? 'Deleting...' : 'Yes, Delete'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageWrapper>
  );
};

export default Settings;
