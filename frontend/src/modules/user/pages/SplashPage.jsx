import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useUser } from '../data/UserContext';
import TransparentLogo from "../../../assets/transparent_logo.png";

const SplashPage = () => {
  const navigate = useNavigate();
  const { user } = useUser();

  useEffect(() => {
    const timer = setTimeout(() => {
      sessionStorage.setItem('splashCompleted', 'true');
      navigate(user ? '/' : '/onboarding');
    }, 3000);
    return () => clearTimeout(timer);
  }, [navigate, user]);

  return (
    <div className="min-h-screen w-full bg-white flex flex-col items-center justify-center overflow-hidden relative px-6">

      {/* Background blobs */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-[#189D91]/6 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-72 h-72 bg-[#EC008C]/6 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none" />

      <div className="flex flex-col items-center gap-6 z-10 w-full max-w-xs">

        {/* Logo */}
        <motion.img
          src={TransparentLogo}
          alt="Riddha Interio Mart"
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-[200px] h-auto object-contain"
        />

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

        {/* Loading bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.4 }}
          className="w-full flex flex-col items-center gap-2.5 pt-2"
        >
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#EC008C] animate-pulse" />
            <span className="text-slate-400 text-[10px] font-black uppercase tracking-[0.22em]">Loading</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#EC008C] animate-pulse" />
          </div>

          <div className="w-full h-[3px] bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 2.6, ease: 'easeInOut' }}
              className="h-full bg-gradient-to-r from-[#EC008C] to-[#ff47b3] rounded-full"
            />
          </div>
        </motion.div>

      </div>
    </div>
  );
};

export default SplashPage;
