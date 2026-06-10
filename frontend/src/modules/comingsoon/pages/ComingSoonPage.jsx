import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
  LuInstagram,
  LuFacebook,
  LuYoutube,
  LuSmartphone,
  LuSend,
  LuCalendar,
} from "react-icons/lu";
import {
  FiHome,
  FiGrid,
  FiShoppingCart,
  FiUser,
  FiSearch,
  FiStar,
  FiBox,
  FiLayers,
  FiCheck,
  FiMail,
  FiPhone,
  FiMapPin,
  FiMenu,
  FiX,
  FiChevronRight,
  FiChevronDown,
  FiAward,
  FiZap,
  FiTool,
  FiArrowRight,
  FiSmartphone,
  FiTarget,
  FiEye,
  FiTruck,
  FiTag,
  FiSend,
  FiCheckCircle,
  FiBell,
} from "react-icons/fi";
import ComingSoonHeader from "../components/ComingSoonHeader";
import Logo from "../../../assets/WhatsApp Image 2026-05-06 at 3.50.08 PM.jpeg";
import FurnitureImg from "../../../assets/furniture.jpg";
import Furniture2Img from "../../../assets/furniture2.jpg";
import LightingImg from "../../../assets/lighting.jpg";
import PaintsImg from "../../../assets/paints.jpg";
import AppliancesImg from "../../../assets/appliances.jpg";
import BathroomImg from "../../../assets/bathroom.jpg";
import Showcase1 from "../../../assets/showcase_1.png";
import Showcase2 from "../../../assets/showcase_2.png";
import Showcase3 from "../../../assets/showcase_3.png";
import Showcase4 from "../../../assets/showcase_4.png";
import Showcase5 from "../../../assets/showcase_5.png";
import Showcase6 from "../../../assets/showcase_6.png";
import Showcase7 from "../../../assets/showcase_7.png";
import Showcase8 from "../../../assets/showcase_8.png";
import AboutShowroom from "../../../assets/about_showroom.png";
import AboutDetail from "../../../assets/about_detail.png";
import HeroMain from "../../../assets/hero_main.png";

