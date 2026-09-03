import React, { useState, useRef, useEffect } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  FiShoppingCart,
  FiMenu,
  FiX,
  FiUser,
  FiChevronDown,
  FiChevronRight,
  FiHome,
  FiGrid,
  FiShoppingBag,
  FiMapPin,
  FiInfo,
  FiPhone,
  FiRefreshCw,
  FiShield,
  FiLogOut,
  FiXCircle,
  FiTruck,
  FiFileText,
  FiList,
  FiHeart,
  FiZap,
  FiCompass,
  FiSearch,
  FiPercent
} from "react-icons/fi";
import { AiOutlineShop } from "react-icons/ai";
import { motion, AnimatePresence } from "framer-motion";
import { LuWallet, LuLayoutDashboard, LuCalculator, LuLayers, LuCrown } from "react-icons/lu";
import { useCart } from "../data/CartContext";
import { useUser } from "../data/UserContext";
import { useWishlist } from "../data/WishlistContext";
import SearchBar from "./SearchBar";
import api from '../../../shared/utils/api';
import { getDeliveryEstimate, getCityFromPincode } from '../../../shared/utils/delivery';
import BulkOrderModal from "./BulkOrderModal";
import SubscriptionModal from "./SubscriptionModal";
import NotificationDropdown from "../../../shared/components/NotificationDropdown";
import Logo from "../../../assets/WhatsApp Image 2026-05-06 at 3.50.08 PM.jpeg";
import TransparentLogo from "../../../assets/transparent_logo.png";

