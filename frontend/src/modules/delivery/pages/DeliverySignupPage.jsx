import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  FiArrowLeft, FiUser, FiMail, FiLock, FiEye, FiEyeOff, FiPhone,
  FiTruck, FiFileText, FiCreditCard, FiUserCheck, FiBriefcase,
  FiShield, FiActivity, FiUploadCloud, FiCheckCircle, FiLoader,
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
  });
  const [documents, setDocuments] = useState({ rc: '', dl: '', aadhar: '', bankDetails: '', insurance: '', pollution: '' });
  const [uploadingDocs, setUploadingDocs] = useState({ rc: false, dl: false, aadhar: false, bankDetails: false, insurance: false, pollution: false });
  const [uploadErrors, setUploadErrors] = useState({ rc: false, dl: false, aadhar: false, bankDetails: false, insurance: false, pollution: false });
  const [showPwd, setShowPwd] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'phone' && (!/^\d*$/.test(value) || value.length > 10)) return;
    setFormData(p => ({ ...p, [name]: value }));
  };

  const handleDocUpload = async (e, docType) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingDocs(p => ({ ...p, [docType]: true }));
    setUploadErrors(p => ({ ...p, [docType]: false }));
    try {
      const url = await uploadRegistrationDocument(file);
      setDocuments(p => ({ ...p, [docType]: url }));
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

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.fullName || !formData.email || !formData.password) return setError('Please fill all required fields');
    if (!formData.phone || !formData.vehicleNumber) return setError('Please fill Phone and Vehicle Number');
    if (formData.password !== formData.confirmPassword) return setError('Passwords do not match');
    if (formData.phone.length !== 10) return setError('Enter a valid 10-digit phone number');

    const missingDocs = Object.keys(documents).filter(k => !documents[k]);
    if (missingDocs.length) {
      const labels = missingDocs.map(k => documentTypes.find(d => d.key === k)?.label || k);
      return setError(`Missing documents: ${labels.join(', ')}`);
    }
    if (!agreeTerms) return setError('Please agree to the Terms & Conditions');

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
      });
      if (data.success) setMode('success');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
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
              <form onSubmit={handleSignup} className="space-y-6">

                {/* Personal Info */}
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <FiUser size={11} /> Personal Information
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className={LABEL}>Full Name *</label>
                      <input type="text" name="fullName" placeholder="Rahul Sharma" value={formData.fullName} onChange={handleChange} className={INPUT} required />
                    </div>
                    <div>
                      <label className={LABEL}>Email *</label>
                      <input type="email" name="email" placeholder="rahul@example.com" value={formData.email} onChange={handleChange} className={INPUT} required />
                    </div>
                    <div>
                      <label className={LABEL}>Phone *</label>
                      <input type="tel" name="phone" placeholder="10-digit mobile" value={formData.phone} onChange={handleChange} className={INPUT} required />
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
                    </div>
                    <div className="md:col-span-2">
                      <label className={LABEL}>Confirm Password *</label>
                      <input type={showPwd ? 'text' : 'password'} name="confirmPassword" placeholder="Re-enter password" value={formData.confirmPassword} onChange={handleChange} className={INPUT} required />
                    </div>
                  </div>
                </div>

                {/* Vehicle Details */}
                <div>
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
                    <input type="checkbox" checked={agreeTerms} onChange={e => setAgreeTerms(e.target.checked)}
                      className="mt-0.5 accent-[#001B4E] h-3.5 w-3.5 shrink-0" />
                    <span className="text-xs text-slate-500 leading-relaxed">
                      I agree to the{' '}
                      <Link to="/delivery/terms" target="_blank" className="text-[#001B4E] font-semibold hover:underline">
                        Terms & Conditions
                      </Link>{' '}
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
    </div>
  );
};

export default DeliverySignupPage;
