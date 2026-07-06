import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { FiUser, FiMail, FiLock, FiEye, FiEyeOff, FiPhone, FiMapPin, FiShoppingBag, FiGift, FiArrowLeft, FiCheckCircle, FiFileText } from 'react-icons/fi';
import api from '../../../shared/utils/api';
import { toast } from 'react-hot-toast';
import logo from '../../../assets/transparent_logo.png';
import warehouseImg from '../../../assets/seller_onboarding_warehouse_1778923798789.png';
import TermsAgreementModal from '../../../shared/components/TermsAgreementModal';

const SellerSignup = () => {
  const [step, setStep] = useState('signup'); // 'signup' or 'otp'
  const [otp, setOtp] = useState('');
  const [registeredPhone, setRegisteredPhone] = useState('');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    shopName: '',
    shopAddress: '',
    gstNumber: '',
    panNumber: '',
    password: '',
    confirmPassword: '',
    referralCode: ''
  });
  const [docs, setDocs] = useState({
    gstDoc: null,
    panDoc: null,
    shopDoc: null
  });
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [termsContent, setTermsContent] = useState('');
  const [loadingTerms, setLoadingTerms] = useState(false);
  const [signatureData, setSignatureData] = useState(null);
  const navigate = useNavigate();

  const handleChange = (e) => {
    let { name, value } = e.target;
    
    // Validate and restrict input
    if (name === 'phone') {
      value = value.replace(/\D/g, '').slice(0, 10);
    } else if (name === 'fullName') {
      value = value.replace(/[^A-Za-z\s]/g, '');
    } else if (name === 'gstNumber' || name === 'panNumber') {
      value = value.toUpperCase().trim();
    }
    
    setFormData({ ...formData, [name]: value });
    // Clear field-specific error as user types
    if (fieldErrors[name]) {
      setFieldErrors({ ...fieldErrors, [name]: '' });
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setDocs({ ...docs, [e.target.name]: file });
    if (fieldErrors[e.target.name]) {
      setFieldErrors({ ...fieldErrors, [e.target.name]: '' });
    }
  };

  const openTermsModal = async () => {
    setShowTermsModal(true);
    if (termsContent) return;
    try {
      setLoadingTerms(true);
      const { data } = await api.get('/terms/seller');
      if (data.success && data.data) {
        setTermsContent(data.data.content || 'No terms content found.');
      }
    } catch (err) {
      console.error('Failed to load seller terms:', err);
      setTermsContent('Failed to load terms and conditions.');
    } finally {
      setLoadingTerms(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (formData.fullName.trim().length < 3) {
      newErrors.fullName = 'Name must be at least 3 characters';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.shopName.trim()) {
      newErrors.shopName = 'Shop name is required';
    } else if (formData.shopName.trim().length < 3) {
      newErrors.shopName = 'Shop name must be at least 3 characters';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (formData.phone.length !== 10) {
      newErrors.phone = 'Phone number must be exactly 10 digits';
    }

    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (!formData.gstNumber.trim()) {
      newErrors.gstNumber = 'GST number is required';
    } else if (!gstRegex.test(formData.gstNumber)) {
      newErrors.gstNumber = 'Please enter a valid 15-character GSTIN';
    }

    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!formData.panNumber.trim()) {
      newErrors.panNumber = 'PAN number is required';
    } else if (!panRegex.test(formData.panNumber)) {
      newErrors.panNumber = 'Please enter a valid 10-character PAN';
    }

    if (!docs.gstDoc) {
      newErrors.gstDoc = 'GST certificate is required';
    }
    if (!docs.panDoc) {
      newErrors.panDoc = 'PAN card document is required';
    }
    if (!docs.shopDoc) {
      newErrors.shopDoc = 'Shop document is required';
    }

    if (!formData.shopAddress.trim()) {
      newErrors.shopAddress = 'Business address is required';
    } else if (formData.shopAddress.trim().length < 10) {
      newErrors.shopAddress = 'Address must be at least 10 characters';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!agreeTerms) {
      newErrors.agreeTerms = 'You must agree to the terms';
    }

    setFieldErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    const signupData = new FormData();
    Object.keys(formData).forEach(key => signupData.append(key, formData[key]));
    Object.keys(docs).forEach(key => signupData.append(key, docs[key]));
    if (signatureData) {
      signupData.append('termsSignature', signatureData.signature);
      signupData.append('termsVersion', signatureData.termsVersion);
    }

    try {
      const response = await api.post('/auth/seller/register', signupData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        toast.success(response.data.message || 'Registration successful! Please verify phone.');
        setRegisteredPhone(formData.phone);
        setStep('otp');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/seller/verify-otp', {
        phone: registeredPhone,
        otp
      });

      if (response.data.success) {
        toast.success(response.data.message || 'Phone verified successfully!');
        navigate('/seller/login-form');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen w-full flex font-['Outfit'] bg-[radial-gradient(circle_at_top_left,rgba(24,157,145,0.06),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(227,102,102,0.08),transparent_28%),linear-gradient(180deg,#f8fafc_0%,#f1f5f9_100%)] items-center justify-center lg:p-8">
      <div className="flex w-full lg:max-w-[1100px] lg:h-[85vh] lg:min-h-[650px] bg-white lg:rounded-3xl lg:shadow-2xl overflow-hidden relative lg:border lg:border-slate-100 flex-col lg:flex-row">
      
      {/* Left Section: Branding & Visual */}
      <motion.div 
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        className="hidden lg:flex w-[35%] bg-[#FDF8F8] flex-col items-center justify-center p-12 relative overflow-hidden border-r border-slate-100"
      >
        <div className="relative z-10 w-full max-w-sm space-y-8">
          <Link to="/" className="inline-block">
            <img src={logo} alt="Logo" className="h-16 lg:h-20 w-auto object-contain" />
          </Link>

          <div className="space-y-6">
            <h1 className="text-4xl lg:text-5xl font-semibold text-slate-900 leading-tight tracking-tighter">
              Join the <br />
              <span className="text-[#E36666] font-serif">Family.</span>
            </h1>
            <p className="text-slate-400 font-medium text-sm leading-relaxed">
              Scale your interior business with India's most trusted partner network.
            </p>
          </div>

          <div className="pt-10 border-t border-slate-200">
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-[#E36666]">
                   <FiCheckCircle size={24} />
                </div>
                <div>
                   <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Trusted By</p>
                   <p className="text-xl font-semibold text-slate-900">5000+ Sellers</p>
                </div>
             </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-[-10%] left-[-10%] w-60 h-60 bg-[#E36666]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] right-[-10%] w-80 h-80 bg-[#E36666]/5 rounded-full blur-3xl" />
      </motion.div>

      {/* Right Section: Form */}
      <div className="flex-1 bg-white flex flex-col items-center justify-start p-0 lg:p-6 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full lg:max-w-[700px] flex flex-col px-6 py-6 lg:py-6"
        >
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-10">
            <img src={logo} alt="Logo" className="h-24 w-auto object-contain" />
          </div>

          <div className="mb-6 flex flex-col lg:flex-row items-center justify-between gap-2 lg:gap-0">
            <h2 className="text-2xl md:text-2xl font-semibold text-slate-900 tracking-tight text-center md:text-left">
              {step === 'signup' ? 'Seller Registration' : 'Verify Phone'}
            </h2>
            <Link to="/seller/login-form" className="text-xs font-semibold uppercase tracking-widest text-[#E36666] hover:underline underline-offset-4">
              Sign In
            </Link>
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

          {step === 'signup' ? (
            <form onSubmit={handleSignup} className="flex-1 flex flex-col space-y-4 md:space-y-3">
              {/* Section 1: Identity */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-4 bg-[#E36666] rounded-full" />
                  <h3 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">Merchant Identity</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-3">
                  <div className="space-y-1 md:space-y-0.5">
                    <label className="text-[10px] md:text-[8px] font-semibold uppercase tracking-widest text-slate-400 ml-1">Full Name</label>
                    <div className="relative group">
                      <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 size-4 md:size-3" />
                      <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        placeholder="Legal name"
                        className={`w-full pl-12 pr-4 py-2.5 md:py-2 md:pl-9 rounded-xl bg-[#FDF8F8] border-2 ${fieldErrors.fullName ? 'border-red-500/50' : 'border-transparent'} focus:border-[#E36666]/20 focus:bg-white focus:outline-none text-sm md:text-[11px] font-medium text-slate-700 transition-all`}
                      />
                    </div>
                    {fieldErrors.fullName && <p className="text-[10px] text-red-500 font-semibold mt-1 ml-1">{fieldErrors.fullName}</p>}
                  </div>
                  <div className="space-y-1 md:space-y-0.5">
                    <label className="text-[10px] md:text-[8px] font-semibold uppercase tracking-widest text-slate-400 ml-1">Email Address</label>
                    <div className="relative group">
                      <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 size-4 md:size-3" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Business email"
                        className={`w-full pl-12 pr-4 py-2.5 md:py-2 md:pl-9 rounded-xl bg-[#FDF8F8] border-2 ${fieldErrors.email ? 'border-red-500/50' : 'border-transparent'} focus:border-[#E36666]/20 focus:bg-white focus:outline-none text-sm md:text-[11px] font-medium text-slate-700 transition-all`}
                      />
                    </div>
                    {fieldErrors.email && <p className="text-[10px] text-red-500 font-semibold mt-1 ml-1">{fieldErrors.email}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-3">
                  <div className="space-y-1 md:space-y-0.5">
                    <label className="text-[10px] md:text-[8px] font-semibold uppercase tracking-widest text-slate-400 ml-1">Shop Name</label>
                    <div className="relative group">
                      <FiShoppingBag className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 size-4 md:size-3" />
                      <input
                        type="text"
                        name="shopName"
                        value={formData.shopName}
                        onChange={handleChange}
                        placeholder="Store name"
                        className={`w-full pl-12 pr-4 py-2.5 md:py-2 md:pl-9 rounded-xl bg-[#FDF8F8] border-2 ${fieldErrors.shopName ? 'border-red-500/50' : 'border-transparent'} focus:border-[#E36666]/20 focus:bg-white focus:outline-none text-sm md:text-[11px] font-medium text-slate-700 transition-all`}
                      />
                    </div>
                    {fieldErrors.shopName && <p className="text-[10px] text-red-500 font-semibold mt-1 ml-1">{fieldErrors.shopName}</p>}
                  </div>
                  <div className="space-y-1 md:space-y-0.5">
                    <label className="text-[10px] md:text-[8px] font-semibold uppercase tracking-widest text-slate-400 ml-1">Phone Number</label>
                    <div className="relative group">
                      <FiPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 size-4 md:size-3" />
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="Direct contact"
                        className={`w-full pl-12 pr-4 py-2.5 md:py-2 md:pl-9 rounded-xl bg-[#FDF8F8] border-2 ${fieldErrors.phone ? 'border-red-500/50' : 'border-transparent'} focus:border-[#E36666]/20 focus:bg-white focus:outline-none text-sm md:text-[11px] font-medium text-slate-700 transition-all`}
                      />
                    </div>
                    {fieldErrors.phone && <p className="text-[10px] text-red-500 font-semibold mt-1 ml-1">{fieldErrors.phone}</p>}
                  </div>
                </div>
              </div>

              {/* Section 2: Business & Compliance */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-4 bg-[#E36666] rounded-full" />
                  <h3 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">Compliance & Documents</h3>
                </div>
                
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-3">
                  <div className="space-y-1 md:space-y-0.5">
                    <label className="text-[10px] md:text-[8px] font-semibold uppercase tracking-widest text-slate-400 ml-1">GST Number</label>
                    <input
                      type="text"
                      name="gstNumber"
                      value={formData.gstNumber}
                      onChange={handleChange}
                      placeholder="GSTIN"
                      className={`w-full px-4 py-2.5 md:py-2 rounded-xl bg-[#FDF8F8] border-2 ${fieldErrors.gstNumber ? 'border-red-500/50' : 'border-transparent'} focus:border-[#E36666]/20 focus:bg-white focus:outline-none text-sm md:text-[11px] font-medium text-slate-700 transition-all`}
                    />
                    {fieldErrors.gstNumber && <p className="text-[10px] text-red-500 font-semibold mt-1 ml-1">{fieldErrors.gstNumber}</p>}
                  </div>
                  <div className="space-y-1 md:space-y-0.5">
                    <label className="text-[10px] md:text-[8px] font-semibold uppercase tracking-widest text-slate-400 ml-1">PAN Number</label>
                    <input
                      type="text"
                      name="panNumber"
                      value={formData.panNumber}
                      onChange={handleChange}
                      placeholder="PAN"
                      className={`w-full px-4 py-2.5 md:py-2 rounded-xl bg-[#FDF8F8] border-2 ${fieldErrors.panNumber ? 'border-red-500/50' : 'border-transparent'} focus:border-[#E36666]/20 focus:bg-white focus:outline-none text-sm md:text-[11px] font-medium text-slate-700 transition-all`}
                    />
                    {fieldErrors.panNumber && <p className="text-[10px] text-red-500 font-semibold mt-1 ml-1">{fieldErrors.panNumber}</p>}
                  </div>
                </div>

                {/* File Uploads */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-3">
                  <div className="space-y-2">
                    <label className="text-[9px] font-semibold uppercase tracking-widest text-slate-400 ml-1">GST Certificate</label>
                    <label className={`relative flex flex-col items-center justify-center p-4 border-2 border-dashed ${fieldErrors.gstDoc ? 'border-red-500/50' : 'border-slate-100'} rounded-2xl bg-[#FDF8F8] hover:bg-white hover:border-[#E36666]/20 transition-all cursor-pointer group`}>
                      <FiFileText className={`size-6 ${docs.gstDoc ? 'text-emerald-500' : 'text-slate-300'} mb-1`} />
                      <span className="text-[10px] font-semibold text-slate-400 text-center truncate w-full px-2">
                        {docs.gstDoc ? docs.gstDoc.name : 'Upload PDF/JPG'}
                      </span>
                      <input type="file" name="gstDoc" onChange={handleFileChange} className="sr-only" accept="image/*,application/pdf,.pdf,.jpg,.jpeg,.png" />
                    </label>
                    {fieldErrors.gstDoc && <p className="text-[10px] text-red-500 font-semibold mt-0.5 text-center">{fieldErrors.gstDoc}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-semibold uppercase tracking-widest text-slate-400 ml-1">PAN Card Doc</label>
                    <label className={`relative flex flex-col items-center justify-center p-4 border-2 border-dashed ${fieldErrors.panDoc ? 'border-red-500/50' : 'border-slate-100'} rounded-2xl bg-[#FDF8F8] hover:bg-white hover:border-[#E36666]/20 transition-all cursor-pointer group`}>
                      <FiFileText className={`size-6 ${docs.panDoc ? 'text-emerald-500' : 'text-slate-300'} mb-1`} />
                      <span className="text-[10px] font-semibold text-slate-400 text-center truncate w-full px-2">
                        {docs.panDoc ? docs.panDoc.name : 'Upload PDF/JPG'}
                      </span>
                      <input type="file" name="panDoc" onChange={handleFileChange} className="sr-only" accept="image/*,application/pdf,.pdf,.jpg,.jpeg,.png" />
                    </label>
                    {fieldErrors.panDoc && <p className="text-[10px] text-red-500 font-semibold mt-0.5 text-center">{fieldErrors.panDoc}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-semibold uppercase tracking-widest text-slate-400 ml-1">Shop Establishment</label>
                    <label className={`relative flex flex-col items-center justify-center p-4 border-2 border-dashed ${fieldErrors.shopDoc ? 'border-red-500/50' : 'border-slate-100'} rounded-2xl bg-[#FDF8F8] hover:bg-white hover:border-[#E36666]/20 transition-all cursor-pointer group`}>
                      <FiFileText className={`size-6 ${docs.shopDoc ? 'text-emerald-500' : 'text-slate-300'} mb-1`} />
                      <span className="text-[10px] font-semibold text-slate-400 text-center truncate w-full px-2">
                        {docs.shopDoc ? docs.shopDoc.name : 'Upload PDF/JPG'}
                      </span>
                      <input type="file" name="shopDoc" onChange={handleFileChange} className="sr-only" accept="image/*,application/pdf,.pdf,.jpg,.jpeg,.png" />
                    </label>
                    {fieldErrors.shopDoc && <p className="text-[10px] text-red-500 font-semibold mt-0.5 text-center">{fieldErrors.shopDoc}</p>}
                  </div>
                </div>

                <div className="space-y-1 md:space-y-0.5">
                  <label className="text-[10px] md:text-[8px] font-semibold uppercase tracking-widest text-slate-400 ml-1">Business Address</label>
                  <div className="relative group">
                    <FiMapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 size-4 md:size-3" />
                    <input
                      name="shopAddress"
                      value={formData.shopAddress}
                      onChange={handleChange}
                      placeholder="Full operating address"
                      className={`w-full pl-12 pr-4 py-2.5 md:py-2 md:pl-9 rounded-xl bg-[#FDF8F8] border-2 ${fieldErrors.shopAddress ? 'border-red-500/50' : 'border-transparent'} focus:border-[#E36666]/20 focus:bg-white focus:outline-none text-sm md:text-[11px] font-medium text-slate-700 transition-all`}
                    />
                  </div>
                  {fieldErrors.shopAddress && <p className="text-[10px] text-red-500 font-semibold mt-1 ml-1">{fieldErrors.shopAddress}</p>}
                </div>
              </div>

              {/* Section 3: Security */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-4 bg-[#E36666] rounded-full" />
                  <h3 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">Security & Credentials</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-3">
                  <div className="space-y-1 md:space-y-0.5">
                    <label className="text-[10px] md:text-[8px] font-semibold uppercase tracking-widest text-slate-400 ml-1">Password</label>
                    <div className="relative group">
                      <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 size-4 md:size-3" />
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="••••••••"
                        className={`w-full pl-12 pr-10 py-2.5 md:py-2 md:pl-9 rounded-xl bg-[#FDF8F8] border-2 ${fieldErrors.password ? 'border-red-500/50' : 'border-transparent'} focus:border-[#E36666]/20 focus:bg-white focus:outline-none text-sm md:text-[11px] font-medium text-slate-700 transition-all`}
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300">
                        {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                      </button>
                    </div>
                    {fieldErrors.password && <p className="text-[10px] text-red-500 font-semibold mt-1 ml-1">{fieldErrors.password}</p>}
                  </div>
                  <div className="space-y-1 md:space-y-0.5">
                    <label className="text-[10px] md:text-[8px] font-semibold uppercase tracking-widest text-slate-400 ml-1">Confirm Password</label>
                    <div className="relative group">
                      <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 size-4 md:size-3" />
                      <input
                        type={showPassword ? "text" : "password"}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="••••••••"
                        className={`w-full pl-12 pr-4 py-2.5 md:py-2 md:pl-9 rounded-xl bg-[#FDF8F8] border-2 ${fieldErrors.confirmPassword ? 'border-red-500/50' : 'border-transparent'} focus:border-[#E36666]/20 focus:bg-white focus:outline-none text-sm md:text-[11px] font-medium text-slate-700 transition-all`}
                      />
                    </div>
                    {fieldErrors.confirmPassword && <p className="text-[10px] text-red-500 font-semibold mt-1 ml-1">{fieldErrors.confirmPassword}</p>}
                  </div>
                </div>

                <div className="flex flex-col md:flex-row items-start md:items-center gap-4 pt-2">
                  <div className="w-full md:w-1/2 space-y-1 md:space-y-0.5">
                    <label className="text-[10px] md:text-[8px] font-semibold uppercase tracking-widest text-slate-400 ml-1">Referral (Optional)</label>
                    <div className="relative group">
                      <FiGift className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 size-4 md:size-3" />
                      <input
                        type="text"
                        name="referralCode"
                        value={formData.referralCode}
                        onChange={handleChange}
                        placeholder="RIDDHA-123"
                        className="w-full pl-12 pr-4 py-2.5 md:py-2 md:pl-9 rounded-xl bg-[#FDF8F8] border-2 border-transparent focus:border-[#E36666]/20 focus:bg-white focus:outline-none text-sm md:text-[11px] font-medium text-slate-700 transition-all"
                      />
                    </div>
                  </div>
                  <div className="w-full md:w-1/2 flex flex-col gap-1.5 mt-4 md:mt-2">
                    <div className="flex items-center gap-3">
                      <input 
                        type="checkbox" 
                        checked={agreeTerms} 
                        readOnly
                        className="w-5 h-5 md:w-4 md:h-4 accent-[#E36666] rounded cursor-default"
                      />
                      <label className="text-[11px] md:text-[9px] font-semibold text-slate-400 uppercase tracking-widest leading-none cursor-pointer">
                        I agree to the <button type="button" onClick={() => setShowTermsModal(true)} className="text-slate-900 underline decoration-[#E36666]/30 hover:text-[#E36666] transition-colors font-semibold uppercase tracking-widest">Terms & Conditions</button>
                      </label>
                    </div>
                    {fieldErrors.agreeTerms && <p className="text-[10px] text-red-500 font-semibold ml-1">{fieldErrors.agreeTerms}</p>}
                  </div>
                </div>
              </div>

              <motion.button
                whileTap={{ scale: 0.99 }}
                type="submit"
                disabled={loading}
                className="w-full py-5 md:py-3.5 bg-[#E36666] text-white rounded-2xl md:rounded-xl font-semibold text-xs md:text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-[#E36666]/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
              >
                {loading ? 'Creating...' : (
                  <>Create Account <FiArrowLeft className="rotate-180 size-4 md:size-2.5" /></>
                )}
              </motion.button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-8">
               <div className="text-center space-y-2">
                  <p className="text-slate-400 font-medium">We've sent a verification code to</p>
                  <p className="text-slate-900 font-bold">+91 {registeredPhone}</p>
               </div>
               
               <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1 flex justify-center">Enter 6-Digit OTP</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    className="w-full text-center text-4xl font-bold tracking-[0.5em] py-6 rounded-2xl bg-[#FDF8F8] border-2 border-transparent focus:border-[#E36666]/20 focus:bg-white focus:outline-none text-slate-700 transition-all"
                    required
                  />
               </div>

               <motion.button
                 whileHover={{ scale: 1.01, y: -2 }}
                 whileTap={{ scale: 0.99 }}
                 type="submit"
                 disabled={loading}
                 className="w-full py-5 bg-[#E36666] text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-[#E36666]/20 transition-all disabled:opacity-50"
               >
                 {loading ? 'Verifying...' : 'Verify Phone'}
               </motion.button>

               <p className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Didn't get the code? <button type="button" className="text-[#E36666] font-bold hover:underline">Resend OTP</button>
               </p>
            </form>
          )}

          <div className="mt-5 text-center">
             <Link to="/seller/login" className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-all font-bold text-[10px] uppercase tracking-widest">
                <FiArrowLeft /> Back to Login
             </Link>
          </div>
        </motion.div>
      </div>
      </div>

      <TermsAgreementModal 
        isOpen={showTermsModal} 
        onClose={() => setShowTermsModal(false)}
        roleType="seller"
        initialSignature={signatureData?.signature}
        onAgree={(data) => {
          setSignatureData(data);
          setAgreeTerms(true);
          setShowTermsModal(false);
          setError('');
          if (fieldErrors.agreeTerms) {
            setFieldErrors({ ...fieldErrors, agreeTerms: '' });
          }
        }}
      />
    </div>
  );
};

export default SellerSignup;
