import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import Button from '../../../shared/components/Button';
import api from '../../../shared/utils/api';

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
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const role = queryParams.get('role') || 'user';

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email) return setError('Please enter your email address');
    
    setLoading(true);
    setError('');
    try {
      const response = await api.post('/auth/forgotpassword', { email, role });
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
      const response = await api.put('/auth/resetpassword', { email, otp, password, role });
      if (response.data.success) {
        alert('Password successfully reset! Please login with your new password.');
        if (role === 'seller') {
          navigate('/seller/login-form');
        } else {
          navigate('/login');
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Could not reset password. Invalid or expired OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-deep-espresso flex items-center justify-center p-4 selection:bg-warm-sand selection:text-white relative overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-warm-sand/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-[#189D91]/10 rounded-full blur-[120px]" />
      </div>

      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-md bg-white/5 backdrop-blur-3xl border border-white/10 p-8 rounded-[40px] shadow-2xl relative z-10"
      >
        <div className="text-center mb-8">
          <h2 className="font-display text-3xl font-black text-white italic mb-2">Reset Password</h2>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Secure Account Recovery</p>
        </div>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-[10px] font-bold text-center uppercase tracking-widest">
              {error}
            </motion.div>
          )}
          {successMsg && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-2xl text-green-500 text-[10px] font-bold text-center uppercase tracking-widest">
              {successMsg}
            </motion.div>
          )}
        </AnimatePresence>

        {step === 1 ? (
          <form onSubmit={handleSendOtp} className="space-y-6">
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase tracking-widest text-white/60 ml-1">Registered Email</label>
              <div className="relative group">
                <FiMail className="absolute left-5 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-white transition-colors h-4 w-4" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-5 py-4 rounded-xl bg-white/10 border-2 border-transparent focus:border-white/20 focus:bg-white/20 focus:outline-none text-sm text-white font-bold transition-all placeholder:text-white/30"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className={`w-full h-14 rounded-xl bg-white hover:bg-warm-sand text-deep-espresso hover:text-white font-black text-[11px] uppercase tracking-[0.2em] transition-all ${loading ? 'opacity-50' : ''}`}
            >
              {loading ? 'Sending OTP...' : 'Send Recovery OTP'}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-5">
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase tracking-widest text-white/60 ml-1">Enter OTP</label>
              <input
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full text-center tracking-[0.5em] text-2xl py-4 rounded-xl bg-white/10 border-2 border-transparent focus:border-white/20 focus:bg-white/20 focus:outline-none text-white font-bold transition-all placeholder:tracking-normal placeholder:text-sm placeholder:text-white/30"
                placeholder="6-digit code"
                required
              />
            </div>

            <div className="space-y-1 relative group">
              <label className="text-[9px] font-black uppercase tracking-widest text-white/60 ml-1">New Password</label>
              <FiLock className="absolute left-5 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-white transition-colors h-4 w-4" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-12 py-4 rounded-xl bg-white/10 border-2 border-transparent focus:border-white/20 focus:bg-white/20 focus:outline-none text-sm text-white font-bold transition-all placeholder:text-white/30"
                placeholder="••••••••"
                required
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white">
                {showPassword ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
              </button>
            </div>

            <div className="space-y-1 relative group">
              <label className="text-[9px] font-black uppercase tracking-widest text-white/60 ml-1">Confirm Password</label>
              <FiLock className="absolute left-5 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-white transition-colors h-4 w-4" />
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-12 pr-12 py-4 rounded-xl bg-white/10 border-2 border-transparent focus:border-white/20 focus:bg-white/20 focus:outline-none text-sm text-white font-bold transition-all placeholder:text-white/30"
                placeholder="••••••••"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className={`w-full h-14 mt-4 rounded-xl bg-white hover:bg-warm-sand text-deep-espresso hover:text-white font-black text-[11px] uppercase tracking-[0.2em] transition-all ${loading ? 'opacity-50' : ''}`}
            >
              {loading ? 'Resetting...' : 'Update Password'}
            </Button>
          </form>
        )}

        <div className="mt-8 text-center">
          <button 
            onClick={() => {
              if (role === 'seller') {
                navigate('/seller/login-form');
              } else {
                navigate('/login');
              }
            }} 
            className="text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors border-b border-transparent hover:border-white pb-1"
          >
            Back to Login
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPasswordPage;
