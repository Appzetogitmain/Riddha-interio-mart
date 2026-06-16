import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, Link } from 'react-router-dom';
import SellerSidebar from './SellerSidebar';
import { useUser } from '../../user/data/UserContext';
import { 
  Menu, 
  User, 
  LogOut, 
  ChevronDown, 
  Check, 
  X, 
  Search, 
  Bell, 
  MessageSquare,
  LayoutGrid,
  Settings
} from 'lucide-react';
import NotificationDropdown from '../../../shared/components/NotificationDropdown';
import { motion, AnimatePresence } from 'framer-motion';

const SellerLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { logout, user } = useUser();
  const navigate = useNavigate();

  const storedUser = JSON.parse(localStorage.getItem('riddha_user') || 'null');
  const activeUser = user || storedUser;
  const hasValidSellerSession =
    Boolean(activeUser?.token) && activeUser?.role === 'seller';

  useEffect(() => {
    if (!hasValidSellerSession) {
      navigate('/seller/login', { replace: true });
    }
  }, [hasValidSellerSession, navigate]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!hasValidSellerSession) {
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate('/seller/login');
  };

  return (
    <div className="seller-theme flex h-screen w-full bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <SellerSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col h-full overflow-hidden w-full relative">
        {/* Sticky Header */}
        <header 
          className={`
            h-14 md:h-16 px-4 md:px-8 flex items-center justify-between z-30 sticky top-0 transition-all duration-300
            ${scrolled ? 'bg-white/80 backdrop-blur-md shadow-sm border-b border-slate-200' : 'bg-transparent'}
          `}
        >
          {/* Mobile Menu Toggle & Breadcrumbs/Title */}
          <div className="flex items-center gap-4 flex-1">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-600"
            >
              <Menu size={22} />
            </button>
            
            {/* Desktop Search */}
            <div className="hidden md:flex relative max-w-md w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search orders, products, etc..." 
                className="w-full bg-slate-100 border-none rounded-xl pl-11 pr-4 py-2 text-sm focus:ring-2 focus:ring-seller-primary/20 transition-all"
              />
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 md:gap-5">
            {/* Action Buttons */}
            <div className="flex items-center gap-1 md:gap-2 mr-2">
              <NotificationDropdown 
                isMobile={false} 
                buttonClassName="p-2.5 text-slate-500 hover:bg-slate-100 rounded-xl transition-colors relative"
                viewAllPath="/seller/notifications"
              />
            </div>

            <div className="h-8 w-[1px] bg-slate-200 hidden md:block"></div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 md:gap-3 p-1 pr-2 hover:bg-slate-100 rounded-2xl transition-colors"
              >
                <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-seller-primary flex items-center justify-center text-white shadow-md shadow-seller-primary/10 overflow-hidden border-2 border-white">
                  {user?.avatar ? (
                    <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User size={18} />
                  )}
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-xs font-bold text-slate-900 leading-none mb-1">
                    {user?.shopName || 'Seller'}
                  </p>
                  <div className="flex items-center gap-1">
                     <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                     <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Active</span>
                  </div>
                </div>
                <ChevronDown size={14} className={`text-slate-400 transition-transform duration-300 ${showUserMenu ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {showUserMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50 p-2"
                    >
                      <div className="px-4 py-3 border-b border-slate-50 mb-1">
                        <p className="text-sm font-bold text-slate-900">{user?.fullName || 'Seller Name'}</p>
                        <p className="text-[11px] text-slate-500 truncate">{user?.email || 'seller@example.com'}</p>
                      </div>
                      <Link 
                        to="/seller/profile"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors group"
                      >
                        <User size={18} className="text-slate-400 group-hover:text-seller-primary" />
                        My Profile
                      </Link>
                      <div className="h-[1px] bg-slate-100 my-1"></div>
                      <button 
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors group"
                      >
                        <LogOut size={18} className="group-hover:translate-x-1 transition-transform" />
                        Sign Out
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 lg:pb-6 custom-scrollbar bg-slate-50/50">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default SellerLayout;
