import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useUser } from '../data/UserContext';
import { FiArrowLeft, FiUser, FiMail, FiLock, FiEye, FiEyeOff, FiCheck, FiPhone, FiTruck, FiMapPin, FiShoppingBag, FiGift, FiUploadCloud, FiCheckCircle, FiLoader, FiCreditCard, FiShield, FiActivity, FiFileText, FiUserCheck, FiBriefcase, FiX } from 'react-icons/fi';
import { FaGoogle, FaFacebookF, FaXTwitter } from 'react-icons/fa6';
import Button from '../../../shared/components/Button';
import LOGIN_BG from '../../../assets/login_bg_fretshop.png';
import { uploadImage, uploadRegistrationDocument } from '../../../shared/utils/upload';
import api from '../../../shared/utils/api';
import logo from '../../../assets/transparent_logo.png';

const documentTypes = [
  { key: 'rc', label: 'RC (Registration)', icon: FiFileText },
  { key: 'dl', label: 'Driving License (DL)', icon: FiCreditCard },
  { key: 'aadhar', label: 'Aadhar Card', icon: FiUserCheck },
  { key: 'bankDetails', label: 'Bank Details', icon: FiBriefcase },
  { key: 'insurance', label: 'Vehicle Insurance', icon: FiShield },
  { key: 'pollution', label: 'Pollution (PUC)', icon: FiActivity },
];