const ComingSoonPage = () => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Set target date dynamically to 23 days from now to match the user image's "23 days" countdown perfectly
  const [timeLeft, setTimeLeft] = useState({
    days: 23,
    hours: 14,
    minutes: 35,
    seconds: 48,
  });

  // Countdown Logic (Dynamic ticking based on target date)
  useEffect(() => {
    // Set target date to exactly 23 days, 14 hours, 35 mins, 48 secs from now
    const targetDate =
      new Date().getTime() +
      23 * 24 * 60 * 60 * 1000 +
      14 * 60 * 60 * 1000 +
      35 * 60 * 1000 +
      48 * 1000;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate - now;

      if (distance < 0) {
        clearInterval(interval);
        return;
      }

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor(
          (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
        ),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email || !email.includes("@")) return;

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubscribed(true);
      setEmail("");
    }, 1500);
  };

  const handleContactSubmit = (e) => {
    e.preventDefault();
    setIsSubmitted(true);
    setTimeout(() => setIsSubmitted(false), 5000);
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-slate-900 overflow-x-hidden flex flex-col font-sans selection:bg-teal-500/30">
      {/* --- SHARED HEADER --- */}
      <ComingSoonHeader />

      {/* --- MAIN HERO SECTION (SUPER COMPACT LAYOUT FOR ELEVATION) --- */}
      <main className="flex-grow relative pt-2 pb-8 lg:pt-3 overflow-hidden bg-gradient-to-b from-[#FAF6EE] to-white">
        {/* Soft Background Decor Blurs */}
        <div className="absolute top-1/4 left-0 w-80 h-80 bg-purple-200/30 blur-[100px] rounded-full pointer-events-none -z-10"></div>
        <div className="absolute bottom-1/4 right-0 w-[500px] h-[500px] bg-teal-100/20 blur-[130px] rounded-full pointer-events-none -z-10"></div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 flex flex-col lg:flex-row items-center justify-between gap-6">
          {/* LEFT COLUMN: BRANDING, HEADINGS, WE ARE COMING SOON BANNER & TIMER CARD */}
          <div className="flex-1 space-y-3 flex flex-col items-center lg:items-start text-center lg:text-left">
            {/* Official Logo Banner - Super Crisp Size */}
            <div className="flex flex-col items-center lg:items-start bg-[#FAF6EE] rounded-3xl p-1.5 mix-blend-multiply">
              <img
                src={Logo}
                alt="Riddha Interior Mart Logo"
                className="h-20 md:h-26 w-auto object-contain mix-blend-multiply"
              />
            </div>

            {/* Main Destination Heading - Styled smaller & more compact */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 justify-center lg:justify-start">
                <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.25em] text-slate-700">
                  YOUR ONE-STOP DESTINATION FOR
                </p>
                <span className="text-sm select-none">✨</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-black leading-[0.9] tracking-tighter drop-shadow-sm">
                <span className="block text-[#189D91]">ALL INTERIOR</span>
                <span className="block text-[#D12C8D]">SOLUTIONS</span>
              </h1>

              {/* Horizontal Single Line Features Row */}
              <div className="flex flex-wrap justify-center lg:justify-start items-center gap-x-2 text-[9px] md:text-[10px] font-black text-slate-600 uppercase tracking-widest pt-1">
                <span>WIDE RANGE</span>
                <span className="text-[#D12C8D] font-black">•</span>
                <span>BEST QUALITY</span>
                <span className="text-[#D12C8D] font-black">•</span>
                <span>EXCLUSIVE DEALS</span>
                <span className="text-[#D12C8D] font-black">•</span>
                <span>FAST DELIVERY</span>
              </div>
            </div>

            {/* WE ARE COMING SOON Gradient Rounded Pill - Compact size */}
            <div className="bg-gradient-to-r from-[#189D91] via-[#8E2D8E] to-[#D12C8D] text-white px-8 py-2.5 rounded-full font-black uppercase tracking-[0.2em] text-[10px] md:text-xs shadow-xl shadow-indigo-900/10">
              WE ARE COMING SOON!
            </div>

            {/* Launching Info Section - Tighter margins */}
            <div className="space-y-1.5 w-full flex flex-col items-center lg:items-start">
              <div className="flex items-center gap-3">
                <span className="h-[1px] w-6 bg-slate-200"></span>
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
                  LAUNCHING ON
                </span>
                <span className="h-[1px] w-6 bg-slate-200"></span>
              </div>
              <div className="flex items-center gap-2 text-[#311B92]">
                <LuCalendar size={24} className="text-[#D12C8D]" />
                <p className="text-xl md:text-3xl font-black uppercase tracking-tight">
                  15<sup>TH</sup> JUNE 2025
                </p>
              </div>
            </div>

            {/* Premium Countdown Timer Card (Custom Glassmorphism Pill) - Super Slim and Neat */}
            <div className="bg-white/95 backdrop-blur-md rounded-[1.5rem] py-2.5 px-5 shadow-[0_12px_30px_rgba(49,27,146,0.04)] border border-slate-100/70 flex items-center justify-around w-full max-w-sm">
              <div className="flex flex-col items-center">
                <span className="text-2xl md:text-4xl font-black text-[#189D91] tracking-tight">
                  {String(timeLeft.days).padStart(2, "0")}
                </span>
                <span className="text-[7px] md:text-[8px] font-black uppercase tracking-widest text-slate-400 mt-0.5">
                  DAYS
                </span>
              </div>
              <span className="text-xl md:text-2xl font-black text-slate-300 -translate-y-1.5 select-none">
                :
              </span>
              <div className="flex flex-col items-center">
                <span className="text-2xl md:text-4xl font-black text-[#D12C8D] tracking-tight">
                  {String(timeLeft.hours).padStart(2, "0")}
                </span>
                <span className="text-[7px] md:text-[8px] font-black uppercase tracking-widest text-slate-400 mt-0.5">
                  HOURS
                </span>
              </div>
              <span className="text-xl md:text-2xl font-black text-slate-300 -translate-y-1.5 select-none">
                :
              </span>
              <div className="flex flex-col items-center">
                <span className="text-2xl md:text-4xl font-black text-[#311B92] tracking-tight">
                  {String(timeLeft.minutes).padStart(2, "0")}
                </span>
                <span className="text-[7px] md:text-[8px] font-black uppercase tracking-widest text-slate-400 mt-0.5">
                  MINUTES
                </span>
              </div>
              <span className="text-xl md:text-2xl font-black text-slate-300 -translate-y-1.5 select-none">
                :
              </span>
              <div className="flex flex-col items-center">
                <span className="text-2xl md:text-4xl font-black text-[#311B92] tracking-tight">
                  {String(timeLeft.seconds).padStart(2, "0")}
                </span>
                <span className="text-[7px] md:text-[8px] font-black uppercase tracking-widest text-slate-400 mt-0.5">
                  SECONDS
                </span>
              </div>
            </div>

            {/* Notification Subscription Block - Tighter Spacing */}
            <div className="w-full max-w-sm space-y-2.5">
              <div className="flex items-center gap-2 text-[9px] md:text-[10px] font-bold text-slate-500 justify-center lg:justify-start">
                <FiBell className="text-[#D12C8D] animate-bounce" size={14} />
                <span>
                  Be the first to know about launch updates, offers & more!
                </span>
              </div>

              <form
                onSubmit={handleSubscribe}
                className="bg-white p-1 rounded-full border border-slate-100 shadow-xl shadow-slate-200/50 flex items-center"
              >
                <div className="flex items-center gap-3 pl-4 flex-grow">
                  <FiMail className="text-slate-300" size={16} />
                  <input
                    type="email"
                    placeholder="Enter your email address"
                    className="w-full bg-transparent border-none outline-none text-[11px] md:text-xs font-bold text-slate-700 placeholder:text-slate-300"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="bg-gradient-to-r from-[#189D91] to-[#311B92] text-white px-5 md:px-6 py-2.5 rounded-full font-black uppercase tracking-widest text-[9px] flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-md"
                >
                  NOTIFY ME <FiSend />
                </button>
              </form>
            </div>
          </div>

          {/* CENTER COLUMN: HIGH-FIDELITY SMARTPHONE MOCKUP ON A NEON CYLINDRICAL PEDESTAL */}
          <div className="flex-1 relative min-h-[550px] flex flex-col items-center justify-center lg:translate-x-24">
            {/* Tilted iPhone Smartphone Mockup Container - Slightly scaled down */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="relative w-[240px] md:w-[260px] h-[480px] md:h-[530px] bg-slate-950 rounded-[3rem] border-[8px] md:border-[10px] border-slate-900 flex flex-col overflow-hidden z-10"
              style={{
                transform:
                  "perspective(1200px) rotateX(8deg) rotateY(20deg) rotateZ(-12deg)",
                transformStyle: "preserve-3d",
                boxShadow:
                  "0 40px 80px -20px rgba(49, 27, 146, 0.4), inset 0 0 0 2px rgba(255, 255, 255, 0.15), 0 0 0 4px #475569",
              }}
            >
              {/* Glossy Screen Glare Reflection Overlay */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/15 pointer-events-none z-40" />

              {/* Dynamic Island */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 md:w-24 h-5 md:h-6 bg-slate-950 rounded-full z-50 flex items-center justify-center">
                <div className="w-1 h-1 rounded-full bg-white/10 ml-auto mr-3" />
              </div>

              {/* Tilted Screen Main Body */}
              <div className="flex-1 bg-[#FAFAFA] overflow-y-auto no-scrollbar relative flex flex-col">
                {/* Smartphone Custom Header */}
                <div className="bg-[#189D91] pt-10 pb-4 px-4 space-y-3">
                  <div className="flex items-center justify-between text-white">
                    <span className="text-[10px] font-black tracking-tight">
                      Riddha Interior Mart
                    </span>
                    <div className="flex gap-2">
                      <FiUser size={12} />
                      <FiShoppingCart size={12} />
                      <FiMenu size={12} />
                    </div>
                  </div>
                  <div className="bg-white rounded-lg flex items-center px-3 py-1.5 shadow-sm">
                    <FiSearch className="text-slate-300 mr-2" size={10} />
                    <span className="text-[9px] font-bold text-slate-300">
                      Search products or brands...
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-white/90">
                    <FiMapPin size={8} />
                    <span className="text-[8px] font-bold">
                      Delivery in <span className="text-teal-100">4 hours</span>
                    </span>
                    <FiChevronDown size={8} className="ml-auto" />
                  </div>
                </div>

                {/* Smartphone Screen Core Content */}
                <div className="flex-1 p-3 space-y-4">
                  {/* High Fidelity Banner card */}
                  <div className="bg-white rounded-xl overflow-hidden border border-slate-100 shadow-sm flex flex-col">
                    <div className="p-3 bg-gradient-to-r from-teal-50 to-white flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-[6px] font-black text-[#D12C8D] uppercase tracking-widest">
                          PREMIUM SELECTION:
                        </span>
                        <h4 className="text-[10px] font-black text-slate-800 leading-tight">
                          INTERIOR OFFERS
                        </h4>
                        <p className="text-[7px] font-bold text-slate-400">
                          Curated by Experts
                        </p>
                      </div>
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-100 border border-slate-100">
                        <img
                          src="https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=100&q=80"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Circular Categories matching the exact reference icon circles */}
                  <div className="flex justify-between px-1 overflow-x-auto hide-scrollbar gap-2 shrink-0">
                    <SmartphoneCategoryIcon
                      icon={<FiBox />}
                      label="Furniture"
                      color="border-[#189D91] text-[#189D91]"
                    />
                    <SmartphoneCategoryIcon
                      icon={<FiZap />}
                      label="Lighting"
                      color="border-[#D12C8D] text-[#D12C8D]"
                    />
                    <SmartphoneCategoryIcon
                      icon={<FiLayers />}
                      label="Wall Panels"
                      color="border-[#311B92] text-[#311B92]"
                    />
                    <SmartphoneCategoryIcon
                      icon={<FiGrid />}
                      label="Decor"
                      color="border-[#D12C8D] text-[#D12C8D]"
                    />
                    <SmartphoneCategoryIcon
                      icon={<FiTool />}
                      label="Hardware"
                      color="border-[#189D91] text-[#189D91]"
                    />
                    <SmartphoneCategoryIcon
                      icon={<FiLayers />}
                      label="Flooring"
                      color="border-[#E0A96D] text-[#E0A96D]"
                    />
                  </div>

                  {/* Designer Favorites Product Teasers */}
                  <div className="space-y-3">
                    <div className="space-y-0.5">
                      <h4 className="text-[10px] font-black text-slate-800">
                        Designer Favorites
                      </h4>
                      <p className="text-[7px] font-bold text-slate-400">
                        Curated collections by top designers.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <SmartphoneProductCard
                        name="Tuak Master Bed"
                        price="₹34,999"
                        rating="4.7"
                        img={Furniture2Img}
                      />
                      <SmartphoneProductCard
                        name="Veneer Wall Panel (Modern)"
                        price="₹3,500/sq.ft"
                        rating="4.9"
                        img="https://images.unsplash.com/photo-1615529182904-14819c35db37?w=200&q=80"
                      />
                      <SmartphoneProductCard
                        name="Artisan Dining Set"
                        price="₹21,099"
                        rating="4.8"
                        img={FurnitureImg}
                      />
                      <SmartphoneProductCard
                        name="Designer Bed"
                        price="₹29,999"
                        rating="4.6"
                        img="https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=200&q=80"
                      />
                    </div>
                  </div>
                </div>

                {/* Smartphone Sticky Footer Tab Navigation */}
                <div className="bg-white border-t border-slate-50 flex items-center justify-between px-6 py-2 pb-4 shrink-0">
                  <div className="flex flex-col items-center text-[#189D91]">
                    <FiHome size={14} />
                    <span className="text-[6px] font-bold mt-1 uppercase">
                      HOME
                    </span>
                  </div>
                  <div className="flex flex-col items-center text-slate-400">
                    <FiGrid size={14} />
                    <span className="text-[6px] font-bold mt-1 uppercase">
                      CATEGORIES
                    </span>
                  </div>
                  <div className="flex flex-col items-center text-slate-400">
                    <FiShoppingCart size={14} />
                    <span className="text-[6px] font-bold mt-1 uppercase">
                      CART
                    </span>
                  </div>
                  <div className="flex flex-col items-center text-slate-400">
                    <FiUser size={14} />
                    <span className="text-[6px] font-bold mt-1 uppercase">
                      PROFILE
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Glowing Cylindrical 3D Pedestal Base Under the Smartphone */}
            <div className="absolute bottom-6 w-48 h-10 bg-gradient-to-r from-purple-800 via-[#311B92] to-indigo-900 rounded-full shadow-[0_12px_30px_rgba(49,27,146,0.3)] z-0 border-t border-purple-500/20"></div>
            <div className="absolute bottom-2 w-40 h-8 bg-gradient-to-r from-purple-950 via-indigo-950 to-purple-950 rounded-full shadow-2xl z-0"></div>
          </div>

          {/* RIGHT COLUMN: VERTICAL FEATURE BADGES WITH COMPACT SPACING */}
          <div className="flex-1 w-full max-w-md relative flex flex-col justify-center items-start lg:pl-16">
            {/* Vertical Cards Wrapper with Beautiful Curved Dashed Line */}
            <div className="relative w-full flex flex-col gap-6 py-6 pl-4 lg:pl-0">
              {/* Connection Curved SVG Dashed Line */}
              <svg
                className="absolute left-4 lg:left-0 top-0 w-36 h-[290px] pointer-events-none z-0 overflow-visible"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M 36 28 C 76 50, 76 90, 76 112 C 76 134, 48 174, 48 196 C 48 218, 24 258, 24 280"
                  stroke="#94A3B8"
                  strokeWidth="2.5"
                  strokeDasharray="6 6"
                />
              </svg>

              {/* Vertical Feature Item Lists with X-offsets perfectly matching the curve centers */}
              <RightVerticalFeature
                icon={<FiShoppingCart />}
                text="WIDE RANGE"
                subtext="of Products"
                color="bg-[#D12C8D]"
                style={{ transform: "translateX(12px)" }}
              />
              <RightVerticalFeature
                icon={<FiAward />}
                text="BEST QUALITY"
                subtext="Assured"
                color="bg-[#189D91]"
                style={{ transform: "translateX(52px)" }}
              />
              <RightVerticalFeature
                icon={<FiTag />}
                text="EXCLUSIVE"
                subtext="Deals"
                color="bg-[#311B92]"
                style={{ transform: "translateX(24px)" }}
              />
              <RightVerticalFeature
                icon={<FiTruck />}
                text="FAST & RELIABLE"
                subtext="Delivery"
                color="bg-[#E0A96D]"
                style={{ transform: "translateX(0px)" }}
              />
            </div>

            {/* Floating Purple Emerging Logo Box Container */}
            <div className="mt-6 flex flex-col items-start lg:items-start gap-4 w-full pl-6 lg:pl-6">
              {/* Rocket emerge badge */}
              <div className="bg-white/90 backdrop-blur-md px-5 py-2.5 rounded-full border border-slate-100 shadow-[0_10px_30px_rgba(209,44,141,0.06)] flex items-center gap-2.5 hover:scale-105 transition-transform duration-300">
                <span className="text-[#D12C8D] text-xs animate-pulse">🚀</span>
                <span className="text-[9px] font-black uppercase tracking-wider text-slate-800">
                  BIG THINGS{" "}
                  <span className="text-[#D12C8D]">ARE ON THE WAY!</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* --- INTERIOR SHOWCASE SECTION (SEAMLESS INFINITE SCROLL CAROUSEL) --- */}
      <section className="bg-[#FAF5EC] py-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 mb-20 flex flex-col items-center text-center">
          <h3 className="text-xs font-black uppercase tracking-[0.4em] text-[#311B92]/40 mb-4 text-center">
            Curated Inspiration
          </h3>
          <h2 className="text-2xl md:text-5xl font-black text-[#311B92]">
            Transforming Visions into Reality
          </h2>
        </div>

        {/* Infinite Scrolling Carousel (Seamless Right-to-Left) */}
        <div className="relative flex overflow-hidden py-12">
          <motion.div
            className="flex gap-6 md:gap-10 px-4 whitespace-nowrap"
            animate={{ x: [0, "-50%"] }}
            transition={{
              duration: 30,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            {[
              Showcase1,
              Showcase2,
              Showcase3,
              Showcase4,
              Showcase5,
              Showcase6,
              Showcase7,
              Showcase8,
              Showcase1,
              Showcase2,
              Showcase3,
              Showcase4,
              Showcase5,
              Showcase6,
              Showcase7,
              Showcase8,
            ].map((img, idx) => (
              <ShowcaseCard key={idx} img={img} />
            ))}
          </motion.div>
        </div>
      </section>

      {/* --- WHO WE ARE (CLEAN OVERLAPPING LAYOUT) --- */}
      <section className="py-14 bg-white overflow-hidden">
        <div className="max-w-6xl mx-auto px-8 flex flex-col lg:flex-row items-center gap-10 lg:gap-14">
          {/* Left Side: Overlapping Images */}
          <div className="w-full lg:w-1/2 relative min-h-[380px] flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="w-full h-full relative z-10 rounded-[2rem] overflow-hidden shadow-2xl border border-slate-100"
            >
              <img
                src={AboutShowroom}
                alt="Showroom"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 left-4 px-3 py-1 bg-white/20 backdrop-blur-md border border-white/30 rounded-full text-[9px] font-black text-white uppercase tracking-[0.3em]">
                About Riddha // 01
              </div>
            </motion.div>

            <motion.div
              initial={{ x: -20, y: 20, opacity: 0 }}
              whileInView={{ x: 0, y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="absolute -bottom-6 -left-6 w-48 h-60 z-20 rounded-2xl overflow-hidden shadow-2xl border-[6px] border-white"
            >
              <img
                src={AboutDetail}
                alt="Detail"
                className="w-full h-full object-cover"
              />
            </motion.div>
          </div>

          {/* Right Side: Editorial Content */}
          <div className="w-full lg:w-1/2 space-y-5">
            <div className="space-y-3">
              <h4 className="text-[10px] md:text-xs font-black uppercase tracking-[0.5em] text-[#189D91]">
                The Riddha Legacy
              </h4>
              <h2 className="text-3xl md:text-5xl font-black text-[#311B92] leading-[1.1] tracking-tighter">
                Creating A <br />{" "}
                <span className="text-[#189D91]">Legacy.</span>
              </h2>
            </div>
            <p className="text-sm md:text-base text-slate-500 leading-relaxed font-medium">
              We specialize in elevating your living spaces into a visual
              narrative that stands out. Our approach blends technical precision
              with raw emotional depth, bringing you the finest interior
              products from across the globe.
            </p>
            <div className="pt-2">
              <button className="px-8 py-3.5 bg-[#311B92] text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-indigo-900/10 hover:scale-105 transition-all active:scale-95">
                Inquire Now
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* --- MISSION & VISION --- */}
      <section className="py-14 bg-[#FAF6EE]/40 border-y border-slate-100/50 relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <MissionCard
            icon={<FiTarget size={24} />}
            title="Our Mission"
            text="To revolutionize the interior supply industry in India by providing high-quality, designer-curated products with transparent pricing and exceptional service."
            color="from-[#189D91]/12 via-[#189D91]/4 to-transparent"
            iconColor="text-[#189D91]"
            borderColor="border-[#189D91]/20"
          />
          <MissionCard
            icon={<FiEye size={24} />}
            title="Our Vision"
            text="To become the most trusted digital hub for interior solutions, where innovation meets elegance, making premium home styling accessible to every household."
            color="from-[#311B92]/12 via-[#311B92]/4 to-transparent"
            iconColor="text-[#311B92]"
            borderColor="border-[#311B92]/20"
          />
          <MissionCard
            icon={<FiAward size={24} />}
            title="Our Values"
            text="Uncompromising integrity, design innovation, and customer-first obsession in everything we touch."
            color="from-[#D12C8D]/12 via-[#D12C8D]/4 to-transparent"
            iconColor="text-[#D12C8D]"
            borderColor="border-[#D12C8D]/20"
          />
        </div>
      </section>

      {/* --- WHY CHOOSE US (CLEAN VERSION) --- */}
      <section className="py-24 bg-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#189D91]/5 blur-[150px] rounded-full"></div>

        <div className="max-w-7xl mx-auto px-8 relative z-10">
          <div className="text-center space-y-4 mb-20">
            <h4 className="text-xs font-black uppercase tracking-[0.5em] text-[#189D91]">
              The Riddha Edge
            </h4>
            <h2 className="text-4xl md:text-6xl font-black text-[#311B92]">
              Why Choose Us?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureItem
              icon={<FiBox />}
              title="Wide Range"
              text="Thousands of products across 20+ categories."
            />
            <FeatureItem
              icon={<FiAward />}
              title="Premium Quality"
              text="Each item is hand-picked and quality-checked."
            />
            <FeatureItem
              icon={<FiTag />}
              title="Affordable Pricing"
              text="Designer looks without the designer price tag."
            />
            <FeatureItem
              icon={<FiTruck />}
              title="Fast Delivery"
              text="Reliable shipping across all major Indian cities."
            />
          </div>
        </div>
      </section>

      {/* --- CONTACT SECTION --- */}
      <section id="contact" className="py-24 bg-white relative overflow-hidden">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#189D91]/5 blur-[120px] rounded-full"></div>
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center space-y-4 mb-20">
            <h4 className="text-xs font-black uppercase tracking-[0.5em] text-[#189D91]">
              Let's Connect
            </h4>
            <h2 className="text-4xl md:text-6xl font-black text-[#311B92]">
              Get In <span className="text-[#D12C8D]">Touch</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
            <div className="space-y-12">
              <ContactInfoCard
                icon={<FiMapPin />}
                title="Our Office"
                text="123 Interior Hub, Mumbai, Maharashtra 400001"
                link="https://maps.google.com"
              />
              <ContactInfoCard
                icon={<FiPhone />}
                title="Call Us"
                text="+91 98765 43210"
                link="tel:+919876543210"
              />
              <ContactInfoCard
                icon={<FiMail />}
                title="Email Us"
                text="info@riddhainterio.com"
                link="mailto:info@riddhainterio.com"
              />

              <div className="pt-8 border-t border-slate-100">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">
                  Stay Connected
                </h4>
                <div className="flex gap-4">
                  <SocialLink icon={<LuInstagram />} />
                  <SocialLink icon={<LuFacebook />} />
                  <SocialLink icon={<LuYoutube />} />
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="bg-white rounded-[3rem] p-8 lg:p-12 shadow-2xl border border-slate-50 relative z-10">
                <form onSubmit={handleContactSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <FormInput
                      label="Full Name"
                      placeholder="John Doe"
                      type="text"
                      required
                    />
                    <FormInput
                      label="Email Address"
                      placeholder="john@example.com"
                      type="email"
                      required
                    />
                  </div>
                  <FormInput
                    label="Subject"
                    placeholder="General Inquiry"
                    type="text"
                    required
                  />
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">
                      Your Message
                    </label>
                    <textarea
                      rows="4"
                      placeholder="How can we help you?"
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 focus:border-[#189D91] outline-none transition-colors resize-none"
                      required
                    ></textarea>
                  </div>
                  <button
                    type="submit"
                    className="w-full py-5 bg-gradient-to-r from-[#311B92] to-[#189D91] text-white rounded-[2rem] font-black uppercase tracking-[0.3em] text-xs shadow-xl hover:scale-[1.02] transition-all active:scale-95 flex items-center justify-center gap-4"
                  >
                    Send Message <FiSend size={16} />
                  </button>
                </form>

                <AnimatePresence>
                  {isSubmitted && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="absolute inset-0 bg-white rounded-[3rem] z-20 flex flex-col items-center justify-center p-12 text-center"
                    >
                      <div className="w-20 h-20 bg-teal-50 text-[#189D91] rounded-full flex items-center justify-center mb-6">
                        <FiCheckCircle size={40} />
                      </div>
                      <h3 className="text-2xl font-black text-[#311B92] mb-4">
                        Message Sent!
                      </h3>
                      <p className="text-slate-500 font-medium leading-relaxed">
                        We'll get back to you shortly.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- PROPER FOOTER --- */}
      <footer className="bg-white text-slate-900 pt-20 pb-10 mt-20 relative border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            <div className="space-y-6">
              <Link
                to="/coming-soon"
                className="inline-block hover:scale-105 transition-transform duration-300"
              >
                <img
                  src={Logo}
                  alt="Riddha Interior Mart"
                  className="h-16 w-auto object-contain"
                  style={{ mixBlendMode: "multiply" }}
                />
              </Link>
              <p className="text-sm text-slate-500 leading-relaxed">
                Transforming spaces with elegance and efficiency. India's
                premium hub for all interior supply needs.
              </p>
              <div className="flex items-center gap-4">
                <SocialLink icon={<LuInstagram />} />
                <SocialLink icon={<LuFacebook />} />
                <SocialLink icon={<LuYoutube />} />
              </div>
            </div>
            <div>
              <h4 className="text-xs font-black uppercase tracking-[0.2em] mb-8 text-[#189D91]">
                Quick Explore
              </h4>
              <ul className="space-y-4">
                <FooterLink to="/coming-soon/about" label="Our Story" />
                <FooterLink
                  to="/coming-soon/services"
                  label="Design Services"
                />
                <FooterLink to="/coming-soon/shop" label="Shop Online" />
                <FooterLink to="/coming-soon/categories" label="Collections" />
                <li>
                  <button
                    onClick={() =>
                      document
                        .getElementById("contact")
                        ?.scrollIntoView({ behavior: "smooth" })
                    }
                    className="text-sm text-slate-500 hover:text-[#311B92] transition-colors flex items-center gap-2 group"
                  >
                    <FiChevronRight
                      size={14}
                      className="text-[#189D91] group-hover:translate-x-1 transition-transform"
                    />
                    Get in Touch
                  </button>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-black uppercase tracking-[0.2em] mb-8 text-[#189D91]">
                Services
              </h4>
              <ul className="space-y-4">
                <Link
                  to="/coming-soon/services"
                  className="text-sm text-slate-500 hover:text-[#311B92] transition-colors cursor-pointer"
                >
                  Interior Consultation
                </Link>
                <li className="text-sm text-slate-500 hover:text-[#311B92] transition-colors cursor-pointer">
                  Bulk Supply Solutions
                </li>
                <li className="text-sm text-slate-500 hover:text-[#311B92] transition-colors cursor-pointer">
                  Project Management
                </li>
                <li className="text-sm text-slate-500 hover:text-[#311B92] transition-colors cursor-pointer">
                  Custom Furniture Design
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-black uppercase tracking-[0.2em] mb-8 text-[#189D91]">
                Contact Us
              </h4>
              <ul className="space-y-6">
                <li className="flex gap-4">
                  <FiMapPin className="text-[#189D91]" size={20} />
                  <span className="text-sm text-slate-500">
                    123 Interior Hub, Mumbai, MH 400001
                  </span>
                </li>
                <li className="flex gap-4">
                  <FiPhone className="text-[#189D91]" size={20} />
                  <span className="text-sm text-slate-500">
                    +91 98765 43210
                  </span>
                </li>
                <li className="flex gap-4">
                  <FiMail className="text-[#189D91]" size={20} />
                  <span className="text-sm text-slate-500">
                    info@riddhainterio.com
                  </span>
                </li>
              </ul>
            </div>
          </div>
          <div className="pt-10 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">
              © {new Date().getFullYear()} Riddha Interior Mart. All Rights
              Reserved.
            </p>
            <div className="flex gap-6">
              <Link
                to="/terms"
                className="text-[10px] font-black uppercase tracking-widest text-slate-600 hover:text-[#189D91]"
              >
                Terms
              </Link>
              <Link
                to="/policies/privacy"
                className="text-[10px] font-black uppercase tracking-widest text-slate-600 hover:text-[#189D91]"
              >
                Privacy
              </Link>
            </div>
          </div>
        </div>
      </footer>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `,
        }}
      />
    </div>
  );
};

// --- Smartphone Sub Components ---

const SmartphoneCategoryIcon = ({ icon, label, color }) => (
  <div className="flex flex-col items-center gap-1 shrink-0">
    <div
      className={`w-8 h-8 rounded-full border-2 ${color} bg-white flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.02)]`}
    >
      {React.cloneElement(icon, { size: 13 })}
    </div>
    <span className="text-[6px] font-black text-slate-500 uppercase tracking-tighter">
      {label}
    </span>
  </div>
);

const SmartphoneProductCard = ({ name, price, rating, img }) => (
  <div className="bg-white rounded-xl p-1.5 border border-slate-100 shadow-[0_4px_12px_rgba(0,0,0,0.02)] space-y-1">
    <div className="aspect-square bg-slate-50 rounded-lg overflow-hidden relative">
      <img src={img} alt={name} className="w-full h-full object-cover" />
    </div>
    <div className="space-y-0.5 px-0.5">
      <h5 className="text-[7px] font-black text-slate-800 leading-none truncate">
        {name}
      </h5>
      <p className="text-[6px] font-black text-slate-400">
        Price: <span className="text-teal-600 font-black">{price}</span>
      </p>
      <div className="flex items-center gap-0.5">
        <span className="text-[6px] font-black text-slate-400">Rating:</span>
        <FiStar size={5} className="text-yellow-400 fill-yellow-400 ml-0.5" />
        <span className="text-[5px] font-black text-slate-400">{rating}</span>
      </div>
    </div>
  </div>
);

// --- Right Column Sub Components ---

const RightVerticalFeature = ({ icon, text, subtext, color, style }) => (
  <div
    className="flex items-center gap-4 group cursor-default z-10 w-full justify-start"
    style={style}
  >
    {/* Circular Icon - Larger size matching the reference image */}
    <div
      className={`rounded-full ${color} flex items-center justify-center text-white shadow-lg shadow-indigo-950/10 shrink-0 transform group-hover:scale-110 transition-transform duration-300 w-12 h-12`}
    >
      {React.cloneElement(icon, { size: 20 })}
    </div>
    {/* Text Description - Larger text matching the reference image, natural casing for subtext */}
    <div className="flex flex-col items-start text-left">
      <span className="font-black text-slate-800 tracking-wider uppercase leading-none text-xs md:text-sm">
        {text}
      </span>
      <span className="font-bold text-slate-400 tracking-wider mt-1 text-[10px] md:text-xs">
        {subtext}
      </span>
    </div>
  </div>
);

// --- Global Page Sub Components ---

const MissionCard = ({
  icon,
  title,
  text,
  color,
  iconColor = "text-[#311B92]",
  borderColor = "border-white",
}) => (
  <motion.div
    whileHover={{ y: -6, scale: 1.01 }}
    className={`p-8 rounded-[2rem] bg-gradient-to-br ${color} border ${borderColor} relative group transition-all duration-500 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.06)] hover:shadow-2xl overflow-hidden`}
  >
    <div
      className={`absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br ${color} blur-[60px] opacity-0 group-hover:opacity-40 transition-opacity duration-500`}
    ></div>
    <div className="relative z-10 space-y-5">
      <div
        className={`w-14 h-14 rounded-2xl bg-white flex items-center justify-center ${iconColor} shadow-xl shadow-indigo-900/5 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500`}
      >
        {React.cloneElement(icon, { size: 24 })}
      </div>
      <div className="space-y-2">
        <h3 className={`text-xl font-black ${iconColor} tracking-tight`}>
          {title}
        </h3>
        <p className="text-xs md:text-sm text-slate-500 font-medium leading-relaxed">
          {text}
        </p>
      </div>
    </div>
  </motion.div>
);

const FeatureItem = ({ icon, title, text }) => (
  <div className="p-10 rounded-[2.5rem] bg-white border border-slate-100 shadow-xl shadow-slate-200/40 hover:shadow-2xl hover:shadow-slate-200/60 hover:-translate-y-2 transition-all duration-500 space-y-6 text-center md:text-left">
    <div className="text-[#189D91] flex justify-center md:justify-start">
      <div className="w-14 h-14 bg-teal-50 rounded-2xl flex items-center justify-center">
        {React.cloneElement(icon, { size: 28 })}
      </div>
    </div>
    <h4 className="text-2xl font-black text-[#311B92] tracking-tight">
      {title}
    </h4>
    <p className="text-slate-500 font-medium leading-relaxed">{text}</p>
  </div>
);

const ContactInfoCard = ({ icon, title, text, link }) => (
  <a href={link} className="flex gap-6 items-center group">
    <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-[#189D91] border border-slate-100 group-hover:bg-[#311B92] group-hover:text-white transition-all duration-500 shadow-sm">
      {React.cloneElement(icon, { size: 24 })}
    </div>
    <div className="space-y-1">
      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
        {title}
      </h4>
      <p className="text-lg font-black text-[#311B92] group-hover:text-[#189D91] transition-colors">
        {text}
      </p>
    </div>
  </a>
);

const FormInput = ({ label, placeholder, type, required }) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">
      {label}
    </label>
    <input
      type={type}
      placeholder={placeholder}
      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 focus:border-[#189D91] outline-none transition-colors"
      required={required}
    />
  </div>
);

const FooterLink = ({ to, label }) => (
  <li>
    <Link
      to={to}
      className="text-sm text-slate-500 hover:text-[#311B92] transition-colors flex items-center gap-2 group"
    >
      <FiChevronRight
        size={14}
        className="text-[#189D91] group-hover:translate-x-1 transition-transform"
      />
      {label}
    </Link>
  </li>
);

const SocialLink = ({ icon }) => (
  <a
    href="#"
    className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-600 hover:bg-[#189D91] hover:text-white transition-all border border-slate-100"
  >
    {React.cloneElement(icon, { size: 18 })}
  </a>
);

const ShowcaseCard = ({ img }) => (
  <motion.div
    whileHover={{ y: -14, scale: 1.03, rotate: 0 }}
    transition={{ type: "spring", stiffness: 300, damping: 20 }}
    className="w-48 h-72 md:w-56 md:h-80 shrink-0 bg-white rounded-[2rem] overflow-hidden shadow-2xl shadow-black/5"
  >
    <img
      src={img}
      alt="Interior Inspiration"
      className="w-full h-full object-cover"
    />
  </motion.div>
);

export default ComingSoonPage;
