import React from 'react';
import { motion } from 'framer-motion';
import { FiUser, FiPackage, FiMapPin, FiSettings, FiLogOut, FiChevronRight, FiGift, FiCopy, FiCheck, FiHeart } from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';
import { useUser } from '../data/UserContext';
import { useWishlist } from '../data/WishlistContext';
import ProductCard from '../components/ProductCard';
import { toast } from 'react-hot-toast';

const Profile = () => {
  const navigate = useNavigate();
  const { user, logout } = useUser();
  const [copied, setCopied] = React.useState(false);

  const menuItems = [
    { icon: <FiUser />, title: "My Profile", subtitle: "View and edit your personal details", link: "/profile/edit" },
    { icon: <FiHeart />, title: "My Wishlist", subtitle: "Your favorite pieces saved for later", scrollTarget: "wishlist-section" },
    { icon: <FiPackage />, title: "My Orders", subtitle: "Track, return or buy things again", link: "/orders" },
    { icon: <FiMapPin />, title: "Saved Addresses", subtitle: "Edit addresses for orders", link: "/addresses" },
    { icon: <FiGift />, title: "Referral Rewards", subtitle: "Refer friends and earn credits", link: "/referral-rewards" },
    { icon: <FiSettings />, title: "Account Settings", subtitle: "Update your profile and security", link: "/profile/edit" },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const copyReferralCode = () => {
    const code = user?.referralCode || 'RIDDHA-2026';
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success('Referral code copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-4">
        <div className="text-center space-y-4">
          <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Please sign in to view your profile</p>
          <button 
            onClick={() => navigate('/login')}
            className="px-8 py-3 bg-[#189D91] hover:bg-[#14847a] text-white font-bold rounded-xl transition-all text-xs"
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="min-h-screen bg-white pb-32"
    >
      {/* Header / Profile Info */}
      <div className="bg-white border-b border-gray-100 pt-4 pb-4 md:pt-16 md:pb-12 px-4 md:px-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-4 md:gap-12">
          <div className="relative group">
            <div className="h-24 w-24 md:h-36 md:w-36 rounded-full bg-gray-50 flex items-center justify-center border-2 md:border-4 border-gray-100 overflow-hidden shadow-lg">
              {user.avatar ? (
                <img src={user.avatar} alt="Me" className="h-full w-full object-cover" />
              ) : (
                <FiUser className="h-10 w-10 md:h-20 md:w-20 text-gray-300" />
              )}
            </div>
            <Link to="/profile/edit" className="absolute bottom-1 right-1 bg-white p-2 rounded-full shadow-lg border border-gray-100 md:hidden">
               <FiSettings className="h-4 w-4 text-[#189D91]" />
            </Link>
          </div>

          <div className="text-center md:text-left space-y-0.5 md:space-y-3">
            <h1 className="text-2xl md:text-4xl font-extrabold text-slate-800 tracking-tight capitalize">
              {(user.fullName || user.name || '').toLowerCase()}
            </h1>
            <p className="text-[10px] md:text-sm text-gray-400 font-semibold tracking-wider">{user.email?.toLowerCase()}</p>
            <div className="flex flex-wrap justify-center md:justify-start gap-4 pt-2 md:pt-4">
              <span className="text-[10px] uppercase tracking-wider font-bold bg-[#189D91]/10 text-[#189D91] px-4 py-1.5 rounded-full border border-[#189D91]/10">
                Member of Riddha
              </span>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-400 pt-1.5">
                Member Since {new Date(user.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 border-t border-l border-gray-100">
          {menuItems.map((item, index) => (
            item.link ? (
              <Link 
                key={index} 
                to={item.link}
                className="group p-4 md:p-6 border-r border-b border-gray-100 hover:bg-gray-50/50 transition-all duration-300"
              >
                <div className="flex flex-row items-center gap-4 md:flex-col md:items-start md:gap-4">
                  <div className="h-8 w-8 md:h-10 md:w-10 flex items-center justify-center text-[#189D91] group-hover:scale-110 transition-transform duration-300">
                    {React.cloneElement(item.icon, { size: 20 })}
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm md:text-base font-medium text-slate-800 group-hover:text-[#189D91] transition-colors tracking-tight capitalize">
                      {item.title.toLowerCase()}
                    </h3>
                    <p className="text-gray-400 text-[9px] md:text-[10px] font-normal tracking-wider leading-relaxed capitalize">
                      {item.subtitle.toLowerCase()}
                    </p>
                  </div>
                </div>
              </Link>
            ) : (
              <button
                key={index}
                onClick={() => {
                  const element = document.getElementById(item.scrollTarget);
                  if (element) element.scrollIntoView({ behavior: 'smooth' });
                }}
                className="group p-4 md:p-6 border-r border-b border-gray-100 hover:bg-gray-50/50 transition-all duration-300 text-left w-full"
              >
                <div className="flex flex-row items-center gap-4 md:flex-col md:items-start md:gap-4">
                  <div className="h-8 w-8 md:h-10 md:w-10 flex items-center justify-center text-[#189D91] group-hover:scale-110 transition-transform duration-300">
                    {React.cloneElement(item.icon, { size: 20 })}
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm md:text-base font-medium text-slate-800 group-hover:text-[#189D91] transition-colors tracking-tight capitalize">
                      {item.title.toLowerCase()}
                    </h3>
                    <p className="text-gray-400 text-[9px] md:text-[10px] font-normal tracking-wider leading-relaxed capitalize">
                      {item.subtitle.toLowerCase()}
                    </p>
                  </div>
                </div>
              </button>
            )
          ))}
        </div>

        {/* Referral Card Section */}
        <div className="mt-8 md:mt-16">
          <div className="bg-gradient-to-r from-[#189D91]/5 to-[#189D91]/10 rounded-3xl p-6 md:p-10 border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-2 md:space-y-4 text-center md:text-left">
              <h2 className="text-xl md:text-3xl font-extrabold text-slate-800 tracking-tight">Refer a friend, get ₹100</h2>
              <p className="text-slate-500 text-xs md:text-sm font-semibold tracking-wide uppercase">Your friends get ₹50 on their first purchase</p>
              <div className="flex items-center justify-center md:justify-start gap-4 pt-2">
                <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                  <FiGift className="text-[#189D91]" />
                </div>
                <p className="text-[10px] font-bold text-[#189D91] uppercase tracking-wider">
                  {user.referralCount || 0} {user.referralCount === 1 ? 'Friend' : 'Friends'} Referred Successfully
                </p>
              </div>
            </div>
            
            <div className="bg-white p-4 md:p-6 rounded-3xl shadow-xl border border-gray-100 w-full md:w-auto">
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-3 text-center">MY REFERRAL CODE</p>
              <div className="flex items-center gap-3">
                <div className="px-6 py-3 bg-gray-50 rounded-xl border-2 border-dashed border-[#189D91]/20 font-bold text-slate-800 tracking-widest text-lg">
                  {user.referralCode || 'PENDING'}
                </div>
                <button 
                  onClick={copyReferralCode}
                  className="h-14 w-14 bg-[#189D91] hover:bg-[#14847a] text-white rounded-xl flex items-center justify-center transition-all active:scale-90 shadow-md shadow-[#189D91]/10"
                >
                  {copied ? <FiCheck className="h-6 w-6" /> : <FiCopy className="h-6 w-6" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Support Section */}
        <div className="mt-8 md:mt-16 space-y-4 md:space-y-6">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[#189D91] px-2">Support & information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border-t border-l border-gray-100">
            {[
              { title: "Contact Support", link: "/contact" },
              { title: "Privacy Policy", link: "/policies/refund" },
              { title: "Terms of Service", link: "/terms" },
              { title: "Cancellation Policy", link: "/policies/cancellation" },
            ].map((item, i) => (
              <Link 
                key={i} 
                to={item.link}
                className="flex items-center justify-between p-4 border-r border-b border-gray-100 hover:bg-gray-50/50 transition-colors group"
              >
                <span className="text-[11px] font-semibold text-slate-700 tracking-wider group-hover:text-[#189D91] transition-colors capitalize">{item.title.toLowerCase()}</span>
                <FiChevronRight className="text-gray-300 group-hover:text-[#189D91] transition-colors" />
              </Link>
            ))}
          </div>
        </div>

        {/* Logout Button */}
        <div className="mt-12 md:mt-20">
          <button 
            onClick={handleLogout}
            className="w-full md:w-auto px-16 py-4 bg-red-500 text-white font-bold rounded-xl text-xs hover:bg-red-600 transition-all duration-300 shadow-md shadow-red-500/10 flex items-center justify-center gap-3 group"
          >
            Logout 
            <FiLogOut className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Wishlist Section */}
        <WishlistSection />
      </div>
    </motion.div>
  );
};

const WishlistSection = () => {
  const { wishlistItems } = useWishlist();

  return (
    <div id="wishlist-section" className="mt-8 md:mt-24 space-y-4 md:space-y-6 scroll-mt-20">
      <div className="flex items-center justify-between px-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[#189D91]">My Saved Pieces</h2>
        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{wishlistItems.length} items</span>
      </div>

      {wishlistItems.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-6 border-t border-gray-100 pt-8">
          {wishlistItems.map((product, index) => (
            <ProductCard key={product._id || product.id} product={product} index={index} />
          ))}
        </div>
      ) : (
        <div className="bg-gray-50/50 rounded-[24px] border border-dashed border-gray-200 py-16 text-center space-y-4">
          <div className="h-14 w-14 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm">
             <FiHeart className="text-gray-300" size={22} />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-800 tracking-wide">Your wishlist is empty</h3>
            <p className="text-[10px] font-semibold text-gray-400 tracking-wider">Start saving your favorite pieces today</p>
          </div>
          <Link 
            to="/shop" 
            className="inline-block mt-3 text-xs font-bold text-[#189D91] hover:underline animate-pulse"
          >
            Explore Collection
          </Link>
        </div>
      )}
    </div>
  );
};

export default Profile;
