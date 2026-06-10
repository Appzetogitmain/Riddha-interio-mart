import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { FiMail, FiLock, FiEye, FiEyeOff, FiArrowLeft, FiShield } from 'react-icons/fi';
import api from '../../../shared/utils/api';
import { useUser } from '../../user/data/UserContext';
import logo from '../../../assets/transparent_logo.png';
import warehouseImg from '../../../assets/seller_onboarding_warehouse_1778923798789.png';

const SellerLoginForm = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useUser();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/seller/login', {
        email: identifier,
        password: password
      });

      if (response.data.success) {
        const { token, user } = response.data;
        login({ ...user, token });
        navigate('/seller/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row font-['Outfit'] overflow-hidden">
      {/* Left Section: Branding & Visual */}
      <motion.div 
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        className="hidden md:flex w-[40%] bg-[#FDF8F8] flex-col items-center justify-center p-16 relative overflow-hidden"
      >
        <div className="relative z-10 w-full max-w-sm space-y-12">
          <Link to="/" className="inline-block">
            <img src={logo} alt="Logo" className="h-24 md:h-28 w-auto object-contain" />
          </Link>

          <div className="space-y-6">
            <h1 className="text-6xl font-semibold text-slate-900 leading-tight tracking-tighter">
              Welcome <br />
              <span className="text-[#E36666] font-serif">Back.</span>
            </h1>
            <p className="text-slate-400 font-medium text-lg leading-relaxed">
              Access your seller dashboard and manage your business operations seamlessly.
            </p>
          </div>

          <div className="pt-10 border-t border-slate-200">
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-[#E36666]">
                   <FiShield size={24} />
                </div>
                <div>
                   <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Secure Access</p>
                   <p className="text-xl font-semibold text-slate-900">Partner Portal</p>
                </div>
             </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-[-10%] left-[-10%] w-60 h-60 bg-[#E36666]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] right-[-10%] w-80 h-80 bg-[#E36666]/5 rounded-full blur-3xl" />
      </motion.div>

      {/* Right Section: Form */}
      <div className="flex-1 min-h-screen bg-white flex flex-col items-center justify-start md:justify-center p-0 md:p-8 overflow-hidden">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full h-full md:h-auto md:max-w-[400px] flex flex-col px-8 py-12 md:p-0"
        >
          {/* Mobile Logo */}
          <div className="md:hidden flex justify-center mb-10">
            <img src={logo} alt="Logo" className="h-24 w-auto object-contain" />
          </div>

          <div className="mb-8 text-center md:text-left">
            <h2 className="text-3xl md:text-2xl font-semibold text-slate-900 tracking-tight mb-1">Sign In</h2>
            <p className="text-slate-400 font-semibold text-xs md:text-[8px] uppercase tracking-widest">Enter credentials to continue</p>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 p-3 bg-red-50 rounded-xl border border-red-100 text-red-500 text-[10px] md:text-[8px] font-semibold text-center uppercase tracking-widest"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleLogin} className="flex-1 flex flex-col space-y-6 md:space-y-3">
            <div className="space-y-1 md:space-y-0.5">
              <label className="text-[10px] md:text-[8px] font-semibold uppercase tracking-widest text-slate-400 ml-1">Email Address</label>
              <div className="relative group">
                <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 size-4 md:size-3" />
                <input
                  type="email"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="seller@example.com"
                  className="w-full pl-12 pr-4 py-4 md:py-2.5 md:pl-8 rounded-xl bg-[#FDF8F8] border-2 border-transparent focus:border-[#E36666]/20 focus:bg-white focus:outline-none text-sm md:text-[11px] font-medium text-slate-700 transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-1 md:space-y-0.5">
              <div className="flex justify-between items-center ml-1">
                <label className="text-[10px] md:text-[8px] font-semibold uppercase tracking-widest text-slate-400">Password</label>
                <Link to="/forgot-password?role=seller" size="sm" className="text-[10px] md:text-[8px] font-semibold uppercase tracking-widest text-[#E36666] hover:underline underline-offset-4">
                  Forgot?
                </Link>
              </div>
              <div className="relative group">
                <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 size-4 md:size-3" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-12 py-4 md:py-2.5 md:pl-8 rounded-xl bg-[#FDF8F8] border-2 border-transparent focus:border-[#E36666]/20 focus:bg-white focus:outline-none text-sm md:text-[11px] font-medium text-slate-700 transition-all"
                  required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300">
                  {showPassword ? <FiEyeOff size={18} md:size={12} /> : <FiEye size={18} md:size={12} />}
                </button>
              </div>
            </div>

            <motion.button
              whileTap={{ scale: 0.99 }}
              type="submit"
              disabled={loading}
              className="w-full py-5 md:py-3.5 bg-[#E36666] text-white rounded-2xl md:rounded-lg font-semibold text-xs md:text-[9px] uppercase tracking-[0.2em] shadow-xl shadow-[#E36666]/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-auto md:mt-0"
            >
              {loading ? 'Authenticating...' : (
                <>Login to Dashboard <FiArrowLeft className="rotate-180 size-4 md:size-2.5" /></>
              )}
            </motion.button>
          </form>

          <div className="mt-8 text-center space-y-4 md:space-y-3">
             <p className="text-xs md:text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                New here? <Link to="/seller/signup" className="text-[#E36666] font-semibold border-b border-[#E36666]/30 pb-0.5 ml-1">Join Now</Link>
             </p>
             <Link to="/seller/login" className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-all font-semibold text-[10px] md:text-[8px] uppercase tracking-widest">
                <FiArrowLeft size={12} md:size={10} /> Back to Welcome
             </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SellerLoginForm;