const SignupPage = () => {
  const [step, setStep] = useState('signup'); // 'signup' or 'otp'
  const [otp, setOtp] = useState('');
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    // Business Details for Enterprisers
    shopName: '',
    gstNumber: '',
    // Legacy fields for other roles
    shopAddress: '',
    vehicleType: 'Bike',
    vehicleNumber: '',
  });
  const [documents, setDocuments] = useState({
    rc: '',
    dl: '',
    aadhar: '',
    bankDetails: '',
    insurance: '',
    pollution: '',
  });
  const [uploadingDocs, setUploadingDocs] = useState({
    rc: false,
    dl: false,
    aadhar: false,
    bankDetails: false,
    insurance: false,
    pollution: false,
  });
  const [uploadErrors, setUploadErrors] = useState({
    rc: false,
    dl: false,
    aadhar: false,
    bankDetails: false,
    insurance: false,
    pollution: false,
  });

  const handleDocUpload = async (e, docType) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploadingDocs(prev => ({ ...prev, [docType]: true }));
    setUploadErrors(prev => ({ ...prev, [docType]: false }));
    try {
      const role = getRole();
      const url = role === 'delivery'
        ? await uploadRegistrationDocument(file)
        : await uploadImage(file);
      setDocuments(prev => ({ ...prev, [docType]: url }));
    } catch (err) {
      console.error(`Failed to upload ${docType}:`, err);
      setUploadErrors(prev => ({ ...prev, [docType]: true }));
    } finally {
      setUploadingDocs(prev => ({ ...prev, [docType]: false }));
    }
  };

  const [userType, setUserType] = useState('customer');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useUser();

  const [fieldErrors, setFieldErrors] = useState({});
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [termsContent, setTermsContent] = useState('');
  const [loadingTerms, setLoadingTerms] = useState(false);

  const referralRef = React.useRef(null);
  const formRef = React.useRef(null);

  const handleConfirmPasswordFocus = () => {
    if (referralRef.current) {
      referralRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  const openTermsModal = async (e) => {
    e.preventDefault();
    setShowTermsModal(true);
    setLoadingTerms(true);
    try {
      const role = getRole();
      const termsType = ['user', 'seller', 'delivery'].includes(role) ? role : 'user';
      const response = await api.get(`/terms/${termsType}`);
      if (response.data.success && response.data.data) {
        setTermsContent(response.data.data.content);
      } else {
        setTermsContent('Failed to load terms and conditions.');
      }
    } catch (err) {
      console.error(err);
      setTermsContent('Failed to load terms and conditions. Please try again.');
    } finally {
      setLoadingTerms(false);
    }
  };

  // Delivery: login-first, then slide up signup (default to signup if path is specifically /signup)
  const [showSignupForm, setShowSignupForm] = useState(() => location.pathname.endsWith('/signup'));
  const [dlId, setDlId] = useState('');
  const [dlPwd, setDlPwd] = useState('');
  const [dlShowPwd, setDlShowPwd] = useState(false);
  const [dlLoading, setDlLoading] = useState(false);

  const handleDeliveryLogin = async (e) => {
    e.preventDefault();
    setError('');
    setDlLoading(true);
    try {
      const resp = await api.post('/auth/delivery/login', { email: dlId, password: dlPwd });
      if (resp.data.success) {
        const { token, user } = resp.data.data || resp.data;
        login({ ...user, token });
        navigate('/delivery/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid credentials');
    } finally {
      setDlLoading(false);
    }
  };

  const getRole = () => {
    if (location.pathname.startsWith('/admin')) return 'admin';
    if (location.pathname.startsWith('/seller')) return 'seller';
    if (location.pathname.startsWith('/delivery')) return 'delivery';
    return 'user';
  };

  const getLoginPath = () => {
    const role = getRole();
    if (role === 'admin') return '/admin/login';
    if (role === 'seller') return '/seller/login';
    if (role === 'delivery') return '/delivery/login';
    return '/login';
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    setLoading(true);

    const role = getRole();

    // Basic validation
    if (!formData.fullName || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('Please fill in all basic fields');
      setLoading(false);
      return;
    }

    // Role-specific validation
    if (role === 'seller') {
      if (!formData.shopName || !formData.shopAddress || !formData.phone) {
        setError('Please fill in Shop Name, Address, and Phone');
        setLoading(false);
        return;
      }
    }

    if (role === 'delivery') {
      if (!formData.phone || !formData.vehicleNumber) {
        setError('Please fill in Phone and Vehicle Details');
        setLoading(false);
        return;
      }
      const missingDocs = Object.keys(documents).filter(key => !documents[key]);
      if (missingDocs.length > 0) {
        const missingLabels = missingDocs.map(k => documentTypes.find(d => d.key === k)?.label || k.toUpperCase());
        setError(`Please upload all required verification documents: ${missingLabels.join(', ')}`);
        setLoading(false);
        return;
      }
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.phone && formData.phone.length !== 10) {
      setError('Please enter a valid 10-digit mobile number');
      setLoading(false);
      return;
    }

    if (!agreeTerms) {
      setError('Please agree to the terms and conditions');
      setLoading(false);
      return;
    }

    try {
      // Build Payload
      const payload = {
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password
      };

      if (role === 'seller') {
        payload.shopName = formData.shopName;
        payload.shopAddress = formData.shopAddress;
        payload.phone = formData.phone;
      }

      if (role === 'delivery') {
        payload.phone = formData.phone;
        payload.vehicleType = formData.vehicleType;
        payload.vehicleNumber = formData.vehicleNumber;
        payload.documents = documents;
      }

      const response = await api.post(`/auth/${role}/register`, {
        ...payload,
        referralCode: formData.referralCode,
        userType: role === 'user' ? userType : undefined,
        businessDetails: role === 'user' && userType === 'enterpriser' ? {
          shopName: formData.shopName,
          gstNumber: formData.gstNumber
        } : undefined
      });

      if (response.data.success) {
        if (role === 'delivery') {
          setStep('success');
        } else {
          setRegisteredEmail(formData.email);
          setStep('otp');
        }
        setError('');
      }
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Registration failed. Please try again.';
      if (errMsg.toLowerCase().includes('referral')) {
        setFieldErrors(prev => ({ ...prev, referralCode: errMsg }));
      } else {
        setError(errMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!otp) {
      setError('Please enter the OTP sent to your email.');
      setLoading(false);
      return;
    }

    try {
      const response = await api.post(`/auth/user/verify-email`, {
        email: registeredEmail,
        otp
      });

      if (response.data.success) {
        navigate(getLoginPath());
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Verification failed. Invalid OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      const res = await api.post('/auth/user/resend-otp', { email: registeredEmail });
      if (res.data.success) {
        alert('A new OTP has been sent to your email.');
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to resend OTP.');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'fullName') {
      if (value !== '' && !/^[A-Za-z\s]*$/.test(value)) return;
    }
    
    if (name === 'phone') {
      if (value !== '' && !/^\d*$/.test(value)) return;
      if (value.length > 10) return;
    }

    setFormData({ ...formData, [name]: value });

    if (fieldErrors[name]) {
      setFieldErrors(prev => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  };

  // ── Delivery: login form by default, signup slides up full-screen ──
  if (getRole() === 'delivery' && !showSignupForm) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] flex flex-col items-center justify-center px-6 py-12 relative">
        <div className="w-full max-w-sm space-y-5">
          <div className="flex justify-center">
            <img src={logo} alt="Riddha" className="w-40 object-contain" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold text-slate-800">Delivery Partner Login</h1>
            <p className="text-xs text-slate-400 mt-1">Sign in to your delivery account</p>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-600 font-semibold text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleDeliveryLogin} className="space-y-3">
            <input
              type="text"
              placeholder="Email or Phone"
              value={dlId}
              onChange={e => setDlId(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#2A458A] transition-colors"
              required
            />
            <div className="relative">
              <input
                type={dlShowPwd ? 'text' : 'password'}
                placeholder="Password"
                value={dlPwd}
                onChange={e => setDlPwd(e.target.value)}
                className="w-full px-4 py-3 pr-11 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#2A458A] transition-colors"
                required
              />
              <button type="button" onClick={() => setDlShowPwd(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                {dlShowPwd ? <FiEyeOff size={16} /> : <FiEye size={16} />}
              </button>
            </div>
            <button
              type="submit"
              disabled={dlLoading}
              className="w-full py-3.5 bg-[#2A458A] text-white font-bold text-sm rounded-full hover:bg-[#1f346b] transition-colors active:scale-[0.98] disabled:opacity-60"
            >
              {dlLoading ? 'Signing in…' : 'LOGIN'}
            </button>
          </form>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-[11px] text-slate-400">or</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          <button
            onClick={() => { setError(''); setShowSignupForm(true); }}
            className="w-full py-3 border border-[#2A458A] text-[#2A458A] font-semibold text-sm rounded-full hover:bg-[#2A458A]/5 transition-colors"
          >
            Create Account
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[radial-gradient(circle_at_top_left,rgba(24,157,145,0.06),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(236,0,140,0.04),transparent_28%),linear-gradient(180deg,#f8fafc_0%,#f1f5f9_100%)] flex items-center justify-center font-sans overflow-y-auto p-4 md:p-8">
      {/* Device wrapper for desktop, seamless on mobile */}
      <div className="w-full max-w-5xl h-auto md:h-[82vh] md:min-h-[620px] bg-white flex flex-col md:flex-row justify-between md:justify-start rounded-2xl shadow-2xl overflow-hidden relative border border-slate-100">
        
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-6 left-6 p-2 md:p-2.5 bg-slate-50 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all border border-slate-100 shadow-sm md:bg-white/80 md:shadow-md z-50"
          aria-label="Go Back"
        >
          <FiArrowLeft size={18} />
        </button>

        {/* Left Side: Brand Story (Desktop only) */}
        <div className="hidden md:block md:w-1/2 md:h-full relative overflow-hidden bg-slate-100 border-r border-slate-100">
          <img
            src={LOGIN_BG}
            alt="Luxury Interior"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-10" />

          {/* Logo on top left */}
          <div className="absolute top-8 left-8 z-30">
            <Link to="/">
              <img src={logo} alt="Riddha Mart Logo" className="h-12 w-auto object-contain drop-shadow-md" />
            </Link>
          </div>

          <div className="absolute inset-0 z-20 flex flex-col justify-end p-12 text-white">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 border border-white/30 shadow-sm w-fit mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4DD9CE]" />
              <span className="text-[9px] font-black uppercase tracking-[0.22em] text-white/90">
                Premium Interior Mart
              </span>
            </div>
            <h1 className="text-3xl xl:text-4xl font-black leading-[1.1] tracking-tight mb-2">
              Join the <br />
              <span className="text-[#4DD9CE] italic font-serif">Riddha Family.</span>
            </h1>
            <p className="max-w-sm text-xs font-medium leading-relaxed text-white/70">
              Get access to premium collection of luxury fittings, dedicated project management, and designer-tier pricing.
            </p>
          </div>
        </div>

        {/* Right Side: Signup Form */}
        <div className="flex-1 md:w-1/2 w-full flex flex-col justify-center bg-white relative px-6 md:px-12 py-8 overflow-y-auto">
          <div className="w-full max-w-[460px] mx-auto md:mx-0">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="w-full relative"
            >
              <div className="relative z-10 px-2 md:px-0">
                <div className="hidden md:flex items-center justify-between mb-4">
                  <h2 className="font-display text-2xl font-semibold text-slate-800 italic font-serif">Sign Up</h2>
                  <div className="flex gap-3">
                    <button onClick={() => navigate(getLoginPath())} className="text-[9px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors">Log In</button>
                    <div className="w-8 h-0.5 bg-[#189D91] mt-2.5"></div>
                  </div>
                </div>

                {/* Mobile Header (Visible only on mobile) */}
                <div className="md:hidden flex flex-col items-center text-center space-y-2 mb-6 pt-1">
                  <Link to="/">
                    <img src={logo} alt="Riddha Mart Logo" className="h-12 w-auto object-contain mb-1" />
                  </Link>
                  <h1 className="text-2xl font-display font-semibold text-deep-espresso tracking-tight">Create Account</h1>
                  <p className="text-gray-400 font-medium text-[8px] tracking-[0.2em] uppercase">
                    Join the Riddha Family
                  </p>
                </div>

                  {/* Brand Logo */}
                  <div className="flex justify-center mb-5 mt-1">
                    <img 
                      src={logo} 
                      alt="Riddha Logo" 
                      className="h-16 w-auto object-contain filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.08)]" 
                    />
                  </div>

                  {getRole() === 'admin' && (
                    <div className="flex bg-blue-50/50 md:bg-white/5 p-1 rounded-xl border border-gray-100 md:border-white/10">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, rbacRole: 'admin' })}
                        className={`flex-1 py-2 rounded-lg text-[9px] font-semibold uppercase tracking-widest transition-all ${(formData.rbacRole || 'admin') === 'admin' ? 'bg-[#240046] md:bg-brand-purple text-white shadow-lg' : 'text-gray-400 md:text-white/40 hover:text-deep-espresso md:hover:text-white'}`}
                      >
                        Super Admin
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, rbacRole: 'assistant' })}
                        className={`flex-1 py-2 rounded-lg text-[9px] font-semibold uppercase tracking-widest transition-all ${formData.rbacRole === 'assistant' ? 'bg-[#240046] md:bg-brand-purple text-white shadow-lg' : 'text-gray-400 md:text-white/40 hover:text-deep-espresso md:hover:text-white'}`}
                      >
                        Assistant
                      </button>
                    </div>
                  )}

                  {getRole() === 'user' && (
                    <div className="mb-4 p-1 bg-slate-100 rounded-2xl border border-slate-200/60 flex max-w-[460px]">
                      <button
                        type="button"
                        onClick={() => setUserType('customer')}
                        className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${userType === 'customer' ? 'bg-[#189D91] text-white shadow-sm shadow-[#189D91]/20' : 'text-slate-600 hover:text-slate-800'}`}
                      >
                        Individual
                      </button>
                      <button
                        type="button"
                        onClick={() => setUserType('enterpriser')}
                        className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${userType === 'enterpriser' ? 'bg-[#189D91] text-white shadow-sm shadow-[#189D91]/20' : 'text-slate-600 hover:text-slate-800'}`}
                      >
                        Enterpriser
                      </button>
                    </div>
                  )}

                {error && (
                  <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-[10px] font-bold text-center uppercase tracking-widest">
                    {error}
                  </div>
                )}

                {step === 'signup' ? (
                  <form ref={formRef} onSubmit={handleSignup} className="space-y-3.5 max-h-[60vh] md:max-h-none overflow-y-auto pr-1 custom-scrollbar flex flex-col">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 ml-0.5">Full Name</label>
                        <div className="relative group">
                          <input
                            type="text"
                            name="fullName"
                            placeholder="Full Name"
                            value={formData.fullName}
                            onChange={handleChange}
                            className="w-full px-4 py-2.5 bg-slate-50/85 border border-slate-200/80 rounded-xl focus:bg-white focus:border-[#189D91] focus:ring-[#189D91]/5 focus:outline-none text-xs font-semibold text-slate-800 placeholder:text-slate-400 placeholder:font-semibold shadow-sm transition-all"
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 ml-0.5">Email Address</label>
                        <div className="relative group">
                          <input
                            type="email"
                            name="email"
                            placeholder="name@example.com"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full px-4 py-2.5 bg-slate-50/85 border border-slate-200/80 rounded-xl focus:bg-white focus:border-[#189D91] focus:ring-[#189D91]/5 focus:outline-none text-xs font-semibold text-slate-800 placeholder:text-slate-400 placeholder:font-semibold shadow-sm transition-all"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {/* Enterpriser Fields */}
                    {getRole() === 'user' && userType === 'enterpriser' && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3.5">
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 ml-0.5">Shop / Business Name</label>
                          <div className="relative group">
                            <input
                              type="text"
                              name="shopName"
                              placeholder="e.g. Riddha Designs"
                              value={formData.shopName}
                              onChange={handleChange}
                              className="w-full px-4 py-2.5 bg-slate-50/85 border border-slate-200/80 rounded-xl focus:bg-white focus:border-[#189D91] focus:ring-[#189D91]/5 focus:outline-none text-xs font-semibold text-slate-800 placeholder:text-slate-400 placeholder:font-semibold shadow-sm transition-all"
                              required
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <label className="block text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 ml-0.5">GST Number</label>
                            <input
                              type="text"
                              name="gstNumber"
                              placeholder="22AAAAA0000A1Z5"
                              value={formData.gstNumber}
                              onChange={handleChange}
                              className="w-full px-4 py-2.5 bg-slate-50/85 border border-slate-200/80 rounded-xl focus:bg-white focus:border-[#189D91] focus:ring-[#189D91]/5 focus:outline-none text-xs font-semibold text-slate-800 placeholder:text-slate-400 placeholder:font-semibold shadow-sm transition-all"
                              required
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Seller Fields */}
                    {getRole() === 'seller' && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3.5 !mt-1">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <label className="block text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 ml-0.5">Shop Name</label>
                            <div className="relative group">
                              <input 
                                type="text" 
                                name="shopName" 
                                placeholder="Shop Name" 
                                value={formData.shopName} 
                                onChange={handleChange} 
                                className="w-full px-4 py-2.5 bg-slate-50/85 border border-slate-200/80 rounded-xl focus:bg-white focus:border-[#189D91] focus:ring-[#189D91]/5 focus:outline-none text-xs font-semibold text-slate-800 placeholder:text-slate-400 placeholder:font-semibold shadow-sm transition-all" 
                              />
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <label className="block text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 ml-0.5">Phone</label>
                            <div className="relative group">
                              <input 
                                type="tel" 
                                name="phone" 
                                placeholder="Phone Number" 
                                value={formData.phone} 
                                onChange={handleChange} 
                                className="w-full px-4 py-2.5 bg-slate-50/85 border border-slate-200/80 rounded-xl focus:bg-white focus:border-[#189D91] focus:ring-[#189D91]/5 focus:outline-none text-xs font-semibold text-slate-800 placeholder:text-slate-400 placeholder:font-semibold shadow-sm transition-all" 
                              />
                            </div>
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 ml-0.5">Shop Address</label>
                          <div className="relative group">
                            <textarea 
                              name="shopAddress" 
                              placeholder="Shop Address" 
                              value={formData.shopAddress} 
                              onChange={handleChange} 
                              rows="2" 
                              className="w-full px-4 py-2.5 bg-slate-50/85 border border-slate-200/80 rounded-xl focus:bg-white focus:border-[#189D91] focus:ring-[#189D91]/5 focus:outline-none text-xs font-semibold text-slate-800 placeholder:text-slate-400 placeholder:font-semibold shadow-sm transition-all resize-none"
                            ></textarea>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Delivery Fields */}
                    {getRole() === 'delivery' && (
                      <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        className="space-y-3.5 !mt-1"
                      >
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 ml-0.5">Phone</label>
                          <div className="relative group">
                            <input 
                              type="tel" 
                              name="phone" 
                              placeholder="Phone Number" 
                              value={formData.phone} 
                              onChange={handleChange} 
                              className="w-full px-4 py-2.5 bg-slate-50/85 border border-slate-200/80 rounded-xl focus:bg-white focus:border-[#189D91] focus:ring-[#189D91]/5 focus:outline-none text-xs font-semibold text-slate-800 placeholder:text-slate-400 placeholder:font-semibold shadow-sm transition-all" 
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <label className="block text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 ml-0.5">Vehicle Type</label>
                            <select 
                              name="vehicleType" 
                              value={formData.vehicleType} 
                              onChange={handleChange} 
                              className="w-full px-4 py-2.5 bg-slate-50/85 border border-slate-200/80 rounded-xl focus:bg-white focus:border-[#189D91] focus:outline-none text-xs font-semibold text-slate-800 shadow-sm transition-all appearance-none"
                            >
                              <option value="Bike">Bike</option>
                              <option value="Van">Van</option>
                              <option value="Truck">Truck</option>
                            </select>
                          </div>
                          <div className="space-y-1.5">
                            <label className="block text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 ml-0.5">Vehicle Number</label>
                            <input 
                              type="text" 
                              name="vehicleNumber" 
                              placeholder="Vehicle Number" 
                              value={formData.vehicleNumber} 
                              onChange={handleChange} 
                              className="w-full px-4 py-2.5 bg-slate-50/85 border border-slate-200/80 rounded-xl focus:bg-white focus:border-[#189D91] focus:ring-[#189D91]/5 focus:outline-none text-xs font-semibold text-slate-800 placeholder:text-slate-400 placeholder:font-semibold shadow-sm transition-all" 
                            />
                          </div>
                        </div>

                        {/* Compact Verification Documents Section */}
                        <div className="space-y-2 pt-1 text-left">
                           <label className="block text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 ml-0.5">
                              Verification Documents
                           </label>
                           <div className="grid grid-cols-2 gap-2">
                              {documentTypes.map((doc) => {
                                 const Icon = doc.icon;
                                 const isUploaded = !!documents[doc.key];
                                 const isUploading = uploadingDocs[doc.key];
                                 const hasError = uploadErrors[doc.key];

                                 return (
                                    <div key={doc.key} className="relative">
                                       <label className={`flex flex-col items-center justify-center p-2 rounded-xl border border-dashed transition-all cursor-pointer text-center h-[65px] ${
                                         hasError
                                           ? 'bg-rose-50 border-rose-300'
                                           : isUploaded
                                             ? 'bg-[#189D91]/10 border-[#189D91]/40'
                                             : 'bg-slate-50/50 border-slate-200 hover:border-[#189D91]/30'
                                       }`}>
                                          <input
                                             type="file"
                                             className="hidden"
                                             onChange={(e) => handleDocUpload(e, doc.key)}
                                             accept="image/*,application/pdf"
                                          />
                                          {isUploading ? (
                                             <FiLoader className="h-4 w-4 text-[#189D91] animate-spin mb-1" />
                                          ) : isUploaded ? (
                                             <FiCheckCircle className="h-4 w-4 text-teal-600 mb-1" />
                                          ) : hasError ? (
                                             <FiUploadCloud className="h-4 w-4 text-rose-500 mb-1" />
                                          ) : (
                                             <Icon className="h-4 w-4 text-slate-400 mb-1" />
                                          )}
                                          <span className="text-[8px] font-black uppercase tracking-wider text-slate-500">
                                             {doc.label}
                                          </span>
                                       </label>
                                    </div>
                                 );
                              })}
                           </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Password Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                      <div className="space-y-1.5 relative group">
                        <label className="block text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 ml-0.5">Password</label>
                        <input type={showPassword ? "text" : "password"} name="password" placeholder="Password" value={formData.password} onChange={handleChange} className="w-full px-4 py-2.5 bg-slate-50/85 border border-slate-200/80 rounded-xl focus:bg-white focus:border-[#189D91] focus:ring-[#189D91]/5 focus:outline-none text-xs font-semibold text-slate-800 placeholder:text-slate-400 placeholder:font-semibold shadow-sm transition-all" />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-9 text-slate-450 hover:text-slate-600 transition-colors">{showPassword ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}</button>
                      </div>
                      <div className="space-y-1.5 relative group">
                        <label className="block text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 ml-0.5">Confirm Password</label>
                        <input type={showPassword ? "text" : "password"} name="confirmPassword" placeholder="Confirm" value={formData.confirmPassword} onChange={handleChange} onFocus={handleConfirmPasswordFocus} className="w-full px-4 py-2.5 bg-slate-50/85 border border-slate-200/80 rounded-xl focus:bg-white focus:border-[#189D91] focus:ring-[#189D91]/5 focus:outline-none text-xs font-semibold text-slate-800 placeholder:text-slate-400 placeholder:font-semibold shadow-sm transition-all" />
                      </div>
                      <div ref={referralRef} className="space-y-1.5 relative group md:col-span-2">
                        <label className="block text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 ml-0.5">Referral Code (Optional)</label>
                        <input 
                           type="text" 
                           name="referralCode" 
                           placeholder="e.g. RIDDHA-123" 
                           value={formData.referralCode || ''} 
                           onChange={handleChange} 
                           className="w-full px-4 py-2.5 bg-slate-50/85 border border-slate-200/80 rounded-xl focus:bg-white focus:border-[#189D91] focus:ring-[#189D91]/5 focus:outline-none text-xs font-semibold text-slate-800 placeholder:text-slate-400 placeholder:font-semibold shadow-sm transition-all" 
                        />
                        {fieldErrors.referralCode && (
                          <p className="text-[10px] text-rose-500 font-semibold mt-1 ml-2">
                            {fieldErrors.referralCode}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 px-1">
                      <input type="checkbox" checked={agreeTerms} onChange={(e) => setAgreeTerms(e.target.checked)} className="accent-[#189D91] h-3.5 w-3.5" />
                      <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none">
                        I agree to the <button type="button" onClick={openTermsModal} className="underline font-black text-[#189D91] hover:text-[#137d74] transition-colors cursor-pointer bg-transparent border-0 p-0 align-baseline inline-block">Terms & Conditions</button>
                      </label>
                    </div>

                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-[#8A3B8B] hover:bg-[#722b73] text-white py-3 rounded-full font-bold text-[13px] uppercase tracking-wider transition-all active:scale-[0.98] shadow-md shadow-[#8A3B8B]/20"
                    >
                      {loading ? 'Creating...' : 'CREATE ACCOUNT'}
                    </Button>

                    <p className="md:hidden text-center text-[10px] font-semibold text-gray-400 uppercase tracking-widest pt-4">
                      Already have account? <span onClick={() => navigate(getLoginPath())} className="text-[#189D91] cursor-pointer font-semibold border-b border-[#189D91]/30 pb-0.5 ml-1">LOG IN</span>
                    </p>
                  </form>
                ) : step === 'otp' ? (
                  <form onSubmit={handleVerifyOtp} className="space-y-4">
                    <div className="text-center mb-6">
                      <h3 className="text-xl md:text-2xl font-black text-slate-800 mb-2">Verify Your Email</h3>
                      <p className="text-sm text-slate-500">
                        We've sent a 6-digit OTP to <strong>{registeredEmail}</strong>.
                      </p>
                    </div>
                    
                    <div className="space-y-1">
                      <label className="block text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 ml-0.5 text-center">Enter OTP</label>
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="6-digit OTP"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        className="w-full text-center tracking-[0.5em] text-2xl py-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#189D91] focus:ring-[#189D91]/5 focus:outline-none text-slate-800 font-bold transition-all shadow-sm"
                        required
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-[#8A3B8B] hover:bg-[#722b73] text-white py-3 rounded-full font-bold text-[13px] uppercase tracking-wider transition-all active:scale-[0.98] shadow-md shadow-[#8A3B8B]/20"
                    >
                      {loading ? 'Verifying...' : 'VERIFY EMAIL'}
                    </Button>

                    <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-6">
                      Didn't receive it? <button type="button" onClick={handleResendOtp} className="text-[#189D91] hover:text-[#137d74] cursor-pointer font-black border-b border-[#189D91]/30 pb-0.5 ml-1 transition-colors">RESEND OTP</button>
                    </p>
                  </form>
                ) : (
                  <div className="text-center space-y-6 py-4">
                    <div className="w-20 h-20 bg-teal-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-[#189D91]">
                      <FiCheckCircle size={40} />
                    </div>
                    <h3 className="text-xl md:text-2xl font-semibold text-slate-800 mb-2 font-display italic font-serif">Application Submitted!</h3>
                    <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto font-medium">
                      Your delivery partner account has been successfully registered and is pending admin review.
                    </p>
                    <p className="text-[10px] text-slate-400 leading-relaxed max-w-sm mx-auto font-normal">
                      We will verify your documents (RC, Driving License, Aadhar Card, etc.) and update your approval status shortly.
                    </p>
                    <Button
                      onClick={() => navigate('/delivery/login')}
                      className="w-full bg-[#8A3B8B] hover:bg-[#722b73] text-white py-3 rounded-full font-bold text-[13px] uppercase tracking-wider transition-all active:scale-[0.98] shadow-md shadow-[#8A3B8B]/20"
                    >
                      Back to Login
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
      {/* Terms & Conditions Modal Overlay */}
      {showTermsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white md:bg-slate-900 rounded-3xl w-full max-w-lg overflow-hidden flex flex-col shadow-2xl border border-slate-100 md:border-white/10 max-h-[80vh]">
            <div className="px-6 py-4 border-b border-slate-100 md:border-white/5 flex items-center justify-between bg-slate-50 md:bg-white/5">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 md:text-white">
                Terms & Conditions
              </h3>
              <button
                type="button"
                onClick={() => setShowTermsModal(false)}
                className="text-slate-400 hover:text-slate-650 md:text-white/40 md:hover:text-white transition-colors p-1 rounded-full hover:bg-slate-200 md:hover:bg-white/10"
              >
                <FiX size={18} />
              </button>
            </div>
            <div className="px-6 py-5 overflow-y-auto text-xs text-slate-600 md:text-white/80 leading-relaxed font-medium space-y-3 flex-1 custom-scrollbar">
              {loadingTerms ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <FiLoader className="h-6 w-6 text-[#189D91] md:text-warm-sand animate-spin" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Loading terms...</span>
                </div>
              ) : (
                <div className="whitespace-pre-wrap">
                  {termsContent}
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-slate-100 md:border-white/5 bg-slate-50 md:bg-white/5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setAgreeTerms(true);
                  setShowTermsModal(false);
                }}
                className="px-5 py-2.5 bg-[#189D91] md:bg-warm-sand text-white font-bold text-[10px] uppercase tracking-wider rounded-xl hover:bg-black md:hover:bg-white md:hover:text-deep-espresso transition-all active:scale-[0.98]"
              >
                Accept & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SignupPage;
