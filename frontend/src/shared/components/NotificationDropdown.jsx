import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiBell, FiTrash2, FiChevronRight, FiChevronLeft,
  FiPackage, FiShoppingCart, FiTruck, FiLayers, FiAlertCircle, FiArrowRight
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../../modules/user/data/NotificationContext';
import { formatDistanceToNow } from 'date-fns';

const typeMetadata = {
  seller_approval: {
    icon: FiPackage,
    approved: { color: 'bg-emerald-50 text-emerald-600', bar: 'bg-emerald-500', btn: 'bg-emerald-600 hover:bg-emerald-700' },
    rejected:  { color: 'bg-rose-50 text-rose-600',     bar: 'bg-rose-500',    btn: 'bg-rose-600 hover:bg-rose-700'    },
    default:   { color: 'bg-teal-50 text-teal-600',     bar: 'bg-teal-500',    btn: 'bg-teal-600 hover:bg-teal-700'    },
  },
  admin_alert: {
    icon: FiLayers,
    default: { color: 'bg-violet-50 text-violet-600', bar: 'bg-violet-500', btn: 'bg-violet-600 hover:bg-violet-700' },
  },
  order_update: {
    icon: FiShoppingCart,
    default: { color: 'bg-blue-50 text-blue-600', bar: 'bg-blue-500', btn: 'bg-blue-600 hover:bg-blue-700' },
  },
  delivery_update: {
    icon: FiTruck,
    default: { color: 'bg-amber-50 text-amber-600', bar: 'bg-amber-500', btn: 'bg-amber-600 hover:bg-amber-700' },
  },
  stock_alert: {
    icon: FiAlertCircle,
    default: { color: 'bg-orange-50 text-orange-600', bar: 'bg-orange-500', btn: 'bg-orange-600 hover:bg-orange-700' },
  },
};

function getTheme(notif) {
  const meta = typeMetadata[notif.type];
  if (!meta) return { color: 'bg-gray-50 text-gray-500', bar: 'bg-gray-400', btn: 'bg-gray-600 hover:bg-gray-700' };
  const msg = (notif.message || '').toLowerCase();
  if (notif.type === 'seller_approval') {
    if (msg.includes('approved')) return meta.approved;
    if (msg.includes('rejected')) return meta.rejected;
  }
  return meta.default;
}

function getNavTarget(notif, isSeller, isAdmin) {
  const data = notif.data || {};
  switch (notif.type) {
    case 'seller_approval':
      return { label: 'View Batch History', path: '/seller/bulk-upload?tab=history' };
    case 'admin_alert':
      return data.batchId
        ? { label: 'Review Bulk Orders', path: '/admin/product-batches' }
        : { label: 'Review Products',    path: '/admin/inventory'       };
    case 'order_update':
      if (isSeller) return { label: 'View Orders', path: '/seller/orders' };
      if (isAdmin)  return { label: 'View Order',  path: data.orderId ? `/admin/orders/view/${data.orderId}` : '/admin/orders/all' };
      return { label: 'View Order', path: data.orderId ? `/orders/${data.orderId}` : '/orders' };
    case 'delivery_update':
      if (isAdmin)  return { label: 'View Order', path: data.orderId ? `/admin/orders/view/${data.orderId}` : '/admin/orders/all' };
      if (isSeller) return { label: 'View Orders', path: '/seller/orders' };
      return { label: 'View Order', path: data.orderId ? `/orders/${data.orderId}` : '/orders' };
    case 'stock_alert':
      if (isAdmin)  return { label: 'View Inventory', path: '/admin/inventory' };
      if (isSeller) return { label: 'View Products',  path: '/seller/my-products' };
      return null;
    default:
      return null;
  }
}

// ── Detail Panel ───────────────────────────────────────────────────
const NotificationDetail = ({ notif, onBack, onNavigate, isSeller, isAdmin }) => {
  const theme = getTheme(notif);
  const nav   = getNavTarget(notif, isSeller, isAdmin);
  const meta  = typeMetadata[notif.type];
  const Icon  = meta?.icon || FiBell;

  return (
    <motion.div
      key="detail"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.15 }}
      className="flex flex-col"
    >
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-100 bg-gray-50/60">
        <button
          onClick={onBack}
          className="p-1 rounded-lg hover:bg-gray-200 text-gray-500 transition-colors"
        >
          <FiChevronLeft className="w-4 h-4" />
        </button>
        <h3 className="font-bold text-deep-espresso text-sm">Detail</h3>
      </div>

      <div className="p-4 space-y-3">
        <div className={`h-0.5 w-full rounded-full ${theme.bar}`} />

        <div className="flex items-start gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${theme.color}`}>
            <Icon size={16} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-deep-espresso leading-snug">{notif.title}</p>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
              {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
            </p>
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl px-3 py-3 border border-gray-100">
          <p className="text-xs text-gray-700 leading-relaxed">{notif.message}</p>
        </div>

        {nav && (
          <button
            onClick={() => onNavigate(nav.path)}
            className={`w-full py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-white flex items-center justify-center gap-2 transition-all ${theme.btn}`}
          >
            {nav.label} <FiArrowRight size={12} />
          </button>
        )}
      </div>
    </motion.div>
  );
};

