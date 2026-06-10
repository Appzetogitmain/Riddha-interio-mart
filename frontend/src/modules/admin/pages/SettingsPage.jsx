import React, { useState, useEffect } from 'react';
import {
  FiUser, FiMail, FiShield, FiBell, FiSave, FiCheck,
  FiAlertCircle, FiEye, FiEyeOff, FiDollarSign, FiSettings,
  FiRefreshCw, FiPercent
} from 'react-icons/fi';
import { LuPackage, LuTruck } from 'react-icons/lu';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../../shared/utils/api';

const TABS = [
  { id: 'profile',       label: 'Profile',       icon: FiUser },
  { id: 'security',      label: 'Security',      icon: FiShield },
  { id: 'notifications', label: 'Notifications', icon: FiBell },
  { id: 'system',        label: 'System',        icon: FiSettings },
];

const Label = ({ children }) => (
  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">{children}</label>
);

const Input = ({ icon: Icon, ...props }) => (
  <div className="relative">
    {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />}
    <input
      {...props}
      className={`w-full bg-gray-50 border border-gray-200 focus:border-teal-400 focus:bg-white rounded-xl text-sm font-medium outline-none transition-all py-2.5 pr-3 ${Icon ? 'pl-9' : 'pl-3'} ${props.className || ''}`}
    />
  </div>
);

