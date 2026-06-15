import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import PageWrapper from '../components/PageWrapper';
import { 
  Bell, 
  CheckCheck, 
  Trash2, 
  Clock, 
  AlertCircle, 
  Info, 
  CheckCircle2, 
  Volume2, 
  VolumeX,
  X,
  ChevronRight,
  Inbox
} from 'lucide-react';
import { isSoundEnabled, setSoundEnabled } from '../utils/notificationSound';
import { useNotification } from '../../user/data/NotificationContext';
import { formatDistanceToNow } from 'date-fns';

const Notifications = () => {
  const navigate = useNavigate();
  const { notifications, markAsRead, markAllAsRead, deleteNotification } = useNotification();
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [sound, setSound] = useState(() => isSoundEnabled());

  const filteredNotifications = (notifications || []).filter(n => {
    if (activeFilter === 'unread') return !n.read;
    return true;
  });

  const getIcon = (type) => {
    const t = (type || '').toLowerCase();
    if (t.includes('success') || t.includes('delivered') || t.includes('approved')) {
      return <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center"><CheckCircle2 size={20} /></div>;
    }
    if (t.includes('warning') || t.includes('cancelled') || t.includes('rejected')) {
      return <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center"><AlertCircle size={20} /></div>;
    }
    return <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center"><Info size={20} /></div>;
  };

  return (
    <PageWrapper>
      <div className="max-w-4xl mx-auto space-y-8 pb-20">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 px-4 md:px-0">
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">Notification Center</h1>
            <p className="text-sm font-medium text-slate-500">Stay synchronized with your store's latest events</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                const next = !sound;
                setSound(next);
                setSoundEnabled(next);
              }}
              className={`p-3 rounded-xl transition-all shadow-sm border ${sound
                  ? 'bg-seller-primary text-white hover:bg-seller-dark shadow-seller-primary/20'
                  : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50'
                }`}
              title={sound ? 'Disable Sound' : 'Enable Sound'}
            >
              {sound ? <Volume2 size={20} /> : <VolumeX size={20} />}
            </button>
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 px-3 sm:px-6 py-3 rounded-xl font-semibold hover:bg-slate-50 transition-all text-xs uppercase tracking-widest shadow-sm"
            >
              <CheckCheck size={18} />
              <span className="hidden sm:inline">Mark All Read</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-1 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm w-fit mx-4 md:mx-0">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 sm:px-6 py-2 sm:py-2.5 rounded-xl text-[11px] sm:text-xs font-semibold transition-all ${activeFilter === 'all' ? 'bg-seller-primary text-white shadow-lg shadow-seller-primary/20' : 'text-slate-500 hover:text-slate-900'}`}
          >
            All Activity
          </button>
          <button
            onClick={() => setActiveFilter('unread')}
            className={`px-3 sm:px-6 py-2 sm:py-2.5 rounded-xl text-[11px] sm:text-xs font-semibold transition-all ${activeFilter === 'unread' ? 'bg-seller-primary text-white shadow-lg shadow-seller-primary/20' : 'text-slate-500 hover:text-slate-900'}`}
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
                className={`group relative bg-white p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] border transition-all cursor-pointer hover:shadow-md ${!notification.read ? 'border-seller-primary/20 bg-seller-light/5' : 'border-slate-200'}`}
              >
                {!notification.read && (
                  <div className="absolute top-4 sm:top-6 right-6 sm:right-8 w-2 h-2 bg-seller-primary rounded-full animate-pulse" />
                )}
                
                <div className="flex gap-3 sm:gap-5">
                  <div className="shrink-0">
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-4">
                      <div className="space-y-1">
                        <h3 className={`text-base font-semibold transition-colors ${!notification.read ? 'text-slate-900' : 'text-slate-500'}`}>
                          {notification.title}
                        </h3>
                        <p className={`text-sm line-clamp-2 leading-relaxed ${!notification.read ? 'text-slate-700' : 'text-slate-400'}`}>
                          {notification.message}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-4 shrink-0 self-start sm:self-auto">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-lg">
                          <Clock size={12} />
                          {notification.createdAt ? formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true }) : 'Just now'}
                        </span>
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteNotification(notification._id); }}
                          className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 p-2 text-slate-400 sm:text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-24 bg-white rounded-[2.5rem] border border-dashed border-slate-200">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200">
                <Inbox size={40} />
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
              className="relative bg-white w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl border border-slate-100 z-10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-10 space-y-8">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-[10px] font-semibold text-seller-primary uppercase tracking-widest mb-1">
                       <Bell size={12} /> Merchant Alert
                    </div>
                    <h2 className="text-2xl font-semibold text-slate-900 tracking-tight">{selectedNotification.title}</h2>
                  </div>
                  <button 
                    onClick={() => setSelectedNotification(null)}
                    className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    <X size={24} className="text-slate-400" />
                  </button>
                </div>

                <div className="bg-slate-50 rounded-[2rem] p-8 border border-slate-100">
                  <p className="text-base text-slate-700 leading-relaxed font-medium">
                    {selectedNotification.message}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Clock size={16} />
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
                        className="px-8 py-3.5 rounded-2xl bg-seller-primary text-white text-xs font-semibold uppercase tracking-widest hover:bg-seller-dark transition-all shadow-lg shadow-seller-primary/20 flex items-center gap-2"
                      >
                        Action <ChevronRight size={16} />
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

export default Notifications;
