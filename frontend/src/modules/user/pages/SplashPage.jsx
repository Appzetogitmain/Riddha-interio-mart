import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useUser } from "../data/UserContext";
import TransparentLogo from "../../../assets/transparent_logo.png";

const SplashPage = () => {
  const navigate = useNavigate();
  const { user } = useUser();

  const handleRedirect = () => {
    sessionStorage.setItem("splashCompleted", "true");
    if (user) {
      navigate("/");
    } else {
      navigate("/login");
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      handleRedirect();
    }, 3000);
    return () => clearTimeout(timer);
  }, [navigate, user]);

  return (
    <div className="min-h-screen w-full bg-slate-50 flex items-center justify-center font-sans overflow-hidden">
      {/* Mobile container wrapper */}
      <div className="w-full max-w-[420px] h-[100dvh] md:h-[90vh] md:min-h-[750px] md:max-h-[850px] bg-[#fcfcfc] md:rounded-[2.5rem] flex flex-col justify-between relative py-6 shadow-2xl overflow-y-auto no-scrollbar border border-slate-100/50">
        
        {/* Background wave blob */}
        <div className="absolute left-0 top-[35%] w-[120px] h-[320px] bg-teal-50/70 rounded-r-full blur-3xl pointer-events-none z-0" />
        
        {/* Hanging Teal Pendant Light (Top-Left) */}
        <div className="absolute top-0 left-[10%] w-24 h-44 pointer-events-none z-10">
          <div className="absolute top-0 left-12 w-[1.5px] h-24 bg-slate-800" />
          <div className="absolute top-24 left-[45px] w-2.5 h-4 bg-amber-500 rounded-sm" />
          <div className="absolute top-[110px] left-6 w-12 h-8 bg-[#189D91] rounded-t-full shadow-md" />
          <div className="absolute top-[125px] left-8 w-8 h-8 bg-amber-300 rounded-full blur-[8px] opacity-75" />
          <div className="absolute top-[128px] left-[42px] w-3 h-3 bg-amber-100 rounded-full" />
        </div>

        {/* Leaves decoration (Top-Right) */}
        <div className="absolute top-10 right-[-10px] w-20 h-20 pointer-events-none opacity-40 z-10">
          <svg viewBox="0 0 120 120" className="w-full h-full fill-[#189D91]/70">
            <path d="M120,0 C90,15 70,45 80,75 C95,55 110,35 120,0 Z" />
            <path d="M120,30 C100,40 90,60 95,80 C100,70 110,55 120,30 Z" />
          </svg>
        </div>

        {/* Side Dot Grids */}
        {/* Left dots (Teal) */}
        <div className="absolute left-4 top-[22%] grid grid-cols-3 gap-1.5 opacity-60 z-10">
          {[...Array(21)].map((_, i) => (
            <div key={i} className="w-[3px] h-[3px] rounded-full bg-[#189D91]" />
          ))}
        </div>
        
        {/* Right dots (Pink) */}
        <div className="absolute right-4 top-[24%] grid grid-cols-3 gap-1.5 opacity-60 z-10">
          {[...Array(21)].map((_, i) => (
            <div key={i} className="w-[3px] h-[3px] rounded-full bg-[#EC008C]" />
          ))}
        </div>

        {/* Skip Button */}
        <button 
          onClick={handleRedirect}
          className="absolute top-4 right-4 bg-white border border-slate-200/80 text-slate-700 text-xs px-3.5 py-1.5 rounded-full flex items-center gap-1.5 font-bold z-50 shadow-sm active:scale-95 transition-all"
        >
          Skip <span className="text-[10px] font-black">&gt;</span>
        </button>

        {/* Top Branding Logo */}
        <div className="flex flex-col items-center mt-6 px-4 shrink-0 z-10">
          <img 
            src={TransparentLogo} 
            alt="Riddha Interior Mart" 
            className="w-[200px] h-auto object-contain" 
          />
        </div>

        {/* Tagline Headings */}
        <div className="text-center px-6 mt-2 mb-1 shrink-0 z-10">
          <h2 className="text-[#1A2639] text-[22px] font-black tracking-tight leading-tight">
            Connecting India to <br/>
            <span className="text-[#189D91]">Premium Interiors</span>
          </h2>
          <div className="flex justify-center my-2.5">
            <div className="w-1.5 h-1.5 rounded-full bg-[#EC008C]" />
          </div>
          <p className="text-slate-600 text-[12px] font-bold">
            One stop platform for all your interior needs
          </p>
        </div>

        {/* Central Space Showcase Image with Custom Organic Border Shape */}
        <div className="flex justify-center px-6 my-2 shrink-0 z-10">
          <div className="relative w-full max-w-[340px] aspect-[16/11] flex items-center justify-center">
            {/* Custom SVG border frame */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" viewBox="0 0 320 220" fill="none">
              <defs>
                <linearGradient id="frameGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#189D91" />
                  <stop offset="100%" stopColor="#EC008C" />
                </linearGradient>
              </defs>
              <path 
                d="M 12,35 C 80,18 240,18 308,35 C 315,50 315,170 308,185 C 240,202 80,202 12,185 C 5,170 5,50 12,35 Z" 
                stroke="url(#frameGrad)" 
                strokeWidth="5" 
                strokeLinejoin="round"
              />
            </svg>
            {/* Clipped interior image */}
            <div 
              className="w-[96%] h-[94%] overflow-hidden" 
              style={{ clipPath: 'path("M 12,35 C 80,18 240,18 308,35 C 315,50 315,170 308,185 C 240,202 80,202 12,185 C 5,170 5,50 12,35 Z")' }}
            >
              <img 
                src="https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&q=80&w=600" 
                className="w-full h-full object-cover scale-105" 
                alt="Premium Commercial Interior" 
              />
            </div>
          </div>
        </div>

        {/* Feature Cards Grid (mockup exact match) */}
        <div className="grid grid-cols-4 gap-1 px-4 my-2 shrink-0 z-10">
          <div className="flex flex-col items-center text-center">
            <div className="w-10 h-10 rounded-full bg-[#189D91]/10 flex items-center justify-center text-[#189D91] mb-1.5 shadow-sm">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="6" />
                <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
              </svg>
            </div>
            <span className="text-[10px] font-extrabold text-slate-800 leading-tight">Wide Range</span>
            <span className="text-[8px] text-slate-400 mt-0.5 leading-tight">Everything for every space</span>
          </div>

          <div className="flex flex-col items-center text-center">
            <div className="w-10 h-10 rounded-full bg-[#EC008C]/10 flex items-center justify-center text-[#EC008C] mb-1.5 shadow-sm">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="m9 11 2 2 4-4" />
              </svg>
            </div>
            <span className="text-[10px] font-extrabold text-slate-800 leading-tight">Verified Sellers</span>
            <span className="text-[8px] text-slate-400 mt-0.5 leading-tight">Trusted & reliable partners</span>
          </div>

          <div className="flex flex-col items-center text-center">
            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600 mb-1.5 shadow-sm">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="3" width="15" height="13" />
                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                <circle cx="5.5" cy="18.5" r="2.5" />
                <circle cx="18.5" cy="18.5" r="2.5" />
              </svg>
            </div>
            <span className="text-[10px] font-extrabold text-slate-800 leading-tight">Timely Delivery</span>
            <span className="text-[8px] text-slate-400 mt-0.5 leading-tight">On-time, every time</span>
          </div>

          <div className="flex flex-col items-center text-center">
            <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600 mb-1.5 shadow-sm">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </div>
            <span className="text-[10px] font-extrabold text-slate-800 leading-tight">GST Invoices</span>
            <span className="text-[8px] text-slate-400 mt-0.5 leading-tight">100% compliant billing</span>
          </div>
        </div>

        {/* Loading Progress Bar */}
        <div className="w-full flex flex-col items-center px-8 mt-2 shrink-0 z-10">
          <div className="flex items-center gap-1.5 mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#EC008C]" />
            <span className="text-slate-800 text-[11px] font-black tracking-[0.4em] uppercase">
              Loading
            </span>
            <div className="w-1.5 h-1.5 rounded-full bg-[#EC008C]" />
          </div>
          <div className="w-full max-w-[280px] h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 3.0, ease: "easeInOut" }}
              className="h-full bg-[#EC008C] rounded-full"
            />
          </div>
        </div>

      </div>
    </div>
  );
};

export default SplashPage;

