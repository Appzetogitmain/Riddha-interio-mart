import React, { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LuLayoutDashboard,
  LuBox,
  LuTags,
  LuSettings,
  LuX,
  LuChevronRight,
  LuGrid2X2,
  LuStar,
  LuImage,
  LuBadgePercent,
  LuLayoutGrid,
  LuTrendingUp,
  LuPlus,
  LuPackage,
  LuReceipt,
  LuUsers,
  LuUser,
  LuUserCheck,
  LuWallet,
  LuMapPin,
  LuTruck,
  LuUserPlus,
  LuBanknote,
  LuClock,
  LuShoppingCart,
  LuClipboardList,
  LuUndo2,
} from "react-icons/lu";
import { FiCheckCircle, FiFlag, FiXCircle, FiUser } from "react-icons/fi";

import sidebarBg from "../../../assets/seller_sidebar_bg.png";

const menuItems = [
  { path: "/admin", icon: LuLayoutDashboard, label: "Dashboard" },
  { path: "/admin/analytics", icon: LuTrendingUp, label: "Analytics" },
  {
    label: "HOME SECTION",
    isHeader: true,
  },
  {
    label: "Manage Categories",
    icon: LuGrid2X2,
    path: "/admin/manage-categories",
    children: [
      {
        path: "/admin/manage-categories",
        icon: LuLayoutGrid,
        label: "All Categories",
      },
      {
        path: "/admin/manage-categories/add",
        icon: LuPlus,
        label: "Add Category",
      },
    ],
  },
  { path: "/admin/manage-hero", icon: LuImage, label: "Home Banner" },
  { path: "/admin/manage-promo", icon: LuBadgePercent, label: "Promo Banner" },
  {
    label: "Section",
    icon: LuLayoutGrid,
    path: "/admin/manage-section",
    children: [
      {
        path: "/admin/manage-section",
        icon: LuLayoutGrid,
        label: "All Section",
      },
      {
        path: "/admin/manage-section/create",
        icon: LuPlus,
        label: "Create Section",
      },
    ],
  },
  {
    label: "Top Brands",
    icon: LuTags,
    path: "/admin/manage-brands",
    children: [
      { path: "/admin/manage-brands", icon: LuLayoutGrid, label: "All Brands" },
      { path: "/admin/manage-brands/add", icon: LuPlus, label: "Add Brand" },
    ],
  },
  {
    label: "Featured Highlights",
    icon: LuStar,
    path: "/admin/manage-featured",
    children: [
      {
        path: "/admin/manage-featured",
        icon: LuLayoutGrid,
        label: "All Featured",
      },
      {
        path: "/admin/manage-featured/add",
        icon: LuPlus,
        label: "Add Featured Product",
      },
    ],
  },
  {
    label: "ORDER SECTION",
    isHeader: true,
  },
  {
    label: "Order List",
    icon: LuShoppingCart,
    path: "/admin/orders",
    children: [
      { path: "/admin/orders/all", icon: LuShoppingCart, label: "All Order" },
      { path: "/admin/orders/pending", icon: LuClock, label: "Pending Order" },
      {
        path: "/admin/orders/received",
        icon: FiCheckCircle,
        label: "Received Order",
      },
      {
        path: "/admin/orders/processed",
        icon: LuClipboardList,
        label: "Processed Order",
      },
      { path: "/admin/orders/shipped", icon: FiFlag, label: "Shipped Order" },
      {
        path: "/admin/orders/out-for-delivery",
        icon: LuTruck,
        label: "Out For Delivery",
      },
      {
        path: "/admin/orders/delivered",
        icon: FiCheckCircle,
        label: "Delivered Order",
      },
      {
        path: "/admin/orders/cancelled",
        icon: FiXCircle,
        label: "Cancelled Order",
      },
    ],
  },
  { path: "/admin/orders/return", icon: LuUndo2, label: "Return" },
  { path: "/admin/users", icon: LuUser, label: "User" },
  {
    label: "FINANCE",
    isHeader: true,
  },
  { path: "/admin/finance/wallet", icon: LuWallet, label: "Wallet & Earnings" },
  {
    label: "DELIVERY SECTION",
    isHeader: true,
  },
  {
    label: "Manage Location",
    icon: LuMapPin,
    path: "/admin/delivery/location",
    children: [
      {
        path: "/admin/delivery/location/seller",
        icon: LuMapPin,
        label: "Seller Location",
      },
    ],
  },
  {
    label: "Delivery Boy",
    icon: LuTruck,
    path: "/admin/delivery/boy",
    children: [
      {
        path: "/admin/delivery/boy/pending",
        icon: LuClock,
        label: "Pending Delivery Boy",
        badge: "NEW",
      },
      {
        path: "/admin/delivery/boy/manage",
        icon: LuUsers,
        label: "Manage Delivery Boy",
      },
      {
        path: "/admin/delivery/boy/fund-transfer",
        icon: LuWallet,
        label: "Fund Transfer",
      },
      {
        path: "/admin/delivery/boy/cash-collection",
        icon: LuBanknote,
        label: "Cash Collection",
      },
    ],
  },
  {
    label: "Manage Seller",
    icon: LuUsers,
    path: "/admin/sellers",
    children: [
      { path: "/admin/sellers/list", icon: LuUsers, label: "Seller List" },
      {
        path: "/admin/sellers/pending",
        icon: LuUserCheck,
        label: "Pending Sellers",
      },
      {
        path: "/admin/sellers/transactions",
        icon: LuWallet,
        label: "Transactions",
      },
    ],
  },
  {
    label: "PRODUCT SECTION",
    isHeader: true,
  },
  {
    label: "Product",
    icon: LuPackage,
    path: "/admin/product",
    children: [
      {
        path: "/admin/product/list",
        icon: LuLayoutGrid,
        label: "Product List",
      },
      { path: "/admin/product/taxes", icon: LuReceipt, label: "Taxes" },
    ],
  },
  {
    label: "Catalog",
    icon: LuBox,
    path: "/admin/catalog",
    children: [
      { path: "/admin/catalog", icon: LuLayoutGrid, label: "All Products" },
      { path: "/admin/catalog/add", icon: LuPlus, label: "Add New Product" },
    ],
  },
  {
    label: "SETTING",
    isHeader: true,
  },
  { path: "/admin/profile", icon: FiUser, label: "Profile" },
  { path: "/admin/settings", icon: LuSettings, label: "Settings" },
];

