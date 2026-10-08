import React, { useState, useEffect } from 'react';
import { LuAward, LuUsers, LuStar, LuTruck, LuRotateCcw, LuFileText, LuHeadphones, LuShield, LuCheck, LuHeart } from 'react-icons/lu';
import { Link } from 'react-router-dom';
import api from '../../../shared/utils/api';

const ICONS = {
  LuAward, LuUsers, LuStar, LuTruck, LuRotateCcw, LuFileText, LuHeadphones, LuShield, LuCheck, LuHeart
};

const FEATURE_CARDS = [
  { icon: LuStar, title: "Premium Quality", subtitle: "Trusted products & brands" },
  { icon: LuShield, title: "Secure Shopping", subtitle: "Your data is safe with us" },
  { icon: LuHeadphones, title: "Expert Support", subtitle: "We're here for you" },
  { icon: LuRotateCcw, title: "Easy Returns", subtitle: "Hassle free process" },
  { icon: LuHeart, title: "Interior Inspiration", subtitle: "Ideas for every space" },
];

const TrustItem = ({ iconName, title, subtitle }) => {
  const Icon = ICONS[iconName] || LuAward;
  return (
    <div className="group flex items-center gap-3 px-3 py-1 first:pl-0 border-r border-stone-100 last:border-r-0 transition-all duration-300 hover:bg-stone-50/70 rounded-xl cursor-default">
      <div className="p-2 rounded-xl bg-[#189D91]/10 group-hover:bg-[#189D91] transition-all duration-300 shadow-2xs">
        <Icon className="w-4 h-4 text-[#189D91] group-hover:text-white transition-colors duration-300" />
      </div>
      <div className="flex flex-col">
        <span className="text-[12px] lg:text-[13px] font-black text-gray-900 leading-none group-hover:text-[#189D91] transition-colors">{title}</span>
        <span className="text-[10px] font-semibold text-gray-500 mt-1">{subtitle}</span>
      </div>
    </div>
  );
};

const TrustBar = () => {
  const [trustItems, setTrustItems] = useState([
    { iconName: 'LuAward', title: "500+", subtitle: "Top Brands" },
    { iconName: 'LuUsers', title: "1L+", subtitle: "Happy Customers" },
    { iconName: 'LuStar', title: "4.7 ★", subtitle: "Average Rating" },
    { iconName: 'LuTruck', title: "4 Hours", subtitle: "Express Delivery" },
    { iconName: 'LuRotateCcw', title: "10 Days", subtitle: "Easy Returns" },
    { iconName: 'LuFileText', title: "GST Invoice", subtitle: "For All Orders" },
  ]);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await api.get('/settings');
        if (data?.success && data?.data?.trustBarItems?.length > 0) {
          setTrustItems(data.data.trustBarItems);
        }
      } catch (error) {
        console.error("Failed to load trust bar items", error);
      }
    };
    fetchSettings();
  }, []);

  return (
    <section
      className="py-8 md:py-14 border-t my-0"
      style={{
        background: 'linear-gradient(180deg, #DCF5F0 0%, #E6F9F5 50%, #D5F2EC 100%)',
        borderColor: '#AEE4DA',
      }}
    >
      <div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-12">

        {/* Section Heading matching Reference Image 1 */}
        <div className="mb-6 md:mb-8 text-center md:text-left">
          <h2 className="text-xl md:text-2xl lg:text-3xl font-black text-gray-900 tracking-tight">
            Why Shop With <span className="text-[#189D91]">Riddha</span>
          </h2>
        </div>

        {/* 5 Feature Cards matching Image 1 */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4 mb-6">
          {FEATURE_CARDS.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div
                key={idx}
                className="bg-white/95 rounded-2xl p-4 md:p-5 border border-[#D1EFE8] shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col items-center text-center group"
              >
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-[#189D91]/10 flex items-center justify-center mb-3 group-hover:bg-[#189D91] transition-colors">
                  <Icon className="w-5 h-5 md:w-6 md:h-6 text-[#189D91] group-hover:text-white transition-colors" />
                </div>
                <h4 className="text-xs md:text-sm font-black text-slate-900 mb-1 leading-snug">
                  {card.title}
                </h4>
                <p className="text-[10px] md:text-xs text-gray-500 font-medium leading-tight">
                  {card.subtitle}
                </p>
              </div>
            );
          })}
        </div>

        {/* Bottom Trust Metrics & Need Help Bar */}
        <div className="flex flex-col lg:flex-row gap-3 pt-2">
          {/* Trust Items Strip */}
          <div className="flex-1 bg-white/90 border border-[#D1EFE8] rounded-2xl p-3 px-4 flex flex-wrap md:flex-nowrap items-center justify-between gap-2 shadow-2xs">
            {trustItems.map((item, idx) => (
              <TrustItem key={idx} {...item} />
            ))}
          </div>

          {/* Right Help Bar */}
          <div className="bg-gradient-to-r from-[#189D91] via-[#127F75] to-[#0F172A] rounded-2xl p-3 px-5 flex items-center justify-between gap-4 shadow-md border border-[#189D91]/30 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-white/15 backdrop-blur-sm relative">
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-[#127F75] animate-pulse" />
                <LuHeadphones className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs md:text-sm font-black text-white leading-none">Need Help?</span>
                  <span className="px-1.5 py-0.2 bg-emerald-400/20 text-emerald-200 text-[8px] font-bold rounded-full uppercase tracking-wider">Live</span>
                </div>
                <span className="text-[10px] md:text-[11px] font-medium text-white/90 mt-0.5">Interior experts available</span>
              </div>
            </div>
            <Link 
              to="/contact" 
              className="bg-white/15 hover:bg-white text-white hover:text-slate-900 border border-white/40 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all duration-300 backdrop-blur-sm shadow-2xs hover:scale-105 active:scale-95 whitespace-nowrap"
            >
              Contact Us
            </Link>
          </div>
        </div>

      </div>
    </section>
  );
};

export default TrustBar;
