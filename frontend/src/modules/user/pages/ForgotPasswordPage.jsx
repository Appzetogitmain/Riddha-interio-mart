import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMail, FiLock, FiEye, FiEyeOff, FiArrowLeft } from 'react-icons/fi';
import api from '../../../shared/utils/api';
import logo from '../../../assets/transparent_logo.png';

const ForgotPasswordPage = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const navigate = useNavigate();

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email) return setError('Please enter your email address');
    
    setLoading(true);
    setError('');
    try {
      const response = await api.post('/auth/forgotpassword', { email });
      if (response.data.success) {
        setStep(2);
        setSuccessMsg('An OTP has been sent to your email.');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Could not send OTP. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!otp || !password || !confirmPassword) {
      return setError('Please fill in all fields');
    }
    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }

    setLoading(true);
    setError('');
    try {
      const response = await api.put('/auth/resetpassword', { email, otp, password });
      if (response.data.success) {
        alert('Password successfully reset! Please login with your new password.');
        navigate('/login');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Could not reset password. Invalid or expired OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex font-['Outfit'] bg-[radial-gradient(circle_at_top_left,rgba(24,157,145,0.06),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(227,102,102,0.08),transparent_28%),linear-gradient(180deg,#f8fafc_0%,#f1f5f9_100%)] items-center justify-center p-4 lg:p-8">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-md bg-white p-8 lg:p-10 rounded-3xl shadow-xl border border-slate-100 relative"
      >
        <div className="flex justify-center mb-8">
          <img src={logo} alt="Logo" className="h-20 w-auto object-contain" />
        </div>

        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Reset Password</h2>
          <p className="text-sm font-medium text-slate-500">Secure Account Recovery</p>
        </div>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-6 p-3 bg-red-50 rounded-xl border border-red-100 text-red-500 text-[10px] font-semibold text-center uppercase tracking-widest">
              {error}
            </motion.div>
          )}
          {successMsg && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-6 p-3 bg-green-50 rounded-xl border border-green-100 text-green-500 text-[10px] font-semibold text-center uppercase tracking-widest">
              {successMsg}
            </motion.div>
          )}
        </AnimatePresence>

        {step === 1 ? (
          <form onSubmit={handleSendOtp} className="space-y-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 ml-1">Registered Email</label>
              <div className="relative group">
                <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 size-4" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-[#FDF8F8] border-2 border-transparent focus:border-[#E36666]/20 focus:bg-white focus:outline-none text-sm font-medium text-slate-700 transition-all placeholder:text-slate-400"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 bg-[#E36666] hover:bg-[#d15555] text-white rounded-xl font-semibold text-xs uppercase tracking-[0.2em] shadow-lg shadow-[#E36666]/20 transition-all disabled:opacity-50 ${loading ? 'opacity-50' : ''}`}
            >
              {loading ? 'Sending OTP...' : 'Send Recovery OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 ml-1">Enter OTP</label>
              <input
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                className="w-full text-center tracking-[0.5em] text-2xl py-4 rounded-xl bg-[#FDF8F8] border-2 border-transparent focus:border-[#E36666]/20 focus:bg-white focus:outline-none text-slate-700 font-bold transition-all placeholder:tracking-normal placeholder:text-sm placeholder:text-slate-400"
                placeholder="6-digit code"
                required
              />
            </div>

            <div className="space-y-1.5 relative group">
              <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 ml-1">New Password</label>
              <div className="relative">
                <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 size-4" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-12 py-3.5 rounded-xl bg-[#FDF8F8] border-2 border-transparent focus:border-[#E36666]/20 focus:bg-white focus:outline-none text-sm font-medium text-slate-700 transition-all placeholder:text-slate-400"
                  placeholder="••••••••"
                  required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPassword ? <FiEyeOff className="size-4" /> : <FiEye className="size-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5 relative group">
              <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 ml-1">Confirm Password</label>
              <div className="relative">
                <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 size-4" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-11 pr-12 py-3.5 rounded-xl bg-[#FDF8F8] border-2 border-transparent focus:border-[#E36666]/20 focus:bg-white focus:outline-none text-sm font-medium text-slate-700 transition-all placeholder:text-slate-400"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 mt-2 bg-[#E36666] hover:bg-[#d15555] text-white rounded-xl font-semibold text-xs uppercase tracking-[0.2em] shadow-lg shadow-[#E36666]/20 transition-all disabled:opacity-50 ${loading ? 'opacity-50' : ''}`}
            >
              {loading ? 'Resetting...' : 'Update Password'}
            </button>
          </form>
        )}

        <div className="mt-8 text-center">
          <Link to="/login" className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-all font-bold text-[10px] uppercase tracking-widest">
            <FiArrowLeft /> Back to Login
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPasswordPage;
