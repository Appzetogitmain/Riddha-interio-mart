import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { FiMail, FiLock, FiEye, FiEyeOff, FiArrowLeft, FiShield, FiCheckCircle, FiRefreshCw } from 'react-icons/fi';
import api from '../../../shared/utils/api';
import { useUser } from '../../user/data/UserContext';
import logo from '../../../assets/transparent_logo.png';
import toast from 'react-hot-toast';

const SellerLoginForm = () => {
  const [step, setStep] = useState('login'); // 'login' | 'verify'
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // OTP Verification specific state
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const [unverifiedPhone, setUnverifiedPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  const { login } = useUser();
  const navigate = useNavigate();

  // Handle resend countdown timer
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
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
      if (err.response?.data?.isUnverified) {
        setUnverifiedEmail(err.response.data.email || identifier);
        setUnverifiedPhone(err.response.data.phone || '');
        setStep('verify');
        setError('Your email is not verified yet. Please enter your verification OTP.');
        toast.error('Please verify your account OTP to continue.');
      } else {
        setError(err.response?.data?.error || 'Invalid credentials. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp || otp.trim().length < 4) {
      setError('Please enter a valid OTP code');
      return;
    }

    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const response = await api.post('/auth/seller/verify-otp', {
        email: unverifiedEmail,
        phone: unverifiedPhone,
        otp: otp.trim()
      });

      if (response.data.success) {
        toast.success('Account verified successfully! Please log in.');
        setSuccessMsg('Account verified! You can now log in with your credentials.');
        setStep('login');
        setOtp('');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid or expired OTP code.');
      toast.error(err.response?.data?.error || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const response = await api.post('/auth/seller/resend-otp', {
        email: unverifiedEmail || identifier,
        phone: unverifiedPhone
      });

      if (response.data.success) {
        toast.success(response.data.message || 'New OTP sent to your email!');
        setSuccessMsg(`New OTP sent to ${unverifiedEmail || identifier}.`);
        setResendCooldown(60);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to resend OTP code.');
      toast.error(err.response?.data?.error || 'Failed to resend OTP');
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
                {step === 'verify' ? 'Verify' : 'Welcome'} <br />
                <span className="text-[#E36666] font-serif">{step === 'verify' ? 'Account.' : 'Back.'}</span>
              </h1>
              <p className="text-slate-400 font-medium text-sm leading-relaxed max-w-xs">
                {step === 'verify' 
                  ? 'Verify your registered email address to activate your partner profile and begin selling.'
                  : 'Access your seller dashboard and manage your business operations seamlessly.'}
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

        {/* Right Panel — Forms */}
        <div className="flex-1 bg-white flex flex-col justify-center px-8 py-10 md:px-12">
          {/* Mobile logo */}
          <div className="md:hidden flex justify-center mb-6">
            <img src={logo} alt="Logo" className="h-14 w-auto object-contain" />
          </div>

          <AnimatePresence mode="wait">
            {step === 'login' ? (
              <motion.div
                key="login-step"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="w-full max-w-[380px] mx-auto"
              >
                <div className="mb-6">
                  <h2 className="text-2xl font-semibold text-slate-900 tracking-tight">Seller Login</h2>
                  <p className="text-slate-400 font-semibold text-[10px] uppercase tracking-widest mt-1">
                    Enter credentials to continue
                  </p>
                </div>

                {successMsg && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mb-4 p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-600 text-[10px] font-semibold text-center uppercase tracking-widest"
                  >
                    {successMsg}
                  </motion.div>
                )}

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
            ) : (
              <motion.div
                key="verify-step"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="w-full max-w-[380px] mx-auto"
              >
                <div className="mb-6">
                  <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-3 border border-amber-200">
                    <FiShield size={22} />
                  </div>
                  <h2 className="text-2xl font-semibold text-slate-900 tracking-tight">Verify Account</h2>
                  <p className="text-slate-500 font-medium text-xs mt-1 leading-relaxed">
                    We sent a verification code to <span className="font-bold text-slate-900">{unverifiedEmail || identifier}</span>
                  </p>
                </div>

                {successMsg && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mb-4 p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-600 text-[10px] font-semibold text-center uppercase tracking-widest"
                  >
                    {successMsg}
                  </motion.div>
                )}

                {error && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mb-4 p-3 bg-red-50 rounded-xl border border-red-100 text-red-500 text-[10px] font-semibold text-center uppercase tracking-widest"
                  >
                    {error}
                  </motion.div>
                )}

                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  {/* OTP Input */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 ml-0.5">
                      6-Digit OTP Code
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="123456"
                      className="w-full text-center tracking-[0.4em] font-mono py-3 rounded-xl bg-[#FDF8F8] border-2 border-transparent focus:border-[#E36666]/30 focus:bg-white focus:outline-none text-lg font-bold text-slate-800 transition-all"
                      required
                      autoFocus
                    />
                  </div>

                  {/* Verify Button */}
                  <motion.button
                    whileTap={{ scale: 0.99 }}
                    type="submit"
                    disabled={loading || otp.length < 4}
                    className="w-full py-3 bg-[#E36666] text-white rounded-xl font-semibold text-[11px] uppercase tracking-[0.18em] shadow-lg shadow-[#E36666]/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
                  >
                    {loading ? 'Verifying OTP...' : (
                      <>Verify & Continue <FiCheckCircle size={14} /></>
                    )}
                  </motion.button>
                </form>

                {/* Resend OTP & Back to Login */}
                <div className="mt-6 pt-4 border-t border-slate-100 text-center space-y-3">
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={loading || resendCooldown > 0}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#E36666] hover:text-[#c94949] disabled:opacity-50 transition-colors"
                  >
                    <FiRefreshCw size={13} className={loading ? 'animate-spin' : ''} />
                    {resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : 'Resend OTP to Email'}
                  </button>

                  <div>
                    <button
                      type="button"
                      onClick={() => {
                        setStep('login');
                        setError('');
                        setSuccessMsg('');
                      }}
                      className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-800 font-semibold text-[10px] uppercase tracking-widest transition-colors"
                    >
                      <FiArrowLeft size={11} /> Back to Login
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
};

export default SellerLoginForm;
