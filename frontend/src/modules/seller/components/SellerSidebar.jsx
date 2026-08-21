import React from "react";
import { NavLink, useLocation, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Boxes,
  Users,
  BarChart3,
  Wallet,
  Star,
  Megaphone,
  Bell,
  Settings,
  HelpCircle,
  ChevronRight,
  LogOut,
  X,
  Menu,
  PlusCircle,
  Search,
  Truck,
  ShoppingBag,
  Sparkles,
  Percent
} from "lucide-react";
import { useUser } from "../../user/data/UserContext";
import api from "../../../shared/utils/api";
import logo from "../../../assets/transparent_logo.png";
import { OFFER_TYPES } from "../../../shared/constants/offerTypes";

const menuItems = [
  { path: "/seller/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/seller/content-generator", icon: Sparkles, label: "AI Copywriter Studio" },
  {
    label: "Products",
    icon: Package,
    path: "/seller/my-products",
    children: [
      { path: "/seller/my-products", label: "All Products" },
      { path: "/seller/add-product", label: "Add New Product" },
      { path: "/seller/content-generator", label: "AI Content Generator" },
      { path: "/seller/bulk-upload", label: "Bulk Upload" },
      { path: "/seller/catalog", label: "Browse Catalog" },
    ],
  },
  {
    label: "Orders",
    icon: ShoppingCart,
    path: "/seller/orders",
    children: [
      { path: "/seller/orders",       label: "All Orders"   },
      { path: "/seller/bulk-orders",  label: "Bulk Orders"  },
      // Requirement A — B2B quote & sample queues
      { path: "/seller/rfqs",         label: "Quotation Requests" },
      { path: "/seller/samples",      label: "Sample Requests" },
    ]
  },
  { path: "/seller/stock-management", icon: Boxes, label: "Inventory" },
  { path: "/seller/customers", icon: Users, label: "Customers" },
  { path: "/seller/reports/sales", icon: BarChart3, label: "Analytics" },
  { path: "/seller/wallet", icon: Wallet, label: "Wallet" },
  { path: "/seller/reviews", icon: Star, label: "Reviews" },
  {
    label: "Marketing",
    icon: Megaphone,
    path: "/seller/marketing",
    children: [
      { path: "/seller/marketing", label: "Marketing Overview" },
      { path: "/seller/content-generator", label: "AI Copywriting Studio" },
      { path: "/seller/advertisement-plans", label: "Advertisement Plans" },
      { path: "/seller/my-advertisements", label: "My Advertisements" },
    ]
  },
  {
    label: "Deals & Discounts",
    icon: Percent,
    path: "/seller/offers",
    children: [
      { path: "/seller/offers", label: "All Offers" },
      ...OFFER_TYPES.map(t => ({ path: `/seller/offers/type/${t.slug}`, label: t.label }))
    ]
  },
  { path: "/seller/notifications", icon: Bell, label: "Notifications" },
  { path: "/seller/profile", icon: Settings, label: "Settings" },
  { path: "/seller/help", icon: HelpCircle, label: "Help & Support" },
];

const SellerSidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const [openMenus, setOpenMenus] = React.useState({});
  const [pendingOrdersCount, setPendingOrdersCount] = React.useState(0);

  React.useEffect(() => {
    const activeMenu = menuItems.find((item) =>
      item.children?.some((child) => location.pathname.startsWith(child.path)),
    );
    if (activeMenu) {
      setOpenMenus((prev) => ({ ...prev, [activeMenu.label]: true }));
    }

    // Fetch dynamic orders count
    const fetchOrdersCount = async () => {
      try {
        const { data } = await api.get("/seller/analytics?timeRange=monthly");
        if (data.success && data.data.stats) {
          setPendingOrdersCount(data.data.stats.pendingOrders || 0);
        }
      } catch (err) {
        console.error("Failed to fetch pending orders count:", err);
      }
    };
    fetchOrdersCount();
  }, [location.pathname]);

  const toggleMenu = (label) => {
    setOpenMenus((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const handleLogout = () => {
    logout();
    navigate("/seller/login");
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
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static top-0 left-0 h-screen w-[280px] lg:shrink-0 bg-white border-r border-slate-200 z-[70] flex flex-col shadow-xl lg:shadow-none transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Logo Area */}
        <div className="pt-2 px-6 pb-2 flex items-center justify-between">
          <Link
            to="/seller/dashboard"
            className="flex items-center group mx-auto lg:mx-0"
          >
            <div className="h-24 md:h-28 overflow-hidden transition-transform duration-300 group-hover:scale-105">
              <img
                src={logo}
                alt="Riddha Interior Mart"
                className="h-full w-auto object-contain"
              />
            </div>
          </Link>
          <button
            onClick={onClose}
            className="lg:hidden p-2 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Seller profile mini-card */}
        <div className="px-3 py-3 border-b border-slate-100 shrink-0">
          <Link to="/seller/profile" className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-50 transition-colors group">
            <div className="w-8 h-8 rounded-xl bg-seller-primary/10 text-seller-primary flex items-center justify-center font-black text-xs shrink-0 overflow-hidden">
              {user?.avatar
                ? <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                : (user?.fullName?.[0] || user?.name?.[0] || 'S')
              }
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-800 leading-none truncate">{user?.fullName || user?.name || 'Seller'}</p>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5 leading-none truncate">{user?.email || 'seller@store.com'}</p>
            </div>
            <ChevronRight size={13} className="text-slate-300 group-hover:text-slate-500 transition-colors shrink-0" />
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => {
            const hasChildren = !!item.children;
            const isMenuOpen = openMenus[item.label];
            const isActive =
              location.pathname === item.path ||
              item.children?.some((c) => location.pathname === c.path);

            if (hasChildren) {
              return (
                <div key={item.label}>
                  <button
                    onClick={() => toggleMenu(item.label)}
                    className={`
                      w-full flex items-center justify-between p-2 rounded-xl transition-all group
                      ${isActive ? "bg-seller-light/50 text-seller-primary" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon
                        size={20}
                        className={`${isActive ? "text-seller-primary" : "text-slate-400 group-hover:text-slate-600"}`}
                      />
                      <span className="font-semibold text-sm">
                        {item.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.label === "Orders" && pendingOrdersCount > 0 && (
                        <span className="w-5 h-5 rounded-full bg-seller-primary text-white flex items-center justify-center text-[10px] font-semibold">
                          {pendingOrdersCount}
                        </span>
                      )}
                      <ChevronRight
                        size={16}
                        className={`transition-transform duration-300 ${isMenuOpen ? "rotate-90" : ""} text-slate-400`}
                      />
                    </div>
                  </button>

                  <AnimatePresence>
                    {isMenuOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden ml-4 border-l border-slate-100 pl-2 mt-0.5 space-y-0.5"
                      >
                        {item.children.map((child) => (
                          <NavLink
                            key={child.path}
                            to={child.path}
                            onClick={() => {
                              if (window.innerWidth < 1024) onClose();
                            }}
                            className={({ isActive }) => `
                              flex items-center gap-3 p-2 rounded-lg text-sm font-medium transition-all
                              ${isActive ? "text-seller-primary bg-seller-light/30" : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"}
                            `}
                          >
                            {child.label}
                          </NavLink>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            }

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/seller"}
                onClick={() => {
                  if (window.innerWidth < 1024) onClose();
                }}
                className={({ isActive }) => `
                  flex items-center gap-3 p-2 rounded-xl transition-all group
                  ${
                    isActive
                      ? "bg-seller-primary text-white shadow-lg shadow-seller-primary/20"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }
                `}
              >
                <item.icon
                  size={20}
                  className={`${isActive ? "text-white" : "text-slate-400 group-hover:text-slate-600"}`}
                />
                <span className="font-semibold text-sm">{item.label}</span>
                {item.label === "Orders" && pendingOrdersCount > 0 && (
                  <span
                    className={`ml-auto w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold ${isActive ? "bg-white text-seller-primary" : "bg-seller-primary text-white"}`}
                  >
                    {pendingOrdersCount}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer: Sign out */}
        <div className="px-3 py-3 border-t border-slate-100 shrink-0">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all group"
          >
            <LogOut
              size={18}
              className="group-hover:-translate-x-1 transition-transform"
            />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
};

export default SellerSidebar;
