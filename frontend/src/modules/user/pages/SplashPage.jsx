import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

import { useUser } from "../data/UserContext";

import TransparentLogo from "../../../assets/transparent_logo.png";

const SplashPage = () => {
  const navigate = useNavigate();
  const { user } = useUser();

  useEffect(() => {
    const timer = setTimeout(() => {
      sessionStorage.setItem("splashCompleted", "true");
      if (user) {
        navigate("/");
      } else {
        navigate("/onboarding");
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, [navigate, user]);

  return (
    <div className="min-h-screen w-full bg-white flex items-center justify-center font-sans overflow-hidden px-4">
      {/* Decorative background effects */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-[#189D91]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-[#EC008C]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md flex flex-col items-center justify-center z-10">
        {/* Main Logo Container */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="w-[280px] sm:w-[320px] flex items-center justify-center mb-10 relative"
        >
          <img
            src={TransparentLogo}
            alt="Riddha Interior Mart"
            className="w-full h-auto object-contain"
          />
        </motion.div>

        {/* Tagline */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          className="text-center space-y-1"
        >
          <p className="text-slate-800 text-[17px] font-extrabold tracking-tight">
            Connecting India to
          </p>
          <p className="text-[#189D91] text-[15px] font-semibold tracking-wide">
            Premium Interiors.
          </p>
        </motion.div>

        {/* Premium Loading Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.4 }}
          className="w-full flex flex-col items-center gap-2.5 pt-2"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-[#EC008C] animate-pulse" />
            <span className="text-slate-500 text-xs font-bold uppercase tracking-[0.2em]">
              Loading
            </span>
            <div className="w-2 h-2 rounded-full bg-[#EC008C] animate-pulse delay-75" />
          </div>

          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden relative shadow-inner">
            <motion.div
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 2.5, ease: "easeInOut" }}
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#EC008C] to-[#ff47b3] rounded-full"
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SplashPage;
