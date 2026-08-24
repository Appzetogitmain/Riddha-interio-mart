import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiBell, FiCheckCircle, FiTrash2, FiSettings, FiCheck, FiMail,
  FiMessageSquare, FiSmartphone, FiTag, FiShoppingBag, FiLayers, FiShield,
  FiFilter, FiExternalLink, FiChevronRight, FiClock, FiAlertCircle
} from 'react-icons/fi';
import { LuSparkles, LuBrain } from 'react-icons/lu';
import { notificationCenterService } from '../services/notificationCenterService';
import toast from 'react-hot-toast';

const CATEGORIES = [
  { id: 'all', label: 'All Notifications' },
  { id: 'orders', label: 'Orders & Logistics' },
  { id: 'projects', label: 'Projects & Quotes' },
  { id: 'promotions', label: 'Promotions & Offers' },
  { id: 'account', label: 'Account & Security' },
  { id: 'engagement', label: 'Rewards & Reviews' }
];

const NotificationCenterPage = () => {
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeCategory, setActiveCategory] = useState('all');
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    fetchNotifications();
  }, [activeCategory]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await notificationCenterService.getUserNotifications({
        category: activeCategory
      }).catch(() => null);

      if (res && res.success && res.data) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount || 0);
      } else {
        // Fallback demo notifications
        const demoList = [
          {
            _id: 'notif-1',
            type: 'out_for_delivery',
            category: 'orders',
            title: '🚚 Order #ORD-2026-8912 Out for Delivery',
            message: 'Your interior furniture items are in transit. Expected arrival at 04:45 PM.',
            actionUrl: '/orders/track',
            actionLabel: 'Track Live GPS',
            isRead: false,
            createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
            channels: {
              sms: 'Hi Ankit! Order #ORD-2026-8912 is out for delivery. Track live: https://track.riddhamart.com',
              push: '🚚 Order Out for Delivery! Expected arrival: 04:45 PM',
              email: '<h3>Order Out for Delivery</h3><p>Your delivery agent Vikram Singh is on the way.</p>',
              whatsapp: 'Hi *Ankit*! 👋 Your order is *Out for Delivery*. Expected: 04:45 PM.'
            }
          },
          {
            _id: 'notif-2',
            type: 'quote_received',
            category: 'projects',
            title: '📄 New Quotation Received for Villa Project',
            message: 'Your designer has generated a GST-compliant quotation #QT-2026-4772 for Rs. 151,712.',
            actionUrl: '/quotation-generator',
            actionLabel: 'View Quotation',
            isRead: false,
            createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
            channels: {
              sms: 'New Quotation QT-2026-4772 ready. View details: https://riddhamart.com/quotation',
              push: '📄 Quotation Ready! Grand total: Rs. 151,712'
            }
          },
          {
            _id: 'notif-3',
            type: 'seasonal_offer',
            category: 'promotions',
            title: '✨ 20% Off Architectural Warm LED Lighting',
            message: 'Exclusive 48-hour flash offer on dimmable COB ceiling spotlights & floor lamps.',
            actionUrl: '/categories',
            actionLabel: 'Explore Collection',
            isRead: true,
            createdAt: new Date(Date.now() - 24 * 3600000).toISOString()
          }
        ];
        setNotifications(demoList);
        setUnreadCount(2);
      }
    } catch (e) {
      toast.error('Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await notificationCenterService.markAsRead(id);
      toast.success(id === 'all' ? 'All marked as read' : 'Marked as read');
      fetchNotifications();
    } catch (e) {
      toast.error('Failed to mark read.');
    }
  };

  const handleDelete = async (id) => {
    try {
      await notificationCenterService.deleteNotification(id);
      toast.success('Notification deleted');
      setNotifications(prev => prev.filter(n => n._id !== id));
    } catch (e) {
      toast.error('Failed to delete notification.');
    }
  };

  if (loading && notifications.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-600 mx-auto"></div>
          <p className="text-slate-500 text-sm font-semibold">Loading Notification Inbox...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-3 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Hero Header Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 rounded-3xl p-6 sm:p-8 text-white shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-slate-700/50">
          <div className="space-y-3">
            <div className="inline-flex items-center space-x-2 bg-amber-500/20 border border-amber-500/30 px-3 py-1 rounded-full text-xs font-semibold text-amber-300">
              <LuSparkles className="text-amber-400" />
              <span>Multi-Channel Notification Center</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-display font-black text-white tracking-tight">
              Notification Inbox
            </h1>
            <p className="text-slate-200 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Stay updated on your interior orders, project milestones, payment quotes, and personalized design offers across SMS, Email, Push & WhatsApp.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 w-full sm:w-auto">
            <button
              onClick={() => handleMarkAsRead('all')}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-deep-espresso font-bold text-xs rounded-xl shadow-md inline-flex items-center justify-center gap-2"
            >
              <FiCheckCircle /> Mark All as Read ({unreadCount})
            </button>
            <Link
              to="/notifications/preferences"
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 font-bold text-xs rounded-xl shadow-md inline-flex items-center justify-center gap-2"
            >
              <FiSettings /> Preferences
            </Link>
          </div>
        </div>

        {/* Category Pill Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-2 scrollbar-none max-w-full">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2.5 text-xs font-bold rounded-2xl transition-all whitespace-nowrap inline-flex items-center gap-2 shrink-0 ${activeCategory === cat.id
                ? 'bg-slate-900 text-amber-400 shadow-md ring-2 ring-slate-900'
                : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
            >
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* NOTIFICATION LIST */}
        <div className="space-y-3">
          {notifications.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center space-y-3 border border-slate-200 shadow-sm">
              <FiBell className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800 font-display">No Notifications Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">Your notification inbox is clean! Check back when your order status updates or new project quotes arrive.</p>
            </div>
          ) : (
            notifications.map((item) => {
              const isExpanded = expandedId === item._id;

              return (
                <div
                  key={item._id}
                  className={`bg-white rounded-2xl p-5 border transition-all shadow-sm ${
                    !item.isRead ? 'border-amber-500/60 bg-amber-500/5 ring-1 ring-amber-500/20' : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start space-x-3.5 flex-1">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 ${
                        !item.isRead ? 'bg-amber-500 text-deep-espresso shadow-md font-bold' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {item.category === 'orders' ? '🚚' : item.category === 'projects' ? '📄' : item.category === 'promotions' ? '✨' : '🔔'}
                      </div>

                      <div className="space-y-1 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-bold text-slate-900 text-sm">{item.title}</h4>
                          {!item.isRead && (
                            <span className="bg-amber-500 text-deep-espresso font-black text-[9px] uppercase px-2 py-0.5 rounded-full">NEW</span>
                          )}
                          <span className="text-[10px] font-semibold text-slate-400">
                            {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 leading-relaxed">{item.message}</p>

                        {/* Action Link & Expand Channels Row */}
                        <div className="flex flex-wrap items-center gap-3 pt-2">
                          {item.actionUrl && (
                            <Link
                              to={item.actionUrl}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-xs rounded-xl shadow-sm"
                            >
                              <span>{item.actionLabel || 'View Action'}</span>
                              <FiExternalLink />
                            </Link>
                          )}

                          {item.channels && (
                            <button
                              onClick={() => setExpandedId(isExpanded ? null : item._id)}
                              className="text-[11px] font-bold text-slate-500 hover:text-slate-900 inline-flex items-center gap-1"
                            >
                              <LuBrain className="text-amber-600" />
                              <span>{isExpanded ? 'Hide Channels' : 'View Multi-Channel Formats'}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1 shrink-0">
                      {!item.isRead && (
                        <button
                          onClick={() => handleMarkAsRead(item._id)}
                          title="Mark as read"
                          className="p-2 text-slate-400 hover:text-emerald-600 rounded-lg"
                        >
                          <FiCheck />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(item._id)}
                        title="Delete notification"
                        className="p-2 text-slate-400 hover:text-red-600 rounded-lg"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </div>

                  {/* Multi-Channel Format Drawer */}
                  <AnimatePresence>
                    {isExpanded && item.channels && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs"
                      >
                        {item.channels.sms && (
                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                            <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                              <FiSmartphone className="text-blue-600" /> SMS Format (Twilio)
                            </span>
                            <p className="text-[11px] text-slate-800 font-mono">{item.channels.sms}</p>
                          </div>
                        )}
                        {item.channels.push && (
                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                            <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                              <FiBell className="text-amber-600" /> Push Notification (FCM)
                            </span>
                            <p className="text-[11px] text-slate-800 font-semibold">{item.channels.push}</p>
                          </div>
                        )}
                        {item.channels.whatsapp && (
                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                            <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                              <FiMessageSquare className="text-emerald-600" /> WhatsApp Format
                            </span>
                            <p className="text-[11px] text-slate-800">{item.channels.whatsapp}</p>
                          </div>
                        )}
                        {item.channels.email && (
                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                            <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                              <FiMail className="text-purple-600" /> Email HTML Template
                            </span>
                            <div className="text-[11px] text-slate-800 truncate" dangerouslySetInnerHTML={{ __html: item.channels.email }}></div>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
};

export default NotificationCenterPage;
