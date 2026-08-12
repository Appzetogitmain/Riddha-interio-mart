import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FiSettings, FiSmartphone, FiMail, FiBell, FiMessageSquare,
  FiClock, FiShield, FiCheckCircle, FiSave, FiCheck
} from 'react-icons/fi';
import { LuSparkles } from 'react-icons/lu';
import { notificationCenterService } from '../services/notificationCenterService';
import toast from 'react-hot-toast';

const NotificationPreferencesPage = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [channels, setChannels] = useState({
    sms: true,
    email: true,
    push: true,
    whatsapp: false,
    inApp: true
  });

  const [notificationTypes, setNotificationTypes] = useState({
    orders: true,
    projects: true,
    promotions: true,
    account: true,
    engagement: true
  });

  const [frequency, setFrequency] = useState({
    orders: 'immediate',
    projects: 'immediate',
    promotions: 'immediate',
    account: 'immediate',
    engagement: 'daily'
  });

  const [quietHours, setQuietHours] = useState({
    enabled: true,
    startTime: '22:00',
    endTime: '08:00',
    timezone: 'Asia/Kolkata'
  });

  const [urgentOnly, setUrgentOnly] = useState(false);

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      const res = await notificationCenterService.getUserPreferences().catch(() => null);
      if (res && res.success && res.data) {
        if (res.data.channels) setChannels(res.data.channels);
        if (res.data.notificationTypes) setNotificationTypes(res.data.notificationTypes);
        if (res.data.frequency) setFrequency(res.data.frequency);
        if (res.data.quietHours) setQuietHours(res.data.quietHours);
        if (res.data.urgentOnly !== undefined) setUrgentOnly(res.data.urgentOnly);
      }
    } catch (e) {
      toast.error('Failed to load notification preferences.');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePreferences = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await notificationCenterService.updateUserPreferences({
        channels,
        notificationTypes,
        frequency,
        quietHours,
        urgentOnly
      });
      if (res.success) {
        toast.success('Notification preferences saved!');
      }
    } catch (e) {
      toast.error('Failed to save preferences.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-600 mx-auto"></div>
          <p className="text-slate-500 text-sm font-semibold">Loading Preference Controls...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-3 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 rounded-3xl p-6 sm:p-8 text-white shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-slate-700/50">
          <div>
            <div className="inline-flex items-center space-x-2 bg-amber-500/20 border border-amber-500/30 px-3 py-1 rounded-full text-xs font-semibold text-amber-300">
              <LuSparkles className="text-amber-400" />
              <span>Personal Notification Controls</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-black text-white tracking-tight mt-2">
              Notification Preferences
            </h1>
            <p className="text-slate-200 text-xs sm:text-sm mt-1 max-w-xl">
              Control delivery channels, category frequencies, and quiet hours schedule.
            </p>
          </div>

          <button
            onClick={handleSavePreferences}
            disabled={saving}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-deep-espresso font-bold text-xs rounded-xl shadow-md inline-flex items-center gap-2 shrink-0 self-start sm:self-auto"
          >
            <FiSave /> {saving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>

        <form onSubmit={handleSavePreferences} className="space-y-6 text-xs">

          {/* Section 1: Delivery Channels */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 font-display">1. Preferred Delivery Channels</h3>
            <p className="text-slate-500">Choose which channels you want to receive alerts on.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                { id: 'sms', label: 'SMS Notifications (Twilio)', icon: FiSmartphone },
                { id: 'email', label: 'Email Reports (HTML)', icon: FiMail },
                { id: 'push', label: 'Mobile Push (FCM)', icon: FiBell },
                { id: 'whatsapp', label: 'WhatsApp Direct Alerts', icon: FiMessageSquare },
                { id: 'inApp', label: 'In-App Notification Center', icon: FiCheckCircle }
              ].map(ch => (
                <label key={ch.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between cursor-pointer hover:bg-slate-100 transition-colors">
                  <div className="flex items-center space-x-2.5">
                    <ch.icon className="text-amber-600 text-base" />
                    <span className="font-bold text-slate-800 text-xs">{ch.label}</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={channels[ch.id]}
                    onChange={(e) => setChannels({ ...channels, [ch.id]: e.target.checked })}
                    className="w-4 h-4 accent-amber-600 rounded"
                  />
                </label>
              ))}
            </div>
          </div>

          {/* Section 2: Categories & Frequency */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 font-display">2. Notification Categories & Frequencies</h3>
            <p className="text-slate-500">Specify delivery frequency for each type of update.</p>

            <div className="space-y-3">
              {[
                { id: 'orders', name: 'Orders & Logistics', desc: 'Dispatch, Live Tracking, Delivery OTP, Delivery Issues' },
                { id: 'projects', name: 'Projects & Quotations', desc: 'Quote received, Phase completion, Design deliverables' },
                { id: 'promotions', name: 'Promotions & Offers', desc: 'Seasonal discounts, Back in stock, Flash sales' },
                { id: 'account', name: 'Account & Security', desc: 'Security alerts, Password changes, Profile updates' },
                { id: 'engagement', name: 'Rewards & Reviews', desc: 'Loyalty points, Review requests, Referral rewards' }
              ].map(cat => (
                <div key={cat.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="font-bold text-slate-900 text-xs">{cat.name}</div>
                    <div className="text-slate-500 text-[11px] mt-0.5">{cat.desc}</div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <select
                      value={frequency[cat.id]}
                      onChange={(e) => setFrequency({ ...frequency, [cat.id]: e.target.value })}
                      className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold"
                    >
                      <option value="immediate">Immediate (Real-Time)</option>
                      <option value="daily">Daily Digest</option>
                      <option value="weekly">Weekly Digest</option>
                      <option value="never">Never (Off)</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Quiet Hours */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 font-display">3. Quiet Hours Schedule</h3>
                <p className="text-slate-500">Mute non-urgent promotional alerts during your rest hours.</p>
              </div>
              <label className="flex items-center space-x-2 cursor-pointer font-bold">
                <input
                  type="checkbox"
                  checked={quietHours.enabled}
                  onChange={(e) => setQuietHours({ ...quietHours, enabled: e.target.checked })}
                  className="w-4 h-4 accent-amber-600 rounded"
                />
                <span>Enable Quiet Hours</span>
              </label>
            </div>

            {quietHours.enabled && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Start Time</label>
                  <input
                    type="time"
                    value={quietHours.startTime}
                    onChange={(e) => setQuietHours({ ...quietHours, startTime: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">End Time</label>
                  <input
                    type="time"
                    value={quietHours.endTime}
                    onChange={(e) => setQuietHours({ ...quietHours, endTime: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Timezone</label>
                  <input
                    type="text"
                    value={quietHours.timezone}
                    onChange={(e) => setQuietHours({ ...quietHours, timezone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-semibold"
                  />
                </div>
              </div>
            )}
          </div>

        </form>

      </div>
    </div>
  );
};

export default NotificationPreferencesPage;
