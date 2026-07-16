import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "../data/UserContext";
import TransparentLogo from "../../../assets/transparent_logo.png";
import { FiPercent, FiTruck } from "react-icons/fi";
import { MdSecurity } from "react-icons/md";
import { FaFileInvoice, FaPhoneAlt } from "react-icons/fa";

const SplashPage = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [loadingComplete, setLoadingComplete] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoadingComplete(true);
      sessionStorage.setItem("splashCompleted", "true");
      if (user) {
        navigate("/");
      }
    }, 2500);
    return () => clearTimeout(timer);
  }, [navigate, user]);

  return (
    <div className="min-h-screen w-full bg-slate-50 flex items-center justify-center font-sans overflow-hidden">
      {/* Mobile container wrapper */}
      <div className="w-full max-w-[420px] h-[100dvh] md:h-[90vh] md:min-h-[750px] md:max-h-[850px] bg-[#fcfcfc] md:rounded-[2.5rem] flex flex-col relative pb-6 overflow-y-auto no-scrollbar">
      
        {/* Top Image Collage Section */}
        <div className="relative w-full h-[300px] flex-shrink-0 bg-white">
           
           {/* Background gradient */}
           <div className="absolute inset-0 bg-gradient-to-b from-slate-50 to-white/10 pointer-events-none z-0" />
           
           {/* Diamonds */}
           <div className="absolute left-[2%] top-[12%] w-[150px] h-[150px] rotate-45 overflow-hidden rounded-[2.5rem] shadow-sm border-[6px] border-white z-10 bg-slate-100">
             <img src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=400" className="w-[150%] h-[150%] object-cover -rotate-45 -translate-x-[15%] -translate-y-[15%] origin-center" alt="Marble" />
           </div>
           
           <div className="absolute right-[10%] top-[0%] w-[140px] h-[140px] rotate-45 overflow-hidden rounded-[2.5rem] shadow-sm border-[8px] border-white z-0 bg-slate-100">
             <img src="https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=400" className="w-[150%] h-[150%] object-cover -rotate-45 -translate-x-[15%] -translate-y-[15%] origin-center" alt="Interior" />
           </div>
           
           <div className="absolute right-[-5%] top-[35%] w-[160px] h-[160px] rotate-45 overflow-hidden rounded-[2.5rem] shadow-sm border-[8px] border-white z-20 bg-slate-100">
             <img src="https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=400" className="w-[150%] h-[150%] object-cover -rotate-45 -translate-x-[15%] -translate-y-[15%] origin-center" alt="Faucet" />
           </div>
        </div>

        <div className="flex-1 w-full mx-auto flex flex-col items-center px-6 -mt-16 relative z-30">
          
          {/* Logo Container */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="w-[190px] flex flex-col items-center justify-center mb-5 relative"
          >
            {/* Subtle white glow behind logo */}
            <div className="absolute inset-0 bg-white/60 blur-xl rounded-full scale-110 -z-10" />
            <img
              src={TransparentLogo}
              alt="Riddha Interior Mart"
              className="w-full h-auto object-contain drop-shadow-sm"
            />
          </motion.div>

          {/* Tagline */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-center space-y-1 mb-6"
          >
            <p className="text-[#1A2639] text-[20px] font-extrabold tracking-tight leading-tight">
              Connecting India to
            </p>
            <p className="text-[#189D91] text-[18px] font-bold tracking-wide leading-tight">
              Premium Interiors.
            </p>
          </motion.div>

          {/* Progress Bar */}
          <AnimatePresence>
            {!loadingComplete && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                className="w-full flex flex-col items-center gap-3 mb-6 overflow-hidden"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#EC008C] animate-pulse" />
                  <span className="text-slate-600 text-[13px] font-bold uppercase tracking-[0.25em]">
                    Loading
                  </span>
                  <div className="w-2.5 h-2.5 rounded-full bg-[#EC008C] animate-pulse delay-75" />
                </div>
                <div className="w-56 h-2 bg-pink-50 rounded-full overflow-hidden relative">
                  <motion.div
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 2.5, ease: "easeInOut" }}
                    className="absolute top-0 left-0 h-full bg-[#EC008C] rounded-full"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.5, duration: 0.5 }}
             className="w-full flex flex-col"
          >
            {/* Feature Cards */}
            <div className="w-full bg-white rounded-3xl p-4 shadow-[0_4px_25px_rgb(0,0,0,0.03)] border border-slate-50 mb-6">
              <div className="grid grid-cols-4 gap-1 divide-x divide-slate-100/80">
                <div className="flex flex-col items-center text-center px-0.5">
                  <div className="text-[#EC008C] mb-2 drop-shadow-sm scale-110">
                    <div className="w-8 h-8 mask mask-hexagon bg-[#EC008C] text-white flex items-center justify-center rounded-lg" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}>
                       <FiPercent size={16} strokeWidth={3} />
                    </div>
                  </div>
                  <p className="text-[10px] font-bold text-slate-800 leading-tight mb-0.5">Best Prices</p>
                  <p className="text-[8px] text-slate-500 leading-tight tracking-tight">Wholesale<br/>rates</p>
                </div>
                
                <div className="flex flex-col items-center text-center px-0.5">
                  <div className="text-[#189D91] mb-2 drop-shadow-sm scale-110">
                    <div className="w-8 h-8 mask mask-hexagon bg-[#189D91] text-white flex items-center justify-center rounded-lg" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}>
                       <MdSecurity size={18} />
                    </div>
                  </div>
                  <p className="text-[10px] font-bold text-slate-800 leading-tight mb-0.5">Trusted Quality</p>
                  <p className="text-[8px] text-slate-500 leading-tight tracking-tight">Verified<br/>brands</p>
                </div>
                
                <div className="flex flex-col items-center text-center px-0.5">
                  <div className="text-orange-500 mb-2 drop-shadow-sm scale-110">
                    <div className="w-8 h-8 mask mask-hexagon bg-orange-500 text-white flex items-center justify-center rounded-lg" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}>
                       <FiTruck size={16} strokeWidth={2.5} />
                    </div>
                  </div>
                  <p className="text-[10px] font-bold text-slate-800 leading-tight mb-0.5">Pan India</p>
                  <p className="text-[8px] text-slate-500 leading-tight tracking-tight">Fast delivery</p>
                </div>
                
                <div className="flex flex-col items-center text-center px-0.5">
                  <div className="text-purple-600 mb-2 drop-shadow-sm scale-110">
                    <div className="w-8 h-8 mask mask-hexagon bg-purple-500 text-white flex items-center justify-center rounded-lg" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}>
                       <FaFileInvoice size={14} />
                    </div>
                  </div>
                  <p className="text-[10px] font-bold text-slate-800 leading-tight mb-0.5">GST Invoices</p>
                  <p className="text-[8px] text-slate-500 leading-tight tracking-tight">100% Billing</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="w-full space-y-3 pb-4">
              <button 
                onClick={() => navigate('/login')}
                className="w-full bg-[#EC008C] hover:bg-[#d8007e] text-white py-3.5 rounded-[18px] font-semibold text-[15px] transition-all active:scale-[0.98] shadow-md shadow-[#EC008C]/20"
              >
                Login / Sign Up
              </button>
              <button 
                onClick={() => navigate('/login')}
                className="w-full bg-white border border-[#EC008C]/30 text-[#EC008C] hover:bg-pink-50 py-3.5 rounded-[18px] font-semibold text-[15px] transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <FaPhoneAlt size={13} />
                Continue with Mobile
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default SplashPage;
