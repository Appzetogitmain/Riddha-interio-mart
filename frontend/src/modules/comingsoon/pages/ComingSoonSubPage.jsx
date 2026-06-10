import React from "react";
import { motion } from "framer-motion";
import { Link, useParams } from "react-router-dom";
import {
  FiArrowLeft,
  FiClock,
  FiSettings,
  FiLayout,
  FiTruck,
  FiPhone,
  FiInfo,
  FiArrowRight,
  FiGrid,
  FiLayers,
  FiZap,
  FiAward,
} from "react-icons/fi";
import Logo from "../../../assets/WhatsApp Image 2026-05-06 at 3.50.08 PM.jpeg";

const ComingSoonSubPage = () => {
  const { section } = useParams();

  const content = {
    about: {
      title: "Our Story",
      subtitle: "Transforming Spaces with Riddha Interio",
      text: "We are building a comprehensive interior supply hub that brings world-class designs to your doorstep. Our team of experts is working tirelessly to curate the best collection of tiles, paints, and furniture.",
      icon: <FiInfo size={40} className="text-[#189D91]" />,
      theme: "from-teal-500/20 to-emerald-500/20",
    },
    services: {
      title: "Our Services",
      subtitle: "Professional Interior Solutions",
      text: "From personalized design consultations to bulk supply management, we are preparing a suite of services tailored to every interior need. Stay tuned for our project management and turnkey solutions.",
      icon: <FiSettings size={40} className="text-[#311B92]" />,
      theme: "from-indigo-500/20 to-purple-500/20",
    },
    shop: {
      title: "Online Store",
      subtitle: "A Massive Catalog is Coming Soon",
      text: "We are digitizing over 10,000+ products ranging from luxury furniture to essential hardware. Our e-commerce experience will be fast, secure, and user-friendly.",
      icon: <FiLayout size={40} className="text-[#D12C8D]" />,
      theme: "from-pink-500/20 to-rose-500/20",
    },
    categories: {
      title: "Collections",
      subtitle: "Curated Categories for Every Room",
      text: "Explore our upcoming collections in Lighting, Furniture, Wall Panels, and Decor. Each category is hand-picked by designers to ensure the highest quality standards.",
      icon: <FiGrid size={40} className="text-orange-500" />,
      theme: "from-orange-500/20 to-amber-500/20",
    },
    contact: {
      title: "Contact Us",
      subtitle: "We're Here to Help",
      text: "Have a project in mind? Reach out to us at info@riddhainterio.com or call us at +91 98765 43210. Our customer experience team is ready to assist you.",
      icon: <FiPhone size={40} className="text-blue-500" />,
      theme: "from-blue-500/20 to-cyan-500/20",
    },
  }[section] || {
    title: "Section Under Development",
    subtitle: "We're almost there!",
    text: "This section is currently being polished. Check back soon for exciting updates.",
    icon: <FiClock size={40} className="text-slate-400" />,
    theme: "from-slate-500/10 to-slate-500/5",
  };

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans overflow-hidden">
      {/* Decorative Blobs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div
          className={`absolute -top-24 -left-24 w-96 h-96 bg-gradient-to-br ${content.theme} blur-[120px] rounded-full animate-pulse`}
        ></div>
        <div
          className={`absolute -bottom-24 -right-24 w-[500px] h-[500px] bg-gradient-to-tl ${content.theme} blur-[150px] rounded-full opacity-50`}
        ></div>
      </div>

      {/* Header */}
      <nav className="h-24 flex items-center justify-between px-8 bg-white/50 backdrop-blur-xl sticky top-0 z-50 border-b border-slate-100/50">
        <Link
          to="/coming-soon"
          className="flex items-center gap-4 group text-slate-500 hover:text-[#189D91] transition-all"
        >
          <div className="w-10 h-10 rounded-full bg-white shadow-sm border border-slate-100 flex items-center justify-center group-hover:shadow-md transition-all">
            <FiArrowLeft
              size={18}
              className="group-hover:-translate-x-1 transition-transform"
            />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.3em]">
            Home
          </span>
        </Link>

        <Link
          to="/coming-soon"
          className="hover:scale-105 transition-transform"
        >
          <img
            src={Logo}
            alt="Riddha Interio"
            className="h-12 md:h-14 w-auto object-contain"
          />
        </Link>

        <div className="hidden md:flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#189D91] animate-ping"></div>
          <span className="text-[10px] font-black uppercase tracking-widest text-[#189D91]">
            Live Progress
          </span>
        </div>
      </nav>

      {/* Content */}
      <main className="flex-grow flex flex-col items-center justify-center p-8 relative z-10">
        <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="space-y-8 text-center lg:text-left"
          >
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-white rounded-full shadow-sm border border-slate-100">
              <span className="w-2 h-2 rounded-full bg-[#D12C8D]"></span>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                {content.title}
              </span>
            </div>

            <h1 className="text-4xl md:text-6xl font-black text-[#311B92] leading-[1.1] tracking-tight">
              {content.subtitle}
            </h1>

            <p className="text-lg text-slate-500 font-medium leading-relaxed">
              {content.text}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link
                to="/coming-soon"
                className="flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-[#189D91] to-[#311B92] text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-[#189D91]/20 hover:scale-[1.02] transition-all active:scale-95"
              >
                Get Launch Alert <FiArrowRight size={16} />
              </Link>
              <button className="flex items-center justify-center gap-3 px-8 py-4 bg-white text-slate-700 border border-slate-100 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-50 transition-all">
                Learn More
              </button>
            </div>
          </motion.div>

          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", damping: 15 }}
            className="relative"
          >
            <div className="aspect-square bg-white rounded-[3rem] shadow-2xl shadow-slate-200 border border-slate-100 flex items-center justify-center relative overflow-hidden group">
              {/* Glassmorphism Background inside card */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${content.theme} opacity-30`}
              ></div>

              <div className="relative z-10 transform group-hover:scale-110 transition-transform duration-700">
                {content.icon}
              </div>

              {/* Floating Elements */}
              <div className="absolute top-10 right-10 w-12 h-12 bg-white rounded-2xl shadow-lg flex items-center justify-center animate-bounce">
                <FiZap className="text-orange-500" />
              </div>
              <div className="absolute bottom-12 left-10 w-14 h-14 bg-white rounded-full shadow-lg flex items-center justify-center animate-pulse">
                <FiAward className="text-teal-500" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Trust Badges */}
        <div className="mt-20 flex flex-wrap justify-center gap-8 md:gap-16 opacity-30 grayscale hover:grayscale-0 transition-all duration-500">
          <TrustBadge text="Premium Quality" />
          <TrustBadge text="Fast Delivery" />
          <TrustBadge text="Expert Support" />
          <TrustBadge text="Secure Payments" />
        </div>
      </main>

      {/* Footer */}
      <footer className="h-24 border-t border-slate-100/50 flex items-center justify-center px-8 bg-white/30 backdrop-blur-sm">
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">
          © Riddha Interior Mart <span className="mx-4 text-slate-200">|</span>{" "}
          2025 Launching Soon
        </p>
      </footer>
    </div>
  );
};

const TrustBadge = ({ text }) => (
  <div className="flex items-center gap-3">
    <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
    <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-600">
      {text}
    </span>
  </div>
);

export default ComingSoonSubPage;
