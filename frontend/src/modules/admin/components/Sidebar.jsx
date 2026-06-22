import React, { useState, useEffect } from "react";
import { NavLink, useLocation, useNavigate, Link } from "react-router-dom";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { useUser } from "../../user/data/UserContext";
import api from "../../../shared/utils/api";
import { useRBAC } from "../data/RBACContext";
import { permissionsMap } from "../data/permissionsMap";
import {
  FiLayout,
  FiBox,
  FiTag,
  FiSettings,
  FiX,
  FiChevronRight,
  FiGrid,
  FiStar,
  FiImage,
  FiPercent,
  FiTrendingUp,
  FiPlus,
  FiLogOut,
  FiUsers,
  FiClipboard,
  FiClock,
  FiPackage,
  FiTruck,
  FiMapPin,
  FiGift,
  FiShield,
  FiDollarSign,
  FiZap,
  FiActivity,
  FiLayers,
  FiMessageSquare,
  FiHelpCircle
} from "react-icons/fi";
import logoImage from "../../../assets/transparent_logo.png";

const menuGroups = [
  {
    title: "Core Control",
    items: [
      { path: "/admin", icon: FiLayout, label: "Dashboard" },
      { path: "/admin/analytics", icon: FiTrendingUp, label: "Analytics" },
      { path: "/admin/activity", icon: FiActivity, label: "System Logs" },
    ],
  },
  {
    title: "Operations",
    items: [
      {
        label: "Inventory",
        icon: FiBox,
        path: "/admin/inventory",
        children: [
          { path: "/admin/inventory", icon: FiGrid, label: "All Products" },
          {
            path: "/admin/inventory/pending",
            icon: FiClock,
            label: "Pending Approval",
            showBadge: true,
            badgeType: "product",
          },
        ],
      },
      {
        path: "/admin/orders/tracking",
        icon: FiMapPin,
        label: "Order Tracking",
      },
      {
        label: "Delivery Management",
        icon: FiTruck,
        path: "/admin/delivery",
        children: [
          {
            path: "/admin/delivery/pending",
            icon: FiClock,
            label: "Pending Deliveries",
            showBadge: true,
            badgeType: "delivery",
          },
          { path: "/admin/delivery", icon: FiGrid, label: "Manage Delivery" },
          {
            path: "/admin/delivery/assign",
            icon: FiTruck,
            label: "Assign Delivery",
          },
        ],
      },
      {
        label: "Create Listing",
        icon: FiPlus,
        path: "/admin/inventory/add-flow",
        children: [
          { path: "/admin/inventory/add", icon: FiPlus, label: "Create Order" },
          {
            path: "/admin/catalog",
            icon: FiPackage,
            label: "Select from Catalog",
          },
        ],
      },
      {
        path: "/admin/stock-management",
        icon: FiTrendingUp,
        label: "Stock Management",
      },
      {
        label: "Order Management",
        icon: FiClipboard,
        path: "/admin/orders/all",
        children: [
          { path: "/admin/orders/all", icon: FiGrid, label: "All Orders" },
          {
            path: "/admin/orders/pending",
            icon: FiClock,
            label: "Pending Orders",
          },
          { path: "/admin/bulk-orders", icon: FiLayers, label: "Bulk Orders" },
        ],
      },
      {
        label: "Product Catalog",
        icon: FiBox,
        path: "/admin/catalog",
        children: [
          { path: "/admin/catalog", icon: FiGrid, label: "Master Catalog" },
          {
            path: "/admin/catalog/add",
            icon: FiPlus,
            label: "New Master Item",
          },
          { path: "/admin/bulk-upload", icon: FiPlus, label: "Bulk Upload" },
        ],
      },
      {
        label: "Manage Categories",
        icon: FiGrid,
        path: "/admin/manage-categories",
        children: [
          {
            path: "/admin/manage-categories",
            icon: FiGrid,
            label: "All Categories",
          },
          {
            path: "/admin/manage-categories/add",
            icon: FiPlus,
            label: "Add Category",
          },
        ],
      },
    ],
  },
  {
    title: "Partners & Clients",
    items: [
      {
        label: "Seller Management",
        icon: FiUsers,
        path: "/admin/sellers",
        children: [
          {
            path: "/admin/sellers/pending",
            icon: FiGrid,
            label: "Pending Sellers",
            showBadge: true,
          },
          {
            path: "/admin/sellers/active",
            icon: FiGrid,
            label: "Active Sellers",
          },
        ],
      },
      {
        label: "Customer Management",
        icon: FiUsers,
        path: "/admin/customers",
        children: [
          {
            path: "/admin/customers/individual",
            icon: FiGrid,
            label: "Individual Customers",
          },
          {
            path: "/admin/customers/enterpriser",
            icon: FiGrid,
            label: "Enterprisers",
          },
        ],
      },
    ],
  },
  {
    title: "Marketing & Content",
    items: [
      { path: "/admin/manage-hero", icon: FiImage, label: "Home Banner" },
      { path: "/admin/manage-promo", icon: FiPercent, label: "Promo Banner" },
      {
        label: "Section",
        icon: FiGrid,
        path: "/admin/manage-section",
        children: [
          { path: "/admin/manage-section", icon: FiGrid, label: "All Section" },
          {
            path: "/admin/manage-section/create",
            icon: FiPlus,
            label: "Create Section",
          },
        ],
      },
      {
        label: "Favourite Section",
        icon: FiStar,
        path: "/admin/manage-favourites",
        children: [
          {
            path: "/admin/manage-favourites",
            icon: FiGrid,
            label: "All Favourite Sections",
          },
          {
            path: "/admin/manage-favourites/create",
            icon: FiPlus,
            label: "Create Favourite Section",
          },
        ],
      },
      {
        label: "Top Brands",
        icon: FiTag,
        path: "/admin/manage-brands",
        children: [
          { path: "/admin/manage-brands", icon: FiGrid, label: "All Brands" },
          {
            path: "/admin/manage-brands/add",
            icon: FiPlus,
            label: "Add Brand",
          },
        ],
      },
      {
        label: "Featured Highlights",
        icon: FiStar,
        path: "/admin/manage-featured",
        children: [
          {
            path: "/admin/manage-featured",
            icon: FiGrid,
            label: "All Featured",
          },
          {
            path: "/admin/manage-featured/add",
            icon: FiPlus,
            label: "Add Featured Product",
          },
        ],
      },
      { path: "/admin/terms", icon: FiClipboard, label: "Manage T&C" },
    ],
  },
  {
    title: "Financial & Core System",
    items: [
      { path: "/admin/product-batches", icon: FiLayers, label: "Product Batches", showBadge: true, badgeType: "batch" },
      {
        label: "Payments",
        icon: FiDollarSign,
        path: "/admin/payments",
        children: [
          {
            path: "/admin/payments/users",
            icon: FiGrid,
            label: "User Payments",
          },
          {
            path: "/admin/payments/delivery",
            icon: FiGrid,
            label: "Delivery Payments",
          },
          {
            path: "/admin/payments/sellers",
            icon: FiGrid,
            label: "Seller Payments",
          },
          {
            path: "/admin/payments/seller-payouts",
            icon: FiDollarSign,
            label: "Seller Payouts",
          },
        ],
      },
      { path: "/admin/settings", icon: FiSettings, label: "Settings" },
      { path: "/admin/feedback", icon: FiMessageSquare, label: "Product Reviews" },
      { path: "/admin/support-tickets", icon: FiHelpCircle, label: "Support Tickets" },
      {
        path: "/admin/seller-recommendations",
        icon: FiZap,
        label: "Seller Requests",
      },
      { path: "/admin/referrals", icon: FiGift, label: "Referral System" },
      { path: "/admin/team", icon: FiShield, label: "Team Management" },
    ],
  },
];

