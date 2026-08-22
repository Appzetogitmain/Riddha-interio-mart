import React, { useState, useEffect } from 'react';
import { LuAward, LuUsers, LuStar, LuTruck, LuRotateCcw, LuFileText, LuHeadphones, LuShield, LuCheck } from 'react-icons/lu';
import { Link } from 'react-router-dom';
import api from '../../../shared/utils/api';

const ICONS = {
  LuAward, LuUsers, LuStar, LuTruck, LuRotateCcw, LuFileText, LuHeadphones, LuShield, LuCheck
};

const TrustItem = ({ iconName, title, subtitle }) => {
  const Icon = ICONS[iconName] || LuAward;
  return (
    <div className="flex items-center gap-3 px-4 first:pl-0 border-r border-gray-100 last:border-r-0">
      <div className="p-2 rounded-full bg-teal-50/50">
        <Icon className="w-5 h-5 text-[#189D91]" />
      </div>
      <div className="flex flex-col">
        <span className="text-[14px] font-black text-gray-900 leading-none">{title}</span>
        <span className="text-[11px] font-bold text-gray-500 mt-1">{subtitle}</span>
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
    <section className="py-2 bg-white overflow-hidden hidden md:block">
      <div className="max-w-[1920px] mx-auto px-4 flex gap-3">

        {/* Left Section: Trust Items */}
        <div className="flex-1 bg-teal-50/20 border border-teal-100/50 rounded-2xl p-3 flex items-center justify-between shadow-sm">
          {trustItems.map((item, idx) => (
            <TrustItem key={idx} {...item} />
          ))}
        </div>

        {/* Right Section: Help Bar */}
        <div className="bg-gradient-to-r from-[#28a399] to-[#189D91] rounded-2xl p-3 px-6 flex items-center gap-6 shadow-md border border-[#28a399]/20">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-white/10 backdrop-blur-sm">
              <LuHeadphones className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-black text-white leading-none">Need Help?</span>
              <span className="text-[11px] font-bold text-white/80 mt-1">Our experts are here for you!</span>
            </div>
          </div>
          <Link 
            to="/contact" 
            className="bg-white/10 hover:bg-white/20 text-white border border-white/30 px-5 py-2 rounded-xl text-xs font-black transition-all backdrop-blur-sm"
          >
            Contact Us
          </Link>
        </div>
      </div>
    </section>
  );
};

export default TrustBar;
