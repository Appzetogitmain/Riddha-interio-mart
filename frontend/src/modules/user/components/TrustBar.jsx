import React, { useState, useEffect } from 'react';
import { LuAward, LuUsers, LuStar, LuTruck, LuRotateCcw, LuFileText, LuHeadphones, LuShield, LuCheck, LuHeart } from 'react-icons/lu';
import { Link } from 'react-router-dom';
import api from '../../../shared/utils/api';

const ICONS = {
  LuAward, LuUsers, LuStar, LuTruck, LuRotateCcw, LuFileText, LuHeadphones, LuShield, LuCheck, LuHeart
};

const DEFAULT_CARDS = [
  { iconName: 'LuStar', title: 'Premium Quality', subtitle: 'Trusted products & brands' },
  { iconName: 'LuShield', title: 'Secure Shopping', subtitle: "Your data is safe with us" },
  { iconName: 'LuHeadphones', title: 'Expert Support', subtitle: "We're here for you" },
  { iconName: 'LuRotateCcw', title: 'Easy Returns', subtitle: 'Hassle free process' },
  { iconName: 'LuHeart', title: 'Interior Inspiration', subtitle: 'Ideas for every space' },
];

const DEFAULT_HEADING = { title: 'Why Shop With', highlight: 'Riddha' };

const DEFAULT_HELP = {
  enabled: true,
  title: 'Need Help?',
  liveLabel: 'Live',
  subtitle: 'Interior experts available',
  buttonText: 'Contact Us',
  buttonLink: '/contact',
};

const TrustItem = ({ iconName, title, subtitle }) => {
  const Icon = ICONS[iconName] || LuAward;
  return (
    <div className="group flex items-center gap-3 px-4 py-1 first:pl-1 lg:border-r border-[#189D91]/15 last:border-r-0 transition-all duration-300 cursor-default">
      <Icon className="w-8 h-8 shrink-0 text-[#189D91] stroke-[1.5] group-hover:scale-110 transition-transform duration-300" />
      <div className="flex flex-col">
        <span className="text-sm lg:text-base font-semibold text-gray-900 leading-tight group-hover:text-[#189D91] transition-colors">{title}</span>
        <span className="text-xs lg:text-[13px] font-medium text-gray-500 mt-0.5 leading-tight">{subtitle}</span>
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

  const [cards, setCards] = useState(DEFAULT_CARDS);
  const [heading, setHeading] = useState(DEFAULT_HEADING);
  const [help, setHelp] = useState(DEFAULT_HELP);
  const [subheading, setSubheading] = useState('A seamless shopping experience with trusted quality, great value and customer-first support.');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await api.get('/settings');
        if (data?.success && data?.data?.trustBarSubheading) {
          setSubheading(data.data.trustBarSubheading);
        }
        if (data?.success && data?.data?.trustBarCards?.length > 0) {
          setCards(data.data.trustBarCards);
        }
        if (data?.success && data?.data?.trustBarHeading) {
          setHeading({ ...DEFAULT_HEADING, ...data.data.trustBarHeading });
        }
        if (data?.success && data?.data?.trustBarHelp) {
          setHelp({ ...DEFAULT_HELP, ...data.data.trustBarHelp });
        }
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
      className="relative overflow-hidden py-6 md:py-9 border-t my-0"
      style={{
        background: 'linear-gradient(135deg, #F4FBF9 0%, #E4F6F1 55%, #D5F0E9 100%)',
        borderColor: '#CBEBE2',
      }}
    >
      {/* soft decorative glows */}
      <div className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full bg-[#189D91]/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-24 w-96 h-96 rounded-full bg-white/70 blur-3xl" />

      <div className="relative max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-12">

        <div className="mb-4 md:mb-5 text-center md:text-left">
          <h2 className="font-serif text-2xl md:text-3xl lg:text-4xl font-bold text-[#0F1B2D] tracking-tight">
            {heading.title} {heading.highlight && <span className="text-[#189D91]">{heading.highlight}</span>}
          </h2>
          {subheading && (
            <p className="mt-1.5 text-sm md:text-base text-gray-600 font-medium max-w-2xl">{subheading}</p>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4 mb-3 md:mb-4">
          {cards.map((card, idx) => {
            const Icon = ICONS[card.iconName] || LuStar;
            return (
              <div
                key={idx}
                className="relative overflow-hidden bg-white rounded-[22px] p-4 md:p-5 min-h-[150px] md:min-h-[170px] border border-white shadow-[0_8px_30px_rgba(24,157,145,0.10)] hover:shadow-[0_14px_40px_rgba(24,157,145,0.18)] hover:-translate-y-1 transition-all duration-300 flex flex-col items-start text-left group"
              >
                {/* mint corner swoosh: anchored to the top edge, sweeping down to the right edge */}
                <svg
                  className="absolute top-0 right-0 w-full h-[48%] pointer-events-none"
                  viewBox="0 0 100 50"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <defs>
                    <linearGradient id={`swoosh-${idx}`} x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#E4F5F0" />
                      <stop offset="100%" stopColor="#D3EEE6" />
                    </linearGradient>
                  </defs>
                  <path d="M36 0 C 46 6, 52 24, 100 28 L100 0 Z" fill={`url(#swoosh-${idx})`} />
                </svg>
                <Icon className="relative w-10 h-10 md:w-12 md:h-12 text-[#189D91] stroke-[1.5] mb-5 md:mb-6 group-hover:scale-110 transition-transform duration-300" />
                <h4 className="relative font-sans text-sm md:text-xl font-bold text-[#0F1B2D] mb-1.5 leading-snug">
                  {card.title}
                </h4>
                <p className="relative text-xs md:text-base text-gray-500 font-medium leading-snug">
                  {card.subtitle}
                </p>
              </div>
            );
          })}
        </div>

        <div className="flex flex-col lg:flex-row gap-3 md:gap-4">
          <div className="flex-1 bg-white rounded-[22px] p-3 px-4 md:px-6 md:py-4 flex flex-wrap lg:flex-nowrap items-center justify-between gap-y-3 shadow-[0_8px_30px_rgba(24,157,145,0.08)] border border-white">
            {trustItems.map((item, idx) => (
              <TrustItem key={idx} {...item} />
            ))}
          </div>

          {help.enabled !== false && (
          <div className="bg-gradient-to-r from-[#189D91] via-[#127F75] to-[#0F172A] rounded-[22px] p-3 px-5 md:py-4 flex items-center justify-between gap-4 shadow-[0_10px_30px_rgba(15,23,42,0.25)] hover:shadow-[0_14px_36px_rgba(15,23,42,0.3)] transition-shadow">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-white/15 backdrop-blur-sm relative">
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-[#127F75] animate-pulse" />
                <LuHeadphones className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm md:text-base font-bold text-white leading-none">{help.title}</span>
                  {help.liveLabel && <span className="px-1.5 py-0.5 bg-emerald-400/20 text-emerald-200 text-[8px] font-bold rounded-full uppercase tracking-wider">{help.liveLabel}</span>}
                </div>
                <span className="text-[10px] md:text-[11px] font-medium text-white/90 mt-1">{help.subtitle}</span>
              </div>
            </div>
            <Link
              to={help.buttonLink || '/contact'}
              className="bg-white/10 hover:bg-white text-white hover:text-slate-900 border border-white/40 px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-300 backdrop-blur-sm hover:scale-105 active:scale-95 whitespace-nowrap"
            >
              {help.buttonText}
            </Link>
          </div>
          )}
        </div>

      </div>
    </section>
  );
};

export default TrustBar;