const NavItem = ({
  item,
  onClose,
  expanded,
  onToggle,
  sellersCount,
  deliveryCount,
  productCount,
  batchCount,
}) => {
  const { hasPermission, role } = useRBAC();
  const location = useLocation();
  const permissionKey = permissionsMap.menuMapping[item.label];

  if (permissionKey && !hasPermission(permissionKey)) {
    return null;
  }

  const hasChildren = item.children && item.children.length > 0;
  const isSelfActive = location.pathname === item.path || (item.label === "Order Management" && location.pathname.startsWith("/admin/orders"));
  const isChildActive =
    hasChildren &&
    item.children.some((child) => location.pathname === child.path || (item.label === "Order Management" && location.pathname.startsWith("/admin/orders")));
  const isActive = isSelfActive || isChildActive;

  const itemBadgeCount = item.showBadge && !hasChildren
    ? (item.badgeType === 'batch' ? batchCount
      : item.badgeType === 'delivery' ? deliveryCount
      : item.badgeType === 'product' ? productCount
      : sellersCount)
    : 0;

  const headerContent = (
    <div className="flex items-center gap-3 w-full text-left">
      <item.icon
        size={17}
        className={`transition-all duration-300 ${isActive ? "scale-110 text-[var(--color-primary)]" : "text-slate-400 group-hover:scale-110 group-hover:text-slate-700"}`}
      />
      <span
        className={`text-[12px] font-semibold tracking-wide transition-colors flex-1 ${isActive ? "text-slate-900 font-bold" : "text-slate-600 group-hover:text-slate-900"}`}
      >
        {item.label}
      </span>
      {itemBadgeCount > 0 && (
        <span className="px-1.5 py-0.5 bg-violet-600 text-white text-[9px] font-bold rounded-full animate-pulse">
          {itemBadgeCount}
        </span>
      )}
    </div>
  );

  return (
    <div className="mb-1">
      <div
        className={`
          flex items-center justify-between px-4 py-2.5 rounded-lg transition-all duration-200 group border-l-4 cursor-pointer
          ${
            isActive
              ? "bg-slate-50/80 border-[var(--color-primary)] text-slate-900 shadow-sm"
              : "border-transparent hover:bg-slate-50/40 text-slate-600 hover:text-slate-900"
          }
        `}
      >
        <div
          className="flex-1"
          onClick={() => {
            if (window.innerWidth < 1024 && !hasChildren) onClose();
          }}
        >
          {item.path ? (
            <NavLink
              to={item.path}
              end={item.path === "/admin"}
              className="w-full block"
            >
              {headerContent}
            </NavLink>
          ) : (
            <div className="w-full">{headerContent}</div>
          )}
        </div>

        {hasChildren && (
          <Motion.div
            className="p-1 hover:bg-slate-100 rounded transition-colors cursor-pointer"
            animate={{ rotate: expanded ? 90 : 0 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => {
              e.stopPropagation();
              onToggle(item.label);
            }}
          >
            <FiChevronRight
              size={13}
              className={`transition-colors ${isActive ? "text-slate-800" : "text-slate-400"}`}
            />
          </Motion.div>
        )}
      </div>

      <AnimatePresence>
        {hasChildren && expanded && (
          <Motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden bg-slate-50/40 rounded-lg mt-0.5"
          >
            <div className="ml-5 pl-2 border-l border-slate-200 mt-1 space-y-0.5 py-1">
              {item.children.map((child) => {
                let count = 0;
                if (child.badgeType === "batch") count = batchCount;
                else if (child.badgeType === "delivery") count = deliveryCount;
                else if (child.badgeType === "product") count = productCount;
                else count = sellersCount;

                const isChildActive = location.pathname === child.path;

                return (
                  <NavLink
                    key={child.path + child.label}
                    to={child.path}
                    onClick={() => {
                      if (window.innerWidth < 1024) onClose();
                    }}
                    className={`
                      flex items-center gap-3 px-3 py-2 rounded-md text-[11px] tracking-wide transition-all duration-200 group
                      ${
                        isChildActive
                          ? "text-[var(--color-accent-pink)] font-bold bg-slate-100/60"
                          : "text-slate-500 hover:text-slate-900 hover:bg-slate-50/45"
                      }
                    `}
                  >
                    <child.icon
                      size={12}
                      className={`transition-transform duration-200 group-hover:scale-110 ${isChildActive ? "text-[var(--color-accent-pink)]" : "text-slate-400"}`}
                    />
                    <span>{child.label}</span>
                    {child.showBadge && count > 0 && (
                      <span className="ml-auto px-2 py-0.5 bg-[var(--color-accent-pink)] text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse">
                        {count}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </Motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useUser();
  const { role } = useRBAC();
  const [expandedItems, setExpandedItems] = useState(() => {
    const initial = {};
    menuGroups.forEach((group) => {
      group.items.forEach((item) => {
        const hasMatchingChild = item.children?.some((child) => {
          if (item.label === "Order Management" && location.pathname.startsWith("/admin/orders")) {
            return true;
          }
          return location.pathname === child.path;
        });
        if (hasMatchingChild) {
          initial[item.label] = true;
        }
      });
    });
    return initial;
  });

  const [sellersCount, setSellersCount] = useState(0);
  const [deliveryCount, setDeliveryCount] = useState(0);
  const [productCount, setProductCount] = useState(0);
  const [batchCount, setBatchCount] = useState(0);

  useEffect(() => {
    const fetchPendingCounts = async () => {
      try {
        const [sellersRes, deliveryRes, productRes, batchRes] = await Promise.all([
          api.get("/auth/admin/sellers/pending"),
          api.get("/delivery"),
          api.get("/products", {
            params: { isApproved: "pending", isActive: "all" },
          }),
          api.get("/product-batches", { params: { status: "pending_review" } }),
        ]);
        setSellersCount(sellersRes.data.data.length);
        const pendingPartners = deliveryRes.data.data.filter(
          (p) => p.approvalStatus === "Pending",
        );
        setDeliveryCount(pendingPartners.length);
        setProductCount(productRes.data.data.length);
        setBatchCount(batchRes.data.data.length);
      } catch (err) {
        console.error("Failed to fetch counts for sidebar:", err);
      }
    };
    fetchPendingCounts();
    const interval = setInterval(fetchPendingCounts, 30000);
    return () => clearInterval(interval);
  }, []);

  const toggleExpand = (label) => {
    setExpandedItems((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
  };

  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };

  return (
    <>
      {/* Mobile Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <Motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Content */}
      <aside
        className={`
          fixed lg:static top-0 left-0 h-screen w-[290px] lg:shrink-0 bg-white text-slate-800 z-50 flex flex-col shadow-2xl lg:shadow-none overflow-hidden border-r border-slate-200/60
          transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Header / Workspace Branding with Real Brand Logo */}
        <div className="relative z-10 h-20 px-6 flex items-center justify-between border-b border-slate-100 bg-white">
          <Link to="/admin" className="flex items-center w-full">
            <img
              src={logoImage}
              alt="Riddha Interior Mart"
              className="h-16 w-auto object-contain max-w-[220px]"
            />
          </Link>
          <button
            onClick={onClose}
            className="lg:hidden text-slate-400 hover:text-slate-600 transition-colors"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Navigation Categories */}
        <nav className="relative z-10 flex-1 p-4 overflow-y-auto custom-scrollbar space-y-5 bg-white">
          {menuGroups.map((group) => (
            <div key={group.title} className="space-y-0.5">
              <h3 className="px-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 mt-1">
                {group.title}
              </h3>
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <NavItem
                    key={item.label}
                    item={item}
                    onClose={onClose}
                    expanded={expandedItems[item.label]}
                    onToggle={toggleExpand}
                    sellersCount={sellersCount}
                    deliveryCount={deliveryCount}
                    productCount={productCount}
                    batchCount={batchCount}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Live System Status Card */}
        <div className="relative z-10 px-5 py-3.5 mx-4 mb-3 rounded-xl bg-slate-50 border border-slate-200/60">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
              System Monitor
            </span>
          </div>
          <div className="flex items-center justify-between mt-2.5">
            <div className="text-left">
              <p className="text-[9px] text-slate-400">Database</p>
              <p className="text-xs font-bold text-emerald-600">99.98%</p>
            </div>
            <div className="text-left">
              <p className="text-[9px] text-slate-400">API Latency</p>
              <p className="text-xs font-bold text-slate-600">12ms</p>
            </div>
          </div>
        </div>

        {/* Bottom Profile Card & Logout */}
        <div className="relative z-10 p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[var(--color-primary)] to-[var(--color-accent-pink)] flex items-center justify-center text-white text-xs font-bold shadow-sm">
              {user?.fullName?.charAt(0) || "A"}
            </div>
            <div className="flex flex-col">
              <p className="text-xs font-bold text-slate-800 truncate max-w-[130px]">
                {user?.fullName || "Super Admin"}
              </p>
              <p className="text-[8px] text-[var(--color-accent-pink)] font-extrabold uppercase tracking-wider">
                Master Acc
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-100 transition-all cursor-pointer"
            title="Sign Out"
          >
            <FiLogOut size={14} />
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