const NavItem = ({ item, isOpen, onClose, expanded, onToggle }) => {
  if (item.isHeader) {
    return (
      <div className="px-4 py-3 mt-6 mb-2 border-b border-white/5">
        <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white/90 drop-shadow-sm">
          {item.label}
        </span>
      </div>
    );
  }

  const hasChildren = item.children && item.children.length > 0;
  const location = useLocation();
  const isSelfActive = location.pathname === item.path;
  const isChildActive =
    hasChildren &&
    item.children.some((child) => location.pathname === child.path);
  const isActive = isSelfActive || isChildActive;

  const headerContent = (
    <div className="flex items-center gap-4 w-full">
      <item.icon
        size={20}
        className={`transition-transform duration-300 ${isActive ? "scale-110 text-white" : "text-white/70 group-hover:scale-110 group-hover:text-white"}`}
      />
      <span className="font-medium text-white">{item.label}</span>
    </div>
  );

  return (
    <div className="mb-2">
      <div
        className={`
          flex items-center justify-between p-3 rounded-xl transition-all duration-300 group cursor-pointer border border-white/5
          ${
            isActive
              ? "bg-red-800 text-white shadow-xl shadow-red-900/20 border-white/10 scale-[1.02]"
              : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white hover:border-white/10"
          }
        `}
        onClick={() => {
          if (hasChildren) {
            onToggle(item.label);
          } else {
            if (window.innerWidth < 1024) onClose();
          }
        }}
      >
        {item.path && !hasChildren ? (
          <NavLink
            to={item.path}
            end={item.path === "/admin"}
            className="w-full"
          >
            {headerContent}
          </NavLink>
        ) : (
          headerContent
        )}

        {hasChildren && (
          <motion.div
            animate={{ rotate: expanded ? 90 : 0 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => {
              // Prevent navigation if only clicking the chevron
              if (item.path) {
                e.stopPropagation();
                onToggle(item.label);
              }
            }}
          >
            <LuChevronRight
              size={16}
              className={`drop-shadow-md transition-colors ${isActive ? "text-white" : "text-white/60"}`}
            />
          </motion.div>
        )}
        {!hasChildren && (
          <LuChevronRight
            size={16}
            className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-white/60"
          />
        )}
      </div>

      <AnimatePresence>
        {hasChildren && expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="ml-6 mt-1 space-y-1 py-1">
              {item.children.map((child) => (
                <NavLink
                  key={child.path + child.label}
                  to={child.path}
                  onClick={() => {
                    if (window.innerWidth < 1024) onClose();
                  }}
                  className={({ isActive: childActive }) => `
                    flex items-center gap-4 p-2.5 rounded-xl transition-all duration-300 group border border-transparent
                    ${
                      childActive
                        ? "text-white font-bold bg-white/10 border-white/5 shadow-sm"
                        : "text-white/60 hover:text-white hover:bg-white/5"
                    }
                  `}
                >
                  {({ isActive: isCurrentChildActive }) => (
                    <>
                      <child.icon
                        size={16}
                        className={`transition-transform duration-300 group-hover:scale-110 ${isCurrentChildActive ? "text-white" : "text-white/50"}`}
                      />
                      <div className="flex items-center justify-between w-full">
                        <span className="text-sm tracking-wide text-white">
                          {child.label}
                        </span>
                        {child.badge && (
                          <span className="px-2 py-0.5 bg-amber-500 text-deep-espresso text-[9px] font-black rounded-full uppercase tracking-widest shadow-lg shadow-amber-500/20">
                            {child.badge}
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState(() => {
    // Initial state: expand sections if a child is active
    const initial = {};
    menuItems.forEach((item) => {
      if (item.children?.some((child) => location.pathname === child.path)) {
        initial[item.label] = true;
      }
    });
    return initial;
  });

  const toggleExpand = (label) => {
    setExpandedItems((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
  };

  return (
    <>
      {/* Mobile Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Content */}
      <aside
        className={`
          fixed lg:static top-0 left-0 h-screen w-72 lg:shrink-0 bg-deep-espresso text-white z-50 flex flex-col shadow-2xl lg:shadow-none overflow-hidden
          transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Full Sidebar Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            src={sidebarBg}
            alt="Interior Decorative Lighting"
            className="w-full h-full object-cover opacity-10 grayscale"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-deep-espresso via-deep-espresso/95 to-deep-espresso"></div>
        </div>

        {/* Header */}
        <div className="relative z-10 p-6 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-warm-sand rounded-lg flex items-center justify-center text-deep-espresso font-bold text-xl">
              R
            </div>
            <span className="font-display font-bold text-xl tracking-wide uppercase text-white">
              Riddha <span className="text-warm-sand">Admin</span>
            </span>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden text-white/60 hover:text-white"
          >
            <LuX size={24} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="relative z-10 flex-1 p-4 mt-4 space-y-1 overflow-y-auto no-scrollbar">
          {menuItems.map((item) => (
            <NavItem
              key={item.label}
              item={item}
              isOpen={isOpen}
              onClose={onClose}
              expanded={expandedItems[item.label]}
              onToggle={toggleExpand}
            />
          ))}
        </nav>

        {/* Footer info */}
        <div className="relative z-10 p-6 border-t border-white/10 text-white/50 text-xs mt-auto backdrop-blur-sm bg-deep-espresso/20">
          <p className="font-medium text-white/80 drop-shadow-md">
            © 2026 Riddha Interior Mart
          </p>
          <p className="mt-1 text-[10px] tracking-wide uppercase drop-shadow-md">
            Admin Workspace v1.0
          </p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
