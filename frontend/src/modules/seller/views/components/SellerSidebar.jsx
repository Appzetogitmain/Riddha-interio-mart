import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiLayout,
  FiSearch,
  FiPlus,
  FiPackage,
  FiX,
  FiChevronRight,
  FiShoppingCart,
  FiFileText,
  FiGrid,
  FiLayers,
  FiCreditCard,
  FiRotateCcw,
  FiTrendingUp,
} from "react-icons/fi";
import { useLocation } from "react-router-dom";
import { useUser } from "../../../user/models/UserContext";
import sidebarBg from "../../../assets/seller_sidebar_bg.png";

const menuItems = [
  { path: "/seller", icon: FiLayout, label: "Dashboard" },
  { path: "/seller/orders", icon: FiShoppingCart, label: "Orders" },
  {
    label: "Product",
    icon: FiPackage,
    path: "/seller/product",
    children: [
      { path: "/seller/product/add", icon: FiPlus, label: "Add Product" },
      { path: "/seller/product/taxes", icon: FiFileText, label: "Taxes" },
      {
        path: "/seller/product/list",
        icon: FiGrid,
        label: "Product List",
      },
      {
        path: "/seller/product/stock",
        icon: FiLayers,
        label: "Stock Management",
      },
    ],
  },
  { path: "/seller/wallet", icon: FiCreditCard, label: "Wallet" },
  {
    label: "Reports",
    icon: FiTrendingUp,
    path: "/seller/reports",
    children: [
      {
        path: "/seller/reports/sales",
        icon: FiTrendingUp,
        label: "Sales Report",
      },
    ],
  },
  { path: "/seller/return", icon: FiRotateCcw, label: "Return" },
  { path: "/seller/catalog", icon: FiSearch, label: "Browse Catalog" },
];

const NavItem = ({ item, isOpen, onClose, expanded, onToggle, disabled }) => {
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
          flex items-center justify-between p-3 rounded-xl transition-all duration-300 group ${disabled ? "opacity-50 cursor-not-allowed pointer-events-none" : "cursor-pointer"} border border-white/5
          ${
            isActive && !disabled
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
            end={item.path === "/seller"}
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
          >
            <FiChevronRight size={16} className="text-white/40" />
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {hasChildren && expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden ml-4 space-y-1"
          >
            {item.children.map((child) => {
              const isCurrentChildActive = location.pathname === child.path;
              return (
                <NavLink
                  key={child.path}
                  to={child.path}
                  onClick={() => {
                    if (window.innerWidth < 1024) onClose();
                  }}
                  className={`
                    flex items-center gap-3 p-2.5 rounded-lg transition-all duration-200 group
                    ${isCurrentChildActive ? "bg-white/10 text-white" : "text-white/50 hover:bg-white/5 hover:text-white"}
                  `}
                >
                  <child.icon
                    size={16}
                    className={`transition-transform duration-300 group-hover:scale-110 ${isCurrentChildActive ? "text-white" : "text-white/50"}`}
                  />
                  <span className="text-sm tracking-wide text-white">
                    {child.label}
                  </span>
                </NavLink>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const SellerSidebar = ({ isOpen, onClose }) => {
  const [expandedItems, setExpandedItems] = useState({});
  const { user } = useUser();
  const isPending = user?.status === "pending";

  const toggleItem = (label) => {
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
        {/* Sidebar Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            src={sidebarBg}
            alt="Interior Mockup"
            className="w-full h-full object-cover opacity-10 grayscale"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-deep-espresso via-deep-espresso/95 to-deep-espresso"></div>
        </div>

        {/* Header */}
        <div className="relative z-10 p-6 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-warm-sand rounded-lg flex items-center justify-center text-deep-espresso font-bold text-xl">
              S
            </div>
            <span className="font-display font-bold text-xl tracking-wide uppercase text-white">
              Riddha <span className="text-warm-sand">Seller</span>
            </span>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden text-white/60 hover:text-white"
          >
            <FiX size={24} />
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
              onToggle={toggleItem}
              disabled={isPending && item.path !== "/seller"}
            />
          ))}
        </nav>

        {/* Footer info */}
        <div className="relative z-10 p-6 border-t border-white/10 text-white/50 text-xs mt-auto">
          <p className="font-medium text-white/80">
            © 2026 Riddha Interior Mart
          </p>
          <p className="mt-1 text-[10px] tracking-wide uppercase">
            Seller Panel v1.0
          </p>
        </div>
      </aside>
    </>
  );
};

export default SellerSidebar;
