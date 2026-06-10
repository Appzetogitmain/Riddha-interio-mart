import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  FiSearch,
  FiArrowRight,
  FiArrowLeft,
  FiFilter,
  FiGrid,
  FiLayout,
  FiBox,
  FiZap,
  FiLayers,
  FiTool,
  FiInstagram,
  FiTwitter,
  FiLinkedin,
} from "react-icons/fi";
import ComingSoonHeader from "../components/ComingSoonHeader";
import Logo from "../../../assets/WhatsApp Image 2026-05-06 at 3.50.08 PM.jpeg";

const ComingSoonCategoriesPage = () => {
  const categories = [
    {
      name: "Furniture",
      label: "Premium Pieces",
      img: "https://images.unsplash.com/photo-1592078615290-033ee584e267?w=500&q=80",
      color: "from-blue-500",
    },
    {
      name: "Lighting",
      label: "Designer Glow",
      img: "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=500&q=80",
      color: "from-orange-500",
    },
    {
      name: "Wall Panels",
      label: "Textured Art",
      img: "https://images.unsplash.com/photo-1615529182904-14819c35db37?w=500&q=80",
      color: "from-pink-500",
    },
    {
      name: "Home Decor",
      label: "Elegant Accents",
      img: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=500&q=80",
      color: "from-purple-500",
    },
    {
      name: "Flooring",
      label: "Luxury Surfaces",
      img: "https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?w=500&q=80",
      color: "from-indigo-500",
    },
    {
      name: "Modular Kitchen",
      label: "Smart Living",
      img: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=500&q=80",
      color: "from-teal-500",
    },
    {
      name: "Hardware",
      label: "Reliable Fittings",
      img: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=500&q=80",
      color: "from-slate-600",
    },
    {
      name: "Paints & Finishes",
      label: "Master Colors",
      img: "https://images.unsplash.com/photo-1562591176-d8655479d722?w=500&q=80",
      color: "from-red-500",
    },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-teal-500/30 overflow-x-hidden">
      {/* --- SHARED HEADER --- */}
      <ComingSoonHeader />

      {/* --- HERO SECTION --- */}
      <section className="relative py-12 lg:py-16 overflow-hidden flex flex-col items-center justify-center text-center px-6">
        {/* Decorative Blobs */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#189D91]/10 blur-[120px] rounded-full"></div>
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-[#D12C8D]/5 blur-[150px] rounded-full"></div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 space-y-4 max-w-3xl"
        >
          <h4 className="text-[10px] md:text-xs font-black uppercase tracking-[0.4em] text-[#189D91]">
            Explore Our Catalog
          </h4>
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-[#311B92] leading-[1.1] tracking-tighter">
            Shop by{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#189D91] via-[#311B92] to-[#D12C8D]">
              Categories
            </span>
          </h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium leading-relaxed max-w-lg mx-auto pt-2">
            Find everything you need for your perfect interior. Thousands of
            products across 20+ premium categories.
          </p>
        </motion.div>
      </section>

      {/* --- CATEGORIES GRID --- */}
      <section className="py-6 pb-12 max-w-6xl mx-auto px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {categories.map((cat, index) => (
            <CategoryCard key={index} {...cat} index={index} />
          ))}
        </div>
      </section>

      {/* --- FEATURED CATEGORY SECTION --- */}
      <section className="py-14 bg-slate-50/50">
        <div className="max-w-6xl mx-auto px-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative h-[380px] rounded-[2.5rem] overflow-hidden shadow-2xl group"
          >
            <img
              src="https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1200&q=80"
              alt="Premium Collection"
              className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-1000"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#FAF6EE]/90 via-[#FAF6EE]/75 to-transparent backdrop-blur-[2px] flex items-center px-8 lg:px-16">
              <div className="max-w-lg space-y-4 text-slate-800">
                <h4 className="text-[10px] md:text-xs font-black uppercase tracking-[0.4em] text-[#189D91]">
                  Highlight of the Month
                </h4>
                <h2 className="text-2xl md:text-4xl font-black leading-tight text-[#311B92]">
                  Premium Furniture <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#189D91] via-[#311B92] to-[#D12C8D]">
                    Collection 2025
                  </span>
                </h2>
                <p className="text-xs md:text-sm text-slate-500 font-medium leading-relaxed">
                  Hand-picked luxury pieces curated by global designers for the
                  modern Indian home.
                </p>
                <div className="pt-2">
                  <button className="px-8 py-3.5 bg-[#311B92] hover:bg-[#189D91] text-white rounded-xl font-black uppercase tracking-widest text-[10px] hover:scale-105 transition-all shadow-lg shadow-indigo-900/10 active:scale-95">
                    Explore Now
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* --- CTA --- */}
      <section className="py-24 px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-5xl mx-auto text-center space-y-10"
        >
          <h2 className="text-4xl md:text-6xl font-black text-[#311B92] leading-tight tracking-tight">
            Start Designing Your <br />{" "}
            <span className="text-[#189D91]">Dream Space</span>
          </h2>
          <div className="flex justify-center">
            <button className="group relative flex items-center gap-4 px-12 py-6 bg-gradient-to-r from-[#311B92] to-[#189D91] text-white rounded-[2rem] font-black uppercase tracking-[0.3em] text-xs shadow-2xl shadow-[#311B92]/30 hover:scale-105 transition-all active:scale-95">
              Browse All Products{" "}
              <FiArrowRight className="group-hover:translate-x-2 transition-transform" />
            </button>
          </div>
        </motion.div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="py-20 border-t border-slate-100 bg-white">
        <div className="max-w-7xl mx-auto px-8 flex flex-col items-center space-y-10">
          <img src={Logo} alt="Riddha Interio" className="h-14 opacity-80" />
          <p className="text-center text-slate-500 font-medium max-w-lg leading-relaxed uppercase tracking-widest text-[10px]">
            Discover endless possibilities for your interiors.
          </p>
          <div className="flex gap-8">
            <SocialIcon icon={<FiInstagram />} />
            <SocialIcon icon={<FiTwitter />} />
            <SocialIcon icon={<FiLinkedin />} />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300">
            © {new Date().getFullYear()} Riddha Interior Mart. ALL RIGHTS
            RESERVED.
          </p>
        </div>
      </footer>
    </div>
  );
};

