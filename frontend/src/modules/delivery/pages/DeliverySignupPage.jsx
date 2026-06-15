import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  FiArrowLeft, FiUser, FiMail, FiLock, FiEye, FiEyeOff, FiPhone,
  FiTruck, FiFileText, FiCreditCard, FiUserCheck, FiBriefcase,
  FiShield, FiActivity, FiUploadCloud, FiCheckCircle, FiLoader, FiX,
} from 'react-icons/fi';
import { useUser } from '../../user/data/UserContext';
import { uploadRegistrationDocument } from '../../../shared/utils/upload';
import api from '../../../shared/utils/api';
import logo from '../../../assets/transparent_logo.png';

const documentTypes = [
  { key: 'rc',          label: 'RC Book',       icon: FiFileText },
  { key: 'dl',          label: 'Driving License',icon: FiCreditCard },
  { key: 'aadhar',      label: 'Aadhar Card',    icon: FiUserCheck },
  { key: 'bankDetails', label: 'Bank Details',   icon: FiBriefcase },
  { key: 'insurance',   label: 'Insurance',      icon: FiShield },
  { key: 'pollution',   label: 'PUC Certificate',icon: FiActivity },
];

const INPUT = 'w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:border-[#001B4E] focus:bg-white focus:outline-none text-sm text-slate-800 font-normal transition-all placeholder:text-gray-400';
const LABEL = 'block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1';