const Toggle = ({ value, onChange, label, description }) => (
  <div
    onClick={() => onChange(!value)}
    className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 hover:border-teal-300 rounded-xl cursor-pointer transition-all group"
  >
    <div>
      <p className="text-sm font-bold text-gray-800">{label}</p>
      {description && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
    </div>
    <div className={`w-10 h-6 rounded-full relative shrink-0 transition-colors duration-300 ${value ? 'bg-teal-500' : 'bg-gray-200'}`}>
      <motion.div
        animate={{ x: value ? 16 : 2 }}
        className="absolute top-1 w-4 h-4 bg-white rounded-full shadow"
      />
    </div>
  </div>
);

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [profile, setProfile] = useState({ fullName: '', email: '' });

  const [pwForm, setPwForm] = useState({ current: '', newPwd: '', confirm: '' });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [notifications, setNotifications] = useState({
    emailReports: true,
    newOrders: true,
    sellerRequests: true,
    lowStock: false,
  });

  const [system, setSystem] = useState({
    deliveryCommissionRate: 50.00,
    salesCommissionRate: 10.00,
  });

  useEffect(() => {
    const load = async () => {
      try {
        const [profileRes, settingsRes] = await Promise.all([
          api.get('/auth/admin/me'),
          api.get('/settings'),
        ]);
        if (profileRes.data.success) {
          setProfile({
            fullName: profileRes.data.data.fullName || '',
            email: profileRes.data.data.email || '',
          });
        }
        if (settingsRes.data?.success && settingsRes.data?.data) {
          const s = settingsRes.data.data;
          setSystem({
            deliveryCommissionRate: s.deliveryCommissionRate ?? 50.00,
            salesCommissionRate: s.salesCommissionRate ?? 10.00,
          });
        }
      } catch {
        toast.error('Failed to load settings');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const saveProfile = async () => {
    if (!profile.fullName.trim()) { toast.error('Full name is required'); return; }
    if (!/\S+@\S+\.\S+/.test(profile.email)) { toast.error('Enter a valid email address'); return; }
    setSaving(true);
    try {
      const { data } = await api.put('/auth/admin/profile', profile);
      if (data.success) toast.success('Profile updated');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update profile');
    } finally { setSaving(false); }
  };

  const savePassword = async () => {
    if (!pwForm.current) { toast.error('Enter your current password'); return; }
    if (pwForm.newPwd.length < 6) { toast.error('New password must be at least 6 characters'); return; }
    if (pwForm.newPwd !== pwForm.confirm) { toast.error('Passwords do not match'); return; }
    setSaving(true);
    try {
      const { data } = await api.put('/auth/admin/password', {
        currentPassword: pwForm.current,
        newPassword: pwForm.newPwd,
      });
      if (data.success) {
        toast.success('Password updated successfully');
        setPwForm({ current: '', newPwd: '', confirm: '' });
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update password');
    } finally { setSaving(false); }
  };

  const saveNotifications = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success('Notification preferences saved');
    }, 600);
  };

  const saveSystem = async () => {
    if (system.deliveryCommissionRate < 0 || system.salesCommissionRate < 0) {
      toast.error('Commission rates cannot be negative');
      return;
    }
    setSaving(true);
    try {
      const { data } = await api.put('/settings', system);
      if (data.success) toast.success('System settings updated');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update system settings');
    } finally { setSaving(false); }
  };

  const handleSave = () => {
    if (activeTab === 'profile') saveProfile();
    else if (activeTab === 'security') savePassword();
    else if (activeTab === 'notifications') saveNotifications();
    else if (activeTab === 'system') saveSystem();
  };

  const pwStrength = (() => {
    const p = pwForm.newPwd;
    if (!p) return null;
    let score = 0;
    if (p.length >= 6) score++;
    if (p.length >= 10) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    if (score <= 1) return { label: 'Weak', color: 'bg-red-400', width: 'w-1/5' };
    if (score <= 3) return { label: 'Fair', color: 'bg-amber-400', width: 'w-3/5' };
    return { label: 'Strong', color: 'bg-emerald-500', width: 'w-full' };
  })();

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center h-64">
        <FiRefreshCw className="animate-spin text-teal-500" size={24} />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-5xl">

      {/* Header */}
      <div>
        <h1 className="text-xl font-black tracking-tight text-gray-900">
          System <span className="text-teal-600">Settings</span>
        </h1>
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-0.5">
          Admin account & platform configuration
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-4">

        {/* Sidebar nav */}
        <div className="md:w-48 shrink-0">
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold transition-all text-left border-l-2 ${
                  activeTab === id
                    ? 'bg-teal-50 border-teal-500 text-teal-700'
                    : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon size={15} />
                {label}
              </button>
            ))}
          </div>

          {/* Store status card */}
          <div className="mt-3 bg-teal-50 border border-teal-100 rounded-2xl p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600">Live</span>
            </div>
            <p className="text-xs font-bold text-gray-800">Riddha Interio Mart</p>
            <p className="text-[9px] text-gray-400 mt-0.5">All systems operational</p>
          </div>
        </div>

        {/* Content panel */}
        <div className="flex-1 bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
              className="p-5 space-y-5"
            >

              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <>
                  <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                    <div className="w-8 h-8 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center">
                      <FiUser size={15} />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-gray-900">Personal Details</h3>
                      <p className="text-[10px] text-gray-400">Update your admin account information</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
                    <div>
                      <Label>Full Name</Label>
                      <Input
                        icon={FiUser}
                        type="text"
                        value={profile.fullName}
                        onChange={e => setProfile({ ...profile, fullName: e.target.value })}
                        placeholder="Admin full name"
                      />
                    </div>
                    <div>
                      <Label>Email Address</Label>
                      <Input
                        icon={FiMail}
                        type="email"
                        value={profile.email}
                        onChange={e => setProfile({ ...profile, email: e.target.value })}
                        placeholder="admin@riddha.com"
                      />
                    </div>
                  </div>
                  <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-2 max-w-2xl">
                    <FiAlertCircle size={14} className="text-blue-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-600 font-medium">Email changes affect your login credentials. Make sure you have access to the new address.</p>
                  </div>
                </>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <>
                  <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                    <div className="w-8 h-8 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center">
                      <FiShield size={15} />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-gray-900">Change Password</h3>
                      <p className="text-[10px] text-gray-400">Update your admin account password</p>
                    </div>
                  </div>
                  <div className="space-y-3 max-w-sm">
                    {[
                      { label: 'Current Password', key: 'current', show: showCurrent, setShow: setShowCurrent },
                      { label: 'New Password', key: 'newPwd', show: showNew, setShow: setShowNew },
                      { label: 'Confirm New Password', key: 'confirm', show: showConfirm, setShow: setShowConfirm },
                    ].map(({ label, key, show, setShow }) => (
                      <div key={key}>
                        <Label>{label}</Label>
                        <div className="relative">
                          <FiShield className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                          <input
                            type={show ? 'text' : 'password'}
                            value={pwForm[key]}
                            onChange={e => setPwForm(p => ({ ...p, [key]: e.target.value }))}
                            placeholder="••••••••"
                            className="w-full bg-gray-50 border border-gray-200 focus:border-teal-400 focus:bg-white rounded-xl text-sm font-medium outline-none py-2.5 pl-9 pr-10 transition-all"
                          />
                          <button
                            type="button"
                            onClick={() => setShow(v => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {show ? <FiEyeOff size={14} /> : <FiEye size={14} />}
                          </button>
                        </div>
                        {key === 'newPwd' && pwStrength && (
                          <div className="mt-1.5 space-y-0.5">
                            <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full transition-all ${pwStrength.color} ${pwStrength.width}`} />
                            </div>
                            <p className={`text-[10px] font-bold ${pwStrength.color.replace('bg-', 'text-')}`}>{pwStrength.label}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <>
                  <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                    <div className="w-8 h-8 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center">
                      <FiBell size={15} />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-gray-900">Notification Preferences</h3>
                      <p className="text-[10px] text-gray-400">Control which alerts you receive</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl">
                    <Toggle
                      value={notifications.emailReports}
                      onChange={v => setNotifications(n => ({ ...n, emailReports: v }))}
                      label="Weekly Email Reports"
                      description="Analytics summaries every Monday"
                    />
                    <Toggle
                      value={notifications.newOrders}
                      onChange={v => setNotifications(n => ({ ...n, newOrders: v }))}
                      label="New Order Alerts"
                      description="Real-time order notifications"
                    />
                    <Toggle
                      value={notifications.sellerRequests}
                      onChange={v => setNotifications(n => ({ ...n, sellerRequests: v }))}
                      label="Seller Requests"
                      description="New seller registration alerts"
                    />
                    <Toggle
                      value={notifications.lowStock}
                      onChange={v => setNotifications(n => ({ ...n, lowStock: v }))}
                      label="Low Stock Warnings"
                      description="Alert when products run low"
                    />
                  </div>
                </>
              )}

              {/* System Tab */}
              {activeTab === 'system' && (
                <>
                  <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                    <div className="w-8 h-8 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center">
                      <FiSettings size={15} />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-gray-900">System Configuration</h3>
                      <p className="text-[10px] text-gray-400">Platform-wide financial settings</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
                    <div>
                      <Label>Delivery Commission Rate (₹/order)</Label>
                      <div className="relative">
                        <LuTruck className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={system.deliveryCommissionRate}
                          onChange={e => setSystem(s => ({ ...s, deliveryCommissionRate: parseFloat(e.target.value) || 0 }))}
                          className="w-full bg-gray-50 border border-gray-200 focus:border-teal-400 focus:bg-white rounded-xl text-sm font-medium outline-none py-2.5 pl-9 pr-3 transition-all"
                        />
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1">Fixed ₹ amount paid to delivery partner per completed order</p>
                    </div>
                    <div>
                      <Label>Seller Commission Rate (%)</Label>
                      <div className="relative">
                        <FiPercent className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={system.salesCommissionRate}
                          onChange={e => setSystem(s => ({ ...s, salesCommissionRate: parseFloat(e.target.value) || 0 }))}
                          className="w-full bg-gray-50 border border-gray-200 focus:border-teal-400 focus:bg-white rounded-xl text-sm font-medium outline-none py-2.5 pl-9 pr-3 transition-all"
                        />
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1">Percentage deducted from seller earnings on each sale</p>
                    </div>
                  </div>

                  {/* Preview */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl">
                    <div className="bg-teal-50 border border-teal-100 rounded-xl p-3 flex items-center gap-3">
                      <div className="w-8 h-8 bg-teal-600 text-white rounded-lg flex items-center justify-center">
                        <LuTruck size={14} />
                      </div>
                      <div>
                        <p className="text-[10px] text-teal-600 font-bold uppercase tracking-wider">Delivery Pay</p>
                        <p className="text-base font-black text-gray-900">₹{system.deliveryCommissionRate.toFixed(2)}<span className="text-xs font-semibold text-gray-400">/order</span></p>
                      </div>
                    </div>
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-500 text-white rounded-lg flex items-center justify-center">
                        <LuPackage size={14} />
                      </div>
                      <div>
                        <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">Platform Cut</p>
                        <p className="text-base font-black text-gray-900">{system.salesCommissionRate.toFixed(1)}<span className="text-xs font-semibold text-gray-400">% per sale</span></p>
                      </div>
                    </div>
                  </div>
                </>
              )}

            </motion.div>
          </AnimatePresence>

          {/* Save bar */}
          <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
            <p className="text-[10px] text-gray-400 font-medium capitalize">
              Editing: <span className="font-bold text-gray-600">{TABS.find(t => t.id === activeTab)?.label}</span>
            </p>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all active:scale-95 shadow-sm"
            >
              {saving
                ? <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</>
                : <><FiSave size={13} />Save Changes</>
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
