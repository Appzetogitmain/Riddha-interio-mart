import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotification } from '../data/NotificationContext';
import { FiBell, FiCheck, FiTrash2, FiInfo, FiBox, FiTruck, FiUserCheck, FiAlertTriangle } from 'react-icons/fi';
import { LuIndianRupee } from 'react-icons/lu';
import { formatDistanceToNow } from 'date-fns';
import Button from '../../../shared/components/Button';

const NotificationPage = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, loading, fetchNotifications } = useNotification();
  const [filter, setFilter] = useState('all'); // 'all' or 'unread'

  useEffect(() => {
    fetchNotifications();
  }, []);

  const getIconForType = (type) => {
    switch (type) {
      case 'order_update': return <FiBox className="w-5 h-5 text-blue-500" />;
      case 'delivery_update': return <FiTruck className="w-5 h-5 text-green-500" />;
      case 'payment_success': return <LuIndianRupee className="w-5 h-5 text-emerald-500" />;
      case 'seller_approval': return <FiUserCheck className="w-5 h-5 text-purple-500" />;
      case 'admin_alert': return <FiAlertTriangle className="w-5 h-5 text-red-500" />;
      case 'stock_alert': return <FiAlertTriangle className="w-5 h-5 text-orange-500" />;
      default: return <FiInfo className="w-5 h-5 text-gray-500" />;
    }
  };

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.read) 
    : notifications;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-deep-espresso tracking-tight flex items-center gap-3">
              <FiBell className="text-[#189D91]" /> Notifications
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-0.5 rounded-full mt-1">
                  {unreadCount} New
                </span>
              )}
            </h1>
            <p className="text-sm text-gray-500 mt-2 font-medium">Stay updated with your account activity</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="bg-white p-1 rounded-xl shadow-sm border border-gray-100 flex">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${filter === 'all' ? 'bg-deep-espresso text-white shadow-md' : 'text-gray-400 hover:text-deep-espresso'}`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${filter === 'unread' ? 'bg-[#189D91] text-white shadow-md' : 'text-gray-400 hover:text-deep-espresso'}`}
              >
                Unread
              </button>
            </div>
            
            {unreadCount > 0 && (
              <Button onClick={markAllAsRead} className="h-10 px-4 rounded-xl bg-white border border-gray-200 text-deep-espresso hover:border-[#189D91] hover:text-[#189D91] text-[10px] font-black uppercase tracking-widest shadow-sm">
                Mark All Read
              </Button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/40 border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#189D91] mx-auto"></div>
              <p className="text-gray-400 text-sm font-medium mt-4">Loading notifications...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="p-16 text-center">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiBell className="w-8 h-8 text-gray-300" />
              </div>
              <h3 className="text-lg font-bold text-deep-espresso">All caught up!</h3>
              <p className="text-gray-500 mt-1">You don't have any {filter === 'unread' ? 'unread ' : ''}notifications.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              <AnimatePresence>
                {filteredNotifications.map((notif) => (
                  <motion.div
                    key={notif._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    className={`p-6 transition-colors group flex gap-4 ${!notif.read ? 'bg-blue-50/20' : 'hover:bg-gray-50/50'}`}
                  >
                    <div className="flex-shrink-0 mt-1">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${!notif.read ? 'bg-white shadow-sm border border-blue-100' : 'bg-gray-50'}`}>
                        {getIconForType(notif.type)}
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-4">
                        <div 
                          className="cursor-pointer"
                          onClick={() => { if (!notif.read) markAsRead(notif._id); }}
                        >
                          <h4 className={`text-base ${!notif.read ? 'font-bold text-deep-espresso' : 'font-semibold text-gray-700'}`}>
                            {notif.title}
                          </h4>
                          <p className={`mt-1 text-sm ${!notif.read ? 'text-gray-600' : 'text-gray-500'}`}>
                            {notif.message}
                          </p>
                          <p className="text-[10px] font-bold text-gray-400 mt-3 uppercase tracking-widest flex items-center gap-2">
                            {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                            {!notif.read && <span className="w-1.5 h-1.5 rounded-full bg-[#189D91] inline-block"></span>}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!notif.read && (
                            <button
                              onClick={(e) => { e.stopPropagation(); markAsRead(notif._id); }}
                              className="p-2 text-gray-400 hover:text-[#189D91] bg-white rounded-full shadow-sm border border-gray-100 transition-colors tooltip-trigger"
                              title="Mark as read"
                            >
                              <FiCheck className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteNotification(notif._id); }}
                            className="p-2 text-gray-400 hover:text-red-500 bg-white rounded-full shadow-sm border border-gray-100 transition-colors tooltip-trigger"
                            title="Delete"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationPage;
