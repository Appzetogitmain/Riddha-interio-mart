import React from "react";
import { motion } from "framer-motion";
import {
  LuClock,
  LuShieldCheck,
  LuFileSearch,
  LuMessageCircle,
  LuRefreshCw,
  LuLogOut,
} from "react-icons/lu";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../../user/models/UserContext";

const VerificationPending = () => {
  const navigate = useNavigate();
  const { logout } = useUser();

  const handleLogout = () => {
    logout();
    navigate("/seller/login");
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full text-center space-y-8"
      >
        {/* Animated Icon Container */}
        <div className="relative mx-auto w-32 h-32">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 border-4 border-dashed border-warm-sand/20 rounded-full"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 bg-warm-sand/10 rounded-3xl flex items-center justify-center text-warm-sand">
              <LuFileSearch size={40} />
            </div>
          </div>
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute -top-2 -right-2 w-8 h-8 bg-white border border-soft-oatmeal rounded-full shadow-sm flex items-center justify-center text-warm-sand"
          >
            <LuClock size={16} />
          </motion.div>
        </div>

        <div className="space-y-4">
          <h1 className="text-3xl md:text-5xl font-display font-black text-deep-espresso tracking-tight">
            Verification In Progress
          </h1>
          <p className="text-warm-sand max-w-md mx-auto leading-relaxed">
            Thank you for joining Riddha Interior Mart! Our admin team is
            currently reviewing your documents to ensure a premium marketplace
            experience.
          </p>
        </div>

        {/* Status Timeline */}
        <div className="bg-soft-oatmeal/20 rounded-[32px] p-8 border border-soft-oatmeal max-w-lg mx-auto overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-warm-sand/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />

          <div className="space-y-6 relative z-10">
            <div className="flex items-start gap-4 text-left">
              <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center flex-shrink-0 shadow-lg shadow-green-500/20">
                <LuShieldCheck size={18} />
              </div>
              <div>
                <h4 className="font-bold text-deep-espresso text-sm">
                  Application Received
                </h4>
                <p className="text-xs text-dusty-cocoa">
                  Your documents have been successfully uploaded.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 text-left">
              <div className="w-8 h-8 bg-warm-sand text-white rounded-full flex items-center justify-center flex-shrink-0 animate-pulse">
                <LuClock size={18} />
              </div>
              <div>
                <h4 className="font-bold text-deep-espresso text-sm">
                  Verification Underway
                </h4>
                <p className="text-xs text-dusty-cocoa">
                  Estimated completion: 24-48 business hours.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 text-left opacity-30">
              <div className="w-8 h-8 bg-soft-oatmeal text-warm-sand rounded-full flex items-center justify-center flex-shrink-0">
                <LuRefreshCw size={18} />
              </div>
              <div>
                <h4 className="font-bold text-deep-espresso text-sm">
                  Ready to Sell
                </h4>
                <p className="text-xs text-dusty-cocoa">
                  Access your dashboard and start listing products.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <button
            onClick={() => window.location.reload()}
            className="w-full sm:w-auto px-8 py-4 bg-deep-espresso text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-warm-sand transition-all shadow-xl shadow-deep-espresso/10 flex items-center justify-center gap-2 group"
          >
            <LuRefreshCw
              size={16}
              className="group-hover:rotate-180 transition-transform duration-500"
            />
            Check Status
          </button>
          <button className="w-full sm:w-auto px-8 py-4 bg-white border border-soft-oatmeal text-deep-espresso rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-soft-oatmeal transition-all flex items-center justify-center gap-2 group">
            <LuMessageCircle
              size={16}
              className="group-hover:translate-y-[-2px] transition-transform"
            />
            Contact Support
          </button>
        </div>

        <button
          onClick={handleLogout}
          className="text-[10px] font-black text-warm-sand/50 hover:text-red-500 uppercase tracking-[0.2em] transition-colors flex items-center gap-2 mx-auto pt-8"
        >
          <LuLogOut size={12} />
          Switch Account / Logout
        </button>
      </motion.div>
    </div>
  );
};

export default VerificationPending;
