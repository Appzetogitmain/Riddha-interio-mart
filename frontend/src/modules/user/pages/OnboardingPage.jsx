import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowLeft } from 'react-icons/fi';

const OnboardingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full bg-slate-50 flex items-center justify-center font-sans overflow-y-auto md:p-8">
      {/* Device wrapper for desktop, seamless on mobile */}
      <div className="w-full max-w-[420px] md:max-w-5xl min-h-screen md:min-h-[600px] md:h-[80vh] bg-white flex flex-col md:flex-row justify-between md:justify-start md:rounded-3xl md:shadow-2xl overflow-hidden relative border-none md:border-slate-100">
        
        {/* Back Button */}
        <button 
          onClick={() => navigate(-1)} 
          className="absolute top-6 left-6 p-2.5 bg-black/20 backdrop-blur-md text-white hover:bg-black/40 rounded-full transition-all z-20 shadow-sm md:bg-white/80 md:text-slate-800 md:shadow-md md:hover:bg-white"
          aria-label="Go Back"
        >
          <FiArrowLeft size={20} />
        </button>

        {/* Top Half / Left Half Desktop: Beautiful Interior Design Image */}
        <div className="h-[460px] md:h-full w-full md:w-1/2 relative bg-slate-100 overflow-hidden">
          <img 
            src="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&q=80&w=1000" 
            alt="Premium Living Room" 
            className="w-full h-full object-cover"
          />
        </div>

        {/* Bottom Half / Right Half Desktop: Premium Onboarding Content */}
        <motion.div 
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="flex-1 md:w-1/2 bg-white -mt-10 md:mt-0 rounded-t-[36px] md:rounded-none relative z-10 px-8 md:px-16 pt-10 md:pt-16 pb-8 md:pb-16 flex flex-col justify-between md:justify-center shadow-[0_-15px_30px_rgba(0,0,0,0.04)] md:shadow-none"
        >
          {/* Typography */}
          <div className="text-center md:text-left mt-2 md:mb-12">
            <h1 className="text-3xl md:text-5xl font-black text-slate-800 leading-[1.2] tracking-tight">
              Discover Materials<br className="md:hidden" /> <span className="hidden md:inline">&</span> Decor
            </h1>
            <p className="text-[15px] md:text-lg font-semibold text-slate-500 mt-3 md:mt-6 leading-relaxed max-w-xs md:max-w-md mx-auto md:mx-0">
              Discover homes and high-quality<br className="md:hidden" /> designed living rooms.
            </p>
          </div>

          <div className="w-full">
            {/* Active Pagination Dots */}
            <div className="flex items-center justify-center md:justify-start gap-2 mb-8 md:mb-10">
              <div className="w-8 md:w-10 h-1.5 md:h-2 bg-[#189D91] rounded-full"></div>
              <div className="w-1.5 md:w-2 h-1.5 md:h-2 bg-[#189D91]/30 rounded-full"></div>
              <div className="w-1.5 md:w-2 h-1.5 md:h-2 bg-[#189D91]/30 rounded-full"></div>
            </div>

            {/* Action Buttons */}
            <div className="w-full space-y-4 md:space-y-5 md:max-w-md">
              <button 
                onClick={() => navigate('/login')}
                className="w-full bg-[#EC008C] hover:bg-[#d8007e] text-white py-4 md:py-5 rounded-2xl font-bold text-[15px] md:text-base uppercase tracking-wider shadow-lg shadow-[#EC008C]/20 transition-all active:scale-[0.98]"
              >
                Continue
              </button>
              
              <button 
                onClick={() => navigate('/login')} 
                className="w-full text-center text-slate-400 hover:text-slate-600 font-bold text-[13px] md:text-[15px] uppercase tracking-wider transition-colors pt-1"
              >
                Skip
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default OnboardingPage;