// ── Main Dropdown ──────────────────────────────────────────────────
const NotificationDropdown = ({ isMobile = false, buttonClassName = '', viewAllPath = '' }) => {
  const [isOpen, setIsOpen]     = useState(false);
  const [selected, setSelected] = useState(null);
  const [rightOffset, setRightOffset] = useState(0);
  const dropdownRef = useRef(null);
  const buttonRef   = useRef(null);
  const navigate    = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotification();

  const isSeller = window.location.pathname.startsWith('/seller');
  const isAdmin  = window.location.pathname.startsWith('/admin');

  // Smart viewport clamping — prevent left-edge overflow
  useEffect(() => {
    if (!isOpen || !buttonRef.current) { setRightOffset(0); return; }
    const rect  = buttonRef.current.getBoundingClientRect();
    const dropW = 304; // fixed compact width
    const leftEdge = rect.right - dropW;
    if (leftEdge < 8) {
      setRightOffset(Math.ceil(8 - leftEdge));
    } else {
      setRightOffset(0);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
        setSelected(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isOpen) setSelected(null);
  }, [isOpen]);

  const openDetail = (notif) => {
    if (!notif.read) markAsRead(notif._id);
    setSelected(notif);
  };

  const handleNavigate = (path) => {
    setIsOpen(false);
    setSelected(null);
    navigate(path);
  };

  const defaultButtonClass = isMobile
    ? 'p-2 rounded-full text-deep-espresso hover:bg-gray-100'
    : (isSeller || isAdmin)
      ? 'p-2.5 text-slate-500 hover:bg-slate-100 rounded-xl'
      : 'p-2 rounded-full text-gray-500 hover:text-[#004D40] hover:bg-gray-50';

  const defaultViewAllPath = isSeller
    ? '/seller/notifications'
    : isAdmin
      ? '/admin/settings'
      : '/notifications';

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`relative transition-colors ${buttonClassName || defaultButtonClass}`}
      >
        <FiBell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border border-white" />
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="dropdown"
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            style={{ right: rightOffset > 0 ? -rightOffset : 0 }}
            className="absolute mt-2 w-[304px] glass rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50"
          >
            <AnimatePresence mode="wait">
              {selected ? (
                <NotificationDetail
                  key="detail"
                  notif={selected}
                  onBack={() => setSelected(null)}
                  onNavigate={handleNavigate}
                  isSeller={isSeller}
                  isAdmin={isAdmin}
                />
              ) : (
                <motion.div
                  key="list"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.15 }}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-100 bg-gray-50/60">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-deep-espresso text-sm">Notifications</h3>
                      {unreadCount > 0 && (
                        <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-black">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-[9px] font-black uppercase tracking-wider text-[#189D91] hover:text-deep-espresso transition-colors"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  {/* List */}
                  <div className="max-h-[280px] overflow-y-auto custom-scrollbar">
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center text-gray-400">
                        <FiBell className="w-7 h-7 mx-auto mb-2 opacity-20" />
                        <p className="text-xs font-medium">No notifications yet</p>
                      </div>
                    ) : (
                      notifications.slice(0, 8).map((notif) => {
                        const theme = getTheme(notif);
                        const meta  = typeMetadata[notif.type];
                        const Icon  = meta?.icon || FiBell;
                        return (
                          <div
                            key={notif._id}
                            onClick={() => openDetail(notif)}
                            className={`group px-3 py-2.5 border-b border-gray-50 cursor-pointer transition-colors flex gap-2.5 items-start
                              ${!notif.read ? 'bg-teal-50/40 hover:bg-teal-50/70' : 'hover:bg-gray-50'}`}
                          >
                            <div className={`mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${theme.color}`}>
                              <Icon size={13} />
                            </div>

                            <div className="flex-1 min-w-0">
                              <h4 className={`text-xs leading-snug ${!notif.read ? 'font-bold text-deep-espresso' : 'font-medium text-gray-700'}`}>
                                {notif.title}
                              </h4>
                              <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1 leading-relaxed">
                                {notif.message}
                              </p>
                              <span className="text-[9px] font-bold text-gray-400 mt-0.5 block uppercase tracking-wider">
                                {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                              </span>
                            </div>

                            <div className="flex flex-col items-center gap-1 shrink-0 mt-1">
                              <FiChevronRight className="w-3 h-3 text-gray-300 group-hover:text-[#189D91] group-hover:translate-x-0.5 transition-all" />
                              <button
                                onClick={(e) => { e.stopPropagation(); deleteNotification(notif._id); }}
                                className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                              >
                                <FiTrash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Footer */}
                  <div className="px-3 py-2 border-t border-gray-100 bg-gray-50/60 text-center">
                    <button
                      onClick={() => handleNavigate(viewAllPath || defaultViewAllPath)}
                      className="text-[9px] font-black uppercase tracking-widest text-deep-espresso hover:text-[#189D91] transition-colors"
                    >
                      View All Notifications
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationDropdown;
