import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useUser } from '../data/UserContext';
import { FiArrowLeft, FiUser, FiLock, FiEye, FiEyeOff, FiCheck } from 'react-icons/fi';

import Button from '../../../shared/components/Button';
import LOGIN_BG from '../../../assets/login_bg_fretshop.png';
import api from '../../../shared/utils/api';
import logo from '../../../assets/transparent_logo.png';

const LoginPage = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [rbacRole, setRbacRole] = useState('admin');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const { login, loading, setLoading } = useUser();
  const navigate = useNavigate();
  const location = useLocation();

  const getRole = () => {
    if (location.pathname.startsWith('/admin')) return 'admin';
    if (location.pathname.startsWith('/seller')) return 'seller';
    if (location.pathname.startsWith('/delivery')) return 'delivery';
    return 'user';
  };

  const role = getRole();
  const isDelivery = role === 'delivery';
  const isDesktop = typeof window !== 'undefined' ? window.innerWidth >= 768 : false;
  
  // Unified signature brand colors
  const theme = {
    primaryBtn: isDelivery ? 'bg-[#2A458A] hover:opacity-90' : 'bg-[#189D91] hover:opacity-90',
    accentText: isDelivery ? 'text-[#2A458A]' : 'text-[#189D91]',
    focusBorder: isDelivery ? 'focus:border-[#2A458A] focus:ring-[#2A458A]/5' : 'focus:border-[#189D91] focus:ring-[#189D91]/5',
    iconFocus: isDelivery ? 'group-focus-within:text-[#2A458A]' : 'group-focus-within:text-[#189D91]',
    checkboxBg: isDelivery ? 'bg-[#2A458A] border-[#2A458A]' : 'bg-[#189D91] border-[#189D91]',
    ambientGlow: isDelivery ? 'bg-[#2A458A]/10' : 'bg-[#189D91]/10',
    lineGlow: isDelivery ? 'from-[#2A458A]' : 'from-[#189D91]'
  };

  const getSignupPath = () => {
    if (role === 'admin') return null;
    if (role === 'seller') return '/seller/signup';
    if (role === 'delivery') return '/delivery/signup';
    return '/signup';
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const authPath = role === 'admin' 
        ? '/auth/admin/login' 
        : role === 'seller' 
          ? '/auth/seller/login' 
          : role === 'delivery' 
            ? '/auth/delivery/login' 
            : '/auth/user/login';

      const response = await api.post(authPath, {
        email: identifier,
        password: password
      });

      if (response.data.success) {
        const { token, user } = response.data;
        login({ ...user, token });
        if (role === 'admin') navigate('/admin/dashboard');
        else if (role === 'seller') navigate('/seller/dashboard');
        else if (role === 'delivery') navigate('/delivery/dashboard');
        else navigate('/');
      }
    } catch (err) {
      if (err.response?.data?.unverified) {
        setUnverifiedEmail(err.response.data.email);
        setError('Please verify your email to continue.');
      } else {
        setError(err.response?.data?.error || 'Invalid credentials. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendAndVerify = async () => {
    try {
      setLoading(true);
      await api.post('/auth/resend-otp', { email: unverifiedEmail });
      navigate('/verify-email', { state: { email: unverifiedEmail } });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  if (role === 'user') {
    return (
      <div className="min-h-screen w-full bg-[radial-gradient(circle_at_top_left,rgba(24,157,145,0.06),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(236,0,140,0.04),transparent_28%),linear-gradient(180deg,#f8fafc_0%,#f1f5f9_100%)] flex items-center justify-center font-sans overflow-y-auto md:p-8">
        {/* Device wrapper for desktop, seamless on mobile */}
        <div className="w-full max-w-[420px] md:max-w-5xl min-h-screen md:min-h-[600px] md:h-[80vh] bg-white flex flex-col md:flex-row justify-between md:justify-start md:rounded-3xl md:shadow-2xl overflow-hidden relative border-none md:border-slate-100">
          
          {/* Back Button */}
          <button 
            onClick={() => navigate(-1)} 
            className="absolute top-6 left-6 p-2 md:p-2.5 bg-slate-50 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all border border-slate-100 shadow-sm md:bg-white/80 md:shadow-md z-50"
            aria-label="Go Back"
          >
            <FiArrowLeft size={18} />
          </button>

          {/* Left Image Desktop */}
          <div className="hidden md:block md:w-1/2 md:h-full relative bg-slate-100 overflow-hidden border-r border-slate-100">
             <img src={LOGIN_BG} alt="Luxury Showroom" className="w-full h-full object-cover" />
             <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(246,249,252,0.92)_0%,rgba(246,249,252,0.6)_100%)]" />
             <div className="relative z-10 h-full flex flex-col justify-center px-12 xl:px-16">
               <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/70 border border-white/90 shadow-sm w-fit mb-4">
                 <span className="w-2 h-2 rounded-full bg-[#189D91]" />
                 <span className="text-[10px] font-black uppercase tracking-[0.22em] text-[#189D91]">Premium Interior Mart</span>
               </div>
               <h1 className="text-4xl xl:text-5xl font-black leading-[1.1] tracking-tight text-slate-950 mb-4">
                 Sign in to your<br/>
                 <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#189D91] via-slate-700 to-[#EC008C]">
                   Riddha account
                 </span>
               </h1>
               <p className="max-w-md text-sm xl:text-base font-medium leading-relaxed text-slate-600">
                 Access saved addresses, order tracking, wishlist items, and faster checkout with a cleaner desktop experience.
               </p>
             </div>
          </div>

          <div className="flex-1 md:w-1/2 w-full flex flex-col justify-between py-12 px-8 md:px-12 xl:px-16 items-center md:items-start overflow-y-auto">
            {/* Logo */}
            <div className="mt-8 md:mt-0 mb-8 w-full max-w-[200px] flex justify-center md:justify-start">
              <img src={logo} alt="Interio Mega Mart" className="w-full h-auto object-contain" />
            </div>

            {error && (
              <div className="w-full mb-4 p-3.5 bg-rose-50 border border-rose-100 rounded-xl text-center md:text-left">
                <span className="text-rose-600 text-[10px] font-bold uppercase tracking-wider leading-relaxed">{error}</span>
                {unverifiedEmail && (
                  <button onClick={handleResendAndVerify} className="block mt-2 mx-auto md:mx-0 bg-rose-600 text-white px-4 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest hover:bg-rose-700">
                    Verify Email
                  </button>
                )}
              </div>
            )}

            <form onSubmit={handleLogin} className="w-full space-y-5 flex-1 flex flex-col justify-center">
              {/* Phone or Email Input */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 ml-0.5">Phone Number</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="or Email"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50/85 border border-slate-200/80 rounded-xl focus:bg-white focus:border-[#189D91] outline-none transition-all text-xs font-bold text-slate-800 placeholder:text-slate-400 placeholder:font-semibold shadow-sm"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center px-0.5">
                  <label className="text-[11px] font-bold text-slate-700">Password</label>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-4 pr-12 py-3 bg-slate-50/85 border border-slate-200/80 rounded-xl focus:bg-white focus:border-[#189D91] outline-none transition-all text-xs font-bold text-slate-800 placeholder:text-slate-400 placeholder:font-semibold shadow-sm"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                    {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between px-0.5 pt-1">
                <button 
                  type="button" 
                  onClick={() => setRememberMe(!rememberMe)} 
                  className="flex items-center gap-2 group"
                >
                  <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${rememberMe ? 'bg-[#189D91] border-[#189D91]' : 'border-slate-200 bg-white'}`}>
                    {rememberMe && <FiCheck className="text-white text-[10px] stroke-[4]" />}
                  </div>
                  <span className="text-[10px] font-bold text-slate-400">Remember Me</span>
                </button>
                <button type="button" onClick={() => navigate('/forgot-password')} className="text-[10px] font-bold text-[#189D91] hover:underline">Forgot?</button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#8A3B8B] hover:bg-[#722b73] text-white py-3.5 rounded-full font-bold text-[14px] uppercase tracking-wider transition-all active:scale-[0.98] shadow-md shadow-[#8A3B8B]/20 mt-6"
              >
                {loading ? 'Authenticating...' : 'LOGIN'}
              </button>
            </form>

            {/* Create Account */}
            <div className="mt-8 text-center md:text-left w-full flex justify-center md:justify-start">
              <Link to="/signup" className="text-[12px] font-bold text-slate-400 hover:text-slate-600 tracking-wider">
                Create Account
              </Link>
            </div>

            {/* Footer Copyright */}
            <div className="mt-auto pt-6 w-full md:hidden">
              <p className="text-center text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                © {new Date().getFullYear()} Riddha Interio Mart.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex font-sans bg-[radial-gradient(circle_at_top_left,rgba(24,157,145,0.10),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(236,0,140,0.08),transparent_28%),linear-gradient(180deg,#f8fafc_0%,#f2f7f7_100%)] items-center justify-center lg:p-8">
      <div className="flex w-full lg:max-w-5xl lg:h-[80vh] lg:min-h-[600px] bg-white lg:rounded-3xl lg:shadow-2xl overflow-hidden relative lg:border lg:border-slate-100 flex-col lg:flex-row">
        {/* Left Section - Branded, Bright & Clean (No Dark Colors!) */}
        <div className="hidden lg:flex flex-[1.08] relative items-center justify-center overflow-hidden bg-gradient-to-br from-teal-50/50 via-slate-50 to-pink-50/30 border-r border-slate-200/80">
          {/* Soft logo related gradients */}
          <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-[var(--color-primary)]/5 rounded-full blur-[120px] pointer-events-none -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-[var(--color-accent-pink)]/5 rounded-full blur-[100px] pointer-events-none translate-x-1/3 translate-y-1/3" />
          
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative z-10 max-w-xl w-full px-10 xl:px-14 py-10 text-center flex flex-col items-center"
          >
            {/* Logo Frame */}
            <div className="mb-7 w-full max-w-[250px]">
               <img 
                 src={logo} 
                 alt="Riddha Logo" 
                 className="w-full h-auto object-contain" 
               />
            </div>

            {/* Typography Area */}
            <div className="space-y-3 text-center max-w-[460px]">
               <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/80 border border-white/90 rounded-full shadow-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)]" />
                  <span className="text-[10px] font-bold text-[var(--color-primary)] uppercase tracking-wider leading-none">
                     Premium Interior Mart
                  </span>
               </div>

               <h2 className="text-[2.1rem] xl:text-4xl font-black text-slate-950 tracking-tight leading-[1.02]">
                  India's Premium <br/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-800 via-slate-700 to-[var(--color-primary)] font-black">Interior & Design Hub</span>
               </h2>

               <p className="text-slate-700 text-sm xl:text-base font-medium leading-relaxed max-w-md mx-auto">
                  Curating premium architectural collection of luxury fittings and design setups.
               </p>
            </div>
          </motion.div>
        </div>

        {/* Right Section - Login Form */}
        <div className="flex w-full lg:flex-[0.92] flex-col justify-center bg-transparent relative px-6 sm:px-12 lg:px-16 py-12 min-h-screen lg:min-h-0 overflow-y-auto">
          <div className="w-full max-w-[460px] mx-auto lg:mx-0 lg:max-w-none">
            {/* Mobile Logo */}
            <div className="lg:hidden mb-8 flex justify-center">
              <img src={logo} alt="Riddha Logo" className="w-48 md:w-56 h-auto object-contain" />
            </div>

          {/* Header */}
          <div className="mb-6 flex items-center justify-between gap-4 max-w-[460px]">
            <div>
                <h1 className="text-2xl xl:text-[2rem] font-black text-slate-900 tracking-tight">Log In</h1>
                <p className="text-sm font-semibold text-slate-500 mt-1 capitalize">Access your secure {role} panel</p>
            </div>
            <Link to="/" className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors border border-slate-100 shrink-0">
                <FiArrowLeft size={16} />
            </Link>
          </div>

          {/* Role Selection Switch (Compact pill toggle) */}
          {role === 'admin' && (
            <div className="mb-5 p-1 bg-slate-100 rounded-2xl border border-slate-200/60 flex max-w-[460px]">
              <button
                type="button"
                onClick={() => setRbacRole('admin')}
                className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${rbacRole === 'admin' ? 'bg-[#189D91] text-white shadow-sm shadow-[#189D91]/20' : 'text-slate-600 hover:text-slate-800'}`}
              >
                Super Admin
              </button>
              <button
                type="button"
                onClick={() => setRbacRole('assistant')}
                className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${rbacRole === 'assistant' ? 'bg-[#EC008C] text-white shadow-sm shadow-[#EC008C]/20' : 'text-slate-600 hover:text-slate-800'}`}
              >
                Assistant
              </button>
            </div>
          )}

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="mb-5 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex flex-col items-center gap-2 max-w-[460px]"
              >
                <span className="text-rose-600 text-[10px] font-bold uppercase tracking-wider text-center leading-relaxed">{error}</span>
                {unverifiedEmail && (
                  <button onClick={handleResendAndVerify} className="bg-rose-600 text-white px-5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-rose-700 transition-colors">
                    Verify Email
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleLogin} className="space-y-4 max-w-[460px]">
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 ml-0.5">Email Address</label>
                <div className="relative group">
                  <FiUser className={`absolute left-4 top-1/2 -translate-y-1/2 text-slate-350 ${theme.iconFocus} transition-colors`} size={16} />
                  <input
                    type="text"
                    placeholder="name@example.com"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className={`w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white ${theme.focusBorder} outline-none transition-all text-sm font-semibold text-slate-700 placeholder:text-slate-300`}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center px-0.5">
                    <label className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Password</label>
                    <button type="button" onClick={() => navigate('/forgot-password')} className={`text-[10px] font-black ${theme.accentText} uppercase tracking-[0.18em] hover:underline`}>Forgot?</button>
                </div>
                <div className="relative group">
                  <FiLock className={`absolute left-4 top-1/2 -translate-y-1/2 text-slate-355 ${theme.iconFocus} transition-colors`} size={16} />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white ${theme.focusBorder} outline-none transition-all text-sm font-semibold text-slate-700 placeholder:text-slate-300`}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500">
                    {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 px-0.5 pt-1">
              <button 
                type="button" 
                onClick={() => setRememberMe(!rememberMe)} 
                className="flex items-center gap-2 group"
              >
                <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${rememberMe ? theme.checkboxBg : 'border-slate-200 bg-white group-hover:border-slate-300'}`}>
                  {rememberMe && <FiCheck className="text-white text-[10px] stroke-[4]" />}
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 group-hover:text-slate-600 transition-colors">Remember Me</span>
              </button>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className={`w-full py-3.5 rounded-2xl ${theme.primaryBtn} text-white font-black text-[11px] uppercase tracking-[0.22em] transition-all active:scale-[0.98] mt-3`}
            >
              {loading ? 'Authenticating...' : 'Sign In Now'}
            </Button>



            {getSignupPath() && (
              <div className="pt-2">
                <Link
                  to={getSignupPath()}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-2xl border border-[#189D91]/20 bg-[#189D91]/8 px-5 py-3.5 text-[11px] font-black uppercase tracking-[0.22em] text-[#189D91] hover:bg-[#189D91]/12 hover:border-[#189D91]/30 transition-all shadow-sm"
                >
                  Create Account
                </Link>
              </div>
            )}
          </form>
        </div>
      </div>
      </div>

      {/* Footer Info */}
      <div className="absolute bottom-4 left-0 right-0 text-center pointer-events-none hidden lg:block">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
              © {new Date().getFullYear()} Riddha Interio Mart. All Rights Reserved.
          </p>
      </div>
    </div>
  );
};

export default LoginPage;
