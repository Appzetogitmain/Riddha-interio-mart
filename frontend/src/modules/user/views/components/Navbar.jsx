import React, { useState, useRef, useEffect } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import {
  FiShoppingCart,
  FiMenu,
  FiX,
  FiUser,
  FiChevronDown,
  FiChevronRight,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "../../models/CartContext";
import SearchBar from "./SearchBar";
import { subcategories } from "../../models/subcategories";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [policiesOpen, setPoliciesOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  const dropdownTimeoutRef = useRef(null);
  const { cartCount } = useCart();
  const location = useLocation();
  const isCartPage = location.pathname === "/cart";
  const [pincode, setPincode] = useState("452018");

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Categories", path: "/categories" },
    { name: "Design Quiz", path: "/designer-quiz" },
    { name: "Stores", path: "/stores" },
    { name: "Contact us", path: "/contact" }
  ];

  const policyLinks = [
    { name: "Cancellation Policy", path: "/policies/cancellation" },
    { name: "Returns Policy", path: "/policies/returns" },
    { name: "Refund Policy", path: "/policies/refund" }
  ];

  useEffect(() => {
    const savedPincode = localStorage.getItem("userPincode");
    if (savedPincode && savedPincode !== "default") {
      setPincode(savedPincode);
    }
  }, []);

  const closeMobile = () => {
    setIsOpen(false);
    setPoliciesOpen(false);
  };

  const handleCategoryEnter = (cat) => {
    if (dropdownTimeoutRef.current) clearTimeout(dropdownTimeoutRef.current);
    setActiveCategory(cat);
  };

  const handleCategoryLeave = () => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setActiveCategory(null);
    }, 200);
  };

  const menuItems = [
    { name: "Tiles", key: "tiles" },
    { name: "Electricals", key: "electricals" },
    { name: "Furniture", key: "furniture" },
    { name: "Paints", key: "paints" },
    { name: "Lighting & Fans", key: "electricals" }, // Mapping to existing keys where applicable
    { name: "Hardware", key: "hardware" },
    { name: "Bathroom", key: "bathroom" },
    { name: "Kitchen", key: "kitchen" },
    { name: "Appliances", key: "appliances" },
  ];

  return (
    <>
      <nav className="bg-[#189D91] relative z-50">
        <div className="max-w-[1440px] mx-auto px-4 lg:px-8">
          {/* Main Desktop Header Row */}
          <div className="hidden md:flex items-center justify-between py-3 gap-8">
            {/* Left: Logo & Delivery */}
            <div className="flex items-center gap-10 shrink-0">
              <Link to="/" className="flex items-center">
                <span className="text-2xl font-black text-white tracking-tighter">
                  RIDDHA INTERIO
                </span>
              </Link>
              <div className="flex flex-col text-white">
                <span className="text-[11px] font-bold leading-tight">
                  Delivery in 4 hours
                </span>
                <button className="flex items-center gap-1 text-[13px] font-bold mt-0.5">
                  to {pincode} <FiChevronDown size={14} />
                </button>
              </div>
            </div>

            {/* Center: Search */}
            {!isCartPage && (
              <div className="flex-1 max-w-2xl px-4">
                <SearchBar variant="desktop" />
              </div>
            )}

            {/* Right: Icons with Labels */}
            <div className="flex items-center gap-6 shrink-0">
              <Link
                to="/designer-quiz"
                className="flex flex-col items-center text-white/90 hover:text-white transition-colors group"
              >
                <div className="h-6 w-6 mb-1 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    className="w-full h-full"
                  >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-center">
                  Design Quiz
                </span>
              </Link>
              <Link
                to="/stores"
                className="flex flex-col items-center text-white/90 hover:text-white transition-colors group"
              >
                <div className="h-6 w-6 mb-1 border-2 border-white/40 rounded flex items-center justify-center p-0.5 group-hover:border-white transition-colors">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    className="w-full h-full"
                  >
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  Store
                </span>
              </Link>
              <Link
                to="/contact"
                className="flex flex-col items-center text-white/90 hover:text-white transition-colors group"
              >
                <div className="h-6 w-6 mb-1 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    className="w-full h-full transition-colors"
                  >
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-center">
                  Contact us
                </span>
              </Link>
              <Link
                to="/profile"
                className="flex flex-col items-center text-white/90 hover:text-white transition-colors group px-2 border-l border-white/20"
              >
                <FiUser className="h-6 w-6 mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  Login/Signup
                </span>
              </Link>
              <Link
                to="/cart"
                className="flex flex-col items-center text-white/90 hover:text-white transition-colors group relative px-2 border-l border-white/20"
              >
                <div className="relative">
                  <FiShoppingCart className="h-6 w-6 mb-1 group-hover:scale-110 transition-transform" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-white text-[#189D91] text-[8px] font-black h-3.5 w-3.5 flex items-center justify-center rounded-full">
                      {cartCount}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  Cart
                </span>
              </Link>
            </div>
          </div>

          {/* Mobile Header Row (Unchanged Design, Red Background) */}
          <div className="flex md:hidden justify-between items-center h-16">
            <Link to="/" className="flex-shrink-0">
              <span className="text-xl md:text-2xl font-display font-bold text-white tracking-tight">
                RIDDHA INTERIO
              </span>
            </Link>

            <div className="flex items-center space-x-2">
              <Link to="/profile" className="p-2 text-white/80">
                <FiUser className="h-5 w-5" />
              </Link>
              <Link to="/cart" className="p-2 text-white/80 relative">
                <FiShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute top-1 right-1 bg-white text-[#189D91] text-[8px] font-bold h-4 w-4 flex items-center justify-center rounded-full">
                    {cartCount}
                  </span>
                )}
              </Link>
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 text-white/80"
              >
                {isOpen ? (
                  <FiX className="h-6 w-6" />
                ) : (
                  <FiMenu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>

          {/* Persistent Mobile Search Bar Row (Unchanged) */}
          {!isCartPage && (
            <div className="md:hidden pb-2 font-IBO">
              <SearchBar className="scale-95 origin-left" />
            </div>
          )}
        </div>
      </nav>

      {/* Desktop Secondary Categories Nav with Mega Menu */}
      <div
        className="hidden md:block bg-white border-b border-gray-200 relative z-40"
        onMouseLeave={handleCategoryLeave}
      >
        <div className="max-w-[1440px] mx-auto px-8">
          <div className="flex items-center justify-between h-10 gap-6">
            {menuItems.map((item, i) => (
              <div
                key={i}
                className="relative h-full flex items-center group/cat"
                onMouseEnter={() => handleCategoryEnter(item.key)}
              >
                <Link
                  to={`/shop?category=${item.key}`}
                  className={`text-[13px] font-medium transition-colors h-full flex items-center border-b-2 ${
                    activeCategory === item.key
                      ? "text-[#189D91] border-[#189D91]"
                      : "text-gray-800 border-transparent hover:text-[#189D91]"
                  }`}
                >
                  {item.name}
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Mega Menu Dropdown */}
        <AnimatePresence>
          {activeCategory && subcategories[activeCategory] && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2 }}
              className="absolute top-full left-0 w-full bg-white border-b border-gray-200 shadow-xl overflow-hidden"
              onMouseEnter={() => {
                if (dropdownTimeoutRef.current)
                  clearTimeout(dropdownTimeoutRef.current);
              }}
            >
              <div className="max-w-[1440px] mx-auto px-12 py-10">
                <div className="grid grid-cols-4 lg:grid-cols-5 gap-12">
                  {/* For demo, we'll split the subcategories into columns or just list them */}
                  <div className="flex flex-col gap-6">
                    <h3 className="text-[#189D91] font-bold text-sm uppercase tracking-wide border-b border-gray-100 pb-2">
                      {activeCategory.charAt(0).toUpperCase() +
                        activeCategory.slice(1)}{" "}
                      Types
                    </h3>
                    <div className="flex flex-col gap-3">
                      {subcategories[activeCategory].map((sub, idx) => (
                        <Link
                          key={idx}
                          to={`/shop?category=${activeCategory}&sub=${sub.slug}`}
                          className="text-gray-600 hover:text-[#189D91] text-sm font-medium transition-colors"
                        >
                          {sub.name}
                        </Link>
                      ))}
                    </div>
                  </div>

                  {/* Placeholder columns to match the "mega" look */}
                  <div className="flex flex-col gap-6 opacity-40">
                    <h3 className="text-gray-400 font-bold text-sm uppercase tracking-wide border-b border-gray-100 pb-2">
                      Popular Brands
                    </h3>
                    <div className="flex flex-col gap-3">
                      <span className="text-gray-400 text-sm">
                        Premium Series
                      </span>
                      <span className="text-gray-400 text-sm">
                        Designer Collection
                      </span>
                      <span className="text-gray-400 text-sm">
                        Eco Friendly
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile Sidebar Menu - Outside nav to avoid containing block issues with backdrop-filter */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={closeMobile}
              className="md:hidden fixed inset-0 bg-warm-sand/20 backdrop-blur-sm z-[90]"
            />
            {/* Sidebar */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{
                type: "spring",
                stiffness: 450,
                damping: 45,
                mass: 1,
              }}
              className="md:hidden fixed top-0 left-0 bottom-0 h-screen w-[85%] max-w-[320px] bg-white z-[100] shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Sidebar Header */}
              <div className="flex items-center justify-between px-6 py-8 border-b border-soft-oatmeal/15 bg-white/50 backdrop-blur-md">
                <Link
                  to="/"
                  onClick={closeMobile}
                  className="flex items-center group"
                >
                  <span className="text-xl font-display font-black text-deep-espresso tracking-tighter">
                    <span className="text-warm-sand">R</span>IDDHA INTERIO
                  </span>
                </Link>
                <motion.button
                  whileHover={{ rotate: 90 }}
                  whileTap={{ scale: 0.8 }}
                  onClick={closeMobile}
                  className="p-2.5 text-deep-espresso/40 hover:text-deep-espresso hover:bg-soft-oatmeal/10 rounded-full transition-all"
                >
                  <FiX className="h-5 w-5" />
                </motion.button>
              </div>

              {/* Sidebar Links */}
              <div className="flex-1 overflow-y-auto pt-6 pb-12 px-6 space-y-1 no-scrollbar">
                {navLinks
                  .filter((link) => link.name !== "Products")
                  .map((link) => (
                    <Link
                      key={link.name}
                      to={link.path}
                      onClick={closeMobile}
                      className="block py-3.5 text-[15px] font-display font-bold text-deep-espresso/80 hover:text-warm-sand transition-colors border-b border-soft-oatmeal/5"
                    >
                      {link.name}
                    </Link>
                  ))}

                <div className="h-px bg-soft-oatmeal/10 my-4" />

                {/* Policies Accordion */}
                <div className="border-b border-soft-oatmeal/5">
                  <button
                    onClick={() => setPoliciesOpen(!policiesOpen)}
                    className="w-full flex items-center justify-between py-3.5 text-[15px] font-display font-bold text-deep-espresso/80 hover:text-warm-sand transition-colors"
                  >
                    <span>Policies</span>
                    <motion.div
                      animate={{ rotate: policiesOpen ? 90 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <FiChevronRight className="h-4 w-4 text-warm-sand/50" />
                    </motion.div>
                  </button>
                  <AnimatePresence initial={false}>
                    {policiesOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        className="overflow-hidden bg-golden-glow/10 rounded-xl mb-4"
                      >
                        <div className="pl-4 py-2 space-y-1">
                          {policyLinks.map((link) => (
                            <Link
                              key={link.name}
                              to={link.path}
                              onClick={closeMobile}
                              className="block py-2.5 text-[14px] font-medium text-deep-espresso/60 hover:text-warm-sand transition-colors"
                            >
                              {link.name}
                            </Link>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <Link
                  to="/terms"
                  onClick={closeMobile}
                  className="block py-3.5 text-[15px] font-display font-bold text-deep-espresso/80 hover:text-warm-sand transition-colors border-b border-soft-oatmeal/5"
                >
                  Terms & Conditions
                </Link>

                <div className="h-px bg-soft-oatmeal/10 my-4" />

                <Link
                  to="/profile"
                  onClick={closeMobile}
                  className="flex items-center gap-3 py-3.5 text-[15px] font-display font-bold text-deep-espresso/80 hover:text-warm-sand transition-colors"
                >
                  <FiUser className="h-4 w-4" />
                  My Account
                </Link>
              </div>

              {/* Sidebar Footer */}
              <div className="px-8 py-6 border-t border-soft-oatmeal/15 bg-soft-oatmeal/5">
                <p className="text-[10px] uppercase tracking-[0.25em] font-black text-deep-espresso/20 italic">
                  © {new Date().getFullYear()} Riddha Interior Mart. Crafted for
                  Luxury.
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
