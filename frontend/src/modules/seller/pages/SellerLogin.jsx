import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { ChevronRight, ArrowRight, Info, Globe, ShieldCheck, Zap } from 'lucide-react';
import warehouseImg from '../../../assets/seller_onboarding_warehouse_1778923798789.png';
import logo from "../../../assets/transparent_logo.png";

const SellerLogin = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#f1f5f9] flex items-center justify-center font-['Outfit'] p-0 md:p-6">
      <div className="w-full max-w-4xl h-auto md:h-[78vh] md:min-h-[540px] bg-white md:rounded-3xl md:shadow-2xl overflow-hidden flex flex-col md:flex-row">

        {/* Left Section: Image */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full md:w-[52%] h-52 md:h-full relative overflow-hidden shrink-0"
        >
          <motion.img
            initial={{ scale: 1.06 }}
            animate={{ scale: 1 }}
            transition={{ duration: 2 }}
            src={warehouseImg}
            alt="Warehouse"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/50 via-slate-900/20 to-transparent" />

          {/* Logo on image */}
          <div className="absolute top-6 left-8 z-20 hidden md:block">
            <img src={logo} alt="Logo" className="h-14 w-auto object-contain brightness-0 invert" />
          </div>

          {/* Floating card — bottom of image */}
          <div className="absolute bottom-6 left-6 right-6 z-20 hidden md:block">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white/10 backdrop-blur-xl p-5 rounded-2xl border border-white/20 shadow-xl"
            >
              <h2 className="text-xl font-bold text-white leading-snug mb-3">
                The future of <span className="text-[#E36666]">Interior Materials</span> starts here.
              </h2>
              <div className="flex gap-6">
                <div>
                  <span className="text-lg font-bold text-[#E36666]">5000+</span>
                  <div className="text-[9px] font-bold text-white/60 uppercase tracking-widest">Active Sellers</div>
                </div>
                <div className="w-px bg-white/15" />
                <div>
                  <span className="text-lg font-bold text-[#E36666]">Pan-India</span>
                  <div className="text-[9px] font-bold text-white/60 uppercase tracking-widest">Delivery Network</div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Right Section: Content */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full md:w-[48%] bg-[#FDF8F8] flex flex-col justify-center items-center px-6 py-8 md:px-10 shrink-0"
        >
          {/* Mobile logo */}
          <div className="mb-5 md:hidden shrink-0">
            <img src={logo} alt="Logo" className="h-12 w-auto object-contain" />
          </div>

          <div className="w-full max-w-[360px] flex flex-col items-center text-center shrink-0">
            {/* Dots */}
            <div className="flex gap-2 mb-5 shrink-0">
              <div className="w-6 h-1.5 bg-[#E36666] rounded-full" />
              <div className="w-2 h-1.5 bg-slate-200 rounded-full" />
              <div className="w-2 h-1.5 bg-slate-200 rounded-full" />
            </div>

            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 leading-[1.15] mb-3 tracking-tight">
              Join India's Largest <br />
              <span className="text-[#E36666]">Interior Materials</span><br />
              Market.
            </h1>

            <p className="text-xs font-medium text-slate-400 mb-6 leading-relaxed max-w-xs">
              Empower your business with direct access to millions of premium customers across the country.
            </p>

            <div className="w-full space-y-3">
              <motion.button
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/seller/signup')}
                className="w-full py-3.5 bg-[#E36666] text-white rounded-2xl font-bold text-[11px] uppercase tracking-[0.18em] shadow-lg shadow-[#E36666]/25 transition-all flex items-center justify-center gap-2"
              >
                Join as a Seller <ArrowRight size={15} />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => navigate('/seller/login-form')}
                className="w-full py-3.5 border-2 border-slate-200 text-slate-900 rounded-2xl font-bold text-[11px] uppercase tracking-[0.18em] hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
              >
                Login to Dashboard
              </motion.button>
            </div>

            {/* Trust bar */}
            <div className="mt-6 pt-5 border-t border-slate-100 w-full grid grid-cols-3 gap-3">
              <div className="flex flex-col items-center gap-1.5">
                <div className="w-8 h-8 rounded-xl bg-white shadow-sm flex items-center justify-center text-[#189D91]">
                  <Globe size={15} />
                </div>
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider text-center">Pan India</span>
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <div className="w-8 h-8 rounded-xl bg-white shadow-sm flex items-center justify-center text-[#189D91]">
                  <ShieldCheck size={15} />
                </div>
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider text-center">Secure Pay</span>
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <div className="w-8 h-8 rounded-xl bg-white shadow-sm flex items-center justify-center text-[#189D91]">
                  <Zap size={15} />
                </div>
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider text-center">Fast Growth</span>
              </div>
            </div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mt-5 text-[11px] font-bold text-slate-400"
            >
              Already a partner?{' '}
              <Link to="/seller/login-form" className="text-slate-900 underline decoration-[#E36666] decoration-2 underline-offset-4 hover:text-[#E36666] transition-colors">
                Sign In Now
              </Link>
            </motion.p>
          </div>
        </motion.div>

      </div>
    </div>
  );
};

export default SellerLogin;
