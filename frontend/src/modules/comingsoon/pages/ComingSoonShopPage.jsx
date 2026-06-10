import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  FiArrowLeft,
  FiShoppingCart,
  FiSearch,
  FiFilter,
  FiHeart,
  FiStar,
  FiZap,
  FiArrowRight,
  FiInstagram,
  FiTwitter,
  FiLinkedin,
} from "react-icons/fi";
import ComingSoonHeader from "../components/ComingSoonHeader";
import Logo from "../../../assets/WhatsApp Image 2026-05-06 at 3.50.08 PM.jpeg";

const ComingSoonShopPage = () => {
  const products = [
    {
      name: "Teak Master Bed",
      category: "Furniture",
      price: "₹34,999",
      img: "https://images.unsplash.com/photo-1616046229478-9901c5536a45?w=500&q=80",
    },
    {
      name: "Crystal Chandelier",
      category: "Lighting",
      price: "₹12,499",
      img: "https://images.unsplash.com/photo-1524484485831-a92ffc0de03f?w=500&q=80",
    },
    {
      name: "Velvet Accent Chair",
      category: "Furniture",
      price: "₹8,999",
      img: "https://images.unsplash.com/photo-1592078615290-033ee584e267?w=500&q=80",
    },
    {
      name: "Modern Floor Lamp",
      category: "Lighting",
      price: "₹4,299",
      img: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=500&q=80",
    },
    {
      name: "Veneer Wall Panel",
      category: "Wall Panels",
      price: "₹2,499",
      img: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=500&q=80",
    },
    {
      name: "Marble Dining Table",
      category: "Furniture",
      price: "₹45,999",
      img: "https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?w=500&q=80",
    },
    {
      name: "Sleek Kitchen Cabinet",
      category: "Modular Kitchen",
      price: "₹18,000",
      img: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=500&q=80",
    },
    {
      name: "Industrial Pendant",
      category: "Lighting",
      price: "₹2,199",
      img: "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=500&q=80",
    },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-teal-500/30 overflow-x-hidden">
      {/* --- SHARED HEADER --- */}
      <ComingSoonHeader />

      {/* --- HERO SECTION --- */}
      <section className="py-14 md:py-18 text-center px-6 bg-gradient-to-b from-[#FAF6EE] to-white relative overflow-hidden">
        {/* Decorative background Blobs styled with Logo Brand Colors */}
        <div className="absolute top-0 left-0 w-80 h-80 bg-[#D12C8D]/5 blur-[120px] rounded-full pointer-events-none z-0"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#189D91]/5 blur-[150px] rounded-full pointer-events-none z-0"></div>
        <div className="absolute top-1/2 left-1/3 w-[300px] h-[300px] bg-[#311B92]/3 blur-[120px] rounded-full pointer-events-none z-0"></div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 space-y-3 max-w-4xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-slate-100 mb-2">
            <FiZap className="text-orange-500" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
              Opening June 2025
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-[#311B92] leading-[1.1] tracking-tight">
            Our <span className="text-[#189D91]">Shop</span> is <br />{" "}
            <span className="text-[#D12C8D]">Coming Soon</span>
          </h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium leading-relaxed max-w-2xl mx-auto pt-2">
            We are digitizing over 10,000+ premium interior products. Get ready
            for a world-class shopping experience.
          </p>
        </motion.div>
      </section>

      {/* --- SHOP FILTERS (DUMMY) --- */}
      <section className="max-w-6xl mx-auto px-8 py-5 flex flex-col items-center justify-center gap-4 border-b border-slate-100">
        <div className="flex flex-wrap justify-center items-center gap-6 text-xs font-black uppercase tracking-widest text-slate-400">
          <span className="text-slate-900 border-b-2 border-[#189D91] pb-1 cursor-pointer">
            All Products
          </span>
          <span className="hover:text-[#311B92] cursor-pointer transition-colors duration-200">
            Furniture
          </span>
          <span className="hover:text-[#311B92] cursor-pointer transition-colors duration-200">
            Lighting
          </span>
          <span className="hover:text-[#311B92] cursor-pointer transition-colors duration-200">
            Decor
          </span>
        </div>
        <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl text-slate-400 hover:text-[#311B92] cursor-pointer transition-all text-[10px] md:text-xs font-black uppercase tracking-widest active:scale-95">
          <FiFilter />
          <span>Filter & Sort</span>
        </div>
      </section>

      {/* --- PRODUCT GRID --- */}
      <section className="py-10 max-w-6xl mx-auto px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-8">
          {products.map((product, index) => (
            <ProductTeaserCard key={index} {...product} index={index} />
          ))}
        </div>
      </section>

      {/* --- EXCLUSIVE OFFER BANNER --- */}
      <section className="py-16 px-8 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.01 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-5xl mx-auto bg-gradient-to-br from-[#189D91]/12 via-[#311B92]/8 to-[#D12C8D]/12 backdrop-blur-xl border border-slate-200/60 rounded-[3rem] p-10 lg:p-16 relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-8 shadow-[0_30px_70px_-15px_rgba(49,27,146,0.15)] group"
        >
          {/* Decorative Grid Mesh */}
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent"></div>
            {/* Mesh Pattern */}
            <svg
              className="absolute inset-0 w-full h-full"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <pattern
                  id="mesh-offer-shop"
                  width="40"
                  height="40"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M 40 0 L 0 0 0 40"
                    fill="none"
                    stroke="#311B92"
                    strokeWidth="0.3"
                    opacity="0.08"
                  />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#mesh-offer-shop)" />
            </svg>
          </div>

          {/* Floating Spheres */}
          <motion.div
            animate={{ y: [0, -20, 0], x: [0, 10, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-20 -left-20 w-64 h-64 bg-[#311B92]/8 blur-3xl rounded-full"
          />
          <motion.div
            animate={{ y: [0, 20, 0], x: [0, -10, 0] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -bottom-32 -right-32 w-96 h-96 bg-[#D12C8D]/8 blur-3xl rounded-full"
          />

          <div className="space-y-4 text-center lg:text-left z-10 max-w-xl">
            <h4 className="text-[10px] md:text-xs font-black uppercase tracking-[0.4em] text-[#189D91]">
              Launch Special
            </h4>
            <h2 className="text-3xl md:text-5xl font-black leading-[1.15] tracking-tight text-[#311B92]">
              Get Flat 20% OFF <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#189D91] via-[#311B92] to-[#D12C8D]">
                On Your First Order
              </span>
            </h2>
            <p className="text-xs md:text-sm text-slate-500 font-medium leading-relaxed max-w-md pt-1">
              Join our waitlist today and receive an exclusive discount code on
              launch day.
            </p>
            <div className="pt-3 flex justify-center lg:justify-start">
              <button className="px-8 py-4 bg-[#D12C8D] text-white rounded-xl font-black uppercase tracking-widest text-[10px] hover:scale-105 hover:bg-[#311B92] transition-all shadow-lg shadow-[#D12C8D]/25 active:scale-95">
                Join Waitlist Now
              </button>
            </div>
          </div>

          <div className="relative z-10 hidden lg:block">
            <div className="w-60 h-60 bg-white/40 backdrop-blur-xl border border-white/60 rounded-[2.5rem] rotate-12 flex items-center justify-center shadow-[0_20px_50px_-12px_rgba(49,27,146,0.1)] group-hover:rotate-6 transition-all duration-700">
              <FiArrowRight
                size={50}
                className="text-[#311B92]/40 -rotate-45 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-500"
              />
            </div>
          </div>
        </motion.div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="py-20 border-t border-slate-100 bg-white">
        <div className="max-w-7xl mx-auto px-8 flex flex-col items-center space-y-10">
          <img src={Logo} alt="Riddha Interio" className="h-14 opacity-80" />
          <p className="text-center text-slate-500 font-medium max-w-lg leading-relaxed uppercase tracking-widest text-[10px]">
            Premium Quality Products for Premium Lifestyles.
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

const ProductTeaserCard = ({ name, category, price, img, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    className="group"
  >
    <div className="relative aspect-[4/5] rounded-[1.25rem] overflow-hidden mb-2 shadow-sm border border-slate-100">
      <img
        src={img}
        alt={name}
        className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
      />
      <div className="absolute top-2.5 right-2.5 px-2 py-0.5 bg-white/90 backdrop-blur-md rounded-full text-[8px] font-black uppercase tracking-widest text-[#D12C8D]">
        Coming Soon
      </div>
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
        <button className="p-2.5 bg-white rounded-full shadow-xl hover:scale-110 transition-all">
          <FiHeart className="text-[#D12C8D]" />
        </button>
      </div>
    </div>
    <div className="space-y-0.5">
      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
        {category}
      </p>
      <h3 className="text-xs md:text-sm font-black text-[#311B92] leading-snug">
        {name}
      </h3>
      <div className="flex items-center justify-between pt-0.5">
        <p className="text-xs md:text-sm font-black text-[#189D91]">{price}</p>
        <div className="flex gap-0.5">
          {[...Array(5)].map((_, i) => (
            <FiStar
              key={i}
              size={8}
              className="text-yellow-400 fill-yellow-400"
            />
          ))}
        </div>
      </div>
      <button className="w-full mt-2 py-1.5 bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-[#311B92] hover:text-white transition-all duration-300 active:scale-95">
        Launch Alert
      </button>
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

export default ComingSoonShopPage;
