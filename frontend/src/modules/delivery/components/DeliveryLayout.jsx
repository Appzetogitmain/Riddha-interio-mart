import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import DeliverySidebar from './DeliverySidebar';
import DeliveryBottomNavbar from './DeliveryBottomNavbar';
import {
  LuMenu,
  LuUser,
  LuChevronDown,
  LuTruck,
  LuCheck,
  LuX,
  LuSearch,
  LuBell,
  LuZap,
  LuClock,
  LuCircleDot,
  LuNavigation,
  LuLogOut,
  LuPackage,
  LuWifiOff
} from 'react-icons/lu';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '../../user/data/UserContext';
import NotificationDropdown from '../../../shared/components/NotificationDropdown';
import api from '../../../shared/utils/api';
import { connectSocket } from '../../../shared/utils/socket';
import { primeNotificationAudio, isSoundEnabled, playNotificationSound } from '../../../shared/utils/notificationSound';
import { toast } from 'react-hot-toast';

const formatTime = (dateStr) => {
  const date = new Date(dateStr);
  const diffMs = Date.now() - date.getTime();
  if (diffMs < 0 || isNaN(diffMs)) return 'Just now';
  const secs = Math.floor(diffMs / 1000);
  if (secs < 60) return 'Just now';
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const DeliveryLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [showUserMenu, setShowUserMenu] = React.useState(false);
  const [showNotifications, setShowNotifications] = React.useState(false);
  const [notifications, setNotifications] = React.useState([]);
  const [assignmentRequest, setAssignmentRequest] = React.useState(null);
  const [approvalNotification, setApprovalNotification] = React.useState(null);
  const [notification, setNotification] = React.useState(null);
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);
  const { user, setUser, logout } = useUser();
  const [updatingStatus, setUpdatingStatus] = React.useState(false);
  const navigate = useNavigate();

  React.useEffect(() => {
    const handleOnline  = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online',  handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online',  handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const storedUser = JSON.parse(localStorage.getItem('riddha_user') || 'null');
  const activeUser = user || storedUser;
  const hasValidDeliverySession =
    Boolean(activeUser?.token) && activeUser?.role === 'delivery';

  React.useEffect(() => {
    if (!hasValidDeliverySession) {
      navigate('/delivery/login', { replace: true });
    }
  }, [hasValidDeliverySession, navigate]);

  if (!hasValidDeliverySession) {
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate('/delivery/login');
  };

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get('/notifications?limit=50');
      if (data.success && data.data) {
        const mapped = data.data.map(notif => ({
          id: notif._id,
          _id: notif._id,
          title: notif.title,
          message: notif.message,
          status: notif.read ? 'read' : 'unread',
          read: notif.read,
          time: formatTime(notif.createdAt),
          link: notif.metadata?.link || (notif.type === 'delivery_update' ? '/delivery/orders' : null),
          ...notif
        }));
        setNotifications(mapped);
      }
    } catch (err) {
      console.error('Failed to fetch notifications in Layout:', err);
    }
  };

  React.useEffect(() => {
    fetchNotifications();
    window.addEventListener('delivery_notifications_updated', fetchNotifications);
    return () => window.removeEventListener('delivery_notifications_updated', fetchNotifications);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAllRead = async () => {
    try {
      const { data } = await api.put('/notifications/read-all');
      if (data.success) {
        setNotifications(prev => prev.map(n => ({ ...n, status: 'read', read: true })));
        window.dispatchEvent(new Event('delivery_notifications_updated'));
      }
    } catch (err) {
      console.error('Failed to mark all as read in Layout dropdown:', err);
    }
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.read) {
      try {
        const { data } = await api.put(`/notifications/${notif._id}/read`);
        if (data.success) {
          setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, status: 'read', read: true } : n));
          window.dispatchEvent(new Event('delivery_notifications_updated'));
        }
      } catch (err) {
        console.error('Failed to mark notification as read in Layout dropdown:', err);
      }
    }
    setShowNotifications(false);
    if (notif.link) navigate(notif.link);
  };

  const status = user?.status || 'Offline';

  // Sync status if user profile changes - Removed redundant useEffect as we use status variable now

  // Prime audio
  React.useEffect(() => {
    const onFirstGesture = () => {
      primeNotificationAudio();
      window.removeEventListener('pointerdown', onFirstGesture);
    };
    window.addEventListener('pointerdown', onFirstGesture);
    return () => window.removeEventListener('pointerdown', onFirstGesture);
  }, []);

  // Socket setup
  React.useEffect(() => {
    if (!user || user?.role !== 'delivery') return;

    const socket = connectSocket({ token: user.token || 'cookie' });

    const onAssigned = (payload) => {
      setAssignmentRequest(payload);
    };

    const onApprovalUpdate = (payload) => {
      setApprovalNotification(payload);
      if (payload.status === 'Approved') {
        setUser(prev => ({ ...prev, approvalStatus: 'Approved' }));
      }
    };

    const onNotificationNew = (newNotif) => {
      const mapped = {
        id: newNotif._id,
        _id: newNotif._id,
        title: newNotif.title,
        message: newNotif.message,
        status: newNotif.read ? 'read' : 'unread',
        read: newNotif.read,
        time: formatTime(newNotif.createdAt),
        link: newNotif.metadata?.link || (newNotif.type === 'delivery_update' ? '/delivery/orders' : null),
        ...newNotif
      };

      setNotifications(prev => {
        if (prev.some(n => n._id === mapped._id)) return prev;
        return [mapped, ...prev];
      });

      // Dispatch window event so any listening pages/sidebars refresh
      window.dispatchEvent(new Event('delivery_notifications_updated'));

      // Show unified screen toast
      setNotification({
        title: newNotif.title,
        message: newNotif.message,
        type: newNotif.title?.toLowerCase().includes('approved') ? 'success' : 'info'
      });

      // Vibrate / Play Sound
      if (isSoundEnabled()) playNotificationSound();
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    };

    socket.on('delivery:assigned', onAssigned);
    socket.on('delivery:approval_update', onApprovalUpdate);
    socket.on('notification:new', onNotificationNew);

    return () => {
      socket.off('delivery:assigned', onAssigned);
      socket.off('delivery:approval_update', onApprovalUpdate);
      socket.off('notification:new', onNotificationNew);
    };
  }, [user?.token, user?.role]);

  React.useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleResponse = async (responseStatus) => {
    try {
      await api.put(`/orders/${assignmentRequest.orderId}/delivery-response`, { status: responseStatus });
      setAssignmentRequest(null);
    } catch (err) {
      console.error('Response failed:', err);
    }
  };

  const toggleStatus = async () => {
    if (user?.approvalStatus !== 'Approved') return;
    setUpdatingStatus(true);
    const newStatus = status === 'Available' ? 'Offline' : 'Available';
    try {
      const { data } = await api.put('/delivery/status', { status: newStatus });
      if (data.success) {
        setUser({ ...user, status: data.data.status });
        if (newStatus === 'Available') {
          toast.success('You are now Online — orders will be assigned to you', { icon: '🟢' });
        } else {
          toast('You are now Offline — no new orders will be received', { icon: '⚫', style: { background: '#1e293b', color: '#fff' } });
        }
      }
    } catch (err) {
      console.error('Failed to update status:', err);
      toast.error('Failed to update status. Try again.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#F8FAFC] text-slate-900 overflow-hidden font-sans">
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            onClick={() => setNotification(null)}
            className="fixed top-6 right-6 z-[130] w-[380px] max-w-[calc(100vw-3rem)] cursor-pointer"
          >
            <div className="bg-white rounded-[2rem] shadow-2xl border border-slate-100 overflow-hidden">
              <div className="p-6 flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-teal-50 text-[#189D91]`}>
                   <LuZap size={24} />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-[#189D91]">Notification</p>
                  <h4 className="text-sm font-bold text-slate-900 mt-1">{notification.title}</h4>
                  <p className="text-sm text-slate-500 mt-1">{notification.message}</p>
                </div>
              </div>
              <div className="h-1 w-full bg-slate-50">
                <motion.div 
                   initial={{ width: "100%" }}
                   animate={{ width: "0%" }}
                   transition={{ duration: 6, ease: "linear" }}
                   className="h-full bg-[#189D91]"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Assignment Request Modal */}
      <AnimatePresence>
        {assignmentRequest && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-xl"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden"
            >
              <div className="bg-gradient-to-br from-[#189D91] to-[#137A71] p-8 text-white text-center flex flex-col items-center">
                 <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-md">
                    <LuPackage size={32} />
                 </div>
                 <h3 className="text-2xl font-bold">New Delivery</h3>
                 <p className="text-white/80 text-sm mt-1">You have a new delivery request</p>
              </div>

              <div className="p-8 space-y-6">
                 <div className="flex items-center justify-between">
                    <div>
                       <p className="text-xs font-semibold text-slate-500 mb-1">Expected Earnings</p>
                       <p className="text-2xl font-bold text-slate-900">₹{Number(assignmentRequest.totalPrice || 0).toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                       <p className="text-xs font-semibold text-slate-500 mb-1">Estimated Time</p>
                       <p className="text-lg font-bold text-[#189D91]">25-40 min</p>
                    </div>
                 </div>

                 <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                    <p className="text-xs font-semibold text-[#189D91] mb-3 border-b border-slate-200 pb-2">Pickup Location</p>
                    <div className="flex items-start gap-4">
                       <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500">
                          <LuNavigation size={20} />
                       </div>
                       <div>
                          <p className="text-sm font-bold text-slate-900">{assignmentRequest.customerName}</p>
                          <p className="text-sm text-slate-500 mt-1">
                            {assignmentRequest.shippingAddress?.fullAddress}, {assignmentRequest.shippingAddress?.city}
                          </p>
                       </div>
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => handleResponse('Rejected')}
                      className="bg-white border border-slate-200 text-slate-600 py-3 rounded-xl font-semibold text-sm hover:bg-slate-50 transition-all"
                    >
                       Decline
                    </button>
                    <button 
                      onClick={() => handleResponse('Accepted')}
                      className="bg-[#189D91] text-white py-3 rounded-xl font-semibold text-sm hover:bg-[#137A71] transition-all flex items-center justify-center gap-2"
                    >
                       <LuCheck size={18} />
                       Accept Order
                    </button>
                 </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <DeliverySidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex-1 flex flex-col h-full overflow-hidden w-full relative">
        {/* Offline banner */}
        <AnimatePresence>
          {!isOnline && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden z-[70] sticky top-0"
            >
              <div className="bg-rose-600 text-white text-xs font-bold text-center py-2 flex items-center justify-center gap-2">
                <LuWifiOff size={13} />
                No internet connection — check your network and try again
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <header className="h-14 md:h-24 bg-white border-b border-slate-100 px-4 md:px-8 flex items-center justify-between z-30 sticky top-0">
          <div className="flex items-center gap-6">
            <button 
              onClick={(e) => { e.stopPropagation(); setIsSidebarOpen(true); }}
              className="lg:hidden p-3 bg-slate-50 rounded-xl text-slate-600"
            >
              <LuMenu size={24} />
            </button>
            <div className="hidden lg:block">
               <h2 className="text-xl font-bold text-slate-900">Dashboard</h2>
               <p className="text-sm font-medium text-slate-500 mt-1">Overview</p>
            </div>
            
            {/* Search Bar (Desktop) */}
            <div className="hidden xl:flex items-center gap-3 bg-slate-50 border border-slate-100 px-4 py-2.5 rounded-xl w-80 group focus-within:border-[#189D91]/30 transition-all">
               <LuSearch size={18} className="text-slate-400 group-focus-within:text-[#189D91]" />
               <input type="text" placeholder="Search orders..." className="bg-transparent border-none focus:ring-0 text-sm placeholder:text-slate-400 w-full" />
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Status Toggle */}
            {user?.approvalStatus === 'Approved' && (
              <button
                onClick={(e) => { e.stopPropagation(); toggleStatus(); }}
                disabled={updatingStatus}
                className="focus:outline-none"
                title={status === 'Available' ? 'Click to go Offline' : 'Click to go Online'}
              >
                <motion.div
                  animate={{
                    backgroundColor: status === 'Available' ? 'rgba(16,185,129,0.1)' : 'rgba(100,116,139,0.08)',
                    borderColor: status === 'Available' ? 'rgba(16,185,129,0.35)' : 'rgba(100,116,139,0.2)',
                  }}
                  transition={{ duration: 0.25 }}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border"
                >
                  <div className="relative shrink-0 w-2 h-2">
                    {updatingStatus ? (
                      <div className="w-2 h-2 border border-slate-400 border-t-slate-600 rounded-full animate-spin" />
                    ) : (
                      <div className={`w-2 h-2 rounded-full ${status === 'Available' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                    )}
                    {status === 'Available' && !updatingStatus && (
                      <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-70" />
                    )}
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider leading-none ${status === 'Available' ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {updatingStatus ? '…' : status === 'Available' ? 'Online' : 'Offline'}
                  </span>
                </motion.div>
              </button>
            )}

            <div className="flex items-center gap-2 relative">
               <div>
                 <button
                   onClick={(e) => { e.stopPropagation(); setShowNotifications(!showNotifications); setShowUserMenu(false); }}
                   className="p-3 text-slate-500 hover:text-[#2A458A] hover:bg-[#2A458A]/10 rounded-xl transition-all relative"
                 >
                    <LuBell size={22} />
                    {unreadCount > 0 && (
                      <div className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 border-2 border-white rounded-full animate-pulse"></div>
                    )}
                 </button>

                 <AnimatePresence>
                   {showNotifications && (
                     <>
                       <div
                         className="fixed inset-0 z-40"
                         onClick={(e) => { e.stopPropagation(); setShowNotifications(false); }}
                       />
                       <motion.div
                         initial={{ opacity: 0, y: 10, scale: 0.95 }}
                         animate={{ opacity: 1, y: 0, scale: 1 }}
                         exit={{ opacity: 0, y: 10, scale: 0.95 }}
                         className="absolute right-0 top-full mt-2 w-[320px] bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-50 flex flex-col max-h-[400px]"
                       >
                          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                             <h3 className="font-medium text-slate-900">Notifications</h3>
                             {unreadCount > 0 && (
                               <button
                                 onClick={handleMarkAllRead}
                                 className="text-[10px] font-medium text-[#2A458A] hover:text-[#189D91] transition-colors"
                               >
                                 Mark all read
                               </button>
                             )}
                          </div>
                          <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                             {notifications.length === 0 ? (
                               <div className="p-6 text-center text-slate-400">
                                 <LuBell size={32} className="mx-auto mb-2 opacity-20" />
                                 <p className="text-sm font-normal">No notifications yet</p>
                               </div>
                             ) : (
                               notifications.map((notif) => (
                                 <div
                                   key={notif._id}
                                   onClick={() => handleNotificationClick(notif)}
                                   className={`p-3 rounded-2xl cursor-pointer transition-all flex gap-3 ${!notif.read ? 'bg-[#2A458A]/5 hover:bg-[#2A458A]/10' : 'hover:bg-slate-50'}`}
                                 >
                                   <div className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${!notif.read ? 'bg-[#2A458A]' : 'bg-transparent'}`} />
                                   <div>
                                     <h4 className="text-sm font-normal text-slate-800">
                                       {notif.title}
                                     </h4>
                                     <p className="text-xs text-slate-500 mt-0.5">{notif.message}</p>
                                     <span className="text-[10px] font-normal text-slate-400 mt-1.5 block">
                                       {notif.time}
                                     </span>
                                   </div>
                                 </div>
                               ))
                             )}
                          </div>
                       </motion.div>
                     </>
                   )}
                 </AnimatePresence>
               </div>
               
               <div className="h-8 w-[1px] bg-slate-200 mx-2"></div>
               
               <div className="relative">
                 <div 
                   onClick={(e) => { e.stopPropagation(); setShowUserMenu(!showUserMenu); setShowNotifications(false); }}
                   className="flex items-center gap-3 cursor-pointer group"
                 >
                   <div className="text-right hidden sm:block">
                     <p className="text-sm font-semibold text-slate-900">{user?.fullName || 'Partner'}</p>
                     <p className="text-xs text-slate-500 mt-0.5">
                       {user?.approvalStatus === 'Approved' ? 'Active' : 'Pending'}
                     </p>
                   </div>
                   <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-200 shadow-sm transition-all">
                      <img src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.fullName || 'Partner'}&background=189D91&color=fff`} className="w-full h-full object-cover" alt="avatar" />
                   </div>
                 </div>

                 <AnimatePresence>
                   {showUserMenu && (
                     <>
                       <div 
                         className="fixed inset-0 z-40" 
                         onClick={(e) => { e.stopPropagation(); setShowUserMenu(false); }} 
                       />
                       <motion.div
                         initial={{ opacity: 0, y: 10, scale: 0.95 }}
                         animate={{ opacity: 1, y: 0, scale: 1 }}
                         exit={{ opacity: 0, y: 10, scale: 0.95 }}
                         className="absolute right-0 mt-4 w-56 bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-50 p-3"
                       >
                          <div className="p-4 border-b border-slate-100 mb-2">
                             <p className="text-xs font-semibold text-slate-500 mb-1">Current Shift</p>
                             <div className="flex items-center gap-2 text-slate-900">
                                <LuClock size={16} className="text-[#189D91]" />
                                <span className="text-sm font-medium">08:30 AM - 06:00 PM</span>
                             </div>
                          </div>
                         <Link 
                           to="/delivery/profile"
                           onClick={() => setShowUserMenu(false)}
                           className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-600 hover:text-[#189D91] hover:bg-teal-50 transition-all"
                         >
                           <LuUser size={18} />
                           Profile
                         </Link>
                         <button 
                           onClick={() => {
                             setShowUserMenu(false);
                             handleLogout();
                           }}
                           className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-all"
                         >
                           <LuLogOut size={18} />
                           Sign Out
                         </button>
                       </motion.div>
                     </>
                   )}
                 </AnimatePresence>
               </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto px-3 py-3 md:p-8 pb-32 lg:pb-8 custom-scrollbar bg-[#F8FAFC]">
           <div className="max-w-[1600px] mx-auto">
              <Outlet />
           </div>
        </main>
        
        {/* Mobile Bottom Navigation */}
        <DeliveryBottomNavbar isHidden={isSidebarOpen} />
      </div>
    </div>
  );
};

export default DeliveryLayout;