// --- Sub Components ---

const FilterPill = ({ label, active }) => (
  <button
    className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all shrink-0 ${active ? "bg-[#311B92] text-white shadow-lg shadow-[#311B92]/20" : "bg-white text-slate-400 border border-slate-100 hover:bg-slate-50"}`}
  >
    {label}
  </button>
);

const CategoryCard = ({ name, label, img, index }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    whileInView={{ opacity: 1, scale: 1 }}
    viewport={{ once: true }}
    transition={{ delay: index * 0.05 }}
    whileHover={{ y: -6 }}
    className="relative h-[300px] rounded-[1.5rem] overflow-hidden group cursor-pointer shadow-xl shadow-slate-100/50"
  >
    <img
      src={img}
      alt={name}
      className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
    />
    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-5">
      <p className="text-[#189D91] text-[9px] font-black uppercase tracking-[0.3em] mb-1">
        {label}
      </p>
      <h3 className="text-white text-lg font-black tracking-tight">{name}</h3>
      <div className="h-1 w-0 bg-[#D12C8D] group-hover:w-full transition-all duration-500 mt-2 rounded-full"></div>
    </div>
  </motion.div>
);

const SocialIcon = ({ icon }) => (
  <a
    href="#"
    className="w-12 h-12 rounded-full border border-slate-100 flex items-center justify-center text-slate-400 hover:bg-[#311B92] hover:text-white hover:border-[#311B92] transition-all"
  >
    {icon}
  </a>
);

export default ComingSoonCategoriesPage;
