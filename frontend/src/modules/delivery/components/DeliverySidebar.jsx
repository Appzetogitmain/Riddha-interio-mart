import React, { useState, useEffect } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { 
  LuLayoutDashboard, 
  LuPackage, 
  LuMap, 
  LuZap, 
  LuArrowUpRight, 
  LuNavigation, 
  LuUsers, 
  LuWallet, 
  LuBell, 
  LuSettings, 
  LuCircleHelp,
  LuLogOut,
  LuShieldCheck
} from 'react-icons/lu';

import { useUser } from '../../user/data/UserContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import api from '../../../shared/utils/api';
import { getSocket } from '../../../shared/utils/socket';
import logoImage from '../../../assets/image copy 2.png';

const DeliverySidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const [pendingCount, setPendingCount] = useState(0);
  const [pickupCount, setPickupCount] = useState(0);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);

  const fetchAnalytics = async () => {
    try {
      const { data } = await api.get('/delivery/analytics');
      if (data.success && data.data?.stats) {
        setPendingCount(data.data.stats.pendingDeliveries || 0);
        setPickupCount(data.data.stats.pickupRequestsCount || 0);
      }
    } catch (err) {
      console.error('Failed to fetch delivery analytics:', err);
    }

    try {
      const { data } = await api.get('/notifications?limit=1');
      if (data.success) {
        setUnreadNotificationsCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Failed to fetch unread notification count in Sidebar:', err);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [location.pathname, location.search]);

  useEffect(() => {
    window.addEventListener('delivery_notifications_updated', fetchAnalytics);
    return () => window.removeEventListener('delivery_notifications_updated', fetchAnalytics);
  }, []);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleDeliveryAssigned = (payload) => {
      import('../../../shared/utils/notificationSound').then(({ playNotificationSound }) => {
        playNotificationSound();
      });
      toast.success(payload.message || 'New Delivery Assigned!', {
        position: 'top-right',
        duration: 4000,
        icon: '🛵'
      });
      fetchAnalytics();
    };

    const handleNotificationNew = () => {
      fetchAnalytics();
    };

    socket.on('delivery:assigned', handleDeliveryAssigned);
    socket.on('notification:new', handleNotificationNew);

    return () => {
      socket.off('delivery:assigned', handleDeliveryAssigned);
      socket.off('notification:new', handleNotificationNew);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/delivery/login');
  };

  const isLinkActive = (itemPath) => {
    if (itemPath.includes('?')) {
      const [pathPart, queryPart] = itemPath.split('?');
      return location.pathname === pathPart && location.search.includes(queryPart);
    }
    return location.pathname === itemPath && !location.search.includes('filter=');
  };

  const menuGroups = [
    {
      title: 'Operations',
      items: [
        { name: 'Dashboard', path: '/delivery/dashboard', icon: LuLayoutDashboard },
        { name: 'Orders', path: '/delivery/orders', icon: LuPackage },
        { name: 'Delivery History', path: '/delivery/delivery-history', icon: LuPackage },
        { name: 'Route Management', path: '/delivery/route-management', icon: LuMap },
        { name: 'Dispatch Center', path: '/delivery/dispatch-center', icon: LuZap },
        { name: 'Pickup Requests', path: '/delivery/orders?filter=pickups', icon: LuArrowUpRight },
      ]
    },
    {
      title: 'Fleet & Earnings',
      items: [
        { name: 'Profile', path: '/delivery/profile', icon: LuUsers },
        { name: 'Earnings', path: '/delivery/earnings', icon: LuWallet },
      ]
    },
    {
      title: 'System',
      items: [
        { name: 'Notifications', path: '/delivery/notifications', icon: LuBell },
        { name: 'Terms & Conditions', path: '/delivery/terms', icon: LuShieldCheck },
        { name: 'Settings', path: '/delivery/settings', icon: LuSettings },
        { name: 'Help & Support', path: '/delivery/help', icon: LuCircleHelp },
      ]
    }
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-[280px] bg-white border-r border-slate-200 
        transform transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1) lg:translate-x-0 lg:static lg:inset-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo Area */}
          <div className="h-28 px-8 flex items-center justify-center lg:justify-start border-b border-slate-100 bg-white">
            <Link to="/delivery/dashboard" className="flex items-center gap-3">
              <img src={logoImage} alt="Riddha Delivery" className="h-16 lg:h-14 w-auto object-contain" />
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-6 overflow-y-auto custom-scrollbar">
            {menuGroups.map((group) => (
              <div key={group.title} className="space-y-2">
                 <h3 className="px-6 text-xs font-semibold text-slate-400">{group.title}</h3>
                 <div className="space-y-1">
                    {group.items.map((item) => {
                      const active = isLinkActive(item.path);
                      return (
                        <NavLink
                          key={item.name}
                          to={item.path}
                          onClick={onClose}
                          className={`
                            flex items-center gap-4 px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300 group
                            ${active 
                              ? 'bg-[#2A458A]/10 text-[#2A458A] border-l-4 border-[#2A458A]' 
                              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}
                          `}
                        >
                          <item.icon size={18} className="shrink-0 transition-transform group-hover:scale-110" />
                          <span>{item.name}</span>
                          {item.name === 'Orders' && pendingCount > 0 && (
                            <span className={`ml-auto px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              active ? 'bg-white text-[#2A458A]' : 'bg-[#2A458A] text-white'
                            }`}>
                              {pendingCount}
                            </span>
                          )}
                          {item.name === 'Pickup Requests' && pickupCount > 0 && (
                            <span className={`ml-auto px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              active ? 'bg-white text-[#2A458A]' : 'bg-[#2A458A] text-white'
                            }`}>
                              {pickupCount}
                            </span>
                          )}
                          {item.name === 'Notifications' && unreadNotificationsCount > 0 && (
                            <span className="ml-auto px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white animate-pulse shadow-sm shadow-rose-500/50">
                              {unreadNotificationsCount}
                            </span>
                          )}
                        </NavLink>
                      );
                    })}
                 </div>
              </div>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-6 border-t border-slate-100 bg-white">
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-4 px-6 py-3 rounded-xl text-sm font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-all duration-300 group"
            >
              <LuLogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default DeliverySidebar;

