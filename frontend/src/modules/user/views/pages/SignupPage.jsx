import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../../shared/utils/api';
import { FiArrowLeft, FiUser, FiMail, FiLock, FiEye, FiEyeOff, FiCheck } from 'react-icons/fi';
import { FaGoogle, FaFacebookF, FaXTwitter } from 'react-icons/fa6';
import Button from '../../../../views/shared/Button';
import LOGIN_BG from '../../../assets/login_bg_fretshop.png';
import TermsAgreementModal from '../../../shared/components/TermsAgreementModal';

const SignupPage = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [signatureData, setSignatureData] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  const getLoginPath = () => {
    if (location.pathname.startsWith('/admin')) return '/admin/login';
    if (location.pathname.startsWith('/seller')) return '/seller/login';
    return '/login';
  };

  const handleSignup = (e) => {
    e.preventDefault();
    setError('');

    if (!formData.fullName.trim()) {
      setError('Please enter your full name');
      return;
    }
    if (!formData.email.trim()) {
      setError('Please enter your email address');
      return;
    }
    if (!formData.password) {
      setError('Please enter a password');
      return;
    }
    if (!formData.confirmPassword) {
      setError('Please confirm your password');
      return;
    }

    if (formData.fullName.trim().length < 3) {
      setError('Full name must be at least 3 characters long');
      return;
    }
    const nameRegex = /^[a-zA-Z\s]+$/;
    if (!nameRegex.test(formData.fullName.trim())) {
      setError('Full name can only contain letters and spaces');
      return;
    }

    if (!formData.email.includes('@')) {
      setError('Email must contain an "@" symbol (e.g. user@example.com)');
      return;
    }
    if (!formData.email.includes('.')) {
      setError('Email is missing a domain (e.g. .com, .in)');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address format');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    const hasLetter = /[a-zA-Z]/.test(formData.password);
    if (!hasLetter) {
      setError('Password must contain at least one letter');
      return;
    }
    const hasNumber = /[0-9]/.test(formData.password);
    if (!hasNumber) {
      setError('Password must contain at least one number');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('The passwords you entered do not match');
      return;
    }

    if (!agreeTerms) {
      setError('Please agree to the terms and conditions');
      return;
    }

    const isSeller = location.pathname.startsWith('/seller');
    
    if (isSeller) {
      // 1. Save to registered_sellers for login lookup
      const registeredSellers = JSON.parse(localStorage.getItem('registered_sellers') || '[]');
      const newSeller = {
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        status: 'pending',
        role: 'seller'
      };
      
      if (registeredSellers.some(s => s.email === formData.email)) {
        setError('Seller with this email already exists');
        return;
      }
      
      localStorage.setItem('registered_sellers', JSON.stringify([...registeredSellers, newSeller]));

      // 2. Push to admin_pending_sellers for Admin view
      const pendingSellers = JSON.parse(localStorage.getItem('admin_pending_sellers') || '[]');
      const newPendingEntry = {
        id: Date.now(),
        name: formData.fullName,
        shopName: `${formData.fullName}'s Shop`,
        email: formData.email,
        phone: '+91 00000 00000',
        applicationDate: new Date().toISOString().split('T')[0],
        docType: 'GSTIN'
      };
      localStorage.setItem('admin_pending_sellers', JSON.stringify([...pendingSellers, newPendingEntry]));

      try {
        await api.post('/auth/seller/register', {
          fullName: formData.fullName,
          email: formData.email,
          password: formData.password,
          shopName: `${formData.fullName}'s Shop`,
          shopAddress: 'Demo Shop Address',
          phone: '+91 99999 99999',
          termsSignature: signatureData?.signature,
          termsVersion: signatureData?.termsVersion
        });
      } catch (err) {
        console.warn('Backend seller registration failed:', err.response?.data?.error || err.message);
      }
    } else {
      try {
        await api.post('/auth/register', {
          fullName: formData.fullName,
          email: formData.email,
          password: formData.password,
          userType: 'customer',
          termsSignature: signatureData?.signature,
          termsVersion: signatureData?.termsVersion
        });
      } catch (err) {
        console.warn('Backend user registration failed:', err.response?.data?.error || err.message);
      }
    }

    // Success simulation
    navigate(getLoginPath());
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen bg-white relative overflow-hidden font-sans">
      {/* Desktop Background Layer */}
      <div className="hidden md:block absolute inset-0 z-0">
        <img 
          src={LOGIN_BG}
          alt="Luxury Showroom"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/45 backdrop-blur-[1px]" />
      </div>

      {/* Main Content Container */}
      <div className="relative z-10 flex flex-col md:flex-row min-h-screen">
        {/* Left Section (Desktop Branding) */}
        <motion.div 
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="hidden md:flex flex-1 items-center justify-center p-20"
        >
          <div className="max-w-2xl space-y-6">
            <h1 className="text-[140px] font-display font-black text-white italic leading-none drop-shadow-2xl">
              Riddha
            </h1>
            <p className="text-2xl font-medium text-white/70 italic tracking-wider ml-4">
              Interio Mart
            </p>
          </div>
        </motion.div>

        {/* Right Section / Form Section */}
        <div className="flex-1 flex flex-col min-h-screen">
          {/* Mobile Header Image */}
          <div className="md:hidden relative h-[25vh] min-h-[180px] w-full overflow-hidden">
            <img 
              src={LOGIN_BG}
              alt="Luxury Interior"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/10" />
            <button 
              onClick={() => navigate(-1)}
              className="absolute top-6 left-6 h-10 w-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/30 z-20"
            >
              <FiArrowLeft className="h-5 w-5" />
            </button>
            <div className="absolute bottom-0 left-0 right-0 h-12 pointer-events-none">
              <svg viewBox="0 0 1440 320" className="absolute bottom-[-1px] left-0 w-full h-[120%] rotate-180" preserveAspectRatio="none">
                <path fill="#ffffff" fillOpacity="1" d="M0,160L48,176C96,192,192,224,288,229.3C384,235,480,213,576,192C672,171,768,149,864,154.7C960,160,1056,192,1152,192C1248,192,1344,160,1392,144L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
              </svg>
            </div>
          </div>

          {/* Form Area Wrapper */}
          <div className="flex-1 flex items-center justify-center p-6 md:p-12 lg:p-20 relative">
            <button 
              onClick={() => navigate(-1)}
              className="hidden md:flex absolute top-10 right-10 items-center gap-2 group text-white/50 hover:text-white transition-all font-bold text-xs tracking-widest uppercase z-50"
            >
              <FiArrowLeft className="group-hover:-translate-x-1 transition-transform" />
              Back
            </button>

            {/* Form Card */}
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="w-full max-w-md bg-white md:bg-white/10 md:backdrop-blur-3xl md:border md:border-white/20 p-8 md:p-10 rounded-[40px] shadow-2xl relative"
            >
              {/* Desktop Header */}
              <div className="hidden md:flex justify-between items-center mb-8">
                <h2 className="text-3xl font-display font-bold text-white">Sign Up</h2>
                <div className="flex gap-2 text-[10px] font-black uppercase tracking-wider">
                  <span className="text-white/40 hover:text-white cursor-pointer transition-colors" onClick={() => navigate(getLoginPath())}>Log In</span>
                  <span className="text-white border-b border-white pb-0.5 pointer-events-none">Sign Up</span>
                </div>
              </div>

              {/* Mobile Header */}
              <div className="md:hidden text-center space-y-1 mb-6 w-full">
                <h1 className="text-2xl font-black text-deep-espresso tracking-tight">Create Account</h1>
                <p className="text-gray-400 font-bold text-[10px] tracking-[0.15em] uppercase italic">
                  Join Riddha Interior Mart
                </p>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-[10px] font-bold uppercase tracking-wider text-center"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleSignup} className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  {/* Full Name */}
                  <div className="space-y-1">
                    <label className="hidden md:block text-[10px] font-black uppercase tracking-widest text-white/60 mb-1 ml-1">Full Name</label>
                    <div className="relative group">
                      <FiUser className="md:hidden absolute left-6 top-1/2 -translate-y-1/2 text-warm-sand group-focus-within:text-deep-espresso h-5 w-5" />
                      <input 
                        type="text" 
                        name="fullName"
                        placeholder="John Doe" 
                        value={formData.fullName}
                        onChange={handleChange}
                        className="w-full md:pl-6 pl-16 pr-6 py-3.5 rounded-full md:rounded-xl bg-soft-oatmeal/10 md:bg-white/10 border-2 border-transparent md:border-white/10 focus:border-warm-sand/50 md:focus:border-white/40 focus:bg-white md:focus:bg-white/20 focus:outline-none text-sm font-semibold transition-all md:text-white"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-1">
                    <label className="hidden md:block text-[10px] font-black uppercase tracking-widest text-white/60 mb-1 ml-1">Email</label>
                    <div className="relative group">
                      <FiMail className="md:hidden absolute left-6 top-1/2 -translate-y-1/2 text-warm-sand group-focus-within:text-deep-espresso h-5 w-5" />
                      <input 
                        type="email" 
                        name="email"
                        placeholder="email@example.com" 
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full md:pl-6 pl-16 pr-6 py-3.5 rounded-full md:rounded-xl bg-soft-oatmeal/10 md:bg-white/10 border-2 border-transparent md:border-white/10 focus:border-warm-sand/50 md:focus:border-white/40 focus:bg-white md:focus:bg-white/20 focus:outline-none text-sm font-semibold transition-all md:text-white"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-1">
                    <label className="hidden md:block text-[10px] font-black uppercase tracking-widest text-white/60 mb-1 ml-1">Password</label>
                    <div className="relative group">
                      <FiLock className="md:hidden absolute left-6 top-1/2 -translate-y-1/2 text-warm-sand group-focus-within:text-deep-espresso h-5 w-5" />
                      <input 
                        type={showPassword ? "text" : "password"}
                        name="password"
                        placeholder="••••••••" 
                        value={formData.password}
                        onChange={handleChange}
                        className="w-full md:pl-6 pl-16 pr-14 py-3.5 rounded-full md:rounded-xl bg-soft-oatmeal/10 md:bg-white/10 border-2 border-transparent md:border-white/10 focus:border-warm-sand/50 md:focus:border-white/40 focus:bg-white md:focus:bg-white/20 focus:outline-none text-sm font-semibold transition-all md:text-white"
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-300 md:text-white/50 hover:text-white">
                        {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-1">
                    <label className="hidden md:block text-[10px] font-black uppercase tracking-widest text-white/60 mb-1 ml-1">Confirm Password</label>
                    <div className="relative group">
                      <FiLock className="md:hidden absolute left-6 top-1/2 -translate-y-1/2 text-warm-sand group-focus-within:text-deep-espresso h-5 w-5" />
                      <input 
                        type="password"
                        name="confirmPassword"
                        placeholder="••••••••" 
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className="w-full md:pl-6 pl-16 pr-6 py-3.5 rounded-full md:rounded-xl bg-soft-oatmeal/10 md:bg-white/10 border-2 border-transparent md:border-white/10 focus:border-warm-sand/50 md:focus:border-white/40 focus:bg-white md:focus:bg-white/20 focus:outline-none text-sm font-semibold transition-all md:text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Terms and Conditions */}
                <div className="flex items-start gap-3 px-2 py-2">
                  <button type="button" onClick={() => setShowTermsModal(true)} className="mt-0.5 flex-shrink-0">
                    <div className={`h-4 w-4 rounded border flex items-center justify-center transition-all ${agreeTerms ? 'bg-warm-sand border-warm-sand md:bg-white md:border-white' : 'border-gray-300 md:border-white/30'}`}>
                      {agreeTerms && <FiCheck className="md:text-deep-espresso text-white text-[10px] stroke-[4]" />}
                    </div>
                  </button>
                  <p className="text-[10px] font-bold text-gray-400 md:text-white/60 leading-relaxed uppercase tracking-wider">
                    I agree to the <span onClick={() => setShowTermsModal(true)} className="text-warm-sand md:text-white cursor-pointer border-b border-warm-sand/30 md:border-white/30">Terms & Conditions</span>
                  </p>
                </div>

                <div className="pt-2">
                  <Button 
                    type="submit"
                    className="w-full h-14 md:h-12 rounded-full md:rounded-xl bg-warm-sand md:bg-white hover:bg-deep-espresso md:hover:bg-warm-sand text-white md:text-deep-espresso md:hover:text-white font-black text-xs uppercase tracking-widest shadow-xl transition-all"
                  >
                    Create Account
                  </Button>
                </div>

                {/* Social Logins */}
                <div className="hidden md:block pt-6 border-t border-white/10 mt-4">
                  <div className="flex justify-center items-center gap-6">
                    {[FaGoogle, FaFacebookF, FaXTwitter].map((Icon, idx) => (
                      <button key={idx} type="button" className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-white hover:text-deep-espresso transition-all">
                        <Icon size={16} />
                      </button>
                    ))}
                  </div>
                </div>

                <p className="text-center text-[10px] font-black text-gray-400 md:text-white/50 uppercase tracking-widest mt-4">
                  Already have an account? <span onClick={() => navigate(getLoginPath())} className="text-warm-sand md:text-white cursor-pointer border-b border-warm-sand/30 md:border-white/30 transition-colors">Log In</span>
                </p>
              </form>
            </motion.div>
          </div>
        </div>
      </div>

      <TermsAgreementModal 
        isOpen={showTermsModal} 
        onClose={() => setShowTermsModal(false)}
        roleType={location.pathname.startsWith('/seller') ? 'seller' : 'user'}
        initialSignature={signatureData?.signature}
        onAgree={(data) => {
          setSignatureData(data);
          setAgreeTerms(true);
          setShowTermsModal(false);
          setError('');
        }}
      />
    </div>
  );
};

export default SignupPage;
