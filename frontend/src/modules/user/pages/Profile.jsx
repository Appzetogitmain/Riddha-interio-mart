import React from 'react';
import { motion } from 'framer-motion';
import {
  FiUser, FiPackage, FiMapPin, FiSettings, FiLogOut,
  FiChevronRight, FiGift, FiCopy, FiCheck, FiHeart,
  FiShield, FiPhone, FiFileText, FiAlertCircle
} from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';
import { useUser } from '../data/UserContext';
import { useWishlist } from '../data/WishlistContext';
import ProductCard from '../components/ProductCard';
import { toast } from 'react-hot-toast';

import { LuSparkles } from 'react-icons/lu';

const menuItems = [
  { icon: LuSparkles, title: 'AI Room Visualizer', subtitle: 'Upload room & see AI redesigned transformations', link: '/ai-room-visualizer', badge: 'NEW AI' },
  { icon: FiUser,    title: 'My Profile',        subtitle: 'View and edit personal information',     link: '/profile/edit' },
  { icon: FiPackage, title: 'Orders',             subtitle: 'Track, manage and reorder',              link: '/orders' },
  { icon: FiHeart,   title: 'Wishlist',           subtitle: 'Saved items and collections',            scrollTarget: 'wishlist-section' },
  { icon: FiMapPin,  title: 'Addresses',          subtitle: 'Manage delivery addresses',              link: '/addresses' },
  { icon: FiGift,    title: 'Referral & Rewards', subtitle: 'Earn credits by referring friends',      link: '/referral-rewards' },
  { icon: FiSettings,title: 'Account Settings',   subtitle: 'Privacy, security and preferences',     link: '/profile/edit' },
];

const supportLinks = [
  { title: 'Contact Support',      icon: FiPhone,      link: '/contact' },
  { title: 'Privacy Policy',       icon: FiShield,     link: '/policies/refund' },
  { title: 'Terms & Conditions',   icon: FiFileText,   link: '/terms' },
  { title: 'Cancellation Policy',  icon: FiAlertCircle,link: '/policies/cancellation' },
];

