import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import PageWrapper from '../components/PageWrapper';
import { 
  FiBell, 
  FiCheck, 
  FiTrash2, 
  FiClock, 
  FiAlertCircle, 
  FiInfo, 
  FiCheckCircle, 
  FiX, 
  FiChevronRight, 
  FiInbox
} from 'react-icons/fi';
import { useNotification } from '../../user/data/NotificationContext';
import { formatDistanceToNow } from 'date-fns';

const NotificationsPage = () => {
  const navigate = useNavigate();
  const { notifications, markAsRead, markAllAsRead, deleteNotification } = useNotification();
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedNotification, setSelectedNotification] = useState(null);

  const filteredNotifications = (notifications || []).filter(n => {
    if (activeFilter === 'unread') return !n.read;
    return true;
  });

  const getIcon = (type) => {
    const t = (type || '').toLowerCase();
    if (t.includes('success') || t.includes('delivered') || t.includes('approved')) {
      return <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center"><FiCheckCircle size={20} /></div>;
    }
    if (t.includes('warning') || t.includes('cancelled') || t.includes('rejected') || t.includes('alert')) {
      return <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center"><FiAlertCircle size={20} /></div>;
    }
    return <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center"><FiInfo size={20} /></div>;
  };

  return (
    <PageWrapper>
      <div className="max-w-4xl mx-auto space-y-8 pb-20">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 px-4 md:px-0">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-display font-bold text-deep-espresso">Notification Center</h1>
            <p className="text-warm-sand text-sm md:text-base font-medium">Stay synchronized with your administration events</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-2 bg-white border border-soft-oatmeal text-deep-espresso px-6 py-3 rounded-xl font-semibold hover:bg-soft-oatmeal/50 transition-all text-xs uppercase tracking-widest shadow-sm"
            >
              <FiCheck size={18} />
              Mark All Read
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-1 bg-white p-1.5 rounded-2xl border border-soft-oatmeal shadow-sm w-fit mx-4 md:mx-0">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeFilter === 'all' ? 'bg-deep-espresso text-white shadow-lg' : 'text-warm-sand hover:text-deep-espresso'}`}
          >
            All Activity
          </button>
          <button
            onClick={() => setActiveFilter('unread')}
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeFilter === 'unread' ? 'bg-[#189D91] text-white shadow-lg' : 'text-warm-sand hover:text-deep-espresso'}`}
          >
            Unread Only
          </button>
        </div>

        {/* Notifications List */}
        <div className="space-y-4 px-4 md:px-0">
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map((notification) => (
              <motion.div
                layout
                key={notification._id}
                onClick={() => {
                  markAsRead(notification._id);
                  setSelectedNotification(notification);
                }}
                className={`group relative bg-white p-6 rounded-[2rem] border transition-all cursor-pointer hover:shadow-md ${!notification.read ? 'border-[#189D91]/20 bg-teal-50/5' : 'border-soft-oatmeal'}`}
              >
                {!notification.read && (
                  <div className="absolute top-6 right-8 w-2 h-2 bg-[#189D91] rounded-full animate-pulse" />
                )}
                
                <div className="flex gap-5">
                  <div className="shrink-0">
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-1">
                        <h3 className={`text-base font-semibold transition-colors ${!notification.read ? 'text-slate-900 font-bold' : 'text-slate-500 font-medium'}`}>
                          {notification.title}
                        </h3>
                        <p className={`text-sm line-clamp-2 leading-relaxed ${!notification.read ? 'text-slate-700' : 'text-slate-400'}`}>
                          {notification.message}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-4 shrink-0">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-lg">
                          <FiClock size={12} />
                          {notification.createdAt ? formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true }) : 'Just now'}
                        </span>
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteNotification(notification._id); }}
                          className="opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-24 bg-white rounded-[2.5rem] border border-dashed border-soft-oatmeal">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200">
                <FiInbox size={40} />
              </div>
              <h3 className="text-xl font-semibold text-slate-900">All caught up!</h3>
              <p className="text-slate-500 text-sm mt-2 max-w-xs mx-auto">Your notification inbox is empty. We'll alert you as soon as something happens.</p>
            </div>
          )}
        </div>
      </div>

      {/* Notification Detail Overlay */}
      <AnimatePresence>
        {selectedNotification && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
              onClick={() => setSelectedNotification(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl border border-soft-oatmeal z-10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-10 space-y-8">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-[10px] font-semibold text-deep-espresso uppercase tracking-widest mb-1">
                       <FiBell size={12} /> System Alert
                    </div>
                    <h2 className="text-2xl font-semibold text-slate-900 tracking-tight">{selectedNotification.title}</h2>
                  </div>
                  <button 
                    onClick={() => setSelectedNotification(null)}
                    className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    <FiX size={24} className="text-slate-400" />
                  </button>
                </div>

                <div className="bg-slate-50 rounded-[2rem] p-8 border border-slate-100">
                  <p className="text-base text-slate-700 leading-relaxed font-medium">
                    {selectedNotification.message}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2 text-slate-400">
                    <FiClock size={16} />
                    <span className="text-[11px] font-semibold uppercase tracking-widest">{selectedNotification.createdAt ? formatDistanceToNow(new Date(selectedNotification.createdAt), { addSuffix: true }) : 'Just now'}</span>
                  </div>
                  <div className="flex gap-4">
                    <button 
                      onClick={() => setSelectedNotification(null)}
                      className="px-6 py-3.5 rounded-2xl bg-slate-100 text-slate-600 text-xs font-semibold uppercase tracking-widest hover:bg-slate-200 transition-colors"
                    >
                      Dismiss
                    </button>
                    {selectedNotification.link && (
                      <button 
                        onClick={() => {
                          navigate(selectedNotification.link);
                          setSelectedNotification(null);
                        }}
                        className="px-8 py-3.5 rounded-2xl bg-deep-espresso text-white text-xs font-semibold uppercase tracking-widest hover:bg-dusty-cocoa transition-all shadow-lg shadow-deep-espresso/20 flex items-center gap-2"
                      >
                        Action <FiChevronRight size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </PageWrapper>
  );
};

export default NotificationsPage;
