import React, { useState } from 'react';
import PageWrapper from '../components/PageWrapper';
import { LuBell, LuUser, LuShieldCheck, LuGlobe, LuChevronRight, LuMapPin, LuPhone, LuMail } from 'react-icons/lu';
import { motion } from 'framer-motion';

const Settings = () => {
  const [notifications, setNotifications] = useState({
    orderAlerts: true,
    paymentAlerts: true,
    promotions: false,
    emailNotifications: true,
  });

  const [language, setLanguage] = useState('en');

  const toggleNotification = (key) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
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
        { label: 'Two-Factor Authentication', description: 'Add extra security', action: '2fa' },
        { label: 'Login History', description: 'View recent logins', action: 'history' },
      ]
    }
  ];

  return (
    <PageWrapper>
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-deep-espresso">Settings</h1>
          <p className="text-warm-sand mt-2">Customize your account preferences.</p>
        </div>

        {settingsSections.map((section, sectionIndex) => (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: sectionIndex * 0.1 }}
            className="bg-white rounded-2xl shadow-sm border border-soft-oatmeal overflow-hidden"
          >
            <div className="p-6 border-b border-soft-oatmeal flex items-center gap-3">
              <div className="w-10 h-10 bg-warm-sand/10 text-warm-sand rounded-xl flex items-center justify-center">
                <section.icon size={20} />
              </div>
              <h3 className="text-lg font-bold text-deep-espresso">{section.title}</h3>
            </div>
            <div className="divide-y divide-soft-oatmeal">
              {section.items.map((item, index) => (
                <div
                  key={index}
                  className="p-6 flex items-center justify-between hover:bg-soft-oatmeal/20 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-bold text-deep-espresso">{item.label}</p>
                    <p className="text-sm text-dusty-cocoa">{item.description}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    {item.toggle !== undefined ? (
                      <button
                        onClick={() => toggleNotification(item.toggle)}
                        className={`w-12 h-7 rounded-full relative transition-colors duration-300 ${
                          notifications[item.toggle] ? 'bg-warm-sand' : 'bg-soft-oatmeal'
                        }`}
                      >
                        <motion.div
                          animate={{ x: notifications[item.toggle] ? 20 : 4 }}
                          className="absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm"
                        />
                      </button>
                    ) : item.value ? (
                      <div className="flex items-center gap-2 text-dusty-cocoa">
                        <span className="text-sm font-medium">{item.description}</span>
                      </div>
                    ) : (
                      <LuChevronRight size={20} className="text-dusty-cocoa" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        ))}

        {/* Delete Account Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-red-50 rounded-2xl border border-red-100 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-red-600">Delete Account</h3>
              <p className="text-sm text-red-400">Permanently delete your account and all data</p>
            </div>
            <button className="px-6 py-2 border border-red-200 text-red-600 rounded-xl font-bold hover:bg-red-600 hover:text-white transition-colors">
              Delete
            </button>
          </div>
        </motion.div>
      </div>
    </PageWrapper>
  );
};

export default Settings;