const Profile = () => {
  const navigate = useNavigate();
  const { user, logout } = useUser();
  const [copied, setCopied] = React.useState(false);

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
          <FiUser className="h-10 w-10 text-gray-200 mx-auto" />
          <p className="text-sm font-semibold text-gray-400">Please sign in to view your profile</p>
          <button
            onClick={() => navigate('/login')}
            className="px-8 py-2.5 bg-[#189D91] hover:bg-[#14847a] text-white font-bold rounded-xl transition-all text-xs"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  const initials = (user.fullName || user.name || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const memberSince = new Date(user.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-[#F8F9FB] pb-28 md:pb-12">

      {/* Profile Header */}
      <div className="bg-white border-b border-gray-100 px-4 pt-5 pb-5 md:px-8 md:pt-10 md:pb-8">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="h-16 w-16 md:h-20 md:w-20 rounded-2xl bg-[#189D91]/10 flex items-center justify-center overflow-hidden border border-[#189D91]/20">
              {user.avatar
                ? <img src={user.avatar} alt="Avatar" className="h-full w-full object-cover" />
                : <span className="text-xl font-black text-[#189D91]">{initials}</span>
              }
            </div>
            <Link to="/profile/edit" className="absolute -bottom-1 -right-1 bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
              <FiSettings className="h-3 w-3 text-[#189D91]" />
            </Link>
          </div>

          {/* Info */}
          <div className="min-w-0 flex-1">
            <h1 className="text-base md:text-xl font-black text-slate-800 truncate">
              {user.fullName || user.name || 'Account'}
            </h1>
            <p className="text-xs text-gray-400 font-medium truncate mt-0.5">{user.email}</p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="text-[9px] font-black uppercase tracking-widest bg-[#189D91]/10 text-[#189D91] px-2.5 py-1 rounded-full border border-[#189D91]/15">
                Premium Member
              </span>
              <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider">
                Since {memberSince}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 md:px-8 space-y-4 pt-4">

        {/* Main Menu */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden divide-y divide-gray-50">
          {menuItems.map((item, i) => {
            const Icon = item.icon;
            const inner = (
              <div className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50/60 transition-colors group w-full text-left">
                <div className="w-9 h-9 rounded-xl bg-[#189D91]/8 flex items-center justify-center shrink-0">
                  <Icon size={16} className="text-[#189D91]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-slate-800 group-hover:text-[#189D91] transition-colors leading-none">{item.title}</p>
                    {item.badge && (
                      <span className="px-2 py-0.5 bg-[#189D91] text-white text-[9px] font-black rounded-md uppercase tracking-wider">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-400 font-medium mt-0.5 leading-none">{item.subtitle}</p>
                </div>
                <FiChevronRight size={14} className="text-gray-300 group-hover:text-[#189D91] transition-colors shrink-0" />
              </div>
            );

            return item.link ? (
              <Link key={i} to={item.link}>{inner}</Link>
            ) : (
              <button key={i} className="w-full" onClick={() => {
                const el = document.getElementById(item.scrollTarget);
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}>{inner}</button>
            );
          })}
        </div>

        {/* Referral Card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 md:p-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="space-y-0.5">
              <p className="text-[10px] font-black text-[#189D91] uppercase tracking-widest">Referral Programme</p>
              <h3 className="text-sm font-black text-slate-800">Refer a friend, earn ₹100</h3>
              <p className="text-[10px] text-gray-400 font-medium">Your friend gets ₹50 off their first order</p>
              {(user.referralCount || 0) > 0 && (
                <p className="text-[10px] font-bold text-[#189D91] pt-1">
                  {user.referralCount} {user.referralCount === 1 ? 'friend' : 'friends'} referred
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className="px-4 py-2 bg-gray-50 rounded-xl border border-dashed border-[#189D91]/30 font-black text-slate-800 tracking-widest text-sm">
                {user.referralCode || 'PENDING'}
              </div>
              <button
                onClick={copyReferralCode}
                className="h-10 w-10 bg-[#189D91] hover:bg-[#14847a] text-white rounded-xl flex items-center justify-center transition-all active:scale-90 shadow-sm"
              >
                {copied ? <FiCheck size={15} /> : <FiCopy size={15} />}
              </button>
            </div>
          </div>
        </div>

        {/* Support Links */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden divide-y divide-gray-50">
          <p className="px-4 py-2.5 text-[9px] font-black text-gray-400 uppercase tracking-widest bg-gray-50/50">Support & Legal</p>
          {supportLinks.map((item, i) => {
            const Icon = item.icon;
            return (
              <Link
                key={i}
                to={item.link}
                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50/60 transition-colors group"
              >
                <Icon size={14} className="text-gray-400 shrink-0" />
                <span className="flex-1 text-xs font-semibold text-slate-600 group-hover:text-[#189D91] transition-colors">{item.title}</span>
                <FiChevronRight size={13} className="text-gray-300 group-hover:text-[#189D91] transition-colors" />
              </Link>
            );
          })}
        </div>

        {/* Sign Out */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-red-100 bg-white text-red-500 hover:bg-red-50 transition-all text-xs font-bold"
        >
          <FiLogOut size={14} />
          Sign Out
        </button>
      </div>

      {/* Wishlist */}
      <WishlistSection />
    </motion.div>
  );
};

const WishlistSection = () => {
  const { wishlistItems } = useWishlist();

  return (
    <div id="wishlist-section" className="max-w-3xl mx-auto px-4 md:px-8 mt-4 scroll-mt-20">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Saved Items</p>
        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">{wishlistItems.length} items</span>
      </div>

      {wishlistItems.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {wishlistItems.map((product, index) => (
            <ProductCard key={product._id || product.id} product={product} index={index} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 py-12 text-center space-y-3">
          <div className="h-12 w-12 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto">
            <FiHeart className="text-gray-300" size={20} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-700">No saved items yet</p>
            <p className="text-[10px] font-medium text-gray-400 mt-0.5">Browse products and tap the heart icon to save</p>
          </div>
          <Link to="/shop" className="inline-block text-xs font-bold text-[#189D91] hover:underline">
            Explore Products
          </Link>
        </div>
      )}
    </div>
  );
};

export default Profile;