const DeliverySignupPage = () => {
  const navigate = useNavigate();
  const { login } = useUser();

  // ── Login state ──
  const [mode, setMode] = useState('login'); // 'login' | 'signup' | 'success'
  const [dlId, setDlId] = useState('');
  const [dlPwd, setDlPwd] = useState('');
  const [dlShowPwd, setDlShowPwd] = useState(false);
  const [dlLoading, setDlLoading] = useState(false);

  // ── Signup state ──
  const [formData, setFormData] = useState({
    fullName: '', email: '', phone: '',
    password: '', confirmPassword: '',
    vehicleType: 'Bike', vehicleNumber: '',
    referralCode: '',
  });
  const [documents, setDocuments] = useState({ rc: '', dl: '', aadhar: '', bankDetails: '', insurance: '', pollution: '' });
  const [uploadingDocs, setUploadingDocs] = useState({ rc: false, dl: false, aadhar: false, bankDetails: false, insurance: false, pollution: false });
  const [uploadErrors, setUploadErrors] = useState({ rc: false, dl: false, aadhar: false, bankDetails: false, insurance: false, pollution: false });
  const [showPwd, setShowPwd] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [termsContent, setTermsContent] = useState('');
  const [loadingTerms, setLoadingTerms] = useState(false);
  const vehicleSectionRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'phone' && (!/^\d*$/.test(value) || value.length > 10)) return;
    setFormData(p => ({ ...p, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors(p => ({ ...p, [name]: '' }));
    }
  };

  const handleDocUpload = async (e, docType) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingDocs(p => ({ ...p, [docType]: true }));
    setUploadErrors(p => ({ ...p, [docType]: false }));
    try {
      const url = await uploadRegistrationDocument(file);
      setDocuments(p => ({ ...p, [docType]: url }));
      if (fieldErrors.documents) {
        setFieldErrors(p => ({ ...p, documents: '' }));
      }
    } catch {
      setUploadErrors(p => ({ ...p, [docType]: true }));
    } finally {
      setUploadingDocs(p => ({ ...p, [docType]: false }));
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setDlLoading(true);
    try {
      const { data } = await api.post('/auth/delivery/login', { email: dlId, password: dlPwd });
      if (data.success) {
        const { token, user } = data.data || data;
        login({ ...user, token });
        navigate('/delivery/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid credentials');
    } finally {
      setDlLoading(false);
    }
  };

  const handleConfirmPasswordFocus = () => {
    setTimeout(() => {
      vehicleSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);
  };

  const openTermsModal = async () => {
    setShowTermsModal(true);
    if (!termsContent) {
      setLoadingTerms(true);
      try {
        const { data } = await api.get('/terms/delivery');
        if (data.success && data.data) {
          setTermsContent(data.data.content || '');
        }
      } catch (err) {
        console.error('Failed to fetch delivery terms:', err);
      } finally {
        setLoadingTerms(false);
      }
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    const errors = {};

    if (!formData.fullName || formData.fullName.trim().length < 3) {
      errors.fullName = 'Full name must be at least 3 characters';
    }
    if (!formData.email || !/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    if (!formData.phone || !/^[6-9]\d{9}$/.test(formData.phone)) {
      errors.phone = 'Enter a valid 10-digit mobile number starting with 6-9';
    }
    if (!formData.password || formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    if (!formData.vehicleNumber || formData.vehicleNumber.trim().length < 5) {
      errors.vehicleNumber = 'Please enter a valid vehicle number';
    }

    const missingDocs = Object.keys(documents).filter(k => !documents[k]);
    if (missingDocs.length) {
      const labels = missingDocs.map(k => documentTypes.find(d => d.key === k)?.label || k);
      errors.documents = `Missing documents: ${labels.join(', ')}`;
    }
    if (!agreeTerms) {
      errors.agreeTerms = 'You must agree to the Terms & Conditions';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      const firstError = Object.keys(errors)[0];
      if (firstError === 'documents') {
        setError(errors.documents);
      } else if (errors.agreeTerms && Object.keys(errors).length === 1) {
        setError(errors.agreeTerms);
      }
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/auth/delivery/register', {
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        vehicleType: formData.vehicleType,
        vehicleNumber: formData.vehicleNumber,
        documents,
        referralCode: formData.referralCode,
      });
      if (data.success) setMode('success');
    } catch (err) {
      const serverErr = err.response?.data?.error || 'Registration failed. Please try again.';
      if (serverErr.toLowerCase().includes('referral')) {
        setFieldErrors(p => ({ ...p, referralCode: serverErr }));
      } else {
        setError(serverErr);
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Success screen ──
  if (mode === 'success') {
    return (
      <div className="min-h-screen bg-[#F0F4F8] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center space-y-4">
          <div className="w-16 h-16 bg-[#001B4E]/8 rounded-2xl flex items-center justify-center mx-auto">
            <FiCheckCircle className="text-[#001B4E]" size={28} />
          </div>
          <h2 className="text-xl font-bold text-slate-800">Application Submitted</h2>
          <p className="text-sm text-slate-500">Your delivery partner application is under review. We'll notify you once approved (usually within 24–48 hours).</p>
          <button
            onClick={() => navigate('/delivery/login')}
            className="mt-2 w-full py-3 bg-[#001B4E] text-white rounded-xl font-bold text-sm hover:bg-[#001B4E]/90 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F4F8] flex items-start justify-center px-4 py-10">
      <div className="w-full max-w-2xl">

        {/* Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

          {/* Header */}
          <div className="px-8 pt-8 pb-6 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={logo} alt="Riddha" className="h-9 w-auto object-contain" />
              <div>
                <h1 className="text-base font-bold text-slate-800 leading-none">
                  {mode === 'login' ? 'Delivery Partner Login' : 'Delivery Partner Sign Up'}
                </h1>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {mode === 'login' ? 'Sign in to your account' : 'Create your delivery partner account'}
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/delivery')}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-700 font-semibold transition-colors"
            >
              <FiArrowLeft size={13} /> Back
            </button>
          </div>

          {/* Tab switcher */}
          <div className="flex border-b border-gray-100">
            {['login', 'signup'].map(tab => (
              <button
                key={tab}
                onClick={() => { setMode(tab); setError(''); }}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors ${
                  mode === tab
                    ? 'text-[#001B4E] border-b-2 border-[#001B4E] bg-[#001B4E]/3'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {tab === 'login' ? 'Log In' : 'Register'}
              </button>
            ))}
          </div>

          <div className="px-8 py-7">

            {/* Error banner */}
            {error && (
              <div className="mb-5 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600 font-semibold">
                {error}
              </div>
            )}

            {/* ── LOGIN FORM ── */}
            {mode === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={LABEL}>Email / Phone</label>
                    <input
                      type="text"
                      placeholder="email@example.com"
                      value={dlId}
                      onChange={e => setDlId(e.target.value)}
                      className={INPUT}
                      required
                    />
                  </div>
                  <div>
                    <label className={LABEL}>Password</label>
                    <div className="relative">
                      <input
                        type={dlShowPwd ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={dlPwd}
                        onChange={e => setDlPwd(e.target.value)}
                        className={`${INPUT} pr-10`}
                        required
                      />
                      <button type="button" onClick={() => setDlShowPwd(p => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                        {dlShowPwd ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                      </button>
                    </div>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={dlLoading}
                  className="w-full py-3 bg-[#001B4E] text-white rounded-xl font-bold text-sm hover:bg-[#001B4E]/90 transition-colors disabled:opacity-60 mt-2"
                >
                  {dlLoading ? 'Signing in…' : 'Login'}
                </button>
                <p className="text-center text-xs text-slate-400">
                  New delivery partner?{' '}
                  <button type="button" onClick={() => { setMode('signup'); setError(''); }}
                    className="text-[#001B4E] font-bold hover:underline">Register here</button>
                </p>
              </form>
            )}

            {/* ── SIGNUP FORM ── */}
            {mode === 'signup' && (
              <form onSubmit={handleSignup} noValidate className="space-y-6">

                {/* Personal Info */}
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <FiUser size={11} /> Personal Information
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className={LABEL}>Full Name *</label>
                      <input type="text" name="fullName" placeholder="Rahul Sharma" value={formData.fullName} onChange={handleChange} className={INPUT} required />
                      {fieldErrors.fullName && (
                        <p className="text-[10px] text-red-500 font-bold mt-1 uppercase tracking-wider">{fieldErrors.fullName}</p>
                      )}
                    </div>
                    <div>
                      <label className={LABEL}>Email *</label>
                      <input type="email" name="email" placeholder="rahul@example.com" value={formData.email} onChange={handleChange} className={INPUT} required />
                      {fieldErrors.email && (
                        <p className="text-[10px] text-red-500 font-bold mt-1 uppercase tracking-wider">{fieldErrors.email}</p>
                      )}
                    </div>
                    <div>
                      <label className={LABEL}>Phone *</label>
                      <input type="tel" name="phone" placeholder="10-digit mobile" value={formData.phone} onChange={handleChange} className={INPUT} required />
                      {fieldErrors.phone && (
                        <p className="text-[10px] text-red-500 font-bold mt-1 uppercase tracking-wider">{fieldErrors.phone}</p>
                      )}
                    </div>
                    <div>
                      <label className={LABEL}>Password *</label>
                      <div className="relative">
                        <input type={showPwd ? 'text' : 'password'} name="password" placeholder="Min. 8 characters" value={formData.password} onChange={handleChange} className={`${INPUT} pr-10`} required />
                        <button type="button" onClick={() => setShowPwd(p => !p)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                          {showPwd ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                        </button>
                      </div>
                      {fieldErrors.password && (
                        <p className="text-[10px] text-red-500 font-bold mt-1 uppercase tracking-wider">{fieldErrors.password}</p>
                      )}
                    </div>
                    <div className="md:col-span-2">
                      <label className={LABEL}>Confirm Password *</label>
                      <input type={showPwd ? 'text' : 'password'} name="confirmPassword" placeholder="Re-enter password" value={formData.confirmPassword} onChange={handleChange} onFocus={handleConfirmPasswordFocus} className={INPUT} required />
                      {fieldErrors.confirmPassword && (
                        <p className="text-[10px] text-red-500 font-bold mt-1 uppercase tracking-wider">{fieldErrors.confirmPassword}</p>
                      )}
                    </div>
                    <div className="md:col-span-2">
                      <label className={LABEL}>Referral Code (Optional)</label>
                      <input type="text" name="referralCode" placeholder="e.g. RIDDHA123456" value={formData.referralCode || ''} onChange={handleChange} className={INPUT} />
                      {fieldErrors.referralCode && (
                        <p className="text-[10px] text-red-500 font-bold mt-1 uppercase tracking-wider">{fieldErrors.referralCode}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Vehicle Details */}
                <div ref={vehicleSectionRef}>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <FiTruck size={11} /> Vehicle Details
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className={LABEL}>Vehicle Type *</label>
                      <select name="vehicleType" value={formData.vehicleType} onChange={handleChange} className={INPUT}>
                        <option>Bike</option>
                        <option>Van</option>
                        <option>Truck</option>
                      </select>
                    </div>
                    <div>
                      <label className={LABEL}>Vehicle Number *</label>
                      <input type="text" name="vehicleNumber" placeholder="e.g. MP09AB1234" value={formData.vehicleNumber} onChange={handleChange} className={INPUT} required />
                      {fieldErrors.vehicleNumber && (
                        <p className="text-[10px] text-red-500 font-bold mt-1 uppercase tracking-wider">{fieldErrors.vehicleNumber}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Documents */}
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <FiFileText size={11} /> Verification Documents
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
                    {documentTypes.map((doc) => {
                      const Icon = doc.icon;
                      const isUploaded = !!documents[doc.key];
                      const isUploading = uploadingDocs[doc.key];
                      const hasError = uploadErrors[doc.key];
                      return (
                        <label key={doc.key} className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border border-dashed cursor-pointer transition-all text-center h-[76px] ${
                          hasError     ? 'bg-red-50 border-red-300'
                          : isUploaded ? 'bg-[#001B4E]/5 border-[#001B4E]/30'
                          : 'bg-gray-50 border-gray-200 hover:border-[#001B4E]/30 hover:bg-[#001B4E]/3'
                        }`}>
                          <input type="file" className="hidden" onChange={e => handleDocUpload(e, doc.key)} accept="image/*,application/pdf" />
                          {isUploading
                            ? <FiLoader className="text-[#001B4E] animate-spin" size={16} />
                            : isUploaded
                              ? <FiCheckCircle className="text-[#001B4E]" size={16} />
                              : hasError
                                ? <FiUploadCloud className="text-red-500" size={16} />
                                : <Icon className="text-slate-400" size={16} />
                          }
                          <span className={`text-[10px] font-semibold leading-tight ${isUploaded ? 'text-[#001B4E]' : hasError ? 'text-red-500' : 'text-slate-500'}`}>
                            {doc.label}
                          </span>
                          <span className={`text-[9px] font-normal ${hasError ? 'text-red-400' : isUploaded ? 'text-[#001B4E]/60' : 'text-slate-400'}`}>
                            {isUploading ? 'Uploading…' : isUploaded ? '✓ Uploaded' : hasError ? 'Retry' : 'Click to upload'}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Terms + Submit */}
                <div className="pt-1 space-y-4">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input type="checkbox" checked={agreeTerms} onChange={e => {
                      setAgreeTerms(e.target.checked);
                      if (e.target.checked && fieldErrors.agreeTerms) {
                        setFieldErrors(p => ({ ...p, agreeTerms: '' }));
                      }
                    }}
                      className="mt-0.5 accent-[#001B4E] h-3.5 w-3.5 shrink-0" />
                    <span className="text-xs text-slate-500 leading-relaxed">
                      I agree to the{' '}
                      <button
                        type="button"
                        onClick={openTermsModal}
                        className="text-[#001B4E] font-semibold hover:underline bg-transparent border-none p-0 inline focus:outline-none cursor-pointer"
                      >
                        Terms & Conditions
                      </button>{' '}
                      for delivery partners
                    </span>
                  </label>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 bg-[#001B4E] hover:bg-[#001B4E]/90 text-white font-bold text-sm rounded-xl transition-colors disabled:opacity-60"
                  >
                    {loading ? 'Submitting Application…' : 'Create Delivery Account'}
                  </button>
                  <p className="text-center text-xs text-slate-400">
                    Already registered?{' '}
                    <button type="button" onClick={() => { setMode('login'); setError(''); }}
                      className="text-[#001B4E] font-bold hover:underline">Log in here</button>
                  </p>
                </div>

              </form>
            )}

          </div>
        </div>

      </div>

      {/* Terms and Conditions Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <h3 className="text-sm font-bold text-[#001B4E] uppercase tracking-wider flex items-center gap-2">
                <FiFileText size={16} /> Terms & Conditions
              </h3>
              <button
                type="button"
                onClick={() => setShowTermsModal(false)}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <FiX size={18} />
              </button>
            </div>
            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 text-slate-600 text-xs leading-relaxed font-normal whitespace-pre-wrap">
              {loadingTerms ? (
                <div className="flex justify-center items-center py-20">
                  <FiLoader className="text-[#001B4E] animate-spin" size={24} />
                </div>
              ) : termsContent ? (
                termsContent
              ) : (
                <p className="text-center text-slate-400 py-10">Failed to load Terms & Conditions.</p>
              )}
            </div>
            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
              <button
                type="button"
                onClick={() => setShowTermsModal(false)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setAgreeTerms(true);
                  setShowTermsModal(false);
                  if (fieldErrors.agreeTerms) {
                    setFieldErrors(p => ({ ...p, agreeTerms: '' }));
                  }
                }}
                className="px-5 py-2.5 bg-[#001B4E] hover:bg-[#001B4E]/90 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer"
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

export default DeliverySignupPage;