const toTitleCase = (str) => {
  if (!str) return '';
  return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

const getCategorySlug = (name) => {
  if (!name) return '';
  return name.toLowerCase().replace(/\s+/g, '-');
};

// AI-powered tools & services — shown in their own strip between the header and the categories bar
const AI_SERVICES = [
  { to: '/designer-quiz', icon: FiCompass, label: 'Design Quiz', sub: 'AI Persona' },
  { to: '/recommendations', icon: FiZap, label: 'AI Recommendations', sub: 'For You' },
  { to: '/client-brief', icon: FiFileText, label: 'Project Brief', sub: 'AI Generator' },
  { to: '/projects', icon: LuLayoutDashboard, label: 'Projects', sub: 'Dashboard' },
  { to: '/cost-estimator', icon: LuCalculator, label: 'Cost Estimator', sub: 'AI Calculation' },
  { to: '/boq-generator', icon: FiList, label: 'BOQ Generator', sub: 'Quantities & AI' },
  { to: '/quotation-generator', icon: FiFileText, label: 'Quotation Gen', sub: 'GST & Quotes' },
  { to: '/orders/track', icon: FiTruck, label: 'Order Tracking', sub: 'Live GPS & AI' },
  { to: '/rfq/new', icon: FiPercent, label: 'Get a Quote', sub: 'Request Pricing', state: { source: 'header-ai-strip' } }
];

const SidebarLink = ({ to, icon: Icon, label, onClick }) => (
  <NavLink
    to={to}
    end={to === '/'}
    onClick={onClick}
    className={({ isActive }) =>
      `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group ${isActive
        ? 'bg-[#189D91]/10 text-[#189D91] border border-[#189D91]/15'
        : 'text-gray-700 hover:bg-[#189D91]/5 hover:text-[#189D91] border border-transparent'
      }`
    }
  >
    {({ isActive }) => (
      <>
        <div className={`p-1.5 rounded-md border transition-all ${isActive ? 'bg-[#189D91]/15 border-[#189D91]/25' : 'bg-gray-50 border-gray-100 group-hover:bg-[#189D91]/10 group-hover:border-[#189D91]/20'}`}>
          <Icon size={16} />
        </div>
        <span className={`text-[13px] tracking-tight ${isActive ? 'font-black' : 'font-semibold'}`}>{label}</span>
        {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#189D91]" />}
      </>
    )}
  </NavLink>
);

const Navbar = () => {
  const { user, logout } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const [policiesOpen, setPoliciesOpen] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [hoveredSubcategory, setHoveredSubcategory] = useState(null);
  const [categories, setCategories] = useState([]);
  const [scrolled, setScrolled] = useState(false);
  const dropdownTimeoutRef = useRef(null);
  const categoriesBarRef = useRef(null);
  const { cartCount } = useCart();
  const { wishlistItems } = useWishlist();
  const wishlistCount = wishlistItems?.length || 0;
  const location = useLocation();
  const currentPath = location.pathname.toLowerCase();
  const isInitPath = currentPath.includes('/splash') || currentPath.includes('/onboarding');
  const isCartPage = currentPath === "/cart";

  if (isInitPath) return null;
  const [pincode, setPincode] = useState('700016');
  const [showMoreCategories, setShowMoreCategories] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);

  const isProActive = user?.subscription?.status === 'active' && user?.subscription?.endDate && new Date(user.subscription.endDate) > new Date();

  const activeCity = getCityFromPincode(pincode);
  const deliveryEstimate = getDeliveryEstimate(pincode);

  const [isPincodeModalOpen, setIsPincodeModalOpen] = useState(false);
  const [tempPincode, setTempPincode] = useState('');
  const [pincodeError, setPincodeError] = useState('');

  const handleOpenPincodeModal = () => {
    setTempPincode(pincode);
    setPincodeError('');
    setIsPincodeModalOpen(true);
  };

  const handlePincodeSubmit = (e) => {
    e.preventDefault();
    if (tempPincode.length !== 6) {
      setPincodeError('Please enter a 6-digit pincode.');
      return;
    }
    localStorage.setItem('userPincode', tempPincode);
    setPincode(tempPincode);
    setIsPincodeModalOpen(false);
  };

  useEffect(() => {
    const savedPincode = localStorage.getItem('userPincode');
    if (savedPincode && savedPincode !== 'default') {
      setPincode(savedPincode);
    }

    // Fetch categories for mega menu
    const fetchCategories = async () => {
      try {
        const response = await api.get('/categories');
        const payload = response.data;
        const nextCategories = Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload)
            ? payload
            : [];

        setCategories(nextCategories);
      } catch (err) {
        console.error('Failed to fetch navbar categories:', err);
        setCategories([]);
      }
    };
    fetchCategories();
  }, []);

  // Scroll detection for mobile navbar background
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const closeMobile = () => {
    setIsOpen(false);
    setPoliciesOpen(false);
  };

  // Positions the subcategory dropdown via JS (instead of pure CSS group-hover) because
  // its trigger sits inside the horizontally-scrolling categories row: that row needs
  // overflow-x-auto, and per the CSS spec setting overflow-x without overflow-y forces
  // overflow-y to 'auto' too — which silently clips any absolutely-positioned dropdown
  // nested inside it. Rendering the dropdown as a sibling outside that row, positioned
  // from the hovered item's real bounding box, sidesteps the clipping entirely.
  const handleCategoryEnter = (e, cat, slug) => {
    if (dropdownTimeoutRef.current) clearTimeout(dropdownTimeoutRef.current);
    const subcats = cat.subcategories || [];
    if (subcats.length === 0) {
      setHoveredCategory(null);
      setHoveredSubcategory(null);
      return;
    }
    const itemRect = e.currentTarget.getBoundingClientRect();
    const barRect = categoriesBarRef.current?.getBoundingClientRect();
    const computedLeft = barRect ? itemRect.left - barRect.left : 0;
    const maxLeft = typeof window !== 'undefined' ? window.innerWidth - 560 : 1000;
    const clampedLeft = Math.min(Math.max(16, computedLeft), maxLeft);

    setHoveredCategory({
      slug,
      subcats,
      left: clampedLeft
    });
    setHoveredSubcategory(subcats[0] || null);
  };

  const handleCategoryLeave = () => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setHoveredCategory(null);
      setHoveredSubcategory(null);
    }, 200);
  };

  const handleDropdownEnter = () => {
    if (dropdownTimeoutRef.current) clearTimeout(dropdownTimeoutRef.current);
  };

  return (
    <>
      <nav className={`transition-all duration-300 border-b relative z-50 md:bg-white ${scrolled
        ? 'bg-white shadow-md border-gray-200'
        : 'bg-gradient-to-r from-[#189D91]/10 via-white to-[#EC008C]/10 border-gray-200 md:border-gray-100'
        }`}>
        <div className="max-w-[1700px] mx-auto px-4 lg:px-6">
          {/* Main Desktop Header Row */}
          <div className="hidden md:flex items-center justify-between py-2.5 gap-2 lg:gap-4">
            <div className="flex items-center gap-3 lg:gap-5 shrink-0">
              <Link to="/" className="flex items-center lg:-my-4 relative z-10">
                <img
                  src={TransparentLogo}
                  alt="Riddha Interio"
                  className="h-10 lg:h-20 w-auto object-contain hover:scale-105 transition-transform duration-300 origin-left"
                />
              </Link>

              {/* Delivery Location */}
              <div className="flex items-center gap-2 text-gray-900">
                <FiMapPin className="text-[#28a399] w-5 h-5 shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-medium text-gray-400 leading-none">Delivering to</span>
                  <button
                    onClick={handleOpenPincodeModal}
                    className="flex items-center gap-1 text-[11.5px] font-bold text-gray-800 mt-0.5 group"
                  >
                    {activeCity} - <span>{pincode}</span> <FiChevronDown className="text-gray-400 group-hover:text-gray-600 transition-colors" size={12} />
                  </button>
                </div>
              </div>

              {/* Delivery Time */}
              <div className="flex items-center gap-2 text-gray-900 border-l border-gray-100 pl-2 lg:pl-4">
                <FiTruck className="text-[#28a399] w-5 h-5 shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-medium text-gray-400 leading-none">Delivery in</span>
                  <span className="text-[11.5px] font-extrabold text-[#EA580C] mt-0.5">
                    {deliveryEstimate.time}
                  </span>
                </div>
              </div>
            </div>

            {!isCartPage && currentPath !== '/search' && (
              <div className="flex-1 px-2">
                <SearchBar variant="premium" />
              </div>
            )}

            {/* Seller & Bulk Order shortcuts (AI tools & services now live in their own strip below) */}
            <div className="flex items-center gap-1.5 lg:gap-2 shrink-0">
              {/* Become a Seller */}
              <Link to="/seller/join" className="flex items-center gap-1.5 group">
                <AiOutlineShop className="text-gray-500 w-4 h-4 group-hover:text-[#28a399] transition-colors" />
                <div className="flex flex-col text-left">
                  <span className="text-[10px] font-bold text-gray-700 leading-none group-hover:text-[#28a399] transition-colors">Become a Seller</span>
                  <span className="text-[9px] font-bold text-[#28a399] mt-0.5">Join Now</span>
                </div>
              </Link>

              {/* Bulk Order */}
              <button
                onClick={() => setIsBulkModalOpen(true)}
                className="flex items-center gap-1.5 group border-l border-gray-100 pl-2 lg:pl-3 xl:pl-4 text-left"
              >
                <FiFileText className="text-gray-500 w-4 h-4 group-hover:text-[#28a399] transition-colors" />
                <div className="flex flex-col text-left">
                  <span className="text-[10px] font-bold text-gray-700 leading-none group-hover:text-[#28a399] transition-colors">Bulk Order</span>
                  <span className="text-[9px] font-bold text-[#28a399] mt-0.5">Best Price</span>
                </div>
              </button>
            </div>

            <div className="h-8 w-[1px] bg-gray-200 shrink-0 mx-1"></div>

            {/* User Actions */}
            <div className="flex items-center gap-3 lg:gap-4 shrink-0 pr-1">
              <Link to="/profile" className="flex items-center group relative" title={user ? (user.fullName?.split(' ')[0] || 'Profile') : 'Login'}>
                <FiUser className="w-5 h-5 text-gray-500 group-hover:text-[#28a399] transition-colors" />
              </Link>

              <Link to="/wishlist" className="flex items-center group relative" title="Wishlist">
                <FiHeart className="w-5 h-5 text-gray-500 group-hover:text-red-500 transition-colors" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-bold h-4 w-4 flex items-center justify-center rounded-full border-2 border-white">
                    {wishlistCount > 9 ? '9+' : wishlistCount}
                  </span>
                )}
              </Link>

              <Link to="/cart" className="flex items-center group relative" title="Cart">
                <FiShoppingCart className="w-5 h-5 text-gray-500 group-hover:text-[#28a399] transition-colors" />
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-[#FF6B35] text-white text-[9px] font-bold h-4 w-4 flex items-center justify-center rounded-full border-2 border-white">
                    {cartCount}
                  </span>
                )}
              </Link>

              {user && (
                <div className="flex items-center border-l border-gray-100 pl-3">
                  <NotificationDropdown />
                </div>
              )}
            </div>
          </div>

          {/* Mobile Header Row */}
          <div className="flex md:hidden justify-between items-center h-[72px] px-1">
            <Link to="/" className="flex-shrink-0 flex items-center h-full py-1">
              <img src={TransparentLogo} alt="Riddha Interio" className="h-[60px] w-auto object-contain pl-2 scale-110 origin-left" />
            </Link>
            <div className="flex items-center gap-1.5">
              <Link to="/profile" className="p-1.5 text-[#189D91]">
                <FiUser className="h-[22px] w-[22px]" />
              </Link>
              {user && (
                <Link to="/wishlist" className="p-1.5 text-[#189D91] relative">
                  <FiHeart className="h-[22px] w-[22px]" />
                  {wishlistCount > 0 && (
                    <span className="absolute top-0 right-0 bg-red-500 text-white text-[9px] font-bold h-4 w-4 flex items-center justify-center rounded-full border border-white">
                      {wishlistCount > 9 ? '9+' : wishlistCount}
                    </span>
                  )}
                </Link>
              )}
              {user && <NotificationDropdown isMobile={true} />}
              <Link to="/cart" className="p-1.5 text-[#189D91] relative">
                <FiShoppingCart className="h-[22px] w-[22px]" />
                {cartCount > 0 && <span className="absolute top-0 right-0 bg-[#EC008C] text-white text-[9px] font-bold h-4 w-4 flex items-center justify-center rounded-full border border-white">{cartCount}</span>}
              </Link>
              <button onClick={() => setIsOpen(!isOpen)} className="p-1.5 text-[#189D91]">
                {isOpen ? <FiX className="h-6 w-6" /> : <FiMenu className="h-6 w-6" />}
              </button>
            </div>
          </div>

          {!isCartPage && currentPath !== '/search' && (
            <div className="md:hidden pb-3 px-2">
              <SearchBar variant="premium" />
            </div>
          )}
        </div>
      </nav>

      {/* AI Tools & Services Strip OR Upgrade to Pro Strip */}
      <div className="hidden md:block bg-white border-b border-gray-100 relative z-40">
        <div className="max-w-[1700px] mx-auto px-6 lg:px-8">
          {isProActive ? (
            <div className="flex items-center gap-x-7 lg:gap-x-10 py-2.5 overflow-x-auto no-scrollbar scroll-smooth lg:justify-center">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-500 to-yellow-600 text-white text-[10px] font-black tracking-wider uppercase shadow-sm shrink-0 mr-2">
                <LuCrown className="w-3 h-3 text-amber-200" />
                <span>{user?.subscription?.planName || 'PRO ACTIVE'}</span>
              </div>
              {AI_SERVICES.map((svc) => (
                <Link key={svc.to} to={svc.to} state={svc.state} className="flex items-center gap-2 group shrink-0">
                  <div className="w-7 h-7 rounded-lg bg-gray-50 border border-[#189D91]/20 flex items-center justify-center shadow-sm group-hover:bg-[#189D91] group-hover:border-[#189D91] transition-colors shrink-0">
                    <svc.icon className="w-3.5 h-3.5 text-[#189D91] group-hover:text-white transition-colors" />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-[10.5px] font-bold text-gray-700 leading-none group-hover:text-[#28a399] transition-colors whitespace-nowrap">{svc.label}</span>
                    <span className="text-[9px] font-bold text-[#189D91] mt-0.5 whitespace-nowrap">{svc.sub}</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="py-2 flex items-center justify-between gap-4 bg-gradient-to-r from-[#003d33] via-[#189D91] to-[#28a399] text-white px-5 rounded-xl my-1.5 shadow-md">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="p-1.5 rounded-lg bg-amber-400 text-slate-950 font-black shrink-0 shadow-sm">
                  <LuCrown className="w-4 h-4" />
                </div>
                <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3 truncate">
                  <span className="font-black text-xs md:text-sm tracking-wide text-amber-300">Upgrade to Riddha Pro:</span>
                  <span className="text-xs font-semibold text-teal-50 truncate">
                    Silver (₹1,999), Gold (₹3,999), Platinum (₹6,999) & Diamond (₹11,999) unlock full AI features!
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsSubscriptionModalOpen(true)}
                className="shrink-0 py-1.5 px-4 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs uppercase tracking-wider shadow-md hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5"
              >
                <FiZap className="w-3.5 h-3.5" /> Upgrade to Pro
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Desktop Secondary Categories Nav with Mega Menu */}
      <div ref={categoriesBarRef} className="hidden md:block bg-white border-b border-gray-200 relative z-40">
        <div className="max-w-[1700px] mx-auto px-6 lg:px-8 flex items-center h-12">
          <div className="flex items-center gap-4 w-full">
            {/* All Categories Button */}
            <div className="relative group/cat shrink-0">
              <Link
                to="/categories"
                className="flex items-center gap-2 bg-[#28a399] text-white px-5 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider hover:bg-[#003d33] transition-colors shadow-sm"
              >
                <FiMenu className="w-4 h-4" />
                <span>All Categories</span>
              </Link>

              {/* Categories Dropdown */}
              <div className="absolute top-full left-0 pt-2 opacity-0 invisible group-hover/cat:opacity-100 group-hover/cat:visible transition-all duration-300 z-50">
                <div className="bg-white shadow-2xl border border-gray-100 rounded-xl py-3 w-64">
                  {categories.map((cat, i) => (
                    <Link
                      key={i}
                      to={`/category/${getCategorySlug(cat.name)}`}
                      className="flex items-center gap-3 px-6 py-2.5 hover:bg-gray-50 text-gray-700 hover:text-[#189D91] transition-colors"
                    >
                      <span className="text-sm font-bold tracking-tight">{cat.name}</span>
                    </Link>
                  ))}
                  <div className="mt-2 pt-2 border-t border-gray-50 px-6">
                    <Link to="/categories" className="text-xs font-bold text-[#189D91] hover:underline">View All Categories</Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Dynamic Parent Categories next to All Categories */}
            <div className="flex items-center gap-6 lg:gap-8 overflow-x-auto custom-scrollbar pb-1 scroll-smooth ml-6">
              {categories.map((cat, i) => {
                const slug = getCategorySlug(cat.name);
                const linkTo = `/category/${slug}`;
                const isActive = location.pathname === linkTo;

                return (
                  <div
                    key={i}
                    className="relative h-full flex items-center shrink-0"
                    onMouseEnter={(e) => handleCategoryEnter(e, cat, slug)}
                    onMouseLeave={handleCategoryLeave}
                  >
                    <Link
                      to={linkTo}
                      className={`text-[13px] font-semibold tracking-tight transition-all h-full flex items-center whitespace-nowrap px-1 py-3 ${isActive
                        ? "text-[#28a399] border-b-2 border-[#28a399]"
                        : "text-gray-800 hover:text-[#28a399]"
                        }`}
                    >
                      {cat.name}
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Subcategories & Sub-subcategories Dropdown — rendered outside the scrolling row so it isn't clipped */}
        {hoveredCategory && (
          <div
            onMouseEnter={handleDropdownEnter}
            onMouseLeave={handleCategoryLeave}
            style={{ left: hoveredCategory.left }}
            className="absolute top-full pt-2 z-50 flex items-start"
          >
            <div className="flex bg-white shadow-2xl border border-gray-100 rounded-2xl overflow-hidden backdrop-blur-md">
              {/* 1st Column: Subcategories List */}
              <div className="w-60 py-2.5 max-h-[420px] overflow-y-auto custom-scrollbar bg-white border-r border-gray-100/80">
                {hoveredCategory.subcats.map((sub) => {
                  const hasSubSubs = sub.subsubcategories && sub.subsubcategories.length > 0;
                  const isSubHovered = hoveredSubcategory?.name === sub.name || hoveredSubcategory?._id === sub._id;

                  return (
                    <div
                      key={sub._id || sub.name}
                      onMouseEnter={() => setHoveredSubcategory(sub)}
                      className="relative"
                    >
                      <Link
                        to={`/category/${hoveredCategory.slug}?sub=${encodeURIComponent(sub.name)}`}
                        onClick={() => {
                          setHoveredCategory(null);
                          setHoveredSubcategory(null);
                        }}
                        className={`flex items-center justify-between px-5 py-2.5 text-[13px] font-semibold transition-all whitespace-nowrap ${
                          isSubHovered
                            ? 'bg-[#189D91]/10 text-[#189D91] border-l-4 border-[#189D91]'
                            : 'text-gray-700 hover:bg-gray-50 hover:text-[#28a399] border-l-4 border-transparent'
                        }`}
                      >
                        <span className="truncate">{sub.name}</span>
                        {hasSubSubs && (
                          <FiChevronRight className={`w-4 h-4 shrink-0 transition-transform ${isSubHovered ? 'translate-x-0.5 text-[#189D91]' : 'text-gray-400'}`} />
                        )}
                      </Link>
                    </div>
                  );
                })}
              </div>

              {/* 2nd Column: Sub-subcategories Flyout Panel */}
              {hoveredSubcategory && hoveredSubcategory.subsubcategories && hoveredSubcategory.subsubcategories.length > 0 && (
                <div className="w-64 py-3 px-3 max-h-[420px] overflow-y-auto custom-scrollbar bg-gray-50/70 border-l border-gray-100">
                  <div className="px-2 pb-2 mb-2 border-b border-gray-200/60 flex items-center justify-between">
                    <span className="text-[10.5px] font-black uppercase tracking-wider text-[#189D91]">
                      {hoveredSubcategory.name}
                    </span>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#189D91]/15 text-[#189D91]">
                      {hoveredSubcategory.subsubcategories.length} Types
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    {hoveredSubcategory.subsubcategories.map((subsub, idx) => {
                      const subsubName = typeof subsub === 'string' ? subsub : subsub.name;
                      return (
                        <Link
                          key={subsub._id || idx}
                          to={`/category/${hoveredCategory.slug}?sub=${encodeURIComponent(hoveredSubcategory.name)}&subsub=${encodeURIComponent(subsubName)}`}
                          onClick={() => {
                            setHoveredCategory(null);
                            setHoveredSubcategory(null);
                          }}
                          className="flex items-center justify-between px-3 py-2 text-[12.5px] font-semibold text-gray-700 hover:bg-white hover:text-[#28a399] rounded-xl border border-transparent hover:border-gray-100 hover:shadow-sm transition-all whitespace-nowrap group/subsub"
                        >
                          <span className="truncate">{subsubName}</span>
                          <FiChevronRight className="w-3.5 h-3.5 opacity-0 group-hover/subsub:opacity-100 text-[#28a399] transition-opacity shrink-0 ml-1" />
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={closeMobile}
              className="md:hidden fixed inset-0 bg-black/30 backdrop-blur-[2px] z-[90]"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="md:hidden fixed top-0 left-0 bottom-0 h-screen w-[85%] max-w-[320px] bg-white z-[100] shadow-[10px_0_40px_-15px_rgba(0,0,0,0.3)] flex flex-col overflow-hidden"
            >
              <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col">
                {/* User Profile Header & Close Button */}
                <div className="px-5 py-6 bg-gradient-to-b from-gray-50/80 to-white border-b border-gray-100 relative shrink-0">
                  <button onClick={closeMobile} className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-800 bg-white shadow-sm border border-gray-100 rounded-full transition-all">
                    <FiX className="h-4 w-4" />
                  </button>
                  {user ? (
                    <div className="flex items-center gap-3.5 mt-2">
                      <div className="h-11 w-11 rounded-full bg-[#189D91]/10 flex items-center justify-center text-[#189D91] border border-white shadow-sm overflow-hidden font-bold">
                        {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : user.fullName?.charAt(0) || 'U'}
                      </div>
                      <div className="pr-8">
                        <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#189D91] mb-1">Welcome back</p>
                        <h4 className="text-[15px] font-bold text-gray-900 leading-none truncate">{user.fullName || 'User'}</h4>
                      </div>
                    </div>
                  ) : (
                    <Link to="/login" onClick={closeMobile} className="flex items-center gap-3.5 mt-2 group pr-8">
                      <div className="h-11 w-11 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 border border-white shadow-sm">
                        <FiUser size={18} />
                      </div>
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-1">Join the family</p>
                        <h4 className="text-[15px] font-bold text-[#189D91] group-hover:underline leading-none">Login / Signup</h4>
                      </div>
                    </Link>
                  )}
                </div>

                {/* Mobile Delivery Location Selector */}
                <div className="px-5 py-3.5 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2.5">
                    <FiMapPin className="text-[#28a399] w-4 h-4" />
                    <div className="flex flex-col">
                      <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider">Delivering to</span>
                      <span className="text-[12px] font-bold text-gray-800 mt-0.5">{activeCity} - {pincode}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      closeMobile();
                      handleOpenPincodeModal();
                    }}
                    className="text-[10px] font-bold uppercase tracking-wider text-[#28a399] hover:underline"
                  >
                    Change
                  </button>
                </div>

                <div className="px-3 py-3 space-y-1 shrink-0">
                  {/* Primary Nav */}
                  <div className="pb-3 mb-3 border-b border-gray-50">
                    <SidebarLink to="/" icon={FiHome} label="Home" onClick={closeMobile} />
                    <SidebarLink to="/cost-estimator" icon={LuCalculator} label="AI Cost Estimator" onClick={closeMobile} />
                    <SidebarLink to="/boq-generator" icon={FiList} label="BOQ Generator" onClick={closeMobile} />
                    <SidebarLink to="/quotation-generator" icon={FiFileText} label="Quotation Generator" onClick={closeMobile} />
                    <SidebarLink to="/orders/track" icon={FiTruck} label="Real-Time Order Tracking" onClick={closeMobile} />
                    <SidebarLink to="/projects" icon={LuLayoutDashboard} label="My Projects Studio" onClick={closeMobile} />
                    <SidebarLink to="/client-brief" icon={FiFileText} label="AI Project Brief" onClick={closeMobile} />
                    <SidebarLink to="/products" icon={FiGrid} label="Shop Products" onClick={closeMobile} />
                    <SidebarLink to="/bundles" icon={FiZap} label="Smart Bundles" onClick={closeMobile} />
                    <SidebarLink to="/journey" icon={FiCompass} label="My Journey" onClick={closeMobile} />
                    <SidebarLink to="/recommendations" icon={FiZap} label="AI Recommendations Feed" onClick={closeMobile} />
                    <SidebarLink to="/designer-quiz" icon={FiCompass} label="Designer Quiz" onClick={closeMobile} />
                    <SidebarLink to="/referral-rewards" icon={LuWallet} label="Riddha Wallet" onClick={closeMobile} />
                    <SidebarLink to="/rfq" icon={FiFileText} label="My Quotation Requests" onClick={closeMobile} />
                    <SidebarLink to="/samples" icon={LuLayers} label="My Sample Requests" onClick={closeMobile} />
                    <SidebarLink to="/orders" icon={FiShoppingBag} label="My Orders" onClick={closeMobile} />
                    {user && <SidebarLink to="/wishlist" icon={FiHeart} label="My Wishlist" onClick={closeMobile} />}
                    <SidebarLink to="/profile" icon={FiUser} label="My Account" onClick={closeMobile} />
                  </div>

                  {/* Information & Support */}
                  <div className="pb-3 mb-3 border-b border-gray-50">
                    <p className="px-3 mb-2 text-[9px] font-bold uppercase tracking-[0.15em] text-gray-400">Support & Info</p>
                    <SidebarLink to="/about" icon={FiInfo} label="About Us" onClick={closeMobile} />
                    <SidebarLink to="/contact" icon={FiPhone} label="Contact Us" onClick={closeMobile} />
                  </div>

                  {/* Legal */}
                  <div className="pb-2">
                    <p className="px-3 mb-2 text-[9px] font-bold uppercase tracking-[0.15em] text-gray-400">Policies</p>
                    <SidebarLink to="/policies/returns" icon={FiRefreshCw} label="Returns & Refunds" onClick={closeMobile} />
                    <SidebarLink to="/policies/cancellation" icon={FiXCircle} label="Cancellation" onClick={closeMobile} />
                    <SidebarLink to="/terms" icon={FiShield} label="Terms & Conditions" onClick={closeMobile} />
                  </div>
                </div>
              </div>

              {/* Logout Footer */}
              <div className="p-4 border-t border-gray-100 bg-gray-50/50 mt-auto shrink-0">
                {user ? (
                  <button
                    onClick={() => { logout(); navigate('/'); closeMobile(); }}
                    className="w-full py-2.5 px-4 rounded-lg bg-white border border-red-100 text-red-600 font-bold text-[13px] flex items-center justify-center gap-2 hover:bg-red-50 hover:border-red-200 shadow-sm transition-all"
                  >
                    <FiLogOut size={16} /> Logout Account
                  </button>
                ) : (
                  <p className="text-[9px] uppercase tracking-[0.2em] font-bold text-gray-400 text-center">© {new Date().getFullYear()} Riddha Interio</p>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <BulkOrderModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
      />

      <SubscriptionModal
        isOpen={isSubscriptionModalOpen}
        onClose={() => setIsSubscriptionModalOpen(false)}
      />

      {/* Premium Pincode Selection Modal */}
      <AnimatePresence>
        {isPincodeModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPincodeModalOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-[4px] z-[999]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="fixed inset-0 m-auto w-[90%] max-w-[380px] h-fit bg-white rounded-3xl shadow-2xl z-[1000] overflow-hidden p-6 border border-gray-100 flex flex-col gap-4"
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-[#28a399]/5 flex items-center justify-center text-[#28a399]">
                    <FiMapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-extrabold text-gray-900 tracking-tight leading-none">Change Location</h3>
                    <p className="text-[9px] font-semibold uppercase tracking-wider text-gray-400 mt-1">Select Delivery Destination</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsPincodeModalOpen(false)}
                  className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              <p className="text-[12px] font-medium text-gray-400 leading-relaxed">
                Enter your 6-digit delivery pincode to estimate shipping timeframes and product availability.
              </p>

              <form onSubmit={handlePincodeSubmit} className="flex flex-col gap-4 mt-2">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-gray-400 ml-1">Pincode</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={tempPincode}
                    onChange={(e) => setTempPincode(e.target.value.replace(/\D/g, ''))}
                    placeholder="e.g. 700016"
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border-2 border-transparent focus:border-[#28a399]/10 focus:bg-white focus:outline-none text-[13px] font-bold text-gray-800 tracking-widest"
                    required
                  />
                </div>

                {pincodeError && (
                  <span className="text-red-500 text-[10px] font-bold uppercase tracking-widest ml-1">
                    {pincodeError}
                  </span>
                )}

                <button
                  type="submit"
                  className="w-full py-3.5 bg-[#28a399] text-white rounded-2xl font-bold text-xs uppercase tracking-[0.2em] hover:bg-[#003d33] transition-colors shadow-lg shadow-[#28a399]/15"
                >
                  Update Location
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};


export default Navbar;


