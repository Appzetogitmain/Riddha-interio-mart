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
        const { token, user } = response.data.data;
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
    <div className="min-h-screen bg-[#f1f5f9] flex items-center justify-center font-['Outfit'] p-6">
      <div className="w-full max-w-4xl bg-white md:rounded-3xl md:shadow-2xl overflow-hidden flex flex-col md:flex-row">

        {/* Left Panel */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          className="hidden md:flex w-[42%] bg-[#FDF8F8] flex-col items-start justify-center px-10 py-10 relative overflow-hidden border-r border-slate-100"
        >
          <div className="relative z-10 w-full space-y-8">
            <Link to="/" className="inline-block">
              <img src={logo} alt="Logo" className="h-16 w-auto object-contain" />
            </Link>

            <div className="space-y-3">
              <h1 className="text-4xl font-semibold text-slate-900 leading-tight tracking-tighter">
                Welcome <br />
                <span className="text-[#E36666] font-serif">Back.</span>
              </h1>
              <p className="text-slate-400 font-medium text-sm leading-relaxed max-w-xs">
                Access your seller dashboard and manage your business operations seamlessly.
              </p>
            </div>

            <div className="pt-6 border-t border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-[#E36666]">
                  <FiShield size={18} />
                </div>
                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-widest text-slate-400">Secure Access</p>
                  <p className="text-sm font-semibold text-slate-900">Partner Portal</p>
                </div>
              </div>
            </div>
          </div>

          <div className="absolute top-[-10%] left-[-10%] w-52 h-52 bg-[#E36666]/5 rounded-full blur-3xl" />
          <div className="absolute bottom-[-10%] right-[-10%] w-64 h-64 bg-[#E36666]/5 rounded-full blur-3xl" />
        </motion.div>

        {/* Right Panel — Form */}
        <div className="flex-1 bg-white flex flex-col justify-center px-8 py-10 md:px-12">
          {/* Mobile logo */}
          <div className="md:hidden flex justify-center mb-6">
            <img src={logo} alt="Logo" className="h-14 w-auto object-contain" />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-[380px] mx-auto"
          >
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-slate-900 tracking-tight">Seller Login</h2>
              <p className="text-slate-400 font-semibold text-[10px] uppercase tracking-widest mt-1">
                Enter credentials to continue
              </p>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-4 p-3 bg-red-50 rounded-xl border border-red-100 text-red-500 text-[10px] font-semibold text-center uppercase tracking-widest"
              >
                {error}
              </motion.div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              {/* Email */}
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 ml-0.5">
                  Email Address
                </label>
                <div className="relative">
                  <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" size={15} />
                  <input
                    type="email"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="seller@example.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#FDF8F8] border-2 border-transparent focus:border-[#E36666]/30 focus:bg-white focus:outline-none text-[12px] font-medium text-slate-700 transition-all"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1">
                <div className="flex justify-between items-center ml-0.5">
                  <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                    Password
                  </label>
                  <Link
                    to="/forgot-password?role=seller"
                    className="text-[10px] font-semibold uppercase tracking-widest text-[#E36666] hover:underline underline-offset-4"
                  >
                    Forgot?
                  </Link>
                </div>
                <div className="relative">
                  <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" size={15} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#FDF8F8] border-2 border-transparent focus:border-[#E36666]/30 focus:bg-white focus:outline-none text-[12px] font-medium text-slate-700 transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500"
                  >
                    {showPassword ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <motion.button
                whileTap={{ scale: 0.99 }}
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#E36666] text-white rounded-xl font-semibold text-[11px] uppercase tracking-[0.18em] shadow-lg shadow-[#E36666]/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
              >
                {loading ? 'Authenticating...' : (
                  <>Login to Dashboard <FiArrowLeft className="rotate-180" size={14} /></>
                )}
              </motion.button>
            </form>

            <div className="mt-6 text-center space-y-3">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
                New here?{' '}
                <Link to="/seller/signup" className="text-[#E36666] font-semibold border-b border-[#E36666]/30 pb-0.5">
                  Join Now
                </Link>
              </p>
              <Link
                to="/seller/login"
                className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-900 transition-all font-semibold text-[10px] uppercase tracking-widest"
              >
                <FiArrowLeft size={11} /> Back to Welcome
              </Link>
            </div>
          </motion.div>
        </div>

      </div>
    </div>
  );
};

export default SellerLoginForm;
